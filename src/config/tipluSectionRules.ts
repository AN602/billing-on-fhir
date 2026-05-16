// Config-driven mapping from TIPLU Composition.section codes to evidence facets.
//
// Suggested initial mappings:
// - Hauptdiagnose: diagnosis, high relevance
// - Nebendiagnosen: diagnosis, high relevance
// - Weitere Diagnosen: diagnosis/history, high relevance
// - Weitere Prozeduren: procedure, high relevance
// - Epikrise: clinical_summary, high relevance
// - Aufnahmemedikation: medication, medium relevance
// - Therapieempfehlung: planned_treatment, medium relevance
// - Bildgebungsbefunde: imaging, medium relevance
// - AllgemeinerEintrag: fallback; relevance depends on document kind/title
// - Einfuhr/Ausfuhr: usually low relevance for billing prototype
//
// Keep these rules data-only where possible.

import type { BillingRelevance, NormalizedEvidenceKind } from "../billing/dossierTypes.js";

export type TipluSectionRule = {
  match: { sectionCode: string };
  kind: NormalizedEvidenceKind;
  billingRelevance: BillingRelevance;
  extract: string[];
};

export const tipluSectionRules: TipluSectionRule[] = [
  {
    match: { sectionCode: "Hauptdiagnose" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Nebendiagnosen" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Diagnosen" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Weitere Diagnosen" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Weitere Prozeduren" },
    kind: "procedure_section",
    billingRelevance: "high",
    extract: ["ops"],
  },
  {
    match: { sectionCode: "DurchgefuehrteMassnahmen" },
    kind: "procedure_section",
    billingRelevance: "medium",
    extract: ["ops", "procedureText"],
  },
  {
    match: { sectionCode: "Aufnahmemedikation" },
    kind: "medication_section",
    billingRelevance: "medium",
    extract: ["medicationText"],
  },
  {
    match: { sectionCode: "Therapieempfehlung" },
    kind: "planned_treatment",
    billingRelevance: "medium",
    extract: ["treatmentPlanText"],
  },
  {
    match: { sectionCode: "Bildgebungsbefunde" },
    kind: "radiology_report",
    billingRelevance: "medium",
    extract: ["ops", "diagnosticEvidence"],
  },
  {
    match: { sectionCode: "Epikrise" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["diagnosisText", "procedureText", "medicationText"],
  },
  {
    match: { sectionCode: "AllgemeinerEintrag" },
    kind: "progress_note",
    billingRelevance: "low",
    extract: [],
  },
];
