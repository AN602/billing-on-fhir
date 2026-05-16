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

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  BILLING_RELEVANCE_META,
  type BillingDossier,
  type ClinicalEvidenceItem,
} from "../billing/dossierTypes.js";
import { formatDate } from "../util/dateUtils.js";

function esc(value: unknown): string {
  const s = String(value ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEvidenceList(items: ClinicalEvidenceItem[]): string {
  if (!items.length) return "<p>None</p>";
  return `<ul>${items
    .map(
      (item) =>
        `<li><strong>${esc(item.source.sectionTitle ?? item.source.sectionCode ?? item.id)}</strong> (${esc(item.normalizedKind)})<br/>${esc(item.textSnippet)}<br/><small>${esc(item.source.resourceRef)}</small></li>`,
    )
    .join("")}</ul>`;
}

function codeSearchHref(code?: string): string {
  if (!code) {
    return "#";
  }
  return `https://www.icd-code.de/suche/ops/recherche.html?sp=${encodeURIComponent(code)}`;
}

function renderBillingRelevanceLegend(): string {
  const rows = Object.entries(BILLING_RELEVANCE_META)
    .map(
      ([value, meta]) =>
        `<tr><td><code>${esc(value)}</code></td><td>${esc(meta.label)}</td><td>${esc(meta.description)}</td></tr>`,
    )
    .join("");

  return `<table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Value</th><th>Label</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function dossierToHtml(dossier: BillingDossier): string {
  const high = dossier.evidence.filter((item) => item.billingRelevance === "high");
  const medium = dossier.evidence.filter((item) => item.billingRelevance === "medium");
  const low = dossier.evidence.filter((item) => item.billingRelevance === "low" || item.billingRelevance === "ignore");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><title>Billing Case Dossier</title></head>
<body>
<h1>Billing Case Dossier</h1>
<p>This prototype extracts billing-relevant evidence and candidate ICD/OPS codes from FHIR/TIPLU data. It does not produce legally final hospital billing codes.</p>

<section id="billing-relevance-legend">
<h2>Billing Relevance Levels</h2>
${renderBillingRelevanceLegend()}
</section>

<section id="case-summary">
<h2>Case Summary</h2>
<p>Patient: ${esc(dossier.case.patient?.name ?? dossier.case.patient?.id ?? "n/a")}</p>
<p>Encounter period: ${esc(formatDate(dossier.case.encounter?.periodStart))} - ${esc(formatDate(dossier.case.encounter?.periodEnd))}</p>
<p>Account: ${esc(dossier.case.account?.id ?? "n/a")}</p>
</section>

<section id="candidate-codes"><h2>Candidate Codes</h2>
<ul>${dossier.candidateCodes.explicit
    .map(
      (code) =>
        `<li>${esc(code.system)} <a href="${esc(codeSearchHref(code.code))}" target="_blank" rel="noopener noreferrer">${esc(code.code ?? "")}</a></li>`,
    )
    .join("")}</ul>
</section>

<section id="high-relevance-evidence"><h2>High-Relevance Evidence</h2>${renderEvidenceList(high)}</section>
<section id="medium-relevance-evidence"><h2>Medium-Relevance Evidence</h2>${renderEvidenceList(medium)}</section>
<section id="low-relevance-evidence"><h2>Low-Relevance / Ignored Evidence</h2>${renderEvidenceList(low)}</section>

<section id="data-quality"><h2>Data Quality Warnings</h2><ul>${dossier.dataQuality
    .map((issue) => `<li>${esc(issue.code)}: ${esc(issue.message)}</li>`)
    .join("")}</ul></section>
</body></html>`;
}

export async function renderHtml(dossier: BillingDossier, outDir: string): Promise<string> {
  const outputPath = resolve(outDir, "billing-dossier.html");
  await writeFile(outputPath, dossierToHtml(dossier), "utf-8");
  return outputPath;
}
