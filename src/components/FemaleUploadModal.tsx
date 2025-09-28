import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';

interface FemaleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  farmName: string;
  onImportSuccess?: () => void;
}

const TARGET_TABLE = "females";

const DB_FIELD_MAP: Record<string, string> = {
  "hhp$": "hhp_dollar",
  "nm$": "nm_dollar",
  "cm$": "cm_dollar",
  "fm$": "fm_dollar",
  "gm$": "gm_dollar",
};

const HEADER_MAPPING: Record<string, string> = {
  'hhp_dollar': 'hhp$',
  'hhp$': 'hhp$',
  'tpi': 'tpi',
  'nm_dollar': 'nm$',
  'nm$': 'nm$',
  'cm_dollar': 'cm$',
  'cm$': 'cm$',
  'fm_dollar': 'fm$',
  'fm$': 'fm$',
  'gm_dollar': 'gm$',
  'gm$': 'gm$',
  'f_sav': 'f_sav',
  'ptam': 'ptam',
  'cfp': 'cfp',
  'ptaf': 'ptaf',
  'ptaf_pct': 'ptaf_pct',
  'ptap': 'ptap',
  'ptap_pct': 'ptap_pct',
  'pl': 'pl',
  'dpr': 'dpr',
  'liv': 'liv',
  'scs': 'scs',
  'mast': 'mast',
  'met': 'met',
  'rp': 'rp',
  'da': 'da',
  'ket': 'ket',
  'mf': 'mf',
  'ptat': 'ptat',
  'udc': 'udc',
  'flc': 'flc',
  'sce': 'sce',
  'dce': 'dce',
  'ssb': 'ssb',
  'dsb': 'dsb',
  'h_liv': 'h_liv',
  'ccr': 'ccr',
  'hcr': 'hcr',
  'fi': 'fi',
  'gl': 'gl',
  'efc': 'efc',
  'bwc': 'bwc',
  'sta': 'sta',
  'str': 'str',
  'dfm': 'dfm',
  'rua': 'rua',
  'rls': 'rls',
  'rtp': 'rtp',
  'ftl': 'ftl',
  'rw': 'rw',
  'rlr': 'rlr',
  'fta': 'fta',
  'fls': 'fls',
  'fua': 'fua',
  'ruh': 'ruh',
  'ruw': 'ruw',
  'ucl': 'ucl',
  'udp': 'udp',
  'ftp': 'ftp',
  'rfi': 'rfi',
  'gfi': 'gfi',
  'beta_casein': 'beta_casein',
  'kappa_casein': 'kappa_casein'
};

const NORMALIZED_HEADER_MAPPING: Record<string, string> = Object.entries(HEADER_MAPPING).reduce(
  (acc, [key, value]) => {
    acc[key.toLowerCase()] = value;
    return acc;
  },
  {} as Record<string, string>
);

type FemaleRow = Record<string, unknown>;

const PTAS_KEYS = [
  'tpi','ptam','ptaf','ptaf_pct','ptap','ptap_pct','scs','pl','dpr','liv','ptat','udc','flc','sce','dce','ssb','dsb',
  'h_liv','ccr','hcr','fi','gl','efc','bwc','sta','str','dfm','rua','rls','rtp','ftl','rw','rlr','fta','fls','fua',
  'ruh','ruw','ucl','udp','ftp','rfi','gfi','beta_casein','kappa_casein'
];

const hasValidString = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
};

const dbCol = (canonicalKey: string): string => {
  return DB_FIELD_MAP[canonicalKey] ?? canonicalKey;
};

const getRowValue = (row: FemaleRow, key: string): unknown => {
  if (key in row) return row[key];
  const normalized = key.toLowerCase();
  const found = Object.keys(row).find((k) => k.toLowerCase() === normalized);
  return found ? row[found] : undefined;
};

const mapFixedColumnsFromRow = (r: FemaleRow, farmId: string): FemaleRow => {
  const out: FemaleRow = { farm_id: farmId };

  const firstNonNull = (...keys: string[]) => {
    for (const key of keys) {
      const value = getRowValue(r, key);
      if (value != null && value !== "") return value;
    }
    return undefined;
  };

  const toTrimmedString = (value: unknown) =>
    value == null ? undefined : String(value).trim() || undefined;

  const nameValue = firstNonNull("Nome", "name", "Nome Animal", "Animal");
  if (nameValue != null) {
    out.name = toTrimmedString(nameValue);
  }

  const cdcbValue = firstNonNull("ID CDCB", "cdcb_id", "CDCB");
  if (cdcbValue != null) {
    out.cdcb_id = toTrimmedString(cdcbValue);
  }

  const birthValue = firstNonNull("Data de Nascimento", "birth_date", "Nascimento");
  if (birthValue) {
    out.birth_date = toTrimmedString(birthValue)?.slice(0, 10);
  }

  const ped = firstNonNull("Pedigre Pai/Avô Materno/BisaAvô Materno");
  if (ped) {
    const parts = String(ped)
      .split("/")
      .map((s) => s.trim());
    out.sire_naab = parts[0] || null;
    out.mgs_naab = parts[1] || null;
    out.mmgs_naab = parts[2] || null;
  }

  const sireValue = firstNonNull("sire_naab", "Pai", "NAAB", "naab");
  if (sireValue && !out.sire_naab) {
    out.sire_naab = toTrimmedString(sireValue);
  }

  const mgsValue = firstNonNull("mgs_naab", "Avô Materno");
  if (mgsValue && !out.mgs_naab) {
    out.mgs_naab = toTrimmedString(mgsValue);
  }

  const mmgsValue = firstNonNull("mmgs_naab", "BisaAvô Materno");
  if (mmgsValue && !out.mmgs_naab) {
    out.mmgs_naab = toTrimmedString(mmgsValue);
  }

  const identifierValue = firstNonNull("ID Fazenda", "identifier", "animal_id", "Brinco");
  if (identifierValue != null) {
    out.identifier = toTrimmedString(identifierValue);
  }

  if (!out.name) {
    const fallback = out.identifier ?? out.cdcb_id;
    if (fallback) {
      out.name = fallback;
    }
  }

  return out;
};

const FemaleUploadModal: React.FC<FemaleUploadModalProps> = ({
  isOpen, 
  onClose, 
  farmId, 
  farmName,
  onImportSuccess
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Mapeamento de cabeçalhos para chaves canônicas
  const toCanonicalValue = (canonicalKey: string, value: unknown): number | string | null => {
    if (value === null || value === undefined) return null;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === '#########') return null;
      const numericKeys = ['hhp$', 'tpi', 'nm$', 'cm$', 'fm$', 'gm$', 'f_sav', 'ptam', 'cfp',
        'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct', 'pl', 'dpr', 'liv', 'scs',
        'mast', 'met', 'rp', 'da', 'ket', 'mf', 'ptat', 'udc', 'flc', 'sce',
        'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr', 'fi', 'gl', 'efc', 'bwc',
        'sta', 'str', 'dfm', 'rua', 'rls', 'rtp', 'ftl', 'rw', 'rlr', 'fta',
        'fls', 'fua', 'ruh', 'ruw', 'ucl', 'udp', 'ftp', 'rfi', 'gfi'];

      if (numericKeys.includes(canonicalKey)) {
        const normalizedValue = trimmed.replace(',', '.');
        const numValue = parseFloat(normalizedValue);
        return Number.isNaN(numValue) ? null : numValue;
      }

      return trimmed;
    }

    if (typeof value === 'number') {
      const numericKeys = ['hhp$', 'tpi', 'nm$', 'cm$', 'fm$', 'gm$', 'f_sav', 'ptam', 'cfp',
        'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct', 'pl', 'dpr', 'liv', 'scs',
        'mast', 'met', 'rp', 'da', 'ket', 'mf', 'ptat', 'udc', 'flc', 'sce',
        'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr', 'fi', 'gl', 'efc', 'bwc',
        'sta', 'str', 'dfm', 'rua', 'rls', 'rtp', 'ftl', 'rw', 'rlr', 'fta',
        'fls', 'fua', 'ruh', 'ruw', 'ucl', 'udp', 'ftp', 'rfi', 'gfi'];

      if (numericKeys.includes(canonicalKey)) {
        return value;
      }

      return String(value);
    }

    return value as string | null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const parseCsvFile = async (file: File): Promise<{ headers: string[]; rows: FemaleRow[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          console.log('Raw CSV text (first 500 chars):', text.substring(0, 500));
          
          // Split lines and filter empty ones
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          console.log('Number of lines after filtering:', lines.length);
          
          if (lines.length < 2) {
            reject(new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados'));
            return;
          }
          
          // Parse headers more carefully
          const headerLine = lines[0];
          console.log('Header line:', headerLine);
          
          // Handle different CSV delimiters and quoted fields
          const headers = headerLine.split(';').map(h => h.trim().replace(/^["']|["']$/g, ''));
          console.log('Parsed headers:', headers);
          
          const data = lines.slice(1).map((line, lineIndex) => {
            console.log(`Processing line ${lineIndex + 2}:`, line.substring(0, 100) + '...');

            // Split values more carefully
            const values = line.split(';').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row: FemaleRow = {};

            headers.forEach((h, index) => {
              const rawValue = values[index];
              row[h] = rawValue === '' ? null : rawValue;
            });

            return row;
          });

          resolve({ headers, rows: data });
        } catch (error) {
          console.error('CSV parsing error:', error);
          reject(new Error('Erro ao processar arquivo CSV'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo CSV ou Excel para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let parsedCsv: { headers: string[]; rows: FemaleRow[] } | null = null;

      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        parsedCsv = await parseCsvFile(selectedFile);
      } else {
        throw new Error('Apenas arquivos CSV são suportados no momento. Use o template CSV.');
      }

      if (!parsedCsv) {
        throw new Error('Não foi possível processar o arquivo fornecido');
      }

      const { headers, rows } = parsedCsv;

      if (!rows || rows.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      const normalizedRecords: FemaleRow[] = rows.map((row) => {
        const obj: FemaleRow = mapFixedColumnsFromRow(row, farmId);

        headers.forEach((header) => {
          const canonicalKey = NORMALIZED_HEADER_MAPPING[header.toLowerCase()];
          if (!canonicalKey) return;

          const rawValue = getRowValue(row, header);
          const convertedValue = toCanonicalValue(String(canonicalKey), rawValue);
          const fallbackValue =
            rawValue === undefined || rawValue === null || rawValue === '' ? null : rawValue;
          const finalValue = convertedValue ?? fallbackValue;

          if (finalValue !== undefined) {
            obj[dbCol(canonicalKey)] = finalValue;
          }
        });

        const ptas: Record<string, unknown> = {};
        PTAS_KEYS.forEach((key) => {
          const column = dbCol(key);
          if (obj[column] !== undefined && obj[column] !== null) {
            ptas[key] = obj[column];
          }
        });

        if (Object.keys(ptas).length > 0) {
          obj.ptas = ptas;
        }

        return obj;
      });

      const missingCdcb = normalizedRecords.filter((row) => !hasValidString(row['cdcb_id']));
      if (missingCdcb.length > 0) {
        throw new Error(`${missingCdcb.length} linha(s) sem ID CDCB válido encontrada(s)`);
      }

      const missingName = normalizedRecords.filter((row) => !hasValidString(row['name']));
      if (missingName.length > 0) {
        throw new Error(`${missingName.length} linha(s) sem Nome válido encontrada(s)`);
      }

      const batchSize = 100;
      let totalInserted = 0;

      for (let i = 0; i < normalizedRecords.length; i += batchSize) {
        const chunk = normalizedRecords.slice(i, i + batchSize);

        const { error } = await supabase
          .from(TARGET_TABLE)
          .upsert(chunk, { onConflict: "farm_id,cdcb_id" });

        if (error) {
          console.error('Supabase insertion error:', error);
          throw new Error(`Erro ao inserir dados: ${error.message}`);
        }

        totalInserted += chunk.length;
      }

      toast({
        title: "Fêmeas importadas com sucesso!",
        description: `${totalInserted} registro(s) importado(s) para a fazenda ${farmName}`,
      });

      setSelectedFile(null);
      
      // Call import success callback if provided
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Não foi possível processar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a comprehensive CSV template based on females table
    const headers = [
      'Nome',
      'ID CDCB',
      'Data de Nascimento',
      'Pedigre Pai/Avô Materno/BisaAvô Materno',
      'ID Fazenda',
      'sire_naab',
      'mgs_naab',
      'mmgs_naab',
      'hhp$',
      'tpi',
      'nm$',
      'cm$',
      'fm$',
      'gm$',
      'f_sav',
      'ptam',
      'cfp',
      'ptaf',
      'ptaf_pct',
      'ptap',
      'ptap_pct',
      'pl',
      'dpr',
      'liv',
      'scs',
      'mast',
      'met',
      'rp',
      'da',
      'ket',
      'mf',
      'ptat',
      'udc',
      'flc',
      'sce',
      'dce',
      'ssb',
      'dsb',
      'h_liv',
      'ccr',
      'hcr',
      'fi',
      'gl',
      'efc',
      'bwc',
      'sta',
      'str',
      'dfm',
      'rua',
      'rls',
      'rtp',
      'ftl',
      'rw',
      'rlr',
      'fta',
      'fls',
      'fua',
      'ruh',
      'ruw',
      'ucl',
      'udp',
      'ftp',
      'rfi',
      'gfi',
      'beta_casein',
      'kappa_casein'
    ];
    
    const sampleData = [
      'Fêmea Exemplo;1234567890;2021-05-10;PAI123/AVM456/BAVM789;BRINCO001;PAI123;AVM456;BAVM789;820;2650;750;680;590;420;1,2;2,1;3,5;2,8;105;2,5;110;1,2;1,5;2,85;4,2;1,8;1,1;0,2;0,1;2,4;1,8;0,4;0,3;1,2;0,8;2,1;1,9;2,2;1,4;0,9;1,7;1,3;0,6;1,5;2,0;1,8;0,7;0,2;0,5;1,1;0,9;1,3;0,8;0,4;1,2;0,6;0,7;1,0;0,3;0,5;1,6;A2A2;AA'
    ];

    const csvContent = [headers.join(';'), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_registros_geneticos_${farmName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template baixado",
      description: "Use este modelo para organizar seus dados genéticos.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Registros Genéticos</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com os dados dos registros genéticos para a fazenda {farmName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O arquivo deve conter as colunas conforme o template. Baixe o template para ver todas as colunas disponíveis da tabela genetic_records.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Selecionar arquivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Baixar Template
            </Button>
            
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Formatos aceitos:</strong> CSV, Excel (.xlsx, .xls)<br />
            <strong>Tamanho máximo:</strong> 10MB<br />
            <strong>Codificação:</strong> UTF-8 (recomendado)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FemaleUploadModal;