// Unit tests for converting Composition sections into ClinicalEvidenceItems.
//
// Suggested tests:
// - Preserve composition ID, section code, title, author refs, encounter ref.
// - Convert XHTML div to readable plain text.
// - Classify Hauptdiagnose as diagnosis evidence.
// - Classify Weitere Prozeduren as procedure evidence.
// - Preserve low-relevance sections rather than silently discarding them.
