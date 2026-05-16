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

export const tipluSectionRules = [
  {
    match: { sectionCode: "Hauptdiagnose" },
    facet: "diagnosis",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Nebendiagnosen" },
    facet: "diagnosis",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Weitere Prozeduren" },
    facet: "procedure",
    billingRelevance: "high",
    extract: ["ops"],
  },
  {
    match: { sectionCode: "Aufnahmemedikation" },
    facet: "medication",
    billingRelevance: "medium",
    extract: ["medicationText"],
  },
  {
    match: { sectionCode: "Therapieempfehlung" },
    facet: "plannedTreatment",
    billingRelevance: "medium",
    extract: ["treatmentPlanText"],
  },
  {
    match: { sectionCode: "Bildgebungsbefunde" },
    facet: "imaging",
    billingRelevance: "medium",
    extract: ["ops", "diagnosticEvidence"],
  },
] as const;