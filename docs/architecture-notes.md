# Architecture Notes

Main principle: separate deterministic extraction from medical coding inference.

Recommended pipeline:

```text
FHIR Bundle
  -> parse and validate
  -> index resources
  -> resolve references
  -> build case context
  -> normalize TIPLU compositions
  -> classify evidence items
  -> extract explicit codes
  -> generate billing dossier JSON
  -> render static HTML report
```

Important validation questions:

- Is `Account` or `Encounter` the correct billing-case anchor?
- Which TIPLU `DocumentType` and `DocumentSection` codes are stable across customers?
- Which document/section types should be considered billing-relevant?
- How should planned treatments be separated from performed procedures?
- How should LLM-inferred candidate codes be reviewed and audited?
