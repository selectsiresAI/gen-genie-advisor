export type FuseResult<T> = {
  item: T;
  refIndex: number;
  score?: number;
};

export interface IFuseOptions<T> {
  includeScore?: boolean;
  shouldSort?: boolean;
  threshold?: number;
  keys?: (keyof T | string)[];
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function normalizeScore(distance: number, textLength: number): number {
  if (textLength === 0) return 1;
  return distance / textLength;
}

function getValue<T>(item: T, keys?: (keyof T | string)[]): string {
  if (!keys || keys.length === 0) {
    return String(item ?? "");
  }
  for (const key of keys) {
    const value = (item as any)[key as keyof T];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }
  return "";
}

export default class Fuse<T> {
  private list: T[];
  private options: IFuseOptions<T>;

  constructor(list: T[], options: IFuseOptions<T> = {}) {
    this.list = list;
    this.options = options;
  }

  search(pattern: string, opts: { limit?: number } = {}): FuseResult<T>[] {
    const query = pattern.toLowerCase();
    const threshold = this.options.threshold ?? 0.6;
    const includeScore = this.options.includeScore ?? false;
    const shouldSort = this.options.shouldSort ?? true;
    const limit = opts.limit ?? this.list.length;

    const results: FuseResult<T>[] = [];

    if (!query) {
      return this.list.slice(0, limit).map((item, index) => ({
        item,
        refIndex: index,
        score: includeScore ? 0 : undefined,
      }));
    }

    this.list.forEach((item, index) => {
      const text = getValue(item, this.options.keys)?.toLowerCase?.() ?? "";
      if (!text) return;
      const distance = levenshtein(query, text);
      const score = normalizeScore(distance, Math.max(text.length, query.length));
      if (score <= threshold) {
        results.push({
          item,
          refIndex: index,
          score: includeScore ? score : undefined,
        });
      }
    });

    if (shouldSort) {
      results.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    }

    return results.slice(0, limit);
  }
}

export namespace Fuse {
  export type IFuseOptions<T> = import("./fuse").IFuseOptions<T>;
  export type FuseResult<T> = import("./fuse").FuseResult<T>;
}
