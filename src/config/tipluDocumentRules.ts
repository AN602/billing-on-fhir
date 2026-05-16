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

import type { BillingRelevance, NormalizedEvidenceKind } from "../billing/dossierTypes.js";

export type TipluDocumentRule = {
  match: {
    tipluDocumentType?: string;
    titleRegex?: RegExp;
  };
  kind: NormalizedEvidenceKind;
  billingRelevance: BillingRelevance;
  description: string;
};

export const tipluDocumentRules: TipluDocumentRule[] = [
  {
    match: { tipluDocumentType: "EV01" },
    kind: "discharge_summary",
    billingRelevance: "high",
    description: "Entlassbrief / discharge letter",
  },
  {
    match: { tipluDocumentType: "DG02999" },
    kind: "radiology_report",
    billingRelevance: "medium",
    description: "RIS / radiology finding",
  },
  {
    match: { tipluDocumentType: "SV01001", titleRegex: /RIS|Radiologie/i },
    kind: "radiology_report",
    billingRelevance: "medium",
    description: "Visit documentation with radiology text",
  },
  {
    match: { tipluDocumentType: "SV01001" },
    kind: "progress_note",
    billingRelevance: "low",
    description: "Generic visit documentation",
  },
  {
    match: { tipluDocumentType: "SV02007" },
    kind: "administrative_or_low_relevance",
    billingRelevance: "low",
    description: "Fluid balance or low relevance documentation",
  },
  {
    match: { tipluDocumentType: "ID01001" },
    kind: "consult_note",
    billingRelevance: "medium",
    description: "Consultation note",
  },
  {
    match: { tipluDocumentType: "IA01007" },
    kind: "procedure_section",
    billingRelevance: "high",
    description: "Procedural documentation",
  },
  {
    match: { tipluDocumentType: "DG21" },
    kind: "lab_report_reference",
    billingRelevance: "medium",
    description: "Microbiology or diagnostic finding",
  },
  {
    match: { tipluDocumentType: "IA02001" },
    kind: "planned_treatment",
    billingRelevance: "medium",
    description: "Admission or operation planning",
  },
  {
    match: { tipluDocumentType: "TB01003" },
    kind: "planned_treatment",
    billingRelevance: "medium",
    description: "Therapy documentation",
  },
  {
    match: { tipluDocumentType: "SZ04" },
    kind: "administrative_or_low_relevance",
    billingRelevance: "low",
    description: "Social service documentation",
  },
];
