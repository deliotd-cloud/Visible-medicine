# Oesophageal external-ultrasound orientation

One draft fills the previously pending Ultrasound topic for the existing
`FMA7131` / `FJ2563` selection. It extends the existing thoracoabdominal teaching
group and uses its exact source-identity guard; no new viewer or control is added.

The scope is cervical external ultrasound orientation, not a complete examination
of the oesophagus, endoscopic ultrasound, or transoesophageal echocardiography.
Anatomical layers or dynamic findings described in acquired ultrasound must not
be inferred from the static reference surface. No wall measurements, procedural
protocol, patient registration, diagnostic clearance or clinical approval is supplied.

## Sources and reuse boundary

- [Maconi et al., EFSUMB consensus, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8163523/):
  the cervical anatomical description in the functional-oesophageal section was
  inspected through indexed article text. The full PMC page returned a challenge.
  Publisher metadata identifies CC BY-NC-ND 4.0; no article assets are imported.
- [Grebe et al., 2019](https://pubmed.ncbi.nlm.nih.gov/30402811/): the original
  research abstract was inspected. Its limited study population is stated; it
  does not validate this model or complete-organ imaging.

Text is a short original factual synthesis, not a copied figure, table, article
passage or scan. See `LICENSES/THIRD_PARTY_NOTICES.md`. No new cost-bearing service,
dependency, media asset or font is introduced. Review the precise teaching and
source revision before approval; all existing release gates remain in force.

## Verification

`npm run esophagus-external-ultrasound:test` checks the append-only transition,
source identity, one-topic change, preserved surrounding content, existing
display/export path and draft limitations. Historical snapshots retain their
original hashes. Source tests are not browser/device or clinical acceptance.

The focused run verifies one changed topic and 9,935 preserved topics, rejects
41 altered source identities, checks the unchanged source bundle and renders
the real information-panel callback. Main-bronchus, hilar-vessel, thoracic-inlet,
content-contract and review/decision-binding checks also pass in
`.local/test-logs/2026-09-26T12-40-52.164Z-30660-599bcb1c.log`.
That log also retains the original organ-pinning failure; the separate old
whole-snapshot mismatch is retained in
`.local/test-logs/2026-09-26T12-44-30.064Z-15760-88e8fbd9.log`.
The unchanged parent `6cbeafb` reproduces the latter mismatch with
`node scripts/test-thoracoabdominal-history-baseline.mjs`. The corrected checker
passes using original Git trees `76e0d191` → `6d8c900`, retaining the original
snapshot hash: 42 changed / 9,867 untouched historical topics. Independent
current checks retain 42 note renders, 9,865 preserved placements and 798
source/topic rejections. The two later bronchial topics explain the distinct
live versus historical denominator. Evidence is saved in
`docs/thoracoabdominal-organ-imaging-validation.json`.

Final pin check, focused lint and TypeScript pass. The regional production
build passes (3,378 modules, 6.41 seconds), with existing large-chunk warnings.
Browser acceptance and generated website integration remain pending.
