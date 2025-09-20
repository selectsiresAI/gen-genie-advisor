import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, FileText, FileSpreadsheet, File, Trash2, Download, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ArquivoItem {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUpload: string;
  arquivo: File;
}

interface PastaArquivosPageProps {
  onBack: () => void;
}

export default function PastaArquivosPage({ onBack }: PastaArquivosPageProps) {
  const [arquivos, setArquivos] = useState<ArquivoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    
    try {
      const novosArquivos: ArquivoItem[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar tipo de arquivo
        const tiposPermitidos = [
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];
        
        if (!tiposPermitidos.includes(file.type)) {
          toast({
            title: "Tipo de arquivo não suportado",
            description: `O arquivo ${file.name} não é um tipo suportado.`,
            variant: "destructive"
          });
          continue;
        }

        // Validar tamanho (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `O arquivo ${file.name} excede o limite de 10MB.`,
            variant: "destructive"
          });
          continue;
        }

        const novoArquivo: ArquivoItem = {
          id: Date.now().toString() + i,
          nome: file.name,
          tipo: file.type,
          tamanho: file.size,
          dataUpload: new Date().toISOString(),
          arquivo: file
        };

        novosArquivos.push(novoArquivo);
      }

      setArquivos(prev => [...prev, ...novosArquivos]);
      
      if (novosArquivos.length > 0) {
        toast({
          title: "Arquivos enviados",
          description: `${novosArquivos.length} arquivo(s) enviado(s) com sucesso.`
        });
      }
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao enviar os arquivos.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removerArquivo = (id: string) => {
    setArquivos(prev => prev.filter(arquivo => arquivo.id !== id));
    toast({
      title: "Arquivo removido",
      description: "O arquivo foi removido com sucesso."
    });
  };

  const downloadArquivo = (arquivo: ArquivoItem) => {
    const url = URL.createObjectURL(arquivo.arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = arquivo.nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIconeArquivo = (tipo: string) => {
    if (tipo.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (tipo.includes('excel') || tipo.includes('spreadsheet') || tipo.includes('csv')) {
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    }
    return <File className="w-8 h-8 text-blue-500" />;
  };

  const arquivosFiltrados = arquivos.filter(arquivo =>
    arquivo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Pasta de Arquivos</h1>
          </div>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Enviando..." : "Adicionar Arquivos"}
          </Button>
        </div>

        {/* Input de upload (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de arquivos */}
        <Card>
          <CardHeader>
            <CardTitle>Arquivos ({arquivosFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {arquivosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {arquivos.length === 0 ? "Nenhum arquivo enviado" : "Nenhum arquivo encontrado"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {arquivos.length === 0 
                    ? "Adicione arquivos PDF, Excel ou outros documentos"
                    : "Tente uma busca diferente"
                  }
                </p>
                {arquivos.length === 0 && (
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Arquivo
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {arquivosFiltrados.map((arquivo) => (
                  <div
                    key={arquivo.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getIconeArquivo(arquivo.tipo)}
                      <div>
                        <h4 className="font-medium">{arquivo.nome}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatarTamanho(arquivo.tamanho)} • 
                          {new Date(arquivo.dataUpload).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadArquivo(arquivo)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerArquivo(arquivo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações sobre tipos de arquivo suportados */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Arquivo Suportados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Documentos</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• PDF (.pdf)</li>
                  <li>• Word (.doc, .docx)</li>
                  <li>• Texto (.txt)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Planilhas</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Excel (.xlsx, .xls)</li>
                  <li>• CSV (.csv)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Limite:</strong> Máximo 10MB por arquivo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}