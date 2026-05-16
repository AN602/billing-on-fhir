import { describe, expect, it } from "vitest";
import { buildResourceIndex } from "../fhir/resourceIndex.js";
import { buildBillingCase } from "../billing/buildBillingCase.js";
import { validateBundle } from "../fhir/validators.js";

describe("buildBillingCase", () => {
  it("builds dossier and carries warnings", () => {
    const bundle = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [
        { resource: { resourceType: "Patient", id: "p1", name: [{ text: "Jane Doe" }] } },
        { resource: { resourceType: "Encounter", id: "e1", status: "in-progress", period: { end: "2024-10-10" } } },
      ],
    } as never;

    const index = buildResourceIndex(bundle);
    const warnings = validateBundle(bundle, index);
    const dossier = buildBillingCase({ bundle, index, input: { filename: "fixture.json" }, dataQuality: warnings });

    expect(dossier.case.patient?.id).toBe("p1");
    expect(dossier.dataQuality.length).toBeGreaterThan(0);
  });
});
