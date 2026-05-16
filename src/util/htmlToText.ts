// Convert FHIR Narrative XHTML div content into plain text.
//
// Intended implementation:
// - Strip XHTML tags safely.
// - Decode HTML entities.
// - Preserve line breaks where clinically meaningful.
// - Normalize whitespace without destroying list structure.
//
// This is important because Composition.section.text.div contains much of the billing-relevant evidence.

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

export function htmlToText(input?: string): string {
  if (!input) {
    return "";
  }

  let text = input;
  text = text.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  text = text.replace(/<\s*\/p\s*>/gi, "\n");
  text = text.replace(/<\s*p[^>]*>/gi, "");
  text = text.replace(/<\s*\/li\s*>/gi, "\n");
  text = text.replace(/<\s*li[^>]*>/gi, "- ");
  text = text.replace(/<[^>]+>/g, "");

  for (const [entity, value] of Object.entries(ENTITY_MAP)) {
    text = text.replaceAll(entity, value);
  }

  text = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text;
}
