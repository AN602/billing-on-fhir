// CLI entry point.
//
// Intended responsibilities:
// - Parse command-line arguments, e.g. --input bundle.json --output report.html.
// - Read the FHIR bundle from disk.
// - Call parseBundle(), buildBillingCase(), and renderHtml().
// - Write the generated HTML report and optionally a dossier JSON file.
//
// Keep this file thin. The CLI should orchestrate modules, not contain business logic.

import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseBundle } from "./fhir/parseBundle.js";
import { buildResourceIndex } from "./fhir/resourceIndex.js";
import { validateBundle } from "./fhir/validators.js";
import { buildBillingCase } from "./billing/buildBillingCase.js";
import { renderJson } from "./report/renderJson.js";
import { renderHtml } from "./report/renderHtml.js";

type CliArgs = {
  inputPath: string;
  outDir: string;
  jsonOnly: boolean;
  htmlOnly: boolean;
  debug: boolean;
};

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let inputPath = "";
  let outDir = "./out";
  let jsonOnly = false;
  let htmlOnly = false;
  let debug = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--out") {
      outDir = args[i + 1] ?? outDir;
      i += 1;
      continue;
    }
    if (arg === "--json-only") {
      jsonOnly = true;
      continue;
    }
    if (arg === "--html-only") {
      htmlOnly = true;
      continue;
    }
    if (arg === "--debug") {
      debug = true;
      continue;
    }
    if (!arg.startsWith("-")) {
      inputPath = arg;
    }
  }

  if (!inputPath) {
    throw new Error("Usage: yarn start <fhir-bundle.json> --out ./out [--json-only|--html-only] [--debug]");
  }

  if (jsonOnly && htmlOnly) {
    throw new Error("Flags --json-only and --html-only are mutually exclusive.");
  }

  return { inputPath, outDir, jsonOnly, htmlOnly, debug };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const filePath = resolve(process.cwd(), args.inputPath);
  const outDir = resolve(process.cwd(), args.outDir);
  const fileContents = await readFile(filePath, "utf-8");
  const bundle = parseBundle(fileContents);
  const index = buildResourceIndex(bundle);
  const dataQuality = validateBundle(bundle, index);
  const dossier = buildBillingCase({
    bundle,
    index,
    input: { filename: args.inputPath, bundleType: bundle.type, bundleTotal: bundle.total },
    dataQuality,
  });

  await mkdir(outDir, { recursive: true });
  if (!args.htmlOnly) {
    await renderJson(dossier, outDir);
  }
  if (!args.jsonOnly) {
    await renderHtml(dossier, outDir);
  }

  if (args.debug) {
    console.log(`Generated dossier with ${dossier.evidence.length} evidence items.`);
  }
}

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMainModule) {
  main().catch((error: unknown) => {
    console.error("Failed to read or process bundle", error);
    process.exitCode = 1;
  });
}
