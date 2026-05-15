## Objetivo

Criar um segundo frontend (cópia deste ToolSS) que consome o MESMO backend Supabase (`odactdxpecpiyiyaqfgi`), com repositório GitHub independente, para você ajustar layout/nomes sem afetar este projeto.

## Como fazer (passo a passo, executado por você)

### 1. Remix do projeto atual
- Na sidebar/dashboard do Lovable: clique nos três pontos (⋯) do projeto ToolSS → **Remix**.
- Isso cria um novo projeto Lovable com cópia idêntica do código-fonte deste frontend.
- O Remix **NÃO duplica o backend Supabase** — ele apenas copia o código. Por padrão, porém, o novo projeto fica desconectado de qualquer Supabase.

### 2. Conectar o novo projeto ao MESMO Supabase
- No novo projeto remixado, abra o menu **(+) → Supabase → Connect**.
- Autentique e selecione o projeto Supabase existente: **odactdxpecpiyiyaqfgi** (ToolSS).
- Isso popula automaticamente `.env` do novo projeto com as mesmas `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID`.
- Resultado: ambos frontends compartilham banco, auth, RLS, edge functions, storage e usuários.

### 3. Criar novo repositório GitHub para o clone
- No novo projeto: menu **(+) → GitHub → Connect project → Create Repository**.
- Escolha um nome diferente (ex: `toolss-white-label`). O Lovable cria um repo novo, separado do repo deste ToolSS, com sync bidirecional próprio.

### 4. Ajustes obrigatórios no clone (após remix)
Logo no primeiro prompt do novo projeto, peça para:
- Conferir `src/integrations/supabase/client.ts` — deve apontar para `odactdxpecpiyiyaqfgi` (já vai estar correto se o connect foi feito).
- Trocar nome do app, logo e títulos (ex: substituir "ToolSS" pelos novos termos).
- Ajustar `index.html` (title, meta description) e `src/assets/toolss-logo.png`.

### 5. Mudanças de layout/nomes
Faça no novo projeto, normalmente via chat com a IA. Como o backend é o mesmo, qualquer dado/edge function/migration que você altere via ToolSS reflete no clone e vice-versa.

## Pontos de atenção

- **Migrations de banco**: rode migrations a partir de UM dos projetos apenas (recomendo manter este ToolSS como "dono" do schema). O outro projeto consome o mesmo schema sem precisar duplicar SQL.
- **Edge functions**: também são compartilhadas. Se editar uma edge function no clone, ela é redeployada no Supabase comum — afetando os dois frontends. Se quiser comportamento diferente, crie funções com nomes distintos (ex: `import-bulls-v2`).
- **Auth**: usuários logam com a mesma conta nos dois apps. RLS via `user_farms` continua valendo igual.
- **Secrets**: ficam no Supabase, então já estão disponíveis nas edge functions do clone — sem reconfiguração.
- **types.ts**: o arquivo `src/integrations/supabase/types.ts` é regenerado automaticamente pela conexão Supabase, ficará idêntico nos dois projetos.
- **Memórias do Lovable**: as memórias deste projeto NÃO migram. O clone começa com memória vazia — peça para a IA recriar o que for relevante conforme avança.

## Riscos

- Edição simultânea da mesma migration/edge function nos dois projetos pode dar conflito no Supabase. Defina qual projeto faz mudanças de backend.
- Se um dia quiser separar os bancos (clone vira produto independente), terá que exportar dados e criar novo Supabase — não é trivial depois que houver dados misturados.

## O que eu (Lovable neste projeto) preciso fazer

Nada. Todo o fluxo acima é executado por você na UI do Lovable + GitHub. Este projeto ToolSS continua intacto. Quando o clone estiver criado e conectado, você trabalha nele como um projeto Lovable normal.
