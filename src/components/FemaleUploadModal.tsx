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

  // Mapeamento de cabeçalhos para colunas da tabela females/females_denorm
  const mapping: Record<string, string> = {
    'id': 'id',
    'farm_id': 'farm_id',
    'name': 'name',
    'identifier': 'identifier',
    'animal_id': 'identifier',
    'cdcb_id': 'cdcb_id',
    'sire_naab': 'sire_naab',
    'naab': 'sire_naab',
    'mgs_naab': 'mgs_naab',
    'mmgs_naab': 'mmgs_naab',
    'birth_date': 'birth_date',
    'dob': 'birth_date',
    'ptas': 'ptas',
    'created_at': 'created_at',
    'updated_at': 'updated_at',
    'hhp_dollar': 'hhp_dollar',
    'hhp$': 'hhp_dollar',
    'tpi': 'tpi',
    'nm_dollar': 'nm_dollar',
    'nm$': 'nm_dollar',
    'cm_dollar': 'cm_dollar',
    'cm$': 'cm_dollar',
    'fm_dollar': 'fm_dollar',
    'fm$': 'fm_dollar',
    'gm_dollar': 'gm_dollar',
    'gm$': 'gm_dollar',
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
    'kappa_casein': 'kappa_casein',
    'parity_order': 'parity_order',
    'category': 'category'
  };

  const numericFields = new Set([
    'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
    'f_sav', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct', 'pl',
    'dpr', 'liv', 'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf', 'ptat',
    'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr', 'fi',
    'gl', 'efc', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls', 'rtp', 'ftl',
    'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw', 'ucl', 'udp', 'ftp',
    'rfi', 'gfi', 'parity_order'
  ]);

  const splitCsvLine = (line: string, delimiter: string) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values.map(v => v.replace(/^["']|["']$/g, ''));
  };

  const toCanonicalValue = (canonicalKey: string, header: string, value: any): any => {
    if (!value || value === '' || value === '#########') return null;

    if (canonicalKey === 'ptas') {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch (err) {
        console.warn(`⚠️  Não foi possível converter o campo PTAs na coluna ${header}. Valor mantido como string.`);
        return value;
      }
    }

    if (numericFields.has(canonicalKey)) {
      const normalizedValue = String(value).replace('%', '').replace(',', '.');
      const numValue = canonicalKey === 'parity_order'
        ? parseInt(normalizedValue, 10)
        : parseFloat(normalizedValue);
      return isNaN(numValue) ? null : numValue;
    }

    return value;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const parseCsvFile = async (file: File): Promise<any[]> => {
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
          const delimiter = headerLine.includes(';')
            ? ';'
            : headerLine.includes(',')
              ? ','
              : headerLine.includes('\t')
                ? '\t'
                : ';';

          const headers = splitCsvLine(headerLine, delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
          console.log('Parsed headers:', headers);

          const data = lines.slice(1).map((line, lineIndex) => {
            console.log(`Processing line ${lineIndex + 2}:`, line.substring(0, 100) + '...');

            const values = splitCsvLine(line, delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row: any = {};

            // Usar mapeamento canônico
            headers.forEach((h, index) => {
              const canonicalKey = mapping[h];
              if (!canonicalKey) return;
              const v = toCanonicalValue(canonicalKey, h, values[index]);
              row[canonicalKey] = v ?? values[index];
            });

            console.log(`Row ${lineIndex + 2} identifier:`, row.identifier);
            return row;
          });
          
          // Filter out rows without name
          const validData = data.filter(row => row.name && row.name.trim() !== '');
          console.log('Valid rows after filtering:', validData.length);
          console.log('Sample valid row:', validData[0]);

          resolve(validData);
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
      let recordsData: any[] = [];

      // Parse CSV file
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        recordsData = await parseCsvFile(selectedFile);
      } else {
        throw new Error('Apenas arquivos CSV são suportados no momento. Use o template CSV.');
      }

      if (recordsData.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      // Prepare data for insertion na tabela females
      const recordsToInsert = recordsData.map(row => {
        const record: any = {
          farm_id: farmId,
          name: row.name,
        };

        if (row.id) {
          record.id = row.id;
        }

        const optionalFields = [
          'identifier', 'cdcb_id', 'sire_naab', 'mgs_naab', 'mmgs_naab', 'birth_date',
          'ptas', 'created_at', 'updated_at', 'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar',
          'fm_dollar', 'gm_dollar', 'f_sav', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap',
          'ptap_pct', 'pl', 'dpr', 'liv', 'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf',
          'ptat', 'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr', 'fi',
          'gl', 'efc', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls', 'rtp', 'ftl', 'rw', 'rlr',
          'fta', 'fls', 'fua', 'ruh', 'ruw', 'ucl', 'udp', 'ftp', 'rfi', 'beta_casein',
          'kappa_casein', 'gfi', 'parity_order', 'category'
        ];

        optionalFields.forEach(field => {
          if (field in row) {
            record[field] = row[field] ?? null;
          }
        });

        return record;
      });

      // Insert records in batches with upsert na tabela females
      const batchSize = 100;
      let totalInserted = 0;

      for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const chunk = recordsToInsert.slice(i, i + batchSize);

        const { data, error } = await supabase
          .from('females')
          .upsert(chunk, { onConflict: 'id' });

        if (error) {
          console.error('Supabase insertion error:', error);
          throw new Error(`Erro ao inserir dados: ${error.message}`);
        }

        totalInserted += chunk.length;
      }

      toast({
        title: "Rebanho importado com sucesso!",
        description: `${totalInserted} fêmea(s) importada(s) para a fazenda ${farmName}`,
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
    // Create a comprehensive CSV template baseado na tabela females/females_denorm
    const headers = [
      'id',
      'farm_id',
      'name',
      'identifier',
      'cdcb_id',
      'sire_naab',
      'mgs_naab',
      'mmgs_naab',
      'birth_date',
      'ptas',
      'created_at',
      'updated_at',
      'hhp_dollar',
      'tpi',
      'nm_dollar',
      'cm_dollar',
      'fm_dollar',
      'gm_dollar',
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
      'beta_casein',
      'kappa_casein',
      'gfi',
      'parity_order',
      'category'
    ];

    const sampleRow: Record<string, string> = {
      id: 'uuid-exemplo',
      farm_id: farmId,
      name: 'Fêmea Exemplo',
      identifier: 'BR123456789',
      cdcb_id: 'USA000000000',
      sire_naab: '1HO12345',
      mgs_naab: '1HO54321',
      mmgs_naab: '1HO67890',
      birth_date: '2021-05-12',
      ptas: '{"TPI": 2700, "NM$": 620}',
      hhp_dollar: '850',
      tpi: '2700',
      nm_dollar: '620',
      cm_dollar: '580',
      fm_dollar: '520',
      gm_dollar: '450',
      f_sav: '1.2',
      ptam: '1100',
      ptaf: '45',
      ptap: '38',
      pl: '2.3',
      dpr: '1.1',
      scs: '2.85',
      ptat: '2.4',
      udc: '2.1',
      category: 'Novilha'
    };

    const sampleData = [headers.map(header => sampleRow[header] ?? '').join(';')];

    const csvContent = [headers.join(';'), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_rebanho_${farmName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template baixado",
      description: "Use este modelo para organizar os dados do rebanho.",
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
              O arquivo deve conter as colunas conforme o template. Baixe o template para ver todas as colunas disponíveis nas tabelas females/females_denorm.
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