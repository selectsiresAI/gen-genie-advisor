import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALLOWED_ORIGINS = [
  'https://toolss-ssb.lovable.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT token
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: claimsData.claims.sub, _role: 'admin' });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { csvText } = await req.json();

    if (!csvText) {
      return new Response(
        JSON.stringify({ error: 'CSV text is required' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const lines = csvText.split('\n').filter((line: string) => line.trim());
    const results = {
      total: lines.length - 1, // Subtract header
      success: 0,
      errors: [] as any[],
      skipped: 0
    };

    // Pre-fetch ALL profiles and farms ONCE (avoids N+2 queries per CSV line)
    const { data: allProfiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, full_name');
    if (profilesErr) throw new Error(`Error fetching profiles: ${profilesErr.message}`);

    const { data: allFarms, error: farmsErr } = await supabase
      .from('farms')
      .select('id, name, owner_name');
    if (farmsErr) throw new Error(`Error fetching farms: ${farmsErr.message}`);

    // Build lookup maps (normalized name -> record)
    const techMap = new Map<string, { id: string; full_name: string }>();
    for (const t of allProfiles || []) {
      if (t.full_name) techMap.set(t.full_name.trim().toLowerCase(), t);
    }

    // Pre-fetch existing user_farms links to avoid per-row check
    const { data: allLinks } = await supabase
      .from('user_farms')
      .select('user_id, farm_id');
    const linkSet = new Set((allLinks || []).map(l => `${l.user_id}:${l.farm_id}`));

    // Collect inserts for batch operation
    const toInsert: Array<{ user_id: string; farm_id: string; role: string }> = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(';');

      if (parts.length < 5) {
        results.errors.push({
          line: i + 1,
          error: 'Invalid line format',
          data: line
        });
        continue;
      }

      const [ownerName, , farmName, technicianName] = parts;

      try {
        // Find technician from pre-loaded map
        const normalizedTechName = technicianName.trim().toLowerCase();
        const matchedTech = techMap.get(normalizedTechName);

        if (!matchedTech) {
          results.errors.push({
            line: i + 1,
            error: 'Technician not found',
            technician: technicianName,
            searched: normalizedTechName
          });
          continue;
        }

        const technicianId = matchedTech.id;

        // Find farm from pre-loaded list
        const normalizedFarmName = farmName.trim().toLowerCase();
        const normalizedOwnerName = ownerName.trim().toLowerCase();

        const matchedFarm = (allFarms || []).find(f =>
          f.name.trim().toLowerCase() === normalizedFarmName ||
          f.owner_name.trim().toLowerCase() === normalizedOwnerName
        );

        if (!matchedFarm) {
          results.errors.push({
            line: i + 1,
            error: 'Farm not found',
            technician: technicianName,
            farm: farmName,
            owner: ownerName
          });
          continue;
        }

        const farmId = matchedFarm.id;

        // Check if link already exists using pre-loaded set
        if (linkSet.has(`${technicianId}:${farmId}`)) {
          results.skipped++;
          continue;
        }

        toInsert.push({ user_id: technicianId, farm_id: farmId, role: 'technician' });
        linkSet.add(`${technicianId}:${farmId}`); // prevent duplicates within same CSV
        results.success++;

      } catch (error) {
        results.errors.push({
          line: i + 1,
          error: error.message,
          technician: technicianName,
          farm: farmName
        });
      }
    }

    // Batch insert all links at once
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('user_farms').insert(toInsert);
      if (insertError) {
        // Fallback: insert one by one to identify which ones fail
        let batchFails = 0;
        for (const row of toInsert) {
          const { error: singleErr } = await supabase.from('user_farms').insert(row);
          if (singleErr) {
            batchFails++;
            results.errors.push({ error: singleErr.message, technician: row.user_id, farm: row.farm_id });
          }
        }
        results.success -= batchFails;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Import completed',
        results
      }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-farm-technicians:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
