// Minimal FHIR TypeScript types used by the prototype.
//
// Do not try to model the full FHIR R4 specification here initially.
// Start with pragmatic structural types for:
// - Bundle
// - BundleEntry
// - Patient
// - Encounter
// - Account
// - Condition
// - Composition
// - DiagnosticReport
// - Practitioner
// - Organization
// - Location
//
// Prefer unknown-safe parsing at the boundaries and narrow only fields the prototype needs.
