import { describe, expect, it } from "vitest";
import { buildResourceIndex } from "../fhir/resourceIndex.js";

describe("resourceIndex", () => {
  it("indexes by resourceType/id and tracks empty entries", () => {
    const index = buildResourceIndex({
      resourceType: "Bundle",
      entry: [{ resource: { resourceType: "Patient", id: "p1" } }, {}],
    } as never);

    expect(index.has("Patient/p1")).toBe(true);
    expect(index.entriesWithoutResource).toBe(1);
  });
});
