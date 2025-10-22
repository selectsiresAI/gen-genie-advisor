import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
