// Core domain types for the billing dossier.
//
// Suggested concepts:
// - BillingCaseDossier
// - CaseSummary
// - NormalizedClinicalDocument
// - ClinicalEvidenceItem
// - CandidateCode
// - DataQualityWarning
//
// CandidateCode should distinguish explicit extraction from inference:
// - explicit: directly found in native FHIR or text via regex
// - inferred: suggested by NLP/LLM/terminology lookup
// - needs_review: clinically relevant evidence without a safe code
//
// Every candidate code should point back to evidence item IDs for auditability.
