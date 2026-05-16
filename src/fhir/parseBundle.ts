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
