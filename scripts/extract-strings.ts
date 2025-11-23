/**
 * Script de Extração Automatizada de Strings (Fase 1)
 * 
 * Este script escaneia o código-fonte e extrai todas as strings hardcoded
 * em português, gerando um arquivo JSON estruturado para tradução.
 * 
 * Uso:
 *   npx tsx scripts/extract-strings.ts
 * 
 * Output: src/locales/pt-BR.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExtractedString {
  key: string;
  value: string;
  file: string;
  line: number;
}

interface TranslationJson {
  [module: string]: {
    [key: string]: string | any;
  };
}

// Regex patterns para encontrar strings em português
const STRING_PATTERNS = [
  // JSX text content: >Texto<
  />\s*([A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][^<>{}\n]{2,100}?)\s*</g,
  
  // String literals simples: "Texto" ou 'Texto'
  /["']([A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][^"'\n]{2,100}?)["']/g,
  
  // Placeholders: placeholder="Texto"
  /placeholder\s*=\s*["']([A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][^"'\n]{2,100})["']/g,
  
  // Labels e títulos
  /(?:title|label|description)\s*=\s*["']([A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][^"'\n]{2,100})["']/g,
];

// Arquivos e padrões a ignorar
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /dist/,
  /build/,
  /coverage/,
  /\.git/,
  /public\//,
  /scripts\//,
  /supabase\//,
  // Arquivos já internacionalizados
  /i18n\.ts$/,
  /LanguageSelector\.tsx$/,
  /I18nProvider\.tsx$/,
  /GlossaryManager\.tsx$/,
  /TranslationBatch\.tsx$/,
];

// Padrões que indicam que não é português (falsos positivos)
const FALSE_POSITIVE_PATTERNS = [
  /^https?:\/\//i,           // URLs
  /^[A-Z_]+$/,               // CONSTANTES
  /^[a-z]+$/,                // palavras em minúscula (geralmente inglês)
  /^\d+$/,                   // Apenas números
  /^[A-Z]{2,5}\$?$/,         // PTAs (TPI, NM$, etc)
  /className|style|import|export|function|const|let|var/, // Código
  /\.png|\.jpg|\.svg|\.ico/, // Arquivos
];

// Módulos baseados em estrutura de pastas
const MODULE_MAP: { [path: string]: string } = {
  'AuthPage': 'auth',
  'MainDashboard': 'dashboard',
  'HerdPage': 'herd',
  'NexusApp': 'nexus',
  'Nexus1': 'nexus1',
  'Nexus2': 'nexus2',
  'Nexus3': 'nexus3',
  'BullSearch': 'bulls',
  'SegmentationPage': 'segmentation',
  'ChartsPage': 'charts',
  'BotijaoVirtual': 'botijao',
  'Metas': 'metas',
  'PlanoApp': 'plano',
  'PastaArquivos': 'arquivos',
  'AuditoriaGenetica': 'auditoria',
  'admin': 'admin',
  'help': 'help',
  'feedback': 'feedback',
};

function isPortuguese(text: string): boolean {
  // Check for common Portuguese words/patterns
  const portugueseIndicators = [
    /ção\b/, /ções\b/, /ão\b/, /ões\b/, /ê/, /â/, /õ/, /á/, /é/, /í/, /ó/, /ú/,
    /\b(com|para|por|seu|sua|seus|suas|este|esta|estes|estas|não|sim|ou|mas)\b/i,
  ];
  
  return portugueseIndicators.some(pattern => pattern.test(text));
}

function isFalsePositive(text: string): boolean {
  return FALSE_POSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

function generateKey(text: string, moduleName: string): string {
  // Gerar key baseada no texto
  const cleaned = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join("_");
  
  return `${moduleName}.${cleaned}`;
}

function extractStringsFromFile(filePath: string): ExtractedString[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const extracted: ExtractedString[] = [];
  const seen = new Set<string>();

  // Determinar módulo baseado no caminho do arquivo
  const fileName = path.basename(filePath, path.extname(filePath));
  let moduleName = 'common';
  
  for (const [pattern, module] of Object.entries(MODULE_MAP)) {
    if (filePath.includes(pattern) || fileName.includes(pattern)) {
      moduleName = module;
      break;
    }
  }

  lines.forEach((line, lineIndex) => {
    STRING_PATTERNS.forEach(pattern => {
      const matches = [...line.matchAll(pattern)];
      
      matches.forEach(match => {
        const text = match[1]?.trim();
        
        if (!text || text.length < 3) return;
        if (isFalsePositive(text)) return;
        if (!isPortuguese(text)) return;
        if (seen.has(text)) return;
        
        seen.add(text);
        extracted.push({
          key: generateKey(text, moduleName),
          value: text,
          file: filePath,
          line: lineIndex + 1,
        });
      });
    });
  });

  return extracted;
}

function scanDirectory(dirPath: string): ExtractedString[] {
  let allStrings: ExtractedString[] = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    // Ignorar arquivos/pastas
    if (IGNORE_PATTERNS.some(pattern => pattern.test(fullPath))) {
      continue;
    }

    if (entry.isDirectory()) {
      allStrings = allStrings.concat(scanDirectory(fullPath));
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      try {
        const fileStrings = extractStringsFromFile(fullPath);
        allStrings = allStrings.concat(fileStrings);
      } catch (error) {
        console.error(`Erro ao processar ${fullPath}:`, error);
      }
    }
  }

  return allStrings;
}

function buildTranslationJson(strings: ExtractedString[]): TranslationJson {
  const json: TranslationJson = {};

  strings.forEach(({ key, value }) => {
    const [module, ...rest] = key.split('.');
    const subKey = rest.join('.');

    if (!json[module]) {
      json[module] = {};
    }

    json[module][subKey] = value;
  });

  return json;
}

// Main execution
const srcPath = path.join(process.cwd(), 'src');
const outputPath = path.join(process.cwd(), 'src/locales');
const outputFile = path.join(outputPath, 'pt-BR.json');

console.log('🔍 Extraindo strings de:', srcPath);
console.log('📝 Ignorando padrões:', IGNORE_PATTERNS.length, 'regras');

const extractedStrings = scanDirectory(srcPath);

console.log('\n📊 Estatísticas:');
console.log(`   - Total de strings extraídas: ${extractedStrings.length}`);

// Agrupar por módulo
const byModule: { [module: string]: number } = {};
extractedStrings.forEach(({ key }) => {
  const module = key.split('.')[0];
  byModule[module] = (byModule[module] || 0) + 1;
});

console.log('\n📁 Distribuição por módulo:');
Object.entries(byModule)
  .sort(([, a], [, b]) => b - a)
  .forEach(([module, count]) => {
    console.log(`   - ${module}: ${count} strings`);
  });

// Criar JSON estruturado
const translationJson = buildTranslationJson(extractedStrings);

// Criar diretório se não existir
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Salvar arquivo
fs.writeFileSync(outputFile, JSON.stringify(translationJson, null, 2), 'utf-8');

console.log('\n✅ Extração concluída!');
console.log(`📄 Arquivo gerado: ${outputFile}`);
console.log(`\n🎯 Próximo passo: Use o Admin -> Tradução em Lote para traduzir via IA`);

// Gerar relatório detalhado
const reportPath = path.join(outputPath, 'extraction-report.txt');
let report = '=== RELATÓRIO DE EXTRAÇÃO ===\n\n';
report += `Total de strings: ${extractedStrings.length}\n\n`;
report += 'Distribuição por módulo:\n';
Object.entries(byModule)
  .sort(([, a], [, b]) => b - a)
  .forEach(([module, count]) => {
    report += `  ${module}: ${count}\n`;
  });

report += '\n\nStrings extraídas (primeiras 50):\n';
extractedStrings.slice(0, 50).forEach(({ key, value, file, line }) => {
  report += `\n[${key}]\n`;
  report += `  Valor: "${value}"\n`;
  report += `  Arquivo: ${file}:${line}\n`;
});

fs.writeFileSync(reportPath, report, 'utf-8');
console.log(`📋 Relatório detalhado: ${reportPath}`);