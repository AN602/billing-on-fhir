import type {
  BillingCaseSummary,
  BillingCaseSummaryResult,
  CandidateCodeSummary,
  ClinicalEvidenceItem,
  DataQualityIssue,
} from "../billing/dossierTypes.js";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import Mustache from "mustache";

type SummaryConfig = {
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
};

const summaryDir = dirname(fileURLToPath(import.meta.url));
const systemPromptPath = resolve(summaryDir, "system-prompt.md");
const userPromptPath = resolve(summaryDir, "user-prompt.md");

function sectionLabel(item: ClinicalEvidenceItem): string {
  return item.source.sectionTitle ?? item.source.sectionCode ?? item.normalizedKind;
}

function patientLabel(caseSummary: BillingCaseSummary): string {
  return caseSummary.patient?.name ?? caseSummary.patient?.id ?? "n/a";
}

function encounterStart(caseSummary: BillingCaseSummary): string {
  return caseSummary.encounter?.periodStart ?? "n/a";
}

function encounterEnd(caseSummary: BillingCaseSummary): string {
  return caseSummary.encounter?.periodEnd ?? "n/a";
}

function accountLabel(caseSummary: BillingCaseSummary): string {
  return caseSummary.account?.id ?? "n/a";
}

function formatCodes(lines: string[]): string {
  return lines.length ? lines.join("\n") : "- none";
}

function codeLinePrefix(item: { system: string; code?: string; label?: string }): string {
  if (item.code) {
    return `${item.system} ${item.code}`;
  }

  if (item.label) {
    return `${item.system} ${item.label}`;
  }

  return `${item.system} unknown`;
}

function formatCandidateCodes(candidateCodes: CandidateCodeSummary): {
  explicitCodes: string;
  inferredCodes: string;
  needsReviewCodes: string;
} {
  const explicitCodes = formatCodes(
    candidateCodes.explicit.map(
      (item) =>
        `- ${codeLinePrefix(item)} | confidence=${item.confidence.toFixed(2)} | evidence=${item.evidenceItemIds.join(", ") || "none"}`,
    ),
  );

  const inferredCodes = formatCodes(
    candidateCodes.inferred.map(
      (item) =>
        `- ${codeLinePrefix(item)} | confidence=${item.confidence.toFixed(2)} | evidence=${item.evidenceItemIds.join(", ") || "none"}`,
    ),
  );

  const needsReviewCodes = formatCodes(
    candidateCodes.needsReview.map(
      (item) =>
        `- ${codeLinePrefix(item)} | confidence=${item.confidence.toFixed(2)} | evidence=${item.evidenceItemIds.join(", ") || "none"}`,
    ),
  );

  return { explicitCodes, inferredCodes, needsReviewCodes };
}

function formatEvidenceBlocks(evidence: ClinicalEvidenceItem[]): string {
  if (!evidence.length) {
    return "- none";
  }

  return evidence
    .map(
      (item) =>
        `- [${item.id}] relevance=${item.billingRelevance}; kind=${item.normalizedKind}; section=${sectionLabel(item)}; source=${item.source.resourceRef}\n  snippet: ${item.textSnippet || item.text}`,
    )
    .join("\n");
}

function formatDataQualityIssues(issues: DataQualityIssue[]): string {
  if (!issues.length) {
    return "- none";
  }

  return issues
    .map((issue) => `- [${issue.severity}] ${issue.code}: ${issue.message}`)
    .join("\n");
}

export function buildCaseSummaryPromptData(params: {
  caseSummary: BillingCaseSummary;
  candidateCodes: CandidateCodeSummary;
  evidence: ClinicalEvidenceItem[];
  dataQuality: DataQualityIssue[];
}): {
  patientLabel: string;
  encounterStart: string;
  encounterEnd: string;
  accountLabel: string;
  explicitCodes: string;
  inferredCodes: string;
  needsReviewCodes: string;
  evidenceBlocks: string;
  dataQualityIssues: string;
} {
  const formattedCodes = formatCandidateCodes(params.candidateCodes);

  return {
    patientLabel: patientLabel(params.caseSummary),
    encounterStart: encounterStart(params.caseSummary),
    encounterEnd: encounterEnd(params.caseSummary),
    accountLabel: accountLabel(params.caseSummary),
    explicitCodes: formattedCodes.explicitCodes,
    inferredCodes: formattedCodes.inferredCodes,
    needsReviewCodes: formattedCodes.needsReviewCodes,
    evidenceBlocks: formatEvidenceBlocks(params.evidence),
    dataQualityIssues: formatDataQualityIssues(params.dataQuality),
  };
}

async function runChatCompletion(params: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number;
}): Promise<string> {
  const client = new OpenAI({
    apiKey: params.apiKey ?? "not-required",
    baseURL: params.baseUrl,
    timeout: params.timeoutMs,
  });

  const completion = await client.chat.completions.create({
    model: params.model,
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: params.systemPrompt,
      },
      {
        role: "user",
        content: params.userPrompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("LLM response did not include summary text");
  }

  return content;
}

async function buildRenderedUserPrompt(promptData: ReturnType<typeof buildCaseSummaryPromptData>): Promise<{
  systemPrompt: string;
  userPrompt: string;
}> {
  const [systemPromptTemplate, userPromptTemplate] = await Promise.all([
    readFile(systemPromptPath, "utf-8"),
    readFile(userPromptPath, "utf-8"),
  ]);

  const userPrompt = Mustache.render(userPromptTemplate, promptData);
  return {
    systemPrompt: systemPromptTemplate.trim(),
    userPrompt: userPrompt.trim(),
  };
}

export async function generateCaseSummary(params: {
  caseSummary: BillingCaseSummary;
  candidateCodes: CandidateCodeSummary;
  evidence: ClinicalEvidenceItem[];
  dataQuality: DataQualityIssue[];
  config: SummaryConfig;
}): Promise<BillingCaseSummaryResult> {
  const promptData = buildCaseSummaryPromptData({
    caseSummary: params.caseSummary,
    candidateCodes: params.candidateCodes,
    evidence: params.evidence,
    dataQuality: params.dataQuality,
  });
  const prompt = JSON.stringify(promptData);

  if (!params.config.enabled) {
    return {
      status: "skipped",
      provider: "llama-cpp-server",
      model: params.config.model,
      promptChars: prompt.length,
      error: "Case summary generation disabled",
    };
  }

  if (!params.config.baseUrl) {
    return {
      status: "failed",
      provider: "llama-cpp-server",
      model: params.config.model,
      promptChars: prompt.length,
      error: "LLM_BASE_URL is not set",
    };
  }

  const model = params.config.model ?? "gpt-oss-120b";

  try {
    const renderedPrompts = await buildRenderedUserPrompt(promptData);
    const text = await runChatCompletion({
      baseUrl: params.config.baseUrl,
      apiKey: params.config.apiKey,
      model,
      systemPrompt: renderedPrompts.systemPrompt,
      userPrompt: renderedPrompts.userPrompt,
      timeoutMs: params.config.timeoutMs,
    });

    return {
      status: "generated",
      provider: "llama-cpp-server",
      model,
      promptChars: prompt.length,
      text,
    };
  } catch (error: unknown) {
    return {
      status: "failed",
      provider: "llama-cpp-server",
      model,
      promptChars: prompt.length,
      error: error instanceof Error ? error.message : "Unknown summary generation error",
    };
  }
}
