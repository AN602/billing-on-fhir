export const BILLING_RELEVANCE_META = {
  high: {
    label: "High",
    description: "Directly relevant for coding or billing decisions; review with priority.",
  },
  medium: {
    label: "Medium",
    description: "Potentially relevant context that may support coding when combined with other evidence.",
  },
  low: {
    label: "Low",
    description: "Mostly background or weakly billing-relevant information.",
  },
  ignore: {
    label: "Ignore",
    description: "Administrative or non-clinical content that is not used for billing evidence.",
  },
} as const;

export type BillingRelevance = keyof typeof BILLING_RELEVANCE_META;

export type NormalizedEvidenceKind =
  | "discharge_summary"
  | "diagnosis_section"
  | "procedure_section"
  | "radiology_report"
  | "medication_section"
  | "planned_treatment"
  | "consult_note"
  | "lab_report_reference"
  | "progress_note"
  | "administrative_or_low_relevance"
  | "unknown";

export type DataQualityIssue = {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  resourceRef?: string;
};

export type EvidenceSource = {
  resourceType: string;
  resourceId?: string;
  resourceRef: string;
  compositionId?: string;
  compositionTitle?: string;
  compositionDate?: string;
  sectionTitle?: string;
  sectionCode?: string;
};

export type CodingSystem = "OPS" | "ICD-10-GM" | "unknown";

export type CandidateCode = {
  system: CodingSystem;
  code?: string;
  label?: string;
  status: "explicit" | "inferred" | "needs_review";
  method: "native_fhir" | "regex" | "ops_description_exact" | "llm" | "manual";
  confidence: number;
  evidenceItemIds: string[];
  sourceText?: string;
};

export type ClinicalEvidenceItem = {
  id: string;
  patientRef?: string;
  encounterRef?: string;
  source: EvidenceSource;
  normalizedKind: NormalizedEvidenceKind;
  billingRelevance: BillingRelevance;
  text: string;
  textSnippet: string;
  extractedCodes: CandidateCode[];
};

export type InputSummary = {
  filename: string;
  bundleType?: string;
  bundleTotal?: number;
};

export type PatientSummary = {
  id?: string;
  ref?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  identifiers: string[];
};

export type EncounterSummary = {
  id?: string;
  ref?: string;
  status?: string;
  class?: string;
  type?: string;
  periodStart?: string;
  periodEnd?: string;
  subjectRef?: string;
  diagnosisRefs: string[];
  serviceProviderRef?: string;
};

export type AccountSummary = {
  id?: string;
  ref?: string;
  status?: string;
  type?: string;
  subjectRefs: string[];
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
};

export type OrganizationSummary = { id?: string; ref?: string; name?: string };
export type PractitionerSummary = { id?: string; ref?: string; name?: string };

export type BillingCaseSummary = {
  patient?: PatientSummary;
  encounter?: EncounterSummary;
  account?: AccountSummary;
  organizations: OrganizationSummary[];
  practitioners: PractitionerSummary[];
};

export type CandidateCodeSummary = {
  explicit: CandidateCode[];
  inferred: CandidateCode[];
  needsReview: CandidateCode[];
};

export type BundleStats = {
  entriesTotal: number;
  entriesWithoutResource: number;
  resourceTypeCounts: Record<string, number>;
};

export type BillingDossier = {
  generatedAt: string;
  input: InputSummary;
  case: BillingCaseSummary;
  candidateCodes: CandidateCodeSummary;
  evidence: ClinicalEvidenceItem[];
  dataQuality: DataQualityIssue[];
  stats: BundleStats;
};
