import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedCSVRow {
  [key: string]: string;
}

// Map completo de colunas do CSV para campos da tabela bulls
const COLUMN_MAP: Record<string, string> = {
  // === IDENTIFICAÇÃO ===
  'naab': 'code',
  'naab code': 'code',
  'naab_code': 'code',
  'code': 'code',
  'codigo': 'code',
  'código': 'code',
  'name': 'name',
  'nome': 'name',
  'registration name': 'registration',
  'reg name': 'registration',
  'registration': 'registration',
  'registro': 'registration',
  
  // === PEDIGREE ===
  'sire stack': 'pedigree',
  'sire_naab': 'sire_naab',
  'pai': 'sire_naab',
  'mgs_naab': 'mgs_naab',
  'avo_materno': 'mgs_naab',
  'mmgs_naab': 'mmgs_naab',
  'bisavo_materno': 'mmgs_naab',
  
  // === ÍNDICES ECONÔMICOS ===
  'tpi': 'tpi',
  'tpi®': 'tpi',
  
  // NM$ (Net Merit)
  'nm$': 'nm_dollar',
  'nm$®': 'nm_dollar',
  'nm': 'nm_dollar',
  'mn': 'nm_dollar',
  'mn$': 'nm_dollar',
  'net_merit': 'nm_dollar',
  'net merit': 'nm_dollar',
  'mérito liquido': 'nm_dollar',
  'mérito líquido': 'nm_dollar',
  
  // CM$ (Cheese Merit)
  'cm$': 'cm_dollar',
  'cm$®': 'cm_dollar',
  'cm': 'cm_dollar',
  'mq': 'cm_dollar',
  'mq$': 'cm_dollar',
  'mérito queijo': 'cm_dollar',
  'cheese merit': 'cm_dollar',
  
  // FM$ (Fluid Merit)
  'fm$': 'fm_dollar',
  'fm$®': 'fm_dollar',
  'fm': 'fm_dollar',
  'mf': 'fm_dollar',
  'mf$': 'fm_dollar',
  'mérito volume': 'fm_dollar',
  'mérito fluído': 'fm_dollar',
  'fluid merit': 'fm_dollar',
  
  // GM$ (Grazing Merit)
  'gm$': 'gm_dollar',
  'gm$®': 'gm_dollar',
  'gm': 'gm_dollar',
  'grazing merit': 'gm_dollar',
  'mg': 'gm_dollar',
  'mg$': 'gm_dollar',
  'mérito pasto': 'gm_dollar',
  
  // HHP$ (Health & Wellness Profit)
  'hhp$': 'hhp_dollar',
  'hhp$®': 'hhp_dollar',
  'health index': 'hhp_dollar',
  'hhp': 'hhp_dollar',
  
  // === PRODUÇÃO ===
  // Leite
  'ptam': 'ptam',
  'milk': 'ptam',
  'pta milk': 'ptam',
  'leite (lbs)': 'ptam',
  'gpta milk': 'ptam',
  'leite': 'ptam',
  'milk_production': 'ptam',
  'produção de leite': 'ptam',
  'milk production': 'ptam',
  
  // Gordura
  'ptaf': 'ptaf',
  'fat': 'ptaf',
  'f (lbs)': 'ptaf',
  'ptag': 'ptaf',
  'g (lbs)': 'ptaf',
  'gordura (lbs)': 'ptaf',
  'gord': 'ptaf',
  'gord (lbs)': 'ptaf',
  'fat (lbs)': 'ptaf',
  'fat.(lbs)': 'ptaf',
  'gord. (lbs.)': 'ptaf',
  'gordura': 'ptaf',
  'quantidade de gordura no leite': 'ptaf',
  
  'ptaf%': 'ptaf_pct',
  'f %': 'ptaf_pct',
  '% fat': 'ptaf_pct',
  'gordura %': 'ptaf_pct',
  'g%': 'ptaf_pct',
  'pta fat': 'ptaf_pct',
  'fat.(%)': 'ptaf_pct',
  '% gordura': 'ptaf_pct',
  '%_fat': 'ptaf_pct',
  
  // Proteína
  'ptap': 'ptap',
  'protein': 'ptap',
  'p (lbs)': 'ptap',
  'proteína (lbs)': 'ptap',
  'prot': 'ptap',
  'prot lbs': 'ptap',
  'pta pro': 'ptap',
  'prot.(lbs)': 'ptap',
  'prot. (lbs.)': 'ptap',
  'quantidade de proteína no leite': 'ptap',
  'proteína': 'ptap',
  
  'ptap%': 'ptap_pct',
  'p %': 'ptap_pct',
  '% pro': 'ptap_pct',
  'proteína %': 'ptap_pct',
  'prot.(%)': 'ptap_pct',
  '% prot': 'ptap_pct',
  '% proteína': 'ptap_pct',
  
  // CFP (Combined Fat & Protein)
  'cfp': 'cfp',
  'cgp': 'cfp',
  
  // Feed Saved
  'f sav': 'f_sav',
  'feed saved': 'f_sav',
  'fs': 'f_sav',
  
  // === LONGEVIDADE E FERTILIDADE ===
  // Productive Life
  'pl': 'pl',
  'vp': 'pl',
  'vida produtiva': 'pl',
  'productive life': 'pl',
  
  // Daughter Pregnancy Rate
  'dpr': 'dpr',
  'pta dpr': 'dpr',
  'tpf': 'dpr',
  'taxa de prenhez das filhas': 'dpr',
  'daughter pregnancy rate': 'dpr',
  
  // Livability
  'liv': 'liv',
  'ptaliv': 'liv',
  'sobrevivência': 'liv',
  'sobrevivênvia de vaca': 'liv',
  'cow livability': 'liv',
  'livability': 'liv',
  
  // Heifer Livability
  'h liv': 'h_liv',
  'hliv': 'h_liv',
  'h livability': 'h_liv',
  'pta hliv': 'h_liv',
  'sobrevivênvia de novilha': 'h_liv',
  'heifer livability': 'h_liv',
  
  // Fertility Index
  'fi': 'fi',
  'fert. index': 'fi',
  'fertil index': 'fi',
  'índice de fertilidade': 'fi',
  
  // Cow Conception Rate
  'ccr': 'ccr',
  'tcv': 'ccr',
  'cow conception rate': 'ccr',
  'taxa de concepção de vacas': 'ccr',
  
  // Heifer Conception Rate
  'hcr': 'hcr',
  'tcn': 'hcr',
  'heifer conception rate': 'hcr',
  'taxa de concepção de novilhas': 'hcr',
  
  // === SAÚDE ===
  // Somatic Cell Score
  'scs': 'scs',
  'ccs': 'scs',
  'somatic cells': 'scs',
  'células somáticas': 'scs',
  
  // Mastitis
  'mast': 'mast',
  'cdcb_mast': 'mast',
  'mastitis': 'mast',
  'mastite': 'mast',
  
  // Metritis
  'met': 'met',
  'cdcb_met': 'met',
  'metritis': 'met',
  'metrite': 'met',
  
  // Retained Placenta
  'rp': 'rp',
  'cdcb_rp': 'rp',
  'retained placenta': 'rp',
  
  // Displaced Abomasum
  'da': 'da',
  'dab': 'da',
  'cdcb_da': 'da',
  'desl.abom.': 'da',
  'deslocamento de abomaso': 'da',
  'displaced abomasum': 'da',
  
  // Ketosis
  'ket': 'ket',
  'cdcb_cet': 'ket',
  'cetose': 'ket',
  'ketosis': 'ket',
  
  // Milk Fever
  'mf': 'mf',
  'mfv': 'mf',
  'hipoc': 'mf',
  'hipocalcemia': 'mf',
  'febre do leite': 'mf',
  'milk fever': 'mf',
  
  // === TIPO E CONFORMAÇÃO ===
  // PTAT (Type)
  'ptat': 'ptat',
  'ptatype': 'ptat',
  'pta tipo': 'ptat',
  'type': 'ptat',
  'tipo': 'ptat',
  'classificação final para tipo': 'ptat',
  
  // Udder Composite
  'udc': 'udc',
  'cu': 'udc',
  'udder composite': 'udc',
  'composto do úbere': 'udc',
  
  // Feet and Leg Composite
  'flc': 'flc',
  'cpp': 'flc',
  'feet and leg composite': 'flc',
  'composto de pernas e pés': 'flc',
  
  // Body Composite
  'bwc': 'bwc',
  'bc': 'bwc',
  'body composite': 'bwc',
  'composto corporal': 'bwc',
  
  // === FACILIDADE DE PARTO ===
  // Sire Calving Ease
  'sce': 'sce',
  'fpt': 'sce',
  'sire calving ease': 'sce',
  'calving ease (sire)': 'sce',
  'facilidade de parto (touro)': 'sce',
  
  // Daughter Calving Ease
  'dce': 'dce',
  'fpf': 'dce',
  'daughter calving ease': 'dce',
  'calving ease (daughter)': 'dce',
  'calving ease (female)': 'dce',
  'facilidade de parto (fêmea)': 'dce',
  
  // Sire Stillbirth
  'ssb': 'ssb',
  'int': 'ssb',
  'sire stillbirth rate': 'ssb',
  'stillbirth rate (sire)': 'ssb',
  'índice de natimorto (touro)': 'ssb',
  
  // Daughter Stillbirth
  'dsb': 'dsb',
  'inf': 'dsb',
  'daughter stillbirth rate': 'dsb',
  'female stillbirth rate': 'dsb',
  'stillbirth rate (female)': 'dsb',
  'índice de natimorto (fêmea)': 'dsb',
  
  // === CARACTERÍSTICAS LINEARES ===
  // Stature
  'sta': 'sta',
  'est': 'sta',
  'stature': 'sta',
  'estatura': 'sta',
  
  // Strength
  'str': 'str',
  'strength': 'str',
  'força': 'str',
  
  // Dairy Form
  'dfm': 'dfm',
  'df': 'dfm',
  'forma leiteira': 'dfm',
  'dairy form': 'dfm',
  
  // Rump Angle
  'rua': 'rua',
  'ra': 'rua',
  'rump angle': 'rua',
  'ângulo da garupa': 'rua',
  
  // Thurl Width
  'rw': 'rw',
  'rtw': 'rw',
  'tw': 'rw',
  'thurl width': 'rw',
  'largura da garupa': 'rw',
  
  // Rear Legs Side View
  'rls': 'rls',
  'rear legs side': 'rls',
  'pernas vista lateral': 'rls',
  
  // Rear Legs Rear View
  'rlr': 'rlr',
  'rear legs rear': 'rlr',
  'pernas vista posterior': 'rlr',
  
  // Foot Angle
  'fta': 'fta',
  'fa': 'fta',
  'ângulo dos cascos': 'fta',
  'foot angle': 'fta',
  
  // Feet & Legs Score
  'fls': 'fls',
  
  // Fore Udder Attachment
  'fua': 'fua',
  'fore udder attachment': 'fua',
  'inserção anterior do úbere': 'fua',
  
  // Rear Udder Height
  'ruh': 'ruh',
  'rear udder height': 'ruh',
  'altura do úbere posterior': 'ruh',
  
  // Rear Udder Width
  'ruw': 'ruw',
  'rear udder width': 'ruw',
  'largura do úbere': 'ruw',
  
  // Udder Cleft
  'ucl': 'ucl',
  'uc': 'ucl',
  'udder cleft': 'ucl',
  'ligamento médio': 'ucl',
  
  // Udder Depth
  'udp': 'udp',
  'ud': 'udp',
  'udder depth': 'udp',
  'profundidade do úbere': 'udp',
  
  // Front Teat Placement
  'ftp': 'ftp',
  'front teat placement': 'ftp',
  'colocação dos tetos anterior': 'ftp',
  
  // Rear Teat Placement
  'rtp': 'rtp',
  'rear teat placement': 'rtp',
  'colocação dos tetos posterior': 'rtp',
  
  // Teat Length
  'ftl': 'ftl',
  'tl': 'ftl',
  'teat length': 'ftl',
  'comprimento dos tetos': 'ftl',
  
  // === EFICIÊNCIA ALIMENTAR ===
  'rfi': 'rfi',
  'gfi': 'gfi',
  'gl': 'gl',
  
  // === OUTROS ===
  'birthdate': 'birth_date',
  'birth_date': 'birth_date',
  'data de nascimento': 'birth_date',
  'data': 'birth_date',
  'date': 'birth_date',
  'company': 'company',
  'empresa': 'company',
  'beta-casein': 'beta_casein',
  'beta_casein': 'beta_casein',
  'kappa-casein': 'kappa_casein',
  'kappa_casein': 'kappa_casein',
};

// Colunas que NÃO fazem parte da tabela bulls e devem ser EXCLUÍDAS
const EXCLUDED_COLUMNS = [
  // Reliability scores
  'nm$ rel', 'fi rel', 'dpr rel', 'ccr rel', 'hcr rel', 'liv rel', 'h liv rel',
  'sce rel', 'dce rel', 'scs rel', 'pl rel', 'ptat rel', 'dsb rel', 'ssb rel',
  'mast rel', 'met rel', 'ket rel', 'rfi rel', 'scr rel', 'gl rel', 'efc rel',
  'f sav rel', 'ms rel', 'ret. placenta rel', 'pta da rel', 'mf rel', 'rel',
  
  // Daughters/Herds counts
  'f sav dtrs', 'f sav herds', 'ptap dtrs', 'ptat dtrs', 'liv dtrs', 'liv herds',
  'h liv dtrs', 'h liv herds', 'mast dtrs', 'mast herds', 'met dtrs', 'met herds',
  'rp dtrs', 'rp herds', 'pta da num dtrs', 'pta da num herds', 'ket dtrs', 'ket herds',
  'mf dtrs', 'mf herds', 'rfi dtr', 'rfi hrd', 'gl dtrs', 'efc dtrs',
  
  // Z-scores (não utilizados)
  'z mast', 'z mast dtrs', 'z mast rel', 'z lame', 'z lame dtrs', 'z lame rel',
  'z met', 'z met dtrs', 'z met rel', 'z rp', 'z rp dtr', 'z rp rel',
  'z disp. abomasum', 'z da dtr', 'z da rel', 'z ket', 'z ket dtr', 'z ket rel',
  'z crd', 'z crd dtrs', 'z crd rel', 'z cs', 'z cs dtrs', 'z cs rel',
  'z cliv', 'z mf', 'z cliv dtrs', 'z mf dtrs', 'z cliv rel', 'z mf rel',
  'z cow rd', 'z cow rd dtrs', 'z cow rd rel', 'z abrt', 'z abrt dtr', 'z abrt rel',
  'z twin', 'z twin dtr', 'z twin rel', 'z cyst', 'z cyst dtr', 'z cyst rel',
  
  // Outros índices não utilizados
  'dwp$', 'dwp$®', 'wt$', 'wt$®', 'cw$', 'cw$™', 'gp$', 'gp$™',
  'ms', 'mt', 'efi', 'dms', 'aaa',
  
  // Observation counts
  'sce obs', 'dce obs', 'dsb obs', 'ssb obs',
  
  // Outros campos
  'd', 'scr', 'bod', 'lineups/designations',
  
  // Campos genéricos de observação
  'extra1', 'extra2', 'extra3', 'observacao', 'obs', 
  'notes', 'comentario', 'status_interno'
];

function parseCSV(text: string): { headers: string[]; rows: ParsedCSVRow[] } {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV deve ter pelo menos cabeçalho e uma linha de dados');
  }

  // Detectar separador contando ocorrências na primeira linha
  const firstLine = lines[0];
  console.log('📋 First line sample:', firstLine.substring(0, 200));
  
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  
  let separator = '\t'; // Tab como padrão (formato Select Sires)
  let maxCount = tabCount;
  
  if (semicolonCount > maxCount) {
    separator = ';';
    maxCount = semicolonCount;
  }
  if (commaCount > maxCount) {
    separator = ',';
    maxCount = commaCount;
  }
  
  console.log('📋 Detected separator:', separator === '\t' ? 'TAB' : JSON.stringify(separator), '(count:', maxCount, ')');

  // Parse header
  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
  console.log(`📋 Parsed ${headers.length} headers. First 15:`, headers.slice(0, 15));

  if (headers.length < 5) {
    throw new Error(`Formato CSV inválido: apenas ${headers.length} colunas detectadas. Esperado pelo menos 5.`);
  }

  const rows: ParsedCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(separator);
    
    // Pular linhas com número errado de colunas (tolerância de ±5 colunas)
    if (Math.abs(values.length - headers.length) > 5) {
      console.warn(`⚠️ Row ${i} has ${values.length} values but ${headers.length} headers, skipping`);
      continue;
    }

    const row: ParsedCSVRow = {};
    
    headers.forEach((header, index) => {
      if (index >= values.length) return; // Ignorar se não houver valor
      
      const value = (values[index] || '').trim();
      
      // Ignorar colunas excluídas
      const lowerHeader = header.toLowerCase();
      if (EXCLUDED_COLUMNS.includes(lowerHeader)) {
        return;
      }
      
      // Mapear coluna para nome canônico ou usar original
      const mappedHeader = COLUMN_MAP[lowerHeader] || lowerHeader;
      if (value) { // Só adicionar se tiver valor
        row[mappedHeader] = value;
      }
    });
    
    // Só adicionar row se tiver pelo menos code ou name
    if (row.code || row.name) {
      rows.push(row);
    }
  }

  console.log(`📋 Parsed ${rows.length} valid rows`);
  if (rows.length > 0) {
    console.log('📋 Sample first row keys:', Object.keys(rows[0]).slice(0, 20));
    console.log('📋 Sample first row values:', JSON.stringify(rows[0]).substring(0, 300));
  }
  return { headers, rows };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // ENDPOINT: /upload - Faz upload do CSV e processa para staging
    if (path.endsWith('/upload')) {
      console.log('📤 Starting upload...');
      
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const userId = formData.get('user_id') as string;

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'Nenhum arquivo enviado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'user_id é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar tamanho do arquivo (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: 'Arquivo muito grande (máximo 10MB)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Ler e parsear CSV
      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      console.log(`📊 Parsed ${rows.length} rows with headers:`, headers);

      // Gerar batch ID
      const importBatchId = crypto.randomUUID();

      // LIMPAR STAGING ANTIGO do mesmo usuário para evitar acúmulo
      console.log(`🧹 Limpando registros antigos do staging para user ${userId}...`);
      const { error: deleteError } = await supabase
        .from('bulls_import_staging')
        .delete()
        .eq('uploader_user_id', userId);

      if (deleteError) {
        console.error('⚠️ Erro ao limpar staging:', deleteError);
      } else {
        console.log('✅ Staging limpo');
      }

      // Preparar linhas para staging com row_number
      const stagingRows = rows.map((row, index) => ({
        import_batch_id: importBatchId,
        uploader_user_id: userId,
        row_number: index + 1,
        raw_row: row,
        mapped_row: null,
        is_valid: false,
        errors: []
      }));

      // Inserir em staging
      const { error: stagingError } = await supabase
        .from('bulls_import_staging')
        .insert(stagingRows);

      if (stagingError) {
        console.error('Staging insert error:', stagingError);
        throw new Error(`Erro ao inserir em staging: ${stagingError.message}`);
      }

      console.log(`✅ Uploaded ${rows.length} rows to staging`);

      return new Response(
        JSON.stringify({
          import_batch_id: importBatchId,
          headers,
          total_rows: rows.length,
          inserted: 0,
          updated: 0,
          skipped: 0,
          invalid: 0,
          message: '✅ CSV carregado. Use "Migrar Touros" para processar os registros.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ENDPOINT: /auto-commit - Processa registros pendentes em BATCHES
    if (path.endsWith('/auto-commit')) {
      console.log('🚀 Starting auto-commit batch processing...');
      
      const BATCH_SIZE = 200; // Aumentado para processar mais rápido
      
      // Buscar primeiro batch
      const { data: allStagingData, error: allStagingError } = await supabase
        .from('bulls_import_staging')
        .select('*')
        .eq('is_valid', false)
        .limit(BATCH_SIZE);

      if (allStagingError) {
        throw new Error(`Erro ao buscar staging: ${allStagingError.message}`);
      }

      if (!allStagingData || allStagingData.length === 0) {
        return new Response(
          JSON.stringify({ 
            message: 'Nenhum registro pendente',
            inserted: 0,
            updated: 0,
            skipped: 0,
            invalid: 0,
            remaining: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // LOG DETALHADO: Ver estrutura do primeiro registro
      if (allStagingData.length > 0) {
        console.log('📋 Sample raw_row structure:', JSON.stringify(allStagingData[0].raw_row).substring(0, 300));
      }

      console.log(`📋 Processing batch of ${allStagingData.length} records`);

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let invalid = 0;

      // Preparar dados em lote para UPSERT
      const bullsToUpsert: any[] = [];
      const validRowIds: string[] = [];
      const invalidRowIds: string[] = [];

      for (const row of allStagingData) {
        const rawRow = row.raw_row as ParsedCSVRow;
        
        // Log primeiro registro para debug
        if (bullsToUpsert.length === 0) {
          console.log('🔍 First rawRow keys:', Object.keys(rawRow).slice(0, 20));
          console.log('🔍 First rawRow sample:', JSON.stringify(rawRow).substring(0, 400));
        }
        
        const code = rawRow.code?.trim();
        if (!code) {
          console.log('❌ Skipping row without code:', Object.keys(rawRow).slice(0, 10));
          invalid++;
          invalidRowIds.push(row.id);
          continue;
        }

        const bullData: any = {
          code: code,
          code_normalized: code.toUpperCase().replace(/[-\s]/g, '').replace(/^0+/, ''),
          name: rawRow.name || '',
          registration: rawRow.registration || null,
          birth_date: rawRow.birth_date || null,
          company: rawRow.company || null,
          sire_naab: rawRow.sire_naab || null,
          mgs_naab: rawRow.mgs_naab || null,
          mmgs_naab: rawRow.mmgs_naab || null,
          beta_casein: rawRow.beta_casein || null,
          kappa_casein: rawRow.kappa_casein || null,
          pedigree: rawRow.pedigree || null,
        };

        const ptaFields = [
          'nm_dollar', 'tpi', 'hhp_dollar', 'ptam', 'ptaf', 'ptap',
          'cm_dollar', 'fm_dollar', 'gm_dollar', 'f_sav', 'cfp',
          'ptaf_pct', 'ptap_pct', 'pl', 'dpr', 'liv', 'scs',
          'mast', 'met', 'rp', 'da', 'ket', 'mf', 'ptat', 'udc',
          'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr',
          'fi', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls', 'rtp',
          'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw',
          'ucl', 'udp', 'ftp', 'rfi', 'gfi', 'gl'
        ];

        let ptaCount = 0;
        ptaFields.forEach(field => {
          if (rawRow[field]) {
            const value = parseFloat(rawRow[field]);
            if (!isNaN(value)) {
              bullData[field] = value;
              ptaCount++;
            }
          }
        });

        // Log primeiro touro válido para debug
        if (bullsToUpsert.length === 0 && ptaCount > 0) {
          console.log(`✅ First valid bull: ${bullData.code} - ${bullData.name} with ${ptaCount} PTAs`);
          console.log('Sample PTAs:', { 
            tpi: bullData.tpi, 
            nm_dollar: bullData.nm_dollar, 
            ptam: bullData.ptam 
          });
        }

        bullsToUpsert.push(bullData);
        validRowIds.push(row.id);
      }

      // UPSERT em lote (muito mais rápido!)
      if (bullsToUpsert.length > 0) {
        console.log(`📤 Attempting to upsert ${bullsToUpsert.length} bulls...`);
        
        // Remover duplicatas no batch baseado no code
        const uniqueBulls = Array.from(
          new Map(bullsToUpsert.map(b => [b.code, b])).values()
        );
        
        if (uniqueBulls.length < bullsToUpsert.length) {
          console.log(`⚠️ Removed ${bullsToUpsert.length - uniqueBulls.length} duplicate codes in batch`);
        }
        
        // VERIFICAR QUAIS JÁ EXISTEM **ANTES** DO UPSERT
        const codes = uniqueBulls.map(b => b.code);
        const { data: existingBulls } = await supabase
          .from('bulls')
          .select('code')
          .in('code', codes);

        const existingCodes = new Set(existingBulls?.map(b => b.code) || []);
        console.log(`📊 Before upsert: ${existingCodes.size} codes already exist`);
        
        const { data: upsertData, error: upsertError } = await supabase
          .from('bulls')
          .upsert(uniqueBulls, { 
            onConflict: 'code',
            ignoreDuplicates: false 
          })
          .select('id');

        if (upsertError) {
          console.error('❌ Batch upsert error:', upsertError);
          console.error('First bull in failed batch:', JSON.stringify(uniqueBulls[0]));
          skipped = uniqueBulls.length;
        } else {
          // Contar baseado no que existia ANTES do upsert
          updated = codes.filter(c => existingCodes.has(c)).length;
          inserted = codes.length - updated;
          
          console.log(`✅ Batch upsert successful: ${inserted} new, ${updated} updated`);
          console.log(`📝 Upsert returned ${upsertData?.length || 0} IDs`);
        }
      }

      // Marcar registros válidos como processados e depois removê-los
      if (validRowIds.length > 0) {
        await supabase
          .from('bulls_import_staging')
          .update({ is_valid: true })
          .in('id', validRowIds);
        
        // Remover registros processados do staging
        const { error: deleteValidError } = await supabase
          .from('bulls_import_staging')
          .delete()
          .in('id', validRowIds);
        
        if (deleteValidError) {
          console.error('⚠️ Erro ao limpar registros válidos:', deleteValidError);
        } else {
          console.log(`🧹 ${validRowIds.length} registros válidos removidos do staging`);
        }
      }

      // Marcar registros inválidos e removê-los também
      if (invalidRowIds.length > 0) {
        await supabase
          .from('bulls_import_staging')
          .update({ is_valid: true, errors: ['missing_code'] })
          .in('id', invalidRowIds);
        
        // Remover registros inválidos do staging
        const { error: deleteInvalidError } = await supabase
          .from('bulls_import_staging')
          .delete()
          .in('id', invalidRowIds);
        
        if (deleteInvalidError) {
          console.error('⚠️ Erro ao limpar registros inválidos:', deleteInvalidError);
        } else {
          console.log(`🧹 ${invalidRowIds.length} registros inválidos removidos do staging`);
        }
      }

      // Contar quantos ainda faltam
      const { count: remainingCount } = await supabase
        .from('bulls_import_staging')
        .select('*', { count: 'exact', head: true })
        .eq('is_valid', false);

      console.log(`✅ Batch complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${invalid} invalid`);
      console.log(`📊 Remaining records: ${remainingCount || 0}`);

      return new Response(
        JSON.stringify({
          batch_size: allStagingData.length,
          inserted,
          updated,
          skipped,
          invalid,
          remaining: remainingCount || 0,
          message: remainingCount && remainingCount > 0
            ? `✅ Batch processado! ${remainingCount} registros restantes. Chame novamente para continuar.`
            : '✅ Migração completa! Todos os touros foram processados.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ENDPOINT: /commit - Valida staging e move para tabela bulls
    // ⚠️ DEPRECADO: O commit agora é automático no /upload
    // Este endpoint é mantido para compatibilidade com código legado
    if (path.endsWith('/commit')) {
      console.log('✅ Starting commit...');
      
      const { import_batch_id, uploader_user_id } = await req.json();

      if (!import_batch_id || !uploader_user_id) {
        return new Response(
          JSON.stringify({ error: 'import_batch_id e uploader_user_id são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar rows do staging
      const { data: stagingData, error: stagingError } = await supabase
        .from('bulls_import_staging')
        .select('*')
        .eq('import_batch_id', import_batch_id)
        .eq('uploader_user_id', uploader_user_id);

      if (stagingError) {
        throw new Error(`Erro ao buscar staging: ${stagingError.message}`);
      }

      if (!stagingData || stagingData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Nenhum dado encontrado no staging para este batch' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`📋 Processing ${stagingData.length} rows from staging`);

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let invalid = 0;

      // Processar cada linha
      for (const row of stagingData) {
        const rawRow = row.raw_row as ParsedCSVRow;
        
        // Validar se tem código mínimo
        const code = rawRow.code?.trim();
        if (!code) {
          invalid++;
          continue;
        }

        // Preparar dados para bulls table
        const bullData: any = {
          code: code,
          code_normalized: code.toUpperCase().replace(/[-\s]/g, '').replace(/^0+/, ''),
          name: rawRow.name || '',
          registration: rawRow.registration || null,
          birth_date: rawRow.birth_date || null,
          company: rawRow.company || null,
          sire_naab: rawRow.sire_naab || null,
          mgs_naab: rawRow.mgs_naab || null,
          mmgs_naab: rawRow.mmgs_naab || null,
          beta_casein: rawRow.beta_casein || null,
          kappa_casein: rawRow.kappa_casein || null,
        };

        // Adicionar PTAs se existirem
        const ptaFields = [
          'nm_dollar', 'tpi', 'hhp_dollar', 'ptam', 'ptaf', 'ptap',
          'cm_dollar', 'fm_dollar', 'gm_dollar', 'f_sav', 'cfp',
          'ptaf_pct', 'ptap_pct', 'pl', 'dpr', 'liv', 'scs',
          'mast', 'met', 'rp', 'da', 'ket', 'mf', 'ptat', 'udc',
          'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr',
          'fi', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls', 'rtp',
          'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw',
          'ucl', 'udp', 'ftp', 'rfi', 'gfi'
        ];

        ptaFields.forEach(field => {
          if (rawRow[field]) {
            const value = parseFloat(rawRow[field]);
            if (!isNaN(value)) {
              bullData[field] = value;
            }
          }
        });

        // Tentar inserir ou atualizar
        const { data: existing } = await supabase
          .from('bulls')
          .select('id')
          .eq('code', bullData.code)
          .single();

        if (existing) {
          // Atualizar
          const { error: updateError } = await supabase
            .from('bulls')
            .update(bullData)
            .eq('id', existing.id);

          if (updateError) {
            console.error(`❌ Update error for ${bullData.code}:`, updateError);
            skipped++;
          } else {
            console.log(`✅ Updated bull: ${bullData.code}`);
            updated++;
          }
        } else {
          // Inserir
          const { error: insertError } = await supabase
            .from('bulls')
            .insert(bullData);

          if (insertError) {
            console.error(`❌ Insert error for ${bullData.code}:`, insertError);
            skipped++;
          } else {
            console.log(`✅ Inserted bull: ${bullData.code}`);
            inserted++;
          }
        }
      }

      // Registrar log
      const { error: logError } = await supabase
        .from('bulls_import_log')
        .insert({
          import_batch_id,
          uploader_user_id,
          total_rows: stagingData.length,
          valid_rows: inserted + updated,
          invalid_rows: invalid,
          inserted,
          updated,
          skipped,
          committed_at: new Date().toISOString(),
        });

      if (logError) {
        console.error('Log insert error:', logError);
      }

      console.log(`✅ Commit complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${invalid} invalid`);

      return new Response(
        JSON.stringify({
          import_batch_id,
          total_rows: stagingData.length,
          inserted,
          updated,
          skipped,
          invalid,
          message: 'Importação concluída com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado. Use /upload ou /commit' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-bulls function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
