import { getOpsCatalogIndex } from "../config/opsCatalog.js";
import { normalizeForExactMatch, splitWords } from "../util/textNormalize.js";

export type OpsDescriptionMatch = {
  code: string;
  description: string;
};

export function matchOpsDescriptions(evidenceText: string): OpsDescriptionMatch[] {
  const normalizedText = normalizeForExactMatch(evidenceText);
  if (!normalizedText) {
    return [];
  }

  const index = getOpsCatalogIndex();
  const textTokens = new Set(splitWords(normalizedText));
  const candidates = new Map<string, OpsDescriptionMatch>();

  for (const token of textTokens) {
    const matchingEntries = index.byFirstToken.get(token);
    if (!matchingEntries) {
      continue;
    }

    for (const entry of matchingEntries) {
      if (!normalizedText.includes(entry.normalizedDescription)) {
        continue;
      }

      const key = `${entry.code}|${entry.normalizedDescription}`;
      candidates.set(key, { code: entry.code, description: entry.description });
    }
  }

  return [...candidates.values()];
}
