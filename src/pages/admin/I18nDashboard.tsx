import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  Circle, 
  FileJson, 
  Languages, 
  Code, 
  BookOpen,
  ExternalLink 
} from "lucide-react";
import { Link } from "react-router-dom";

export default function I18nDashboard() {
  const [completedPhases, setCompletedPhases] = useState({
    phase0: true,  // Infraestrutura já implementada
    phase1: false, // Extração
    phase2: false, // Tradução IA
    phase3: false, // Aplicação
    phase4: false, // Integração glossário
    phase5: false, // Revisão
  });

  const phases = [
    {
      id: 'phase0',
      title: 'Fase 0: Infraestrutura i18n',
      status: completedPhases.phase0 ? 'complete' : 'pending',
      credits: '7-10',
      description: 'Sistema i18n, Language Selector e Glossário Técnico',
      items: [
        'I18nProvider e Context global',
        'Language Selector em Login e Dashboard',
        'Tabela technical_glossary no Supabase',
        'Interface de gerenciamento (/admin/glossary)',
      ],
      action: completedPhases.phase0 ? null : 'Já implementado',
    },
    {
      id: 'phase1',
      title: 'Fase 1: Extração Automatizada',
      status: completedPhases.phase1 ? 'complete' : 'pending',
      credits: '2-3',
      description: 'Extrair strings hardcoded do código',
      items: [
        'Script extract-strings.ts',
        'Gera src/locales/pt-BR.json (~500-800 strings)',
        'Relatório detalhado de extração',
      ],
      command: 'npx tsx scripts/extract-strings.ts',
      action: '/admin/glossary',
    },
    {
      id: 'phase2',
      title: 'Fase 2: Tradução via IA',
      status: completedPhases.phase2 ? 'complete' : 'pending',
      credits: '3-5',
      description: 'Traduzir JSON em lote com Lovable AI',
      items: [
        'Edge function translate-i18n',
        'Interface admin de tradução',
        'Preserva termos técnicos (PTAs)',
        'Gera src/locales/en-US.json',
      ],
      action: '/admin/translation',
    },
    {
      id: 'phase3',
      title: 'Fase 3: Aplicação de Traduções',
      status: completedPhases.phase3 ? 'complete' : 'pending',
      credits: '5-8',
      description: 'Substituir hardcoded por t()',
      items: [
        'Script apply-translations.ts',
        'Substitui strings por t(key)',
        'Adiciona imports automaticamente',
        'Modo dry-run para validação',
      ],
      command: 'npx tsx scripts/apply-translations.ts --dry-run',
      action: null,
    },
    {
      id: 'phase4',
      title: 'Fase 4: Integração Glossário',
      status: completedPhases.phase4 ? 'complete' : 'pending',
      credits: '3-4',
      description: 'Conectar glossário técnico ao sistema i18n',
      items: [
        'Merge en-US.json com glossário',
        'Garantir PTAs não traduzidos',
        'Validar termos de domínio',
      ],
      action: '/admin/glossary',
    },
    {
      id: 'phase5',
      title: 'Fase 5: Revisão e Polimento',
      status: completedPhases.phase5 ? 'complete' : 'pending',
      credits: '5-8',
      description: 'Testes e ajustes finais',
      items: [
        'Teste navegação completa em EN',
        'Validar pluralização',
        'Ajustar layouts se necessário',
        'Review contextos técnicos',
      ],
      action: null,
    },
  ];

  const totalCredits = phases.reduce((sum, phase) => {
    const [min, max] = phase.credits.split('-').map(Number);
    return { min: sum.min + min, max: sum.max + max };
  }, { min: 0, max: 0 });

  const completedCount = Object.values(completedPhases).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / phases.length) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Internacionalização</CardTitle>
          <CardDescription>
            Acompanhe o progresso da implementação completa do sistema i18n
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{progressPercent}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedCount} de {phases.length} fases
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Créditos Estimados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalCredits.min}-{totalCredits.max}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total para implementação completa
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Idiomas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2</div>
                <p className="text-xs text-muted-foreground mt-1">
                  🇧🇷 pt-BR · 🇺🇸 en-US
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert className="mb-6">
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              <strong>Documentação completa</strong>: Consulte{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">docs/i18n-implementation-guide.md</code>
              {' '}e{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">scripts/README.md</code>
              {' '}para instruções detalhadas.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {phases.map((phase, index) => {
              const isComplete = completedPhases[phase.id as keyof typeof completedPhases];
              const isPending = !isComplete;
              
              return (
                <Card key={phase.id} className={isComplete ? 'border-green-200 bg-green-50/50' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground mt-1" />
                        )}
                        <div>
                          <CardTitle className="text-base">{phase.title}</CardTitle>
                          <CardDescription>{phase.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={isComplete ? "default" : "secondary"}>
                        {phase.credits} créditos
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-muted-foreground mb-4">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex gap-2 flex-wrap">
                      {phase.command && (
                        <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono">
                          {phase.command}
                        </code>
                      )}
                      
                      {phase.action && phase.action.startsWith('/') && (
                        <Button asChild variant="outline" size="sm">
                          <Link to={phase.action}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Interface
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Próximos Passos Recomendados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">1. Execute a extração de strings</p>
                <code className="block bg-white px-3 py-2 rounded text-xs">
                  npx tsx scripts/extract-strings.ts
                </code>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">2. Revise o glossário técnico</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/glossary">
                    Gerenciar Glossário
                  </Link>
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">3. Traduza o JSON via IA</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/translation">
                    Tradução em Lote
                  </Link>
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">4. Aplique as traduções no código</p>
                <code className="block bg-white px-3 py-2 rounded text-xs">
                  npx tsx scripts/apply-translations.ts --dry-run
                </code>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}