import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Download, Upload, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TranslationBatch() {
  const [sourceJson, setSourceJson] = useState("");
  const [targetLocale, setTargetLocale] = useState("en-US");
  const [translatedJson, setTranslatedJson] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [stats, setStats] = useState<{ sourceKeyCount: number; targetKeyCount: number } | null>(null);

  const handleTranslate = async () => {
    if (!sourceJson.trim()) {
      toast.error("Por favor, insira o JSON de origem");
      return;
    }

    try {
      // Validate JSON
      JSON.parse(sourceJson);
    } catch (error) {
      toast.error("JSON inválido. Verifique a sintaxe.");
      return;
    }

    setIsTranslating(true);
    setTranslatedJson("");
    setStats(null);

    try {
      const { data, error } = await supabase.functions.invoke('translate-i18n', {
        body: {
          sourceJson: JSON.parse(sourceJson),
          targetLocale,
        },
      });

      if (error) {
        if (error.message.includes("429")) {
          toast.error("Limite de requisições excedido. Aguarde alguns minutos.");
        } else if (error.message.includes("402")) {
          toast.error("Créditos insuficientes. Adicione créditos no workspace Lovable.");
        } else {
          toast.error("Erro ao traduzir: " + error.message);
        }
        return;
      }

      if (data.success) {
        setTranslatedJson(JSON.stringify(data.translatedJson, null, 2));
        setStats({
          sourceKeyCount: data.sourceKeyCount,
          targetKeyCount: data.targetKeyCount,
        });
        toast.success("Tradução concluída com sucesso!");
      } else {
        toast.error("Erro ao traduzir: " + (data.error || "Erro desconhecido"));
      }
    } catch (error: any) {
      console.error("Translation error:", error);
      toast.error("Erro ao chamar a função de tradução: " + error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLoadExample = () => {
    const example = {
      "actions.delete": "Excluir",
      "actions.cancel": "Cancelar",
      "herd.delete.confirm.title": "Excluir animal(is)",
      "herd.delete.confirm.message": "Tem certeza que deseja excluir permanentemente o(s) animal(is) selecionado(s)? Esta ação não pode ser desfeita.",
    };
    setSourceJson(JSON.stringify(example, null, 2));
  };

  const handleDownloadTranslation = () => {
    if (!translatedJson) {
      toast.error("Nenhuma tradução disponível para download");
      return;
    }

    const blob = new Blob([translatedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translation-${targetLocale}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo baixado!");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSourceJson(content);
      toast.success("Arquivo carregado!");
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tradução em Lote via IA</CardTitle>
          <CardDescription>
            Use Lovable AI para traduzir arquivos JSON de i18n automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Languages className="h-4 w-4" />
            <AlertDescription>
              <strong>Instruções:</strong> A IA preservará automaticamente todos os termos técnicos (PTAs, NAABs) e traduzirá apenas o texto natural.
              Ideal para traduzir strings de interface do usuário.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">JSON de Origem (pt-BR)</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadExample}
                  >
                    Carregar Exemplo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload JSON
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
              <Textarea
                value={sourceJson}
                onChange={(e) => setSourceJson(e.target.value)}
                placeholder='{"key": "value"}'
                className="font-mono text-sm min-h-[400px]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">JSON Traduzido ({targetLocale})</label>
                {translatedJson && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTranslation}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
              <Textarea
                value={translatedJson}
                readOnly
                placeholder="A tradução aparecerá aqui..."
                className="font-mono text-sm min-h-[400px] bg-muted"
              />
            </div>
          </div>

          {stats && (
            <div className="flex gap-4 justify-center">
              <Badge variant="secondary">
                {stats.sourceKeyCount} chaves de origem
              </Badge>
              <Badge variant="secondary">
                {stats.targetKeyCount} chaves traduzidas
              </Badge>
            </div>
          )}

          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Idioma de Destino</label>
              <select
                value={targetLocale}
                onChange={(e) => setTargetLocale(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
                <option value="fr-FR">Français</option>
              </select>
            </div>
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceJson.trim()}
              className="mt-6"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traduzindo...
                </>
              ) : (
                <>
                  <Languages className="h-4 w-4 mr-2" />
                  Traduzir com IA
                </>
              )}
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-sm text-muted-foreground">
              <strong>Dica:</strong> Após a tradução, revise manualmente os termos técnicos para garantir que não foram alterados.
              A IA é instruída a preservar PTAs e termos técnicos, mas sempre verifique o resultado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}