// Prototype-level validation helpers.
//
// Intended implementation:
// - Validate that required high-level resources exist: Patient, Encounter or Account.
// - Warn if multiple possible billing anchors are found.
// - Warn if Encounter.status/date fields appear inconsistent.
// - Warn if diagnostic reports reference missing Observations.
// - Warn if Account/Encounter references missing Conditions.
//
// These validations are not FHIR conformance checks. They are product-level data-quality checks.

import type { DataQualityIssue } from "../billing/dossierTypes.js";
import type { Bundle, DiagnosticReport, Encounter } from "./types.js";
import type { ResourceIndex } from "./resourceIndex.js";
import { isEncounterStatusPeriodInconsistent } from "../util/dateUtils.js";
import { createReferenceResolver } from "./referenceResolver.js";

export function validateBundle(bundle: Bundle, index: ResourceIndex): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [...index.issues];
  const resolver = createReferenceResolver(index);

  if (!bundle.entry.length) {
    issues.push({ severity: "warning", code: "EMPTY_BUNDLE", message: "Bundle has no entries." });
  }

  if (!index.getByType("Patient").length) {
    issues.push({ severity: "warning", code: "MISSING_PATIENT", message: "No Patient resource found in bundle." });
  }
  const hasEncounter = index.getByType("Encounter").length > 0;
  const hasAccount = index.getByType("Account").length > 0;
  if (!hasEncounter && !hasAccount) {
    issues.push({ severity: "warning", code: "MISSING_ENCOUNTER", message: "No Encounter resource found in bundle." });
  }

  for (const encounter of index.getByType("Encounter") as Encounter[]) {
    if (isEncounterStatusPeriodInconsistent(encounter.status, encounter.period?.end)) {
      issues.push({
        severity: "warning",
        code: "ENCOUNTER_STATUS_PERIOD_INCONSISTENT",
        message: "Encounter has status 'in-progress' but also has period.end.",
        resourceRef: encounter.id ? `Encounter/${encounter.id}` : "Encounter",
      });
    }

    for (const diagnosis of encounter.diagnosis ?? []) {
      const ref = diagnosis.condition?.reference;
      if (ref && !resolver.resolve(ref, "Encounter.diagnosis.condition")) {
        issues.push({
          severity: "warning",
          code: "MISSING_ENCOUNTER_CONDITION",
          message: `Encounter diagnosis references missing Condition: ${ref}`,
          resourceRef: ref,
        });
      }
    }
  }

  for (const report of index.getByType("DiagnosticReport") as DiagnosticReport[]) {
    for (const resultRef of report.result ?? []) {
      const ref = resultRef.reference;
      if (ref && !resolver.resolve(ref, "DiagnosticReport.result")) {
        issues.push({
          severity: "warning",
          code: "MISSING_DIAGNOSTIC_RESULT",
          message: `DiagnosticReport.result references missing Observation: ${ref}`,
          resourceRef: ref,
        });
      }
    }
  }

  return issues;
}
