# Auditoria Genética merge conflicts

Os conflitos resolvidos anteriormente estavam concentrados em dois arquivos principais. Abaixo está um resumo do que estava em disputa e os trechos afetados depois da resolução.

## 1. `src/features/auditoria-genetica/AuditoriaGeneticaPage.tsx`

* O conflito ocorreu porque duas versões diferentes da página de recurso controlavam o passo ativo do fluxo de Auditoria Genética.
* A versão final mantém o estado local `active` sincronizado com a propriedade `initialStep`, normalizando o valor por meio de `clampStep` e notificando componentes externos via `onStepChange`.
* Trechos relevantes: linhas 27–55, onde o estado local é atualizado e os componentes de passo são renderizados.

## 2. `src/pages/AuditoriaGeneticaPage.tsx`

* O conflito neste arquivo estava entre uma página simples e uma versão que sincronizava a URL com o Supabase e com o componente de recurso.
* A resolução final inclui a leitura e escrita dos parâmetros `step`, `farmId` e `farmName`, além do carregamento da fazenda via RPC `my_farms`.
* Os trechos principais ficam entre as linhas 19–96, onde a página lê a query string, carrega os dados e mantém a URL sincronizada com o estado interno.

Com esses ajustes, os dois arquivos agora estão alinhados: o arquivo em `src/pages` cuida do carregamento de dados e do sincronismo com a URL, enquanto `src/features/auditoria-genetica/AuditoriaGeneticaPage.tsx` foca apenas em renderizar as etapas e em notificar mudanças de passo.
