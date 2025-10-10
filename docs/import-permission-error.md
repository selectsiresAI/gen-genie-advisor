# Erro de importação "Permission denied"

Quando a tela de importação de fêmeas tenta salvar os registros ela usa o Supabase para inserir diretamente na tabela `public.females`.
Se o Supabase retornar `Permission denied`, significa que a política de Row Level Security (RLS) bloqueou o `INSERT` porque o usuário autenticado não tem permissão de edição na fazenda.

## Como o fluxo funciona

* O componente `FemaleUploadModal` monta o lote de linhas do arquivo e chama `supabase.from('females').insert(...)` para gravá-las no banco.【F:src/components/FemaleUploadModal.tsx†L572-L588】
* A tabela `public.females` possui uma política RLS chamada "Farm editors can insert females". Ela só autoriza o `INSERT` quando a função `public.can_edit_farm(farm_id)` devolve `true` — ou seja, o usuário precisa estar vinculado à fazenda na tabela `public.user_farms` com papel `owner` ou `editor`.【F:supabase/migrations/20250922140345_58dc611c-e86e-4c42-9404-ed9e8a59c741.sql†L238-L275】

Se o vínculo existir mas o papel for `viewer` (ou não houver linha correspondente), a função `can_edit_farm` retorna `false` e a política bloqueia a operação, resultando no erro `Permission denied`.

## Como resolver

1. Confirme que o usuário está na tabela `public.user_farms` da fazenda correta.
2. Ajuste o campo `role` para `editor` ou `owner` (ou peça a alguém com permissão para fazê-lo) antes de refazer o upload.
3. Caso a importação deva ser liberada para outros papéis, será necessário alterar as políticas RLS em Supabase para contemplar o novo cenário.

Após garantir que o usuário possa editar a fazenda, o upload passa a funcionar normalmente.
