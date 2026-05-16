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
