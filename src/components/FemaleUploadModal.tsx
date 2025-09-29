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
  const mapping: Record<string, string> = {
    'name': 'name',
    'nome': 'name',
    'identifier': 'identifier',
    'identificador': 'identifier',
    'cdcb_id': 'cdcb_id',
    'id cdcb': 'cdcb_id',
    'birth_date': 'birth_date',
    'data nascimento': 'birth_date',
    'ordem de parto': 'parity_order',
    'parity_order': 'parity_order',
    'categoria': 'category',
    'category': 'category',
    'sire_naab': 'sire_naab',
    'pai naab': 'sire_naab',
    'mgs_naab': 'mgs_naab',
    'avô materno naab': 'mgs_naab',
    'mmgs_naab': 'mmgs_naab',
    'bisavô materno naab': 'mmgs_naab',
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
    'f sav': 'f_sav',
    'ptam': 'ptam',
    'cfp': 'cfp',
    'ptaf': 'ptaf',
    'ptaf_pct': 'ptaf_pct',
    'ptaf%': 'ptaf_pct',
    'ptap': 'ptap',
    'ptap_pct': 'ptap_pct',
    'ptap%': 'ptap_pct',
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
    'h liv': 'h_liv',
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
    'beta-casein': 'beta_casein',
    'kappa_casein': 'kappa_casein',
    'kappa-casein': 'kappa_casein'
  };

  const toCanonicalValue = (canonicalKey: string, header: string, value: any): any => {
    if (!value || value === '' || value === '#########') return null;

    if (
      [
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
        'gfi'
      ].includes(canonicalKey)
    ) {
      const normalizedValue = String(value).replace(',', '.');
      const numValue = parseFloat(normalizedValue);
      return isNaN(numValue) ? null : numValue;
    }

    if (canonicalKey === 'parity_order') {
      const intValue = parseInt(String(value), 10);
      return isNaN(intValue) ? null : intValue;
    }

    if (canonicalKey === 'birth_date') {
      const normalized = String(value).trim();
      const parts = normalized.split(/[\/-]/);
      if (parts.length === 3) {
        const [part1, part2, part3] = parts;
        if (part1.length === 2 && part2.length === 2 && part3.length === 4) {
          return `${part3}-${part2}-${part1}`;
        }
        if (part1.length === 4 && part2.length === 2 && part3.length === 2) {
          return `${part1}-${part2}-${part3}`;
        }
      }
      const date = new Date(normalized);
      return isNaN(date.getTime()) ? normalized : date.toISOString().split('T')[0];
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
          const headers = headerLine.split(';').map(h => h.trim().replace(/^["']|["']$/g, ''));
          console.log('Parsed headers:', headers);
          
          const data = lines.slice(1).map((line, lineIndex) => {
            console.log(`Processing line ${lineIndex + 2}:`, line.substring(0, 100) + '...');
            
            // Split values more carefully
            const values = line.split(';').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row: any = {};
            
            // Usar mapeamento canônico
            headers.forEach((h, index) => {
              const normalizedHeader = h.toLowerCase();
              const canonicalKey = mapping[normalizedHeader] || mapping[h];
              if (!canonicalKey) return;
              const v = toCanonicalValue(canonicalKey, h, values[index]);
              row[canonicalKey] = v ?? values[index];
            });
            
            console.log(`Row ${lineIndex + 2} name:`, row.name);
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

      // Validate required fields
      const invalidRows = recordsData.filter(row => !row.name || row.name.trim() === '');
      if (invalidRows.length > 0) {
        throw new Error(`${invalidRows.length} linha(s) sem nome válido encontrada(s)`);
      }

      // Prepare data for insertion with direct column mapping
      const recordsToInsert = recordsData.map(row => {
        return {
          farm_id: farmId,
          name: row.name,
          identifier: row.identifier || null,
          cdcb_id: row.cdcb_id || null,
          birth_date: row.birth_date || null,
          parity_order: row.parity_order ?? null,
          category: row.category || null,
          sire_naab: row.sire_naab || null,
          mgs_naab: row.mgs_naab || null,
          mmgs_naab: row.mmgs_naab || null,
          hhp_dollar: row.hhp_dollar ?? null,
          tpi: row.tpi ?? null,
          nm_dollar: row.nm_dollar ?? null,
          cm_dollar: row.cm_dollar ?? null,
          fm_dollar: row.fm_dollar ?? null,
          gm_dollar: row.gm_dollar ?? null,
          f_sav: row.f_sav ?? null,
          ptam: row.ptam ?? null,
          cfp: row.cfp ?? null,
          ptaf: row.ptaf ?? null,
          ptaf_pct: row.ptaf_pct ?? null,
          ptap: row.ptap ?? null,
          ptap_pct: row.ptap_pct ?? null,
          pl: row.pl ?? null,
          dpr: row.dpr ?? null,
          liv: row.liv ?? null,
          scs: row.scs ?? null,
          mast: row.mast ?? null,
          met: row.met ?? null,
          rp: row.rp ?? null,
          da: row.da ?? null,
          ket: row.ket ?? null,
          mf: row.mf ?? null,
          ptat: row.ptat ?? null,
          udc: row.udc ?? null,
          flc: row.flc ?? null,
          sce: row.sce ?? null,
          dce: row.dce ?? null,
          ssb: row.ssb ?? null,
          dsb: row.dsb ?? null,
          h_liv: row.h_liv ?? null,
          ccr: row.ccr ?? null,
          hcr: row.hcr ?? null,
          fi: row.fi ?? null,
          gl: row.gl ?? null,
          efc: row.efc ?? null,
          bwc: row.bwc ?? null,
          sta: row.sta ?? null,
          str: row.str ?? null,
          dfm: row.dfm ?? null,
          rua: row.rua ?? null,
          rls: row.rls ?? null,
          rtp: row.rtp ?? null,
          ftl: row.ftl ?? null,
          rw: row.rw ?? null,
          rlr: row.rlr ?? null,
          fta: row.fta ?? null,
          fls: row.fls ?? null,
          fua: row.fua ?? null,
          ruh: row.ruh ?? null,
          ruw: row.ruw ?? null,
          ucl: row.ucl ?? null,
          udp: row.udp ?? null,
          ftp: row.ftp ?? null,
          rfi: row.rfi ?? null,
          gfi: row.gfi ?? null,
          beta_casein: row.beta_casein || null,
          kappa_casein: row.kappa_casein || null
        };
      });

      // Insert records in batches with upsert
      const batchSize = 100;
      let totalInserted = 0;
      
      for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const chunk = recordsToInsert.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from(TARGET_TABLE)
          .upsert(chunk, { onConflict: "farm_id,identifier,cdcb_id" });

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
    // Create a comprehensive CSV template based on females_denorm view
    const headers = [
      'Nome',
      'Identificador',
      'ID CDCB',
      'Data Nascimento',
      'Ordem de Parto',
      'Categoria',
      'Pai NAAB',
      'Avô Materno NAAB',
      'BisAvô Materno NAAB',
      'HHP$',
      'TPI',
      'NM$',
      'CM$',
      'FM$',
      'GM$',
      'F SAV',
      'PTAM',
      'CFP',
      'PTAF',
      'PTAF%',
      'PTAP',
      'PTAP%',
      'PL',
      'DPR',
      'LIV',
      'SCS',
      'MAST',
      'MET',
      'RP',
      'DA',
      'KET',
      'MF',
      'PTAT',
      'UDC',
      'FLC',
      'SCE',
      'DCE',
      'SSB',
      'DSB',
      'H LIV',
      'CCR',
      'HCR',
      'FI',
      'GL',
      'EFC',
      'BWC',
      'STA',
      'STR',
      'DFM',
      'RUA',
      'RLS',
      'RTP',
      'FTL',
      'RW',
      'RLR',
      'FTA',
      'FLS',
      'FUA',
      'RUH',
      'RUW',
      'UCL',
      'UDP',
      'FTP',
      'RFI',
      'Beta-Casein',
      'Kappa-Casein',
      'GFI'
    ];
    
    const sampleData = [
      'Fêmea Exemplo;BR001;CDCB123456;2020-01-15;1;Novilha;200HO12345;200HO54321;200HO67890;820;2650;750;680;590;420;1,2;2,5;105;2,5;1,2;2,8;1,1;4,2;1,8;1,1;0,2;0,1;2,4;1,8;0,4;0,3;1,2;0,8;2,1;1,9;2,2;1,4;0,9;1,7;1,3;0,6;1,5;2,0;1,8;0,7;0,2;0,5;1,1;0,9;1,3;0,8;0,4;1,2;0,6;0,7;1,0;0,3;0,5;1,6;1,2;0,4;0,6;0,7;1,0;A2A2;AA;1,1'
    ];

    const csvContent = [headers.join(';'), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_rebanho_femeas_${farmName.replace(/\s+/g, '_')}.csv`;
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
              O arquivo deve conter as colunas conforme o template. Baixe o template para ver todas as colunas disponíveis da view females_denorm.
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