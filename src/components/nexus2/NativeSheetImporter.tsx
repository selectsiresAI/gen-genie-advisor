import React, { useRef, useState } from 'react';
import { read, utils, SSF } from 'xlsx';
import { Loader2, Upload, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import {
  detectNativeMapping,
  NATIVE_TARGETS,
  NativeTargetKey,
  targetLabel,
  type MappingMethod,
} from './nativeSheetMapping';

const ACCEPTED = '.csv,.xlsx,.xls,.xlsm';
const UNMAPPED = '__none__';

const parseExcelDate = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number' || (!isNaN(Number(value)) && typeof value !== 'object')) {
    try {
      const date = SSF.parse_date_code(Number(value));
      if (date) {
        const day = String(date.d).padStart(2, '0');
        const month = String(date.m).padStart(2, '0');
        return `${day}/${month}/${date.y}`;
      }
    } catch {}
  }
  return String(value).trim();
};

const readWorkbook = async (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      text = new TextDecoder('windows-1252').decode(bytes);
    }
    const firstLine = text.split(/\r?\n/)[0] || '';
    const semis = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    let fs = ',';
    if (tabs > semis && tabs > commas) fs = '\t';
    else if (semis > commas) fs = ';';
    return read(text, { type: 'string', FS: fs });
  }
  return read(await file.arrayBuffer(), { type: 'array' });
};

interface Props {
  /** Recebe um File CSV já no formato canônico ToolSS para reaproveitar o fluxo existente. */
  onConvertedFile: (file: File) => void | Promise<void>;
  disabled?: boolean;
}

interface ReviewState {
  fileName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  mapping: Record<NativeTargetKey, { header: string | null; method: MappingMethod; confidence: number }>;
}

const methodBadge = (method: MappingMethod, confidence: number, locale: string) => {
  const isEs = locale === 'es';
  const isEn = locale === 'en-US';
  if (method === 'alias') return isEs ? 'Diccionario' : isEn ? 'Dictionary' : 'Dicionário';
  if (method === 'regex') return isEs ? 'Patrón' : isEn ? 'Pattern' : 'Padrão';
  if (method === 'fuzzy') return `${isEs ? 'Aprox.' : isEn ? 'Approx.' : 'Aprox.'} ${(confidence * 100).toFixed(0)}%`;
  return isEs ? 'No detectado' : isEn ? 'Not detected' : 'Não detectado';
};

const NativeSheetImporter: React.FC<Props> = ({ onConvertedFile, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { locale } = useTranslation();
  const isEs = locale === 'es';
  const isEn = locale === 'en-US';
  const [isReading, setIsReading] = useState(false);
  const [review, setReview] = useState<ReviewState | null>(null);

  const t = (pt: string, en: string, es: string) => (isEs ? es : isEn ? en : pt);

  const handleFile = async (file: File) => {
    setIsReading(true);
    try {
      const wb = await readWorkbook(file);
      if (!wb.SheetNames.length) throw new Error('emptyWorkbook');
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const aoa = utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
      if (!aoa.length) throw new Error('emptyWorkbook');
      const headers = (aoa[0] as unknown[]).map((v) => String(v ?? '').trim()).filter(Boolean);
      const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: true });

      const detected = detectNativeMapping(headers);
      const mapping = {} as ReviewState['mapping'];
      for (const d of detected) {
        mapping[d.target.key] = { header: d.detectedHeader, method: d.method, confidence: d.confidence };
      }

      setReview({ fileName: file.name, headers, rows, mapping });
    } catch (err) {
      console.error('NativeSheetImporter parse error', err);
      toast({
        variant: 'destructive',
        title: t('Não foi possível ler a planilha', 'Could not read the spreadsheet', 'No se pudo leer la planilla'),
      });
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!review) return;
    const sireField = review.mapping.naabPai;
    if (!sireField?.header) {
      toast({
        variant: 'destructive',
        title: t(
          'Selecione a coluna do NAAB do Pai',
          'Select the Sire NAAB column',
          'Seleccione la columna del NAAB del Padre',
        ),
      });
      return;
    }

    // Build canonical CSV
    const canonicalHeaders = NATIVE_TARGETS.map((t) => t.canonicalHeader);
    const lines: string[] = [canonicalHeaders.join(',')];

    const escape = (v: string) => {
      if (v == null) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    for (const row of review.rows) {
      const out = NATIVE_TARGETS.map((target) => {
        const sourceHeader = review.mapping[target.key]?.header;
        if (!sourceHeader) return '';
        const raw = row[sourceHeader];
        if (target.key === 'dataNascimento') {
          return escape(parseExcelDate(raw));
        }
        if (raw == null) return '';
        return escape(String(raw).trim());
      });
      lines.push(out.join(','));
    }

    const csv = lines.join('\n');
    const baseName = review.fileName.replace(/\.[^.]+$/, '');
    const converted = new File([csv], `${baseName} (convertida).csv`, { type: 'text/csv' });
    setReview(null);
    await onConvertedFile(converted);
  };

  return (
    <Card className="h-full border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="h-5 w-5 text-primary" />
          {t('Planilha nativa (auto-detecção)', 'Native spreadsheet (auto-detect)', 'Planilla nativa (auto-detección)')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isReading}
        >
          {isReading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('Lendo...', 'Reading...', 'Leyendo...')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t('Enviar planilha nativa', 'Upload native spreadsheet', 'Subir planilla nativa')}
            </span>
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t(
            'Envie a planilha do seu software (IDEAGRI, Afidata, DairyComp, etc.). Detectamos automaticamente as colunas — você não precisa reformatar nada.',
            'Upload your herd software spreadsheet (IDEAGRI, Afidata, DairyComp, etc.). We auto-detect the columns — no manual reformat needed.',
            'Suba la planilla de su software (IDEAGRI, Afidata, DairyComp, etc.). Detectamos las columnas automáticamente — no necesita reformatear nada.',
          )}
        </p>
      </CardContent>

      <Dialog open={!!review} onOpenChange={(open) => !open && setReview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('Revisar mapeamento de colunas', 'Review column mapping', 'Revisar mapeo de columnas')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Confirme as colunas detectadas. Apenas o NAAB do Pai é obrigatório.',
                'Confirm the detected columns. Only the Sire NAAB is required.',
                'Confirme las columnas detectadas. Solo el NAAB del Padre es obligatorio.',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {review &&
              NATIVE_TARGETS.map((target) => {
                const state = review.mapping[target.key];
                const isMissingRequired = target.required && !state?.header;
                return (
                  <div key={target.key} className="grid grid-cols-[1fr,1.4fr,auto] items-center gap-3">
                    <div>
                      <div className="text-sm font-medium">
                        {targetLabel(target, locale)}
                        {target.required && <span className="ml-1 text-destructive">*</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{target.canonicalHeader}</div>
                    </div>
                    <Select
                      value={state?.header ?? UNMAPPED}
                      onValueChange={(value) => {
                        setReview((prev) =>
                          prev
                            ? {
                                ...prev,
                                mapping: {
                                  ...prev.mapping,
                                  [target.key]: {
                                    header: value === UNMAPPED ? null : value,
                                    method: 'alias',
                                    confidence: value === UNMAPPED ? 0 : 1,
                                  },
                                },
                              }
                            : prev,
                        );
                      }}
                    >
                      <SelectTrigger className={isMissingRequired ? 'border-destructive' : ''}>
                        <SelectValue placeholder={t('— não mapeado —', '— not mapped —', '— sin mapear —')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value={UNMAPPED}>
                          {t('— não mapeado —', '— not mapped —', '— sin mapear —')}
                        </SelectItem>
                        {review.headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant={state?.header ? 'outline' : 'secondary'} className="whitespace-nowrap">
                      {methodBadge(state?.method ?? 'none', state?.confidence ?? 0, locale)}
                    </Badge>
                  </div>
                );
              })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReview(null)}>
              {t('Cancelar', 'Cancel', 'Cancelar')}
            </Button>
            <Button onClick={handleConfirm}>
              {t('Confirmar e carregar', 'Confirm and load', 'Confirmar y cargar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default NativeSheetImporter;
