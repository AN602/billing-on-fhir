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

import { findIcdCodes, findOpsCodes } from "../config/codeRegexes.js";
import type { CandidateCode, ClinicalEvidenceItem } from "./dossierTypes.js";

function dedupeByKey(candidates: CandidateCode[]): CandidateCode[] {
  const map = new Map<string, CandidateCode>();
  for (const candidate of candidates) {
    const key = `${candidate.system}|${candidate.code ?? ""}|${candidate.status}|${candidate.method}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, candidate);
      continue;
    }
    existing.evidenceItemIds = [...new Set([...existing.evidenceItemIds, ...candidate.evidenceItemIds])];
  }
  return [...map.values()];
}

export function extractCodesForEvidence(evidence: ClinicalEvidenceItem): CandidateCode[] {
  const ops = findOpsCodes(evidence.text).map((code) => ({
    system: "OPS" as const,
    code,
    status: "explicit" as const,
    method: "regex" as const,
    confidence: 0.95,
    evidenceItemIds: [evidence.id],
    sourceText: evidence.textSnippet,
  }));

  const icd = findIcdCodes(evidence.text).map((code) => ({
    system: "ICD-10-GM" as const,
    code,
    status: "explicit" as const,
    method: "regex" as const,
    confidence: 0.95,
    evidenceItemIds: [evidence.id],
    sourceText: evidence.textSnippet,
  }));

  return dedupeByKey([...ops, ...icd]);
}

export function extractCodes(evidenceItems: ClinicalEvidenceItem[]): {
  evidenceItems: ClinicalEvidenceItem[];
  explicit: CandidateCode[];
  needsReview: CandidateCode[];
} {
  const explicit: CandidateCode[] = [];
  const needsReview: CandidateCode[] = [];

  const updatedEvidence = evidenceItems.map((item) => {
    const extracted = extractCodesForEvidence(item);
    explicit.push(...extracted);

    // ToDo - this seems like not a good way of proposing the presence of an ICD code
    // Requires more research and might be a good entrypoint for LLM based parsing as a fallback when regex fails
    if (!extracted.length && item.billingRelevance !== "low" && item.billingRelevance !== "ignore") {
      needsReview.push({
        system: "ICD-10-GM",
        status: "needs_review",
        method: "manual",
        confidence: 0,
        evidenceItemIds: [item.id],
        sourceText: item.textSnippet,
      });
    }

    return { ...item, extractedCodes: extracted };
  });

  return {
    evidenceItems: updatedEvidence,
    explicit: dedupeByKey(explicit),
    needsReview: dedupeByKey(needsReview),
  };
}
