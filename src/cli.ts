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
import { config as loadDotenv } from "dotenv";
import { parseBundle } from "./fhir/parseBundle.js";
import { buildResourceIndex } from "./fhir/resourceIndex.js";
import { validateBundle } from "./fhir/validators.js";
import { buildBillingCase } from "./billing/buildBillingCase.js";
import { generateCaseSummary } from "./summary/generateCaseSummary.js";
import { renderJson } from "./report/renderJson.js";
import { renderHtml } from "./report/renderHtml.js";

type CliArgs = {
  inputPath: string;
  outDir: string;
  jsonOnly: boolean;
  htmlOnly: boolean;
  debug: boolean;
  caseSummary: boolean;
};

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let inputPath = "";
  let outDir = "./out";
  let jsonOnly = false;
  let htmlOnly = false;
  let debug = false;
  let caseSummary = false;

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
    if (arg === "--case-summary") {
      caseSummary = true;
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

  return { inputPath, outDir, jsonOnly, htmlOnly, debug, caseSummary };
}

async function main(): Promise<void> {
  loadDotenv();
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
  dossier.caseSummary = await generateCaseSummary({
    evidence: dossier.evidence,
    config: {
      enabled: args.caseSummary,
      baseUrl: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL ?? "gpt-oss-120b",
      timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? "60000"),
    },
  });

  if (dossier.caseSummary.status === "failed") {
    dossier.dataQuality.push({
      severity: "warning",
      code: "llm_summary_failed",
      message: dossier.caseSummary.error ?? "Case summary generation failed",
    });
  }

  await mkdir(outDir, { recursive: true });
  if (!args.htmlOnly) {
    await renderJson(dossier, outDir);
  }
  if (!args.jsonOnly) {
    await renderHtml(dossier, outDir);
  }

  if (args.debug) {
    console.log(`Generated dossier with ${dossier.evidence.length} evidence items.`);
    console.log(`Case summary status: ${dossier.caseSummary.status}.`);
  }
}

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMainModule) {
  main().catch((error: unknown) => {
    console.error("Failed to read or process bundle", error);
    process.exitCode = 1;
  });
}
