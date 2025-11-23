import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Search, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GlossaryTerm {
  id: string;
  term_key: string;
  category: string;
  pt_br: string;
  en_us: string | null;
  description: string | null;
  context: string | null;
  is_translatable: boolean;
}

export default function GlossaryManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: terms, isLoading, refetch } = useQuery({
    queryKey: ['glossary_manager'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technical_glossary')
        .select('*')
        .order('category')
        .order('term_key');

      if (error) throw error;
      return data as GlossaryTerm[];
    },
  });

  const updateTermMutation = useMutation({
    mutationFn: async (term: GlossaryTerm) => {
      const { error } = await supabase
        .from('technical_glossary')
        .update({
          en_us: term.en_us,
          description: term.description,
          context: term.context,
          is_translatable: term.is_translatable,
        })
        .eq('id', term.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Termo atualizado com sucesso!");
      refetch();
      setIsEditDialogOpen(false);
      setEditingTerm(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar termo: " + error.message);
    },
  });

  const filteredTerms = terms?.filter(term => {
    const matchesSearch = term.term_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         term.pt_br.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (term.en_us?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === "all" || term.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = Array.from(new Set(terms?.map(t => t.category) || []));

  const getStatusBadge = (term: GlossaryTerm) => {
    if (!term.is_translatable) {
      return <Badge variant="secondary">🔒 Não Traduzível</Badge>;
    }
    if (term.en_us) {
      return <Badge variant="default">✅ Traduzido</Badge>;
    }
    return <Badge variant="destructive">⚠️ Pendente</Badge>;
  };

  const stats = {
    total: terms?.length || 0,
    translated: terms?.filter(t => t.is_translatable && t.en_us).length || 0,
    notTranslatable: terms?.filter(t => !t.is_translatable).length || 0,
    pending: terms?.filter(t => t.is_translatable && !t.en_us).length || 0,
  };

  const translatedPercentage = stats.total > 0
    ? Math.round((stats.translated / (stats.translated + stats.pending)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Glossário Técnico</CardTitle>
          <CardDescription>
            Gerencie traduções de termos técnicos e PTAs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Termos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Traduzidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.translated}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Cobertura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{translatedPercentage}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar termo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Português</TableHead>
                  <TableHead>Inglês</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredTerms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhum termo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTerms.map(term => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{term.category}</TableCell>
                      <TableCell className="font-mono text-sm">{term.term_key}</TableCell>
                      <TableCell>{term.pt_br}</TableCell>
                      <TableCell>{term.en_us || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>{getStatusBadge(term)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTerm(term);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Termo</DialogTitle>
            <DialogDescription>
              Atualize a tradução e informações do termo técnico
            </DialogDescription>
          </DialogHeader>
          {editingTerm && (
            <div className="space-y-4">
              <div>
                <Label>Chave</Label>
                <Input value={editingTerm.term_key} disabled />
              </div>
              <div>
                <Label>Português</Label>
                <Input value={editingTerm.pt_br} disabled />
              </div>
              <div>
                <Label>Inglês</Label>
                <Input
                  value={editingTerm.en_us || ''}
                  onChange={(e) => setEditingTerm({ ...editingTerm, en_us: e.target.value })}
                  disabled={!editingTerm.is_translatable}
                  placeholder={editingTerm.is_translatable ? "Digite a tradução" : "Termo não traduzível"}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={editingTerm.description || ''}
                  onChange={(e) => setEditingTerm({ ...editingTerm, description: e.target.value })}
                  placeholder="Descrição técnica do termo"
                  rows={3}
                />
              </div>
              <div>
                <Label>Contexto</Label>
                <Textarea
                  value={editingTerm.context || ''}
                  onChange={(e) => setEditingTerm({ ...editingTerm, context: e.target.value })}
                  placeholder="Contexto de uso do termo"
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => editingTerm && updateTermMutation.mutate(editingTerm)}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}