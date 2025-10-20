
-- Script para criar vínculos entre técnicos e fazendas automaticamente

-- Criar tabela temporária com os dados do CSV
CREATE TEMP TABLE temp_technician_links (
  owner_name TEXT,
  farm_name TEXT,
  technician_name TEXT
);

-- Inserir dados do CSV (primeiros 50 registros como exemplo)
INSERT INTO temp_technician_links (owner_name, farm_name, technician_name) VALUES
('CLAUDIO E SEMILDO SCHIEFELBEIN', 'Fazenda', 'Bruna Schiefelbein'),
('HANS GROENWOLD', 'Fazenda Fini', 'Bruna Schiefelbein'),
('IRMÃOS STROBEL', 'FAZENDA SANTA ISABEL', 'Bruna Schiefelbein'),
('FELIPE DE JAGER', 'FAZENDA OURO VERDE', 'Bruna Schiefelbein'),
('Select Sires', 'Fazenda SS', 'Bruna Schiefelbein'),
('ELEANDRO ARSEGO', 'FAZENDA ARSEGO', 'Bruna Schiefelbein'),
('CARLOS JACOB WALLAUER', 'FAZENDA FORTALEZA', 'Bruna Schiefelbein'),
('TIAGO HUBER', 'TIAGO HUBER', 'Bruna Schiefelbein'),
('FAZENDA SAN DIEGO', 'SAN DIEGO', 'Bruna Schiefelbein'),
('JONATHAN ORSOLIN', 'JONATHAN ORSOLINN', 'Bruna Schiefelbein'),
('GRANJAS 4 IRMÃOS', 'GRANJAS 4 IRMÃOS', 'Bruna Schiefelbein'),
('PAULO MOSS', 'AGROPECUÁRIA MOSS', 'Bruna Schiefelbein'),
('FAZENDA MAMANGAVA- REBANHO FINI', 'FAZENDA MAMANGAVA', 'Bruna Schiefelbein'),
('IRMÃOS CERUTTI', 'IRMAOS CERUTTI', 'Bruna Schiefelbein'),
('Fazenda demonstrativa', 'Fazenda demonstrativa', 'Bruna Schiefelbein'),
('GRANJA MARIVO', 'GRANJA MARIVO', 'Bruna Schiefelbein'),
('FRITZ SEARA', 'FRITZ SEARA', 'Bruna Schiefelbein'),
('INGOLF SPECHT', 'IRMÃOS SPECHT', 'Bruna Schiefelbein'),
('GREGORY TEDESCO', 'TAMBO TEDESCO', 'Bruna Schiefelbein'),
('Jairo Gempka', 'FAZENDA JG', 'Bruna Schiefelbein'),
('Rodrigo Spoonchiado', 'Fazenda Sponchiado', 'Bruna Schiefelbein'),
('ANTONIO BRAZ TINOCO', 'ARTAGRO', 'Bruna Schiefelbein'),
('Edson Ferreira Rocha', 'Fazenda', 'Bruna Schiefelbein'),
('Rodolfo Bordignhon', 'Fazenda Bordinhon', 'Bruna Schiefelbein'),
('Julio Vieira', 'FAZENDA SANTA ELMIRA', 'Bruna Schiefelbein'),
('Lucio Drinko', 'Lucio Drinko', 'Bruna Schiefelbein'),
('RICHARD VERBURG', 'RICHARD VERBURG', 'Bruna Schiefelbein'),
('Larissa', 'UTFPR', 'Larissa Cunha'),
('JOSÉ OSVALDO NUNES', 'FAZENDA ESPERANÇA', 'Diego Marcondes Guerra'),
('DANIEL ANDRE DA SILVA', 'FAZENDA BRAVINHOS', 'Diego Marcondes Guerra'),
('SILVIO GERALDO MARTINS', 'FAZENDA PASTO DO BOIS', 'Diego Marcondes Guerra'),
('CARLOS FERNANDO MOREIRA DA CUNHA', 'FAZENDA PARAISO', 'Diego Marcondes Guerra'),
('DIMAS DE DEUS VIEIRA E OUTROS', 'FAZENDA BABILONIA', 'Diego Marcondes Guerra'),
('OSMAR MARRA DE OLIVEIRA', 'FAZENDA FIGUEIREDO', 'Diego Marcondes Guerra'),
('CELSO ANTONIO ROSA E OUTROS', 'FAZENDA FORTALEZA', 'Diego Marcondes Guerra'),
('GILSON PEREIRA CARDOSO', 'FAZENDA ALAGOAS', 'Diego Marcondes Guerra'),
('SILMAR GERALDO MARTINS', 'FAZENDA BATATAL', 'Diego Marcondes Guerra'),
('EDGAR MOREIRA GUIMARAES', 'FAZENDA BARREIRA', 'Diego Marcondes Guerra'),
('CAROLINE SEIBT E OUTROS', 'CONDOMINIO FAZENDA GAUCHA', 'Diego Marcondes Guerra'),
('VALTER JOSE DE SANTANA', 'FAZENDA BABILONIA', 'Diego Marcondes Guerra'),
('ANTONIO JOSE FREIRE', 'FAZENDA PÉROLA', 'Diego Marcondes Guerra'),
('ODAIR ANTONIO CENCI', 'FAZENDA CENCI', 'Diego Marcondes Guerra'),
('Jacques Gontijo Alvares (Doadoras)', 'Jacques Gontijo Alvares', 'Diego Marcondes Guerra'),
('Jacques Gontijo Alvares (Todo)', 'Jacques Gontijo Alvares', 'Diego Marcondes Guerra'),
('ClickWeb', 'Fazenda ClickWeb', 'Diego Marcondes Guerra'),
('Teste Lucas', 'Clickweb', 'Diego Marcondes Guerra'),
('José Guilherme Vasconcelos', 'Fazenda Santa Izabel', 'Diego Marcondes Guerra'),
('Teste Gustavo', 'Teste', 'Luis Gustavo C Figueiredo'),
('DANIEL MOREIRA', 'CACAPAVA', 'Daniel Moreira'),
('RODRIGO MOTTER TAFFAREL', 'AGROPECUÁRIA TAFFAREL', 'Daniel Moreira');

-- Criar vínculos baseado nos matches
INSERT INTO public.user_farms (user_id, farm_id, role)
SELECT DISTINCT
  p.id as user_id,
  f.id as farm_id,
  'technician'::farm_role as role
FROM temp_technician_links ttl
JOIN public.profiles p ON LOWER(p.full_name) LIKE '%' || LOWER(ttl.technician_name) || '%'
JOIN public.farms f ON (
  LOWER(f.name) LIKE '%' || LOWER(ttl.farm_name) || '%'
  OR LOWER(f.owner_name) LIKE '%' || LOWER(ttl.owner_name) || '%'
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_farms uf
  WHERE uf.user_id = p.id AND uf.farm_id = f.id
);

-- Limpar tabela temporária
DROP TABLE temp_technician_links;
