# Biliary duct X-ray orientation

Two original, source-bound drafts replace pending X-ray copy for the existing
cystic duct (FMA14539) and common hepatic duct (FMA14668). No new anatomy, scans,
mask boundaries, source frames, datasets or imaging registrations are added.

The lessons distinguish contrast X-ray cholangiography from an unopacified plain
abdominal film. They explain the expected duct relationships while warning about
variant junctions and projection overlap. Source surfaces do not establish a
connected lumen, patency, flow, stones or procedural suitability. The learner
note explicitly says no acquired study is included; a separately available
Didanix Education study retains its own access requirements.

## Source and licensing scope

- [RadiologyInfo: Biliary interventions](https://www.radiologyinfo.org/en/info/biliary)
  supports contrast-assisted X-ray imaging of the biliary tract.
- [SAGES: Clinical Spotlight Review, laparoscopic common bile duct exploration](https://www.sages.org/publications/guidelines/clinical-spotlight-review-laparoscopic-common-bile-duct-exploration/)
  supports cholangiographic inspection of duct insertion, hepatic branching and
  anatomical variation. Its procedural/dosing instructions are not reproduced.
- Existing admitted anatomy text and references are retained from
  `content/thoracoabdominal-organ-imaging-pins.json`.

These are factual references, not imported media or permission to reuse their
figures. The new summaries/code retain project MIT terms; existing geometry
licences and attribution remain unchanged. No new dependency or service.

## Exact bindings and verification

`lib/biliary-duct-xray.ts` requires the complete retained source identity, not
merely a name or FMA number. Only the X-ray topic changes. The focused command
`npm run biliary-duct-xray:test` compares actual resolver/export/review results
against source commit `6b82cba2129c17500526b927869f825e97aa2215`.
It checks unchanged geometry/catalogue, all other topics, existing tours and
source-mutation rejection. Changed teaching invalidates the two earlier review
packets; no clinical approval is imported or invented.

Clinical review remains required for terminology, anatomical variants and the
limits of projection teaching. These drafts are not patient-space synchrony,
procedural guidance, a diagnostic test or complete biliary anatomy. Website
availability requires the normal generated-module and Review import pipeline.
