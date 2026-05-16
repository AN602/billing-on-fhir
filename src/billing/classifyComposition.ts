// Classify a FHIR Composition into a prototype document kind.
//
// Intended implementation:
// - Read Composition.type.coding entries.
// - Prefer TIPLU DocumentType codes where present.
// - Fall back to title patterns, category codes, and section codes.
// - Return normalizedKind and billingRelevance.
//
// Examples:
// - EV01 -> discharge_summary, high relevance
// - DG02999 or title containing RIS/Radiologie -> radiology_report, medium relevance
// - SV02007 -> administrative_or_low_relevance, low relevance
// - ID01001 -> consult_note, medium relevance
//
// Rules should live in config/tipluDocumentRules.ts so new codes can be added without rewriting logic.
