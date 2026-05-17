import { describe, expect, it } from "vitest";
import { buildResourceIndex } from "../fhir/resourceIndex.js";
import { validateBundle } from "../fhir/validators.js";

describe("validateBundle", () => {
  it("does not warn about missing encounter when account exists", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [
        { resource: { resourceType: "Patient", id: "p1" } },
        { resource: { resourceType: "Account", id: "a1" } },
      ],
    } as never;

    const issues = validateBundle(bundle, buildResourceIndex(bundle));
    expect(issues.some((i) => i.code === "MISSING_ENCOUNTER")).toBe(false);
  });

  it("warns about missing encounter when both encounter and account are absent", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [{ resource: { resourceType: "Patient", id: "p1" } }],
    } as never;

    const issues = validateBundle(bundle, buildResourceIndex(bundle));
    expect(issues.some((i) => i.code === "MISSING_ENCOUNTER")).toBe(true);
  });
});
