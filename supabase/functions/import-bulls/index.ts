import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedCSVRow {
  [key: string]: string;
}

// Map de colunas do CSV para campos da tabela bulls_import_staging
const COLUMN_MAP: Record<string, string> = {
  // Códigos e identificação (Select Sires format)
  'code': 'code',
  'naab': 'code',
  'codigo': 'code',
  'name': 'name',
  'nome': 'name',
  'registration name': 'registration',
  'registration': 'registration',
  'registro': 'registration',
  
  // Pedigree
  'sire stack': 'pedigree',
  'sire_naab': 'sire_naab',
  'pai': 'sire_naab',
  'mgs_naab': 'mgs_naab',
  'avo_materno': 'mgs_naab',
  'mmgs_naab': 'mmgs_naab',
  'bisavo_materno': 'mmgs_naab',
  
  // PTAs principais (Select Sires format)
  'nm_dollar': 'nm_dollar',
  'nm$': 'nm_dollar',
  'tpi': 'tpi',
  'hhp_dollar': 'hhp_dollar',
  'hhp$®': 'hhp_dollar',
  'hhp$': 'hhp_dollar',
  'cm$': 'cm_dollar',
  'fm$': 'fm_dollar',
  'gm$': 'gm_dollar',
  'ptam': 'ptam',
  'milk': 'ptam',
  'ptaf': 'ptaf',
  'fat': 'ptaf',
  'ptaf%': 'ptaf_pct',
  'ptap': 'ptap',
  'protein': 'ptap',
  'ptap%': 'ptap_pct',
  'cfp': 'cfp',
  'f sav': 'f_sav',
  
  // Type & conformation
  'ptat': 'ptat',
  'udc': 'udc',
  'flc': 'flc',
  'sta': 'sta',
  'str': 'str',
  'dfm': 'dfm',
  'rua': 'rua',
  'rls': 'rls',
  'rtp': 'rtp',
  'ftl': 'ftl',
  'rw': 'rw',
  'rlr': 'rlr',
  'fta': 'fta',
  'fls': 'fls',
  'fua': 'fua',
  'ruh': 'ruh',
  'ruw': 'ruw',
  'ucl': 'ucl',
  'udp': 'udp',
  'ftp': 'ftp',
  
  // Health & fertility
  'pl': 'pl',
  'dpr': 'dpr',
  'liv': 'liv',
  'scs': 'scs',
  'mast': 'mast',
  'met': 'met',
  'rp': 'rp',
  'da': 'da',
  'ket': 'ket',
  'mf': 'mf',
  'h liv': 'h_liv',
  
  // Calving
  'sce': 'sce',
  'dce': 'dce',
  'ssb': 'ssb',
  'dsb': 'dsb',
  'bwc': 'bwc',
  
  // Daughter calving
  'ccr': 'ccr',
  'hcr': 'hcr',
  
  // Feed efficiency
  'fi': 'fi',
  'rfi': 'rfi',
  'gfi': 'gfi',
  
  // Outros campos comuns
  'birthdate': 'birth_date',
  'birth_date': 'birth_date',
  'data_nascimento': 'birth_date',
  'company': 'company',
  'empresa': 'company',
  'beta-casein': 'beta_casein',
  'beta_casein': 'beta_casein',
  'kappa-casein': 'kappa_casein',
  'kappa_casein': 'kappa_casein',
};

// Colunas que devem ser removidas (EXCLUDE)
const EXCLUDED_COLUMNS = [
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
  
  let separator = ';'; // padrão
  let maxCount = semicolonCount;
  
  if (commaCount > maxCount) {
    separator = ',';
    maxCount = commaCount;
  }
  if (tabCount > maxCount) {
    separator = '\t';
  }
  
  console.log('📋 Detected separator:', JSON.stringify(separator), '(count:', maxCount, ')');

  // Parse header
  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
  console.log(`📋 Parsed ${headers.length} headers:`, headers.slice(0, 10));

  if (headers.length < 5) {
    throw new Error(`Formato CSV inválido: apenas ${headers.length} colunas detectadas. Esperado pelo menos 5.`);
  }

  const rows: ParsedCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(separator);
    
    // Pular linhas com número errado de colunas
    if (values.length !== headers.length) {
      console.warn(`⚠️ Row ${i} has ${values.length} values but ${headers.length} headers, skipping`);
      continue;
    }

    const row: ParsedCSVRow = {};
    
    headers.forEach((header, index) => {
      const value = (values[index] || '').trim();
      
      // Ignorar colunas excluídas
      if (EXCLUDED_COLUMNS.includes(header)) {
        return;
      }
      
      // Mapear coluna para nome canônico ou usar original
      const mappedHeader = COLUMN_MAP[header] || header;
      row[mappedHeader] = value;
    });
    
    rows.push(row);
  }

  console.log(`📋 Parsed ${rows.length} rows. Sample first row:`, rows[0]);
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

      // 🔄 REPROCESSAR REGISTROS ANTIGOS DO STAGING PRIMEIRO
      console.log('🔄 Checking for old staging records to reprocess...');
      const { data: oldStagingData, error: oldStagingError } = await supabase
        .from('bulls_import_staging')
        .select('*')
        .eq('uploader_user_id', userId)
        .eq('is_valid', false);

      if (oldStagingData && oldStagingData.length > 0) {
        console.log(`📋 Found ${oldStagingData.length} old records to reprocess`);
        
        let reprocessInserted = 0;
        let reprocessUpdated = 0;
        let reprocessSkipped = 0;
        let reprocessInvalid = 0;

        for (const row of oldStagingData) {
          const rawRow = row.raw_row as ParsedCSVRow;
          const code = rawRow.code?.trim();
          
          if (!code) {
            reprocessInvalid++;
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

          const { data: existing } = await supabase
            .from('bulls')
            .select('id')
            .eq('code', bullData.code)
            .single();

          if (existing) {
            const { error: updateError } = await supabase
              .from('bulls')
              .update(bullData)
              .eq('id', existing.id);

            if (updateError) {
              console.error(`❌ Reprocess update error for ${bullData.code}:`, updateError);
              reprocessSkipped++;
            } else {
              reprocessUpdated++;
            }
          } else {
            const { error: insertError } = await supabase
              .from('bulls')
              .insert(bullData);

            if (insertError) {
              console.error(`❌ Reprocess insert error for ${bullData.code}:`, insertError);
              reprocessSkipped++;
            } else {
              reprocessInserted++;
            }
          }
        }

        console.log(`✅ Reprocessed old staging: ${reprocessInserted} inserted, ${reprocessUpdated} updated, ${reprocessSkipped} skipped, ${reprocessInvalid} invalid`);
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

      // 🔄 COMMIT AUTOMÁTICO: processar staging → bulls imediatamente
      console.log('🚀 Starting automatic commit...');
      
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let invalid = 0;

      // Processar cada linha do staging
      for (const stagingRow of stagingRows) {
        const rawRow = stagingRow.raw_row as ParsedCSVRow;
        
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

        // Tentar inserir ou atualizar em public.bulls
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
          import_batch_id: importBatchId,
          uploader_user_id: userId,
          total_rows: rows.length,
          valid_rows: inserted + updated,
          invalid_rows: invalid,
          inserted,
          updated,
          skipped,
          committed_at: new Date().toISOString(),
        });

      if (logError) {
        console.error('⚠️ Log insert error:', logError);
      }

      console.log(`✅ Auto-commit complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${invalid} invalid`);

      return new Response(
        JSON.stringify({
          import_batch_id: importBatchId,
          headers,
          total_rows: rows.length,
          inserted,
          updated,
          skipped,
          invalid,
          message: '✅ Importação concluída automaticamente! Touros já disponíveis em bulls e bulls_denorm.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ENDPOINT: /auto-commit - Processa TODOS os registros pendentes do staging
    // Este endpoint pode ser chamado para migrar registros existentes
    if (path.endsWith('/auto-commit')) {
      console.log('🚀 Starting auto-commit for all pending staging records...');
      
      // Buscar TODOS os registros não válidos do staging
      const { data: allStagingData, error: allStagingError } = await supabase
        .from('bulls_import_staging')
        .select('*')
        .eq('is_valid', false);

      if (allStagingError) {
        throw new Error(`Erro ao buscar staging: ${allStagingError.message}`);
      }

      if (!allStagingData || allStagingData.length === 0) {
        return new Response(
          JSON.stringify({ 
            message: 'Nenhum registro pendente encontrado no staging',
            inserted: 0,
            updated: 0,
            skipped: 0,
            invalid: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`📋 Processing ${allStagingData.length} pending records from staging`);

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let invalid = 0;

      // Processar cada linha do staging
      for (const row of allStagingData) {
        const rawRow = row.raw_row as ParsedCSVRow;
        
        const code = rawRow.code?.trim();
        if (!code) {
          invalid++;
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

        const { data: existing } = await supabase
          .from('bulls')
          .select('id')
          .eq('code', bullData.code)
          .single();

        if (existing) {
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

      console.log(`✅ Auto-commit complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${invalid} invalid`);

      return new Response(
        JSON.stringify({
          total_processed: allStagingData.length,
          inserted,
          updated,
          skipped,
          invalid,
          message: '✅ Migração automática concluída! Touros disponíveis em bulls e bulls_denorm.'
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
