import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { processNormalizedRowsInBatchesMultiColumn, NormalizedRow } from '@/utils/importProcessing';

export function UploadParser() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  // parseFile genérica: adapta seu CSV rows para NormalizedRow[]
  async function parseFile(file: File, importBatchId?: string, uploaderUserId?: string) {
    setStatus('parsing');
    setProgress(5);

    // exemplo simples de leitura CSV (ajuste se usa papaparse ou outro lib)
    const text = await file.text();
    // supondo CSV com header; converta para linhas/objetos - este é um parse muito básico
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      setStatus('empty');
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const rows: NormalizedRow[] = lines.slice(1).map((ln, idx) => {
      const cols = ln.split(',');
      const obj: any = { row_number: idx + 1, import_batch_id: importBatchId, uploader_user_id: uploaderUserId, raw_line: ln };
      headers.forEach((h, i) => {
        obj[h] = cols[i]?.trim();
      });
      // normalize common NAAB headers to fields used by processor
      // ajuste aliases conforme seu CSV
      obj.sire_naab = obj.sire_naab ?? obj.sire ?? obj['sire naab'] ?? obj['sire_naab'] ?? obj['sireNaab'];
      obj.mgs_naab = obj.mgs_naab ?? obj.mgs ?? obj['mgs naab'] ?? obj['mgs_naab'];
      obj.mmgs_naab = obj.mmgs_naab ?? obj.mmgs ?? obj['mmgs naab'] ?? obj['mmgs_naab'];

      // also provide fallback naab field if CSV only has one column
      obj.naab = obj.naab ?? obj.sire_naab ?? obj.mgs_naab ?? obj.mmgs_naab;

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
