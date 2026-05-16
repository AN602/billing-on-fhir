// Render the BillingCaseDossier as a static HTML report.
//
// Intended report sections:
// 1. Case Summary
// 2. Extracted Candidate Codes
// 3. High-Relevance Evidence
// 4. Medium-Relevance Evidence
// 5. Low-Relevance / Ignored Evidence
// 6. Data Quality Warnings
//
// Important:
// - Escape/sanitize all text before rendering.
// - Show provenance for every candidate code.
// - Make it clear whether a code is explicit, inferred, or needs review.
