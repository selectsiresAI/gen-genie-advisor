import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🚀 Starting staging migration...');

    const results = {
      profiles: { inserted: 0, updated: 0, errors: 0 },
      farms: { inserted: 0, updated: 0, errors: 0 },
      females: { inserted: 0, updated: 0, errors: 0 },
      passwords: [] as Array<{ email: string; password: string }>,
    };

    // STEP 1: Migrate staging_profiles → profiles + auth.users
    console.log('📋 Step 1: Migrating profiles...');
    const { data: stagingProfiles, error: profilesError } = await supabase
      .from('staging_profiles')
      .select('*')
      .is('imported_at', null);

    if (profilesError) {
      console.error('❌ Error fetching staging_profiles:', profilesError);
      throw profilesError;
    }

    const profileMapping = new Map<string, string>(); // email -> uuid

    for (const sp of stagingProfiles || []) {
      try {
        // Generate random password
        const password = crypto.randomUUID().substring(0, 12);
        
        // Check if user already exists in auth.users
        const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
        const authUser = existingAuthUser?.users?.find(u => u.email === sp.email);

        let userId: string;

        if (authUser) {
          userId = authUser.id;
          console.log(`✅ User already exists in auth: ${sp.email}`);
          
          // Update existing profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: sp.full_name || sp.email,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (updateError) {
            console.error(`❌ Error updating profile ${sp.email}:`, updateError);
            results.profiles.errors++;
          } else {
            results.profiles.updated++;
          }
        } else {
          // Create new auth user
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
            continue;
          }

          userId = newAuthUser.user.id;
          console.log(`✅ Created auth user: ${sp.email}`);
          
          // Profile should be auto-created by trigger, but verify
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

          if (!newProfile) {
            // Manually create profile if trigger didn't fire
            await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: sp.email,
                full_name: sp.full_name || sp.email,
              });
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
      }
    }

    // STEP 2: Migrate staging_farms → farms
    console.log('📋 Step 2: Migrating farms...');
    const { data: stagingFarms, error: farmsError } = await supabase
      .from('staging_farms')
      .select('*')
      .is('imported_at', null);

    if (farmsError) {
      console.error('❌ Error fetching staging_farms:', farmsError);
      throw farmsError;
    }

    const farmMapping = new Map<string, string>(); // raw_id -> uuid

    for (const sf of stagingFarms || []) {
      try {
        // Find the creator profile by email
        const creatorEmail = sf.created_by_email;
        let creatorId = profileMapping.get(creatorEmail);

        if (!creatorId) {
          // Try to find existing profile
          const { data: existingCreator } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', creatorEmail)
            .maybeSingle();

          if (existingCreator) {
            creatorId = existingCreator.id;
            profileMapping.set(creatorEmail, creatorId);
          } else {
            console.warn(`⚠️ Creator not found for farm ${sf.name}, using first admin...`);
            // Use first available profile as fallback
            const { data: fallbackProfile } = await supabase
              .from('profiles')
              .select('id')
              .limit(1)
              .maybeSingle();
            
            if (fallbackProfile) {
              creatorId = fallbackProfile.id;
            } else {
              console.error(`❌ No profiles found, cannot create farm ${sf.name}`);
              results.farms.errors++;
              continue;
            }
          }
        }

        // Check if farm already exists
        const { data: existingFarm } = await supabase
          .from('farms')
          .select('id')
          .eq('name', sf.name)
          .eq('owner_name', sf.owner_name)
          .maybeSingle();

        if (existingFarm) {
          farmMapping.set(sf.raw_id, existingFarm.id);
          results.farms.updated++;
          console.log(`✅ Farm already exists: ${sf.name}`);
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
            continue;
          }

          farmMapping.set(sf.raw_id, newFarm.id);

          // Add creator as owner in user_farms
          await supabase.from('user_farms').insert({
            user_id: creatorId,
            farm_id: newFarm.id,
            role: 'owner',
          });

          console.log(`✅ Inserted farm: ${sf.name} (${newFarm.id})`);
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
      }
    }

    // STEP 3: Migrate staging_females → females
    console.log('📋 Step 3: Migrating females...');
    const { data: stagingFemales, error: femalesError } = await supabase
      .from('staging_females')
      .select('*')
      .is('imported_at', null);

    if (femalesError) {
      console.error('❌ Error fetching staging_females:', femalesError);
      throw femalesError;
    }

    for (const sf of stagingFemales || []) {
      try {
        // Find the farm UUID
        const farmUuid = farmMapping.get(sf.farm_id);
        
        if (!farmUuid) {
          // Try to find farm by name
          const { data: existingFarm } = await supabase
            .from('farms')
            .select('id')
            .eq('name', sf.farm_name)
            .maybeSingle();

          if (existingFarm) {
            farmMapping.set(sf.farm_id, existingFarm.id);
          } else {
            console.warn(`⚠️ Farm not found for female ${sf.name} (farm_id: ${sf.farm_id})`);
            results.females.errors++;
            continue;
          }
        }

        const finalFarmId = farmMapping.get(sf.farm_id);

        // Parse birth_date
        let birthDate: string | null = null;
        if (sf.birth_date) {
          try {
            const parts = sf.birth_date.split('/');
            if (parts.length === 3) {
              birthDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
          } catch (e) {
            console.warn(`⚠️ Invalid birth_date for female ${sf.name}: ${sf.birth_date}`);
          }
        }

        // Check if female already exists
        const { data: existingFemale } = await supabase
          .from('females')
          .select('id')
          .eq('farm_id', finalFarmId)
          .eq('cdcb_id', sf.cdcb_id || sf.numero_registro || '')
          .maybeSingle();

        const femaleData: any = {
          farm_id: finalFarmId,
          name: sf.name || 'Sem nome',
          identifier: sf.identifier,
          cdcb_id: sf.cdcb_id || sf.numero_registro,
          birth_date: birthDate,
          parity_order: sf.parity_order ? parseInt(sf.parity_order) : null,
          category: sf.category,
          sire_naab: sf.sire_naab,
          mgs_naab: sf.mgs_naab,
          mmgs_naab: sf.mmgs_naab,
          beta_casein: sf.beta_casein,
          kappa_casein: sf.kappa_casein,
          fonte: sf.fonte || 'Importação Staging',
          // PTAs
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
          // Update existing female
          const { error: updateError } = await supabase
            .from('females')
            .update(femaleData)
            .eq('id', existingFemale.id);

          if (updateError) {
            console.error(`❌ Error updating female ${sf.name}:`, updateError);
            results.females.errors++;
          } else {
            console.log(`✅ Updated female: ${sf.name}`);
            results.females.updated++;
          }
        } else {
          // Insert new female
          const { error: insertError } = await supabase
            .from('females')
            .insert(femaleData);

          if (insertError) {
            console.error(`❌ Error inserting female ${sf.name}:`, insertError);
            results.females.errors++;
          } else {
            console.log(`✅ Inserted female: ${sf.name}`);
            results.females.inserted++;
          }
        }

        // Mark as imported
        await supabase
          .from('staging_females')
          .update({ imported_at: new Date().toISOString() })
          .eq('raw_id', sf.raw_id);

      } catch (error) {
        console.error(`❌ Error processing female ${sf.name}:`, error);
        results.females.errors++;
      }
    }

    console.log('✅ Migration complete!');
    console.log('Results:', results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        passwords: results.passwords,
        message: 'Migration completed successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Migration error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
