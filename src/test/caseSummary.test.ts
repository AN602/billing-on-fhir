import { describe, expect, it } from "vitest";
import { buildNaiveCaseSummaryPrompt, generateCaseSummary } from "../summary/generateCaseSummary.js";

describe("buildNaiveCaseSummaryPrompt", () => {
  it("concatenates section title and normalized text", () => {
    const prompt = buildNaiveCaseSummaryPrompt([
      {
        id: "ev-1",
        source: { resourceType: "Composition", resourceRef: "Composition/1", sectionTitle: "Diagnose" },
        normalizedKind: "diagnosis_section",
        billingRelevance: "high",
        text: "C83.3 wurde dokumentiert.",
        textSnippet: "C83.3 wurde",
        extractedCodes: [],
      },
    ]);

    expect(prompt).toContain("## Diagnose");
    expect(prompt).toContain("C83.3 wurde dokumentiert.");
  });
});

describe("generateCaseSummary", () => {
  it("returns skipped when feature is disabled", async () => {
    const result = await generateCaseSummary({
      evidence: [],
      config: { enabled: false, timeoutMs: 1000 },
    });

    expect(result.status).toBe("skipped");
    expect(result.provider).toBe("llama-cpp-server");
  });

  it("returns failed when base URL is missing", async () => {
    const result = await generateCaseSummary({
      evidence: [],
      config: { enabled: true, timeoutMs: 1000 },
    });

    expect(result.status).toBe("failed");
    expect(result.error).toMatch(/LLM_BASE_URL/i);
  });
});
