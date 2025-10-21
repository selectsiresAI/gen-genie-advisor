// Conteúdo de ajuda contextual para cada página/módulo

export interface HelpContent {
  faq: Array<{
    question: string;
    answer: string;
  }>;
  resources: Array<{
    title: string;
    description: string;
    type: 'Guia' | 'Vídeo';
  }>;
  hints: Record<string, string>;
}

export const helpContentMap: Record<string, HelpContent> = {
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
        answer: "Clique em 'Importar Fêmeas', selecione seu arquivo CSV ou Excel com os dados dos animais. O sistema aceita diversos formatos e fará a validação automática dos dados."
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
  }
};

// Helper para obter conteúdo contextual
export function getHelpContent(page: string): HelpContent {
  return helpContentMap[page] || helpContentMap.dashboard;
}
