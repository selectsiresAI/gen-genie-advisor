/**
 * Script de Aplicação de Traduções (Fase 3)
 * 
 * Este script substitui strings hardcoded no código por chamadas t('key')
 * usando o arquivo de traduções gerado.
 * 
 * ATENÇÃO: Este script modifica arquivos! Faça backup antes de executar.
 * 
 * Uso:
 *   npx tsx scripts/apply-translations.ts [--dry-run]
 * 
 * Flags:
 *   --dry-run: Apenas simula as mudanças sem modificar arquivos
 */

import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

interface TranslationMapping {
  key: string;
  originalText: string;
  file: string;
  line: number;
}

// Carregar translations
const translationsPath = path.join(process.cwd(), 'src/locales/pt-BR.json');

if (!fs.existsSync(translationsPath)) {
  console.error('❌ Arquivo pt-BR.json não encontrado!');
  console.error('   Execute primeiro: npx tsx scripts/extract-strings.ts');
  process.exit(1);
}

const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'));

// Flatten translations para facilitar busca
const flatTranslations: { [text: string]: string } = {};

function flattenObject(obj: any, prefix = '') {
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      flatTranslations[value] = fullKey;
    } else if (typeof value === 'object' && value !== null) {
      flattenObject(value, fullKey);
    }
  });
}

flattenObject(translations);

console.log(`📚 Carregadas ${Object.keys(flatTranslations).length} traduções`);

// Arquivos a ignorar (mesmo padrão da extração)
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /dist/,
  /build/,
  /i18n\.ts$/,
  /LanguageSelector\.tsx$/,
  /I18nProvider\.tsx$/,
  /GlossaryManager\.tsx$/,
  /TranslationBatch\.tsx$/,
  /scripts\//,
  /supabase\//,
];

function shouldIgnoreFile(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function replaceStringsInFile(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let replacements = 0;

  // Verificar se já importa t()
  const hasTranslationImport = /import.*\bt\b.*from ['"]@\/lib\/i18n['"]/.test(content);

  // Substituir strings
  Object.entries(flatTranslations).forEach(([originalText, key]) => {
    // Escape special regex characters
    const escaped = originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern para encontrar string literal
    const literalPattern = new RegExp(`["']${escaped}["']`, 'g');
    
    // Pattern para JSX text content
    const jsxPattern = new RegExp(`>\\s*${escaped}\\s*<`, 'g');
    
    // Substituir literal
    if (literalPattern.test(newContent)) {
      newContent = newContent.replace(literalPattern, `t('${key}')`);
      replacements++;
    }
    
    // Substituir JSX text
    if (jsxPattern.test(newContent)) {
      newContent = newContent.replace(jsxPattern, `>{t('${key}')}<`);
      replacements++;
    }
  });

  // Adicionar import se necessário e houve substituições
  if (replacements > 0 && !hasTranslationImport) {
    // Encontrar a posição após os imports existentes
    const importMatch = content.match(/^(import[\s\S]*?;)\n\n/m);
    
    if (importMatch) {
      const importSection = importMatch[0];
      const importInsert = importSection + `import { t } from '@/lib/i18n';\n\n`;
      newContent = newContent.replace(importSection, importInsert);
    } else {
      // Se não encontrar imports, adicionar no início
      newContent = `import { t } from '@/lib/i18n';\n\n` + newContent;
    }
  }

  // Salvar arquivo modificado (se não for dry-run e houve mudanças)
  if (replacements > 0 && newContent !== content) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ ${filePath}: ${replacements} substituições`);
    } else {
      console.log(`[DRY-RUN] ${filePath}: ${replacements} substituições (não aplicadas)`);
    }
  }

  return replacements;
}

function processDirectory(dirPath: string): { files: number; replacements: number } {
  let totalFiles = 0;
  let totalReplacements = 0;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (shouldIgnoreFile(fullPath)) continue;

    if (entry.isDirectory()) {
      const results = processDirectory(fullPath);
      totalFiles += results.files;
      totalReplacements += results.replacements;
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      try {
        const replacements = replaceStringsInFile(fullPath);
        if (replacements > 0) {
          totalFiles++;
          totalReplacements += replacements;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${fullPath}:`, error);
      }
    }
  }

  return { files: totalFiles, replacements: totalReplacements };
}

// Main execution
const srcPath = path.join(process.cwd(), 'src');

console.log('🚀 Iniciando aplicação de traduções...');
if (DRY_RUN) {
  console.log('⚠️  MODO DRY-RUN: Nenhum arquivo será modificado\n');
}

const results = processDirectory(srcPath);

console.log('\n📊 Resumo:');
console.log(`   - Arquivos modificados: ${results.files}`);
console.log(`   - Total de substituições: ${results.replacements}`);

if (DRY_RUN) {
  console.log('\n💡 Execute sem --dry-run para aplicar as mudanças');
} else {
  console.log('\n✅ Traduções aplicadas com sucesso!');
  console.log('🔍 Revise as mudanças com git diff antes de commitar');
}
