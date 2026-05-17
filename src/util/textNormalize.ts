export function normalizeForExactMatch(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

export function splitWords(text: string): string[] {
  const matches = text.match(/[\p{L}\p{N}]+/gu);
  return matches ?? [];
}
