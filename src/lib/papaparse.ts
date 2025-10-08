export type PapaParseError = {
  type: string;
  code: string;
  message: string;
  row: number;
};

export type PapaParseMeta = {
  delimiter: string;
  fields: string[];
};

export type PapaParseResult<T> = {
  data: T[];
  meta: PapaParseMeta;
  errors: PapaParseError[];
};

export type PapaParseOptions<T> = {
  header?: boolean;
  skipEmptyLines?: boolean | "greedy";
  worker?: boolean;
  complete?: (results: PapaParseResult<T>) => void;
  error?: (error: Error) => void;
};

type RowObject = Record<string, unknown>;

const SPLIT_CANDIDATES = [";", ",", "\t", "|"];

const isEmptyValue = (value: string | undefined) => !value || value.trim() === "";

const splitCsvLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());

  return values.map((value) => value.replace(/^["']|["']$/g, ""));
};

const detectDelimiter = (line: string): string => {
  let bestDelimiter = ";";
  let bestScore = 1;

  for (const candidate of SPLIT_CANDIDATES) {
    const parsed = splitCsvLine(line, candidate);
    if (parsed.length > bestScore) {
      bestScore = parsed.length;
      bestDelimiter = candidate;
    }
  }

  return bestDelimiter;
};

function toRows(header: string[], lines: string[], delimiter: string, skipEmptyLines: boolean | "greedy" | undefined) {
  const rows: RowObject[] = [];
  const errors: PapaParseError[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (trimmed === "" && skipEmptyLines) {
      return;
    }

    const values = splitCsvLine(line, delimiter);

    if (skipEmptyLines === "greedy" && values.every((value) => isEmptyValue(value))) {
      return;
    }

    const record: RowObject = {};

    header.forEach((field, fieldIndex) => {
      record[field] = values[fieldIndex] ?? "";
    });

    if (values.length > header.length) {
      errors.push({
        type: "FieldMismatch",
        code: "TooManyFields",
        message: `Linha ${lineIndex + 2} possui mais colunas do que o cabeçalho`,
        row: lineIndex + 2,
      });
    }

    rows.push(record);
  });

  return { rows, errors };
}

const Papa = {
  parse<T extends RowObject>(file: File, options: PapaParseOptions<T> = {}) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = reader.result;
        const text = typeof result === "string" ? result : new TextDecoder().decode(result as ArrayBuffer);
        const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const lines = normalized.split("\n");

        if (!options.header) {
          throw new Error("Esta implementação simplificada requer header: true");
        }

        const filteredLines = lines.filter((line, index) => {
          if (index === 0) return true;
          if (options.skipEmptyLines) {
            return line.trim() !== "";
          }
          return true;
        });

        if (filteredLines.length === 0) {
          options.complete?.({ data: [], meta: { delimiter: ";", fields: [] }, errors: [] });
          return;
        }

        const headerLine = filteredLines[0].replace(/^\uFEFF/, "");
        const delimiter = detectDelimiter(headerLine);
        const header = splitCsvLine(headerLine, delimiter);

        const { rows, errors } = toRows(header, filteredLines.slice(1), delimiter, options.skipEmptyLines);

        options.complete?.({
          data: rows as T[],
          meta: { delimiter, fields: header },
          errors,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Falha ao processar CSV");
        if (options.error) {
          options.error(err);
        } else {
          throw err;
        }
      }
    };

    reader.onerror = () => {
      const err = reader.error ?? new Error("Erro ao ler arquivo");
      if (options.error) {
        options.error(err instanceof Error ? err : new Error(String(err)));
      }
    };

    reader.readAsText(file, "utf-8");
  },
};

export default Papa;
