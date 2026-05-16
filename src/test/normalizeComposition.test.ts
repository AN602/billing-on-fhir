import { describe, expect, it } from "vitest";
import { normalizeComposition } from "../billing/normalizeComposition.js";

describe("normalizeComposition", () => {
  it("converts XHTML div to text and classifies sections", () => {
    const composition = {
      resourceType: "Composition",
      id: "comp-1",
      subject: { reference: "Patient/p1" },
      encounter: { reference: "Encounter/e1" },
      section: [
        {
          title: "Hauptdiagnose",
          code: { coding: [{ code: "Hauptdiagnose" }] },
          text: { div: "<div><p>C83.3</p></div>" },
        },
      ],
    } as never;

    const result = normalizeComposition(composition);
    expect(result.length).toBe(1);
    expect(result[0].text).toContain("C83.3");
    expect(result[0].normalizedKind).toBe("diagnosis_section");
  });
});
