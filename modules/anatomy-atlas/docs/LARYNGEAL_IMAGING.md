# Laryngeal CT/MRI orientation drafts

19 September 2026. Six previously pending topics now have original, concise
drafts: CT and MRI for the existing epiglottis (FMA55130), thyroid cartilage
(FMA55099) and cricoid cartilage (FMA9615). No model or navigation change.

The existing Head & neck epiglottis/laryngeal study supplies the context.
Reassemble before comparing relationships. Existing hyoid teaching is preserved;
small ligament imaging remains pending. Grouped cricoid source components are
not certified arch/lamina segmentations. No acquired scan, lumen measurement,
registration, clinical protocol, airway advice or clinical approval is provided.

## Sources and commercial-use boundary

- [RSNA RadioGraphics: Multidetector CT of Laryngeal Injuries (2019)](https://pubs.rsna.org/doi/10.1148/rg.2019180076): CT framework reference; no publisher media or prose imported.
- [Choi et al., Development of a standardized method for contouring the larynx and its substructures (2014)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4266916/): T1 anatomical orientation reference, CC BY 4.0. Small-study findings do not validate this atlas or other MRI sequences. No figures, contours, tables or treatment recommendations reused.
- [Ossification of laryngeal cartilages: related CT findings (PMID6804409)](https://pubmed.ncbi.nlm.nih.gov/6804409/): variability reference, not a diagnostic rule or imported asset.

All displayed summaries are newly written. Reading access is not permission to
reuse publisher images. Existing BodyParts3D attribution remains; no additional
dependency, font, mesh, texture, scan dataset or mandatory fee is introduced.

## Exact identity and review

`content/laryngeal-imaging-pins.json` fixes all three complete identities, two
source bundles and the previous pending content at Atlas commit
`2879b53ef8f9865c4036b06677dc9bbcf9050e90`. Runtime resolution rejects altered
identities. `content/laryngeal-imaging-transition.json` records exactly six
pending-to-draft changes, preserving all other 9,930 topics and study recipes.
The validator replays the actual baseline Git source and checks the rendered
content against review packets. Offline history reconstruction does not migrate
runtime content or stored approvals.

Clinical release still requires radiologist review of the exact content,
identity, relationships and applicable acquired-image correspondence. Atlas,
imaging-case and lecture entitlements remain independent. These drafts are not
signed off; generated revision records and the unsigned pilot must be refreshed
before integration. Source backup and hosted delivery are separate checkpoints.

## Reproduce

```sh
node scripts/pin-laryngeal-imaging.mjs --check
node scripts/validate-laryngeal-imaging.mjs
node --test scripts/test-laryngeal-imaging-history.mjs
npm run shoulder-arterial-mri:test
npm run content:test
npm run body-review:test
```

Never regenerate a historical transition to conceal an unrelated change.

## Resumed validation — 21 September

The content-contract failure was a stale shoulder export: nine geometry-review
fingerprints lagged the already committed review revision. Regenerating the
official shoulder export changed only those fingerprints, not its anatomy,
teaching, geometry or approval state. The contract now passes 33,444 checks;
1,104 body review packets preserve all 9,936 topic snapshots.

Historical shoulder-MRI checks also needed the existing strict celiac-display
adapter: their saved parent predates that correction. Both check scripts now
reconstruct the actual earlier display before comparison. Original source pins
and transition hashes are retained; runtime geometry and approvals are untouched.
The laryngeal history suite passes all four tests against actual saved Git source.
