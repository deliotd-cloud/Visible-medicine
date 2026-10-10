# Thoracic systemic artery teaching — 7 October 2026

Twelve original draft topics add Anatomy, Function and a four-choice Quiz for four exact display-catalog selections. Parent: `665e87ac91aea2d273d11562276b7be0f9aff567`. Geometry, model files, dependency versions, other clinical/imaging topics and approval authority do not change.

| Selection | Component | Important boundary |
| --- | --- | --- |
| FMA4149, esophageal artery | FJ1934 | One named selection, not the whole arterial supply |
| FMA10704, variant bronchial artery | FJ3418 | FMA14177 is an alias on the same component, not a fifth selection |
| FMA68109, bronchial artery | FJ1933 | Systemic airway supply; no validated origin or branching pattern |
| FMA71537, set of esophageal branches of thoracic aorta | FJ3431 | One grouped identity; no individual branch count inferred |

All four belong to `thorax-vessels-thoracic-detail`. Exact complete source identities are pinned in `content/thoracic-systemic-teaching-pins.json`; the helper refuses altered identities or scope. The transition records precisely twelve changed topics against the immutable parent. No fixed origin, patent connection, perfusion territory, measured flow, intervention route, CT/MRI registration or clinical validation is inferred from a static surface.

## References and commercial-use boundary

The original prose uses basic anatomical facts, with links for review. No source image, scan, figure, table, published passage, case history or dataset has been imported.

- [TTUHSC El Paso thoracic artery table](https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html): usual systemic bronchial/oesophageal arterial contributions. Copyrighted table; no wording or diagram copied.
- [Choi et al., original MDCT/DSA study, PMID34087845](https://pubmed.ncbi.nlm.nih.gov/34087845/): bronchial-origin variability. No cohort detail projected onto these models.
- [Kato et al., original MDCT study, PMID21084913](https://pubmed.ncbi.nlm.nih.gov/21084913/): variable oesophageal arterial origins. Indexed primary abstract was reviewed; no scan, count or path imported.
- [Horii et al., original two-case paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC12408246/): background citation only. Its CC-BY-NC4.0 text/media/data are **not** product assets and are not copied or adapted. This batch teaches no intervention technique or case-derived outcome.

Existing commercial-compatible model notices remain required. Referencing a paper is not a licence to reproduce its protected material. No asset licence, source admission or payment obligation is created by this batch.

## Verification and remaining review

Direct source commands (no additional package aliases):

```text
node scripts/record-thoracic-systemic-teaching.mjs --check
node scripts/test-thoracic-systemic-teaching.mjs
node scripts/run-focused-checks.mjs body-decisions:test body-review:test
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

The focused teaching test passed: twelve changed topics; 9,924 unrelated topics and 1,100 unrelated Review packets exact under the shared renderer; 420 source mutations, 56 forged topics, four genuine-old packets and eight stale teaching POSTs refused. Stale POSTs made no storage calls. Twelve real note renders passed. Independent read-only review reported no concrete issue. Generated renderer/display revisions change normally; old approvals are not migrated.

All teaching remains `draft`, approval false. The owner radiologist must verify identity/group/alias interpretation, spatial relationships, usual anatomy, wording, quiz keys and source suitability before revision-bound sign-off. This batch does not provide new CT, MRI, X-ray, ultrasound, pathology or clinical material, patient images or physiological simulation. Integrated Didanix Education/light and independent access rules remain unchanged; CT-head masks and the clinical desktop PACS are out of scope.

Local evidence: `E:/VisibleMedicine-LocalStaging/20261007-thoracic-systemic-teaching`. Website delivery is a separate source-first integration checkpoint; source tests alone do not prove website delivery, publication or native/assistive acceptance. E recovery is same-machine, not an off-device backup. Full Atlas/website goal remains active.
