# Project State

## Purpose

`billing-on-fhir` is a TypeScript CLI prototype that ingests a FHIR R4 Bundle (focused on TIPLU-heavy data), extracts billing-relevant evidence, detects candidate ICD/OPS-like codes, and writes:

- `billing-dossier.json` (canonical output)
- `billing-dossier.html` (human-readable report)

The prototype is evidence-first and audit-oriented. It does not perform final legal billing coding.

## Current End-to-End Flow

Input command:

```bash
yarn start ./FHIR_example.json --out ./out
```

Pipeline:

1. CLI argument parsing and file loading (`src/cli.ts`)
2. Bundle parsing (`src/fhir/parseBundle.ts`)
3. Resource indexing and basic stats (`src/fhir/resourceIndex.ts`)
4. Data-quality checks (`src/fhir/validators.ts`)
5. Case + evidence construction (`src/billing/buildBillingCase.ts`)
6. Composition section normalization (`src/billing/normalizeComposition.ts`)
7. Document/section classification (`src/billing/classifyComposition.ts`)
8. Deterministic regex code extraction (`src/billing/extractCodes.ts`)
9. JSON and HTML rendering (`src/report/renderJson.ts`, `src/report/renderHtml.ts`)

## Where To Change What

### Add/adjust FHIR fields or resource handling

- `src/fhir/types.ts` - permissive FHIR subset types
- `src/fhir/parseBundle.ts` - root parse/validation behavior
- `src/fhir/resourceIndex.ts` - reference keying, type counts, duplicate/missing entry handling
- `src/fhir/referenceResolver.ts` - shared reference resolution behavior

### Add/adjust data-quality warnings

- `src/fhir/validators.ts` - bundle-level and cross-resource warning logic
- `src/fhir/resourceIndex.ts` - indexing-time warnings (duplicates, empty entries)

### Change case summary extraction

- `src/billing/buildBillingCase.ts` - patient/encounter/account/org/practitioner summary logic
- `src/billing/dossierTypes.ts` - shape of summary structures

### Change evidence extraction from Composition

- `src/billing/normalizeComposition.ts` - section iteration, metadata/provenance capture
- `src/util/htmlToText.ts` - XHTML narrative-to-text conversion rules

### Change classification behavior (billing relevance, normalized kind)

- `src/billing/classifyComposition.ts` - classification engine and precedence
- `src/config/tipluDocumentRules.ts` - document-level TIPLU mappings
- `src/config/tipluSectionRules.ts` - section-level overrides and extraction hints

### Change code extraction behavior

- `src/config/codeRegexes.ts` - OPS/ICD regex patterns and helpers
- `src/billing/extractCodes.ts` - candidate creation, dedupe, needs-review logic
- `src/billing/llmCandidateExtractor.ts` - future inferred-code enrichment stub

### Change output format

- `src/report/renderJson.ts` - JSON serialization/file writing, including billing relevance legend metadata
- `src/report/renderHtml.ts` - HTML sections/content/escaping, including billing relevance legend table text
- `src/billing/dossierTypes.ts` - output schema changes

### Change CLI behavior

- `src/cli.ts` - flags, defaults, orchestration, error handling

### Change tests/add coverage

- `src/test/*.test.ts` - unit/integration tests

## Current Tests

Existing test coverage includes:

- `htmlToText`
- `renderHtml`
- `extractCodes`
- `classifyComposition`
- `normalizeComposition`
- `resourceIndex`
- `buildBillingCase`
- canonical fixture integration via `FHIR_example.json`

Run tests:

```bash
yarn test
```

## Fixtures

- Canonical fixture: `FHIR_example.json`
- Reduced missing-reference fixture: `FHIR_example-removed-Observation.json`

## Known Boundaries (Current)

- No full FHIR R4 conformance validation
- No terminology lookup for ICD/OPS labels
- No DRG grouping
- No final billing-code decisioning
- LLM inference not active (stub only)
