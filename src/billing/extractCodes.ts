// Extract explicit ICD/OPS-like codes from evidence text.
//
// Intended implementation:
// - Apply deterministic regex patterns to ClinicalEvidenceItem.text.
// - Return CandidateCode objects with method "regex" and status "explicit".
// - Deduplicate codes across repeated sections while preserving all evidence references.
// - Avoid inferring codes from diagnosis text in this module.
//
// Suggested initial regexes:
// - OPS: German procedure codes such as 8-831.00, 3-820, 9-401.00
// - ICD-10-GM: codes such as C83.3, U07.1, etc.
//
// Add test cases for false positives, especially dates and numeric lab values.
