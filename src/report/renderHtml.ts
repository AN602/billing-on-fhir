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
  type CandidateCode,
  type ClinicalEvidenceItem,
} from "../billing/dossierTypes.js";
import { MANUAL_REVIEW_FALLBACK_RULES } from "../billing/reviewFallback.js";
import { formatDate } from "../util/dateUtils.js";

type CandidateLinkRef = {
  label: string;
  href: string;
};

function esc(value: unknown): string {
  const s = String(value ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEvidenceList(
  items: ClinicalEvidenceItem[],
  codeRefsByEvidenceId: Map<string, CandidateLinkRef[]>,
): string {
  if (!items.length) return "<p>None</p>";
  return `<ul>${items
    .map((item) => {
      const linkedCodes = codeRefsByEvidenceId.get(item.id) ?? [];
      const linkedCodesHtml = linkedCodes.length
        ? `<br/><small>Linked codes: ${linkedCodes
            .map((ref) => `<a href="${esc(ref.href)}">${esc(ref.label)}</a>`)
            .join(", ")}</small>`
        : "";

      return `<li><strong>${esc(item.source.sectionTitle ?? item.source.sectionCode ?? item.id)}</strong> (${esc(item.normalizedKind)})<br/>${esc(item.textSnippet)}${linkedCodesHtml}<br/><small>${esc(item.source.resourceRef)}</small></li>`;
    })
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

function renderManualReviewFallbackLegend(): string {
  const rows = Object.values(MANUAL_REVIEW_FALLBACK_RULES)
    .map((rule) => {
      const kindList = rule.kinds.map((kind) => `<code>${esc(kind)}</code>`).join(", ");
      const system = rule.reviewSystem ? `<code>${esc(rule.reviewSystem)}</code>` : "none";
      return `<tr><td>${esc(rule.label)}</td><td>${kindList}</td><td>${system}</td><td>${esc(rule.description)}</td></tr>`;
    })
    .join("");

  return `<table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Group</th><th>Kinds</th><th>Review System</th><th>Meaning</th></tr></thead><tbody>${rows}</tbody></table><p><small>Applied only when deterministic extraction finds no ICD/OPS code and evidence relevance is not <code>low</code> or <code>ignore</code>.</small></p>`;
}

function slug(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "") || "unknown";
}

function candidateLabel(code: CandidateCode): string {
  return `${code.system} ${code.code ?? code.label ?? "unknown"}`;
}

function candidateAnchorId(code: CandidateCode, index: number): string {
  return `candidate-${slug(code.system)}-${slug(code.code ?? code.label ?? "unknown")}-${index}`;
}

function renderCandidateCodesSection(dossier: BillingDossier): {
  html: string;
  codeRefsByEvidenceId: Map<string, CandidateLinkRef[]>;
} {
  const groups: Array<{ title: string; items: CandidateCode[] }> = [
    { title: "Explicit", items: dossier.candidateCodes.explicit },
    { title: "Inferred", items: dossier.candidateCodes.inferred },
    { title: "Needs Review", items: dossier.candidateCodes.needsReview },
  ];
  const codeRefsByEvidenceId = new Map<string, CandidateLinkRef[]>();
  let index = 0;

  const groupsHtml = groups
    .map((group, groupIndex) => {
      const headingId =
        group.title === "Needs Review" ? "candidate-codes-needs-review" : `candidate-codes-group-${groupIndex}`;
      if (!group.items.length) {
        return `<h3 id="${esc(headingId)}">${esc(group.title)}</h3><p>None</p>`;
      }

      const itemsHtml = group.items
        .map((code) => {
          const anchorId = candidateAnchorId(code, index);
          const internalHref = code.status === "needs_review" && !code.code ? "#candidate-codes-needs-review" : `#${anchorId}`;
          const label = candidateLabel(code);

          for (const evidenceItemId of code.evidenceItemIds) {
            const refs = codeRefsByEvidenceId.get(evidenceItemId) ?? [];
            refs.push({ label, href: internalHref });
            codeRefsByEvidenceId.set(evidenceItemId, refs);
          }

          index += 1;
          if (!code.code) {
            return `<li id="${esc(anchorId)}">${esc(code.system)} ${esc(code.label ?? "manual review required")}</li>`;
          }

          return `<li id="${esc(anchorId)}">${esc(code.system)} <a href="${esc(codeSearchHref(code.code))}" target="_blank" rel="noopener noreferrer">${esc(code.code)}</a></li>`;
        })
        .join("");

      return `<h3 id="${esc(headingId)}">${esc(group.title)}</h3><ul>${itemsHtml}</ul>`;
    })
    .join("");

  return { html: groupsHtml, codeRefsByEvidenceId };
}

export function dossierToHtml(dossier: BillingDossier): string {
  const high = dossier.evidence.filter((item) => item.billingRelevance === "high");
  const medium = dossier.evidence.filter((item) => item.billingRelevance === "medium");
  const low = dossier.evidence.filter((item) => item.billingRelevance === "low" || item.billingRelevance === "ignore");
  const { html: candidateCodesHtml, codeRefsByEvidenceId } = renderCandidateCodesSection(dossier);

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

<section id="manual-review-fallback-legend">
<h2>Manual Review Fallback Rules</h2>
${renderManualReviewFallbackLegend()}
</section>

<section id="case-summary">
<h2>Case Summary</h2>
<p>Patient: ${esc(dossier.case.patient?.name ?? dossier.case.patient?.id ?? "n/a")}</p>
<p>Encounter period: ${esc(formatDate(dossier.case.encounter?.periodStart))} - ${esc(formatDate(dossier.case.encounter?.periodEnd))}</p>
<p>Account: ${esc(dossier.case.account?.id ?? "n/a")}</p>
</section>

<section id="candidate-codes"><h2>Candidate Codes</h2>
${candidateCodesHtml}
</section>

<section id="high-relevance-evidence"><h2>High-Relevance Evidence</h2>${renderEvidenceList(high, codeRefsByEvidenceId)}</section>
<section id="medium-relevance-evidence"><h2>Medium-Relevance Evidence</h2>${renderEvidenceList(medium, codeRefsByEvidenceId)}</section>
<section id="low-relevance-evidence"><h2>Low-Relevance / Ignored Evidence</h2>${renderEvidenceList(low, codeRefsByEvidenceId)}</section>

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
