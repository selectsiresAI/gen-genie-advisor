import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Search, Mail, User, Calendar, MessageSquare, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SupportTicketDetail } from "@/components/admin/SupportTicketDetail";
import { useNavigate } from "react-router-dom";

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

export function SupportTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all"
  });

  useEffect(() => {
    checkAdminAndLoadTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, filters]);

  const checkAdminAndLoadTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);
      await loadTickets();
    } catch (error) {
      console.error('Error checking admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tickets:', error);
      return;
    }

    setTickets(data || []);
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.email.toLowerCase().includes(searchLower) ||
        t.subject.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.category !== "all") {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    setFilteredTickets(filtered);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <SupportTicketDetail 
        ticket={selectedTicket}
        onClose={() => {
          setSelectedTicket(null);
          loadTickets();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tickets de Suporte</h1>
            <p className="text-muted-foreground">Gerencie as solicitações de suporte dos usuários</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, assunto..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
              
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.category}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  <SelectItem value="technical">Técnico</SelectItem>
                  <SelectItem value="billing">Financeiro</SelectItem>
                  <SelectItem value="feature">Funcionalidade</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tickets.length}</div>
              <div className="text-sm text-muted-foreground">Total de Tickets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">
                {tickets.filter(t => t.status === 'new').length}
              </div>
              <div className="text-sm text-muted-foreground">Novos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {tickets.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">Em Andamento</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-secondary">
                {tickets.filter(t => t.status === 'resolved').length}
              </div>
              <div className="text-sm text-muted-foreground">Resolvidos</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Tickets */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum ticket encontrado com os filtros aplicados.
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(ticket.status)}
                        <Badge variant="outline">{getCategoryLabel(ticket.category)}</Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold">{ticket.subject}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {ticket.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {ticket.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(ticket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>

                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
