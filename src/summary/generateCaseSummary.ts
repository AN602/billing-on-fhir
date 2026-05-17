import type { BillingCaseSummaryResult, ClinicalEvidenceItem } from "../billing/dossierTypes.js";
import OpenAI from "openai";

type SummaryConfig = {
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
};

function sectionLabel(item: ClinicalEvidenceItem): string {
  return item.source.sectionTitle ?? item.source.sectionCode ?? item.normalizedKind;
}

export function buildNaiveCaseSummaryPrompt(evidence: ClinicalEvidenceItem[]): string {
  if (!evidence.length) {
    return "No normalized composition sections were available.";
  }

  return evidence
    .map((item) => `## ${sectionLabel(item)}\n${item.text}`)
    .join("\n\n");
}

async function runChatCompletion(params: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  prompt: string;
  timeoutMs: number;
}): Promise<string> {
  const client = new OpenAI({
    apiKey: params.apiKey ?? "not-required",
    baseURL: params.baseUrl,
    timeout: params.timeoutMs,
  });

  const completion = await client.chat.completions.create({
    model: params.model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You summarize inpatient clinical documentation for billing specialists. Use only the provided text. Be concise and clearly state uncertainty.",
      },
      {
        role: "user",
        content: `Create a concise case summary based on these normalized sections:\n\n${params.prompt}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("LLM response did not include summary text");
  }

  return content;
}

export async function generateCaseSummary(params: {
  evidence: ClinicalEvidenceItem[];
  config: SummaryConfig;
}): Promise<BillingCaseSummaryResult> {
  const prompt = buildNaiveCaseSummaryPrompt(params.evidence);

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
    const text = await runChatCompletion({
      baseUrl: params.config.baseUrl,
      apiKey: params.config.apiKey,
      model,
      prompt,
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
