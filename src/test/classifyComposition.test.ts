import { describe, expect, it } from "vitest";
import { classifyDocument, classifySection } from "../billing/classifyComposition.js";

describe("classifyComposition", () => {
  it("classifies EV01 as discharge summary", () => {
    const result = classifyDocument({ resourceType: "Composition", type: { coding: [{ code: "EV01" }] } } as never);
    expect(result.normalizedKind).toBe("discharge_summary");
    expect(result.billingRelevance).toBe("high");
  });

  it("section-level rule overrides document-level classification", () => {
    const result = classifySection(
      { resourceType: "Composition", type: { coding: [{ code: "SV02007" }] } } as never,
      { code: { coding: [{ code: "Hauptdiagnose" }] } } as never,
    );
    expect(result.normalizedKind).toBe("diagnosis_section");
    expect(result.billingRelevance).toBe("high");
  });
});
