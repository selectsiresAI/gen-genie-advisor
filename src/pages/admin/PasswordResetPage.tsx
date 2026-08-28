import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tela admin: redefinir senha de um usuário travado (sem SMTP/e-mail).
// Gera senha provisória via edge admin-reset-password e mostra na tela.
export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; full_name?: string; temporary_password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = email.trim().length > 3 && !loading;

  async function handleReset() {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { email: email.trim() },
      });
      if (error) {
        const msg = (error as { context?: { error?: string } })?.context?.error ?? "Falha ao redefinir senha.";
        toast.error(msg);
        return;
      }
      const d = data as { email: string; full_name?: string; temporary_password: string };
      setResult(d);
      toast.success("Senha provisória gerada.");
    } catch (err) {
      toast.error((err as Error)?.message ?? "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPwd() {
    if (!result) return;
    await navigator.clipboard.writeText(result.temporary_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> Redefinir senha
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gera uma senha provisória para um usuário que não consegue acessar. Sem e-mail:
          copie a senha e entregue ao usuário, que deve trocá-la no primeiro acesso.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuário</CardTitle>
          <CardDescription>Informe o e-mail cadastrado no ToolSS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleReset(); }}
              placeholder="usuario@exemplo.com"
              autoFocus
            />
          </div>
          <Button onClick={handleReset} disabled={!canSubmit} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Gerar senha provisória
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-300 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" /> Senha redefinida
            </CardTitle>
            <CardDescription>{result.full_name || result.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-lg tracking-wide">
                {result.temporary_password}
              </code>
              <Button variant="outline" size="icon" onClick={copyPwd} aria-label="Copiar">
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Entregue essa senha ao usuário (WhatsApp/telefone) e peça para trocá-la no primeiro acesso.
              Ela funciona imediatamente, sem depender de e-mail.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
