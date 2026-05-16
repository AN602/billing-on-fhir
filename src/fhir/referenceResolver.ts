// Resolve FHIR Reference values using the ResourceIndex.
//
// Intended implementation:
// - Accept references like "Patient/abc", "Organization/xyz", or fullUrl references.
// - Return either the resolved resource or a structured missing-reference warning.
// - Track all dangling references for the final data-quality section of the report.
//
// Important sample behavior:
// - DiagnosticReport.result references many Observations that may be absent.
// - Encounter.diagnosis and Account.diagnosis may reference Conditions that are absent.

import type { DataQualityIssue } from "../billing/dossierTypes.js";
import type { Resource } from "./types.js";
import type { ResourceIndex } from "./resourceIndex.js";

export type Resolver = {
  resolve: (reference?: string, context?: string) => Resource | undefined;
  issues: DataQualityIssue[];
};

export function createReferenceResolver(index: ResourceIndex): Resolver {
  const issues: DataQualityIssue[] = [];

  const resolve = (reference?: string, context?: string): Resource | undefined => {
    if (!reference) {
      return undefined;
    }
    const resource = index.getByReference(reference);
    if (!resource) {
      issues.push({
        severity: "warning",
        code: "MISSING_REFERENCE",
        message: `Missing referenced resource: ${reference}${context ? ` (${context})` : ""}`,
        resourceRef: reference,
      });
    }
    return resource;
  };

  return { resolve, issues };
}
