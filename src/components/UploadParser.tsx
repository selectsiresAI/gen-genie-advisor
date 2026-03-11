import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { processNormalizedRowsInBatchesMultiColumn, NormalizedRow } from '@/utils/importProcessing';
import { parseUniversalSpreadsheet } from '@/utils/headerNormalizer';

export function UploadParser() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  // parseFile genérica: adapta CSV/XLSX/XLS/XLSM rows para NormalizedRow[]
  async function parseFile(file: File, importBatchId?: string, uploaderUserId?: string) {
    setStatus('parsing');
    setProgress(5);

    const jsonData = await parseUniversalSpreadsheet(file);

    if (jsonData.length === 0) {
      setStatus('empty');
      return;
    }

    const rows: NormalizedRow[] = jsonData.map((row, idx) => {
      const obj: any = { row_number: idx + 1, import_batch_id: importBatchId, uploader_user_id: uploaderUserId, raw_line: JSON.stringify(row) };
      Object.entries(row).forEach(([key, value]) => {
        obj[key] = typeof value === 'string' ? value.trim() : value;
      });
      // Map canonical keys to snake_case fields used by processor
      obj.sire_naab = obj.sire_naab ?? obj.naabPai ?? obj.sire;
      obj.mgs_naab = obj.mgs_naab ?? obj.naabAvoMaterno ?? obj.mgs;
      obj.mmgs_naab = obj.mmgs_naab ?? obj.naabBisavoMaterno ?? obj.mmgs;

      // also provide fallback naab field if CSV only has one column
      obj.naab = obj.naab ?? obj.Naab ?? obj.sire_naab ?? obj.mgs_naab ?? obj.mmgs_naab;

      return obj as NormalizedRow;
    });

    setProgress(15);
    setStatus('resolving_naabs');

    try {
      const res = await processNormalizedRowsInBatchesMultiColumn(supabase, rows, {
        lookupChunkSize: 200,
        writeBatchSize: 100,
        progressCallback: (processed, total) => {
          // Ajuste do progresso: já começou em 15%
          const pct = 15 + Math.round((processed / total) * 80);
          setProgress(Math.min(100, pct));
        },
      });
      setStatus(`done: processed ${res.processed}`);
      setProgress(100);
    } catch (err: any) {
      console.error('parseFile error', err);
      setStatus(`error: ${err.message ?? err}`);
      setProgress(0);
      throw err;
    }
  }

  return (
    <div>
      <p>Status: {status}</p>
      <p>Progress: {progress}%</p>
      {/* Render UI de upload e chame parseFile(file) quando fizer upload */}
    </div>
  );
}
