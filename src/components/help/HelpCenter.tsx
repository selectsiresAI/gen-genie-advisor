import { useState } from "react";
import { HelpCircle, Search, Book, Video, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HelpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FAQ_ITEMS = [
  {
    question: "Como importar dados de animais?",
    answer: "Para importar dados, clique em 'Importar' no menu lateral, selecione o arquivo CSV ou Excel com os dados dos animais e siga as instruções na tela. O sistema aceitará arquivos com informações de touros e fêmeas."
  },
  {
    question: "O que é o Nexus e como usar?",
    answer: "O Nexus é nossa ferramenta de predição genética. Você pode usar três métodos: Nexus 1 (predição genômica), Nexus 2 (predição por pedigree) e Nexus 3 (análise por grupos). Acesse através do menu 'Nexus' na barra lateral."
  },
  {
    question: "Como criar um plano genético?",
    answer: "Vá para a seção 'Plano Genético' no menu. Defina seus objetivos, selecione os touros disponíveis, configure as metas de produção e o sistema calculará automaticamente a melhor estratégia de acasalamento."
  },
  {
    question: "Como visualizar relatórios e gráficos?",
    answer: "Acesse a seção 'Gráficos' no menu lateral para visualizar tendências, distribuições e análises estatísticas do seu rebanho. Você pode exportar os gráficos em PDF."
  },
  {
    question: "Onde encontro a Auditoria Genética?",
    answer: "A Auditoria Genética está disponível no menu lateral. Ela fornece uma análise completa do seu rebanho, incluindo parentesco, top parents, progressão genética e benchmark com outros rebanhos."
  }
];

const RESOURCES = [
  {
    title: "Guia de Início Rápido",
    description: "Aprenda a usar as funcionalidades básicas da plataforma",
    icon: Book,
    type: "Guia"
  },
  {
    title: "Vídeo: Importação de Dados",
    description: "Tutorial em vídeo sobre como importar dados de animais",
    icon: Video,
    type: "Vídeo"
  },
  {
    title: "Vídeo: Nexus Pedigree",
    description: "Como usar o Nexus 2 para predição por pedigree",
    icon: Video,
    type: "Vídeo"
  },
  {
    title: "Guia: Plano Genético",
    description: "Documentação completa sobre criação de planos genéticos",
    icon: Book,
    type: "Guia"
  }
];

export function HelpCenter({ open, onOpenChange }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQ = FAQ_ITEMS.filter(
    item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResources = RESOURCES.filter(
    resource =>
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Central de Ajuda
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ajuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="faq" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="recursos">Recursos</TabsTrigger>
            </TabsList>

            <TabsContent value="faq" className="space-y-4 mt-4">
              {filteredFAQ.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma pergunta encontrada
                </p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQ.map((item, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="recursos" className="space-y-4 mt-4">
              {filteredResources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum recurso encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredResources.map((resource, idx) => {
                    const Icon = resource.icon;
                    return (
                      <Card key={idx} className="cursor-pointer hover:bg-accent transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <CardTitle className="text-sm font-medium">
                                {resource.title}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {resource.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Contact Support */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Ainda precisa de ajuda?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Entre em contato com nossa equipe de suporte
              </p>
              <Button className="w-full" size="sm">
                Falar com Suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
