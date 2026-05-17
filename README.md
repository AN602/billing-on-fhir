# billing-on-fhir

TypeScript CLI prototype that ingests a FHIR R4 bundle and produces a billing-focused case dossier with traceable candidate ICD/OPS codes.

Project map for contributors: `project-state.md`

## Installation

This project uses [Mise](https://mise.jdx.dev/getting-started.html) as a meta dependency/runtime installer. After installing Mise the runtime required by this project can be installed by running:

```bash
mise install
```

If using Mise wants to be avoided looking into [mise.toml](./mise.toml) gives an overview about the used tooling.

After tooling setup the project dependencies can be installed via:

```bash
yarn --immutable
```

## CLI usage

```bash
yarn start <bundle.json> --out <output-directory> [--json-only] [--html-only] [--debug] [--case-summary]
```

Example:

```bash
yarn start ./FHIR_example.json --out ./out
```

The CLI creates a HTML and JSON  dossier in the output folder. The HTML file is completely standalone and runs without any JS.

### Optional LLM case summary

The `--case-summary` flag enables an additional, non-blocking summary step after deterministic dossier generation.

- Prompt strategy (v1): naive concatenation of all normalized section titles + text.
- Prompt files: `src/summary/system-prompt.md` and `src/summary/user-prompt.md` (`{{documents}}` placeholder via Mustache).
- Provider: remote/local-network llama.cpp server via OpenAI-compatible HTTP API.
- Failure behavior: summary is marked as failed and dossier generation still succeeds.

Example `.env`:

```bash
LLM_BASE_URL=http://192.168.1.50:8080/v1
LLM_API_KEY=not-required
LLM_MODEL=gpt-oss-120b
LLM_TIMEOUT_MS=60000
```

Example run:

```bash
yarn start ./FHIR_example.json --out ./out --case-summary
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

### OPS codes
- OPS codes have been downloaded from [https://www.bfarm.de/DE/Kodiersysteme/Services/Downloads/_node.html](https://www.bfarm.de/DE/Kodiersysteme/Services/Downloads/_node.html) and transformed to JSON

## Known limitations

- No full FHIR conformance validation.
- No terminology service lookup or DRG grouping.
- Missing references are reported as warnings and do not stop report generation.
- Year specific OPS codes validation

## Extending TIPLU rules

- Add or adjust document-level mappings in `src/config/tipluDocumentRules.ts`.
- Add or adjust section-level mappings in `src/config/tipluSectionRules.ts`.

## Tests

```bash
yarn test
```
