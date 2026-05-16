// Convert a FHIR Composition into NormalizedClinicalDocument and ClinicalEvidenceItem objects.
//
// Intended implementation:
// - Preserve source metadata: composition ID, type codes, title, date, author refs, encounter ref.
// - Iterate over Composition.section[].
// - Convert XHTML div text into plain text.
// - Classify each section using config/tipluSectionRules.ts.
// - Create one ClinicalEvidenceItem per section.
//
// Important:
// - Do not discard low-relevance sections immediately.
// - Mark them as low or ignored so the report can explain what was skipped.
