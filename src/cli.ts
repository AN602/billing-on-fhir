// CLI entry point.
//
// Intended responsibilities:
// - Parse command-line arguments, e.g. --input bundle.json --output report.html.
// - Read the FHIR bundle from disk.
// - Call parseBundle(), buildBillingCase(), and renderHtml().
// - Write the generated HTML report and optionally a dossier JSON file.
//
// Keep this file thin. The CLI should orchestrate modules, not contain business logic.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main(): Promise<void> {
  const filePath = resolve(process.cwd(), "FHIR_example.json");
  const fileContents = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(fileContents);
  const output = JSON.stringify(parsed, null, 2);

  console.log(output);
}

main().catch((error: unknown) => {
  console.error("Failed to read or process FHIR_example.json", error);
  process.exitCode = 1;
});
