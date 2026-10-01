# Cerebellar arteries and right MCA — CT/MRI teaching drafts

Ten previously pending root topic slots become original drafts: CT and MRI for
both PICA selections, both SCA selections and the retained right MCA. Exact
source identities and bundles are pinned against `2f470a6a`; no anatomy is added,
renamed, repaired or joined. No left MCA counterpart is inferred.

## Scope

The notes distinguish routine noncontrast head CT from contrast-enhanced CTA,
and structural MRI from MRA. They introduce angiographic orientation and
flow-related visibility limits without providing diagnostic performance claims,
acquisition protocols or treatment advice. Source colours are not scan signals.

- PICA: each side retains thirteen original files/fourteen components. Source
  fragmentation is not patient occlusion or proof of a continuous lumen.
- SCA: the supplied side identity is retained despite a small proximal crossing
  of the source midline. This is not evidence for an individual's named variant.
- Right MCA: three original PART-OF files/six components, not a complete arterial
  tree, separately defined M1/M2 segments or a matched left/right pair.

Every lesson includes the exact existing coverage note, draft status,
revision-bound radiologist review requirement and separate case/Atlas/lecture
access. Restore assembled anatomy before comparing relationships. No acquired
CT/MRI, patient registration, flow/perfusion measurement or approval is supplied.
X-ray and ultrasound remain pending for these five roots, not silently converted
to negative examinations or marked complete.

## Reference ledger (checked 1 October 2026)

Original brief factual summaries only; linked publications are not product assets.
No abstract passage, publisher figure, table, scan or dataset is redistributed.

- [Akgun et al., 2013](https://pubmed.ncbi.nlm.nih.gov/24023533/): retrospective
  posterior-circulation anatomy study. CTA/MRA groups were separate cohorts;
  not a matched modality-accuracy trial. Do not generalise its nonvisualisation/
  reported absence counts to proven agenesis or universal variant frequencies.
- [Wakao et al., 2014](https://pubmed.ncbi.nlm.nih.gov/25001076/): original 3DCTA
  craniocervical study identifying PICA origin variants, including C1/2 origin.
  Used for variation context, not a surgical-planning or prevalence claim.
- [Bash et al., 2005](https://pubmed.ncbi.nlm.nih.gov/15891154/): historical
  CTA/TOF-MRA/DSA comparative study in suspected vascular disease; used for
  modality and flow-related limitations, not modern protocol superiority or
  accuracy percentages. Small-vessel/flow-coherence details verified in indexed
  primary full-text search extract; no paper media imported.
- [Korogi et al., 1997](https://pubmed.ncbi.nlm.nih.gov/9010532/): original
  source-image/MIP study. Quantitative and visual observer results differed;
  no claim that source images uniformly improve all reads or guarantee detection.

PMC/publisher full-page fetches encountered a browser gate/403. PubMed primary
abstracts and indexed primary-paper extracts support this limited scope; no
blocked access bypass was attempted. Bibliographic access is not a media licence.
Existing BodyParts3D4.0/CC BY4.0 attribution retained; no new dependencies, assets,
fonts, textures, services or mandatory fees.

## Review and reproducibility

Before clinical acceptance, the radiologist must check exact side/source scope,
CTA versus routine CT language, MRA flow/projection limitations, variable origins,
the difference between nonvisualisation and disease/agenesis, and the absence of
validated segment boundaries or patient-specific correspondence. Each reviewed
lesson/source/renderer revision must be recorded; prior approval cannot carry over.

```
npm run cerebellar-mca-imaging:test
node scripts/validate-foot-sesamoid-teaching.mjs
node scripts/test-brain-connections-quiz-history.mjs
node scripts/validate-content-contract.mjs
node scripts/validate-body-review.mjs
```

The new validator compares all9,936root topic slots with the exact prior Git
application, checks ten changed drafts/9,926unchanged topics, mutated source
rejections, cloned arrays, model bytes and five actual review-material packets.
An explicit test-only adapter replays this transition before older history tests;
recorded prior hashes are not altered. Actual browser and backup evidence belongs
to the main coordination checkpoint, not an inference from these commands.
