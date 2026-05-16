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
