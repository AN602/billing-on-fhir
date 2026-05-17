import { describe, expect, it } from "vitest";
import { extractCodes, extractCodesForEvidence } from "../billing/extractCodes.js";
import type { ClinicalEvidenceItem } from "../billing/dossierTypes.js";

describe("extractCodesForEvidence", () => {
  it("extracts OPS and ICD-like codes", () => {
    const codes = extractCodesForEvidence({
      id: "e1",
      patientRef: "Patient/p1",
      encounterRef: "Encounter/e1",
      source: { resourceType: "Composition", resourceRef: "Composition/c1" },
      normalizedKind: "procedure_section",
      billingRelevance: "high",
      text: "OPS 8-831.00 and 3-820 plus ICD C83.3",
      textSnippet: "OPS 8-831.00 and 3-820 plus ICD C83.3",
      extractedCodes: [],
    });
    expect(codes.map((c) => c.code)).toContain("8-831.00");
    expect(codes.map((c) => c.code)).toContain("3-820");
    expect(codes.map((c) => c.code)).toContain("C83.3");
  });

  it("extracts OPS code from exact description text", () => {
    const codes = extractCodesForEvidence({
      id: "e-desc-1",
      source: { resourceType: "Composition", resourceRef: "Composition/c1" },
      normalizedKind: "procedure_section",
      billingRelevance: "high",
      text: "Klinische Untersuchung in Allgemeinanästhesie",
      textSnippet: "Klinische Untersuchung in Allgemeinanästhesie",
      extractedCodes: [],
    } as never);

    const opsByDescription = codes.find((code) => code.code === "1-100" && code.method === "ops_description_exact");
    expect(opsByDescription).toBeDefined();
    expect(opsByDescription?.status).toBe("explicit");
  });

  it("does not extract OPS code from partial description text", () => {
    const codes = extractCodesForEvidence({
      id: "e-desc-2",
      source: { resourceType: "Composition", resourceRef: "Composition/c1" },
      normalizedKind: "procedure_section",
      billingRelevance: "high",
      text: "Klinische Untersuchung",
      textSnippet: "Klinische Untersuchung",
      extractedCodes: [],
    } as never);

    const opsByDescription = codes.filter((code) => code.method === "ops_description_exact");
    expect(opsByDescription).toHaveLength(0);
  });

  it("deduplicates same OPS code across regex and description match", () => {
    const codes = extractCodesForEvidence({
      id: "e-desc-3",
      source: { resourceType: "Composition", resourceRef: "Composition/c1" },
      normalizedKind: "procedure_section",
      billingRelevance: "high",
      text: "1-100 Klinische Untersuchung in Allgemeinanästhesie",
      textSnippet: "1-100 Klinische Untersuchung in Allgemeinanästhesie",
      extractedCodes: [],
    } as never);

    const matching = codes.filter((code) => code.code === "1-100");
    expect(matching).toHaveLength(1);
    expect(matching[0]?.method).toBe("regex");
  });

  it("does not extract date values as codes", () => {
    const codes = extractCodesForEvidence({
      id: "e2",
      source: { resourceType: "Composition", resourceRef: "Composition/c1" },
      normalizedKind: "diagnosis_section",
      billingRelevance: "high",
      text: "Date 12.10.2024 without ICD/OPS",
      textSnippet: "Date 12.10.2024 without ICD/OPS",
      extractedCodes: [],
    } as never);
    expect(codes.length).toBe(0);
  });
});

describe("extractCodes needsReview fallback", () => {
  function baseEvidenceItem(overrides: Partial<ClinicalEvidenceItem>): ClinicalEvidenceItem {
    return {
      id: "e-base",
      source: { resourceType: "Composition", resourceRef: "Composition/c1" },
      normalizedKind: "unknown",
      billingRelevance: "high",
      text: "No deterministic code in this text",
      textSnippet: "No deterministic code",
      extractedCodes: [],
      ...overrides,
    };
  }

  it("uses ICD-10-GM fallback for diagnosis evidence", () => {
    const result = extractCodes([
      baseEvidenceItem({ id: "diag-1", normalizedKind: "diagnosis_section" }),
    ]);

    expect(result.needsReview).toHaveLength(1);
    expect(result.needsReview[0]?.system).toBe("ICD-10-GM");
  });

  it("uses OPS fallback for procedure evidence", () => {
    const result = extractCodes([
      baseEvidenceItem({ id: "proc-1", normalizedKind: "procedure_section" }),
    ]);

    expect(result.needsReview).toHaveLength(1);
    expect(result.needsReview[0]?.system).toBe("OPS");
  });

  it("uses unknown fallback for ambiguous evidence kinds", () => {
    const result = extractCodes([
      baseEvidenceItem({ id: "amb-1", normalizedKind: "progress_note" }),
    ]);

    expect(result.needsReview).toHaveLength(1);
    expect(result.needsReview[0]?.system).toBe("unknown");
  });

  it("does not add fallback for low relevance evidence", () => {
    const result = extractCodes([
      baseEvidenceItem({ id: "low-1", normalizedKind: "diagnosis_section", billingRelevance: "low" }),
    ]);

    expect(result.needsReview).toHaveLength(0);
  });
});
