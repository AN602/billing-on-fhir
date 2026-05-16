// Date parsing and formatting helpers.
//
// Intended implementation:
// - Parse FHIR dateTime strings.
// - Preserve original timezone information where relevant.
// - Format dates consistently for the HTML report.
// - Avoid making billing assumptions from dates without validation.

export function parseDateSafe(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatDate(value?: string): string {
  const parsed = parseDateSafe(value);
  if (!parsed) {
    return value ?? "n/a";
  }
  return parsed.toISOString().slice(0, 10);
}

export function isEncounterStatusPeriodInconsistent(status?: string, endDate?: string): boolean {
  if (status !== "in-progress") {
    return false;
  }
  return Boolean(parseDateSafe(endDate));
}
