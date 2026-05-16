# billing-on-fhir

TypeScript CLI prototype that ingests a FHIR R4 bundle and produces a billing-focused case dossier with traceable candidate ICD/OPS codes.

Project map for contributors: `project-state.md`

## Installation

```bash
yarn install
```

## CLI usage

```bash
yarn start <bundle.json> --out <output-directory> [--json-only] [--html-only] [--debug]
```

Example:

```bash
yarn start ./FHIR_example.json --out ./out
```

## Development fixtures

- Canonical fixture: `FHIR_example.json`
- Reduced reference-stress fixture: `FHIR_example-removed-Observation.json` (many `Observation` resources removed)

## Output files

- `out/billing-dossier.json`: canonical machine-readable dossier
- `out/billing-dossier.html`: static human-readable report

## Candidate code policy

- Explicit codes come from native codings or deterministic regex extraction from text.
- Inferred codes are reserved for optional future enrichment (not enabled by default).
- Clinically relevant text without explicit codes is surfaced as `needs_review` evidence.
- The tool does not generate legally final billing codes.

## Known limitations

- No full FHIR conformance validation.
- No terminology service lookup or DRG grouping.
- Missing references are reported as warnings and do not stop report generation.

## Extending TIPLU rules

- Add or adjust document-level mappings in `src/config/tipluDocumentRules.ts`.
- Add or adjust section-level mappings in `src/config/tipluSectionRules.ts`.

## Tests

```bash
yarn test
```
