import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquarePlus, MessageSquareText, RefreshCw } from "lucide-react";

interface UserSupportTicketsProps {
  userId: string;
  userName?: string | null;
}

interface TicketResponse {
  id: string;
  responder_id: string | null;
  message: string;
  created_at: string;
}

interface UserTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  created_at: string;
  updated_at?: string | null;
  support_ticket_responses?: TicketResponse[];
}

const CATEGORY_OPTIONS = [
  { value: "technical", label: "Técnico" },
  { value: "billing", label: "Financeiro" },
  { value: "feature", label: "Funcionalidade" },
  { value: "other", label: "Outro" },
];

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
  open: { label: "Aberto", variant: "destructive" },
  new: { label: "Novo", variant: "destructive" },
  in_progress: { label: "Em andamento", variant: "default" },
  resolved: { label: "Resolvido", variant: "success" },
  closed: { label: "Fechado", variant: "outline" },
};

const formatDate = (date: string) => {
  try {
    return format(new Date(date), "PPPp", { locale: ptBR });
  } catch (error) {
    console.warn("Could not format date", date, error);
    return date;
  }
};

export function UserSupportTickets({ userId, userName }: UserSupportTicketsProps) {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: "",
    category: "technical",
    message: "",
  });
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const firstName = useMemo(() => {
    if (!userName) {
      return null;
    }

    return userName.split(' ')[0];
  }, [userName]);

  const selectedTicket = useMemo(() => {
    return tickets.find(ticket => ticket.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const fetchTickets = async () => {
    setLoading(true);
    setRefreshing(true);

    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, message, category, status, created_at, updated_at, support_ticket_responses(id, responder_id, message, created_at)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("created_at", { ascending: true, foreignTable: "support_ticket_responses" });

    if (error) {
      console.error("Error fetching support tickets", error);
      toast({
        title: "Erro ao carregar chamados",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTickets(data || []);
      if (!selectedTicketId && data && data.length > 0) {
        setSelectedTicketId(data[0].id);
      }
    }

    setLoading(false);
    setRefreshing(false);
  };

  const handleCreateTicket = async () => {
    if (!createForm.subject.trim() || !createForm.message.trim()) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Informe assunto e mensagem para abrir um chamado.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    const payload = {
      user_id: userId,
      subject: createForm.subject.trim(),
      category: createForm.category,
      message: createForm.message.trim(),
      status: "open" as const,
    };

    const { data, error } = await supabase
      .from("support_tickets")
      .insert([payload])
      .select("id");

    if (error) {
      console.error("Error creating ticket", error);
      toast({
        title: "Não foi possível abrir o chamado",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Chamado criado com sucesso",
        description: "Nossa equipe entrará em contato em breve.",
      });
      setCreateDialogOpen(false);
      setCreateForm({ subject: "", category: "technical", message: "" });
      await fetchTickets();
      if (data && data.length > 0) {
        setSelectedTicketId(data[0].id);
      }
    }

    setCreating(false);
  };

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    setUpdatingStatus(true);

    const { error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", ticketId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating ticket status", error);
      toast({
        title: "Não foi possível atualizar o status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado",
        description: "O status do chamado foi alterado.",
      });
      await fetchTickets();
    }

    setUpdatingStatus(false);
  };

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyMessage.trim()) {
      return;
    }

    setSendingReply(true);

    const { error } = await supabase
      .from("support_ticket_responses")
      .insert([{ ticket_id: selectedTicketId, responder_id: userId, message: replyMessage.trim() }]);

    if (error) {
      console.error("Error sending response", error);
      toast({
        title: "Não foi possível enviar a mensagem",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Mensagem enviada",
        description: "Sua atualização foi registrada.",
      });
      setReplyMessage("");
      await fetchTickets();
    }

    setSendingReply(false);
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = STATUS_LABELS[status] ?? STATUS_LABELS.open;
    const badgeVariant = statusConfig.variant === "success" ? "default" : statusConfig.variant;

    return (
      <Badge
        className={statusConfig.variant === "success" ? "bg-emerald-500 text-white hover:bg-emerald-600" : undefined}
        variant={badgeVariant}
      >
        {statusConfig.label}
      </Badge>
    );
  };

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chamados</CardTitle>
          <CardDescription>Entre para visualizar e abrir chamados de suporte.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">É necessário estar autenticado para acessar os chamados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seus chamados</h2>
          <p className="text-muted-foreground text-sm">
            {firstName ? `Olá, ${firstName}! ` : ''}Acompanhe pedidos de suporte, abra novos chamados e visualize respostas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchTickets} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
          <Dialog
            open={createDialogOpen}
            onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (!open) {
                setCreateForm({ subject: "", category: "technical", message: "" });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Novo Chamado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Abrir novo chamado</DialogTitle>
                <DialogDescription>
                  Descreva o problema com o máximo de detalhes possível para agilizar o atendimento.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="subject">
                    Assunto
                  </label>
                  <Input
                    id="subject"
                    placeholder="Ex: Erro ao importar planilha"
                    value={createForm.subject}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, subject: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={createForm.category}
                    onValueChange={(value) => setCreateForm((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="message">
                    Mensagem
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Descreva o que está acontecendo..."
                    rows={6}
                    value={createForm.message}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, message: event.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTicket} disabled={creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Enviar chamado
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <MessageSquareText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Nenhum chamado aberto ainda</h3>
            <p className="text-sm text-muted-foreground">
              Clique em "Novo Chamado" para criar sua primeira solicitação de suporte.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Chamados recentes</CardTitle>
              <CardDescription>
                {tickets.length === 1 ? "1 chamado" : `${tickets.length} chamados`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[540px]">
                <div className="space-y-1 p-2">
                  {tickets.map((ticket) => {
                    const isActive = ticket.id === selectedTicketId;
                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                          isActive ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm truncate">{ticket.subject}</p>
                          {renderStatusBadge(ticket.status)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(ticket.created_at)}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {ticket.message}
                        </p>
                        <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                          Categoria: {CATEGORY_OPTIONS.find((option) => option.value === ticket.category)?.label || ticket.category}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {selectedTicket ? (
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                    <CardDescription>
                      Aberto em {formatDate(selectedTicket.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(selectedTicket.status)}
                    <Badge variant="outline">Categoria: {CATEGORY_OPTIONS.find((option) => option.value === selectedTicket.category)?.label || selectedTicket.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Descrição</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{selectedTicket.message}</p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Respostas</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedTicket.id, selectedTicket.status === "closed" ? "open" : "closed")}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {selectedTicket.status === "closed" ? "Reabrir chamado" : "Marcar como fechado"}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {selectedTicket.support_ticket_responses && selectedTicket.support_ticket_responses.length > 0 ? (
                      selectedTicket.support_ticket_responses.map((response) => (
                        <div key={response.id} className="rounded-lg border bg-muted/30 p-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {response.responder_id === userId ? "Você" : "Equipe ToolSS"}
                            </span>
                            <span>{formatDate(response.created_at)}</span>
                          </div>
                          <p className="mt-2 text-sm whitespace-pre-line">{response.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Ainda não há respostas para este chamado.</p>
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Adicionar atualização</h3>
                  <Textarea
                    placeholder="Escreva uma nova mensagem para a equipe de suporte..."
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSendReply} disabled={sendingReply || !replyMessage.trim()}>
                      {sendingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Enviar mensagem
                    </Button>
                  </div>
                </section>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="text-lg font-semibold">Selecione um chamado para visualizar os detalhes</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em um dos chamados ao lado para acompanhar o andamento.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default UserSupportTickets;
