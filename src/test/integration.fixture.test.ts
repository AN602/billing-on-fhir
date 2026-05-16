import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBundle } from "../fhir/parseBundle.js";
import { buildResourceIndex } from "../fhir/resourceIndex.js";
import { validateBundle } from "../fhir/validators.js";
import { buildBillingCase } from "../billing/buildBillingCase.js";

describe("integration fixture", () => {
  it("builds dossier from canonical fixture", async () => {
    const raw = await readFile(resolve(process.cwd(), "FHIR_example.json"), "utf-8");
    const bundle = parseBundle(raw);
    const index = buildResourceIndex(bundle);
    const warnings = validateBundle(bundle, index);
    const dossier = buildBillingCase({
      bundle,
      index,
      input: { filename: "FHIR_example.json", bundleType: bundle.type, bundleTotal: bundle.total },
      dataQuality: warnings,
    });

    expect(dossier.case.patient).toBeDefined();
    expect(dossier.case.encounter).toBeDefined();
    expect(dossier.case.account).toBeDefined();
    expect(dossier.evidence.some((e) => e.billingRelevance === "high")).toBe(true);
    expect(dossier.candidateCodes.explicit.some((c) => c.code === "8-831.00")).toBe(true);
    expect(dossier.dataQuality.length).toBeGreaterThan(0);
  }, 60000);
});
