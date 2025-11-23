# Guia de Implementação i18n - ToolSS

## Visão Geral

Sistema completo de internacionalização (i18n) implementado com abordagem híbrida:
- **70% automático**: Extração de strings + tradução via Lovable AI
- **30% manual**: Glossário técnico + revisão de qualidade

## Arquitetura Implementada

### 1. Infraestrutura Core
- ✅ `src/lib/i18n.ts` - Sistema de tradução com suporte a pt-BR e en-US
- ✅ `src/providers/I18nProvider.tsx` - Context global de idioma
- ✅ `src/hooks/useTranslation.ts` - Hook React para traduções
- ✅ `src/hooks/useGlossary.ts` - Hook para termos técnicos
- ✅ `src/components/LanguageSelector.tsx` - Seletor de idioma (🇧🇷/🇺🇸)

### 2. Glossário Técnico (Database)
- ✅ Tabela `technical_glossary` no Supabase
- ✅ 100+ termos pré-cadastrados (60+ PTAs + 40+ termos de domínio)
- ✅ Interface admin em `/admin/glossary`
- ✅ Controle de traduzibildiade (`is_translatable`)

### 3. Tradução Automatizada
- ✅ Edge Function `translate-i18n` (Lovable AI)
- ✅ Interface admin em `/admin/translation`
- ✅ Preserva termos técnicos (PTAs, NAABs)

### 4. Scripts de Automação
- ✅ `scripts/extract-strings.ts` - Extrai strings hardcoded
- ✅ `scripts/apply-translations.ts` - Aplica traduções no código

## Workflow Completo

### Fase 0: Configuração Inicial ✅ CONCLUÍDA
Sistema i18n + Language Selector já estão funcionando.

### Fase 1: Extração de Strings

```bash
# Extrair todas as strings em português do código
npx tsx scripts/extract-strings.ts
```

**Output**:
- `src/locales/pt-BR.json` - Arquivo estruturado com ~500-800 strings
- `src/locales/extraction-report.txt` - Relatório detalhado

**Estimativa**: 2-3 créditos (apenas para revisar e ajustar script se necessário)

### Fase 2: Tradução em Lote via IA

**Opção A - Via Interface Admin** (Recomendado):
1. Acesse `/admin/translation`
2. Copie o conteúdo de `src/locales/pt-BR.json`
3. Cole no campo "JSON de Origem"
4. Clique em "Traduzir com IA"
5. Baixe o resultado como `en-US.json`
6. Salve em `src/locales/en-US.json`

**Opção B - Via API Direto**:
```typescript
const { data } = await supabase.functions.invoke('translate-i18n', {
  body: {
    sourceJson: require('./src/locales/pt-BR.json'),
    targetLocale: 'en-US'
  }
});

fs.writeFileSync('./src/locales/en-US.json', 
  JSON.stringify(data.translatedJson, null, 2)
);
```

**Estimativa**: 3-5 créditos (1 requisição para ~500-800 strings)

### Fase 3: Aplicação de Traduções

```bash
# Simular mudanças (não modifica arquivos)
npx tsx scripts/apply-translations.ts --dry-run

# Aplicar mudanças nos arquivos
npx tsx scripts/apply-translations.ts
```

**O que faz**:
- Substitui strings hardcoded por `t('chave.correspondente')`
- Adiciona `import { t } from '@/lib/i18n'` automaticamente
- Preserva estrutura e formatação do código

**Estimativa**: 5-8 créditos (para revisar e ajustar substituições automáticas)

### Fase 4: Integração do Glossário Técnico

```typescript
// Atualizar src/lib/i18n.ts para carregar glossário
import { supabase } from '@/integrations/supabase/client';

let glossaryCache: Map<string, { pt: string; en: string }> | null = null;

async function loadGlossary() {
  if (glossaryCache) return glossaryCache;
  
  const { data } = await supabase
    .from('technical_glossary')
    .select('term_key, pt_br, en_us, is_translatable');
  
  glossaryCache = new Map(
    data?.map(t => [t.term_key, { pt: t.pt_br, en: t.en_us || t.pt_br }]) || []
  );
  
  return glossaryCache;
}

// Integrar no t() function
export async function t(key: TranslationKey, options = {}, locale = getLocale()) {
  // Check glossary for technical terms
  if (key.startsWith('technical.')) {
    const glossary = await loadGlossary();
    const termKey = key.replace('technical.', '');
    const term = glossary.get(termKey);
    if (term) return locale === 'en-US' ? term.en : term.pt;
  }
  
  // Regular translation...
}
```

**Estimativa**: 3-4 créditos

### Fase 5: Revisão e Polimento

**Checklist de Revisão**:
- [ ] Testar seletor de idioma em Login e Dashboard
- [ ] Verificar PTAs não foram traduzidos (devem permanecer iguais)
- [ ] Testar navegação completa em inglês
- [ ] Verificar responsive design mantido
- [ ] Validar pluralização ({{count}} animal{{plural}})
- [ ] Revisar contextos técnicos (termos do glossário)

**Estimativa**: 5-8 créditos

## Uso no Código

### 1. Tradução Básica
```typescript
import { t } from '@/lib/i18n';

// Simples
<h1>{t('dashboard.welcome')}</h1>

// Com pluralização
<p>{t('herd.selected.count', { count: selectedAnimals })}</p>
```

### 2. Hook React
```typescript
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t, locale } = useTranslation();
  
  return <div>{t('common.loading')}</div>;
}
```

### 3. Termos Técnicos (Glossário)
```typescript
// PTAs (não traduzidos)
<span>{t('technical.hhp_dollar')}</span> // → "HHP$®" (pt e en)

// Termos traduzíveis
<span>{t('technical.term_herd')}</span> 
// → "Rebanho" (pt) / "Herd" (en)
```

## Gerenciamento do Glossário

Acesse `/admin/glossary` para:
- Visualizar todos os 100+ termos técnicos
- Editar traduções de termos traduzíveis
- Ver estatísticas de cobertura
- Filtrar por categoria

## Estrutura de Arquivos

```
src/
├── lib/
│   └── i18n.ts                    # Core do sistema de tradução
├── providers/
│   └── I18nProvider.tsx           # Context global
├── hooks/
│   ├── useTranslation.ts          # Hook React
│   └── useGlossary.ts             # Hook para glossário
├── components/
│   └── LanguageSelector.tsx       # Seletor de idioma
├── locales/
│   ├── pt-BR.json                 # Traduções portuguesas
│   └── en-US.json                 # Traduções inglesas
└── pages/admin/
    ├── GlossaryManager.tsx        # Interface do glossário
    └── TranslationBatch.tsx       # Interface de tradução IA

scripts/
├── extract-strings.ts             # Extração automatizada
└── apply-translations.ts          # Aplicação automatizada

supabase/
└── functions/
    └── translate-i18n/            # Edge function de tradução
        └── index.ts
```

## Estimativa de Créditos

| Fase | Descrição | Créditos |
|------|-----------|----------|
| 0    | ✅ Infraestrutura + Glossário | 7-10 |
| 1    | Extração automatizada | 2-3 |
| 2    | Tradução via IA | 3-5 |
| 3    | Aplicação automatizada | 5-8 |
| 4    | Integração glossário | 3-4 |
| 5    | Revisão e polimento | 5-8 |
| **TOTAL** | **Abordagem Híbrida Completa** | **25-38** |

## Termos Técnicos no Glossário

### PTAs (Não Traduzíveis) - 60+ termos
- Índices: HHP$®, NM$®, CM$®, FM$®, GM$®, TPI
- Produção: PTAF, PTAP, PTAM, MF
- Saúde: SCS, LIV, MAST, MET, RP, KET, DA
- Fertilidade: DPR, CCR, HCR
- Tipo: PTAT, UDC, FLC, STA, STR, etc.
- Eficiência: FI, RFI, GFI, F-SAV, EFC

### Termos de Domínio (Traduzíveis) - 40+ termos
- Rebanho → Herd
- Touro → Bull
- Fêmea → Female
- Fazenda → Farm
- Predição → Prediction
- Segmentação → Segmentation
- etc.

## Próximos Passos Sugeridos

1. **Executar Fase 1** (Extração):
   ```bash
   npx tsx scripts/extract-strings.ts
   ```

2. **Revisar pt-BR.json gerado** - Validar que capturou todas as strings

3. **Executar Fase 2** (Tradução):
   - Acessar `/admin/translation`
   - Traduzir via IA

4. **Executar Fase 3** (Aplicação):
   ```bash
   npx tsx scripts/apply-translations.ts --dry-run  # Revisar
   npx tsx scripts/apply-translations.ts            # Aplicar
   ```

5. **Fase 5** (Revisão Manual) - Testar app completo em inglês

## Troubleshooting

### Script não encontra strings
- Verifique que os padrões regex em `extract-strings.ts` cobrem seu caso
- Adicione novos patterns se necessário

### Tradução via IA falha
- **429 Error**: Aguarde alguns minutos (rate limit)
- **402 Error**: Adicione créditos no workspace Lovable
- **Timeout**: Divida o JSON em blocos menores (<300 strings por requisição)

### Termos técnicos foram traduzidos
- Verifique o glossário: termo deve ter `is_translatable = false`
- Re-execute a tradução após corrigir o glossário

## Manutenção

### Adicionar novo idioma
1. Traduzir `pt-BR.json` para o novo idioma
2. Adicionar locale em `src/lib/i18n.ts`
3. Adicionar opção no `LanguageSelector.tsx`

### Adicionar novos termos técnicos
1. Acesse `/admin/glossary`
2. Insira manualmente no banco via SQL ou interface
3. Invalidate cache do `useGlossary`

## Contato e Suporte

Para questões sobre:
- **Lovable AI**: Settings → Workspace → Usage
- **Rate limits**: Upgrade para plano pago ou contate support@lovable.dev
- **Implementação**: Revise este guia e logs da edge function
