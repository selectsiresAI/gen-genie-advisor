export const normalizeKey = (value: string): string => {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
};

export const jaroWinkler = (s1: string, s2: string): number => {
  if (!s1 && !s2) {
    return 1;
  }

  if (!s1 || !s2) {
    return 0;
  }

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i += 1) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j += 1) {
      if (s2Matches[j]) {
        continue;
      }
      if (s1[i] !== s2[j]) {
        continue;
      }
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches += 1;
      break;
    }
  }

  if (matches === 0) {
    return 0;
  }

  let k = 0;
  for (let i = 0; i < s1.length; i += 1) {
    if (!s1Matches[i]) {
      continue;
    }
    while (!s2Matches[k]) {
      k += 1;
    }
    if (s1[i] !== s2[k]) {
      transpositions += 1;
    }
    k += 1;
  }

  const jaro =
    (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) /
    3;

  let prefix = 0;
  const maxPrefix = 4;
  for (let i = 0; i < Math.min(maxPrefix, s1.length, s2.length); i += 1) {
    if (s1[i] === s2[i]) {
      prefix += 1;
    } else {
      break;
    }
  }

  const scalingFactor = 0.1;
  return jaro + prefix * scalingFactor * (1 - jaro);
};

export type LegendEntry = {
  alias: string;
  canonical: string;
  source: "default" | "user";
};
