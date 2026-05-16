// Config-driven mapping from TIPLU Composition.type codes to normalized document kinds.
//
// Start with only codes observed in the sample bundle.
// Add new rules incrementally as new customer data appears.
//
// Example rule shape:
// {
//   match: { tipluDocumentType: "EV01" },
//   kind: "discharge_summary",
//   billingRelevance: "high"
// }
//
// Suggested initial mappings:
// - EV01: discharge_summary
// - DG02999: radiology_report
// - SV01001 + title /RIS|Radiologie/: radiology_report
// - SV02007: administrative_or_low_relevance
// - ID01001: consult_note
// - IA01007: procedure_section
// - DG21: lab_report_reference
// - IA02001: planned_procedure
// - TB01003: therapy_note
// - SZ04: social_service_note

export const tipluDocumentRules = [
  {
    match: { tipluDocumentType: "EV01" },
    kind: "discharge_summary",
    billingRelevance: "high",
  },
  {
    match: { tipluDocumentType: "DG02999" },
    kind: "radiology_report",
    billingRelevance: "medium",
  },
  {
    match: { tipluDocumentType: "SV01001", titleRegex: /RIS|Radiologie/i },
    kind: "radiology_report",
    billingRelevance: "medium",
  },
  {
    match: { tipluDocumentType: "SV02007" },
    kind: "administrative_or_low_relevance",
    billingRelevance: "low",
  },
  {
    match: { tipluDocumentType: "ID01001" },
    kind: "consult_note",
    billingRelevance: "medium",
  },
  {
    match: { tipluDocumentType: "IA01007" },
    kind: "procedure_section",
    billingRelevance: "high",
  },
] as const;