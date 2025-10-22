import { WorkSheet, CellObject } from 'xlsx';

/**
 * Converte uma string de data ISO para um número de data do Excel
 * @param dateString - Data em formato ISO (yyyy-mm-dd) ou brasileiro (dd/mm/yyyy)
 * @returns Número de data do Excel ou null se inválido
 */
export const dateStringToExcelDate = (dateString: string | null | undefined): number | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    // Excel conta dias desde 1900-01-01, mas tem bug do ano bissexto
    // JavaScript: milissegundos desde 1970-01-01
    const excelEpoch = new Date(1899, 11, 30); // 30 de dezembro de 1899
    const daysSinceEpoch = (date.getTime() - excelEpoch.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceEpoch;
  } catch {
    return null;
  }
};

/**
 * Aplica formatação de data brasileira em células específicas de uma worksheet
 * @param worksheet - Planilha XLSX
 * @param dateColumnIndices - Índices das colunas que contêm datas
 * @param startRow - Linha inicial (padrão: 1, após cabeçalho)
 */
export const formatDateColumns = (
  worksheet: WorkSheet,
  dateColumnIndices: number[],
  startRow: number = 1
): void => {
  const range = worksheet['!ref'];
  if (!range) return;
  
  const decode = (ref: string) => {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    const col = match[1].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
    const row = parseInt(match[2]) - 1;
    return { c: col, r: row };
  };
  
  const encode = (col: number, row: number) => {
    let colStr = '';
    let c = col;
    while (c >= 0) {
      colStr = String.fromCharCode(65 + (c % 26)) + colStr;
      c = Math.floor(c / 26) - 1;
    }
    return `${colStr}${row + 1}`;
  };
  
  const rangeEnd = decode(range.split(':')[1]);
  if (!rangeEnd) return;
  
  // Percorre todas as linhas de dados
  for (let rowIdx = startRow; rowIdx <= rangeEnd.r; rowIdx++) {
    dateColumnIndices.forEach(colIdx => {
      const cellAddress = encode(colIdx, rowIdx);
      const cell: CellObject = worksheet[cellAddress];
      
      if (cell && cell.v) {
        // Se o valor é uma string de data
        if (typeof cell.v === 'string') {
          const excelDate = dateStringToExcelDate(cell.v);
          if (excelDate !== null) {
            cell.v = excelDate;
            cell.t = 'n'; // Tipo número
            cell.z = 'dd/mm/yyyy'; // Formato brasileiro
          }
        }
        // Se já é um Date object
        else if (cell.v instanceof Date) {
          const excelDate = dateStringToExcelDate(cell.v.toISOString());
          if (excelDate !== null) {
            cell.v = excelDate;
            cell.t = 'n';
            cell.z = 'dd/mm/yyyy';
          }
        }
      }
    });
  }
};

/**
 * Formata automaticamente colunas de data baseado nos headers
 * @param worksheet - Planilha XLSX
 * @param headers - Array de headers
 * @param dateHeaderPatterns - Padrões de texto que identificam colunas de data
 */
export const autoFormatDateColumns = (
  worksheet: WorkSheet,
  headers: string[],
  dateHeaderPatterns: string[] = ['data', 'nascimento', 'criado', 'atualizado', 'date', 'birth']
): void => {
  const dateColumnIndices = headers
    .map((header, index) => {
      const lowerHeader = header.toLowerCase();
      return dateHeaderPatterns.some(pattern => lowerHeader.includes(pattern)) ? index : -1;
    })
    .filter(index => index !== -1);
  
  if (dateColumnIndices.length > 0) {
    formatDateColumns(worksheet, dateColumnIndices);
  }
};
