// Optional future enrichment step for unresolved evidence.
//
// Intended implementation:
// - Accept only selected ClinicalEvidenceItems, not the whole raw bundle.
// - Ask an LLM to suggest possible ICD/OPS candidates from the evidence text.
// - Require structured JSON output with evidence quotes and confidence.
// - Mark all output as status "inferred" or "needs_review".
// - Never treat LLM output as final billing coding.
//
// This file can remain unimplemented for the first prototype.

import type { CandidateCode, ClinicalEvidenceItem } from "./dossierTypes.js";

export async function llmCandidateExtractor(_evidence: ClinicalEvidenceItem[]): Promise<CandidateCode[]> {
  return [];
}
