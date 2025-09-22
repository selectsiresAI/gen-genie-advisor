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
            
            headers.forEach((header, index) => {
              const value = values[index];
              if (value && value !== '' && value !== '#########') { // Filter out Excel overflow values
                // Convert numeric fields
                if (['hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar', 
                     'f_sav', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct', 
                     'pl', 'dpr', 'liv', 'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf',
                     'ptat', 'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr',
                     'hcr', 'fi', 'gl', 'efc', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls',
                     'rtp', 'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw', 
                     'ucl', 'udp', 'ftp', 'rfi', 'gfi'].includes(header)) {
                  const numValue = parseFloat(value);
                  row[header] = isNaN(numValue) ? null : numValue;
                } else {
                  row[header] = value;
                }
              } else {
                row[header] = null;
              }
            });
            
            console.log(`Row ${lineIndex + 2} name:`, row.name);
            return row;
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
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        femalesData = await parseCsvFile(selectedFile);
      } else {
        throw new Error('Apenas arquivos CSV são suportados no momento. Use o template CSV.');
      }

      if (femalesData.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      // Validate required fields
      const invalidRows = femalesData.filter(row => !row.name);
      if (invalidRows.length > 0) {
        throw new Error(`${invalidRows.length} linha(s) sem nome válido encontrada(s)`);
      }

      // Prepare data for insertion
      const femalesToInsert = femalesData.map(row => {
        // Create PTA object from numeric fields
        const ptas: any = {};
        ['hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar', 
         'f_sav', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct', 
         'pl', 'dpr', 'liv', 'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf',
         'ptat', 'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr',
         'hcr', 'fi', 'gl', 'efc', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls',
         'rtp', 'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw', 
         'ucl', 'udp', 'ftp', 'rfi', 'gfi', 'beta_casein', 'kappa_casein'].forEach(field => {
          if (row[field] !== null && row[field] !== undefined) {
            ptas[field] = row[field];
          }
        });

        return {
          farm_id: farmId,
          name: row.name,
          identifier: row.identifier || null,
          cdcb_id: row.cdcb_id || null,
          birth_date: row.birth_date || null,
          sire_naab: row.sire_naab || null,
          mgs_naab: row.mgs_naab || null,
          mmgs_naab: row.mmgs_naab || null,
          ptas: ptas
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

  const downloadTemplate = () => {
    // Create a comprehensive CSV template based on females_denorm table
    const headers = [
      'identifier',
      'name',
      'birth_date',
      'cdcb_id',
      'sire_naab',
      'mgs_naab',
      'mmgs_naab',
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
      'gfi'
    ];
    
    const sampleData = [
      'BR001,VACA EXEMPLO,2020-01-15,1234567890,200HO12345,200HO67890,200HO11111,820,2650,750,680,590,420,1.2,2.1,3.5,2.8,105,2.5,110,1.2,1.5,2.85,4.2,1.8,1.1,0.2,0.1,2.4,1.8,0.4,0.3,1.2,0.8,2.1,1.9,2.2,1.4,0.9,1.7,1.3,0.6,1.5,2.0,1.8,0.7,0.2,0.5,1.1,0.9,1.3,0.8,0.4,1.2,0.6,0.7,1.0,0.3,0.5,A2A2,AA,1.6'
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_femeas_${farmName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template baixado",
      description: "Use este modelo para organizar seus dados.",
    });
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O arquivo deve conter as colunas conforme o template. Baixe o template para ver todas as colunas disponíveis da tabela females_denorm.
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