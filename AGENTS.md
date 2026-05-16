# AGENTS.md

## Project Idea (Rough)

This project is a CLI-first FHIR-to-billing evidence prototype.

It ingests a FHIR R4 Bundle (with strong focus on TIPLU `Composition` resources), normalizes clinically relevant document sections, extracts explicit ICD/OPS-like candidate codes where possible, and generates a structured dossier for billing specialists.

Key principle: preserve provenance so each candidate and evidence item can be traced back to source resource/section text.

## Architecture (Rough)

Layered modules:

- CLI orchestration: `src/cli.ts`
- FHIR ingestion/index/validation: `src/fhir/*`
- Billing domain and transformation pipeline: `src/billing/*`
- Configuration-driven classification and regex rules: `src/config/*`
- Output rendering (JSON + HTML): `src/report/*`
- Utilities: `src/util/*`
- Tests: `src/test/*`

Primary flow:

1. Parse bundle
2. Index resources
3. Collect data-quality warnings
4. Build case + normalized evidence
5. Classify evidence
6. Extract explicit candidates
7. Render dossier outputs

## About `project-state.md`

`project-state.md` is a condensed engineering map of the codebase.

It exists to answer: "If I want to add/change feature X, where should I edit?"

It summarizes:

- current pipeline behavior
- module responsibilities
- key extension points
- fixture and test status

## Synchronization Requirement

When code changes are made, `project-state.md` must be reviewed and updated in the same change set if behavior, architecture, responsibilities, or extension points changed.

At minimum, keep these sections in sync:

- end-to-end flow
- where-to-change mappings
- tests/fixtures status
- current boundaries/limitations
