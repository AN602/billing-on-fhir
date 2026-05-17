import { describe, expect, it } from "vitest";
import type { BillingDossier } from "../billing/dossierTypes.js";
import { dossierToHtml } from "../report/renderHtml.js";

function buildFixtureDossier(): BillingDossier {
  return {
    generatedAt: "2026-01-01T00:00:00.000Z",
    input: { filename: "fixture.json", bundleType: "document", bundleTotal: 1 },
    case: {
      patient: { id: "p1", identifiers: [] },
      encounter: { id: "e1", diagnosisRefs: [] },
      account: { id: "a1", subjectRefs: [] },
      organizations: [],
      practitioners: [],
    },
    candidateCodes: {
      explicit: [
        {
          system: "OPS",
          code: "8-831.00",
          status: "explicit",
          method: "native_fhir",
          confidence: 0.99,
          evidenceItemIds: ["ev-1"],
        },
      ],
      inferred: [],
      needsReview: [],
    },
    evidence: [
      {
        id: "ev-1",
        source: { resourceType: "Composition", resourceRef: "Composition/1", sectionTitle: "Diagnoses" },
        normalizedKind: "diagnosis_section",
        billingRelevance: "high",
        text: "Sample diagnosis text",
        textSnippet: "Sample diagnosis",
        extractedCodes: [],
      },
    ],
    dataQuality: [],
    stats: { entriesTotal: 1, entriesWithoutResource: 0, resourceTypeCounts: { Composition: 1 } },
  };
}

describe("dossierToHtml", () => {
  it("links evidence items to candidate code anchors", () => {
    const html = dossierToHtml(buildFixtureDossier());

    expect(html).toContain('id="candidate-ops-8-831-00-0"');
    expect(html).toContain('href="#candidate-ops-8-831-00-0"');
    expect(html).toContain("Linked codes:");
  });

  it("links manual review evidence to needs review section", () => {
    const dossier = buildFixtureDossier();
    dossier.candidateCodes.explicit = [];
    dossier.candidateCodes.needsReview = [
      {
        system: "unknown",
        status: "needs_review",
        method: "manual",
        confidence: 0,
        evidenceItemIds: ["ev-1"],
      },
    ];

    const html = dossierToHtml(dossier);

    expect(html).toContain('id="candidate-codes-needs-review"');
    expect(html).toContain('href="#candidate-codes-needs-review"');
  });

  it("renders grouped manual review fallback legend", () => {
    const html = dossierToHtml(buildFixtureDossier());

    expect(html).toContain("Manual Review Fallback Rules");
    expect(html).toContain("Diagnosis evidence");
    expect(html).toContain("Other clinically relevant evidence");
    expect(html).toContain("unknown");
  });

  it("renders generated LLM case summary", () => {
    const dossier = buildFixtureDossier();
    dossier.caseSummary = {
      status: "generated",
      provider: "llama-cpp-server",
      model: "gpt-oss-120b",
      promptChars: 123,
      text: "Concise summary text",
    };

    const html = dossierToHtml(dossier);
    expect(html).toContain("LLM Case Summary");
    expect(html).toContain("Concise summary text");
  });
});
