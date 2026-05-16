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

import type { BillingDossier, BillingCaseSummary, DataQualityIssue, InputSummary } from "./dossierTypes.js";
import type { Account, Bundle, Composition, Encounter, HumanName, Organization, Patient, Practitioner } from "../fhir/types.js";
import type { ResourceIndex } from "../fhir/resourceIndex.js";
import { normalizeComposition } from "./normalizeComposition.js";
import { extractCodes } from "./extractCodes.js";

function first<T>(items: T[]): T | undefined {
  return items.length ? items[0] : undefined;
}

function nameFromHumanName(name?: HumanName): string | undefined {
  if (!name) return undefined;
  return name.text ?? ([name.given?.join(" "), name.family].filter(Boolean).join(" ").trim() || undefined);
}

function patientName(patient?: { name?: HumanName[] }): string | undefined {
  const name = patient?.name?.[0];
  return name?.text ?? ([name?.given?.join(" "), name?.family].filter(Boolean).join(" ").trim() || undefined);
}

function summarizeCase(index: ResourceIndex): BillingCaseSummary {
  const patient = first(index.getByType("Patient") as Patient[]);
  const encounter = first(index.getByType("Encounter") as Encounter[]);
  const account = first(index.getByType("Account") as Account[]);

  return {
    patient: patient
      ? {
          id: patient.id,
          ref: patient.id ? `Patient/${patient.id}` : undefined,
          name: patientName(patient),
          gender: patient.gender,
          birthDate: patient.birthDate,
          identifiers: (patient.identifier ?? []).map((identifier) => `${identifier.system ?? "id"}:${identifier.value ?? ""}`),
        }
      : undefined,
    encounter: encounter
      ? {
          id: encounter.id,
          ref: encounter.id ? `Encounter/${encounter.id}` : undefined,
          status: encounter.status,
          class: encounter.class?.code,
          type: encounter.type?.[0]?.text,
          periodStart: encounter.period?.start,
          periodEnd: encounter.period?.end,
          subjectRef: encounter.subject?.reference,
          diagnosisRefs: (encounter.diagnosis ?? []).map((d) => d.condition?.reference).filter((v): v is string => Boolean(v)),
          serviceProviderRef: encounter.serviceProvider?.reference,
        }
      : undefined,
    account: account
      ? {
          id: account.id,
          ref: account.id ? `Account/${account.id}` : undefined,
          status: account.status,
          type: account.type?.text,
          subjectRefs: (account.subject ?? []).map((subject) => subject.reference).filter((v): v is string => Boolean(v)),
          servicePeriodStart: account.servicePeriod?.start,
          servicePeriodEnd: account.servicePeriod?.end,
        }
      : undefined,
    organizations: (index.getByType("Organization") as Organization[]).map((org) => ({
      id: org.id,
      ref: org.id ? `Organization/${org.id}` : undefined,
      name: org.name,
    })),
    practitioners: (index.getByType("Practitioner") as Practitioner[]).map((practitioner) => ({
      id: practitioner.id,
      ref: practitioner.id ? `Practitioner/${practitioner.id}` : undefined,
      name: nameFromHumanName(practitioner.name?.[0]),
    })),
  };
}

export function buildBillingCase(params: {
  bundle: Bundle;
  index: ResourceIndex;
  input: InputSummary;
  dataQuality: DataQualityIssue[];
}): BillingDossier {
  const { bundle, index, input, dataQuality } = params;
  const compositions = index.getByType("Composition") as Composition[];
  const evidence = compositions.flatMap((composition) => normalizeComposition(composition));
  const extracted = extractCodes(evidence);

  return {
    generatedAt: new Date().toISOString(),
    input,
    case: summarizeCase(index),
    candidateCodes: {
      explicit: extracted.explicit,
      inferred: [],
      needsReview: extracted.needsReview,
    },
    evidence: extracted.evidenceItems,
    dataQuality,
    stats: {
      entriesTotal: bundle.entry.length,
      entriesWithoutResource: index.entriesWithoutResource,
      resourceTypeCounts: index.resourceTypeCounts,
    },
  };
}
