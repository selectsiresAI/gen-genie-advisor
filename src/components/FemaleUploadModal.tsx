import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from "xlsx";

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const NUMERIC_FIELDS = new Set([
    'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
    'f_sav', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct',
    'pl', 'dpr', 'liv', 'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf',
    'ptat', 'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr',
    'hcr', 'fi', 'gl', 'efc', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls',
    'rtp', 'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw',
    'ucl', 'udp', 'ftp', 'rfi', 'gfi'
  ]);

  const normalizeRow = (raw: Record<string, any>) => {
    const row: any = {};
    Object.entries(raw).forEach(([header, value]) => {
      const trimmedHeader = header?.toString().trim();
      if (!trimmedHeader) return;

      if (value === undefined || value === null || value === '' || value === '#########') {
        row[trimmedHeader] = null;
        return;
      }

      if (NUMERIC_FIELDS.has(trimmedHeader)) {
        const asString = typeof value === 'number' ? value.toString() : String(value);
        const normalized = asString.replace(',', '.');
        const numeric = Number(normalized);
        row[trimmedHeader] = Number.isFinite(numeric) ? numeric : null;
      } else {
        row[trimmedHeader] = typeof value === 'string' ? value.trim() : value;
      }
    });

    return row;
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
          const delimiter = headerLine.includes(';') ? ';' : ',';
          const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
          console.log('Parsed headers:', headers);

          const data = lines.slice(1).map((line, lineIndex) => {
            console.log(`Processing line ${lineIndex + 2}:`, line.substring(0, 100) + '...');

            // Split values more carefully
            const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
            const rawRow: Record<string, any> = {};

            headers.forEach((header, index) => {
              rawRow[header] = values[index] ?? null;
            });

            const normalizedRow = normalizeRow(rawRow);
            console.log(`Row ${lineIndex + 2} name:`, normalizedRow.name);
            return normalizedRow;
          });

          // Filter out rows without names
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

  const parseExcelFile = async (file: File): Promise<any[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error('Arquivo Excel sem abas válidas');
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: null,
      raw: false,
      blankrows: false,
    });

    const normalized = rows
      .map((row) => normalizeRow(row))
      .filter((row) => row && row.name && String(row.name).trim() !== '');

    if (!normalized.length) {
      throw new Error('Nenhum dado válido encontrado no arquivo Excel');
    }

    return normalized;
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
      let femalesData: any[] = [];

      // Parse CSV file
      const extension = selectedFile.name.toLowerCase();

      if (extension.endsWith('.csv')) {
        femalesData = await parseCsvFile(selectedFile);
      } else if (extension.endsWith('.xlsx') || extension.endsWith('.xls')) {
        femalesData = await parseExcelFile(selectedFile);
      } else {
        throw new Error('Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls).');
      }

      if (femalesData.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      // Validate required fields
      const invalidRows = femalesData.filter(row => !row.name);
      if (invalidRows.length > 0) {
        throw new Error(`${invalidRows.length} linha(s) sem nome válido encontrada(s)`);
      }

      // Prepare data for insertion with direct column mapping
      const femalesToInsert = femalesData.map(row => {
        return {
          farm_id: farmId,
          name: row.name,
          identifier: row.identifier || null,
          cdcb_id: row.cdcb_id || null,
          birth_date: row.birth_date || null,
          parity_order: row.parity_order ? parseInt(row.parity_order) : null,
          sire_naab: row.sire_naab || null,
          mgs_naab: row.mgs_naab || null,
          mmgs_naab: row.mmgs_naab || null,
          // Direct PTA column mapping
          hhp_dollar: row.hhp_dollar,
          tpi: row.tpi,
          nm_dollar: row.nm_dollar,
          cm_dollar: row.cm_dollar,
          fm_dollar: row.fm_dollar,
          gm_dollar: row.gm_dollar,
          f_sav: row.f_sav,
          ptam: row.ptam,
          cfp: row.cfp,
          ptaf: row.ptaf,
          ptaf_pct: row.ptaf_pct,
          ptap: row.ptap,
          ptap_pct: row.ptap_pct,
          pl: row.pl,
          dpr: row.dpr,
          liv: row.liv,
          scs: row.scs,
          mast: row.mast,
          met: row.met,
          rp: row.rp,
          da: row.da,
          ket: row.ket,
          mf: row.mf,
          ptat: row.ptat,
          udc: row.udc,
          flc: row.flc,
          sce: row.sce,
          dce: row.dce,
          ssb: row.ssb,
          dsb: row.dsb,
          h_liv: row.h_liv,
          ccr: row.ccr,
          hcr: row.hcr,
          fi: row.fi,
          gl: row.gl,
          efc: row.efc,
          bwc: row.bwc,
          sta: row.sta,
          str: row.str,
          dfm: row.dfm,
          rua: row.rua,
          rls: row.rls,
          rtp: row.rtp,
          ftl: row.ftl,
          rw: row.rw,
          rlr: row.rlr,
          fta: row.fta,
          fls: row.fls,
          fua: row.fua,
          ruh: row.ruh,
          ruw: row.ruw,
          ucl: row.ucl,
          udp: row.udp,
          ftp: row.ftp,
          rfi: row.rfi,
          gfi: row.gfi,
          beta_casein: row.beta_casein,
          kappa_casein: row.kappa_casein
        };
      });

      // Insert females in batches
      const batchSize = 100;
      let totalInserted = 0;
      
      for (let i = 0; i < femalesToInsert.length; i += batchSize) {
        const batch = femalesToInsert.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('females')
          .insert(batch)
          .select('id');

        if (error) {
          console.error('Supabase insertion error:', error);
          throw new Error(`Erro ao inserir dados: ${error.message}`);
        }

        totalInserted += data?.length || 0;
      }

      toast({
        title: "Fêmeas importadas com sucesso!",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Fêmeas</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel com os dados das fêmeas para a fazenda {farmName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
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