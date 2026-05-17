import { describe, expect, it } from "vitest";
import { buildCaseSummaryPromptData, generateCaseSummary } from "../summary/generateCaseSummary.js";

describe("buildCaseSummaryPromptData", () => {
  it("builds structured prompt data with evidence and codes", () => {
    const promptData = buildCaseSummaryPromptData({
      caseSummary: {
        patient: { id: "p1", name: "Max Mustermann", identifiers: [] },
        encounter: { id: "enc1", diagnosisRefs: [], periodStart: "2026-01-10", periodEnd: "2026-01-20" },
        account: { id: "acc1", subjectRefs: [] },
        organizations: [],
        practitioners: [],
      },
      candidateCodes: {
        explicit: [
          {
            system: "ICD-10-GM",
            code: "C83.3",
            status: "explicit",
            method: "regex",
            confidence: 0.95,
            evidenceItemIds: ["ev-1"],
          },
        ],
        inferred: [],
        needsReview: [],
      },
      evidence: [
      {
        id: "ev-1",
        source: { resourceType: "Composition", resourceRef: "Composition/1", sectionTitle: "Diagnose" },
        normalizedKind: "diagnosis_section",
        billingRelevance: "high",
        text: "C83.3 wurde dokumentiert.",
        textSnippet: "C83.3 wurde",
        extractedCodes: [],
      },
      ],
      dataQuality: [{ severity: "warning", code: "missing_ref", message: "Reference not found" }],
    });

    expect(promptData.patientLabel).toBe("Max Mustermann");
    expect(promptData.explicitCodes).toContain("ICD-10-GM C83.3");
    expect(promptData.evidenceBlocks).toContain("[ev-1]");
    expect(promptData.dataQualityIssues).toContain("missing_ref");
  });

  it("uses fallback labels when case context is missing", () => {
    const promptData = buildCaseSummaryPromptData({
      caseSummary: { organizations: [], practitioners: [] },
      candidateCodes: { explicit: [], inferred: [], needsReview: [] },
      evidence: [],
      dataQuality: [],
    });

    expect(promptData.patientLabel).toBe("n/a");
    expect(promptData.encounterStart).toBe("n/a");
    expect(promptData.accountLabel).toBe("n/a");
    expect(promptData.explicitCodes).toContain("none");
  });
});

describe("generateCaseSummary", () => {
  it("returns skipped when feature is disabled", async () => {
    const result = await generateCaseSummary({
      caseSummary: { organizations: [], practitioners: [] },
      candidateCodes: { explicit: [], inferred: [], needsReview: [] },
      evidence: [],
      dataQuality: [],
      config: { enabled: false, timeoutMs: 1000 },
    });

    expect(result.status).toBe("skipped");
    expect(result.provider).toBe("llama-cpp-server");
  });

  it("returns failed when base URL is missing", async () => {
    const result = await generateCaseSummary({
      caseSummary: { organizations: [], practitioners: [] },
      candidateCodes: { explicit: [], inferred: [], needsReview: [] },
      evidence: [],
      dataQuality: [],
      config: { enabled: true, timeoutMs: 1000 },
    });

    expect(result.status).toBe("failed");
    expect(result.error).toMatch(/LLM_BASE_URL/i);
  });
});
