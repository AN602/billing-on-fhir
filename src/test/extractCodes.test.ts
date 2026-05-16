import { describe, expect, it } from "vitest";
import { extractCodesForEvidence } from "../billing/extractCodes.js";

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
