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

function pick<T extends object>(obj: any, keys: (keyof T)[]): Partial<T> {
  const out: Partial<T> = {};
  for (const k of keys) {
    if (obj[k as string] !== undefined) (out as any)[k] = obj[k as string];
  }
  return out;
}

export const LegendBankUpload: React.FC<LegendBankUploadProps> = ({ onLegendReady }) => {
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const isCsv = /\.csv$/i.test(file.name);

      let rows: any[] = [];
      if (isCsv) {
        const text = new TextDecoder().decode(new Uint8Array(buf));
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) throw new Error('Arquivo CSV vazio.');
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        rows = lines.slice(1).map((ln) => {
          const cols = ln.split(',');
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => (obj[h] = (cols[i] ?? '').trim()));
          return obj;
        });
      } else {
        const wb = XLSX.read(buf, { type: 'array' });
        const sh = wb.SheetNames[0];
        const ws = wb.Sheets[sh];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      }

      const mapped: AliasSuggestion[] = rows
        .map((r) => {
          const alias =
            r['alias_original'] ?? r['alias'] ?? r['coluna'] ?? r['header'] ?? r['nome_original'] ?? r['nome'];
          const canonical =
            r['suggested_canonical_key'] ?? r['canonical'] ?? r['padrao'] ?? r['chave'] ?? r['destino'];
          if (!alias || !canonical) return null;

          const row = {
            alias_original: String(alias).trim(),
            suggested_canonical_key: String(canonical).trim(),
            source_hint: r['source_hint'] ?? r['fonte'] ?? r['origem'] ?? '',
            confidence: r['confidence'] ? Number(r['confidence']) : undefined,
          };
          if (!row.alias_original || !row.suggested_canonical_key) return null;
          return pick<AliasSuggestion>(row, [
            'alias_original',
            'suggested_canonical_key',
            'source_hint',
            'confidence',
          ]) as AliasSuggestion;
        })
        .filter(Boolean) as AliasSuggestion[];

      if (mapped.length === 0) {
        toast({
          title: 'Banco vazio ou cabeçalhos não reconhecidos',
          description:
            'Use cabeçalhos: alias_original, suggested_canonical_key (opcionais: source_hint, confidence).',
          variant: 'destructive',
        });
        return;
      }

      onLegendReady(mapped);
      toast({
        title: 'Banco de nomenclaturas carregado',
        description: `${file.name}: ${mapped.length} mapeamentos prontos para uso.`,
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
          (Opcional) Envie um Excel/CSV com as colunas <b>alias_original</b> e <b>suggested_canonical_key</b> para
          personalizar as sugestões.
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
