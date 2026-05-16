// Render or serialize the BillingCaseDossier as JSON.
//
// Intended implementation:
// - Produce a machine-readable artifact next to the HTML report.
// - Useful for tests, snapshots, and later UI development.
// - Ensure evidence IDs and source references are stable enough for regression tests.

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { BillingDossier } from "../billing/dossierTypes.js";

export function dossierToJson(dossier: BillingDossier): string {
  return `${JSON.stringify(dossier, null, 2)}\n`;
}

export async function renderJson(dossier: BillingDossier, outDir: string): Promise<string> {
  const outputPath = resolve(outDir, "billing-dossier.json");
  await writeFile(outputPath, dossierToJson(dossier), "utf-8");
  return outputPath;
}
