# Fontes de dados do rebanho

## Fluxo de leitura na aplicação

As páginas **Rebanho** e **Segmentação** consomem o hook `fetchFemalesDenormByFarm` para montar a grade de animais da fazenda selecionada. O componente `HerdPage` executa a função sempre que o rebanho é carregado, enquanto `SegmentationPage` reaproveita o mesmo helper para alimentar a listagem que será segmentada.【F:src/components/HerdPage.tsx†L109-L154】【F:src/components/SegmentationPage.tsx†L301-L352】【F:src/supabase/queries/females.ts†L64-L121】

## Fontes Supabase consultadas

A função `fetchFemalesDenormByFarm` tenta ler primeiro da view `public.females_public_by_farm_view` — pensada para exposições públicas do rebanho — e volta para `public.females_denorm` caso a primeira não esteja disponível (por ausência da view ou permissão). O fallback garante compatibilidade com instalações anteriores que só disponibilizam `females_denorm` sem a nova view.【F:src/supabase/queries/females.ts†L23-L121】

## Fluxo de escrita

O upload de fêmeas continua direcionado para `public.females`, através do modal de importação. O comportamento de permissão segue descrito na documentação do erro "Permission denied".【F:src/components/FemaleUploadModal.tsx†L572-L588】【F:docs/import-permission-error.md†L3-L23】
