Erstelle anhand der folgenden strukturierten Falldaten eine abrechnungsrelevante Kurz-Zusammenfassung.

WICHTIG:
- Nur bereitgestellte Informationen verwenden.
- Keine finale Kodierentscheidung treffen.
- Aussagen immer mit Evidenz-ID(s) belegen, z. B. [ev-3], [ev-8].
- Wenn Codes nur als Pruef- oder Review-Kandidaten vorliegen, deutlich als offen kennzeichnen.

Falldaten:

## Fallkontext
- Patient: {{patientLabel}}
- Aufenthalt: {{encounterStart}} bis {{encounterEnd}}
- Account: {{accountLabel}}

## Kandidatencodes
### Explizit
{{explicitCodes}}

### Inferred
{{inferredCodes}}

### Needs Review
{{needsReviewCodes}}

## Evidenz (normalisierte Abschnitte)
{{evidenceBlocks}}

## Datenqualitaet / Warnungen
{{dataQualityIssues}}

Bitte liefere genau diese Abschnitte:
1) Abrechnungsrelevanter Verlauf
2) Diagnosen (belegt)
3) Prozeduren (belegt)
4) Offene Kodierpunkte
5) Dokumentations-/Datenqualitaetshinweise
