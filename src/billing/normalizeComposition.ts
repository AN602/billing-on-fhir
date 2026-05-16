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

import type { ClinicalEvidenceItem } from "./dossierTypes.js";
import type { Composition, CompositionSection } from "../fhir/types.js";
import { htmlToText } from "../util/htmlToText.js";
import { classifySection } from "./classifyComposition.js";

function sectionCode(section: CompositionSection): string | undefined {
  return section.code?.coding?.find((coding) => typeof coding.code === "string")?.code;
}

export function normalizeComposition(composition: Composition): ClinicalEvidenceItem[] {
  const sections = composition.section ?? [];
  if (!sections.length) {
    return [];
  }

  return sections
    .map((section, index) => {
      const text = htmlToText(section.text?.div);
      const title = section.title ?? "";
      const code = sectionCode(section);
      const classification = classifySection(composition, section);

      if (!text && !title && !code) {
        return undefined;
      }

      return {
        id: `${composition.id ?? "composition"}-section-${index + 1}`,
        patientRef: composition.subject?.reference,
        encounterRef: composition.encounter?.reference,
        source: {
          resourceType: "Composition",
          resourceId: composition.id,
          resourceRef: composition.id ? `Composition/${composition.id}` : "Composition",
          compositionId: composition.id,
          compositionTitle: composition.title,
          compositionDate: composition.date,
          sectionTitle: title,
          sectionCode: code,
        },
        normalizedKind: classification.normalizedKind,
        billingRelevance: classification.billingRelevance,
        text,
        textSnippet: text.slice(0, 280),
        extractedCodes: [],
      };
    })
    .filter((item): item is ClinicalEvidenceItem => Boolean(item));
}
