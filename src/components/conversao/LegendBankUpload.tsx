import React from 'react';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { AliasSuggestion } from '@/lib/conversion/types';

interface LegendBankUploadProps {
  onLegendReady: (mappings: AliasSuggestion[]) => void;
}

const NORMALIZE_KEY = (key: string) =>
  key
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const buildKeySet = (keys: string[]) => new Set(keys.map((key) => NORMALIZE_KEY(key)));

const CANONICAL_FIELDS = buildKeySet([
  'suggested_canonical_key',
  'canonical',
  'canonical_key',
  'padrao',
  'padrão',
  'nome_padrao',
  'nome_padrão',
  'nome_canonico',
  'nome_canônico',
  'chave_padrao',
  'chave_padrão',
  'header_padrao',
  'standard_name',
  'canonical header',
  'coluna_padrao',
  'coluna_padrão',
]);

const SOURCE_FIELDS = buildKeySet(['source_hint', 'fonte', 'source', 'origem', 'notes', 'comentario', 'comentário']);
const CONFIDENCE_FIELDS = buildKeySet(['confidence', 'confianca', 'confiança', 'score', 'precisao', 'precisão']);

const ALIAS_FIELDS = buildKeySet([
  'alias_original',
  'alias',
  'coluna',
  'header',
  'nome_original',
  'nome',
  'campo',
  'campo_original',
  'var',
  'variacao',
  'variação',
  'sinonimo',
  'sinônimo',
  'sinonimo_1',
  'sinonimo_2',
  'sinonimo_3',
  'versao',
  'versão',
  'apelido',
  'header_variacao',
]);

const META_FIELDS = buildKeySet([
  'categoria',
  'category',
  'descricao',
  'descrição',
  'description',
  'grupo',
  'tipo',
  'unidade',
  'observacao',
  'observação',
  'comentarios',
  'comentários',
  'obs',
  'exemplo',
  'nota',
  'notes',
  'referencia',
  'referência',
  'id',
]);

const splitCellValues = (value: unknown): string[] => {
  if (value === undefined || value === null) return [];
  const text = String(value).trim();
  if (!text) return [];
  return text
    .split(/[\n,;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const dedupeSuggestions = (entries: AliasSuggestion[]): AliasSuggestion[] => {
  const seen = new Set<string>();
  const result: AliasSuggestion[] = [];
  for (const entry of entries) {
    const key = `${entry.alias_original.toLowerCase()}::${entry.suggested_canonical_key.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
};

const parseConfidence = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  const normalized = raw.replace(/%/g, '').replace(',', '.');
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return undefined;
  if (raw.includes('%') || numeric > 1) {
    return Math.max(0, Math.min(1, numeric / 100));
  }
  return Math.max(0, Math.min(1, numeric));
};

export const LegendBankUpload: React.FC<LegendBankUploadProps> = ({ onLegendReady }) => {
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error('Arquivo sem abas reconhecidas.');
      const ws = wb.Sheets[sheetName];
      if (!ws) throw new Error('Não foi possível interpretar a primeira aba do arquivo.');
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const mapped: AliasSuggestion[] = [];

      for (const rawRow of rows) {
        const normalizedEntries = new Map<string, { key: string; value: unknown }>();
        Object.entries(rawRow).forEach(([key, value]) => {
          const normalizedKey = NORMALIZE_KEY(key);
          if (!normalizedKey) return;
          normalizedEntries.set(normalizedKey, { key, value });
        });

        const canonicalCandidate = Array.from(CANONICAL_FIELDS)
          .map((field) => normalizedEntries.get(field))
          .find((entry) => entry && String(entry.value ?? '').trim());
        const canonicalValue = canonicalCandidate ? String(canonicalCandidate.value ?? '').trim() : '';
        if (!canonicalValue) continue;

        const sourceCandidate = Array.from(SOURCE_FIELDS)
          .map((field) => normalizedEntries.get(field))
          .find((entry) => entry && String(entry.value ?? '').trim());

        const confidenceCandidate = Array.from(CONFIDENCE_FIELDS)
          .map((field) => normalizedEntries.get(field))
          .find((entry) => entry && String(entry.value ?? '').trim());

        const aliasBuckets: string[] = [];

        const aliasEntries = Array.from(normalizedEntries.entries()).filter(([normalizedKey]) =>
          ALIAS_FIELDS.has(normalizedKey),
        );

        if (aliasEntries.length > 0) {
          for (const [, entry] of aliasEntries) {
            splitCellValues(entry.value).forEach((value) => aliasBuckets.push(value));
          }
        } else {
          const canonicalNormalized = canonicalCandidate ? NORMALIZE_KEY(canonicalCandidate.key) : '';
          for (const [normalizedKey, entry] of normalizedEntries.entries()) {
            if (normalizedKey === canonicalNormalized) continue;
            if (CANONICAL_FIELDS.has(normalizedKey)) continue;
            if (SOURCE_FIELDS.has(normalizedKey)) continue;
            if (CONFIDENCE_FIELDS.has(normalizedKey)) continue;
            if (META_FIELDS.has(normalizedKey)) continue;

            const rawHeader = entry.key ?? '';
            const potentialValues = splitCellValues(entry.value);
            const looksLikeAlias =
              ALIAS_FIELDS.has(normalizedKey) ||
              /alias|nome|header|coluna|campo|variac|sinon|apelido/i.test(rawHeader) ||
              potentialValues.length > 0;
            if (!looksLikeAlias) continue;
            potentialValues.forEach((value) => aliasBuckets.push(value));
          }
        }

        const canonicalLower = canonicalValue.toLowerCase();
        const uniqueAliases = Array.from(
          new Set(
            aliasBuckets
              .map((alias) => alias.trim())
              .filter((alias) => alias && alias.toLowerCase() !== canonicalLower),
          ),
        );

        const parsedConfidence = confidenceCandidate ? parseConfidence(confidenceCandidate.value) : undefined;
        const sourceHint = sourceCandidate ? String(sourceCandidate.value ?? '').trim() || undefined : undefined;

        mapped.push({
          alias_original: canonicalValue,
          suggested_canonical_key: canonicalValue,
          source_hint: sourceHint,
          confidence: parsedConfidence ?? 0.99,
        });

        for (const alias of uniqueAliases) {
          mapped.push({
            alias_original: alias,
            suggested_canonical_key: canonicalValue,
            source_hint: sourceHint,
            confidence: parsedConfidence,
          });
        }
      }

      const deduped = dedupeSuggestions(mapped);

      if (deduped.length === 0) {
        toast({
          title: 'Banco vazio ou cabeçalhos não reconhecidos',
          description:
            'Utilize cabeçalhos com a nomenclatura padrão ou variações reconhecíveis (ex: nome_padrão, variação 1, etc).',
          variant: 'destructive',
        });
        return;
      }

      onLegendReady(deduped);
      toast({
        title: 'Banco de nomenclaturas carregado',
        description: `${file.name}: ${deduped.length} mapeamentos prontos para uso.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao ler o banco',
        description: err instanceof Error ? err.message : 'Não foi possível interpretar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Banco de Nomenclaturas</CardTitle>
        <CardDescription>
          (Opcional) Envie um Excel/CSV com o cabeçalho padrão e suas variações. Cada linha pode conter o nome
          padronizado e múltiplas colunas de sinônimos/variações.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="legend-file">Arquivo Excel/CSV</Label>
        <Input id="legend-file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} />
      </CardContent>
    </Card>
  );
};

export default LegendBankUpload;
