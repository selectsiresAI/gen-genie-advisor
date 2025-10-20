import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { csvText } = await req.json();

    if (!csvText) {
      return new Response(
        JSON.stringify({ error: 'CSV text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lines = csvText.split('\n').filter((line: string) => line.trim());
    const results = {
      total: lines.length - 1, // Subtract header
      success: 0,
      errors: [] as any[],
      skipped: 0
    };

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
        // Find technician by EXACT name match (normalize spaces and case)
        const normalizedTechName = technicianName.trim().toLowerCase();
        const { data: technicians, error: techError } = await supabase
          .from('profiles')
          .select('id, full_name');

        if (techError || !technicians) {
          results.errors.push({
            line: i + 1,
            error: 'Error fetching technician',
            technician: technicianName,
            details: techError?.message
          });
          continue;
        }

        // Find exact match (case insensitive, whitespace normalized)
        const matchedTech = technicians.find(t => 
          t.full_name.trim().toLowerCase() === normalizedTechName
        );

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

        // Find farm by EXACT name or owner match
        const normalizedFarmName = farmName.trim().toLowerCase();
        const normalizedOwnerName = ownerName.trim().toLowerCase();
        
        const { data: farms, error: farmError } = await supabase
          .from('farms')
          .select('id, name, owner_name');

        if (farmError || !farms) {
          results.errors.push({
            line: i + 1,
            error: 'Error fetching farm',
            farm: farmName,
            details: farmError?.message
          });
          continue;
        }

        // Find exact match by farm name OR owner name
        const matchedFarm = farms.find(f => 
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

        // Check if link already exists
        const { data: existing } = await supabase
          .from('user_farms')
          .select('id')
          .eq('user_id', technicianId)
          .eq('farm_id', farmId)
          .single();

        if (existing) {
          results.skipped++;
          continue;
        }

        // Create link
        const { error: insertError } = await supabase
          .from('user_farms')
          .insert({
            user_id: technicianId,
            farm_id: farmId,
            role: 'technician'
          });

        if (insertError) {
          results.errors.push({
            line: i + 1,
            error: insertError.message,
            technician: technicianName,
            farm: farmName
          });
        } else {
          results.success++;
        }

      } catch (error) {
        results.errors.push({
          line: i + 1,
          error: error.message,
          technician: technicianName,
          farm: farmName
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Import completed',
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-farm-technicians:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
