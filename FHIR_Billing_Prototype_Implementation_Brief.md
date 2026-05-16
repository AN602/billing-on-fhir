# FHIR-to-Billing Prototype — Agent Implementation Brief

## 1. Purpose

Build a TypeScript-based prototype that ingests a FHIR R4 JSON bundle for a hospital patient stay and produces a structured, billing-relevant case dossier.

The prototype is **not** expected to implement a complete German hospital coding engine. Its main goal is to create a reliable, auditable evidence layer that extracts case context, normalizes TIPLU `Composition` documents, identifies billing-relevant sections, extracts explicit ICD/OPS-like codes where possible, and produces a static report for billing specialists.

The intended output is a **static HTML report** plus a machine-readable **JSON dossier**.

---

## 2. Core Product Framing

The sample bundle does not contain rich native FHIR billing resources such as many `Procedure`, `MedicationStatement`, or complete `Observation` resources. Instead, the most useful billing evidence appears inside TIPLU-profiled `Composition` resources, especially their `section.text.div` fields.

Therefore, implement the prototype as:

> A FHIR/TIPLU ingestion and evidence-normalization tool that creates a billing dossier with traceable candidate ICD/OPS codes.

The most important design principle is **provenance preservation**:

Every extracted candidate code or billing-relevant statement must point back to the source FHIR resource, composition, section, title, date, and text snippet from which it was derived.

---

## 3. Tech Stack

Use a TypeScript stack.

Suggested tools:

- Meta language/dependency manager: Mise
- Runtime: Node.js 24
- Language: TypeScript
- Package manager: Yarn Berry
- Typescript runner: `tsx`
- CLI parser: `commander`
- Test runner: Vitest
- HTML rendering: simple template string with possibility to upgrade to Handlebars later
- FHIR validation: lightweight custom validation for prototype; do not require full FHIR schema validation initially

Do not build a web app for the first prototype. A CLI that generates static HTML is enough.

---

## 4. Input

The tool must accept a path to a FHIR JSON file:

```bash
fhir-billing-prototype ./FHIR_example.json --out ./out
```

Expected input:

- FHIR R4 `Bundle`
- `Bundle.type` may be `searchset`
- Entries may contain full resources or dangling references
- Some entries may reference resources that are not present in the file
- XHTML narrative in `Composition.section.text.div` must be converted to plain text

The sample file used during development is:

```txt
FHIR_example-removed-Observation.json
```

Important sample characteristics:

- Bundle `resourceType`: `Bundle`
- Bundle `type`: `searchset`
- Bundle `total`: `1402`
- Actual entries in the reduced file: `1378`
- Present full resources:
  - `Composition`: `82`
  - `DiagnosticReport`: `36`
  - `Location`: `3`
  - `Practitioner`: `1`
  - `Encounter`: `1`
  - `Account`: `1`
  - `Organization`: `1`
  - `Condition`: `1`
  - `Patient`: `1`
- Entries without embedded resources, mostly removed `Observation` resources: `1251`

The parser must tolerate incomplete bundles.

---

## 5. Output

Generate two files:

```txt
out/billing-dossier.json
out/billing-dossier.html
```

The JSON dossier is the canonical output. The HTML file is a human-readable rendering of the same dossier.

### 5.1 JSON Output Shape

The dossier should follow this rough structure:

```ts
type BillingDossier = {
  generatedAt: string;
  input: {
    filename: string;
    bundleType?: string;
    bundleTotal?: number;
  };
  case: BillingCaseSummary;
  candidateCodes: {
    explicit: CandidateCode[];
    inferred: CandidateCode[];
    needsReview: CandidateCode[];
  };
  evidence: ClinicalEvidenceItem[];
  dataQuality: DataQualityIssue[];
  stats: BundleStats;
};
```

### 5.2 HTML Output Sections

The static HTML report should contain:

1. Case Summary
2. Patient Summary
3. Encounter / Account Summary
4. Candidate Codes
5. High-Relevance Evidence
6. Medium-Relevance Evidence
7. Low-Relevance / Ignored Evidence
8. Data Quality Warnings
9. Raw Resource Statistics

The HTML does not need to be visually sophisticated. It must be readable and useful.

---

## 6. Terminology

Use these project-specific terms consistently.

### Billing Case Dossier

The full normalized output for one case. It contains patient, encounter, account, evidence, candidate codes, and data-quality issues.

### Normalized Clinical Document

A normalized representation of one FHIR `Composition` resource.

### Clinical Evidence Item

A billing-relevant or potentially billing-relevant unit of information extracted from a `Composition.section` or another source resource.

Examples:

- Hauptdiagnose section from discharge letter
- Weitere Prozeduren section from discharge letter
- Radiology report text
- Medication-at-admission section
- Therapy recommendation section
- Consultation note

### Candidate Code

An ICD/OPS-like code extracted or inferred from the evidence. Candidate codes must be marked with their extraction method and confidence.

---

## 7. High-Level Processing Pipeline

Implement this pipeline:

```txt
FHIR JSON bundle
  ↓
parse + basic validation
  ↓
resource index
  ↓
reference resolver + data-quality issue collector
  ↓
case builder
  ↓
composition normalizer
  ↓
TIPLU document/section classifier
  ↓
code extractor
  ↓
billing dossier JSON
  ↓
static HTML report
```

The deterministic pipeline is the source of truth. LLM-based extraction is optional and must only be an enrichment step for unresolved evidence.

---

## 8. Folder Structure

Implement using this structure:

```txt
src/
  cli.ts

  fhir/
    types.ts
    parseBundle.ts
    resourceIndex.ts
    referenceResolver.ts
    validators.ts

  billing/
    dossierTypes.ts
    buildBillingCase.ts
    classifyComposition.ts
    normalizeComposition.ts
    extractCodes.ts
    llmCandidateExtractor.ts

  config/
    tipluDocumentRules.ts
    tipluSectionRules.ts
    codeRegexes.ts

  report/
    renderHtml.ts
    renderJson.ts

  util/
    htmlToText.ts
    dateUtils.ts

  test/
    fixtures/
      example-bundle.json
    extractCodes.test.ts
    classifyComposition.test.ts
    normalizeComposition.test.ts

docs/
  architecture-notes.md

package.json
tsconfig.json
README.md
```

---

## 9. File-by-File Implementation Instructions

### `src/cli.ts`

Implement the command-line entry point.

Responsibilities:

- Parse arguments:
  - input JSON path
  - output directory
  - optional flags such as `--json-only`, `--html-only`, `--debug`
- Load the input file
- Call `parseBundle`
- Build the resource index
- Build the billing dossier
- Render JSON and HTML outputs
- Exit with a non-zero status only for fatal errors, such as invalid JSON or missing input file

Expected command:

```bash
yarn start ./FHIR_example-removed-Observation.json --out ./out
```

---

### `src/fhir/types.ts`

Define minimal TypeScript types for the subset of FHIR needed by the prototype.

Do not attempt to model all of FHIR R4.

Include types for:

- `Bundle`
- `BundleEntry`
- `Resource`
- `Patient`
- `Encounter`
- `Account`
- `Composition`
- `CompositionSection`
- `DiagnosticReport`
- `Condition`
- `Practitioner`
- `Organization`
- `Location`
- `Reference`
- `Coding`
- `CodeableConcept`

Allow unknown properties using index signatures where useful.

Example approach:

```ts
export type Resource = {
  resourceType: string;
  id?: string;
  [key: string]: unknown;
};
```

---

### `src/fhir/parseBundle.ts`

Parse and minimally validate the input JSON.

Responsibilities:

- Accept raw JSON text or a parsed object
- Verify `resourceType === "Bundle"`
- Verify `entry` is an array
- Return a typed `Bundle`
- Throw clear fatal errors for invalid JSON or invalid root resource

Do not fail on missing referenced resources.

---

### `src/fhir/resourceIndex.ts`

Build an index of all embedded resources.

Responsibilities:

- Store resources by canonical key: `${resourceType}/${id}`
- Store resources by fullUrl where available
- Count resources by `resourceType`
- Track entries without embedded `resource`
- Provide lookup functions:
  - `getByReference(reference: string)`
  - `getByType(resourceType: string)`
  - `has(reference: string)`

The index must not crash on duplicate IDs. If duplicates are found, record a data-quality issue.

---

### `src/fhir/referenceResolver.ts`

Resolve FHIR references against the resource index.

Responsibilities:

- Resolve simple relative references like `Patient/abc`
- Resolve full URLs where possible
- Return `undefined` for missing references
- Record missing references as data-quality issues
- Provide helper functions for common references:
  - patient of encounter
  - subject of composition
  - encounter of composition
  - author references
  - condition references from encounter/account

Missing references are expected in the sample because many Observations were removed.

---

### `src/fhir/validators.ts`

Implement lightweight validations.

Examples:

- Bundle has entries
- Patient exists
- Encounter exists
- Account exists, if available
- Composition has subject and/or encounter
- DiagnosticReport references missing Observations
- Encounter diagnosis references missing Conditions
- Account billing diagnosis references missing Conditions

Validation output should be warnings, not fatal errors, unless the bundle itself cannot be parsed.

---

### `src/billing/dossierTypes.ts`

Define the domain model for the prototype.

Required types:

```ts
export type BillingDossier = {
  generatedAt: string;
  input: InputSummary;
  case: BillingCaseSummary;
  candidateCodes: CandidateCodeSummary;
  evidence: ClinicalEvidenceItem[];
  dataQuality: DataQualityIssue[];
  stats: BundleStats;
};
```

Suggested supporting types:

```ts
export type BillingCaseSummary = {
  patient?: PatientSummary;
  encounter?: EncounterSummary;
  account?: AccountSummary;
  organizations: OrganizationSummary[];
  practitioners: PractitionerSummary[];
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

export type CandidateCode = {
  system: "OPS" | "ICD-10-GM";
  code?: string;
  label?: string;
  status: "explicit" | "inferred" | "needs_review";
  method: "native_fhir" | "regex" | "llm" | "manual";
  confidence: number;
  evidenceItemIds: string[];
  sourceText?: string;
};

export type DataQualityIssue = {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  resourceRef?: string;
};
```

Suggested `NormalizedEvidenceKind` values:

```ts
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
```

Suggested `BillingRelevance` values:

```ts
export type BillingRelevance = "high" | "medium" | "low" | "ignore";
```

---

### `src/billing/buildBillingCase.ts`

Orchestrate the full dossier creation.

Responsibilities:

- Accept `Bundle` and `ResourceIndex`
- Extract patient summary
- Extract encounter summary
- Extract account summary
- Extract practitioner and organization summaries
- Normalize all `Composition` resources into evidence items
- Extract codes from evidence items
- Collect candidate codes at the top level
- Collect data-quality warnings
- Return `BillingDossier`

Important case-building rules:

- Prefer `Account` as the billing-case anchor when present because it contains billing-specific metadata.
- Use `Encounter` as the clinical-stay anchor.
- Link both through shared identifiers and patient references where possible.
- Do not assume `Encounter.status === "in-progress"` means the case is actually current; use period dates and Account service period as additional context.
- Record ambiguity in data-quality warnings.

---

### `src/billing/normalizeComposition.ts`

Convert each FHIR `Composition` into one or more `ClinicalEvidenceItem`s.

Responsibilities:

- Extract TIPLU `DocumentType` coding from `Composition.type.coding`
- Extract KDL and IHE codings if present
- Extract document title, date, status, author references, patient reference, encounter reference
- Iterate over `section[]`
- Convert `section.text.div` XHTML to plain text
- Extract section title and section code
- Create one `ClinicalEvidenceItem` per section
- Preserve source metadata for each section

Do not drop sections unless they are completely empty.

---

### `src/billing/classifyComposition.ts`

Classify documents and sections into normalized evidence kinds.

Responsibilities:

- Apply rules from `config/tipluDocumentRules.ts`
- Apply rules from `config/tipluSectionRules.ts`
- The classifier should be able to be configurable with new rule set files - the prototype though only focuses on TIPLU resources
- Combine document-level and section-level signals
- Assign:
  - `normalizedKind`
  - `billingRelevance`
- Prefer section-level rules for highly specific sections such as `Hauptdiagnose`, `Nebendiagnosen`, `Weitere Prozeduren`, `Aufnahmemedikation`, and `Therapieempfehlung`
- Fall back to document-level classification
- Fall back to `unknown` with `low` relevance

Example logic:

- `EV01` + section `Hauptdiagnose` => `diagnosis_section`, `high`
- `EV01` + section `Weitere Prozeduren` => `procedure_section`, `high`
- `EV01` + section `Aufnahmemedikation` => `medication_section`, `medium`
- `DG02999` => `radiology_report`, `medium`
- `SV02007` => `administrative_or_low_relevance`, `low`

---

### `src/billing/extractCodes.ts`

Extract explicit ICD/OPS-like codes from evidence text.

Responsibilities:

- Use regexes from `config/codeRegexes.ts`
- Extract OPS codes
- Extract ICD-10-GM-like codes
- Deduplicate codes per evidence item
- Deduplicate top-level candidate codes across the whole dossier
- Preserve source evidence IDs
- Mark regex-extracted codes as:
  - `status: "explicit"`
  - `method: "regex"`
  - `confidence: 0.95`

Important:

- Do not infer ICD codes from diagnosis text in this deterministic extractor.
- Do not invent ICD or OPS codes.
- If diagnosis text is clinically relevant but no explicit ICD code is present, create a `needs_review` item or evidence item, not a fake code.

Suggested regexes:

```ts
export const OPS_REGEX = /(?<![A-Za-z0-9])\d-\d[0-9A-Za-z]{2,3}(?:\.[0-9A-Za-z]+)?(?![A-Za-z0-9])/g;

export const ICD10_GM_REGEX = /(?<![A-Za-z0-9])(?:[A-TV-Z]\d{2})(?:\.\d{1,2})?(?:[A-Z!+*])?(?![A-Za-z0-9])/g;
```

Expected explicit OPS candidates from the sample include:

```txt
1-930.0
1-930.1
3-800
3-820
3-990
3-994
6-00k.0
8-831.00
8-98g.13
9-401.00
9-984.7
```

The reduced sample does not contain explicit ICD-10-GM codes in the composition text using the regex above.

---

### `src/billing/llmCandidateExtractor.ts`

Stub only for the first implementation.

Responsibilities for a later implementation:

- Accept unresolved high-relevance evidence items
- Ask an LLM to suggest candidate ICD/OPS codes
- Return candidates with:
  - `status: "inferred"`
  - `method: "llm"`
  - confidence below deterministic extraction, for example `0.4` to `0.7`
  - clear evidence references
- Never merge LLM candidates into explicit codes
- Clearly mark all LLM output as requiring human review

For now, implement this as a no-op returning an empty list.

---

### `src/config/tipluDocumentRules.ts`

Define document-level classification rules for TIPLU `DocumentType` codes found in the sample.

Start with these rules:

```ts
export const tipluDocumentRules = [
  {
    match: { tipluDocumentType: "EV01" },
    kind: "discharge_summary",
    billingRelevance: "high",
    description: "Entlassbrief / discharge letter",
  },
  {
    match: { tipluDocumentType: "DG02999" },
    kind: "radiology_report",
    billingRelevance: "medium",
    description: "RIS / radiology finding",
  },
  {
    match: { tipluDocumentType: "SV01001", titleRegex: "RIS|Radiologie" },
    kind: "radiology_report",
    billingRelevance: "medium",
    description: "Visit documentation that appears to contain radiology text",
  },
  {
    match: { tipluDocumentType: "SV01001" },
    kind: "progress_note",
    billingRelevance: "low",
    description: "Generic visit documentation",
  },
  {
    match: { tipluDocumentType: "ID01001" },
    kind: "consult_note",
    billingRelevance: "medium",
    description: "Consultation note",
  },
  {
    match: { tipluDocumentType: "SV02007" },
    kind: "administrative_or_low_relevance",
    billingRelevance: "low",
    description: "Fluid balance or similar low billing relevance documentation",
  },
  {
    match: { tipluDocumentType: "DG21" },
    kind: "lab_report_reference",
    billingRelevance: "medium",
    description: "Microbiology or diagnostic finding",
  },
  {
    match: { tipluDocumentType: "IA01007" },
    kind: "procedure_section",
    billingRelevance: "high",
    description: "Accesses, catheters, drains or related procedural documentation",
  },
  {
    match: { tipluDocumentType: "IA02001" },
    kind: "planned_treatment",
    billingRelevance: "medium",
    description: "Admission or operation planning",
  },
  {
    match: { tipluDocumentType: "TB01003" },
    kind: "planned_treatment",
    billingRelevance: "medium",
    description: "Therapy documentation, e.g. physiotherapy",
  },
  {
    match: { tipluDocumentType: "SZ04" },
    kind: "administrative_or_low_relevance",
    billingRelevance: "low",
    description: "Social service documentation unless explicit OPS evidence exists",
  },
] as const;
```

Make this easy to extend.

---

### `src/config/tipluSectionRules.ts`

Define section-level classification rules.

Start with:

```ts
export const tipluSectionRules = [
  {
    match: { sectionCode: "Hauptdiagnose" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Nebendiagnosen" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Diagnosen" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Weitere Diagnosen" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["icd", "diagnosisText"],
  },
  {
    match: { sectionCode: "Weitere Prozeduren" },
    kind: "procedure_section",
    billingRelevance: "high",
    extract: ["ops"],
  },
  {
    match: { sectionCode: "DurchgefuehrteMassnahmen" },
    kind: "procedure_section",
    billingRelevance: "medium",
    extract: ["ops", "procedureText"],
  },
  {
    match: { sectionCode: "Aufnahmemedikation" },
    kind: "medication_section",
    billingRelevance: "medium",
    extract: ["medicationText"],
  },
  {
    match: { sectionCode: "Therapieempfehlung" },
    kind: "planned_treatment",
    billingRelevance: "medium",
    extract: ["treatmentPlanText"],
  },
  {
    match: { sectionCode: "Bildgebungsbefunde" },
    kind: "radiology_report",
    billingRelevance: "medium",
    extract: ["ops", "diagnosticEvidence"],
  },
  {
    match: { sectionCode: "Epikrise" },
    kind: "diagnosis_section",
    billingRelevance: "high",
    extract: ["diagnosisText", "procedureText", "medicationText"],
  },
  {
    match: { sectionCode: "AllgemeinerEintrag" },
    kind: "progress_note",
    billingRelevance: "low",
    extract: [],
  },
] as const;
```

Section-level rules should override document-level rules when they are more specific.

---

### `src/config/codeRegexes.ts`

Export the code regexes and any helper functions.

Responsibilities:

- Define `OPS_REGEX`
- Define `ICD10_GM_REGEX`
- Optionally expose helper functions:
  - `findOpsCodes(text: string): string[]`
  - `findIcdCodes(text: string): string[]`

Deduplication should happen either here or in `extractCodes.ts`.

---

### `src/report/renderJson.ts`

Serialize the dossier to pretty JSON.

Responsibilities:

- Write `billing-dossier.json`
- Use stable field ordering as much as practical
- Ensure output is UTF-8

---

### `src/report/renderHtml.ts`

Render the static HTML dossier.

Responsibilities:

- Escape all user/source text before injecting into HTML
- Render case summary
- Render candidate code tables
- Group evidence by relevance
- Show source metadata for every evidence item
- Show data-quality warnings
- Show stats

Do not over-engineer styling. A simple readable report is enough.

Suggested layout:

```html
<h1>Billing Case Dossier</h1>
<section id="case-summary">...</section>
<section id="candidate-codes">...</section>
<section id="high-relevance-evidence">...</section>
<section id="data-quality">...</section>
```

---

### `src/util/htmlToText.ts`

Convert XHTML narrative from FHIR to readable plain text.

Responsibilities:

- Remove HTML tags
- Decode common HTML entities
- Preserve useful line breaks for `<br>`, `<p>`, and block elements if possible
- Normalize excessive whitespace
- Keep German umlauts and special characters intact

Do not use a heavyweight DOM unless needed. A simple parser is acceptable for the prototype, but avoid unsafe HTML injection in report output.

---

### `src/util/dateUtils.ts`

Implement small date helpers.

Responsibilities:

- Parse date strings safely
- Format dates for HTML
- Compare dates where needed
- Handle invalid or missing dates gracefully

---

## 10. Case Summary Extraction Rules

### Patient

Extract:

- Patient ID
- Name text
- Gender
- Birth date
- Identifiers

### Encounter

Extract:

- Encounter ID
- Status
- Class
- Type
- Period start/end
- Subject reference
- Diagnosis references
- Service provider if present

Do not assume an encounter is active solely because `status` is `in-progress`. If the encounter has an end date, record a warning if status and period appear inconsistent.

### Account

Extract:

- Account ID
- Status
- Type
- Subject references
- Service period
- Billing status extensions
- DRG/billing extensions where visible
- Diagnosis/procedure references from billing-related extensions

Prefer `Account` as the billing-case anchor when present.

### Practitioner / Organization / Location

Extract basic display information and references for provenance.

---

## 11. Data Quality Requirements

The prototype must produce data-quality warnings, not just silently ignore problems.

Examples to detect:

- Missing referenced resource
- Entry without embedded resource
- Duplicate resource key
- `DiagnosticReport.result` references missing `Observation`
- `Encounter.diagnosis.condition` references missing `Condition`
- `Account` billing diagnosis references missing `Condition`
- Composition without text sections
- Composition without encounter reference
- Composition without subject reference
- Encounter status/period inconsistency

Data-quality issues should not normally stop report generation.

---

## 12. Candidate Code Policy

### Explicit Codes

A code is explicit when it is directly present in either:

- Native FHIR coding fields, if relevant
- Free-text document sections via regex

Explicit codes can be shown prominently.

### Inferred Codes

A code is inferred when it is suggested from clinical text without an explicit code. The first implementation should not infer codes unless an optional LLM step is added.

Inferred codes must be clearly marked as requiring review.

### Needs Review

When text is clinically relevant but no explicit code is found, show it as evidence requiring human review.

Example:

- `Primäres ZNS-Lymphom, ED 08.2024`
- COVID-19 infection mentioned in epikrise
- Harnwegsinfektion mentioned in history/procedure narrative
- Medication and planned treatment text

Do not invent ICD codes for these.

---

## 13. Sample-Specific Evidence to Expect

The prototype should discover that the discharge letter is highly relevant.

Expected high-value sections include:

- `Hauptdiagnose`
- `Weitere Diagnosen`
- `Weitere Prozeduren`
- `Epikrise`
- `Aufnahmemedikation`
- `Therapieempfehlung`
- `Bildgebungsbefunde`

Expected explicit OPS extraction from `Weitere Prozeduren` includes:

```txt
1-930.1
9-984.7
1-930.0
8-98g.13
6-00k.0
8-831.00
3-990
3-800
3-820
3-994
9-401.00
```

The report should not claim that final billing codes have been generated. It should say these are **candidate codes** and provide evidence.

---

## 14. Testing Requirements

Use Vitest.

### Unit Tests

Implement tests for:

1. `htmlToText`
   - Converts XHTML narrative to readable plain text
   - Preserves line breaks reasonably
   - Decodes entities

2. `extractCodes`
   - Extracts OPS codes
   - Extracts ICD-like codes
   - Does not extract false positives from dates
   - Deduplicates repeated codes

3. `classifyComposition`
   - Classifies `EV01` as discharge summary
   - Classifies `DG02999` as radiology report
   - Section `Hauptdiagnose` overrides document-level classification
   - Section `Weitere Prozeduren` becomes high-relevance procedure evidence

4. `resourceIndex`
   - Indexes resources by `resourceType/id`
   - Tracks missing embedded resources
   - Resolves relative references

5. `buildBillingCase`
   - Produces a dossier even with missing referenced resources
   - Produces data-quality warnings
   - Produces candidate OPS codes for the sample

### Golden File Test

Create one integration test against the sample fixture:

- Input: FHIR example bundle
- Output: dossier JSON
- Assertions:
  - patient exists
  - encounter exists
  - account exists
  - at least one high-relevance evidence item exists
  - expected OPS candidates are present
  - data-quality warnings exist for missing Observations

---

## 15. CLI Acceptance Criteria

A successful implementation must satisfy:

```bash
yarn install
yarn test
yarn start ./FHIR_example-removed-Observation.json --out ./out
```

After running, these files must exist:

```txt
out/billing-dossier.json
out/billing-dossier.html
```

The HTML report must include:

- Patient name or patient ID
- Encounter period
- Account information if present
- Candidate OPS codes
- High-relevance evidence from the discharge letter
- Data-quality warnings

The JSON dossier must include:

- `case`
- `candidateCodes`
- `evidence`
- `dataQuality`
- `stats`

---

## 16. Non-Goals for the First Prototype

Do not implement these in the first version:

- Full FHIR R4 validation
- Complete ICD-10-GM or OPS terminology lookup
- DRG grouping
- Legal billing correctness
- Automated final coding decisions
- Web app UI
- Database persistence
- Authentication / authorization
- Multi-patient ingestion
- Real-time FHIR server connectivity
- LLM-based coding as a default path

---

## 17. Extension Points

Design the prototype so these can be added later:

1. More TIPLU document rules
2. More TIPLU section rules
3. Terminology service lookup for ICD/OPS labels
4. LLM-assisted unresolved evidence classification
5. Human review workflow
6. Web UI
7. Database-backed case storage
8. Direct FHIR server ingestion
9. DRG grouping integration
10. Confidence scoring and conflict detection

---

## 18. Implementation Priorities

Implement in this order:

1. CLI file loading
2. Bundle parsing
3. Resource index
4. Basic stats
5. Patient/Encounter/Account summary extraction
6. Composition normalization
7. TIPLU document and section classification
8. Regex code extraction
9. JSON dossier output
10. HTML report output
11. Data-quality warnings
12. Tests
13. README instructions

Do not start with LLM integration.

---

## 19. Coding Guidelines

- Keep functions small and testable.
- Prefer pure functions for parsing, normalization, classification, and extraction.
- Avoid global mutable state.
- Use explicit types for domain objects.
- Keep FHIR types permissive; keep billing dossier types stricter.
- Treat unknown FHIR content as data, not an error.
- Preserve original source references.
- Do not silently discard evidence.
- Do not invent medical codes.
- Mark uncertainty explicitly.

---

## 20. README Content to Generate

The final implementation should include a `README.md` with:

- Project description
- Installation instructions
- CLI usage
- Example command
- Explanation of output files
- Explanation of candidate code policy
- Known limitations
- How to add new TIPLU document rules
- How to add new TIPLU section rules
- How to run tests

---

## 21. Important Domain Caveats to Surface in the Report

The generated report should include a short disclaimer section:

```txt
This prototype extracts billing-relevant evidence and candidate ICD/OPS codes from FHIR/TIPLU data. It does not produce legally final hospital billing codes. All inferred or unresolved evidence requires review by qualified coding specialists.
```

Also surface these caveats when detected:

- Some referenced resources are missing from the input bundle.
- Observation resources were removed from the sample, so lab details cannot be reconstructed from DiagnosticReports.
- Some diagnosis references point to Conditions not present in the file.
- Textual discharge-letter evidence may summarize or duplicate other documents.
- Planned treatments must not automatically be treated as performed billable procedures.

---

## 22. Definition of Done

The prototype is done when:

- The CLI runs on the sample FHIR bundle without crashing.
- The generated JSON dossier contains patient, encounter, account, evidence, candidate codes, stats, and warnings.
- The generated HTML report is readable and groups evidence by billing relevance.
- Explicit OPS codes from the discharge letter are extracted.
- Diagnosis text without explicit ICD codes is shown as review evidence, not converted into invented codes.
- Missing Observation and Condition references are reported as data-quality warnings.
- Core behavior is covered by tests.
- New TIPLU document and section rules can be added by editing config files rather than core logic.
