// excelMapping.ts
// Mapeamento completo das células do Excel da Calculadora Genética
// A propriedade "formula" é DOCUMENTAL (texto da planilha original)

export type ExcelCellInfo = {
  sheet: string;
  cell: string;
  formula: string | null;
  description?: string;
};

export const excelCellMap: Record<string, ExcelCellInfo> = {
  // ==========================================
  // CALCULATE STRATEGY
  // ==========================================
  "CALCULATE_STRATEGY_L9": {
    sheet: "CALCULATE STRATEGY",
    cell: "L9",
    formula: `Calculated Strategy!L9 -->
    Calculated Strategy!M7 -->
        Calculated Strategy!M6+(Calculated Strategy!M6*Calculated Strategy!M4) -->
            Calculated Strategy!M6 -->
                (Calculated Strategy!M5*Calculated Strategy!M2)+(Calculated Strategy!M5*Calculated Strategy!M4) -->
                    Calculated Strategy!M5 = INPUT PAGE!$D$10*(INPUT PAGE!$D$6/12)
                    Calculated Strategy!M2 = INPUT PAGE!D5
                    Calculated Strategy!M4 = Calculated Strategy!J12
            Calculated Strategy!M4 --> Calculated Strategy!J12`,
    description: "Valor genético projetado principal"
  },
  "CALCULATE_STRATEGY_Q8": {
    sheet: "CALCULATE STRATEGY",
    cell: "Q8",
    formula: null,
    description: "Parâmetro de estratégia Q8"
  },
  "CALCULATE_STRATEGY_J12": {
    sheet: "CALCULATE STRATEGY",
    cell: "J12",
    formula: null,
    description: "Impacto genético médio (variável intermediária)"
  },
  "CALCULATE_STRATEGY_M2": {
    sheet: "CALCULATE STRATEGY",
    cell: "M2",
    formula: "INPUT PAGE!D5",
    description: "Valor genético da mãe"
  },
  "CALCULATE_STRATEGY_M4": {
    sheet: "CALCULATE STRATEGY",
    cell: "M4",
    formula: "Calculated Strategy!J12",
    description: "Impacto genético"
  },
  "CALCULATE_STRATEGY_M5": {
    sheet: "CALCULATE STRATEGY",
    cell: "M5",
    formula: "INPUT PAGE!$D$10*(INPUT PAGE!$D$6/12)",
    description: "Total vacas ajustado pelo intervalo entre partos"
  },
  "CALCULATE_STRATEGY_M6": {
    sheet: "CALCULATE STRATEGY",
    cell: "M6",
    formula: "(Calculated Strategy!M5*Calculated Strategy!M2)+(Calculated Strategy!M5*Calculated Strategy!M4)",
    description: "Cálculo intermediário valor genético"
  },
  "CALCULATE_STRATEGY_M7": {
    sheet: "CALCULATE STRATEGY",
    cell: "M7",
    formula: "Calculated Strategy!M6+(Calculated Strategy!M6*Calculated Strategy!M4)",
    description: "Valor genético ajustado"
  },
  "CALCULATE_STRATEGY_AM24": {
    sheet: "CALCULATE STRATEGY",
    cell: "AM24",
    formula: null,
    description: "Parâmetro de prenhez AM24 (variável intermediária)"
  },
  "CALCULATE_STRATEGY_AM28": {
    sheet: "CALCULATE STRATEGY",
    cell: "AM28",
    formula: null,
    description: "Parâmetro de prenhez AM28 (variável intermediária)"
  },
  "CALCULATE_STRATEGY_AM31": {
    sheet: "CALCULATE STRATEGY",
    cell: "AM31",
    formula: null,
    description: "Parâmetro de prenhez AM31 (variável intermediária)"
  },

  // ==========================================
  // WWS REPORT - Projeções de Inseminação/Prenhez
  // ==========================================
  "WWS_REPORT_D23": {
    sheet: "WWS REPORT",
    cell: "D23",
    formula: "WWS Report'!D30/'Calculated Strategy'!$AM$24",
    description: "Vacas - inseminações trimestre"
  },
  "WWS_REPORT_D24": {
    sheet: "WWS REPORT",
    cell: "D24",
    formula: "WWS Report'!D31/'Calculated Strategy'!$AM$31",
    description: "Novilhas - inseminações trimestre"
  },
  "WWS_REPORT_D30": {
    sheet: "WWS REPORT",
    cell: "D30",
    formula: "('Calculated Strategy'!$AM$28/'INPUT PAGE'!$D$6)*12",
    description: "Vacas - base de cálculo anual"
  },
  "WWS_REPORT_D31": {
    sheet: "WWS REPORT",
    cell: "D31",
    formula: "Calculated Strategy'!$AM$24/'INPUT PAGE'!$D$7",
    description: "Novilhas - base de cálculo anual"
  },

  // WWS REPORT - Colunas E (trimestral/4)
  "WWS_REPORT_E23": {
    sheet: "WWS REPORT",
    cell: "E23",
    formula: "WWS Report'!D23/4",
    description: "Vacas - inseminações mensal (trimestre/4)"
  },
  "WWS_REPORT_E24": {
    sheet: "WWS REPORT",
    cell: "E24",
    formula: "WWS Report'!D24/4",
    description: "Novilhas - inseminações mensal"
  },
  "WWS_REPORT_E30": {
    sheet: "WWS REPORT",
    cell: "E30",
    formula: "WWS Report'!D30/4",
    description: "Vacas - prenhez mensal"
  },
  "WWS_REPORT_E31": {
    sheet: "WWS REPORT",
    cell: "E31",
    formula: "WWS Report'!D31/4",
    description: "Novilhas - prenhez mensal"
  },

  // WWS REPORT - Colunas F (anual/12)
  "WWS_REPORT_F23": {
    sheet: "WWS REPORT",
    cell: "F23",
    formula: "WWS Report'!D23/12",
    description: "Vacas - inseminações semanal aproximado"
  },
  "WWS_REPORT_F24": {
    sheet: "WWS REPORT",
    cell: "F24",
    formula: "WWS Report'!D24/12",
    description: "Novilhas - inseminações semanal"
  },
  "WWS_REPORT_F30": {
    sheet: "WWS REPORT",
    cell: "F30",
    formula: "WWS Report'!D30/12",
    description: "Vacas - prenhez semanal"
  },
  "WWS_REPORT_F31": {
    sheet: "WWS REPORT",
    cell: "F31",
    formula: "WWS Report'!D31/12",
    description: "Novilhas - prenhez semanal"
  },

  // WWS REPORT - Colunas G (valores atuais - INPUT)
  "WWS_REPORT_G23": {
    sheet: "WWS REPORT",
    cell: "G23",
    formula: "INPUT PAGE'!$D$17",
    description: "Vacas - concepção convencional atual"
  },
  "WWS_REPORT_G24": {
    sheet: "WWS REPORT",
    cell: "G24",
    formula: "INPUT PAGE'!$D$18",
    description: "Vacas - concepção corte atual"
  },
  "WWS_REPORT_G30": {
    sheet: "WWS REPORT",
    cell: "G30",
    formula: "INPUT PAGE'!$D$19",
    description: "Novilhas - concepção sexado atual"
  },
  "WWS_REPORT_G31": {
    sheet: "WWS REPORT",
    cell: "G31",
    formula: "INPUT PAGE'!$D$20",
    description: "Novilhas - concepção convencional atual"
  },

  // WWS REPORT - Colunas H (diferenças)
  "WWS_REPORT_H23": {
    sheet: "WWS REPORT",
    cell: "H23",
    formula: "WWS Report'!G23-WWS Report'!F23",
    description: "Vacas - diferença inseminação"
  },
  "WWS_REPORT_H24": {
    sheet: "WWS REPORT",
    cell: "H24",
    formula: "WWS Report'!G24-WWS Report'!F24",
    description: "Novilhas - diferença inseminação"
  },
  "WWS_REPORT_H31": {
    sheet: "WWS REPORT",
    cell: "H31",
    formula: "WWS Report'!G31-WWS Report'!F31",
    description: "Diferença prenhez novilhas"
  },
  "WWS_REPORT_I31": {
    sheet: "WWS REPORT",
    cell: "I31",
    formula: "WWS Report'!G31-WWS Report'!F31",
    description: "Diferença prenhez novilhas (duplicado)"
  },

  // ==========================================
  // INPUT PAGE - Campos de entrada
  // ==========================================
  "INPUT_PAGE_D5": {
    sheet: "INPUT PAGE",
    cell: "D5",
    formula: null,
    description: "Valor genético da mãe"
  },
  "INPUT_PAGE_D6": {
    sheet: "INPUT PAGE",
    cell: "D6",
    formula: null,
    description: "Intervalo entre partos (meses)"
  },
  "INPUT_PAGE_D7": {
    sheet: "INPUT PAGE",
    cell: "D7",
    formula: null,
    description: "Taxa de descarte (%)"
  },
  "INPUT_PAGE_D10": {
    sheet: "INPUT PAGE",
    cell: "D10",
    formula: null,
    description: "Total de vacas (secas e lactantes)"
  },
  "INPUT_PAGE_D17": {
    sheet: "INPUT PAGE",
    cell: "D17",
    formula: null,
    description: "Taxa concepção convencional vacas"
  },
  "INPUT_PAGE_D18": {
    sheet: "INPUT PAGE",
    cell: "D18",
    formula: null,
    description: "Taxa concepção corte vacas"
  },
  "INPUT_PAGE_D19": {
    sheet: "INPUT PAGE",
    cell: "D19",
    formula: null,
    description: "Taxa concepção sexado novilhas"
  },
  "INPUT_PAGE_D20": {
    sheet: "INPUT PAGE",
    cell: "D20",
    formula: null,
    description: "Taxa concepção convencional novilhas"
  },

  // ==========================================
  // SELECT REPORT
  // ==========================================
  "SELECT_REPORT_C7": {
    sheet: "SELECT REPORT",
    cell: "C7",
    formula: null,
    description: "Seleção relatório C7"
  },
  "SELECT_REPORT_D7": {
    sheet: "SELECT REPORT",
    cell: "D7",
    formula: null,
    description: "Seleção relatório D7"
  },
  "SELECT_REPORT_E7": {
    sheet: "SELECT REPORT",
    cell: "E7",
    formula: null,
    description: "Seleção relatório E7"
  },
  "SELECT_REPORT_F7": {
    sheet: "SELECT REPORT",
    cell: "F7",
    formula: null,
    description: "Seleção relatório F7"
  },
  "SELECT_REPORT_C25": {
    sheet: "SELECT REPORT",
    cell: "C25",
    formula: null,
    description: "Seleção relatório C25"
  },
  "SELECT_REPORT_D25": {
    sheet: "SELECT REPORT",
    cell: "D25",
    formula: null,
    description: "Seleção relatório D25"
  },
  "SELECT_REPORT_E25": {
    sheet: "SELECT REPORT",
    cell: "E25",
    formula: null,
    description: "Seleção relatório E25"
  },
  "SELECT_REPORT_F25": {
    sheet: "SELECT REPORT",
    cell: "F25",
    formula: null,
    description: "Seleção relatório F25"
  },
  "SELECT_REPORT_G25": {
    sheet: "SELECT REPORT",
    cell: "G25",
    formula: null,
    description: "Seleção relatório G25"
  },

  // ==========================================
  // PRODUCT BREAKDOWN BY STRATEGY - Totais de doses
  // ==========================================
  "PRODUCT_BREAKDOWN_C21": {
    sheet: "PRODUCT BREAKDOWN BY STRATEGY",
    cell: "C21",
    formula: `SE(E9="Sexed Semen";F9;0)+SE(G9="Sexed Semen";H9;0)+SE(I9="Sexed Semen";J9;0)+
SE(E10="Sexed Semen";F10;0)+SE(G10="Sexed Semen";H10;0)+SE(I10="Sexed Semen";J10;0)+
SE(E11="Sexed Semen";F11;0)+SE(G11="Sexed Semen";H11;0)+SE(I11="Sexed Semen";J11;0)+
SE(E15="Sexed Semen";F15;0)+SE(G15="Sexed Semen";H15;0)+SE(I15="Sexed Semen";J15;0)+
SE(E16="Sexed Semen";F16;0)+SE(G16="Sexed Semen";H16;0)+SE(I16="Sexed Semen";J16;0)+
SE(E17="Sexed Semen";F17;0)+SE(G17="NxGen Sexed";H17;0)+SE(I17="NxGen Sexed";J17;0)`,
    description: "Total doses sexado anual"
  },
  "PRODUCT_BREAKDOWN_C22": {
    sheet: "PRODUCT BREAKDOWN BY STRATEGY",
    cell: "C22",
    formula: `SE(E9="Conventional";F9;0)+SE(G9="Conventional";H9;0)+SE(I9="Conventional";J9;0)+
SE(E10="Conventional";F10;0)+SE(G10="Conventional";H10;0)+SE(I10="Conventional";J10;0)+
SE(E11="Conventional";F11;0)+SE(G11="Conventional";H11;0)+SE(I11="Conventional";J11;0)+
SE(E15="Conventional";F15;0)+SE(G15="Conventional";H15;0)+SE(I15="Conventional";J15;0)+
SE(E16="Conventional";F16;0)+SE(G16="Conventional";H16;0)+SE(I16="Conventional";J16;0)+
SE(E17="Conventional";F17;0)+SE(G17="NxGen Conventional";H17;0)+SE(I17="NxGen Conventional";J17;0)`,
    description: "Total doses convencional anual"
  },
  "PRODUCT_BREAKDOWN_C23": {
    sheet: "PRODUCT BREAKDOWN BY STRATEGY",
    cell: "C23",
    formula: `SE(E9="Beef Semen";F9;0)+SE(G9="Beef Semen";H9;0)+SE(I9="Beef Semen";J9;0)+
SE(E10="Beef Semen";F10;0)+SE(G10="Beef Semen";H10;0)+SE(I10="Beef Semen";J10;0)+
SE(E11="Beef Semen";F11;0)+SE(G11="Beef Semen";H11;0)+SE(I11="Beef Semen";J11;0)+
SE(E15="Beef Semen";F15;0)+SE(G15="Beef Semen";H15;0)+SE(I15="Beef Semen";J15;0)+
SE(E16="Beef Semen";F16;0)+SE(G16="Beef Semen";H16;0)+SE(I16="Beef Semen";J16;0)+
SE(E17="Beef Semen";F17;0)+SE(G17="Beef Semen";H17;0)+SE(I17="Beef Semen";J17;0)`,
    description: "Total doses corte anual"
  },

  // PRODUCT BREAKDOWN - Derivados mensais
  "PRODUCT_BREAKDOWN_D21": {
    sheet: "PRODUCT BREAKDOWN BY STRATEGY",
    cell: "D21",
    formula: "'Product Breakdown by Strategy'!C21/12",
    description: "Total doses sexado mensal"
  },
  "PRODUCT_BREAKDOWN_D22": {
    sheet: "PRODUCT BREAKDOWN BY STRATEGY",
    cell: "D22",
    formula: "'Product Breakdown by Strategy'!C22/12",
    description: "Total doses convencional mensal"
  },
  "PRODUCT_BREAKDOWN_D23": {
    sheet: "PRODUCT BREAKDOWN BY STRATEGY",
    cell: "D23",
    formula: "'Product Breakdown by Strategy'!C23/12",
    description: "Total doses corte mensal"
  },

  // PRODUCT BREAKDOWN - Derivados semanais
  "PRODUCT_BREAKDOWN_E21": {
    sheet: "PRODUCT BREAKDOWN BY STRATEGY",
    cell: "E21",
    formula: "'Product Breakdown by Strategy'!C21/52",
    description: "Total doses sexado semanal"
  },
  "PRODUCT_BREAKDOWN_E22": {
    sheet: "PRODUCT BREAKDOWN BY STRATEGY",
    cell: "E22",
    formula: "'Product Breakdown by Strategy'!C22/52",
    description: "Total doses convencional semanal"
  },
  "PRODUCT_BREAKDOWN_E23": {
    sheet: "PRODUCT BREAKDOWN BY STRATEGY",
    cell: "E23",
    formula: "'Product Breakdown by Strategy'!C23/52",
    description: "Total doses corte semanal"
  },

  // PRODUCT BREAKDOWN - Células de configuração de estratégia
  // Linhas 9-11: Novilhas (Top, Mid, Bottom)
  // Linhas 15-17: Vacas (Top, Mid, Bottom)
  // Colunas: E=Tipo1º, F=Qty1º, G=Tipo2º, H=Qty2º, I=Tipo3º, J=Qty3º

  "PRODUCT_BREAKDOWN_E9": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "E9", formula: null, description: "Novilhas Top - Tipo 1º serviço" },
  "PRODUCT_BREAKDOWN_F9": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "F9", formula: null, description: "Novilhas Top - Qty 1º serviço" },
  "PRODUCT_BREAKDOWN_G9": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "G9", formula: null, description: "Novilhas Top - Tipo 2º serviço" },
  "PRODUCT_BREAKDOWN_H9": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "H9", formula: null, description: "Novilhas Top - Qty 2º serviço" },
  "PRODUCT_BREAKDOWN_I9": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "I9", formula: null, description: "Novilhas Top - Tipo 3º serviço" },
  "PRODUCT_BREAKDOWN_J9": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "J9", formula: null, description: "Novilhas Top - Qty 3º serviço" },

  "PRODUCT_BREAKDOWN_E10": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "E10", formula: null, description: "Novilhas Mid - Tipo 1º serviço" },
  "PRODUCT_BREAKDOWN_F10": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "F10", formula: null, description: "Novilhas Mid - Qty 1º serviço" },
  "PRODUCT_BREAKDOWN_G10": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "G10", formula: null, description: "Novilhas Mid - Tipo 2º serviço" },
  "PRODUCT_BREAKDOWN_H10": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "H10", formula: null, description: "Novilhas Mid - Qty 2º serviço" },
  "PRODUCT_BREAKDOWN_I10": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "I10", formula: null, description: "Novilhas Mid - Tipo 3º serviço" },
  "PRODUCT_BREAKDOWN_J10": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "J10", formula: null, description: "Novilhas Mid - Qty 3º serviço" },

  "PRODUCT_BREAKDOWN_E11": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "E11", formula: null, description: "Novilhas Bottom - Tipo 1º serviço" },
  "PRODUCT_BREAKDOWN_F11": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "F11", formula: null, description: "Novilhas Bottom - Qty 1º serviço" },
  "PRODUCT_BREAKDOWN_G11": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "G11", formula: null, description: "Novilhas Bottom - Tipo 2º serviço" },
  "PRODUCT_BREAKDOWN_H11": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "H11", formula: null, description: "Novilhas Bottom - Qty 2º serviço" },
  "PRODUCT_BREAKDOWN_I11": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "I11", formula: null, description: "Novilhas Bottom - Tipo 3º serviço" },
  "PRODUCT_BREAKDOWN_J11": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "J11", formula: null, description: "Novilhas Bottom - Qty 3º serviço" },

  "PRODUCT_BREAKDOWN_E15": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "E15", formula: null, description: "Vacas Top - Tipo 1º serviço" },
  "PRODUCT_BREAKDOWN_F15": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "F15", formula: null, description: "Vacas Top - Qty 1º serviço" },
  "PRODUCT_BREAKDOWN_G15": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "G15", formula: null, description: "Vacas Top - Tipo 2º serviço" },
  "PRODUCT_BREAKDOWN_H15": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "H15", formula: null, description: "Vacas Top - Qty 2º serviço" },
  "PRODUCT_BREAKDOWN_I15": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "I15", formula: null, description: "Vacas Top - Tipo 3º serviço" },
  "PRODUCT_BREAKDOWN_J15": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "J15", formula: null, description: "Vacas Top - Qty 3º serviço" },

  "PRODUCT_BREAKDOWN_E16": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "E16", formula: null, description: "Vacas Mid - Tipo 1º serviço" },
  "PRODUCT_BREAKDOWN_F16": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "F16", formula: null, description: "Vacas Mid - Qty 1º serviço" },
  "PRODUCT_BREAKDOWN_G16": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "G16", formula: null, description: "Vacas Mid - Tipo 2º serviço" },
  "PRODUCT_BREAKDOWN_H16": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "H16", formula: null, description: "Vacas Mid - Qty 2º serviço" },
  "PRODUCT_BREAKDOWN_I16": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "I16", formula: null, description: "Vacas Mid - Tipo 3º serviço" },
  "PRODUCT_BREAKDOWN_J16": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "J16", formula: null, description: "Vacas Mid - Qty 3º serviço" },

  "PRODUCT_BREAKDOWN_E17": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "E17", formula: null, description: "Vacas Bottom - Tipo 1º serviço" },
  "PRODUCT_BREAKDOWN_F17": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "F17", formula: null, description: "Vacas Bottom - Qty 1º serviço" },
  "PRODUCT_BREAKDOWN_G17": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "G17", formula: null, description: "Vacas Bottom - Tipo 2º serviço" },
  "PRODUCT_BREAKDOWN_H17": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "H17", formula: null, description: "Vacas Bottom - Qty 2º serviço" },
  "PRODUCT_BREAKDOWN_I17": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "I17", formula: null, description: "Vacas Bottom - Tipo 3º serviço" },
  "PRODUCT_BREAKDOWN_J17": { sheet: "PRODUCT BREAKDOWN BY STRATEGY", cell: "J17", formula: null, description: "Vacas Bottom - Qty 3º serviço" },

  // ==========================================
  // OUTPUT - Resultados finais
  // ==========================================
  "OUTPUT_P16": {
    sheet: "OUTPUT",
    cell: "P16",
    formula: null,
    description: "Output P16"
  },
  "OUTPUT_P17": {
    sheet: "OUTPUT",
    cell: "P17",
    formula: null,
    description: "Output P17"
  },
  "OUTPUT_P22": {
    sheet: "OUTPUT",
    cell: "P22",
    formula: null,
    description: "Output P22"
  },
  "OUTPUT_Q16": {
    sheet: "OUTPUT",
    cell: "Q16",
    formula: null,
    description: "Output Q16"
  },
  "OUTPUT_Q17": {
    sheet: "OUTPUT",
    cell: "Q17",
    formula: null,
    description: "Output Q17"
  },
  "OUTPUT_Q19": {
    sheet: "OUTPUT",
    cell: "Q19",
    formula: null,
    description: "Output Q19"
  },
  "OUTPUT_Q22": {
    sheet: "OUTPUT",
    cell: "Q22",
    formula: null,
    description: "Output Q22"
  },
} as const;

export type ExcelCellKey = keyof typeof excelCellMap;

// Helpers para acessar células por planilha
export function getCellsBySheet(sheetName: string): ExcelCellInfo[] {
  return Object.values(excelCellMap).filter(cell => cell.sheet === sheetName);
}

export function getCellInfo(key: ExcelCellKey): ExcelCellInfo {
  return excelCellMap[key];
}
