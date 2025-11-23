-- Create technical glossary table
CREATE TABLE IF NOT EXISTS public.technical_glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  pt_br TEXT NOT NULL,
  en_us TEXT,
  description TEXT,
  context TEXT,
  is_translatable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technical_glossary ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access to technical glossary"
ON public.technical_glossary
FOR SELECT
TO public
USING (true);

-- Only admins can modify
CREATE POLICY "Allow admin full access to technical glossary"
ON public.technical_glossary
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Create index for faster lookups
CREATE INDEX idx_technical_glossary_term_key ON public.technical_glossary(term_key);
CREATE INDEX idx_technical_glossary_category ON public.technical_glossary(category);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_technical_glossary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_technical_glossary_updated_at
BEFORE UPDATE ON public.technical_glossary
FOR EACH ROW
EXECUTE FUNCTION public.update_technical_glossary_updated_at();

-- Seed data: PTAs (não traduzíveis)
INSERT INTO public.technical_glossary (term_key, category, pt_br, en_us, is_translatable, description) VALUES
('hhp_dollar', 'Índices', 'HHP$®', 'HHP$®', false, 'Health and Herd Profitability Index'),
('nm_dollar', 'Índices', 'NM$®', 'NM$®', false, 'Net Merit Index'),
('cm_dollar', 'Índices', 'CM$®', 'CM$®', false, 'Cheese Merit Index'),
('fm_dollar', 'Índices', 'FM$®', 'FM$®', false, 'Fluid Merit Index'),
('gm_dollar', 'Índices', 'GM$®', 'GM$®', false, 'Grazing Merit Index'),
('tpi', 'Índices', 'TPI', 'TPI', false, 'Total Performance Index'),
('ptaf', 'Produção', 'PTAF', 'PTAF', false, 'Predicted Transmitting Ability for Fat'),
('ptap', 'Produção', 'PTAP', 'PTAP', false, 'Predicted Transmitting Ability for Protein'),
('ptam', 'Produção', 'PTAM', 'PTAM', false, 'Predicted Transmitting Ability for Milk'),
('ptat', 'Tipo', 'PTAT', 'PTAT', false, 'Predicted Transmitting Ability for Type'),
('pl', 'Longevidade', 'PL', 'PL', false, 'Productive Life'),
('scs', 'Saúde', 'SCS', 'SCS', false, 'Somatic Cell Score'),
('dpr', 'Fertilidade', 'DPR', 'DPR', false, 'Daughter Pregnancy Rate'),
('ccr', 'Fertilidade', 'CCR', 'CCR', false, 'Cow Conception Rate'),
('hcr', 'Fertilidade', 'HCR', 'HCR', false, 'Heifer Conception Rate'),
('liv', 'Saúde', 'LIV', 'LIV', false, 'Livability'),
('mast', 'Saúde', 'MAST', 'MAST', false, 'Mastitis'),
('met', 'Saúde', 'MET', 'MET', false, 'Metritis'),
('rp', 'Saúde', 'RP', 'RP', false, 'Retained Placenta'),
('ket', 'Saúde', 'KET', 'KET', false, 'Ketosis'),
('da', 'Saúde', 'DA', 'DA', false, 'Displaced Abomasum'),
('fi', 'Eficiência', 'FI', 'FI', false, 'Feed Intake'),
('rfi', 'Eficiência', 'RFI', 'RFI', false, 'Residual Feed Intake'),
('gfi', 'Eficiência', 'GFI', 'GFI', false, 'Gross Feed Intake'),
('bwc', 'Facilidade de Parto', 'BWC', 'BWC', false, 'Birth Weight Composite'),
('sce', 'Facilidade de Parto', 'SCE', 'SCE', false, 'Sire Calving Ease'),
('dce', 'Facilidade de Parto', 'DCE', 'DCE', false, 'Daughter Calving Ease'),
('ssb', 'Facilidade de Parto', 'SSB', 'SSB', false, 'Sire Stillbirth'),
('dsb', 'Facilidade de Parto', 'DSB', 'DSB', false, 'Daughter Stillbirth'),
('str', 'Tipo', 'STR', 'STR', false, 'Strength'),
('sta', 'Tipo', 'STA', 'STA', false, 'Stature'),
('rw', 'Tipo', 'RW', 'RW', false, 'Rear Width'),
('ruw', 'Tipo', 'RUW', 'RUW', false, 'Rear Udder Width'),
('ruh', 'Tipo', 'RUH', 'RUH', false, 'Rear Udder Height'),
('udp', 'Tipo', 'UDP', 'UDP', false, 'Udder Depth'),
('ucl', 'Tipo', 'UCL', 'UCL', false, 'Udder Cleft'),
('ftp', 'Tipo', 'FTP', 'FTP', false, 'Front Teat Placement'),
('rtp', 'Tipo', 'RTP', 'RTP', false, 'Rear Teat Placement'),
('fua', 'Tipo', 'FUA', 'FUA', false, 'Fore Udder Attachment'),
('rua', 'Tipo', 'RUA', 'RUA', false, 'Rear Udder Attachment'),
('ftl', 'Tipo', 'FTL', 'FTL', false, 'Front Teat Length'),
('fta', 'Tipo', 'FTA', 'FTA', false, 'Foot Angle'),
('rlr', 'Tipo', 'RLR', 'RLR', false, 'Rear Legs Rear View'),
('rls', 'Tipo', 'RLS', 'RLS', false, 'Rear Legs Side View'),
('flc', 'Tipo', 'FLC', 'FLC', false, 'Front Legs Correctness'),
('fls', 'Tipo', 'FLS', 'FLS', false, 'Front Legs Side View'),
('dfm', 'Tipo', 'DFM', 'DFM', false, 'Dairy Form'),
('udc', 'Tipo', 'UDC', 'UDC', false, 'Udder Composite'),
('gl', 'Tipo', 'GL', 'GL', false, 'General Appearance'),
('cfp', 'Facilidade de Parto', 'CFP', 'CFP', false, 'Calving Fitness'),
('h_liv', 'Saúde', 'H-LIV', 'H-LIV', false, 'Heifer Livability'),
('f_sav', 'Eficiência', 'F-SAV', 'F-SAV', false, 'Feed Saved'),
('efc', 'Eficiência', 'EFC', 'EFC', false, 'Efficiency'),
('mf', 'Produção', 'MF', 'MF', false, 'Milk Fat');

-- Seed data: Grupos e termos traduzíveis
INSERT INTO public.technical_glossary (term_key, category, pt_br, en_us, is_translatable, description) VALUES
('group_indices', 'Grupos', 'Índices', 'Economic Indices', true, 'Grupo de índices econômicos'),
('group_production', 'Grupos', 'Produção', 'Production', true, 'Grupo de características de produção'),
('group_health', 'Grupos', 'Saúde', 'Health', true, 'Grupo de características de saúde'),
('group_fertility', 'Grupos', 'Fertilidade', 'Fertility', true, 'Grupo de características de fertilidade'),
('group_type', 'Grupos', 'Tipo', 'Type', true, 'Grupo de características de tipo'),
('group_longevity', 'Grupos', 'Longevidade', 'Longevity', true, 'Grupo de características de longevidade'),
('group_efficiency', 'Grupos', 'Eficiência', 'Efficiency', true, 'Grupo de características de eficiência'),
('group_calving', 'Grupos', 'Facilidade de Parto', 'Calving Ease', true, 'Grupo de características de parto'),
('term_herd', 'Domínio', 'Rebanho', 'Herd', true, 'Conjunto de animais em uma propriedade'),
('term_bull', 'Domínio', 'Touro', 'Bull', true, 'Animal macho reprodutor'),
('term_female', 'Domínio', 'Fêmea', 'Female', true, 'Animal fêmea do rebanho'),
('term_farm', 'Domínio', 'Fazenda', 'Farm', true, 'Propriedade rural'),
('term_mating', 'Domínio', 'Acasalamento', 'Mating', true, 'Processo de cruzamento genético'),
('term_prediction', 'Domínio', 'Predição', 'Prediction', true, 'Estimativa de valor genético'),
('term_segmentation', 'Domínio', 'Segmentação', 'Segmentation', true, 'Classificação de animais por grupos'),
('term_pedigree', 'Domínio', 'Pedigree', 'Pedigree', true, 'Linhagem genética do animal'),
('term_genomic', 'Domínio', 'Genômico', 'Genomic', true, 'Relacionado ao genoma'),
('term_naab', 'Domínio', 'NAAB', 'NAAB', false, 'National Association of Animal Breeders code'),
('term_category', 'Domínio', 'Categoria', 'Category', true, 'Classificação de animais'),
('term_sire', 'Domínio', 'Pai', 'Sire', true, 'Touro pai do animal'),
('term_mgs', 'Domínio', 'Avô Materno', 'Maternal Grandsire', true, 'Pai da mãe do animal'),
('term_mmgs', 'Domínio', 'Bisavô Materno', 'Maternal Great-Grandsire', true, 'Avô da mãe do animal'),
('term_parity', 'Domínio', 'Lactação', 'Parity', true, 'Número de lactações da fêmea'),
('term_birth_date', 'Domínio', 'Data de Nascimento', 'Birth Date', true, 'Data em que o animal nasceu'),
('term_identifier', 'Domínio', 'Identificador', 'Identifier', true, 'Código de identificação do animal'),
('term_tank', 'Domínio', 'Botijão', 'Tank', true, 'Recipiente para armazenamento de sêmen'),
('term_semen', 'Domínio', 'Sêmen', 'Semen', true, 'Material genético para inseminação'),
('term_dose', 'Domínio', 'Dose', 'Dose', true, 'Unidade de sêmen'),
('term_movement', 'Domínio', 'Movimentação', 'Movement', true, 'Entrada ou saída de sêmen'),
('term_audit', 'Domínio', 'Auditoria Genética', 'Genetic Audit', true, 'Análise genética do rebanho'),
('term_benchmark', 'Domínio', 'Benchmark', 'Benchmark', true, 'Comparação com referências'),
('term_quartile', 'Domínio', 'Quartil', 'Quartile', true, 'Divisão estatística em quatro partes'),
('term_progression', 'Domínio', 'Progressão', 'Progression', true, 'Evolução genética ao longo do tempo'),
('term_distribution', 'Domínio', 'Distribuição', 'Distribution', true, 'Dispersão de valores estatísticos'),
('term_trend', 'Domínio', 'Tendência', 'Trend', true, 'Direção de mudança ao longo do tempo'),
('term_average', 'Domínio', 'Média', 'Average', true, 'Valor médio estatístico'),
('term_linear', 'Domínio', 'Linear', 'Linear', true, 'Características lineares de tipo'),
('term_index', 'Domínio', 'Índice', 'Index', true, 'Indicador composto de mérito'),
('term_coefficient', 'Domínio', 'Coeficiente', 'Coefficient', true, 'Valor de ponderação'),
('term_weight', 'Domínio', 'Peso', 'Weight', true, 'Importância relativa'),
('term_objective', 'Domínio', 'Objetivo', 'Objective', true, 'Meta ou alvo de seleção'),
('term_plan', 'Domínio', 'Plano', 'Plan', true, 'Plano genético'),
('term_replacement', 'Domínio', 'Reposição', 'Replacement', true, 'Animais para substituição'),
('term_structure', 'Domínio', 'Estrutura', 'Structure', true, 'Composição do rebanho'),
('term_export', 'Domínio', 'Exportar', 'Export', true, 'Exportar dados'),
('term_import', 'Domínio', 'Importar', 'Import', true, 'Importar dados'),
('term_upload', 'Domínio', 'Enviar', 'Upload', true, 'Carregar arquivo'),
('term_download', 'Domínio', 'Baixar', 'Download', true, 'Descarregar arquivo');