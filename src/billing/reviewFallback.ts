import type { CodingSystem, NormalizedEvidenceKind } from "./dossierTypes.js";

export const MANUAL_REVIEW_FALLBACK_RULES = {
  diagnosis: {
    label: "Diagnosis evidence",
    kinds: ["diagnosis_section"] as const,
    reviewSystem: "ICD-10-GM" as const,
    description: "Diagnosis-focused evidence falls back to ICD-10-GM manual review.",
  },
  procedure: {
    label: "Procedure evidence",
    kinds: ["procedure_section"] as const,
    reviewSystem: "OPS" as const,
    description: "Procedure-focused evidence falls back to OPS manual review.",
  },
  ambiguous: {
    label: "Other clinically relevant evidence",
    kinds: [
      "discharge_summary",
      "radiology_report",
      "medication_section",
      "planned_treatment",
      "consult_note",
      "lab_report_reference",
      "progress_note",
      "unknown",
    ] as const,
    reviewSystem: "unknown" as const,
    description: "No deterministic system can be assigned; review manually.",
  },
  excluded: {
    label: "Administrative/low relevance evidence",
    kinds: ["administrative_or_low_relevance"] as const,
    reviewSystem: undefined,
    description: "No manual-review fallback candidate is created.",
  },
} as const;

export function fallbackReviewSystemForKind(kind: NormalizedEvidenceKind): CodingSystem | undefined {
  if (MANUAL_REVIEW_FALLBACK_RULES.diagnosis.kinds.includes(kind as never)) {
    return MANUAL_REVIEW_FALLBACK_RULES.diagnosis.reviewSystem;
  }
  if (MANUAL_REVIEW_FALLBACK_RULES.procedure.kinds.includes(kind as never)) {
    return MANUAL_REVIEW_FALLBACK_RULES.procedure.reviewSystem;
  }
  if (MANUAL_REVIEW_FALLBACK_RULES.ambiguous.kinds.includes(kind as never)) {
    return MANUAL_REVIEW_FALLBACK_RULES.ambiguous.reviewSystem;
  }
  return MANUAL_REVIEW_FALLBACK_RULES.excluded.reviewSystem;
}
