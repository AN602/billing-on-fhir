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

import type { Composition, CompositionSection } from "../fhir/types.js";
import type { BillingRelevance, NormalizedEvidenceKind } from "./dossierTypes.js";
import { tipluDocumentRules } from "../config/tipluDocumentRules.js";
import { tipluSectionRules } from "../config/tipluSectionRules.js";

export type Classification = {
  normalizedKind: NormalizedEvidenceKind;
  billingRelevance: BillingRelevance;
};

function tipluCode(composition: Composition): string | undefined {
  return composition.type?.coding?.find((coding) => typeof coding.code === "string")?.code;
}

export function classifyDocument(composition: Composition): Classification {
  const docType = tipluCode(composition);
  const title = composition.title ?? "";

  for (const rule of tipluDocumentRules) {
    if (rule.match.tipluDocumentType && rule.match.tipluDocumentType !== docType) {
      continue;
    }
    if (rule.match.titleRegex && !rule.match.titleRegex.test(title)) {
      continue;
    }
    return { normalizedKind: rule.kind, billingRelevance: rule.billingRelevance };
  }

  return { normalizedKind: "unknown", billingRelevance: "low" };
}

export function classifySection(composition: Composition, section: CompositionSection): Classification {
  const sectionCode = section.code?.coding?.find((coding) => typeof coding.code === "string")?.code;
  if (sectionCode) {
    for (const rule of tipluSectionRules) {
      if (rule.match.sectionCode === sectionCode) {
        return { normalizedKind: rule.kind, billingRelevance: rule.billingRelevance };
      }
    }
  }
  return classifyDocument(composition);
}
