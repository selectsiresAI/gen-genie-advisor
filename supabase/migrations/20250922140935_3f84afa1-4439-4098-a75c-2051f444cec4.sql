-- ==========================================
-- 12. RPCs ESSENCIAIS PARA OPERAÇÕES CRÍTICAS (CORRIGIDO)
-- ==========================================

-- Função para normalizar NAAB (remover espaços, hífens, padronizar maiúsculas)
CREATE OR REPLACE FUNCTION public.normalize_naab(input_naab TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_naab IS NULL OR input_naab = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remover espaços, hífens e converter para uppercase
    RETURN UPPER(REPLACE(REPLACE(TRIM(input_naab), ' ', ''), '-', ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- RPC: Buscar touro por NAAB (individual)
CREATE OR REPLACE FUNCTION public.get_bull_by_naab(naab TEXT)
RETURNS TABLE (
    bull_id UUID,
    code TEXT,
    name TEXT,
    ptas JSONB,
    found BOOLEAN,
    suggestions TEXT[]
) AS $$
DECLARE
    normalized_naab TEXT;
    bull_record RECORD;
    suggestion_array TEXT[];
BEGIN
    -- Normalizar o NAAB de entrada
    normalized_naab := public.normalize_naab(naab);
    
    IF normalized_naab IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::JSONB, FALSE, ARRAY[]::TEXT[];
        RETURN;
    END IF;
    
    -- Buscar touro exato
    SELECT INTO bull_record b.id, b.code, b.name, b.ptas
    FROM public.bulls b
    WHERE public.normalize_naab(b.code) = normalized_naab;
    
    IF FOUND THEN
        -- Touro encontrado
        RETURN QUERY SELECT bull_record.id, bull_record.code, bull_record.name, bull_record.ptas, TRUE, ARRAY[]::TEXT[];
    ELSE
        -- Touro não encontrado, buscar sugestões similares (corrigido)
        SELECT ARRAY_AGG(code) INTO suggestion_array
        FROM (
            SELECT b.code
            FROM public.bulls b
            WHERE levenshtein(public.normalize_naab(b.code), normalized_naab) <= 3
            ORDER BY levenshtein(public.normalize_naab(b.code), normalized_naab)
            LIMIT 5
        ) suggestions;
        
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::JSONB, FALSE, COALESCE(suggestion_array, ARRAY[]::TEXT[]);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Buscar touros por lista de NAABs (lote)
CREATE OR REPLACE FUNCTION public.get_bulls_by_naab_list(naabs TEXT[])
RETURNS TABLE (
    input_naab TEXT,
    normalized_naab TEXT,
    bull_id UUID,
    name TEXT,
    ptas JSONB,
    status TEXT,
    suggestions TEXT[]
) AS $$
DECLARE
    naab_input TEXT;
    normalized TEXT;
    bull_record RECORD;
    suggestion_array TEXT[];
BEGIN
    -- Processar cada NAAB da lista
    FOREACH naab_input IN ARRAY naabs
    LOOP
        normalized := public.normalize_naab(naab_input);
        
        IF normalized IS NULL THEN
            RETURN QUERY SELECT naab_input, normalized, NULL::UUID, NULL::TEXT, NULL::JSONB, 'invalid'::TEXT, ARRAY[]::TEXT[];
            CONTINUE;
        END IF;
        
        -- Buscar touro exato
        SELECT INTO bull_record b.id, b.name, b.ptas
        FROM public.bulls b
        WHERE public.normalize_naab(b.code) = normalized;
        
        IF FOUND THEN
            RETURN QUERY SELECT naab_input, normalized, bull_record.id, bull_record.name, bull_record.ptas, 'ok'::TEXT, ARRAY[]::TEXT[];
        ELSE
            -- Buscar sugestões (corrigido)
            SELECT ARRAY_AGG(code) INTO suggestion_array
            FROM (
                SELECT b.code
                FROM public.bulls b
                WHERE levenshtein(public.normalize_naab(b.code), normalized) <= 3
                ORDER BY levenshtein(public.normalize_naab(b.code), normalized)
                LIMIT 5
            ) suggestions;
            
            RETURN QUERY SELECT naab_input, normalized, NULL::UUID, NULL::TEXT, NULL::JSONB, 'not_found'::TEXT, COALESCE(suggestion_array, ARRAY[]::TEXT[]);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Busca de touros com autocomplete
CREATE OR REPLACE FUNCTION public.search_bulls(q TEXT, limit_count INT DEFAULT 20)
RETURNS TABLE (
    bull_id UUID,
    code TEXT,
    name TEXT,
    ptas JSONB
) AS $$
BEGIN
    IF q IS NULL OR LENGTH(TRIM(q)) < 1 THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::JSONB WHERE FALSE;
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT b.id, b.code, b.name, b.ptas
    FROM public.bulls b
    WHERE 
        public.normalize_naab(b.code) ILIKE public.normalize_naab(q) || '%'
        OR UPPER(b.name) ILIKE '%' || UPPER(TRIM(q)) || '%'
    ORDER BY 
        CASE WHEN public.normalize_naab(b.code) = public.normalize_naab(q) THEN 1
             WHEN public.normalize_naab(b.code) ILIKE public.normalize_naab(q) || '%' THEN 2
             ELSE 3
        END,
        b.name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Validar NAAB antes de ações
CREATE OR REPLACE FUNCTION public.validate_naab(naab TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    bull_id UUID,
    code TEXT,
    message TEXT
) AS $$
DECLARE
    normalized_naab TEXT;
    bull_record RECORD;
    suggestions TEXT[];
BEGIN
    normalized_naab := public.normalize_naab(naab);
    
    IF normalized_naab IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'NAAB inválido ou vazio'::TEXT;
        RETURN;
    END IF;
    
    -- Buscar touro
    SELECT INTO bull_record b.id, b.code
    FROM public.bulls b
    WHERE public.normalize_naab(b.code) = normalized_naab;
    
    IF FOUND THEN
        RETURN QUERY SELECT TRUE, bull_record.id, bull_record.code, 'NAAB válido'::TEXT;
    ELSE
        -- Buscar sugestões (corrigido)
        SELECT ARRAY_AGG(code) INTO suggestions
        FROM (
            SELECT b.code
            FROM public.bulls b
            WHERE levenshtein(public.normalize_naab(b.code), normalized_naab) <= 3
            ORDER BY levenshtein(public.normalize_naab(b.code), normalized_naab)
            LIMIT 3
        ) suggestion_query;
        
        IF suggestions IS NOT NULL AND array_length(suggestions, 1) > 0 THEN
            RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 
                ('NAAB não encontrado. Sugestões: ' || array_to_string(suggestions, ', '))::TEXT;
        ELSE
            RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'NAAB não encontrado no catálogo'::TEXT;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Criar fazenda básica (cria fazenda e define criador como owner)
CREATE OR REPLACE FUNCTION public.create_farm_basic(
    farm_name TEXT,
    owner_name TEXT,
    farm_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
    farm_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    new_farm_id UUID;
    current_user_id UUID;
BEGIN
    -- Verificar se usuário está autenticado
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Usuário não autenticado'::TEXT;
        RETURN;
    END IF;
    
    -- Validar parâmetros
    IF farm_name IS NULL OR TRIM(farm_name) = '' THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Nome da fazenda é obrigatório'::TEXT;
        RETURN;
    END IF;
    
    IF owner_name IS NULL OR TRIM(owner_name) = '' THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Nome do proprietário é obrigatório'::TEXT;
        RETURN;
    END IF;
    
    -- Inserir fazenda
    INSERT INTO public.farms (name, owner_name, metadata, created_by)
    VALUES (TRIM(farm_name), TRIM(owner_name), COALESCE(farm_metadata, '{}'), current_user_id)
    RETURNING id INTO new_farm_id;
    
    -- Inserir vínculo como owner
    INSERT INTO public.user_farms (user_id, farm_id, role)
    VALUES (current_user_id, new_farm_id, 'owner');
    
    -- Atualizar fazenda padrão se o usuário não tiver uma
    UPDATE public.profiles 
    SET default_farm_id = new_farm_id
    WHERE id = current_user_id AND default_farm_id IS NULL;
    
    RETURN QUERY SELECT new_farm_id, TRUE, 'Fazenda criada com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Apagar fazenda (apenas owner)
CREATE OR REPLACE FUNCTION public.delete_farm(farm_uuid UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Verificar autenticação
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Usuário não autenticado'::TEXT;
        RETURN;
    END IF;
    
    -- Verificar se é owner da fazenda
    IF NOT public.is_farm_owner(farm_uuid) THEN
        RETURN QUERY SELECT FALSE, 'Apenas o proprietário pode apagar a fazenda'::TEXT;
        RETURN;
    END IF;
    
    -- Limpar fazenda padrão dos usuários que a têm definida
    UPDATE public.profiles 
    SET default_farm_id = NULL
    WHERE default_farm_id = farm_uuid;
    
    -- Apagar fazenda (cascade vai apagar tudo relacionado)
    DELETE FROM public.farms WHERE id = farm_uuid;
    
    RETURN QUERY SELECT TRUE, 'Fazenda apagada com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Listar fazendas do usuário com papel
CREATE OR REPLACE FUNCTION public.my_farms()
RETURNS TABLE (
    farm_id UUID,
    farm_name TEXT,
    owner_name TEXT,
    my_role TEXT,
    is_default BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    total_females INT,
    selected_bulls INT
) AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Verificar autenticação
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.owner_name,
        uf.role::TEXT,
        (p.default_farm_id = f.id) AS is_default,
        f.created_at,
        COALESCE(female_count.total, 0)::INT AS total_females,
        COALESCE(bull_count.total, 0)::INT AS selected_bulls
    FROM public.farms f
    JOIN public.user_farms uf ON f.id = uf.farm_id
    LEFT JOIN public.profiles p ON p.id = current_user_id
    LEFT JOIN (
        SELECT farm_id, COUNT(*) as total
        FROM public.females
        GROUP BY farm_id
    ) female_count ON f.id = female_count.farm_id
    LEFT JOIN (
        SELECT farm_id, COUNT(*) as total
        FROM public.farm_bull_picks
        WHERE is_active = TRUE
        GROUP BY farm_id
    ) bull_count ON f.id = bull_count.farm_id
    WHERE uf.user_id = current_user_id
    ORDER BY 
        (p.default_farm_id = f.id) DESC,
        uf.role = 'owner' DESC,
        f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Definir fazenda padrão do técnico
CREATE OR REPLACE FUNCTION public.set_default_farm(farm_uuid UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Verificar autenticação
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Usuário não autenticado'::TEXT;
        RETURN;
    END IF;
    
    -- Verificar se é membro da fazenda
    IF NOT public.is_farm_member(farm_uuid) THEN
        RETURN QUERY SELECT FALSE, 'Usuário não é membro desta fazenda'::TEXT;
        RETURN;
    END IF;
    
    -- Atualizar fazenda padrão
    UPDATE public.profiles 
    SET default_farm_id = farm_uuid
    WHERE id = current_user_id;
    
    RETURN QUERY SELECT TRUE, 'Fazenda padrão definida com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Adicionar touro à seleção da fazenda
CREATE OR REPLACE FUNCTION public.add_bull_to_farm(
    farm_uuid UUID,
    bull_uuid UUID,
    notes_text TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Verificar autenticação
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Usuário não autenticado'::TEXT;
        RETURN;
    END IF;
    
    -- Verificar permissão de edição
    IF NOT public.can_edit_farm(farm_uuid) THEN
        RETURN QUERY SELECT FALSE, 'Sem permissão para editar esta fazenda'::TEXT;
        RETURN;
    END IF;
    
    -- Inserir ou atualizar seleção
    INSERT INTO public.farm_bull_picks (farm_id, bull_id, is_active, notes, added_by)
    VALUES (farm_uuid, bull_uuid, TRUE, notes_text, current_user_id)
    ON CONFLICT (farm_id, bull_id) 
    DO UPDATE SET 
        is_active = TRUE,
        notes = COALESCE(EXCLUDED.notes, farm_bull_picks.notes),
        updated_at = NOW();
    
    RETURN QUERY SELECT TRUE, 'Touro adicionado à seleção'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Remover touro da seleção da fazenda
CREATE OR REPLACE FUNCTION public.remove_bull_from_farm(
    farm_uuid UUID,
    bull_uuid UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Verificar permissão
    IF NOT public.can_edit_farm(farm_uuid) THEN
        RETURN QUERY SELECT FALSE, 'Sem permissão para editar esta fazenda'::TEXT;
        RETURN;
    END IF;
    
    -- Desativar seleção
    UPDATE public.farm_bull_picks 
    SET is_active = FALSE, updated_at = NOW()
    WHERE farm_id = farm_uuid AND bull_id = bull_uuid;
    
    RETURN QUERY SELECT TRUE, 'Touro removido da seleção'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Obter KPIs do dashboard da fazenda
CREATE OR REPLACE FUNCTION public.get_farm_dashboard(farm_uuid UUID)
RETURNS TABLE (
    farm_id UUID,
    farm_name TEXT,
    owner_name TEXT,
    total_females INT,
    donor_females INT,
    inter_females INT,
    recipient_females INT,
    donor_percentage NUMERIC,
    inter_percentage NUMERIC,
    recipient_percentage NUMERIC,
    avg_nm_dollar NUMERIC,
    avg_tpi NUMERIC,
    avg_hhp_dollar NUMERIC,
    selected_bulls INT,
    total_predictions INT,
    total_matings INT,
    total_semen_doses NUMERIC
) AS $$
BEGIN
    -- Verificar se usuário é membro da fazenda
    IF NOT public.is_farm_member(farm_uuid) THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        kpi.farm_id,
        kpi.farm_name,
        kpi.owner_name,
        kpi.total_females::INT,
        kpi.donor_females::INT,
        kpi.inter_females::INT,
        kpi.recipient_females::INT,
        kpi.donor_percentage,
        kpi.inter_percentage,
        kpi.recipient_percentage,
        kpi.avg_nm_dollar,
        kpi.avg_tpi,
        kpi.avg_hhp_dollar,
        kpi.selected_bulls::INT,
        kpi.total_predictions::INT,
        kpi.total_matings::INT,
        kpi.total_semen_doses
    FROM public.farm_dashboard_kpis kpi
    WHERE kpi.farm_id = farm_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;