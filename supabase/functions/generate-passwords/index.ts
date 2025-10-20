import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResult {
  email: string;
  password: string;
  success: boolean;
  error?: string;
}

function generatePassword(index: number): string {
  const letters = ['s', 's', 'b'];
  const numbers = ['2', '0', '2', '5'];
  const symbol = '*';
  
  // Diferentes combinações
  const patterns = [
    // Padrão: Letra maiúscula no início
    () => {
      const [l1, l2, l3] = letters;
      const upperIndex = index % 3;
      const ls = [l1, l2, l3].map((l, i) => i === upperIndex ? l.toUpperCase() : l);
      return `${ls.join('')}${numbers.join('')}${symbol}`;
    },
    // Padrão: números, letras, símbolo
    () => {
      const [l1, l2, l3] = letters;
      const upperIndex = index % 3;
      const ls = [l1, l2, l3].map((l, i) => i === upperIndex ? l.toUpperCase() : l);
      return `${numbers.join('')}${ls.join('')}${symbol}`;
    },
    // Padrão: letras intercaladas com números e símbolo
    () => {
      const [l1, l2, l3] = letters;
      const [n1, n2, n3, n4] = numbers;
      const upperIndex = index % 3;
      const ls = [l1, l2, l3].map((l, i) => i === upperIndex ? l.toUpperCase() : l);
      return `${ls[0]}${n1}${ls[1]}${n2}${ls[2]}${n3}${n4}${symbol}`;
    },
    // Padrão: símbolo no início
    () => {
      const [l1, l2, l3] = letters;
      const upperIndex = index % 3;
      const ls = [l1, l2, l3].map((l, i) => i === upperIndex ? l.toUpperCase() : l);
      return `${symbol}${ls.join('')}${numbers.join('')}`;
    },
    // Padrão: símbolo no meio
    () => {
      const [l1, l2, l3] = letters;
      const [n1, n2, n3, n4] = numbers;
      const upperIndex = index % 3;
      const ls = [l1, l2, l3].map((l, i) => i === upperIndex ? l.toUpperCase() : l);
      return `${ls.join('')}${symbol}${numbers.join('')}`;
    },
    // Padrão: invertido
    () => {
      const [l1, l2, l3] = letters;
      const upperIndex = index % 3;
      const ls = [l1, l2, l3].map((l, i) => i === upperIndex ? l.toUpperCase() : l);
      return `${symbol}${numbers.reverse().join('')}${ls.reverse().join('')}`;
    },
  ];
  
  const patternIndex = index % patterns.length;
  return patterns[patternIndex]();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente admin do Supabase
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

    // Buscar todos os profiles com email
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .not('email', 'is', null)
      .neq('email', '');

    if (profilesError) {
      throw new Error(`Erro ao buscar profiles: ${profilesError.message}`);
    }

    console.log(`Processando ${profiles?.length || 0} profiles`);

    const results: PasswordResult[] = [];

    // Para cada profile, gerar senha e atualizar
    for (let i = 0; i < (profiles?.length || 0); i++) {
      const profile = profiles![i];
      const password = generatePassword(i);

      try {
        // Atualizar senha do usuário
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          profile.id,
          { password }
        );

        if (updateError) {
          console.error(`Erro ao atualizar senha para ${profile.email}:`, updateError);
          results.push({
            email: profile.email,
            password: password,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`Senha atualizada para ${profile.email}`);
          results.push({
            email: profile.email,
            password: password,
            success: true
          });
        }
      } catch (error: any) {
        console.error(`Exceção ao atualizar ${profile.email}:`, error);
        results.push({
          email: profile.email,
          password: password,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        total: results.length,
        successful,
        failed,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Erro geral:', error);
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
