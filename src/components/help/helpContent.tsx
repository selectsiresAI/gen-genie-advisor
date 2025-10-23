// Conteúdo de ajuda contextual para cada página/módulo
import { ReactNode } from 'react';

export interface HelpContent {
  faq: Array<{
    question: string;
    answer: string | ReactNode;
  }>;
  resources: Array<{
    title: string;
    description: string;
    type: 'Guia' | 'Vídeo';
  }>;
  hints: Record<string, string>;
}

export const helpContentMap: Record<string, HelpContent> = {
  // Conversão de Planilhas
  conversao: {
    faq: [
      {
        question: "O que é a ferramenta de Conversão?",
        answer: "Padroniza planilhas com nomenclaturas diferentes, mapeando automaticamente colunas para um formato padrão usando banco de aliases, regex e fuzzy matching. Ideal para consolidar dados de diferentes fontes."
      },
      {
        question: "Devo usar o modelo padrão ou criar o meu próprio?",
        answer: "Use o botão 'Usar nosso modelo padrão' para ter acesso a todas as colunas genéticas mais utilizadas (PTAs, índices econômicos, saúde, fertilidade, tipo). Crie seu próprio apenas se precisar de colunas específicas diferentes."
      },
      {
        question: "Preciso sempre enviar o banco de legendas?",
        answer: "Não é obrigatório. O sistema já tem um banco padrão interno. Mas se clicar em 'Usar nossas legendas padrão', você terá centenas de mapeamentos adicionais que melhoram muito a detecção automática de correspondências."
      },
      {
        question: "O que são sugestões 'seguras'?",
        answer: "São mapeamentos com alta confiança (score ≥ 0.8) vindos do banco de legendas ou padrões regex. Você pode aprová-las todas de uma vez com o botão 'Aprovar Seguras' para economizar tempo."
      },
      {
        question: "Posso ajustar os mapeamentos sugeridos?",
        answer: "Sim! Para cada linha na tabela, você pode aceitar a sugestão automática, escolher manualmente outra coluna do modelo, ou deixar sem mapear. O controle é totalmente seu."
      },
      {
        question: "Como funciona a detecção automática?",
        answer: "O sistema usa 3 métodos em ordem de prioridade: 1) Banco de legendas (customizado + padrão), 2) Padrões regex para formatos conhecidos, 3) Correspondência fuzzy para similaridade de texto. Cada sugestão mostra sua origem e pontuação."
      }
    ],
    resources: [
      {
        title: "Guia: Conversão de Planilhas",
        description: "Passo a passo completo para padronizar seus dados",
        type: "Guia"
      },
      {
        title: "Vídeo: Usando Modelos e Legendas Padrão",
        description: "Como acelerar o processo com arquivos pré-configurados",
        type: "Vídeo"
      },
      {
        title: "Banco de Nomenclaturas",
        description: "Entenda como criar e usar bancos de aliases personalizados",
        type: "Guia"
      }
    ],
    hints: {
      modelUpload: "Upload do modelo padrão ou clique para usar nosso modelo com todas as colunas genéticas",
      legendUpload: "Opcional: use nossas legendas padrão para melhorar a detecção automática",
      dataUpload: "Envie a planilha que deseja padronizar - formato Excel ou CSV",
      suggestions: "Revise as sugestões automáticas e aprove ou ajuste conforme necessário",
      safeSuggestions: "Aprove todas as sugestões 'seguras' de uma vez para economizar tempo",
      download: "Baixe a planilha padronizada após aprovar todos os mapeamentos"
    }
  },

  // Dashboard / Home
  dashboard: {
    faq: [
      {
        question: "Como criar uma nova fazenda?",
        answer: "Clique no botão 'Criar Nova Fazenda' no dashboard. Preencha o nome da fazenda e confirme. Você poderá adicionar animais depois."
      },
      {
        question: "Como deletar uma fazenda?",
        answer: "No card da fazenda no dashboard, clique no ícone de lixeira. Confirme a exclusão. ATENÇÃO: Esta ação é permanente e removerá todos os dados da fazenda."
      },
      {
        question: "O que são os módulos disponíveis?",
        answer: "Cada fazenda tem acesso a 5 módulos: Rebanho (gestão de animais), Nexus (predição genética), Plano (planejamento genético), Gráficos (análises visuais) e Auditoria (relatórios completos)."
      }
    ],
    resources: [
      {
        title: "Primeiros Passos",
        description: "Guia completo para começar a usar a plataforma",
        type: "Guia"
      },
      {
        title: "Vídeo: Tour pela Plataforma",
        description: "Conheça todas as funcionalidades em 5 minutos",
        type: "Vídeo"
      }
    ],
    hints: {
      createFarm: "Crie sua primeira fazenda para começar a gerenciar seu rebanho",
      selectFarm: "Selecione uma fazenda para acessar seus módulos e dados",
      modules: "Cada módulo oferece ferramentas específicas para gestão genética"
    }
  },

  // Rebanho
  herd: {
    faq: [
      {
        question: "Como importar dados de fêmeas?",
        answer: (
          <>
            Clique em 'Importar Fêmeas' e selecione seu arquivo CSV ou Excel. O sistema aceita diversos formatos e fará a validação automática. Se seu arquivo tiver cabeçalhos diferentes do padrão (ex: arquivos de laboratórios genômicos), use o Menu Conversão para padronizar as colunas automaticamente antes de importar.
          </>
        )
      },
      {
        question: "Meu arquivo tem cabeçalhos diferentes, como proceder?",
        answer: (
          <>
            <span>Use o Menu Conversão (disponível no Dashboard em 'Operações e Suporte'). Esta ferramenta converte automaticamente qualquer formato de arquivo genômico para o padrão ToolSS, mapeando centenas de nomenclaturas diferentes. Após converter, importe o arquivo padronizado.</span>
            <div className="mt-3">
              <a 
                href="/tools/conversao" 
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium border border-primary/20"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/tools/conversao';
                }}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Ir para Menu Conversão
              </a>
            </div>
          </>
        )
      },
      {
        question: "Como exportar os dados do rebanho?",
        answer: "Clique no botão 'Exportar' para baixar um arquivo CSV com todos os dados das fêmeas, incluindo PTAs, pedigree e informações reprodutivas."
      },
      {
        question: "O que são as categorias automáticas?",
        answer: "O sistema categoriza automaticamente os animais em: Bezerra (até 90 dias), Novilha (91 dias até 1º parto), Primípara (1º parto), Secundípara (2º parto) e Multípara (3+ partos)."
      },
      {
        question: "Como filtrar animais por ano?",
        answer: "Use o filtro de ano no topo da tabela para visualizar apenas animais nascidos em um ano específico. Útil para análise de safras."
      },
      {
        question: "Como deletar animais selecionados?",
        answer: "Selecione as fêmeas usando as caixas de seleção, depois clique no botão 'Excluir Selecionados'. Confirme a exclusão. Esta ação é permanente."
      }
    ],
    resources: [
      {
        title: "Guia: Importação de Dados",
        description: "Passo a passo completo para importar seus animais",
        type: "Guia"
      },
      {
        title: "Vídeo: Gestão do Rebanho",
        description: "Como usar filtros, ordenação e exportação",
        type: "Vídeo"
      },
      {
        title: "Formato de Arquivos de Importação",
        description: "Especificações técnicas dos arquivos CSV/Excel aceitos",
        type: "Guia"
      }
    ],
    hints: {
      import: "Importe dados de fêmeas via CSV ou Excel. Suporta múltiplos formatos e faz validação automática",
      export: "Exporte todos os dados do rebanho para backup ou análise externa",
      search: "Busque por nome ou identificador do animal",
      filter: "Filtre por ano de nascimento para análise de safras",
      select: "Selecione múltiplos animais para ações em lote",
      delete: "Delete animais selecionados (ação permanente)",
      sort: "Clique nos cabeçalhos para ordenar por qualquer coluna",
      category: "Categorias automáticas baseadas em idade e ordem de parto",
      pedigree: "Visualize o pedigree completo com NAAB codes e nomes"
    }
  },

  // Nexus
  nexus: {
    faq: [
      {
        question: "O que é o Nexus?",
        answer: "Nexus é nossa ferramenta de predição genética avançada. Oferece 3 métodos: Nexus 1 (genômica), Nexus 2 (pedigree) e Nexus 3 (grupos), para calcular PTAs estimados de animais."
      },
      {
        question: "Qual método Nexus devo usar?",
        answer: "Nexus 1 para animais com dados genômicos; Nexus 2 para predição baseada em pedigree (pai, avô materno, bisavô); Nexus 3 para análise comparativa de grupos de animais."
      },
      {
        question: "Como funciona o Nexus 2 (Pedigree)?",
        answer: "Insira os códigos NAAB do pai, avô materno e bisavô materno. O sistema calcula PTAs estimados usando regressão de pedigree e índices de seleção padrão."
      },
      {
        question: "Posso usar Nexus sem dados genômicos?",
        answer: "Sim! O Nexus 2 funciona apenas com informações de pedigree (NAAB codes). É ideal quando não há dados de genotipagem disponíveis."
      }
    ],
    resources: [
      {
        title: "Guia: Nexus Pedigree",
        description: "Como usar o Nexus 2 para predições por pedigree",
        type: "Guia"
      },
      {
        title: "Vídeo: Nexus Genômico",
        description: "Tutorial completo do Nexus 1 para dados genômicos",
        type: "Vídeo"
      },
      {
        title: "Nexus 3: Análise de Grupos",
        description: "Compare grupos de animais e identifique padrões",
        type: "Guia"
      }
    ],
    hints: {
      methodSelection: "Escolha o método Nexus adequado aos seus dados disponíveis",
      genomic: "Nexus 1: Use quando tiver dados de genotipagem dos animais",
      pedigree: "Nexus 2: Use quando tiver apenas informações de pedigree (NAAB codes)",
      groups: "Nexus 3: Compare grupos de animais e identifique tendências genéticas",
      naabCode: "Códigos NAAB identificam touros registrados nos EUA. Ex: 11HO12345",
      prediction: "As predições são estimativas baseadas em modelos estatísticos validados"
    }
  },

  // Plano Genético
  plano: {
    faq: [
      {
        question: "O que é a Projeção Genética?",
        answer: "É uma ferramenta que simula diferentes estratégias de acasalamento, calculando o impacto genético e econômico (ROI) de cada cenário ao longo do tempo."
      },
      {
        question: "O que é a Calculadora de Reposição?",
        answer: "Sistema completo com 7 fases de planejamento: crescimento populacional, estratégia genética, metas reprodutivas, composição, investimentos, receitas e análise de ROI."
      },
      {
        question: "Como definir metas genéticas?",
        answer: "Na Calculadora de Reposição, defina os índices alvo (TPI, NM$, etc.) que deseja alcançar. O sistema calculará as estratégias necessárias para atingir essas metas."
      }
    ],
    resources: [
      {
        title: "Guia: Projeção Genética",
        description: "Como simular estratégias de acasalamento",
        type: "Guia"
      },
      {
        title: "Vídeo: Calculadora de Reposição",
        description: "Tutorial das 7 fases de planejamento",
        type: "Vídeo"
      },
      {
        title: "ROI e Retorno Genético",
        description: "Entenda como calcular o retorno do investimento genético",
        type: "Guia"
      }
    ],
    hints: {
      projection: "Simule diferentes estratégias de acasalamento e veja o impacto no rebanho",
      calculator: "Planeje a reposição do rebanho em 7 fases estruturadas",
      goals: "Defina metas genéticas e econômicas realistas para seu rebanho",
      roi: "Calcule o retorno financeiro esperado de cada estratégia genética",
      phases: "Cada fase da calculadora depende das anteriores - siga a ordem"
    }
  },

  // Gráficos
  charts: {
    faq: [
      {
        question: "Como interpretar os gráficos de tendências?",
        answer: "Os gráficos mostram a evolução dos PTAs ao longo do tempo. Linhas ascendentes indicam progresso genético positivo. Use para avaliar a eficácia das estratégias de seleção."
      },
      {
        question: "Como exportar gráficos?",
        answer: "Clique no botão 'Exportar' para baixar os dados em CSV ou gerar um PDF com todos os gráficos. Ideal para relatórios e apresentações."
      },
      {
        question: "O que são os diferentes tipos de agrupamento?",
        answer: "Agrupe por ano (evolução temporal), categoria (bezerras, novilhas, etc.) ou paridade (ordem de parto) para análises específicas do seu rebanho."
      },
      {
        question: "Como adicionar mais PTAs aos gráficos?",
        answer: "No painel de configurações, clique nos badges dos PTAs para adicionar/remover. Você pode visualizar até 5 PTAs simultaneamente para comparação."
      }
    ],
    resources: [
      {
        title: "Guia: Interpretação de Gráficos",
        description: "Como analisar tendências genéticas do rebanho",
        type: "Guia"
      },
      {
        title: "Vídeo: Análise Visual de Dados",
        description: "Tour completo pelos recursos de visualização",
        type: "Vídeo"
      },
      {
        title: "Exportação de Relatórios",
        description: "Como gerar PDFs e CSVs profissionais",
        type: "Guia"
      }
    ],
    hints: {
      config: "Configure quais PTAs visualizar e como agrupar os dados",
      chartType: "Alterne entre gráficos de linha, barras ou área conforme sua necessidade",
      grouping: "Agrupe por ano, categoria ou paridade para diferentes perspectivas",
      export: "Exporte dados em CSV ou gráficos em PDF para relatórios externos",
      trends: "Linhas de tendência ajudam a identificar progresso genético ao longo do tempo",
      distribution: "Gráficos de distribuição mostram como os animais se distribuem em cada PTA",
      multiPTA: "Compare até 5 PTAs simultaneamente para análise multivariada"
    }
  },

  // Busca de Touros
  bulls: {
    faq: [
      {
        question: "Como importar dados de touros?",
        answer: "Clique em 'Importar Touros', selecione um arquivo CSV ou Excel com os dados. O sistema suporta múltiplos formatos e faz validação automática. Use o botão 'Baixar Template' para ver o formato correto."
      },
      {
        question: "Como funciona o sistema de pontuação?",
        answer: "Você define pesos para cada PTA (TPI, NM$, etc.). O sistema calcula um score ponderado para cada touro. Touros com maior score são os mais adequados aos seus critérios."
      },
      {
        question: "O que é a migração de staging?",
        answer: "Após importar, os dados ficam em 'staging' (área temporária). Clique em 'Migrar Touros' para processar e validar os dados, movendo-os para a base definitiva."
      },
      {
        question: "Como exportar a lista de touros?",
        answer: "Use o botão 'Exportar' para baixar todos os dados em CSV, incluindo PTAs, scores e informações de pedigree. Útil para análises externas ou backup."
      }
    ],
    resources: [
      {
        title: "Guia: Importação de Touros",
        description: "Formato de arquivos e processo completo de importação",
        type: "Guia"
      },
      {
        title: "Vídeo: Seleção de Touros",
        description: "Como usar filtros e scores para escolher os melhores touros",
        type: "Vídeo"
      },
      {
        title: "Sistema de Pontuação Customizado",
        description: "Configure pesos personalizados para seus objetivos",
        type: "Guia"
      }
    ],
    hints: {
      import: "Importe dados de touros via CSV/Excel. Use o template para garantir formato correto",
      template: "Baixe o template com exemplos de dados reais para facilitar a importação",
      staging: "Dados importados ficam em staging. Use 'Migrar Touros' para processar",
      search: "Busque touros por código NAAB, nome ou empresa",
      filter: "Filtre por empresa ou ano de nascimento",
      weights: "Ajuste os pesos dos PTAs conforme seus objetivos de seleção",
      score: "Scores mais altos indicam touros mais alinhados aos seus critérios",
      export: "Exporte a lista completa de touros com todos os dados e scores",
      company: "Filtre por empresa para ver touros de centrais específicas"
    }
  },

  // Segmentação
  segmentation: {
    faq: [
      {
        question: "O que é segmentação de rebanho?",
        answer: "É o processo de classificar animais em grupos (Superior, Intermediário, Inferior) baseado em índices genéticos customizáveis. Útil para decisões de seleção e descarte."
      },
      {
        question: "Como criar um índice customizado?",
        answer: "Selecione os PTAs relevantes, defina pesos para cada um, e escolha se deseja padronização (Z-score). O sistema calculará um índice único para classificar seus animais."
      },
      {
        question: "O que são 'gates' (portões)?",
        answer: "São filtros que excluem animais que não atendem critérios mínimos. Ex: 'SCS <= 2.75' exclui animais com contagem de células somáticas muito alta."
      },
      {
        question: "Como exportar o relatório de segmentação?",
        answer: "Clique em 'Exportar PDF' para gerar um relatório completo com gráficos, estatísticas e lista de animais por classificação. Ideal para documentação de decisões."
      }
    ],
    resources: [
      {
        title: "Guia: Segmentação de Rebanho",
        description: "Como classificar e selecionar animais estrategicamente",
        type: "Guia"
      },
      {
        title: "Vídeo: Índices Customizados",
        description: "Crie índices personalizados para seus objetivos",
        type: "Vídeo"
      },
      {
        title: "Gates e Filtros Avançados",
        description: "Como usar filtros para seleção precisa",
        type: "Guia"
      }
    ],
    hints: {
      indexSelection: "Escolha entre HHP$, TPI, NM$ ou crie um índice customizado",
      traits: "Selecione quais PTAs incluir no seu índice personalizado",
      weights: "Defina a importância relativa de cada PTA (soma deve ser 100%)",
      standardize: "Padronização (Z-score) recomendada quando PTAs têm escalas diferentes",
      gates: "Use gates para excluir animais que não atendem requisitos mínimos",
      segmentation: "Ajuste percentuais para classificar animais em 3 grupos",
      presets: "Salve configurações frequentes como presets para uso futuro",
      export: "Exporte relatório PDF completo com gráficos e estatísticas",
      visualization: "Gráficos de pizza e barras ajudam a visualizar a distribuição do rebanho"
    }
  },

  // Auditoria Genética
  auditoria: {
    faq: [
      {
        question: "O que é a Auditoria Genética?",
        answer: "É uma análise completa do rebanho em 7 passos: parentesco, top parents, quartis, progressão, comparação, distribuição e benchmark. Fornece visão 360° do potencial genético."
      },
      {
        question: "Como interpretar os quartis?",
        answer: "Animais são divididos em 4 grupos de 25% cada. O Q4 (superior) representa os 25% melhores. Compare a distribuição do seu rebanho com a média nacional."
      },
      {
        question: "O que é o benchmark?",
        answer: "Compara os índices médios do seu rebanho com médias nacionais ou regionais. Mostra onde você está acima ou abaixo do padrão da indústria."
      },
      {
        question: "Como exportar a auditoria completa?",
        answer: "Use o botão 'Exportar PDF' para gerar um relatório profissional com todos os 7 passos, gráficos e análises. Ideal para reuniões e tomada de decisão."
      }
    ],
    resources: [
      {
        title: "Guia: Auditoria Genética Completa",
        description: "Entenda cada um dos 7 passos da auditoria",
        type: "Guia"
      },
      {
        title: "Vídeo: Interpretação de Resultados",
        description: "Como usar os insights da auditoria para decisões estratégicas",
        type: "Vídeo"
      },
      {
        title: "Benchmark e Comparações",
        description: "Como se posicionar em relação ao mercado",
        type: "Guia"
      }
    ],
    hints: {
      steps: "Navegue pelos 7 passos usando os botões no topo da página",
      parentesco: "Analise a consanguinidade e diversidade genética do rebanho",
      topParents: "Identifique os touros e vacas mais influentes no seu rebanho",
      quartis: "Veja como seus animais se distribuem nos quartis de cada índice",
      progression: "Avalie o progresso genético ao longo dos anos",
      comparison: "Compare diferentes gerações ou períodos",
      distribution: "Visualize a distribuição detalhada de cada PTA",
      benchmark: "Compare-se com médias nacionais e identifique oportunidades",
      export: "Exporte relatório PDF profissional com todas as análises"
    }
  },

  // Auditoria Step 1: Parentesco
  "auditoria-step1": {
    faq: [
      {
        question: "O que significa 'Parentesco Completo'?",
        answer: "Animal possui informações de Pai (Sire), Avô Materno (MGS) e Bisavô Materno (MMGS). Essencial para predições precisas no Nexus 2 (pedigree). Quanto mais completo, maior a confiabilidade genética."
      },
      {
        question: "Por que o sistema divide em 3 categorias (Completo, Incompleto, Desconhecido)?",
        answer: "'Completo' = possui os 3 ancestrais. 'Incompleto' = possui 1 ou 2 ancestrais. 'Desconhecido' = nenhum ancestral cadastrado. A divisão facilita identificar prioridades: complete os 'Incompletos' primeiro (já têm base parcial)."
      },
      {
        question: "Qual a importância de cada ancestral (Sire vs MGS vs MMGS)?",
        answer: "Sire (Pai) contribui 50% da genética, MGS (Avô Materno) 25%, MMGS (Bisavô) 12.5%. Foco prioritário: completar Sire (maior impacto), depois MGS, por fim MMGS. Sem o Pai cadastrado, a predição genética fica comprometida."
      },
      {
        question: "O que significa quando mais de 50% do rebanho está em 'Desconhecido' para Sire?",
        answer: "Alerta crítico! Metade dos animais não tem pai cadastrado, prejudicando predições genéticas. Causas comuns: dados de IA não importados, cadastro manual incompleto, touros sem código NAAB. AÇÃO: revisar histórico de IA e completar códigos."
      },
      {
        question: "Por que o percentual de 'Completo' varia entre Sire, MGS e MMGS?",
        answer: "É esperado. Registros mais antigos (MMGS) tendem a ter menos dados. Foco: atingir 80%+ de Sire completo, 60%+ de MGS, 40%+ de MMGS. Priorize animais jovens e classificados como 'Superiores' na Segmentação."
      },
      {
        question: "Como priorizar quais pedigrees completar?",
        answer: "Foque em: 1) Animais classificados como 'Doadora' ou 'Superior' na Segmentação (maior impacto genético futuro), 2) Novilhas e Primíparas (gerações recentes), 3) Animais com status 'Incompleto' (já têm base parcial, mais fácil completar)."
      },
      {
        question: "Posso corrigir pedigrees direto na Step 1?",
        answer: "Não. A Step 1 é somente leitura (exibe estatísticas). Para corrigir, vá ao módulo 'Rebanho', encontre o animal, edite os códigos NAAB de Sire/MGS/MMGS. Retorne à Auditoria e os dados serão atualizados automaticamente."
      },
      {
        question: "Como exportar lista de animais com pedigree incompleto?",
        answer: "A Step 1 não exporta lista individual. Vá ao módulo 'Rebanho', filtre animais onde Sire/MGS/MMGS estão vazios, exporte em CSV. Use essa lista para criar plano de ação de completude de dados."
      },
      {
        question: "O que é 'consanguinidade crítica'?",
        answer: "Quando mais de 25% do rebanho tem o mesmo touro como pai. Aumenta risco de problemas genéticos (baixa fertilidade, doenças hereditárias). A Step 1 não detecta automaticamente, mas a Step 2 (Top Parents) mostra esse alerta."
      },
      {
        question: "Por que o total de animais varia entre Sire, MGS e MMGS?",
        answer: "Pode variar devido a filtros aplicados ou dados incompletos. O ideal é que o total seja igual (todos os animais do rebanho). Se houver divergência grande (>5%), investigue possível problema de importação de dados."
      },
      {
        question: "Como usar essa análise no Nexus 2?",
        answer: "Complete pedigrees pendentes (especialmente Sire e MGS) e reprocesse no Nexus 2 para obter predições mais confiáveis. O sistema priorizará animais com pedigree completo nos cálculos (REL% mais alto)."
      },
      {
        question: "Como comparar completude de pedigree entre fazendas?",
        answer: "Não diretamente na Step 1. Exporte os dados de cada fazenda em CSV (via Rebanho), compare percentuais de 'Completo' externamente. Ou solicite ao desenvolvedor criar relatório comparativo multi-fazendas."
      }
    ],
    resources: [
      {
        title: "Guia: Completude de Pedigree",
        description: "Como priorizar completude de dados",
        type: "Guia"
      }
    ],
    hints: {
      completeness: "Foque em completar Sire (50% impacto) antes de MGS/MMGS",
      priority: "Priorize animais 'Superiores' e 'Doadoras' da Segmentação",
      validation: "Verifique Step 2 para detectar consanguinidade crítica"
    }
  },

  // Auditoria Step 2: Top Parents
  "auditoria-step2": {
    faq: [
      {
        question: "Como são definidos os 'Top Parents'?",
        answer: "São os touros (Sire/Pai) e avós maternos (MGS) mais influentes do rebanho, ranqueados por número de filhas no rebanho (não por qualidade genética, mas por frequência). Útil para identificar dependência genética e risco de consanguinidade."
      },
      {
        question: "Qual a diferença entre a aba 'Sire' e 'MGS'?",
        answer: "'Sire' = ranking dos touros usados como pais diretos (50% da genética). 'MGS' = ranking dos touros que são avôs maternos (25% da genética, através da mãe). Use ambas para ver estrutura familiar completa do rebanho."
      },
      {
        question: "Por que o ranking é por 'Nº de Filhas' e não por qualidade genética?",
        answer: "Este step avalia frequência de uso (quantas vezes cada touro foi utilizado), não qualidade (PTAs). Touros com muitas filhas indicam dependência genética. Para avaliar qualidade genética, use Step 3 (Quartis) ou Step 6 (Índices)."
      },
      {
        question: "Como identificar touros sobre-utilizados?",
        answer: "Observe a coluna '%'. Se um touro representa >20% do rebanho, há risco de consanguinidade futura (acasalamentos entre parentes). Considere diversificar genética: reduza uso desse touro, introduza novos touros com perfil similar."
      },
      {
        question: "O que significa 'trait: N/A' na linha do touro?",
        answer: "O touro não possui valor cadastrado para a característica (trait) selecionada no filtro (ex: hhp_dollar). Causas: touro nacional sem avaliação genética, código NAAB incorreto, ou característica não disponível na base de dados."
      },
      {
        question: "Por que o 'Total de filhas' varia entre as abas Sire e MGS?",
        answer: "É esperado. Um touro pode ser pai direto de 50 animais (aparece em Sire) mas avô materno de 20 (aparece em MGS). São contagens independentes. Some ambas para ver influência genética total."
      },
      {
        question: "Como os filtros de 'Ano inicial' e 'Ano final' afetam o ranking?",
        answer: "Filtram apenas as filhas nascidas nesse período. Exemplo: Ano 2020-2025 mostra apenas touros que tiveram filhas nascidas nesses anos. Use para analisar: touros recentes (últimos 2 anos) vs histórico completo (últimos 10 anos)."
      },
      {
        question: "O que é o filtro 'Segmento' (Bezerra, Novilha, Primípara)?",
        answer: "Filtra as filhas por categoria etária. Exemplo: Segmento 'Novilha' mostra quais touros têm mais filhas novilhas. Útil para avaliar: quais touros geraram mais animais de reposição (Novilhas/Primíparas) vs multíparas em produção."
      },
      {
        question: "Como funciona o campo 'Índice p/ RPC'?",
        answer: "Define qual característica (ex: hhp_dollar, tpi) será exibida na coluna 'trait' da tabela. É apenas informativo (não afeta o ranking, que sempre é por nº de filhas). Use para ver média da característica das filhas de cada touro."
      },
      {
        question: "Como usar esse ranking para selecionar próximos touros?",
        answer: "Identifique quais touros geraram as melhores filhas (cruzar com Step 3 ou Segmentação). Busque touros similares (mesma linhagem genética ou PTAs parecidos) para manter consistência. Evite touros que já dominam >15% do rebanho (risco consanguinidade)."
      },
      {
        question: "Como comparar performance entre touros nacionais e importados?",
        answer: "Use a coluna 'trait' (média das filhas). Compare touros com >20 filhas (amostra robusta). Se touros importados têm média 100+ pontos superior, o ROI de sêmen importado é justificado. Se diferença <50 pontos, considere nacionais (custo-benefício)."
      },
      {
        question: "O sistema sugere ações baseado nos top parents?",
        answer: "Sim (alertas automáticos em desenvolvimento). Exemplos: 1) Touro >25% do rebanho → 'Risco de consanguinidade, diversifique'. 2) Top 3 touros >60% do total → 'Dependência genética crítica'. 3) Touro com muitas filhas mas 'trait' baixo → 'Considere substituição'."
      },
      {
        question: "Por que alguns touros aparecem sem nome (só código NAAB)?",
        answer: "Nome do touro não está cadastrado na base de dados. O sistema exibe apenas o código NAAB. Para corrigir: importe dados completos do touro (nome, PTAs) via módulo 'Touros' ou atualize banco de touros."
      },
      {
        question: "Como exportar o ranking de top parents?",
        answer: "Clique em 'Exportar Top Parents' (botão no canto superior direito do card). Gera CSV com ranking completo, frequências e média de 'trait'. Útil para apresentações técnicas ou compartilhar com equipe."
      },
      {
        question: "Posso ver quais são as filhas específicas de cada touro?",
        answer: "Não diretamente na Step 2. Vá ao módulo 'Rebanho', filtre por Sire (código do touro), exporte lista. Ou clique no nome do touro (se houver link implementado) para ver detalhamento das filhas."
      }
    ],
    resources: [
      {
        title: "Guia: Top Parents Analysis",
        description: "Identificar touros-chave e diversificar",
        type: "Guia"
      }
    ],
    hints: {
      frequency: "Observe touros >20% do rebanho (risco consanguinidade)",
      diversity: "Top 3 touros não devem ultrapassar 50% do rebanho",
      quality: "Cruze com Step 3 para ver qualidade genética das filhas"
    }
  },

  // Auditoria Step 3: Quartis Overview
  "auditoria-step3": {
    faq: [
      {
        question: "Como o sistema define exatamente os quartis Top 25% e Bottom 25%?",
        answer: "Para cada PTA, o sistema ordena todos os animais de forma decrescente (melhores primeiro). O Top 25% são os primeiros N/4 animais (arredondado). O Bottom 25% são os N/4 animais com menores valores. Se N=100, cada quartil tem 25 animais."
      },
      {
        question: "Por que algumas PTAs mostram Top 25% e Bottom 25% muito próximos?",
        answer: "Indica baixa variabilidade genética para aquela característica no rebanho. Todos os animais são similares. Pode significar: seleção muito uniforme, poucos touros utilizados, ou característica pouco priorizada historicamente."
      },
      {
        question: "O que significa quando Top 25% tem valor negativo?",
        answer: "Significa que até os melhores animais do rebanho estão abaixo da base populacional (0). Indica necessidade urgente de introduzir genética superior para aquela característica (ex: SCS alto ou DPR baixo)."
      },
      {
        question: "Como interpretar a diferença entre Top e Bottom?",
        answer: "Diferença grande (>2× desvio padrão) = boa variabilidade para seleção. Pequena (<1 DP) = rebanho uniforme, difícil progredir apenas com seleção interna. Use a diferença para priorizar quais PTAs têm maior potencial de ganho genético."
      },
      {
        question: "Como escolher quais PTAs analisar na Step 3?",
        answer: "Inicie com características econômicas (HHP$, NM$, TPI) para visão macro. Depois expanda para gargalos conhecidos (ex: SCS alto, DPR baixo). Use 'Selecionar todas' apenas para exploração inicial, depois foque em 5-8 PTAs prioritárias."
      },
      {
        question: "Posso exportar a seleção de PTAs como preset?",
        answer: "Não diretamente na Step 3. Após definir quais PTAs são prioritárias aqui, anote-as e use nos Steps seguintes (4, 5, 6, 7) para manter consistência analítica em toda a auditoria."
      },
      {
        question: "O que fazer quando o cálculo demora muito?",
        answer: "Reduza o número de PTAs selecionadas. O processamento de 50+ PTAs em rebanhos grandes (>2000 animais) pode levar 10-15s. Selecione grupos menores (5-10 PTAs) e processe em lotes separados."
      },
      {
        question: "Como identificar prioridades de melhoria usando a Step 3?",
        answer: "Ordene as características por: 1) Impacto econômico (HHP$, PTAM, CFP), 2) Distância do Top 25% para meta, 3) Diferença Top-Bottom (quanto ganhar selecionando). PTAs com Top25% negativo ou muito distante do benchmark são prioridade máxima."
      },
      {
        question: "Qual a relação entre as etapas da auditoria e a Segmentação?",
        answer: "Step 3 mostra **o que melhorar** (características deficitárias). Segmentação mostra **quem melhorar** (animais superiores/inferiores). Use insights daqui para ajustar pesos na Segmentação: aumente peso de PTAs onde Top 25% está distante da meta."
      },
      {
        question: "Como usar os quartis para decisões de descarte?",
        answer: "Animais no Bottom 25% de PTAs críticas (SCS, DPR, e outras de fertilidade) são candidatos prioritários a descarte. Exporte essa lista, cruze com idade/produção para decisão final. Evite descartar animais jovens sem chance de melhorar."
      },
      {
        question: "Por que algumas PTAs aparecem como '—' (sem dados)?",
        answer: "Nenhum animal no rebanho possui valor para aquela PTA. Causas comuns: dados não importados, genótipo/pedigree incompleto, ou PTA não relevante para a raça (ex: PTAs de carne em rebanho leiteiro)."
      },
      {
        question: "O N total varia entre PTAs. Por quê?",
        answer: "Nem todos os animais têm todas as PTAs. Novilhas sem genótipo podem ter menos PTAs que vacas com pedigree completo. PTAs lineares (STA, STR, UDC) exigem classificação física. Foque análise em PTAs com N >100 para confiabilidade."
      },
      {
        question: "Como comparar quartis entre fazendas?",
        answer: "Não diretamente na Step 3. Exporte os dados de cada fazenda em CSV, compare externamente. Ou use Step 8 (Benchmark) para comparar Top% do rebanho com média global. Step 3 é análise interna, não comparativa."
      },
      {
        question: "Posso filtrar quartis apenas para novilhas ou primíparas?",
        answer: "No momento ainda não. Caso seja uma necessidade, envie na caixa de sugestões. Atualmente o cálculo considera todos os animais do rebanho."
      },
      {
        question: "Como salvar análise de quartis para comparar mês a mês?",
        answer: "Clique em 'Exportar' no canto superior direito do card. Salve o PDF/XLSX com data no nome (ex: Quartis_Jan2025.pdf). Compare versões antigas para ver evolução. Quartis melhorando = seleção eficaz."
      },
      {
        question: "Como identificar trade-offs entre características?",
        answer: "Compare quartis de PTAs relacionadas. Exemplo: Se Top 25% de PTAM é alto mas Top 25% de CFP é baixo, há trade-off produção vs fertilidade. Use para revisar estratégia de seleção e balancear objetivos no Plano Genético."
      },
      {
        question: "O que fazer quando Top 25% está muito distante do benchmark setorial?",
        answer: "Indica gap genético grande vs mercado. Ações: 1) Introduzir genética externa (sêmen/embriões de elite), 2) Revisar fornecedores de genética, 3) Ajustar metas no Plano (tornar mais ambiciosas), 4) Avaliar ROI de investimento em genômica."
      },
      {
        question: "Como usar a Step 3 para validar estratégia de IA?",
        answer: "Compare quartis antes/depois de mudar touros. Se após 2 anos usando touro A, o Top 25% das novilhas melhorou, a escolha foi boa. Se piorou ou estagnou, revise seleção de touros (use Step 2 para identificar quais touros usar/evitar)."
      },
      {
        question: "Posso criar alertas automáticos baseados nos quartis?",
        answer: "Não nativamente. Solicite ao desenvolvedor criar regras personalizadas. Exemplos: alerta se Top 25% de DPR <0, ou se diferença Top-Bottom de SCS <0.5 (baixa variabilidade). Útil para monitoramento proativo."
      }
    ],
    resources: [
      {
        title: "Estatística Básica: Quartis e Percentis",
        description: "Fundamentos de análise quartil",
        type: "Guia"
      }
    ],
    hints: {
      selection: "Inicie com 5-8 PTAs econômicas, não todas",
      interpretation: "Diferença Top-Bottom grande = alto potencial de seleção",
      export: "Salve com data (Quartis_Jan2025.pdf) para comparação mensal"
    }
  },

  // Auditoria Step 4: Progressão Genética
  "auditoria-step4": {
    faq: [
      {
        question: "O que significa 'Progressão Genética' na prática?",
        answer: "É o ganho (ou perda) genético ao longo dos anos de nascimento. Gráfico mostra se animais mais novos são geneticamente superiores aos mais velhos. Tendência positiva = melhoramento funcionando. Negativa = alerta vermelho de regressão."
      },
      {
        question: "Por que usamos ano de nascimento e não idade atual?",
        answer: "Ano de nascimento representa a genética transmitida naquele momento (touros utilizados, qualidade das mães). Idade atual varia diariamente. Análise por ano de nascimento permite ver evolução da estratégia reprodutiva ao longo do tempo."
      },
      {
        question: "O que é a 'linha de tendência' (trend line)?",
        answer: "Regressão linear que suaviza as oscilações anuais, mostrando direção geral. Inclinação positiva = ganho genético médio por ano. Negativa = regressão. Valor em '/ano' indica quantos pontos de PTA você ganha (ou perde) anualmente."
      },
      {
        question: "O que significa R² no gráfico de tendência?",
        answer: "Mede quão bem a linha de tendência explica os dados (0 a 1). R²=0.9 = 90% da variação é explicada pela tendência linear (progressão consistente). R²<0.3 = muita oscilação, tendência fraca. Foque em PTAs com R²>0.5 para decisões estratégicas."
      },
      {
        question: "Como interpretar anos com picos ou 'vales' no gráfico?",
        answer: "Pico = ano excepcional (touro elite usado, safra de doadoras superior) ou objetivo extremado da característica. Vale = ano problemático (touro ruim, problemas reprodutivos, poucos nascimentos). Investigue causas: revise registros de IA, touros utilizados, eventos de manejo naquele ano."
      },
      {
        question: "Por que a média anual oscila tanto entre anos?",
        answer: "Oscilações naturais refletem: tamanho da amostra (anos com poucos nascimentos variam mais), touros específicos dominando aquele ano, ou safras de embriões concentradas. Use a tendência (linha) para ver padrão geral, ignore oscilações de anos com N<20."
      },
      {
        question: "O que fazer quando a tendência é negativa?",
        answer: "Alerta crítico! Significa regressão genética. Causas: touros de baixa qualidade, acasalamentos equivocados, foco em características não genéticas. AÇÃO: revisar seleção de touros, ajustar plano de metas, avaliar fornecedores de sêmen."
      },
      {
        question: "Como usar progressão para prever genética futura?",
        answer: "Extrapole a linha de tendência. Se ganho é +50 HHP$/ano e tendência é linear, em 3 anos você ganhará +150 HHP$ na média das novilhas. Use para calcular tempo necessário para atingir metas do Plano Genético. Considere R²: baixo = previsão menos confiável."
      },
      {
        question: "O que é a 'Média Geral da Fazenda' (linha laranja tracejada)?",
        answer: "Média ponderada de todas as fêmeas do rebanho (todos os anos). Serve como referência: anos acima da linha = melhores que a média histórica. Abaixo = piores. Útil para ver quantas safras já superaram a média geral."
      },
      {
        question: "Por que devo mostrar/ocultar a média geral?",
        answer: "Mostre para ver quais anos já superaram o padrão da fazenda (foco em quantos anos recentes estão acima). Oculte quando quiser focar apenas na tendência de ganho anual (inclinação), sem referência absoluta. Facilita visualização em gráficos com muitos anos."
      },
      {
        question: "Posso comparar progressão de múltiplas PTAs lado a lado?",
        answer: "Sim, mas não simultaneamente em 1 gráfico. Selecione 2-4 PTAs prioritárias, role verticalmente para comparar. PTAs com tendências divergentes (uma subindo, outra descendo) indicam trade-off: você ganha em uma mas perde em outra. Revise pesos do índice customizado."
      },
      {
        question: "Como lidar com anos sem dados (gaps no gráfico)?",
        answer: "Sistema pula anos sem nascimentos. Causas: problema de importação (data de nascimento vazia/incorreta), ou realmente sem nascimentos (crise, doença). Revise dados brutos na aba Rebanho. Gaps prejudicam cálculo de tendência, corrija se possível."
      },
      {
        question: "Por que alguns anos têm N muito baixo (<10)?",
        answer: "Poucos nascimentos ou muitos dados faltantes (PTAs vazias). Anos com N<10 são instáveis (1 animal excepcional distorce a média). Use filtro de categoria ou ano no topo da Auditoria para focar análise em anos robustos (N>20)."
      },
      {
        question: "Posso filtrar apenas novilhas nascidas após 2020?",
        answer: "Sim. Use o filtro 'Ano de Nascimento' no topo da página de Auditoria. Selecione intervalo desejado. Todos os steps (1 a 7) respeitam esse filtro. Útil para análise de 'nova genética' isolada dos animais antigos."
      },
      {
        question: "Como exportar a progressão para apresentar ao técnico?",
        answer: "Cada gráfico tem botão 'Exportar' (canto superior direito). Gera PDF com gráfico, tabela de dados e estatísticas (tendência, R²). Ou use 'Exportar Auditoria Completa' no final para relatório consolidado de todos os steps."
      },
      {
        question: "Como identificar efeito de mudança de touros no gráfico?",
        answer: "Procure mudanças bruscas de inclinação (antes/depois de introduzir touro novo). Se introduziu touro A em 2020 e a partir de 2021 a tendência acelerou, o touro está funcionando. Se a inclinação diminuiu, revise a escolha."
      },
      {
        question: "O que significa quando R² é muito baixo (<0.3) mas há oscilações grandes?",
        answer: "Indica alta variabilidade sem padrão claro. Causas: mudanças frequentes de estratégia de IA, inconsistência de fornecedores de sêmen, ou efeitos ambientais fortes (nutrição, manejo). Estabilize a estratégia para criar tendência consistente."
      },
      {
        question: "Como usar a progressão para justificar investimento em genômica?",
        answer: "Mostre que a tendência atual (ex: +30 HHP$/ano) é insuficiente para atingir metas em prazo desejado. Com genômica (seleção de doadoras + embriões), pode-se acelerar para +80 HHP$/ano. Calcule ROI: tempo economizado × valor por ponto de HHP$."
      },
      {
        question: "Posso comparar progressão entre fazendas?",
        answer: "Não diretamente na Step 4. Exporte gráficos de cada fazenda em PDF, compare visualmente (inclinações das tendências). Fazendas com inclinação maior = ganho genético mais rápido. Use para benchmark interno entre propriedades."
      },
      {
        question: "Como detectar 'platô' genético (ganho estagnado)?",
        answer: "Quando R² é alto (>0.7) mas inclinação é próxima de zero. Significa que a genética não está melhorando ao longo do tempo. Causas: atingiu limite da estratégia atual, touros de qualidade similar aos animais do rebanho. Solução: introduzir genética externa de elite."
      },
      {
        question: "O que fazer quando a progressão é positiva mas a média geral está caindo?",
        answer: "Possível erro de dados ou efeito de descarte seletivo. Se você está descartando animais de categorias específicas (ex: multíparas velhas), a média geral pode cair temporariamente. Verifique filtros e consistência dos dados importados."
      },
      {
        question: "Como usar a Step 4 para validar impacto de embriões vs IA convencional?",
        answer: "Marque anos em que foram usados embriões intensivamente. Se a média desses anos é significativamente maior (+200 HHP$), o investimento em embriões é justificado. Se diferença é pequena (<50 HHP$), revise estratégia ou fornecedores de embriões."
      },
      {
        question: "Posso criar metas de ganho genético anual baseado na progressão?",
        answer: "Sim. Use a inclinação atual como baseline (ex: +40 HHP$/ano). Defina meta ambiciosa mas realista (ex: +60 HHP$/ano). Ajuste estratégia de IA (melhores touros, mais embriões) para atingir. Monitore nos próximos anos se a nova inclinação está atingindo a meta."
      },
      {
        question: "Como interpretar progressão quando há mudança de raça (ex: introdução de cruzamento)?",
        answer: "PTAs de raças diferentes não são diretamente comparáveis. Filtre apenas animais da raça principal (Holstein puro) ou crie análises separadas por raça. Cruzamentos (Holstein × Jersey) podem distorcer a tendência se misturados."
      },
      {
        question: "O sistema calcula intervalos de confiança da tendência?",
        answer: "Não nativamente. A linha de tendência é uma regressão linear simples. Para intervalos de confiança, exporte os dados em CSV e use ferramentas estatísticas (R, Python) para calcular IC95%. Útil para decisões de alto risco (investimentos grandes)."
      }
    ],
    resources: [
      {
        title: "Vídeo: Entendendo R² e Tendências",
        description: "Interpretação de regressão linear",
        type: "Vídeo"
      }
    ],
    hints: {
      trend: "Foque em PTAs com R²>0.5 (tendência confiável)",
      extrapolation: "Use inclinação para prever tempo até meta",
      alert: "Tendência negativa = alerta crítico de regressão"
    }
  },

  // Auditoria Step 5: Comparação por Categoria
  "auditoria-step5": {
    faq: [
      {
        question: "O que este step faz diferente da Step 4 (Progressão Genética)?",
        answer: "Step 4 = evolução ao longo do tempo (anos). Step 5 = comparação **entre categorias etárias** (Novilhas vs Primíparas vs Multíparas) em um **ponto no tempo** (rebanho atual). Use Step 5 para ver diferenças entre gerações agora."
      },
      {
        question: "Como o sistema detecta as categorias automaticamente?",
        answer: "Busca colunas com nomes típicos (Categoria, category, age_group) e valida se contêm valores conhecidos (Bezerra, Novilha, Primípara...). Se não encontrar, tenta calcular pela coluna 'Paridade'. Se falhar, busca no localStorage (cache) de sessões anteriores."
      },
      {
        question: "O que é o gráfico 'Radar' e como interpretar?",
        answer: "Gráfico de radar (aranha) mostra múltiplas PTAs simultaneamente em eixos radiais. Área maior = grupo superior. Compare os 2 polígonos: características onde um grupo se destaca aparecem como 'pontas' no radar. Útil para ver perfis genéticos de forma visual."
      },
      {
        question: "Por que os valores no radar são normalizados (0-100)?",
        answer: "PTAs têm escalas diferentes (HHP$ em centenas, SCS em unidades). Normalização transforma tudo para 0-100 baseado nos valores mínimo e máximo presentes nos 2 grupos. 100 = melhor dos dois grupos. 0 = pior. Permite comparação visual justa."
      },
      {
        question: "Como escolher quais 2 grupos comparar?",
        answer: "Depende do objetivo: 1) **Novilhas vs Primíparas**: ver impacto do primeiro parto. 2) **Primíparas vs Multíparas**: avaliar longevidade genética. 3) **Novilhas vs Multíparas**: medir ganho geracional (maior diferença esperada). Evite comparar Bezerras (dados incompletos)."
      },
      {
        question: "Posso comparar 3 ou mais grupos simultaneamente?",
        answer: "Não. Step 5 suporta apenas 2 grupos. Para comparar 3+, faça múltiplas comparações 2 a 2 (ex: A vs B, A vs C, B vs C). Ou use Step 3 (Quartis) para ver todas as categorias juntas em formato tabular."
      },
      {
        question: "Como filtrar grupos por outras características (origem, fazenda)?",
        answer: "Não diretamente aqui. Use filtros gerais da Auditoria (topo da página) antes de acessar Step 5. Ou exporte dados brutos e filtre externamente. Step 5 trabalha com categorias etárias pré-definidas."
      },
      {
        question: "Quais características devo incluir na tabela vs no radar?",
        answer: "**Tabela:** 5-8 características prioritárias (HHP$, TPI, NM$, PTAM, CFP, SCS, DPR). **Radar:** 8-12 características (adicione lineares importantes: PTAT, UDC, PL). Tabela para números precisos, radar para padrão visual. Muitas características (>15) poluem o radar."
      },
      {
        question: "Por que algumas PTAs aparecem zeradas no radar?",
        answer: "Nenhum animal dos 2 grupos possui valor para aquela PTA. Remove automaticamente do radar para evitar distorção. Verifique se dados de genótipo/pedigree estão completos. PTAs lineares exigem classificação física."
      },
      {
        question: "Como salvar configuração de PTAs para reusar?",
        answer: "Atualmente não há preset. Anote as PTAs selecionadas ou exporte a configuração em PDF (botão 'Exportar'). Na próxima sessão, reselecione manualmente. Ou use navegador com auto-preenchimento de formulários para acelerar."
      },
      {
        question: "Como usar a comparação para decisões de seleção?",
        answer: "Se Novilhas superam Primíparas em características-chave (HHP$, TPI), continue estratégia atual (touros bons). Se Primíparas são melhores, investigue: touros recentes piores? Problema de IA? Ajuste imediatamente antes de deteriorar mais gerações."
      },
      {
        question: "O que significa quando valores brutos são muito diferentes dos normalizados?",
        answer: "Normalização (0-100) é relativa aos 2 grupos. Se Grupo A tem HHP$ +500 e B +1000, A pode aparecer como 0 e B como 100, mas ambos são positivos. Sempre consulte valores brutos (tooltip ou tabela) para decisões reais."
      },
      {
        question: "Como identificar trade-offs genéticos no radar?",
        answer: "Procure características onde os grupos se invertem: Grupo A melhor em produção (PTAM alto), Grupo B melhor em saúde (SCS baixo). Indica histórico de seleção conflitante. Use para ajustar estratégia futura: balancear com índice customizado na Segmentação."
      },
      {
        question: "Como interpretar quando Novilhas são piores que Multíparas?",
        answer: "Alerta crítico! Indica regressão genética recente (touros ruins, embriões de baixa qualidade, ou acasalamentos equivocados). Revise imediatamente: Step 2 (quais touros estão sendo usados), Step 4 (tendência de progressão), e ajuste estratégia de IA."
      },
      {
        question: "Posso comparar mesma categoria entre diferentes anos de nascimento?",
        answer: "Não diretamente na Step 5 (compara categorias etárias). Use Step 4 (Progressão) para comparar anos. Ou filtre rebanho por ano de nascimento (topo da Auditoria) e compare Novilhas de 2020 vs Novilhas de 2023 em duas sessões separadas."
      },
      {
        question: "Como usar a Step 5 para avaliar impacto de programa de embriões?",
        answer: "Se usou embriões intensivamente em Novilhas (e não em Multíparas), compare os dois grupos. Novilhas com HHP$ 200+ pontos superiores = programa funcionou. Se diferença <100 pontos, revise fornecedores ou doadoras dos embriões."
      },
      {
        question: "O que fazer quando o radar mostra perfis muito similares?",
        answer: "Indica que a genética entre gerações é uniforme (pouca evolução). Causas: touros muito similares ao longo dos anos, ou rebanho já atingiu 'platô' genético. Solução: introduzir genética externa de elite para renovar variabilidade."
      },
      {
        question: "Como exportar comparação para compartilhar com técnico?",
        answer: "Clique em 'Exportar' no canto superior direito. Gera PDF com radar, tabela e estatísticas. Inclua anotações sobre insights (ex: 'Novilhas superiores em DPR, manter estratégia atual'). Útil para reuniões técnicas."
      },
      {
        question: "Posso criar alertas automáticos baseados na comparação?",
        answer: "Não nativamente. Solicite ao desenvolvedor criar regras. Exemplos: alerta se Novilhas têm HHP$ 50+ pontos inferior a Multíparas (regressão), ou se diferença entre grupos é <10 pontos (estagnação). Útil para monitoramento contínuo."
      },
      {
        question: "Como usar a Step 5 para decisões de descarte seletivo?",
        answer: "Se Multíparas têm genética muito inferior às Novilhas (gap >300 HHP$), priorize descarte de Multíparas velhas (>5 partos) mesmo com produção razoável. Libere espaço para Novilhas geneticamente superiores (maior retorno futuro)."
      },
      {
        question: "O sistema considera efeitos ambientais na comparação?",
        answer: "Não. A comparação é **genética pura** (PTAs), não produção observada. Efeitos ambientais (nutrição, manejo) não são considerados. Se quiser comparar produção real (leite, gordura), use módulo 'Rebanho' com filtros por categoria."
      },
      {
        question: "Como validar se a comparação está correta?",
        answer: "Cruze com Step 3 (Quartis). Se Novilhas têm Top 25% de HHP$ maior que Multíparas, isso deve aparecer na Step 5 (Novilhas superiores no radar). Se houver inconsistência, revise dados (possível problema de importação ou filtros aplicados)."
      }
    ],
    resources: [
      {
        title: "Guia: Comparação Categórica",
        description: "Novilhas vs Vacas: o que analisar",
        type: "Guia"
      }
    ],
    hints: {
      groups: "Novilhas vs Multíparas = maior diferença esperada (ganho geracional)",
      radar: "Área maior = grupo superior naquelas PTAs",
      normalization: "Sempre consulte valores brutos para decisões reais"
    }
  },

  // Auditoria Step 6: Quartis de Índices
  "auditoria-step6": {
    faq: [
      {
        question: "Qual a diferença entre Step 3 (Quartis Overview) e Step 6 (Quartis Índices)?",
        answer: "Step 3 = quartis de PTAs individuais (uma por vez). Step 6 = quartis baseados em índices econômicos (HHP$, TPI, NM$, FM$, CM$) e mostra como os TOP 25% desse índice diferem nas PTAs subjacentes. Step 6 responde: 'Se eu selecionar animais pelo TPI, como ficam as outras PTAs?'"
      },
      {
        question: "O que são 'Índice A' e 'Índice B'?",
        answer: "São dois índices econômicos escolhidos para comparação. Exemplo: Índice A = HHP$ (lucro), Índice B = TPI (genética pura). Sistema classifica animais por cada índice separadamente e mostra como os Top 25% de cada um diferem. Útil para ver trade-offs entre objetivos."
      },
      {
        question: "Como escolher quais índices comparar?",
        answer: "Depende da estratégia: **HHP$ vs NM$**: lucro geral vs mérito líquido. **TPI vs FM$**: genética de elite vs foco em gordura. **CM$ vs HHP$**: mercado de queijo vs lucro líquido. Comece com HHP$ (sempre) e compare com seu objetivo secundário."
      },
      {
        question: "O que significa a linha 'Difference' (diferença) na tabela?",
        answer: "Mostra a diferença entre Top 25% do Índice A e Top 25% do Índice B para cada PTA. Valores positivos = Índice A superior naquela PTA. Negativos = Índice B superior. Útil para ver **exatamente onde** os dois índices divergem."
      },
      {
        question: "Como interpretar valores positivos vs negativos na linha Difference?",
        answer: "Positivo (verde) = Top 25% do Índice A tem média maior naquela PTA. Exemplo: Difference PTAM = +500 → animais top HHP$ produzem 500 lbs a mais que top TPI. Negativo = Índice B é superior. Magnitude indica importância do trade-off."
      },
      {
        question: "Qual o significado prático da diferença entre Top25 e Bottom25?",
        answer: "Magnitude do gap genético interno. Diferença grande (ex: HHP$ Top25=+800, Bottom25=-200) = potencial enorme de ganho selecionando apenas interno. Pequena = baixa variabilidade, precisa introduzir genética externa (sêmen/embriões)."
      },
      {
        question: "Por que alguns índices têm diferença próxima de zero?",
        answer: "Ambos os índices (A e B) ponderam aquela PTA de forma similar, então os Top 25% de cada um são geneticamente parecidos. Exemplo: SCS geralmente tem peso similar em HHP$ e NM$, então a diferença é pequena. Foque em PTAs com diferença >100 para insights estratégicos."
      },
      {
        question: "Como usar a tabela para escolher qual índice seguir?",
        answer: "Identifique qual índice tem Top 25% mais alinhado com suas metas reais. Se prioriza produção de leite (PTAM), escolha o índice onde Difference em PTAM é positivo. Se prioriza saúde (SCS baixo, DPR alto), escolha o índice que pontua melhor nessas PTAs."
      },
      {
        question: "Posso comparar índices customizados (criados na Segmentação)?",
        answer: "Não diretamente. Step 6 só suporta índices econômicos padrão (HHP$, TPI, NM$, FM$, CM$). Para avaliar índice customizado, use Segmentação (classificação Superior/Intermediário/Inferior) e depois vá à Step 3 para ver quartis das PTAs individuais."
      },
      {
        question: "Por que o botão 'Atualizar' existe se a tabela já carrega automaticamente?",
        answer: "Carregamento automático ocorre ao entrar no step. Use 'Atualizar' quando: mudar filtros gerais (ano, categoria), ou após importar novos dados. Força recálculo dos quartis. Útil durante sessões longas para garantir dados frescos."
      },
      {
        question: "Como exportar apenas a linha 'Difference' para análise?",
        answer: "Clique em 'Exportar' no canto superior direito. Gera XLSX com 3 abas: IndexA, IndexB, Difference. Abra a aba Difference no Excel, filtre/ordene por magnitude. Ou copie diretamente da tabela (Ctrl+C) para colar em planilha externa."
      },
      {
        question: "Como usar a Step 6 para decidir entre HHP$ e TPI?",
        answer: "Compare as linhas Difference. Se HHP$ tem Top 25% muito superior em PTAM (+500) mas inferior em PTAT (-50), e você prioriza produção, siga HHP$. Se prioriza conformação/longevidade, siga TPI. Não há 'certo' ou 'errado', depende da sua estratégia de mercado."
      },
      {
        question: "O que fazer quando os Top 25% dos dois índices são muito similares?",
        answer: "Indica que ambos os índices selecionam animais parecidos. Nesse caso, escolha o índice mais simples de usar ou mais conhecido pelo mercado (ex: TPI é padrão setorial). Ou crie índice customizado na Segmentação com pesos ajustados às suas prioridades."
      },
      {
        question: "Como identificar características 'conflitantes' entre índices?",
        answer: "Procure PTAs onde a diferença é grande e negativa. Exemplo: HHP$ prioriza produção (+300 PTAM) mas sacrifica fertilidade (-100 DPR). Se fertilidade é crítica para você, ajuste estratégia: use NM$ (mais balanceado) ou crie índice customizado."
      },
      {
        question: "Posso usar a Step 6 para validar índices de fornecedores de genética?",
        answer: "Sim. Se um fornecedor usa índice proprietário (ex: 'Índice Fazenda Feliz'), compare os animais classificados como 'Top' pelo índice deles vs Top 25% do HHP$. Se houver divergência grande (>200 pontos), questione a metodologia do fornecedor."
      },
      {
        question: "O que fazer quando Top25 do Índice A tem N muito diferente de Índice B?",
        answer: "Não deve acontecer (ambos são sempre 25% do rebanho total). Se ocorrer, indica bug ou dados inconsistentes. Verifique se a coluna do índice está preenchida para todos os animais. Relate o problema com screenshot no suporte."
      },
      {
        question: "Posso adicionar mais índices além dos 5 padrão (HHP$, TPI, NM$, FM$, CM$)?",
        answer: "Não sem modificar o código. Se você usa índice proprietário (ex: Índice Genômico ABS, Índice Gir Leiteiro), solicite ao desenvolvedor adicionar na lista INDEX_OPTIONS. Sistema é extensível, mas requer atualização técnica."
      },
      {
        question: "Como usar a Step 6 para decisões de compra de embriões?",
        answer: "Compare o índice usado pela central de embriões (ex: TPI) com HHP$. Se a diferença em PTAs-chave (PTAM, CFP) é >200 pontos, negocie preço ou busque fornecedor cujo índice esteja mais alinhado com HHP$ (seu objetivo econômico)."
      },
      {
        question: "O sistema considera seleção de sexo (sêmen sexado) na análise?",
        answer: "Não. A Step 6 analisa apenas genética pura (PTAs), não estratégia de IA. Para simular impacto de sêmen sexado, use módulo 'Plano Genético' (Calculadora de Reposição) que permite definir % de sexado por categoria."
      },
      {
        question: "Como criar alerta se a diferença entre índices ultrapassar threshold?",
        answer: "Não nativamente. Solicite ao desenvolvedor criar regra personalizada. Exemplo: alerta se Difference em DPR entre HHP$ e NM$ >100 (sacrifício excessivo de fertilidade). Útil para revisão periódica de estratégia."
      }
    ],
    resources: [
      {
        title: "Documentação: Índices Econômicos (HHP$, TPI, NM$)",
        description: "O que cada índice prioriza",
        type: "Guia"
      }
    ],
    hints: {
      comparison: "Comece sempre com HHP$ vs seu objetivo secundário",
      difference: "Foque em PTAs com diferença >100 (trade-offs significativos)",
      strategy: "Escolha índice alinhado com suas metas de mercado"
    }
  },

  // Auditoria Step 7: Distribuição de PTAs
  "auditoria-step7": {
    faq: [
      {
        question: "O que são 'bins' e como afetam o histograma?",
        answer: "Bins são intervalos (faixas) que agrupam os valores. Sistema usa bins fixos. Exemplo: se HHP$ varia de 0 a 1000, cada bin agrupa 50 pontos (0-50, 50-100...). Mais bins = mais detalhamento mas barras menores. 20 é equilíbrio ideal para visualização."
      },
      {
        question: "Por que usar distribuição em vez de média simples?",
        answer: "Média esconde variabilidade. Exemplo: Média HHP$ = 400, mas distribuição mostra 2 picos (um em 200, outro em 600 = rebanho bimodal). Distribuição revela: assimetria, outliers, múltiplas subpopulações. Essencial para decisões de seleção e cruzamento."
      },
      {
        question: "Como interpretar histograma 'normal' vs 'assimétrico'?",
        answer: "**Normal** (sino): Maioria dos animais próximo à média, poucos nos extremos. Indica boa homogeneidade. **Assimétrico** (cauda longa): Muitos animais em um extremo, poucos no outro. Exemplo: SCS com cauda à direita = alguns animais com mastite crônica. Identifique e descarte os outliers."
      },
      {
        question: "O que é distribuição 'bimodal' e o que significa?",
        answer: "Dois picos distintos no histograma. Indica duas subpopulações. Causas comuns: mistura de raças (Holstein puro + cruzado), duas estratégias de IA (touro elite + touro barato), ou importação recente de genética externa. Investigue causas para direcionar seleção."
      },
      {
        question: "Como identificar outliers no histograma?",
        answer: "Procure barras isoladas nos extremos (longe do pico principal). Exemplo: HHP$ com maioria em 300-500, mas 5 animais em 1000+. Esses são outliers (potenciais doadoras) ou erros de dados. Valide com tabela individual antes de decisões."
      },
      {
        question: "O que fazer com animais na cauda inferior (piores 5%)?",
        answer: "Candidatos prioritários a descarte. Cruze com: idade (velhas com baixa genética = descarte imediato), problemas de saúde (SCS alto, mastite), baixa produção. Evite descartar novilhas (ainda não provaram potencial). Exporte lista para análise detalhada."
      },
      {
        question: "Como usar distribuição para definir gates na Segmentação?",
        answer: "Veja onde estão os 'cortes naturais'. Exemplo: HHP$ com vale em 400 → use 400 como gate entre Superior e Intermediário. Distribuição mostra se gates escolhidos fazem sentido estatístico ou são arbitrários. Ajuste gates para coincidir com vales do histograma."
      },
      {
        question: "Por que alguns histogramas têm picos no zero?",
        answer: "Muitos animais com PTA exatamente zero. Causas: 1) Base populacional (PTA=0 por definição), 2) Animais sem genótipo/pedigree (sistema atribui 0), 3) PTA irrelevante para o rebanho. Se >30% está em zero, investigue qualidade dos dados."
      },
      {
        question: "Como comparar distribuições entre fazendas?",
        answer: "Exporte histogramas de cada fazenda (PDF), coloque lado a lado. Compare: posição do pico (fazenda A tem média maior?), amplitude (fazenda B tem mais variabilidade?), assimetria. Ou use ferramenta externa (R, Excel) para sobrepor histogramas."
      },
      {
        question: "Posso salvar a seleção de PTAs para reusar?",
        answer: "Sistema inicia sempre em HHP$. Reselecione manualmente a cada sessão. Ou anote PTAs prioritárias (ex: HHP$, TPI, PTAM, SCS, DPR) e marque rapidamente. Considere criar checklist pessoal para acelerar."
      },
      {
        question: "Como interpretar N total diferente entre PTAs?",
        answer: "Normal. Nem todos os animais têm todas as PTAs. Novilhas sem genótipo = menos PTAs. PTAs lineares exigem classificação. Foque análise em PTAs com N >100 (amostra robusta). N <50 = distribuição instável, interprete com cautela."
      },
      {
        question: "Como detectar efeito de programa de embriões na distribuição?",
        answer: "Se usou embriões intensivamente em anos recentes, filtre rebanho por ano de nascimento (ex: 2022-2024). Compare distribuição de HHP$ desses animais vs todo o rebanho. Se há pico à direita (animais de alto valor), programa funcionou."
      },
      {
        question: "O que significa quando a distribuição tem 'cauda longa' à direita?",
        answer: "Poucos animais de altíssimo valor genético (outliers positivos). Causas: embriões de elite, touros genômicos top, ou importação de genética externa. AÇÃO: identifique esses animais (Step 3, Top 25%), use como doadoras, multiplique genética."
      },
      {
        question: "Como usar distribuição para estimar impacto de descarte seletivo?",
        answer: "Remova mentalmente a cauda inferior (5-10% piores). Recalcule média apenas com os restantes. Exemplo: média atual HHP$ = 400, removendo 10% piores → média sobe para 450. Ganho estimado = +50 HHP$/animal apenas com descarte."
      },
      {
        question: "Posso criar grupos de seleção baseado nos vales da distribuição?",
        answer: "Sim. Se distribuição mostra vale em 350 e 650 HHP$, crie 3 grupos: <350 (descarte), 350-650 (manutenção), >650 (elite multiplicação). Use esses valores como gates na Segmentação para automação."
      },
      {
        question: "Como interpretar distribuições muito achatadas (platykurtic)?",
        answer: "Animais espalhados uniformemente em ampla faixa de valores (baixa concentração). Indica alta variabilidade genética interna. VANTAGEM: grande potencial de ganho por seleção. DESVANTAGEM: rebanho desuniforme, dificulta manejo padronizado."
      },
      {
        question: "O que fazer quando a distribuição tem múltiplos picos (multimodal)?",
        answer: "Cada pico representa subpopulação distinta. Investigue causas: touros específicos (Step 2), categorias etárias (Step 5), ou origens diferentes (genômica vs pedigree). Decida: manter diversidade (múltiplos picos) ou unificar (focar em 1 pico)?"
      },
      {
        question: "Por que alguns histogramas ficam 'vazios' (poucas barras)?",
        answer: "Poucos animais com aquela PTA, ou valores muito concentrados. Se N <30, o histograma não é representativo. Aumente amostra (remova filtros de categoria/ano) ou foque em PTAs com dados mais completos."
      }
    ],
    resources: [
      {
        title: "Estatística Descritiva: Distribuições",
        description: "Normal, assimétrica, bimodal",
        type: "Guia"
      }
    ],
    hints: {
      outliers: "Barras isoladas nos extremos = potenciais doadoras ou erros",
      gates: "Use vales da distribuição para definir gates na Segmentação",
      bimodal: "Dois picos = duas subpopulações (investigue causas)"
    }
  },

  // Nexus 1 - Predição Genômica
  "nexus1-genomic": {
    faq: [
      {
        question: "Quais arquivos o Nexus 1 aceita?",
        answer: "Importe planilhas CSV ou XLSX com as colunas mínimas: ID do animal, Genotype ID, Data de coleta e PTAs já avaliadas. O sistema realiza validação automática e aponta colunas ausentes."
      },
      {
        question: "Posso misturar fêmeas genotipadas e não genotipadas?",
        answer: "Sim. As fêmeas sem genótipo serão calculadas usando regressões padrão. As genotipadas recebem ajustes a partir do arquivo importado e da base do CDCB."
      },
      {
        question: "Como interpretar o índice de confiabilidade?",
        answer: "A confiabilidade (REL%) indica segurança da predição. Valores acima de 70% representam estimativas robustas; abaixo disso, considere complementar com pedigree ou dados de produção."
      },
      {
        question: "É possível exportar os resultados do Nexus 1?",
        answer: "Use o botão de exportação para baixar um XLSX com todas as PTAs projetadas, confiabilidade e ganhos esperados por geração."
      },
      {
        question: "Como integrar com o Plano Genético?",
        answer: "Após gerar as predições, utilize o botão 'Enviar para Plano' para sincronizar automaticamente com a Projeção Genética e a Calculadora de Reposição."
      }
    ],
    resources: [
      {
        title: "Guia: Predição Genômica Completa",
        description: "Configuração do arquivo, execução do modelo e interpretação de PTAs",
        type: "Guia"
      },
      {
        title: "Vídeo: Workflow Nexus 1",
        description: "Importação, processamento e exportação em 10 minutos",
        type: "Vídeo"
      },
      {
        title: "Checklist de Validação",
        description: "Itens obrigatórios antes de rodar o Nexus 1",
        type: "Guia"
      }
    ],
    hints: {
      upload: "Importe o arquivo genômico com cabeçalhos oficiais CDCB ou Interbull",
      validation: "Revise o painel de validação para corrigir IDs ausentes ou duplicados",
      refresh: "Use 'Atualizar Predições' para recalcular após corrigir dados",
      export: "Exporte os resultados para XLSX e compartilhe com a equipe técnica",
      integration: "Envie o lote para o Plano Genético para simular acasalamentos",
      filters: "Filtre por status de genotipagem para priorizar análises"
    }
  },

  // Nexus 2 - Predição por Pedigree (individual)
  "nexus2-pedigree": {
    faq: [
      {
        question: "Quais dados são necessários?",
        answer: "Informe o código NAAB do pai, avô materno e bisavô materno. Os campos opcionais incluem PTA dos pais para reforçar a regressão."
      },
      {
        question: "Como funciona a regressão de pedigree?",
        answer: "Aplicamos pesos específicos para cada ancestral (pai 50%, MGS 25%, MMGS 12,5%) e ajustamos por média de base. O resultado é exibido como PTA estimado."
      },
      {
        question: "Posso salvar diferentes cenários?",
        answer: "Sim. Use 'Salvar Cenário' para armazenar combinações de pedigree e comparar depois em relatórios do Nexus 2."
      },
      {
        question: "Existe validação de NAAB?",
        answer: "Ao digitar o código, validamos automaticamente na base de touros cadastrados. Códigos inválidos são sinalizados em vermelho."
      },
      {
        question: "Como enviar resultados para o rebanho?",
        answer: "Após calcular, clique em 'Enviar para Rebanho' para atualizar as fêmeas com os PTAs projetados na base de dados."
      }
    ],
    resources: [
      {
        title: "Guia: Nexus 2 passo a passo",
        description: "Preenchimento de pedigree, validações e exportações",
        type: "Guia"
      },
      {
        title: "Vídeo: Regressão de Pedigree na prática",
        description: "Demonstração completa com exemplo real",
        type: "Vídeo"
      },
      {
        title: "Tabela de pesos de parentesco",
        description: "Conheça os coeficientes usados para cada ancestral",
        type: "Guia"
      }
    ],
    hints: {
      sire: "Digite o código NAAB do pai. Pressione Enter para validar",
      mgs: "Informe o NAAB do avô materno para melhorar a precisão",
      mmgs: "Complete com o bisavô materno quando disponível",
      calculate: "Clique em 'Calcular PTA' para gerar as estimativas imediatamente",
      save: "Salve cenários frequentes e reutilize-os a partir da lista lateral",
      send: "Envie os resultados aprovados direto para o rebanho"
    }
  },

  // Nexus 2 - Processamento em Lote
  "nexus2-batch": {
    faq: [
      {
        question: "Qual o formato do arquivo em lote?",
        answer: "Utilize CSV ou XLSX com cabeçalhos: female_id, sire_naab, mgs_naab, mmgs_naab e opcionalmente PTAs observados. Disponibilizamos um template pronto para download."
      },
      {
        question: "Qual o limite de registros por arquivo?",
        answer: "Recomendamos até 5.000 linhas por importação para manter o processamento rápido. Arquivos maiores podem ser divididos."
      },
      {
        question: "Como acompanhar o processamento?",
        answer: "O painel de status exibe fila, tempo estimado e histórico de erros. Você pode atualizar a qualquer momento pelo botão 'Atualizar Status'."
      },
      {
        question: "Como tratar erros de importação?",
        answer: "Baixe o relatório de erros, corrija os registros sinalizados (ex: NAAB inválido) e faça novo upload apenas com as linhas problemáticas."
      },
      {
        question: "Posso enviar o resultado direto para o rebanho?",
        answer: "Sim. Após a conclusão, use 'Enviar para Rebanho' para atualizar todos os animais processados."
      }
    ],
    resources: [
      {
        title: "Template Nexus 2 Lote",
        description: "Planilha com colunas obrigatórias e exemplos preenchidos",
        type: "Guia"
      },
      {
        title: "Vídeo: Processamento em massa",
        description: "Demonstração do upload, monitoramento e exportação",
        type: "Vídeo"
      },
      {
        title: "Checklist pós-processamento",
        description: "Verificações antes de enviar dados para o rebanho",
        type: "Guia"
      }
    ],
    hints: {
      upload: "Faça upload do arquivo em lote com pedigree completo",
      template: "Baixe o template para evitar cabeçalhos incorretos",
      process: "Inicie o processamento e acompanhe a fila em tempo real",
      errors: "Baixe o relatório de erros para corrigir registros específicos",
      results: "Exporte o arquivo final com PTAs estimadas",
      send: "Envie as predições aprovadas direto para o rebanho"
    }
  },

  // Nexus 3 - Análise de Grupos
  "nexus3-groups": {
    faq: [
      {
        question: "Como criar grupos de comparação?",
        answer: "Defina filtros (categoria, ano, origem) e salve cada conjunto como um grupo. Você pode comparar até 4 grupos simultaneamente."
      },
      {
        question: "Quais métricas são comparadas?",
        answer: "Mostramos médias de PTAs, distribuição por quartis e projeção de ganhos econômicos para cada grupo configurado."
      },
      {
        question: "Posso importar grupos pré-definidos?",
        answer: "Sim. Use o botão 'Importar Grupos' para carregar listas de animais ou segmentos criados na ferramenta de Segmentação."
      },
      {
        question: "Como interpretar o gráfico Mães vs. Filhas?",
        answer: "O gráfico mostra a progressão entre gerações. Pontos acima da linha diagonal indicam evolução positiva das filhas em relação às mães."
      },
      {
        question: "Existe exportação dedicada?",
        answer: "Utilize 'Exportar Comparação' para gerar PDF com tabelas, gráficos e insights prontos para apresentação."
      }
    ],
    resources: [
      {
        title: "Guia: Nexus 3",
        description: "Segmentação, criação de grupos e comparação detalhada",
        type: "Guia"
      },
      {
        title: "Vídeo: Benchmark interno",
        description: "Aprenda a comparar lotes, safras e fornecedores",
        type: "Vídeo"
      },
      {
        title: "Modelo de apresentação",
        description: "Slides editáveis com gráficos do Nexus 3",
        type: "Guia"
      }
    ],
    hints: {
      create: "Monte grupos usando filtros por categoria, ano ou origem",
      compare: "Selecione até 4 grupos e visualize as diferenças de PTA",
      mothersVsDaughters: "Use o gráfico Mães vs. Filhas para avaliar ganho genético",
      import: "Importe grupos previamente salvos na Segmentação",
      export: "Gere um PDF com a comparação para compartilhar com a equipe",
      notes: "Anote insights diretamente na lateral do relatório"
    }
  },

  // Plano Genético - Projeção
  "plano-projecao": {
    faq: [
      {
        question: "Como configurar cenários de acasalamento?",
        answer: "Selecione touros, defina metas de PTA e escolha restrições de consanguinidade. O simulador calcula o impacto em cada geração."
      },
      {
        question: "O que é ROI genético?",
        answer: "É o retorno financeiro estimado considerando aumento de produção, economia com problemas sanitários e custo do sêmen."
      },
      {
        question: "Posso comparar cenários?",
        answer: "Sim. Crie múltiplos cenários e utilize a aba 'Comparar Cenários' para visualizar diferenças de ganho genético e ROI."
      },
      {
        question: "Como enviar a projeção para o Botijão Virtual?",
        answer: "Após definir o cenário, clique em 'Enviar para Botijão' para reservar doses alinhadas ao plano."
      },
      {
        question: "Como interpretar o gráfico de evolução?",
        answer: "O gráfico mostra a projeção das principais PTAs ao longo de 5 anos. Use para validar se as metas serão atingidas."
      }
    ],
    resources: [
      {
        title: "Guia: Planejamento Genético",
        description: "Monte cenários, avalie ROI e integre com o Botijão",
        type: "Guia"
      },
      {
        title: "Vídeo: Simulador de Acasalamentos",
        description: "Demonstração completa da Projeção Genética",
        type: "Vídeo"
      },
      {
        title: "Planilha de ROI",
        description: "Modelo para comparar com resultados reais",
        type: "Guia"
      }
    ],
    hints: {
      scenario: "Configure os touros e metas de PTA do cenário",
      roi: "Analise o ROI projetado considerando custos e ganhos",
      constraints: "Use restrições de consanguinidade para evitar cruzamentos críticos",
      compare: "Compare cenários para escolher a melhor estratégia",
      sendToTank: "Reserve doses no Botijão Virtual direto da projeção",
      export: "Exporte o plano em PDF para compartilhar com consultores"
    }
  },

  // Plano Genético - Calculadora de Reposição
  "plano-calculadora": {
    faq: [
      {
        question: "Quais são as 7 fases da calculadora?",
        answer: "1) Diagnóstico populacional, 2) Estratégia genética, 3) Metas reprodutivas, 4) Composição do rebanho, 5) Investimentos, 6) Receitas projetadas, 7) ROI consolidado."
      },
      {
        question: "Como preencher os dados iniciais?",
        answer: "Informe número de fêmeas por categoria, taxas de descarte e metas de reposição. O sistema preenche sugestões baseadas em benchmarks."
      },
      {
        question: "Posso simular diferentes taxas de prenhez?",
        answer: "Sim. Ajuste a taxa por fase (IA convencional, sexada, embrião) e veja o impacto imediato nos cálculos de bezerras necessárias."
      },
      {
        question: "Como gerar relatório completo?",
        answer: "Clique em 'Exportar Plano' para baixar PDF com todas as fases, gráficos e recomendações consolidadas."
      },
      {
        question: "Existe integração com o Plano de Metas?",
        answer: "As metas definidas na Calculadora alimentam automaticamente a aba 'Metas' e o resumo da fazenda."
      }
    ],
    resources: [
      {
        title: "Guia: Calculadora de Reposição",
        description: "Entenda cada fase e os indicadores necessários",
        type: "Guia"
      },
      {
        title: "Vídeo: Montando o Plano em 20 minutos",
        description: "Passo a passo completo para preencher todas as fases",
        type: "Vídeo"
      },
      {
        title: "Checklist de Dados",
        description: "Informações que você deve coletar antes de iniciar",
        type: "Guia"
      }
    ],
    hints: {
      phase1: "Diagnostique o tamanho do rebanho e projeção de nascimentos",
      phase2: "Defina metas genéticas e índices alvo",
      phase3: "Configure taxas de prenhez e estratégias de IA",
      phase4: "Planeje descarte e reposição por categoria",
      phase5: "Insira custos de sêmen, embriões e manejo",
      phase6: "Projete receitas adicionais com ganhos de produção",
      phase7: "Revise o ROI final antes de aprovar o plano"
    }
  },

  // Plano Genético - IM5 Configurador
  "plano-im5": {
    faq: [
      {
        question: "O que é o IM5$?",
        answer: "É um índice econômico personalizado com até 5 traços. Permite calcular retorno financeiro por filha com base nas PTAs selecionadas."
      },
      {
        question: "Quais traços posso utilizar?",
        answer: "Qualquer PTA disponível no banco (produção, saúde, conformação). Recomenda-se combinar traços de lucro com características funcionais."
      },
      {
        question: "Como definir pesos monetários?",
        answer: "Informe o valor em R$ por unidade de PTA. Ex: +1.0 PTAM = R$ 35,00 de receita/ano. A calculadora ajuda com sugestões baseadas em benchmarks."
      },
      {
        question: "Como aplicar o IM5$ na projeção?",
        answer: "Após calcular o índice, clique em 'Aplicar IM5$' para utilizar o valor diretamente no módulo de ROI da Projeção Genética."
      },
      {
        question: "Posso salvar diferentes configurações?",
        answer: "Sim. Salve presets com combinações de traços e pesos para reutilizar em outras fazendas ou ciclos."
      }
    ],
    resources: [
      {
        title: "Guia: Configurando o IM5$",
        description: "Escolha de traços, pesos monetários e interpretação",
        type: "Guia"
      },
      {
        title: "Vídeo: ROI com IM5$",
        description: "Veja como o índice impacta a análise financeira",
        type: "Vídeo"
      },
      {
        title: "Planilha de apoio",
        description: "Modelos de pesos econômicos para iniciar o cálculo",
        type: "Guia"
      }
    ],
    hints: {
      traits: "Selecione até 5 traços estratégicos para o índice",
      weights: "Defina o valor monetário (R$) para cada unidade de PTA",
      calculate: "Clique em 'Calcular IM5$' para gerar o índice personalizado",
      apply: "Aplique o IM5$ diretamente na Projeção Genética",
      presets: "Salve presets para reutilizar em outros planejamentos",
      export: "Exporte uma planilha com o detalhamento do IM5$"
    }
  },

  // Plano Genético - Metas
  "plano-metas": {
    faq: [
      {
        question: "Quais metas devo definir?",
        answer: "Configure metas para índices genéticos (TPI, NM$), produção (kg leite), reprodução (taxa de prenhez) e população (número de novilhas)."
      },
      {
        question: "Como acompanhar o progresso?",
        answer: "Use os indicadores automáticos e gráficos comparativos que mostram o status atual versus meta desejada."
      },
      {
        question: "Posso anexar anotações estratégicas?",
        answer: "Sim. Utilize o campo de anotações gerais para registrar decisões, prazos e responsáveis. Tudo fica salvo por fazenda."
      },
      {
        question: "As metas se integram com outros módulos?",
        answer: "Sim. Metas alimentam relatórios de Auditoria, Segmentação e Plano, garantindo consistência de indicadores."
      },
      {
        question: "Existe histórico de versões?",
        answer: "Cada salvamento cria um snapshot que pode ser comparado posteriormente através do painel de histórico."
      }
    ],
    resources: [
      {
        title: "Guia: Metas SMART",
        description: "Transforme objetivos em metas mensuráveis",
        type: "Guia"
      },
      {
        title: "Vídeo: Ciclo PDCA no rebanho",
        description: "Como revisar metas a cada trimestre",
        type: "Vídeo"
      },
      {
        title: "Modelo de acompanhamento",
        description: "Planilha para confrontar metas vs. realizado",
        type: "Guia"
      }
    ],
    hints: {
      categories: "Defina metas por área: genética, reprodução, produção e população",
      targets: "Insira valores numéricos e prazos de atingimento",
      notes: "Registre planos de ação e responsáveis",
      reset: "Use 'Reinicializar' para voltar aos padrões sugeridos",
      save: "Salve as metas para atualizar o dashboard geral",
      export: "Gere um resumo em PDF para reuniões de alinhamento"
    }
  },

  // Estrutural Populacional
  estrutural: {
    faq: [
      {
        question: "O que é a análise estrutural?",
        answer: "Mostra distribuição de categorias (bezerras, novilhas, vacas) ao longo do tempo, projetando necessidade de reposição."
      },
      {
        question: "Como interpretar o gráfico de pirâmide?",
        answer: "A largura de cada faixa indica a quantidade de animais por idade/paridade. Pirâmides desbalanceadas sugerem ajuste no plano reprodutivo."
      },
      {
        question: "Posso simular cenários?",
        answer: "Use os controles para ajustar taxas de descarte e nascimento e veja o impacto imediato na pirâmide."
      },
      {
        question: "Como exportar a análise?",
        answer: "Gere PDF ou PNG com os gráficos e indicadores-chave para reuniões estratégicas."
      },
      {
        question: "Integra com a Calculadora de Reposição?",
        answer: "Sim. A análise estrutural alimenta automaticamente os dados da Fase 1 da calculadora."
      }
    ],
    resources: [
      {
        title: "Guia: Estrutura Populacional",
        description: "Entenda sua pirâmide etária e ajuste a reposição",
        type: "Guia"
      },
      {
        title: "Vídeo: Diagnóstico populacional",
        description: "Exemplos práticos de interpretação",
        type: "Vídeo"
      }
    ],
    hints: {
      pyramid: "Analise a pirâmide etária para identificar gargalos",
      sliders: "Ajuste taxas de descarte e nascimento para simular cenários",
      alerts: "Observe alertas automáticos de déficit ou excesso",
      export: "Baixe o diagnóstico em PDF para reuniões",
      integration: "Envie os dados para a Calculadora de Reposição"
    }
  },

  // Pasta de Arquivos
  "pasta-arquivos": {
    faq: [
      {
        question: "Quais arquivos ficam disponíveis?",
        answer: "Relatórios gerados na plataforma (Segmentação, Botijão, Projeção, Auditoria) e uploads manuais categorizados por módulo."
      },
      {
        question: "Como organizar melhor os arquivos?",
        answer: "Use tags e pastas automáticas para separar por fazenda, módulo ou período. Você pode renomear e adicionar descrições."
      },
      {
        question: "Posso compartilhar com a equipe?",
        answer: "Clique em 'Compartilhar' para gerar link seguro com validade configurável ou enviar por e-mail direto da plataforma."
      },
      {
        question: "Existe controle de versão?",
        answer: "Arquivos exportados possuem versão automática com data e hora. Você pode comparar versões e restaurar as anteriores."
      },
      {
        question: "Qual o limite de armazenamento?",
        answer: "Cada fazenda possui 5 GB inclusos. O painel mostra uso atual e permite contratar espaço adicional."
      }
    ],
    resources: [
      {
        title: "Guia: Gestão de documentos",
        description: "Boas práticas para organizar relatórios genéticos",
        type: "Guia"
      },
      {
        title: "Vídeo: Pasta de Arquivos",
        description: "Tour pela interface e funcionalidades de compartilhamento",
        type: "Vídeo"
      }
    ],
    hints: {
      upload: "Envie relatórios e planilhas arrastando para a área destacada",
      tags: "Adicione tags para facilitar a busca futura",
      share: "Compartilhe arquivos com links protegidos por senha",
      search: "Use a busca para encontrar relatórios por nome ou tag",
      download: "Baixe qualquer arquivo em um clique",
      history: "Acesse o histórico de versões para restaurar documentos"
    }
  },

  // Botijão Virtual
  "botijao-virtual": {
    faq: [
      {
        question: "O que é o Botijão Virtual?",
        answer: "É uma ferramenta para gerenciar o inventário de sêmen da fazenda. Controle doses disponíveis, distribua por categoria de fêmeas, registre abastecimentos de nitrogênio e acompanhe o valor do estoque."
      },
      {
        question: "Como adicionar touros ao botijão?",
        answer: "Clique em 'Adicionar ao Botijão', busque o touro desejado, defina tipo (convencional/sexado), quantidade de doses, preço e distribua por categoria. Os dados são salvos automaticamente."
      },
      {
        question: "Como distribuir doses por categoria?",
        answer: "Na edição de cada touro, defina quantas doses alocar para: Novilhas, Primíparas, Secundíparas, Multíparas, Doadoras, Intermediárias e Receptoras. O sistema valida que a soma não exceda o estoque."
      },
      {
        question: "Para que serve o registro de nitrogênio?",
        answer: "Registre cada abastecimento de nitrogênio líquido com data, volume e observações. Fundamental para controle de custos e planejamento de reposição."
      },
      {
        question: "Como exportar o inventário?",
        answer: "Clique em 'Exportar' para baixar CSV completo com todos os touros, doses, distribuições e valores. Use para backup ou análise externa."
      }
    ],
    resources: [
      {
        title: "Guia: Gestão de Estoque de Sêmen",
        description: "Como organizar e controlar seu botijão virtual",
        type: "Guia"
      },
      {
        title: "Vídeo: Distribuição Estratégica",
        description: "Como alocar doses por categoria de forma eficiente",
        type: "Vídeo"
      },
      {
        title: "Controle de Custos",
        description: "Calcule o ROI do seu inventário genético",
        type: "Guia"
      }
    ],
    hints: {
      addBull: "Adicione touros ao botijão para controlar inventário de sêmen",
      stockType: "Diferencie sêmen convencional e sexado para planejamento correto",
      distribution: "Distribua doses por categoria antes de fazer inseminações",
      nitrogen: "Registre abastecimentos de nitrogênio para controle de custos",
      stats: "Acompanhe estatísticas de doses totais, por tipo e valor do estoque",
      export: "Exporte para CSV para backup ou análise em outras ferramentas",
      price: "Defina o preço por dose para calcular o valor total do estoque",
      categories: "7 categorias disponíveis para distribuição estratégica de doses",
      sorting: "Ordene por nome, empresa ou tipo para encontrar touros rapidamente"
    }
  },

  // Metas
  metas: {
    faq: [
      {
        question: "Para que servem as metas?",
        answer: "Estabeleça objetivos mensuráveis em 4 áreas: Genética (PTAs), Reproductiva (taxas e intervalos), Produção (leite e qualidade) e Populacional (estrutura do rebanho). Acompanhe o progresso em tempo real."
      },
      {
        question: "Como definir metas genéticas?",
        answer: "Na aba 'Genéticas', defina valores atuais e metas desejadas para cada PTA (TPI, NM$, Milk, Fat, Protein, SCS, DPR, PTAT). O sistema calcula o percentual de progresso automaticamente."
      },
      {
        question: "Posso customizar as metas?",
        answer: "As metas padrão cobrem os principais indicadores, mas você pode adicionar novas metas ou modificar as existentes conforme necessidades específicas da fazenda."
      },
      {
        question: "Como interpretar o progresso?",
        answer: "Barras de progresso mostram visualmente quanto falta para atingir cada meta. Valores acima de 100% indicam que você já superou o objetivo definido."
      },
      {
        question: "Os dados são salvos automaticamente?",
        answer: "Sim. Todos os valores inseridos são salvos localmente em tempo real. Use o botão 'Salvar Metas' para registrar um checkpoint específico com data e hora."
      }
    ],
    resources: [
      {
        title: "Guia: Definindo Metas Realistas",
        description: "Como estabelecer objetivos alcançáveis e mensuráveis",
        type: "Guia"
      },
      {
        title: "Vídeo: Sistema de Metas",
        description: "Tour completo pelas 4 categorias de metas",
        type: "Vídeo"
      },
      {
        title: "Metas e Estratégia Genética",
        description: "Alinhe suas metas com o planejamento de acasalamentos",
        type: "Guia"
      }
    ],
    hints: {
      geneticGoals: "Defina metas para PTAs alinhadas com seus objetivos de seleção",
      reproductiveGoals: "Estabeleça taxas reprodutivas compatíveis com seu manejo",
      productionGoals: "Configure metas de produção realistas para sua região",
      populationGoals: "Planeje a estrutura populacional ideal do rebanho",
      progress: "Acompanhe barras de progresso para identificar áreas críticas",
      save: "Salve periodicamente para manter histórico de evolução das metas",
      reset: "Use 'Reinicializar' apenas se quiser começar do zero",
      tabs: "Navegue entre as 4 abas para gerenciar diferentes tipos de metas",
      notes: "Use a aba de anotações para registrar estratégias e observações"
    }
  }
};

// Helper para obter conteúdo contextual
export function getHelpContent(page: string): HelpContent {
  return helpContentMap[page] || helpContentMap.dashboard;
}
