import { useState } from "react";
import { HelpCircle, Search, Book, Video, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHelpContent } from "./helpContent";
import { SupportDialog } from "@/components/feedback/SupportDialog";

interface HelpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: string; // Contexto da página (dashboard, herd, nexus, etc.)
}

export function HelpCenter({ open, onOpenChange, context = 'dashboard' }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  
  // Obter conteúdo contextual baseado na página atual
  const helpContent = getHelpContent(context);

  const filteredFAQ = helpContent.faq.filter(
    item => {
      const answerText = typeof item.answer === 'string' ? item.answer : '';
      return (
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        answerText.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  );

  const filteredResources = helpContent.resources.filter(
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
                        <div className="text-sm leading-relaxed">
                          {item.answer}
                        </div>
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
                    const Icon = resource.type === "Vídeo" ? Video : Book;
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
              <Button 
                className="w-full" 
                size="sm"
                onClick={() => setSupportOpen(true)}
              >
                Falar com Suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
      
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </Sheet>
  );
}
