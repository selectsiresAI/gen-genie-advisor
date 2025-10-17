import React, { useState } from 'react'

export default function ImportBulls({ supabase, functionsBaseUrl }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [committing, setCommitting] = useState(false)

  const [headers, setHeaders] = useState([])
  const [totalRows, setTotalRows] = useState(0)
  const [importBatchId, setImportBatchId] = useState(null)

  const [result, setResult] = useState(null) // { inserted, updated, skipped, invalid, total_rows, import_batch_id }
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const resetPreview = () => {
    setHeaders([])
    setTotalRows(0)
    setImportBatchId(null)
    setResult(null)
    setError(null)
    setInfo(null)
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    setError(null)
    setInfo(null)
    setResult(null)

    if (!f) {
      setFile(null)
      resetPreview()
      return
    }

    const isCsv = /\.csv$/i.test(f.name)
    if (!isCsv) {
      setError('Envie um arquivo .csv (UTF-8, cabeçalho na primeira linha).')
      setFile(null)
      resetPreview()
      return
    }

    const maxBytes = 10 * 1024 * 1024 // 10MB
    if (f.size > maxBytes) {
      setError('Arquivo maior que 10MB não é suportado. Reduza o tamanho ou utilize outro meio de importação.')
      setFile(null)
      resetPreview()
      return
    }

    if (f.size > maxBytes * 0.8) {
      setInfo('Aviso: arquivo grande (próximo de 10MB). O upload pode levar mais tempo.')
    }

    setFile(f)
    resetPreview() // limpa qualquer preview anterior
  }

  const handleUpload = async () => {
    setError(null)
    setResult(null)

    if (!file) {
      setError('Selecione um CSV antes de enviar.')
      return
    }

    setUploading(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user?.id) {
        throw new Error('Usuário não autenticado.')
      }

      const form = new FormData()
      form.append('file', file)
      form.append('user_id', user.id)

      const res = await fetch(`${functionsBaseUrl}/upload`, {
        method: 'POST',
        body: form,
        // NÃO defina Content-Type manualmente no multipart!
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Falha no upload: ${res.status} ${txt}`)
      }

      const json = await res.json()
      // Esperado: { import_batch_id, headers, total_rows }
      setImportBatchId(json.import_batch_id)
      setHeaders(json.headers || [])
      setTotalRows(json.total_rows || 0)
      setInfo('Upload concluído. Confira os cabeçalhos e a contagem antes do commit.')
    } catch (e) {
      setError(e.message || 'Erro no upload.')
    } finally {
      setUploading(false)
    }
  }

  const handleCommit = async () => {
    setError(null)
    setResult(null)

    if (!importBatchId) {
      setError('Faça o upload antes de confirmar o commit.')
      return
    }

    setCommitting(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user?.id) {
        throw new Error('Usuário não autenticado.')
      }

      const payload = {
        import_batch_id: importBatchId,
        uploader_user_id: user.id,
      }

      const res = await fetch(`${functionsBaseUrl}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Falha no commit: ${res.status} ${txt}`)
      }

      const json = await res.json()
      // Esperado: { import_batch_id, total_rows, inserted, updated, skipped, invalid }
      setResult({
        import_batch_id: json.import_batch_id,
        total_rows: json.total_rows,
        inserted: json.inserted,
        updated: json.updated,
        skipped: json.skipped,
        invalid: json.invalid,
      })
      setInfo('Commit concluído.')
    } catch (e) {
      setError(e.message || 'Erro no commit.')
    } finally {
      setCommitting(false)
    }
  }

  return (
    <div className="import-bulls">
      <h2>Importar Touros (CSV)</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Enviando...' : 'Upload'}
        </button>

        <button
          onClick={handleCommit}
          disabled={!importBatchId || committing}
        >
          {committing ? 'Confirmando...' : 'Confirmar Commit'}
        </button>

        <button onClick={() => { setFile(null); resetPreview(); }}>
          Limpar
        </button>
      </div>

      {info && <div style={{ color: '#333', marginBottom: 8 }}>{info}</div>}
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}

      {!!headers.length && (
        <div style={{ marginBottom: 12 }}>
          <strong>Headers detectados ({headers.length}):</strong>
          <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {headers.join(', ')}
          </div>
        </div>
      )}

      {totalRows > 0 && (
        <div style={{ marginBottom: 12 }}>
          <strong>Total de linhas:</strong> {totalRows}
        </div>
      )}

      {result && (
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
          <h3>Resultado do Commit</h3>
          <div><strong>Lote:</strong> {result.import_batch_id}</div>
          <div><strong>Total linhas:</strong> {result.total_rows}</div>
          <div><strong>Inseridos:</strong> {result.inserted}</div>
          <div><strong>Atualizados:</strong> {result.updated}</div>
          <div><strong>Ignorados:</strong> {result.skipped}</div>
          <div><strong>Inválidos:</strong> {result.invalid}</div>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
        <p>Requisitos: arquivo .csv (UTF-8) com cabeçalho na primeira linha.</p>
        <p>Observação: colunas “não absorvidas” (EXCLUDE) serão ignoradas no backend; colunas “MAP” serão renomeadas para o canônico.</p>
      </div>
    </div>
  )
}
