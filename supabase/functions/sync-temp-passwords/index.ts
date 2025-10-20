import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    // Criar cliente com service role key (admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Buscar profiles com senhas temporárias
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, temporary_password')
      .not('temporary_password', 'is', null)
      .not('email', 'is', null);

    if (profilesError) {
      throw new Error(`Erro ao buscar profiles: ${profilesError.message}`);
    }

    console.log(`Sincronizando ${profiles?.length || 0} senhas...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Atualizar senha de cada usuário
    for (const profile of profiles || []) {
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          profile.id,
          { password: profile.temporary_password }
        );

        if (updateError) {
          console.error(`Erro ao atualizar ${profile.email}:`, updateError);
          errorCount++;
          results.push({
            email: profile.email,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`✓ Senha sincronizada: ${profile.email}`);
          successCount++;
          results.push({
            email: profile.email,
            success: true
          });

          // Registrar no log
          await supabaseAdmin
            .from('password_reset_log')
            .insert({
              user_id: profile.id,
              email: profile.email,
              reset_by: 'sync-temp-passwords',
              notes: 'Senha temporária sincronizada automaticamente'
            });
        }
      } catch (error: any) {
        console.error(`Exceção ao processar ${profile.email}:`, error);
        errorCount++;
        results.push({
          email: profile.email,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: profiles?.length || 0,
        successCount,
        errorCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
