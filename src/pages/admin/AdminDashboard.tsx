import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Database, RefreshCcw, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CreateUsersButton } from "@/components/admin/CreateUsersButton";

interface SupportTicketSummary {
  id: string;
  subject: string;
  status: string;
  updated_at: string;
}

interface TicketStats {
  total: number;
  open: number;
  resolved: number;
  averageResponseMinutes: number | null;
}

interface StorageFile {
  name: string;
  updated_at: string;
  created_at: string;
  id?: string;
  metadata?: Record<string, any> | null;
}

const ADMIN_BUCKET = import.meta.env.VITE_SUPABASE_ADMIN_BUCKET ?? "admin-files";
const EDGE_FUNCTION_NAME = import.meta.env.VITE_SUPABASE_ADMIN_EDGE_FUNCTION ?? "check-admin-role";

const normalizeTicketStats = (value: Record<string, any>): TicketStats => ({
  total: Number(value.total ?? value.total_tickets ?? 0),
  open: Number(value.open ?? value.open_tickets ?? value.pending ?? 0),
  resolved: Number(value.resolved ?? value.closed ?? value.closed_tickets ?? 0),
  averageResponseMinutes:
    typeof value.averageResponseMinutes === "number"
      ? value.averageResponseMinutes
      : typeof value.average_response_minutes === "number"
      ? value.average_response_minutes
      : null
});

export function AdminDashboard() {
  const { role, isAdmin, isLoading: roleLoading, refetch } = useUserRole();
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<SupportTicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [edgeResult, setEdgeResult] = useState<string | null>(null);
  const [edgeLoading, setEdgeLoading] = useState(false);
  const [noteSubject, setNoteSubject] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      loadDashboard();
      loadStorageFiles();
    }
  }, [isAdmin, roleLoading]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const { data: ticketStats, error: statsError } = await supabase.rpc("admin_ticket_stats");

      if (statsError) {
        console.warn("Função admin_ticket_stats indisponível. Recuando para agregações client-side.", statsError);
      }

      const statsResult: TicketStats | null = ticketStats
        ? Array.isArray(ticketStats)
          ? normalizeTicketStats((ticketStats[0] ?? {}) as Record<string, any>)
          : normalizeTicketStats(ticketStats as Record<string, any>)
        : null;

      if (!statsResult) {
        const { data, error } = await supabase
          .from("support_tickets")
          .select("id, subject, status, created_at, updated_at")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const total = data?.length ?? 0;
        const open = data?.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed").length ?? 0;
        const resolved = data?.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length ?? 0;

        setStats({
          total,
          open,
          resolved,
          averageResponseMinutes: null
        });

        setRecentTickets(
          (data ?? []).slice(0, 5).map((ticket) => ({
            id: ticket.id,
            subject: ticket.subject,
            status: ticket.status,
            updated_at: ticket.updated_at ?? ticket.created_at
          }))
        );
      } else {
        setStats(statsResult);
      }

      if (statsResult) {
        const { data: recent, error: recentError } = await supabase
          .from("support_tickets")
          .select("id, subject, status, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5);

        if (recentError) {
          console.error("Erro ao carregar tickets recentes", recentError);
        }

        setRecentTickets(recent ?? []);
      }
    } catch (error: any) {
      console.error("Erro ao carregar dashboard administrativo", error);
      toast.error(error?.message ?? "Não foi possível carregar as métricas administrativas");
      setStats(null);
      setRecentTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageFiles = async () => {
    try {
      setStorageLoading(true);
      setStorageError(null);

      const { data, error } = await supabase.storage.from(ADMIN_BUCKET).list(undefined, {
        limit: 20,
        sortBy: { column: "created_at", order: "desc" }
      });

      if (error) {
        throw error;
      }

      setStorageFiles(data ?? []);
    } catch (error: any) {
      console.warn("Erro ao carregar arquivos do bucket administrativo", error);
      setStorageError(error?.message ?? "Não foi possível acessar o bucket informado.");
      setStorageFiles([]);
    } finally {
      setStorageLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStorageLoading(true);
      setStorageError(null);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(ADMIN_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: true
      });

      if (error) {
        throw error;
      }

      toast.success("Arquivo enviado com sucesso");
      loadStorageFiles();
    } catch (error: any) {
      console.error("Erro ao enviar arquivo", error);
      setStorageError(error?.message ?? "Não foi possível enviar o arquivo");
    } finally {
      setStorageLoading(false);
      event.target.value = "";
    }
  };

  const handleEdgeFunctionCall = async () => {
    try {
      setEdgeLoading(true);
      setEdgeResult(null);

      const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
        body: {
          action: "check",
          role: "admin"
        }
      });

      if (error) {
        throw error;
      }

      setEdgeResult(JSON.stringify(data, null, 2));
      toast.success("Função Edge executada com sucesso");
    } catch (error: any) {
      console.warn("Função edge opcional indisponível", error);
      setEdgeResult(error?.message ?? "Não foi possível executar a função configurada");
    } finally {
      setEdgeLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!noteSubject.trim() || !noteContent.trim()) {
      setNoteError("Informe assunto e conteúdo para registrar um comunicado interno");
      return;
    }

    try {
      setNoteLoading(true);
      setNoteError(null);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase.from("admin_notes").insert({
        subject: noteSubject.trim(),
        content: noteContent.trim(),
        created_by: user.id
      });

      if (error) {
        throw error;
      }

      toast.success("Comunicado registrado com sucesso");
      setNoteSubject("");
      setNoteContent("");
    } catch (error: any) {
      console.warn("Tabela opcional admin_notes indisponível", error);
      setNoteError(error?.message ?? "Não foi possível registrar o comunicado. Verifique se a tabela admin_notes existe.");
    } finally {
      setNoteLoading(false);
    }
  };

  const statsContent = useMemo(() => {
    if (!stats) return null;

    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets totais</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Quantidade total de tickets registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em atendimento</CardTitle>
            <RefreshCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Tickets com status diferente de resolvido/fechado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Tickets marcados como resolvidos ou fechados</p>
          </CardContent>
        </Card>
      </div>
    );
  }, [stats]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <Badge variant="outline" className="w-fit">Role atual: {role ?? "desconhecido"}</Badge>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bem-vindo ao painel administrativo</h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Todas as chamadas abaixo utilizam o cliente oficial <code>@supabase/supabase-js</code>, demonstrando como combinar
              autenticação, RPC, tabelas, Storage e funções Edge com o Supabase.
            </p>
          </div>
          <CreateUsersButton />
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
              Carregando métricas…
            </div>
          </CardContent>
        </Card>
      ) : (
        statsContent
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tickets recentes</CardTitle>
            <CardDescription>
              Dados carregados diretamente da tabela <code>support_tickets</code> com políticas de RLS aplicadas no Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum ticket recente encontrado.</p>
            ) : (
              recentTickets.map((ticket) => {
                const lastUpdated = ticket.updated_at ?? new Date().toISOString();
                return (
                  <div key={ticket.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{ticket.subject}</span>
                      <Badge variant="secondary">{ticket.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Atualizado {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Função RPC de papel</CardTitle>
            <CardDescription>
              A verificação utiliza a função <code>has_role_v2</code>. Utilize o botão abaixo para refazer a checagem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              {isAdmin ? "Você possui direitos administrativos." : "Nenhuma role administrativa confirmada."}
            </p>
            <Button variant="outline" onClick={() => refetch()} disabled={roleLoading}>
              Revalidar role via RPC
            </Button>
            {roleLoading && <p className="text-xs text-muted-foreground">Validando…</p>}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload seguro de arquivos</CardTitle>
            <CardDescription>
              Arquivos armazenados no bucket <code>{ADMIN_BUCKET}</code>. Certifique-se de conceder permissão de leitura/escrita
              via RLS/Storage Policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" onChange={handleFileUpload} disabled={storageLoading} />
            {storageError && (
              <div className="flex items-start gap-2 rounded-md border border-dashed border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{storageError}</span>
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Arquivos recentes</h3>
              {storageLoading ? (
                <p className="text-xs text-muted-foreground">Carregando lista…</p>
              ) : storageFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum arquivo encontrado no bucket configurado.</p>
              ) : (
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {storageFiles.map((file) => (
                    <li key={file.id ?? file.name} className="flex items-center justify-between gap-2 rounded border bg-muted/30 px-3 py-2">
                      <span className="truncate font-medium text-foreground">{file.name}</span>
                      <span>
                        {formatDistanceToNow(new Date(file.updated_at ?? file.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrar comunicado interno</CardTitle>
            <CardDescription>
              Exemplo de escrita em tabela protegida (espera-se uma tabela <code>admin_notes</code> com política RLS apropriada).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Assunto do comunicado"
              value={noteSubject}
              onChange={(event) => setNoteSubject(event.target.value)}
            />
            <Textarea
              placeholder="Detalhes e próximos passos"
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              rows={4}
            />
            {noteError && <p className="text-xs text-destructive">{noteError}</p>}
            <Button onClick={handleCreateNote} disabled={noteLoading}>
              Registrar comunicado
            </Button>
            <p className="text-xs text-muted-foreground">
              Caso a tabela não exista, uma mensagem amigável indicará a necessidade de criá-la no Supabase.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Função Edge opcional</CardTitle>
          <CardDescription>
            Demonstração de chamada para <code>{EDGE_FUNCTION_NAME}</code>. Configure uma Edge Function para executar verificações
            sensíveis com a Service Key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="secondary" onClick={handleEdgeFunctionCall} disabled={edgeLoading}>
            Executar função Edge
          </Button>
          {edgeLoading && <p className="text-xs text-muted-foreground">Chamando função Edge…</p>}
          {edgeResult && (
            <pre className="max-h-60 overflow-auto rounded-md bg-muted/50 p-3 text-xs">
              {edgeResult}
            </pre>
          )}
          <p className="text-xs text-muted-foreground">
            Utilize a resposta para habilitar fluxos que exigem privilégios elevados sem expor a Service Role ao cliente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

