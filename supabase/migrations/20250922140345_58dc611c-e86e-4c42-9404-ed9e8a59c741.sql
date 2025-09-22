-- ToolSS Backend - Arquitetura completa multi-tenant por fazenda
-- Baseado nas especificações fornecidas

-- ==========================================
-- 1. ENUMS E TIPOS
-- ==========================================

-- Papéis do usuário na fazenda
CREATE TYPE public.farm_role AS ENUM ('owner', 'editor', 'viewer');

-- Classes de segmentação
CREATE TYPE public.segmentation_class AS ENUM ('donor', 'inter', 'recipient');

-- Tipos de movimento de sêmen
CREATE TYPE public.movement_type AS ENUM ('entrada', 'saida');

-- Tipos de sêmen
CREATE TYPE public.semen_type AS ENUM ('convencional', 'sexado');

-- Métodos de predição
CREATE TYPE public.prediction_method AS ENUM ('genomic', 'pedigree', 'blup');

-- ==========================================
-- 2. PERFIS DOS TÉCNICOS
-- ==========================================

-- Tabela de perfis (espelho do auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    default_farm_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: cada usuário vê/edita apenas o próprio perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ==========================================
-- 3. FAZENDAS (NÚCLEO MULTI-TENANT)
-- ==========================================

-- Tabela principal de fazendas
CREATE TABLE public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vínculo usuário ↔ fazenda com papéis
CREATE TABLE public.user_farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    role public.farm_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, farm_id)
);

-- Garantir um único owner por fazenda
CREATE UNIQUE INDEX idx_farm_unique_owner ON public.user_farms(farm_id) WHERE role = 'owner';

-- RLS para fazendas
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view farms they are members of"
    ON public.farms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_farms 
            WHERE farm_id = farms.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Only owners can update farms"
    ON public.farms FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_farms 
            WHERE farm_id = farms.id AND user_id = auth.uid() AND role = 'owner'
        )
    );

-- RLS para user_farms
ALTER TABLE public.user_farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their farm memberships"
    ON public.user_farms FOR SELECT
    USING (user_id = auth.uid());

-- ==========================================
-- 4. CATÁLOGO GLOBAL DE TOUROS
-- ==========================================

-- Tabela de touros (catálogo global)
CREATE TABLE public.bulls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- NAAB
    name TEXT NOT NULL,
    registration TEXT,
    birth_date DATE,
    sire_naab TEXT,
    mgs_naab TEXT, -- Maternal Grandsire
    mmgs_naab TEXT, -- Maternal Great Grandsire
    ptas JSONB DEFAULT '{}', -- Todos os PTAs/índices
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_bulls_code ON public.bulls(code);
CREATE INDEX idx_bulls_name ON public.bulls USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_bulls_ptas ON public.bulls USING gin(ptas);

-- RLS: leitura para todos autenticados, escrita apenas admin
ALTER TABLE public.bulls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bulls"
    ON public.bulls FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can insert bulls"
    ON public.bulls FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can update bulls"
    ON public.bulls FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Only admins can delete bulls"
    ON public.bulls FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- ==========================================
-- 5. BANCO DE FÊMEAS (POR FAZENDA)
-- ==========================================

-- Tabela principal de fêmeas
CREATE TABLE public.females (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    identifier TEXT,
    cdcb_id TEXT,
    sire_naab TEXT,
    mgs_naab TEXT, -- Maternal Grandsire
    mmgs_naab TEXT, -- Maternal Great Grandsire
    birth_date DATE,
    ptas JSONB DEFAULT '{}', -- Todos os PTAs/índices
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Segmentações das fêmeas
CREATE TABLE public.female_segmentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    female_id UUID NOT NULL REFERENCES public.females(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    class public.segmentation_class NOT NULL,
    score NUMERIC,
    parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(female_id, farm_id)
);

-- Predições genéticas
CREATE TABLE public.genetic_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    female_id UUID NOT NULL REFERENCES public.females(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    method public.prediction_method NOT NULL,
    predicted_value NUMERIC NOT NULL,
    confidence NUMERIC,
    parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Acasalamentos/sugestões
CREATE TABLE public.matings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    female_id UUID NOT NULL REFERENCES public.females(id) ON DELETE CASCADE,
    bull_id UUID NOT NULL REFERENCES public.bulls(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3),
    method TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance das fêmeas
CREATE INDEX idx_females_farm ON public.females(farm_id);
CREATE INDEX idx_females_naabs ON public.females(sire_naab, mgs_naab, mmgs_naab);
CREATE INDEX idx_female_segmentations_farm ON public.female_segmentations(farm_id);
CREATE INDEX idx_genetic_predictions_farm ON public.genetic_predictions(farm_id);
CREATE INDEX idx_matings_farm ON public.matings(farm_id);

-- RLS para fêmeas e dados relacionados
ALTER TABLE public.females ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.female_segmentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genetic_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matings ENABLE ROW LEVEL SECURITY;

-- Função helper para verificar se usuário é membro da fazenda
CREATE OR REPLACE FUNCTION public.is_farm_member(farm_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_farms 
        WHERE farm_id = farm_uuid AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função helper para verificar se usuário pode editar na fazenda
CREATE OR REPLACE FUNCTION public.can_edit_farm(farm_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_farms 
        WHERE farm_id = farm_uuid AND user_id = auth.uid() 
        AND role IN ('owner', 'editor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função helper para verificar se usuário é owner da fazenda
CREATE OR REPLACE FUNCTION public.is_farm_owner(farm_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_farms 
        WHERE farm_id = farm_uuid AND user_id = auth.uid() AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Políticas RLS para females
CREATE POLICY "Farm members can view females"
    ON public.females FOR SELECT
    USING (public.is_farm_member(farm_id));

CREATE POLICY "Farm editors can insert females"
    ON public.females FOR INSERT
    WITH CHECK (public.can_edit_farm(farm_id));

CREATE POLICY "Farm editors can update females"
    ON public.females FOR UPDATE
    USING (public.can_edit_farm(farm_id));

CREATE POLICY "Farm owners can delete females"
    ON public.females FOR DELETE
    USING (public.is_farm_owner(farm_id));

-- Políticas similares para tabelas relacionadas
CREATE POLICY "Farm members can view segmentations"
    ON public.female_segmentations FOR SELECT
    USING (public.is_farm_member(farm_id));

CREATE POLICY "Farm editors can manage segmentations"
    ON public.female_segmentations FOR ALL
    USING (public.can_edit_farm(farm_id));

CREATE POLICY "Farm members can view predictions"
    ON public.genetic_predictions FOR SELECT
    USING (public.is_farm_member(farm_id));

CREATE POLICY "Farm editors can manage predictions"
    ON public.genetic_predictions FOR ALL
    USING (public.can_edit_farm(farm_id));

CREATE POLICY "Farm members can view matings"
    ON public.matings FOR SELECT
    USING (public.is_farm_member(farm_id));

CREATE POLICY "Farm editors can manage matings"
    ON public.matings FOR ALL
    USING (public.can_edit_farm(farm_id));

-- ==========================================
-- 6. SELEÇÃO DE TOUROS POR FAZENDA
-- ==========================================

CREATE TABLE public.farm_bull_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    bull_id UUID NOT NULL REFERENCES public.bulls(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    added_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(farm_id, bull_id)
);

CREATE INDEX idx_farm_bull_picks_farm ON public.farm_bull_picks(farm_id);

ALTER TABLE public.farm_bull_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farm members can view bull picks"
    ON public.farm_bull_picks FOR SELECT
    USING (public.is_farm_member(farm_id));

CREATE POLICY "Farm editors can manage bull picks"
    ON public.farm_bull_picks FOR ALL
    USING (public.can_edit_farm(farm_id));

-- ==========================================
-- 7. BOTIJÃO VIRTUAL (ESTOQUE DE SÊMEN)
-- ==========================================

-- Tanques/botijões por fazenda
CREATE TABLE public.farm_tanks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movimentações de sêmen
CREATE TABLE public.semen_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    bull_id UUID NOT NULL REFERENCES public.bulls(id) ON DELETE CASCADE,
    tank_id UUID REFERENCES public.farm_tanks(id),
    movement_type public.movement_type NOT NULL,
    semen_type public.semen_type NOT NULL DEFAULT 'convencional',
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    batch_number TEXT,
    price_per_dose NUMERIC(10,2),
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_semen_movements_farm ON public.semen_movements(farm_id);
CREATE INDEX idx_semen_movements_bull ON public.semen_movements(bull_id);

ALTER TABLE public.farm_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semen_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farm members can view tanks"
    ON public.farm_tanks FOR SELECT
    USING (public.is_farm_member(farm_id));

CREATE POLICY "Farm editors can manage tanks"
    ON public.farm_tanks FOR ALL
    USING (public.can_edit_farm(farm_id));

CREATE POLICY "Farm members can view semen movements"
    ON public.semen_movements FOR SELECT
    USING (public.is_farm_member(farm_id));

CREATE POLICY "Farm editors can manage semen movements"
    ON public.semen_movements FOR ALL
    USING (public.can_edit_farm(farm_id));

-- ==========================================
-- 8. ÍNDICES ECONÔMICOS E ESTRATÉGIA
-- ==========================================

-- Índices econômicos (presets)
CREATE TABLE public.economic_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE, -- 'nm_dollar', 'dwp_dollar', 'tpi', 'custom'
    name TEXT NOT NULL,
    description TEXT,
    default_weights JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de índice por fazenda
CREATE TABLE public.farm_index_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    active_index_key TEXT NOT NULL,
    custom_weights JSONB DEFAULT '{}',
    quantiles JSONB DEFAULT '{}', -- P25, P75 para segmentação
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(farm_id)
);

CREATE INDEX idx_farm_index_settings_farm ON public.farm_index_settings(farm_id);

ALTER TABLE public.economic_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_index_settings ENABLE ROW LEVEL SECURITY;

-- Índices econômicos são públicos para leitura
CREATE POLICY "Authenticated users can view economic indices"
    ON public.economic_indices FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can manage economic indices"
    ON public.economic_indices FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Farm members can view index settings"
    ON public.farm_index_settings FOR SELECT
    USING (public.is_farm_member(farm_id));

CREATE POLICY "Farm editors can manage index settings"
    ON public.farm_index_settings FOR ALL
    USING (public.can_edit_farm(farm_id));

-- ==========================================
-- 9. TRIGGERS PARA UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers em todas as tabelas relevantes
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farms_updated_at
    BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bulls_updated_at
    BEFORE UPDATE ON public.bulls
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_females_updated_at
    BEFORE UPDATE ON public.females
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farm_bull_picks_updated_at
    BEFORE UPDATE ON public.farm_bull_picks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farm_tanks_updated_at
    BEFORE UPDATE ON public.farm_tanks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farm_index_settings_updated_at
    BEFORE UPDATE ON public.farm_index_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 10. INSERIR DADOS INICIAIS
-- ==========================================

-- Índices econômicos padrão
INSERT INTO public.economic_indices (key, name, description, default_weights) VALUES
('nm_dollar', 'NM$', 'Net Merit Dollar', '{}'),
('dwp_dollar', 'DWP$', 'Dairy Wellness Profit', '{}'),
('tpi', 'TPI', 'Total Performance Index', '{}'),
('hhp_dollar', 'HHP$®', 'Holstein Health Profit', '{}'),
('custom', 'Personalizado', 'Índice personalizado pela fazenda', '{}');

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();