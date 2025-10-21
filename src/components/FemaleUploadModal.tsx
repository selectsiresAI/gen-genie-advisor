import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileText } from "lucide-react";
import ImportFemalesUploader from './ImportFemalesUploader';

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
  onImportSuccess,
}) => {
  const downloadTemplate = React.useCallback(() => {
    const headers = [
      'id','farm_id','category','ptas','created_at','updated_at','sire_naab','mgs_naab','mmgs_naab','Fonte','parity_order',
      'identifier','name','cdcb_id','birth_date','HHP$','TPI','NM$','CM$','FM$','GM$','PTAM','PTAF','PTAF%','PTAP','PTAP%',
      'CFP','SCS','PL','DPR','H LIV','GL','MF','DA','Ket','Mast','Met','RP','CCR','HCR','FI','RFI','F SAV','PTAT','UDC',
      'FLC','BWC','STA','STR','BD','DFM','RUA','TW','RLS','RLR','FA','FLS','FTA','RUH','RW','UCL','UD','FTP','RTP','FTL',
      'SCE','DCE','SSB','DSB','GFI'
    ];

    const sampleRow = [
      'FEMEA-001','FARM-123','Multipara','','2024-01-01T12:00:00Z','2024-02-01T12:00:00Z','200HO12345','100HO98765','050HO11111',
      'Genômica','2','BR001','Fêmea Exemplo','1234567890','2020-01-15','820','2650','750','680','590','420','1100','10','3.5',
      '38','3.1','2.3','2.85','4.2','1.8','1.1','0.2','0.1','2.4','1.8','0.4','0.3','1.2','0.8','2.1','1.9','2.2','1.4',
      '0.9','1.7','1.3','0.6','1.5','2.0','1.8','0.7','0.2','0.5','1.1','0.9','1.3','0.8','0.4','1.2','0.6','0.7','1.0',
      '0.3','0.5','1.6','2.1','1.5','1.2','0.9','1.4'
    ];

    const csvContent = [headers.join(';'), sampleRow.join(';')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_femeas_${farmName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [farmName]);

  const handleSuccess = React.useCallback(
    (batchId?: string) => {
      onImportSuccess?.();
      onClose();
    },
    [onImportSuccess, onClose]
  );

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
              O arquivo pode conter colunas em ordem diferente e com nomes alternativos — o importador tenta reconhecer e normalizar.
            </AlertDescription>
          </Alert>

          <ImportFemalesUploader farmId={farmId} onSuccess={handleSuccess} />

          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Baixar Template
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
