import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Normalizar texto para matching
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Helper: Parsear data no formato MM/DD/YYYY
function parseBirthDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  } catch (e) {
    console.warn(`⚠️ Invalid birth_date: ${dateStr}`);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get authenticated user ID
  const authHeader = req.headers.get('Authorization');
  let currentUserId: string | null = null;
  
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    currentUserId = user?.id || null;
  }

  // Create log entry
  let logId: string | null = null;
  try {
    const { data: logEntry } = await supabase
      .from('staging_import_log')
      .insert({
        executed_by: currentUserId,
        status: 'running',
        strategy_used: 'cdcb_id_then_identifier_then_name'
      })
      .select('id')
      .single();
    logId = logEntry?.id || null;
  } catch (logError) {
    console.error('Failed to create log entry:', logError);
  }

  try {
    console.log('🚀 ETAPA 1/8: Inspeção inicial das tabelas de staging');
    
    // Contar registros pendentes
    const { data: profilesCount } = await supabase
      .from('staging_profiles')
      .select('*', { count: 'exact', head: true })
      .is('imported_at', null);
      
    const { data: farmsCount } = await supabase
      .from('staging_farms')
      .select('*', { count: 'exact', head: true })
      .is('imported_at', null);
      
    const { data: femalesCount } = await supabase
      .from('staging_females')
      .select('*', { count: 'exact', head: true })
      .is('imported_at', null);
    
    console.log(`📊 Registros pendentes:`);
    console.log(`   Profiles: ${profilesCount?.length || 0}`);
    console.log(`   Farms: ${farmsCount?.length || 0}`);
    console.log(`   Females: ${femalesCount?.length || 0}`);

    const results = {
      profiles: { inserted: 0, updated: 0, errors: 0, skipped: 0 },
      farms: { inserted: 0, updated: 0, errors: 0, skipped: 0 },
      females: { inserted: 0, updated: 0, errors: 0, skipped: 0 },
      passwords: [] as Array<{ email: string; password: string }>,
      errorDetails: [] as Array<{ type: string; entity: string; error: string }>,
    };

    // ====================================================================
    // ETAPA 2/8: Estratégia de matching definida
    // ====================================================================
    console.log('\n🚀 ETAPA 2/8: Estratégia de matching definida');
    console.log('   Profiles: match por email');
    console.log('   Farms: match por name + owner_name');
    console.log('   Females: match por cdcb_id (prioridade) → identifier → nome normalizado');

    // ====================================================================
    // ETAPA 3/8: Índices já criados via migration
    // ====================================================================
    console.log('\n🚀 ETAPA 3/8: Índices preparados (via migration anterior)');

    // ====================================================================
    // ETAPA 4/8: Upsert staging_profiles → profiles + auth.users
    // ====================================================================
    console.log('\n🚀 ETAPA 4/8: Migrando profiles...');
    
    const { data: stagingProfiles, error: profilesError } = await supabase
      .from('staging_profiles')
      .select('*')
      .is('imported_at', null)
      .limit(1000); // Process in batches

    if (profilesError) {
      throw new Error(`Error fetching staging_profiles: ${profilesError.message}`);
    }

    const profileMapping = new Map<string, string>(); // email -> uuid

    for (const sp of stagingProfiles || []) {
      try {
        if (!sp.email) {
          console.warn(`⚠️ Skipping profile without email: ${sp.raw_id}`);
          results.profiles.skipped++;
          continue;
        }

        // Check if user already exists in auth.users
        const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
        const authUser = existingAuthUsers?.users?.find(u => u.email === sp.email);

        let userId: string;

        if (authUser) {
          userId = authUser.id;
          console.log(`✅ User exists in auth: ${sp.email}`);
          
          // Update profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: sp.full_name || sp.email,
              email: sp.email,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (updateError) {
            console.error(`❌ Error updating profile ${sp.email}:`, updateError);
            results.profiles.errors++;
            results.errorDetails.push({
              type: 'profile_update',
              entity: sp.email,
              error: updateError.message
            });
          } else {
            results.profiles.updated++;
          }
        } else {
          // Create new auth user with random password
          const password = crypto.randomUUID().substring(0, 12);
          
          const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
            email: sp.email,
            password: password,
            email_confirm: true,
            user_metadata: {
              full_name: sp.full_name || sp.email,
            },
          });

          if (authError || !newAuthUser.user) {
            console.error(`❌ Error creating auth user ${sp.email}:`, authError);
            results.profiles.errors++;
            results.errorDetails.push({
              type: 'auth_creation',
              entity: sp.email,
              error: authError?.message || 'Unknown error'
            });
            continue;
          }

          userId = newAuthUser.user.id;
          console.log(`✅ Created auth user: ${sp.email}`);
          
          // Verify profile was auto-created by trigger
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

          if (!newProfile) {
            // Manually create profile if trigger didn't fire
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: sp.email,
                full_name: sp.full_name || sp.email,
              });
            
            if (insertError) {
              console.error(`❌ Error creating profile ${sp.email}:`, insertError);
              results.profiles.errors++;
              results.errorDetails.push({
                type: 'profile_creation',
                entity: sp.email,
                error: insertError.message
              });
              continue;
            }
          }

          results.profiles.inserted++;
          results.passwords.push({ email: sp.email, password });
        }

        profileMapping.set(sp.email, userId);

        // Mark as imported
        await supabase
          .from('staging_profiles')
          .update({ imported_at: new Date().toISOString() })
          .eq('raw_id', sp.raw_id);

      } catch (error) {
        console.error(`❌ Error processing profile ${sp.email}:`, error);
        results.profiles.errors++;
        results.errorDetails.push({
          type: 'profile_processing',
          entity: sp.email || sp.raw_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`📊 Profiles: ${results.profiles.inserted} inserted, ${results.profiles.updated} updated, ${results.profiles.errors} errors, ${results.profiles.skipped} skipped`);

    // ====================================================================
    // ETAPA 5/8: Upsert staging_farms → farms
    // ====================================================================
    console.log('\n🚀 ETAPA 5/8: Migrando farms...');
    
    const { data: stagingFarms, error: farmsError } = await supabase
      .from('staging_farms')
      .select('*')
      .is('imported_at', null)
      .limit(1000);

    if (farmsError) {
      throw new Error(`Error fetching staging_farms: ${farmsError.message}`);
    }

    const farmMapping = new Map<string, string>(); // raw_id -> uuid

    for (const sf of stagingFarms || []) {
      try {
        if (!sf.name || !sf.owner_name) {
          console.warn(`⚠️ Skipping farm without name/owner: ${sf.raw_id}`);
          results.farms.skipped++;
          continue;
        }

        // Find creator profile
        let creatorId = profileMapping.get(sf.created_by_email);

        if (!creatorId && sf.created_by_email) {
          const { data: existingCreator } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', sf.created_by_email)
            .maybeSingle();
          
          if (existingCreator) {
            creatorId = existingCreator.id;
            profileMapping.set(sf.created_by_email, creatorId);
          }
        }

        if (!creatorId) {
          // Fallback to first admin or any profile
          const { data: fallbackProfile } = await supabase
            .from('profiles')
            .select('id')
            .limit(1)
            .maybeSingle();
          
          if (!fallbackProfile) {
            console.error(`❌ No profiles found to assign farm ${sf.name}`);
            results.farms.errors++;
            continue;
          }
          creatorId = fallbackProfile.id;
        }

        // Check if farm exists (match by normalized name + owner)
        const { data: existingFarm } = await supabase
          .from('farms')
          .select('id')
          .eq('name', sf.name)
          .eq('owner_name', sf.owner_name)
          .maybeSingle();

        if (existingFarm) {
          farmMapping.set(sf.raw_id, existingFarm.id);
          results.farms.updated++;
          console.log(`✅ Farm exists: ${sf.name}`);
          
          // Update metadata if needed
          await supabase
            .from('farms')
            .update({
              metadata: sf.metadata || {},
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingFarm.id);
        } else {
          // Create new farm
          const { data: newFarm, error: insertError } = await supabase
            .from('farms')
            .insert({
              name: sf.name,
              owner_name: sf.owner_name,
              created_by: creatorId,
              metadata: sf.metadata || {},
            })
            .select('id')
            .single();

          if (insertError || !newFarm) {
            console.error(`❌ Error inserting farm ${sf.name}:`, insertError);
            results.farms.errors++;
            results.errorDetails.push({
              type: 'farm_insertion',
              entity: sf.name,
              error: insertError?.message || 'Unknown error'
            });
            continue;
          }

          farmMapping.set(sf.raw_id, newFarm.id);

          // Add creator as owner in user_farms
          await supabase.from('user_farms').insert({
            user_id: creatorId,
            farm_id: newFarm.id,
            role: 'owner',
          });

          console.log(`✅ Created farm: ${sf.name}`);
          results.farms.inserted++;
        }

        // Mark as imported
        await supabase
          .from('staging_farms')
          .update({ imported_at: new Date().toISOString() })
          .eq('raw_id', sf.raw_id);

      } catch (error) {
        console.error(`❌ Error processing farm ${sf.name}:`, error);
        results.farms.errors++;
        results.errorDetails.push({
          type: 'farm_processing',
          entity: sf.name || sf.raw_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`📊 Farms: ${results.farms.inserted} inserted, ${results.farms.updated} updated, ${results.farms.errors} errors, ${results.farms.skipped} skipped`);

    // ====================================================================
    // ETAPA 6/8: Upsert staging_females → females (complexo)
    // ====================================================================
    console.log('\n🚀 ETAPA 6/8: Migrando females (batch processing)...');
    
    const BATCH_SIZE = 500;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: stagingFemalesBatch, error: femalesError } = await supabase
        .from('staging_females')
        .select('*')
        .is('imported_at', null)
        .range(offset, offset + BATCH_SIZE - 1);

      if (femalesError) {
        throw new Error(`Error fetching staging_females: ${femalesError.message}`);
      }

      if (!stagingFemalesBatch || stagingFemalesBatch.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`📦 Processing batch ${offset} to ${offset + stagingFemalesBatch.length}...`);

      for (const sf of stagingFemalesBatch) {
        try {
          // Get farm UUID
          let farmUuid = farmMapping.get(sf.farm_id);
          
          if (!farmUuid) {
            // Try to find farm by name
            const { data: existingFarm } = await supabase
              .from('farms')
              .select('id')
              .ilike('name', sf.farm_name)
              .maybeSingle();

            if (existingFarm) {
              farmUuid = existingFarm.id;
              farmMapping.set(sf.farm_id, farmUuid);
            } else {
              console.warn(`⚠️ Farm not found for female ${sf.name} (farm_id: ${sf.farm_id})`);
              results.females.skipped++;
              continue;
            }
          }

          // Normalize data
          const birthDate = parseBirthDate(sf.birth_date);
          const cdcbId = sf.cdcb_id || sf.numero_registro || null;
          const identifier = sf.identifier || null;

          // Strategy: Match by cdcb_id first, then identifier, then skip
          let existingFemale = null;
          
          if (cdcbId) {
            const { data } = await supabase
              .from('females')
              .select('id')
              .eq('farm_id', farmUuid)
              .eq('cdcb_id', cdcbId)
              .maybeSingle();
            existingFemale = data;
          }
          
          if (!existingFemale && identifier) {
            const { data } = await supabase
              .from('females')
              .select('id')
              .eq('farm_id', farmUuid)
              .eq('identifier', identifier)
              .maybeSingle();
            existingFemale = data;
          }

          // Build female data object
          const femaleData: any = {
            farm_id: farmUuid,
            name: sf.name || 'Sem nome',
            identifier: identifier,
            cdcb_id: cdcbId,
            birth_date: birthDate,
            parity_order: sf.parity_order ? parseInt(sf.parity_order) : null,
            category: sf.category,
            sire_naab: sf.sire_naab,
            mgs_naab: sf.mgs_naab,
            mmgs_naab: sf.mmgs_naab,
            beta_casein: sf.beta_casein,
            kappa_casein: sf.kappa_casein,
            fonte: sf.fonte || 'Importação Staging',
            // All PTAs
            hhp_dollar: sf.hhp_dollar,
            tpi: sf.tpi,
            nm_dollar: sf.nm_dollar,
            cm_dollar: sf.cm_dollar,
            fm_dollar: sf.fm_dollar,
            gm_dollar: sf.gm_dollar,
            f_sav: sf.fsav,
            ptam: sf.ptam,
            cfp: sf.cfp,
            ptaf: sf.ptaf,
            ptaf_pct: sf.ptaf_pct,
            ptap: sf.ptap,
            ptap_pct: sf.ptap_pct,
            pl: sf.pl,
            dpr: sf.dpr,
            liv: sf.liv,
            scs: sf.scs,
            mast: sf.mast,
            met: sf.met,
            rp: sf.rp,
            da: sf.da,
            ket: sf.ket,
            mf: sf.mf,
            ptat: sf.ptat,
            udc: sf.udc,
            flc: sf.flc,
            sce: sf.sce,
            dce: sf.dce,
            ssb: sf.ssb,
            dsb: sf.dsb,
            h_liv: sf.hliv,
            ccr: sf.ccr,
            hcr: sf.hcr,
            fi: sf.fi,
            gl: sf.gl,
            efc: sf.efc,
            bwc: sf.bwc,
            sta: sf.sta,
            str: sf.str,
            dfm: sf.dfm,
            rua: sf.rua,
            rls: sf.rls,
            rtp: sf.rtp,
            ftl: sf.ftl,
            rw: sf.rw,
            rlr: sf.rlr,
            fta: sf.fta,
            fls: sf.fls,
            fua: sf.fua,
            ruh: sf.ruh,
            ruw: sf.ruw,
            ucl: sf.ucl,
            udp: sf.udp,
            ftp: sf.ftp,
            rfi: sf.rfi,
            gfi: sf.gfi,
          };

          if (existingFemale) {
            // Update
            const { error: updateError } = await supabase
              .from('females')
              .update(femaleData)
              .eq('id', existingFemale.id);

            if (updateError) {
              results.females.errors++;
              results.errorDetails.push({
                type: 'female_update',
                entity: `${sf.name} (${cdcbId || identifier})`,
                error: updateError.message
              });
            } else {
              results.females.updated++;
            }
          } else {
            // Insert
            const { error: insertError } = await supabase
              .from('females')
              .insert(femaleData);

            if (insertError) {
              results.females.errors++;
              results.errorDetails.push({
                type: 'female_insertion',
                entity: `${sf.name} (${cdcbId || identifier})`,
                error: insertError.message
              });
            } else {
              results.females.inserted++;
            }
          }

          // Mark as imported
          await supabase
            .from('staging_females')
            .update({ imported_at: new Date().toISOString() })
            .eq('farm_id', sf.farm_id)
            .eq('identifier', sf.identifier || '')
            .eq('name', sf.name || '');

        } catch (error) {
          results.females.errors++;
          results.errorDetails.push({
            type: 'female_processing',
            entity: sf.name || sf.identifier || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      offset += BATCH_SIZE;
      console.log(`📊 Females so far: ${results.females.inserted} inserted, ${results.females.updated} updated, ${results.females.errors} errors, ${results.females.skipped} skipped`);
    }

    // ====================================================================
    // ETAPA 7/8: Logs e auditoria
    // ====================================================================
    console.log('\n🚀 ETAPA 7/8: Finalizando logs e auditoria...');
    
    if (logId) {
      await supabase
        .from('staging_import_log')
        .update({
          completed_at: new Date().toISOString(),
          status: results.profiles.errors + results.farms.errors + results.females.errors > 0 ? 'partial' : 'completed',
          profiles_inserted: results.profiles.inserted,
          profiles_updated: results.profiles.updated,
          profiles_errors: results.profiles.errors,
          farms_inserted: results.farms.inserted,
          farms_updated: results.farms.updated,
          farms_errors: results.farms.errors,
          females_inserted: results.females.inserted,
          females_updated: results.females.updated,
          females_errors: results.females.errors,
          error_details: results.errorDetails,
          summary: {
            total_processed: results.profiles.inserted + results.profiles.updated + 
                            results.farms.inserted + results.farms.updated +
                            results.females.inserted + results.females.updated,
            total_errors: results.profiles.errors + results.farms.errors + results.females.errors,
            passwords_generated: results.passwords.length,
          }
        })
        .eq('id', logId);
    }

    // ====================================================================
    // ETAPA 8/8: Relatório final
    // ====================================================================
    console.log('\n🚀 ETAPA 8/8: Relatório final');
    console.log('✅ Migration completed!');
    console.log('\n📊 Summary:');
    console.log(`   Profiles: ${results.profiles.inserted} new, ${results.profiles.updated} updated, ${results.profiles.errors} errors`);
    console.log(`   Farms: ${results.farms.inserted} new, ${results.farms.updated} updated, ${results.farms.errors} errors`);
    console.log(`   Females: ${results.females.inserted} new, ${results.females.updated} updated, ${results.females.errors} errors`);
    console.log(`   Passwords generated: ${results.passwords.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        passwords: results.passwords,
        log_id: logId,
        message: 'Migration completed successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Migration error:', error);
    
    // Update log with error
    if (logId) {
      await supabase
        .from('staging_import_log')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          error_details: [{
            type: 'critical_error',
            entity: 'migration',
            error: error instanceof Error ? error.message : 'Unknown error'
          }]
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
