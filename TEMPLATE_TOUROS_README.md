# Template de Touros para Supabase

Este template contém dados completos de touros para importação no banco Supabase.

## Como usar

1. **Baixar o template**: Na página "Busca de Touros", clique no botão "Template Touros" para baixar o arquivo `template_touros_supabase.csv`

2. **Estrutura do arquivo**: O template inclui todos os campos necessários para a tabela `bulls`:
   - `code`: Código NAAB do touro (obrigatório)
   - `name`: Nome do touro (obrigatório)
   - `registration`: Número de registro
   - `birth_date`: Data de nascimento (formato: YYYY-MM-DD)
   - `sire_naab`: NAAB do pai
   - `mgs_naab`: NAAB do avô materno
   - `mmgs_naab`: NAAB do bisavô materno
   - Todos os PTAs (Predicted Transmitting Ability) conforme padrão CDCB

3. **Dados de exemplo**: O template vem com 3 touros de exemplo com dados reais:
   - LADYS-MANOR PK ALTAMONT-ET (11HO15933)
   - PINE-TREE ACHIEVER-ET (29HO21513) 
   - WESTCOAST LAMBORGHINI-ET (551HO05064)

## PTAs incluídos

### Índices Econômicos
- `nm_dollar`: Net Merit Dollar
- `fm_dollar`: Fluid Merit Dollar  
- `gm_dollar`: Grazing Merit Dollar
- `cm_dollar`: Cheese Merit Dollar
- `hhp_dollar`: Health & Wellness Profit Dollar
- `tpi`: Total Performance Index

### Características Produtivas
- `ptam`: PTA Milk (kg)
- `ptaf`: PTA Fat (kg)
- `ptaf_pct`: PTA Fat %
- `ptap`: PTA Protein (kg)
- `ptap_pct`: PTA Protein %

### Características de Saúde
- `pl`: Productive Life
- `liv`: Livability
- `scs`: Somatic Cell Score
- `dpr`: Daughter Pregnancy Rate
- `cfp`: Cow Fertility Index

### Características Morfológicas
- `ptat`: PTA Type
- `udc`: Udder Composite
- `flc`: Feet & Legs Composite
- `fls`: Foot & Leg Score
- `fua`: Final Score
- `ruh`: Rear Udder Height
- `ruw`: Rear Udder Width
- `rlr`: Rear Legs Rear View
- `rls`: Rear Legs Side View
- `rtp`: Rump Angle
- `str`: Stature
- `dfm`: Dairy Form
- `rua`: Rump Width
- `ftl`: Front Teat Length
- `fta`: Front Teat Placement
- `ftp`: Foot Angle
- `rw`: Rear Width
- `ucl`: Udder Cleft
- `udp`: Udder Depth
- `rfi`: Rear Foot Index
- `gfi`: General Foot Index

### Outras Características
- `ssb`: Sire Still Birth
- `dsb`: Daughter Still Birth  
- `dce`: Daughter Calving Ease
- `sce`: Sire Calving Ease
- `h_liv`: Heifer Livability
- `ccr`: Cow Conception Rate
- `hcr`: Heifer Conception Rate
- `fi`: Fertility Index
- `gl`: Gestation Length
- `efc`: Early First Calving
- `bwc`: Body Weight Composite
- `sta`: Strength
- `mf`: Milking Speed
- `da`: Daughter Average
- `rp`: Relative Performance
- `met`: Metabolic Disease
- `mast`: Mastitis
- `ket`: Ketosis
- `f_sav`: Feed Saved
- `kappa_casein`: Variante Kappa Caseína
- `beta_casein`: Variante Beta Caseína

## Importação no Supabase

### Via SQL Editor

```sql
-- Importar dados diretamente via SQL
INSERT INTO bulls (code, name, registration, birth_date, sire_naab, mgs_naab, mmgs_naab, ptas)
VALUES 
('11HO15933', 'LADYS-MANOR PK ALTAMONT-ET', 'HOLUSA000142457321', '2018-12-15', '7HO13386', '11HO11478', '1HO09918', 
'{"nm_dollar": 1247, "fm_dollar": 1180, "tpi": 2856, "hhp_dollar": 1098}'),
-- ... adicionar mais touros
;
```

### Via Interface Supabase

1. Acesse o dashboard do Supabase
2. Vá em "Table Editor" 
3. Selecione a tabela `bulls`
4. Clique em "Insert" > "Insert via CSV"
5. Faça upload do arquivo template

## Notas Importantes

- **Códigos NAAB únicos**: Cada touro deve ter um código NAAB único
- **Formato de datas**: Use sempre YYYY-MM-DD 
- **PTAs em JSONB**: Os valores numéricos serão automaticamente convertidos para o campo `ptas` em formato JSONB
- **Campos obrigatórios**: `code` e `name` são obrigatórios
- **Genealogia**: `sire_naab`, `mgs_naab` e `mmgs_naab` devem referenciar touros já existentes no banco

## Validação dos Dados

O sistema possui funções de validação automática:
- `normalize_naab()`: Normaliza códigos NAAB
- `get_bull_by_naab()`: Busca touros e sugere similares
- `validate_naab()`: Valida códigos NAAB

## Suporte

Para dúvidas sobre o template ou problemas na importação, verifique:
1. Formato correto dos campos obrigatórios
2. Unicidade dos códigos NAAB
3. Valores numéricos válidos para PTAs
4. Referências genealógicas existentes no banco