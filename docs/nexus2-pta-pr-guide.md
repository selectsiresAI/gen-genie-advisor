# Guia: próximos passos para a PR de PTAs fixas (Nexus 2)

Este passo a passo resume o que fazer depois de aplicar as mudanças que padronizam as colunas de PTA na predição individual e no processamento em lote.

1. **Sincronize a branch de trabalho**
   - Garanta que você está em `fix/nexus2-results-fixed-pta-columns`.
   - Rode `git status` para confirmar que não há arquivos pendentes. Se houver, finalize-os antes de prosseguir.

2. **Rode as verificações locais**
   - Execute `npm install` (se ainda não fez) para alinhar as dependências.
   - Tente `npm run lint` e `npm run test`. Caso existam warnings de lint herdados, registre-os para citar na PR.

3. **Atualize snapshots/exports**
   - Abra o app (`npm run dev`) e valide na UI que as novas colunas aparecem no preview da predição individual e no processamento em lote.
   - Faça o download do CSV/XLSX e confira se os cabeçalhos seguem a ordem canônica e incluem `ID_Fazenda`, `Nome`, `Data_de_Nascimento`, `naab_pai`, `naab_avo_materno`, `naab_bisavo_materno`.

4. **Gere a prévia no Vercel**
   - Faça push da branch para o origin: `git push --set-upstream origin fix/nexus2-results-fixed-pta-columns`.
   - Confirme que o Vercel disparou uma prévia (link na aba “Deployments” do repositório).

5. **Abra a Pull Request**
   - Título: `fix(nexus2): Tabela de resultados com PTAs fixas e export padronizado`.
   - Descrição sugerida:
     ```md
     ## Summary
     - fixa a lista canônica de PTAs usada na predição individual e no processamento em lote
     - garante que preview e export exibam todas as colunas, preenchendo ausências com “—”
     - mantém os cabeçalhos originais do upload antes das PTAs nas exportações CSV/XLSX

     ## Testing
     - npm run lint
     - npm run test
     ```
   - Adicione o link da prévia do Vercel no campo correspondente ou no corpo da PR.

6. **Solicite revisão**
   - Marque os revisores responsáveis pelo Nexus 2.
   - Explique que essa PR substitui apenas a parte de PTAs da PR anterior (rejeitada) e que nenhuma outra funcionalidade foi alterada.

7. **Acompanhe a revisão**
   - Responda aos comentários e ajustes solicitados.
   - Não faça merge até obter aprovação e validação da prévia.

Seguindo esses passos você separa a correção dos gráficos e garante que a PR de PTAs esteja pronta para revisão com prévia ativa no Vercel.
