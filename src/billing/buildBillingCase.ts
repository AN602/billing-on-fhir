// Build the top-level BillingCaseDossier.
//
// Intended implementation:
// - Select the most likely billing case anchor, probably Account first, then Encounter.
// - Extract Patient summary.
// - Extract Encounter summary and previous/current stay information where available.
// - Attach practitioner, organization, and location context when resolvable.
// - Normalize all Composition resources linked to the patient/encounter.
// - Extract candidate codes from normalized evidence items.
// - Add data-quality warnings from parsing and reference resolution.
//
// Keep medical coding decisions out of this module. It should orchestrate lower-level services.
