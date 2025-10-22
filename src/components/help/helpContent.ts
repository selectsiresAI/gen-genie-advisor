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

  // Auditoria - Step 1 a Step 8
  "auditoria-step1": {
    faq: [
      {
        question: "Qual o objetivo do Step 1?",
        answer: "Mapear parentesco (pai, avô e bisavô maternos) para identificar possíveis gargalos de consanguinidade."
      },
      {
        question: "Como interpretar o status 'Incompleto'?",
        answer: "Indica registros com pedigree parcial. Priorize completar essas informações para melhorar as análises seguintes."
      },
      {
        question: "Existe alerta de consanguinidade?",
        answer: "Sim. Se a porcentagem de parentesco completo de um mesmo touro exceder 25%, mostramos um aviso de risco."
      },
      {
        question: "Posso exportar o levantamento?",
        answer: "Clique em 'Exportar Detalhamento' para baixar a lista com todos os animais e status de pedigree."
      },
      {
        question: "Como usar esses dados no Nexus?",
        answer: "Complete pedigrees pendentes e reprocessar no Nexus 2 para obter predições mais precisas."
      }
    ],
    resources: [
      {
        title: "Guia: Auditoria Step 1",
        description: "Diagnóstico de pedigree e ações corretivas",
        type: "Guia"
      },
      {
        title: "Checklist de pedigree",
        description: "Campos mínimos para manter o cadastro confiável",
        type: "Guia"
      }
    ],
    hints: {
      overview: "Analise a completude do pedigree por ancestral",
      percentages: "Observe a porcentagem de registros completos versus incompletos",
      action: "Priorize completar pedigree dos animais críticos",
      export: "Baixe a lista de animais com falhas de pedigree"
    }
  },
  "auditoria-step2": {
    faq: [
      {
        question: "Quem são os Top Parents?",
        answer: "Touros e vacas com maior participação no rebanho atual. O cálculo considera número de filhas e contribuição genética."
      },
      {
        question: "Como usar os filtros?",
        answer: "Filtre por categoria (bezerras, novilhas, vacas), segmento (superior, intermediário, inferior) e defina o Top N (5, 10, 20)."
      },
      {
        question: "O que significa participação acumulada?",
        answer: "Mostra quanto da base genética está concentrada nos principais reprodutores. Valores acima de 40% indicam necessidade de diversificação."
      },
      {
        question: "Posso exportar a lista de Top Parents?",
        answer: "Sim. Use 'Exportar Top Parents' para baixar a tabela com participação e PTA médio."
      },
      {
        question: "Como isso impacta o Botijão Virtual?",
        answer: "Use os insights para substituir touros com excesso de participação por novos candidatos."
      }
    ],
    resources: [
      {
        title: "Guia: Auditoria Step 2",
        description: "Identificação de reprodutores dominantes",
        type: "Guia"
      },
      {
        title: "Vídeo: Diversificando genética",
        description: "Estratégias para reduzir concentração de pedigree",
        type: "Vídeo"
      }
    ],
    hints: {
      filters: "Ajuste categoria, segmento e Top N para refinar a análise",
      dominance: "Observe a participação acumulada para evitar gargalos",
      actions: "Planeje entrada de novos touros quando a concentração for alta",
      export: "Baixe o relatório para reuniões com consultores"
    }
  },
  "auditoria-step3": {
    faq: [
      {
        question: "O que é a visão de quartis?",
        answer: "Divide os animais em 4 grupos (Q1 a Q4) com base em cada índice selecionado."
      },
      {
        question: "Quantos traços posso analisar?",
        answer: "Selecione até 6 características simultaneamente para visualizar a distribuição dos quartis."
      },
      {
        question: "Como interpretar as barras?",
        answer: "Cada barra mostra o percentual de animais em cada quartil. Q4 é o topo da distribuição; Q1 representa o grupo que precisa de melhoria."
      },
      {
        question: "Posso salvar um conjunto de traços favorito?",
        answer: "Sim. Após selecionar as características, clique em 'Salvar Configuração' para reutilizar."
      },
      {
        question: "Como usar essa análise na segmentação?",
        answer: "Identifique PTAs com distribuição desequilibrada e crie gates específicos na Segmentação para acelerar correções."
      }
    ],
    resources: [
      {
        title: "Guia: Quartis e interpretação",
        description: "Entenda cada quartil e defina ações por grupo",
        type: "Guia"
      },
      {
        title: "Vídeo: Usando quartis na prática",
        description: "Exemplo de tomada de decisão com Q1 a Q4",
        type: "Vídeo"
      }
    ],
    hints: {
      selectTraits: "Clique em 'Selecionar características' para escolher PTAs",
      clearTraits: "Use 'Limpar seleção' para recomeçar rapidamente",
      update: "Atualize cálculos após ajustar filtros ou dados",
      insight: "Compare quartis para priorizar ações de melhoria"
    }
  },
  "auditoria-step4": {
    faq: [
      {
        question: "Qual é o objetivo do Step 4?",
        answer: "Mostrar a média linear dos principais índices ao longo dos anos de nascimento, avaliando progresso por safra."
      },
      {
        question: "Como interpretar as linhas?",
        answer: "Cada linha representa um índice selecionado. Observe inclinação e pontos de inflexão para identificar ganhos ou perdas."
      },
      {
        question: "Posso focar em categorias específicas?",
        answer: "Use os filtros de categoria para comparar vacas em produção versus jovens."
      },
      {
        question: "É possível exportar os dados brutos?",
        answer: "Sim. Clique em 'Exportar CSV' para baixar os valores ano a ano."
      },
      {
        question: "Como usar isso no planejamento?",
        answer: "Verifique se o ganho está alinhado às metas e ajuste o Plano Genético caso haja estagnação."
      }
    ],
    resources: [
      {
        title: "Guia: Médias lineares",
        description: "Análise temporal dos índices genéticos",
        type: "Guia"
      },
      {
        title: "Vídeo: Evolução de safra",
        description: "Como interpretar a tendência por ano de nascimento",
        type: "Vídeo"
      }
    ],
    hints: {
      selectTraits: "Escolha quais índices acompanhar na curva",
      category: "Use filtros de categoria para análises segmentadas",
      trend: "Observe a inclinação para confirmar progresso genético",
      export: "Baixe os valores por ano para análise externa"
    }
  },
  "auditoria-step5": {
    faq: [
      {
        question: "O que o Step 5 compara?",
        answer: "Compara progressão genética entre períodos ou grupos (ex: rebanho vs. referência externa)."
      },
      {
        question: "Como usar o toggle de tendência?",
        answer: "Ative para visualizar linha de tendência e suavizar oscilações. Ideal para apresentar progresso em reuniões."
      },
      {
        question: "Posso destacar a média da fazenda?",
        answer: "Sim. Ative 'Mostrar média da fazenda' para comparar com benchmarks carregados."
      },
      {
        question: "Como definir períodos?",
        answer: "Selecione faixas de anos (ex: 2018-2020 vs. 2021-2023) para avaliar evolução."
      },
      {
        question: "Há exportação visual?",
        answer: "Use 'Exportar Gráfico' para baixar PNG ou PDF com a comparação visual."
      }
    ],
    resources: [
      {
        title: "Guia: Comparações avançadas",
        description: "Crie narrativas com dados de evolução",
        type: "Guia"
      },
      {
        title: "Vídeo: Apresentando progresso",
        description: "Transforme gráficos em argumentos convincentes",
        type: "Vídeo"
      }
    ],
    hints: {
      period: "Defina períodos ou grupos para comparar",
      farmMean: "Ative a média da fazenda para contextualizar",
      trend: "Mostre a linha de tendência para evidenciar progresso",
      export: "Baixe o gráfico pronto para apresentações"
    }
  },
  "auditoria-step6": {
    faq: [
      {
        question: "Qual a diferença do Step 6?",
        answer: "Compara progressão de índices entre múltiplos períodos ou categorias, mostrando ganho relativo."
      },
      {
        question: "Como interpretar barras positivas/negativas?",
        answer: "Barras positivas indicam ganho no período atual versus anterior. Negativas sinalizam regressão e exigem ação."
      },
      {
        question: "Posso focar em um índice específico?",
        answer: "Selecione o PTA desejado no menu suspenso para ver a comparação detalhada."
      },
      {
        question: "Existe modo de tabela?",
        answer: "Sim. Alterne para tabela para ver números absolutos e variações percentuais."
      },
      {
        question: "Como compartilhar insights?",
        answer: "Exporte CSV ou PDF com comentários automáticos e recomendações."
      }
    ],
    resources: [
      {
        title: "Guia: Step 6",
        description: "Comparando períodos e identificando ganhos",
        type: "Guia"
      },
      {
        title: "Vídeo: Diagnóstico rápido",
        description: "Descubra onde o progresso acelerou ou estagnou",
        type: "Vídeo"
      }
    ],
    hints: {
      trait: "Escolha o índice a ser comparado",
      view: "Alterne entre gráfico e tabela conforme necessidade",
      highlight: "Destaque barras positivas para celebrar ganhos",
      share: "Use exportações para comunicar resultados"
    }
  },
  "auditoria-step7": {
    faq: [
      {
        question: "O que mostra a distribuição de PTAs?",
        answer: "Histogramas que indicam como os animais se concentram ao longo da escala de cada índice."
      },
      {
        question: "Como identificar outliers?",
        answer: "Procure barras isoladas nas extremidades. Esses animais merecem avaliação especial (potenciais doadoras ou descarte)."
      },
      {
        question: "Posso segmentar por categoria?",
        answer: "Sim. Use filtros para visualizar a distribuição apenas de novilhas, vacas, etc."
      },
      {
        question: "Existe exportação por subgrupos?",
        answer: "Use 'Exportar CSV' para baixar os dados filtrados e trabalhar offline."
      },
      {
        question: "Como aplicar no planejamento?",
        answer: "Identifique gargalos (ex: SCS alto) e crie ações específicas no Plano e Segmentação."
      }
    ],
    resources: [
      {
        title: "Guia: Distribuições",
        description: "Leitura de histogramas e definição de ações",
        type: "Guia"
      },
      {
        title: "Vídeo: Encontrando outliers",
        description: "Como usar Step 7 para selecionar doadoras e descartar riscos",
        type: "Vídeo"
      }
    ],
    hints: {
      filters: "Selecione categoria ou período para focar na análise",
      bins: "Ajuste a largura das barras para mais detalhes",
      highlight: "Clique na barra para ver lista de animais naquele intervalo",
      export: "Baixe a distribuição filtrada em CSV"
    }
  },
  "auditoria-step8": {
    faq: [
      {
        question: "Como funciona o benchmark?",
        answer: "Compara médias do rebanho com benchmarks nacionais, regionais ou personalizados."
      },
      {
        question: "Posso escolher o percentual de elite?",
        answer: "Sim. Defina o Top % (ex: Top 10%) para comparar apenas os melhores animais com o benchmark externo."
      },
      {
        question: "Como interpretar o gap?",
        answer: "Mostramos diferença absoluta e percentual entre sua média e o benchmark. Valores negativos indicam oportunidade de melhoria."
      },
      {
        question: "Benchmark é atualizado automaticamente?",
        answer: "Benchmarks oficiais são atualizados a cada avaliação CDCB. Você pode carregar benchmarks customizados via upload."
      },
      {
        question: "Como compartilhar resultados?",
        answer: "Gere um relatório PDF com destaques automáticos para apresentar a clientes ou gestores."
      }
    ],
    resources: [
      {
        title: "Guia: Benchmarking",
        description: "Compare-se com referências de mercado",
        type: "Guia"
      },
      {
        title: "Vídeo: Preparando apresentações",
        description: "Monte relatórios de benchmark em minutos",
        type: "Vídeo"
      }
    ],
    hints: {
      benchmark: "Selecione o benchmark (nacional, regional ou customizado)",
      topPercent: "Defina o percentual de elite para a comparação",
      gap: "Analise o gap para priorizar ações",
      export: "Baixe relatório com recomendações automáticas"
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
  },

  // Conversão de Arquivos
  conversao: {
    faq: [
      {
        question: "Para que serve a conversão de arquivos?",
        answer: "Padronize planilhas com nomenclaturas diferentes (de centrais, laboratórios, consultorias) para o formato padrão da ToolSS. O sistema detecta automaticamente mapeamentos e sugere correções."
      },
      {
        question: "Como funciona o processo de conversão?",
        answer: "1) Faça upload do modelo padrão (chaves canônicas), 2) Opcionalmente adicione banco de nomenclaturas personalizadas, 3) Envie o arquivo de dados. O sistema sugere mapeamentos automaticamente."
      },
      {
        question: "O que é o banco de nomenclaturas?",
        answer: "É um arquivo que mapeia aliases personalizados para chaves canônicas. Exemplo: 'Merito_Liquido' → 'NM$'. Aliases do usuário têm prioridade sobre o banco padrão (seed)."
      },
      {
        question: "Como funcionam as sugestões automáticas?",
        answer: "O sistema usa 3 métodos em ordem de prioridade: 1) Banco de nomenclaturas (legend), 2) Regex (padrões conhecidos), 3) Fuzzy matching (similaridade). Cada sugestão tem um score de confiança."
      },
      {
        question: "Preciso aprovar todas as sugestões?",
        answer: "Sim. Revise e aprove cada mapeamento antes de exportar. Use 'Aprovar sugestões seguras' para aprovar automaticamente apenas mapeamentos com alta confiança (≥88% ou via legend)."
      },
      {
        question: "O que acontece com colunas não mapeadas?",
        answer: "Colunas não mapeadas do arquivo original são mantidas no arquivo final. Nada é perdido - apenas as colunas reconhecidas são padronizadas."
      }
    ],
    resources: [
      {
        title: "Guia: Conversão de Planilhas",
        description: "Passo a passo completo do processo de padronização",
        type: "Guia"
      },
      {
        title: "Vídeo: Banco de Nomenclaturas",
        description: "Como criar e usar aliases personalizados",
        type: "Vídeo"
      },
      {
        title: "Métodos de Detecção",
        description: "Entenda legend, regex e fuzzy matching",
        type: "Guia"
      }
    ],
    hints: {
      modelFile: "Arquivo com as chaves canônicas (cabeçalhos corretos) da ToolSS",
      legendFile: "Arquivo opcional com mapeamentos personalizados de aliases",
      dataFile: "Arquivo CSV ou Excel com dados a serem padronizados",
      priority: "Prioridade: banco usuário > seed padrão > regex > fuzzy",
      confidence: "Scores ≥88% ou método 'legend' são considerados seguros",
      approval: "Aprove sugestões seguras em lote ou revise individualmente",
      manual: "Ajuste manualmente mapeamentos com baixa confiança",
      export: "Arquivo final preserva todas as colunas originais + padronizadas",
      validation: "Sistema valida que não haja conflitos nos mapeamentos"
    }
  }
};

// Helper para obter conteúdo contextual
export function getHelpContent(page: string): HelpContent {
  return helpContentMap[page] || helpContentMap.dashboard;
}
