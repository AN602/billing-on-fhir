// Parse and lightly validate a FHIR JSON bundle.
//
// Intended implementation:
// - Accept raw JSON or a file buffer/string.
// - Confirm resourceType === "Bundle".
// - Confirm entry is an array.
// - Preserve the original bundle for traceability.
// - Return a typed ParsedBundle object plus validation warnings.
//
// Important:
// - The sample bundle contains references to removed Observation resources.
// - Missing resources should become data-quality warnings, not fatal errors.

import type { Bundle } from "./types.js";

export function parseBundle(input: string | unknown): Bundle {
  let parsed: unknown = input;
  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch (error) {
      throw new Error(`Invalid JSON input: ${(error as Error).message}`);
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Input must be a JSON object.");
  }

  const maybeBundle = parsed as Record<string, unknown>;
  if (maybeBundle.resourceType !== "Bundle") {
    throw new Error("Input JSON is not a FHIR Bundle (resourceType must equal 'Bundle').");
  }

  if (!Array.isArray(maybeBundle.entry)) {
    throw new Error("FHIR Bundle is invalid: entry must be an array.");
  }

  return maybeBundle as Bundle;
}
