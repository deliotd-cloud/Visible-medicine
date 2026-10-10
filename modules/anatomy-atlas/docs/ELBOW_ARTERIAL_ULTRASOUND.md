# Elbow arterial ultrasound orientation — draft

Eight existing bilateral selections gain original US orientation text: superior
and inferior ulnar collateral, posterior ulnar recurrent, and radial recurrent
arteries. No geometry, branches, images, patient registration or clinical approval
is added. Source baseline: `4897aacb28b4d99d34b893493b8706ede54db970`.

Full identities and former pending lessons are frozen in
`content/elbow-arterial-ultrasound-pins.json`; the separate transition freezes the
eight authored lesson hashes. Dispatch refuses modified source identities.
Learner and Review use the same draft. New teaching needs new revision-bound review;
prior approvals cannot migrate to the changed material.

## Evidence and reuse

- Ferre-Martinez et al., *Diagnostics* 2023;13:1332,
  [DOI](https://doi.org/10.3390/diagnostics13071332): cadaveric US/anatomical
  correlation; latex injection is explicitly retained as an experimental limit.
- Rossmann et al., *Ultrasound in Medicine & Biology* 2021;47:3393–3402,
  [PubMed](https://pubmed.ncbi.nlm.nih.gov/34479732/): contrast-enhanced cadaver
  perfusion experiment, not a clinical Doppler identification protocol.
- Mohana-Borges et al., *Skeletal Radiology* 2025;54:493–507 (online 2024),
  [DOI](https://doi.org/10.1007/s00256-024-04740-1): variable radial branch/nerve
  crossings; detection-related volunteer exclusions are explicitly preserved.

Checked 10 October 2026. First and third articles declare CC BY 4.0;
Rossmann's article reserves rights. References supply factual evidence only:
no figures, prose extracts, tables, scans or article files are redistributed.
Original wording/code use the project licence; existing mesh notices remain.
No dependencies, paid services or new third-party assets.

## Acceptance still required

Radiologist review must check each exact draft revision and whether the cautious
research-to-orientation scope is useful. No actual acquired-US acceptance, vessel
continuity, nerve geometry, perfusion diagnosis or intervention guidance is claimed.
Website runtime import is a separate step; an Atlas source change is not deployment.

Focused regression: `node scripts/test-elbow-arterial-ultrasound.mjs`.
It independently replays the source baseline, checks all 9,936 root topics,
all 109 bundle bytes, source refusals, Review parity and stale decision rejection.

Verification: 8 changed / 9,928 preserved root topics, 328 mutated identities
refused, 40 forged Review packets rejected, 24 stale decisions rejected before
storage. Nonincremental TypeScript, current/archive source holds, generated Review
checks and the 33,468-check content contract pass. The requirement inventory is
regenerated. No production build or browser acceptance is claimed for this batch.

The content-contract run also exposed nine stale shoulder export geometry-revision
fields already inconsistent with baseline inputs. Those fields were regenerated
only after proving the source anatomy, manifest, revision file and exporter were
unchanged from the baseline; every other export field is identical. This is a
fixture correction, not new geometry or approval. Original failure and exact
before/after evidence remain in the local checkpoint.
