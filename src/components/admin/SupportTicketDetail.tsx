import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, User, Mail, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
}

interface TicketResponse {
  id: string;
  ticket_id: string;
  responder_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  responder?: {
    full_name: string;
  };
}

interface SupportTicketDetailProps {
  ticket: SupportTicket;
  onClose: () => void;
}

export function SupportTicketDetail({ ticket, onClose }: SupportTicketDetailProps) {
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [newResponse, setNewResponse] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(ticket.status);
  const [loading, setLoading] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(true);

  useEffect(() => {
    loadResponses();
  }, [ticket.id]);

  const loadResponses = async () => {
    try {
      setLoadingResponses(true);
      const { data, error } = await supabase
        .from('support_ticket_responses')
        .select(`
          *,
          responder:profiles!responder_id(full_name)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error loading responses:', error);
      toast.error('Erro ao carregar respostas');
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleSendResponse = async () => {
    if (!newResponse.trim()) {
      toast.error('Digite uma resposta');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('support_ticket_responses')
        .insert({
          ticket_id: ticket.id,
          responder_id: user.id,
          message: newResponse,
          is_internal: isInternal
        });

      if (error) throw error;

      toast.success('Resposta enviada com sucesso');
      setNewResponse("");
      setIsInternal(false);
      await loadResponses();
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) throw error;

      setCurrentStatus(newStatus);
      toast.success('Status atualizado com sucesso');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      new: { variant: "destructive", label: "Novo" },
      in_progress: { variant: "default", label: "Em Andamento" },
      resolved: { variant: "secondary", label: "Resolvido" },
      closed: { variant: "outline", label: "Fechado" }
    };
    
    const config = variants[status] || variants.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: "Técnico",
      billing: "Financeiro",
      feature: "Funcionalidade",
      other: "Outro"
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Ticket</h1>
        </div>

        {/* Informações do Ticket */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(currentStatus)}
                  <Badge variant="outline">{getCategoryLabel(ticket.category)}</Badge>
                </div>
              </div>
              <Select value={currentStatus} onValueChange={handleStatusChange} disabled={loading}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Nome:</span>
                <span>{ticket.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{ticket.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Criado em:</span>
                <span>{format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Categoria:</span>
                <span>{getCategoryLabel(ticket.category)}</span>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Descrição:</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Respostas */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Respostas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingResponses ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : responses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma resposta ainda. Seja o primeiro a responder!
              </p>
            ) : (
              responses.map((response) => (
                <div
                  key={response.id}
                  className={`p-4 rounded-lg ${
                    response.is_internal
                      ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900'
                      : 'bg-secondary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {response.responder?.full_name || 'Admin'}
                      </span>
                      {response.is_internal && (
                        <Badge variant="outline" className="text-xs">
                          Interna
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Nova Resposta */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Resposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Digite sua resposta..."
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              rows={6}
              disabled={loading}
            />
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded"
                  disabled={loading}
                />
                <span>Nota interna (não visível para o usuário)</span>
              </label>
              
              <Button onClick={handleSendResponse} disabled={loading || !newResponse.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Enviando...' : 'Enviar Resposta'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
