# Plano de reorganização do front e ajuste do Supabase para o rebanho

> **Resumo rápido:**
> - **Hook único (`useFemalesByFarm`)** para HerdPage e SegmentationPage, reaproveitando o fluxo `fetchFemalesDenormByFarm`.
> - **Painel de diagnóstico compartilhado** informando qual fonte do Supabase respondeu ou falhou.
> - **Script SQL** reinstalando a RPC `get_females_denorm`, a view de fallback e as políticas de RLS obrigatórias.
> - **Checklist de execução** cobrindo implantação no banco, migração das páginas e testes.

## 1. Objetivos

1. Garantir que tanto a página **Rebanho** quanto **Segmentação** compartilhem o mesmo fluxo de leitura de fêmeas, incluindo telemetria de diagnóstico sobre qual fonte do Supabase respondeu ou falhou.
2. Permitir que o frontend reporte os erros recebidos do Supabase de forma consistente para que a equipe consiga depurar bloqueios de RLS ou objetos ausentes.
3. Consolidar a camada SQL (RPC, view pública e políticas) necessária para que o pipeline `get_females_denorm → females_public_by_farm_view → females_denorm` funcione com RLS endurecido.

## 2. Reorganização sugerida no frontend

> Os pontos abaixo reaproveitam o `fetchFemalesDenormByFarm` com *callbacks* de diagnóstico já presentes hoje.【F:src/supabase/queries/females.ts†L15-L210】 

1. **Extrair um hook compartilhado (`useFemalesByFarm`).** 
   - Responsável por executar `fetchFemalesDenormByFarm`, consolidar o estado `loading/data/error` e expor o vetor de eventos `sourceDiagnostics`. 
   - HerdPage, SegmentationPage e demais telas que dependem da lista de fêmeas passam apenas `farmId` e recebem dados prontos. 
   - O hook pode ficar em `src/hooks/useFemalesByFarm.ts` e utilizar `useEffect` + `AbortController` para evitar *race conditions* em trocas rápidas de fazenda.

2. **Centralizar o tratamento de erros e toasts.** 
   - O hook retorna o último `PostgrestError` (quando houver), permitindo que cada página decida entre `toast`, `alert` ou fallback para dados demo. 
   - Reutilize o formato de mensagem que já aparece no HerdPage para manter consistência.【F:src/components/HerdPage.tsx†L57-L236】

3. **Compartilhar o painel de diagnóstico.** 
   - Extraia o alerta atualmente renderizado no HerdPage para um componente reutilizável `FemaleSourceDiagnosticsPanel`. 
   - Em SegmentationPage basta posicionar o componente próximo ao cabeçalho para que o usuário veja as mesmas badges com `start/success/error` e possa copiar o log caso precise abrir chamado.【F:src/components/HerdPage.tsx†L237-L394】【F:src/components/SegmentationPage.tsx†L320-L397】

4. **Atualizar contadores derivados.** 
   - HerdPage continua derivando categorias (`Bezerra`, `Novilha`, etc.) a partir do array retornado pelo hook; nenhuma mudança de regra de negócio é necessária.【F:src/components/HerdPage.tsx†L96-L206】
   - SegmentationPage mantém a lógica atual de filtros e classificações, apenas consumindo o array do hook (sem duplicar o fetch).

5. **Adicionar testes de fumaça.** 
   - Cubra o hook com um teste de unidade simples (usando `@testing-library/react-hooks` ou `vitest`) que simule: sucesso na RPC, fallback para view e erro final.

## 3. Script SQL recomendado no Supabase

> Rode em um deploy migration (ex.: `supabase db push`) ou diretamente no painel SQL. Ajuste nomes de tabelas auxiliares (como `farm_members`) caso sua instância utilize nomes diferentes.

```sql
-- 1. Função que centraliza o acesso com RLS
create or replace function public.get_females_denorm(target_farm_id uuid)
returns setof public.females_denorm
language plpgsql
security definer
set search_path = public
as $$
declare
  effective_farm_id uuid;
begin
  if target_farm_id is null then
    raise exception 'target_farm_id não pode ser nulo';
  end if;

  if not public.is_farm_member(target_farm_id) then
    raise exception 'Usuário sem permissão para acessar a fazenda %', target_farm_id;
  end if;

  for effective_farm_id in
    select distinct fm.farm_id
    from public.farm_members fm
    where fm.farm_id = target_farm_id
      and fm.profile_id = auth.uid()
  loop
    return query
      select fd.*
      from public.females_denorm fd
      where fd.farm_id = effective_farm_id;
  end loop;

  return;
end;
$$;

grant execute on function public.get_females_denorm(uuid) to authenticated;
revoke execute on function public.get_females_denorm(uuid) from anon;

-- 2. View pública utilizada como fallback
create or replace view public.females_public_by_farm_view as
select fd.*
from public.females_denorm fd
where public.is_farm_member(fd.farm_id);

-- 3. Regras de RLS que garantem acesso somente a membros da fazenda
alter table if exists public.females_denorm enable row level security;
alter table if exists public.females_denorm force row level security;

drop policy if exists "Farm members can access females_denorm" on public.females_denorm;
create policy "Farm members can access females_denorm"
  on public.females_denorm
  for select
  using (
    auth.uid() is not null
    and farm_id is not null
    and public.is_farm_member(farm_id)
  );
```

Se a instância utilizar views materiais ou precisar liberar colunas específicas, acrescente grants adicionais após o passo 3.

## 4. Sequência sugerida de execução

1. Aplicar o script SQL acima no Supabase e validar que `select * from public.get_females_denorm('<farm_uuid>')` funciona tanto para usuários membros quanto para não membros (esperado erro nesse caso). 
2. Implementar o hook `useFemalesByFarm` e migrar HerdPage + SegmentationPage para usá-lo. Verificar que o painel de diagnósticos exibe a sequência `RPC → View → Tabela` quando há fallback. 
3. Executar `npm run lint` e um smoke test manual navegando pelas duas páginas. 
4. Documentar qualquer ajuste específico da instância (por exemplo, nomes diferentes de colunas) neste mesmo arquivo.
