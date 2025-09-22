import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FemaleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  farmName: string;
}

const FemaleUploadModal: React.FC<FemaleUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  farmId, 
  farmName 
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
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Fêmeas importadas com sucesso!",
        description: `Arquivo processado para a fazenda ${farmName}`,
      });

      setSelectedFile(null);
      onClose();
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível processar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const headers = [
      'Identificacao',
      'Nome',
      'Data_Nascimento',
      'Pai_NAAB',
      'Avo_Materno_NAAB',
      'Bisavo_Materno_NAAB',
      'TPI',
      'NM_Dollar',
      'Leite',
      'Gordura',
      'Proteina',
      'DPR',
      'SCS'
    ];
    
    const sampleData = [
      'BR001,VACA EXEMPLO,2020-01-15,200HO12345,200HO67890,200HO11111,2650,820,1450,58,45,1.2,2.85'
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_femeas.csv';
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
              O arquivo deve conter as colunas: Identificacao, Nome, Data_Nascimento, 
              Pai_NAAB, TPI, NM_Dollar, etc.
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