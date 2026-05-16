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
