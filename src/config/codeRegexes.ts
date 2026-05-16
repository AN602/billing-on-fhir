// Central place for explicit code extraction patterns.
//
// Intended implementation:
// - Export OPS_REGEX and ICD10_GM_REGEX.
// - Keep patterns conservative.
// - Document known false positives and edge cases.
// - Add unit tests before broadening regexes.
//
// OPS examples from the sample:
// - 1-930.1
// - 9-984.7
// - 8-98g.13
// - 8-831.00
// - 3-800
// - 3-820
// - 9-401.00

export const OPS_REGEX = /(?<![A-Za-z0-9])\d-\d[0-9A-Za-z]{2,3}(?:\.[0-9A-Za-z]+)?(?![A-Za-z0-9])/g;

export const ICD10_GM_REGEX = /(?<![A-Za-z0-9])(?:[A-TV-Z]\d{2})(?:\.\d{1,2})?(?:[A-Z!+*])?(?![A-Za-z0-9])/g;

export function findOpsCodes(text: string): string[] {
  return [...new Set(text.match(OPS_REGEX) ?? [])];
}

export function findIcdCodes(text: string): string[] {
  return [...new Set(text.match(ICD10_GM_REGEX) ?? [])];
}
