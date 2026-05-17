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

function slug(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "") || "unknown";
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function buildSectionId(compositionId: string | undefined, code: string | undefined, title: string, text: string): string {
  const source = `${code ?? ""}|${title}|${text}`;
  const digest = hashText(source);
  const codeOrTitle = slug(code ?? title);
  return `${compositionId ?? "composition"}-section-${codeOrTitle}-${digest}`;
}

export function normalizeComposition(composition: Composition): ClinicalEvidenceItem[] {
  const sections = composition.section ?? [];
  if (!sections.length) {
    return [];
  }

  const duplicateCounters = new Map<string, number>();

  return sections
    .map((section) => {
      const text = htmlToText(section.text?.div);
      const title = section.title ?? "";
      const code = sectionCode(section);
      const classification = classifySection(composition, section);

      if (!text && !title && !code) {
        return undefined;
      }

      const baseId = buildSectionId(composition.id, code, title, text);
      const seen = duplicateCounters.get(baseId) ?? 0;
      duplicateCounters.set(baseId, seen + 1);
      const stableId = seen === 0 ? baseId : `${baseId}-${seen + 1}`;

      return {
        id: stableId,
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
