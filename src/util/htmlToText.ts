// Convert FHIR Narrative XHTML div content into plain text.
//
// Intended implementation:
// - Strip XHTML tags safely.
// - Decode HTML entities.
// - Preserve line breaks where clinically meaningful.
// - Normalize whitespace without destroying list structure.
//
// This is important because Composition.section.text.div contains much of the billing-relevant evidence.
