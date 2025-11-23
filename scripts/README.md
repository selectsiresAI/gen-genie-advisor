# Scripts de Tradução Automatizada

Scripts para extração e aplicação automatizada de traduções no ToolSS.

## Pré-requisitos

```bash
# O pacote tsx já está instalado
npm install
```

## 1. Extração de Strings (Fase 1)

Escaneia todo o código-fonte e extrai strings em português.

```bash
npx tsx scripts/extract-strings.ts
```

**Saída**:
- `src/locales/pt-BR.json` - JSON estruturado com todas as strings
- `src/locales/extraction-report.txt` - Relatório detalhado

**Exemplo de output**:
```json
{
  "dashboard": {
    "welcome": "Bem-vindo ao ToolSS",
    "farms_count": "Total de Fazendas"
  },
  "herd": {
    "title": "Rebanho",
    "delete_confirm": "Tem certeza?"
  }
}
```

## 2. Tradução via IA (Fase 2)

### Via Interface Admin (Recomendado)

1. Acesse `http://localhost:8080/admin/translation`
2. Clique em "Upload JSON" e selecione `src/locales/pt-BR.json`
3. Clique em "Traduzir com IA"
4. Clique em "Download" para salvar `en-US.json`
5. Salve o arquivo baixado em `src/locales/en-US.json`

### Via Script (Alternativa)

Crie um script Node.js para automatizar:

```javascript
// translate-batch.js
const fs = require('fs');

async function translateBatch() {
  const ptBR = require('./src/locales/pt-BR.json');
  
  const response = await fetch('http://localhost:54321/functions/v1/translate-i18n', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
    },
    body: JSON.stringify({
      sourceJson: ptBR,
      targetLocale: 'en-US'
    })
  });
  
  const data = await response.json();
  
  fs.writeFileSync(
    './src/locales/en-US.json', 
    JSON.stringify(data.translatedJson, null, 2)
  );
  
  console.log('✅ Tradução concluída!');
}

translateBatch();
```

## 3. Aplicação de Traduções (Fase 3)

Substitui strings hardcoded por chamadas `t('key')`.

### Modo Dry-Run (Simulação)
```bash
# Veja o que será mudado SEM modificar arquivos
npx tsx scripts/apply-translations.ts --dry-run
```

### Aplicação Real
```bash
# ATENÇÃO: Modifica arquivos! Faça backup antes.
npx tsx scripts/apply-translations.ts
```

**O que o script faz**:
```typescript
// ANTES
<h1>Bem-vindo ao ToolSS</h1>
<Button>Criar Fazenda</Button>

// DEPOIS
import { t } from '@/lib/i18n';

<h1>{t('dashboard.welcome')}</h1>
<Button>{t('dashboard.create_farm')}</Button>
```

## 4. Validação e Revisão

### Checklist Pós-Aplicação

- [ ] Código compila sem erros TypeScript
- [ ] Todas as importações `t()` foram adicionadas
- [ ] App funciona em pt-BR (idioma padrão)
- [ ] App funciona em en-US (trocar no LanguageSelector)
- [ ] PTAs preservados (não traduzidos)
- [ ] Termos técnicos respeitam glossário
- [ ] Pluralização funciona (`{{count}} animal{{plural}}`)
- [ ] Nenhuma string hardcoded restante

### Comando para Buscar Strings Remanescentes

```bash
# Buscar strings ainda não traduzidas
grep -r "\"[A-Z][^\"]*[a-zçãõêâ]" src/ --include="*.tsx" --include="*.ts" \
  | grep -v "i18n.ts" \
  | grep -v "import"
```

## Estrutura Final de Locales

```
src/locales/
├── pt-BR.json              # Strings em português (fonte)
├── en-US.json              # Strings em inglês (traduzidas)
├── extraction-report.txt   # Relatório de extração
└── README.md               # Documentação (opcional)
```

## Atualização de `src/lib/i18n.ts`

Após aplicar traduções, atualize `i18n.ts` para carregar os JSONs:

```typescript
import ptBR from '@/locales/pt-BR.json';
import enUS from '@/locales/en-US.json';

const translations = {
  "pt-BR": ptBR,
  "en-US": enUS
} as const;

// ... resto do código
```

## Troubleshooting

### Erro: "Module not found: @/locales/pt-BR.json"
- Crie a pasta `src/locales/` manualmente
- Execute `extract-strings.ts` primeiro

### Erro: "Cannot find module 'tsx'"
```bash
npm install -D tsx
```

### Strings não foram extraídas
- Verifique se o arquivo está em `src/`
- Confirme que não está nos `IGNORE_PATTERNS`
- Verifique se a string tem >3 caracteres e começa com maiúscula

### Aplicação substituiu código incorretamente
- Use `--dry-run` primeiro para revisar
- Use `git diff` para ver as mudanças
- Reverta com `git checkout` se necessário

## Performance

### Extração
- ~2-5 segundos para ~100 arquivos
- Processa apenas arquivos `.ts`, `.tsx`, `.js`, `.jsx`

### Tradução via IA
- ~10-30 segundos para 500 strings
- Depende do modelo (gemini-2.5-flash é rápido)

### Aplicação
- ~5-10 segundos para ~100 arquivos
- Usa dry-run para validar primeiro

## Próximos Passos

Após executar todos os scripts:

1. **Commit as mudanças**:
   ```bash
   git add .
   git commit -m "feat: add i18n support with automated translation"
   ```

2. **Testar em produção**:
   - Deploy via Lovable
   - Validar em ambiente real

3. **Adicionar mais idiomas** (opcional):
   - Repita Fase 2 para es-ES, fr-FR, etc.
   - Adicione opções no LanguageSelector

4. **Automatizar CI/CD** (opcional):
   - Criar GitHub Action para validar traduções
   - Script para detectar strings não traduzidas em PRs

## Referências

- [Documentação Lovable AI](https://docs.lovable.dev/features/ai)
- [Guia Completo de Implementação](../docs/i18n-implementation-guide.md)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)