# Genicular ultrasound teaching draft

The scoped selections are right and left middle genicular arteries (FMA22562, FMA22563) and right and left inferior lateral genicular arteries (FMA43892, FMA43893). Each side uses a shared, source-limited group summary in `content/genicular-ultrasound.ts`. The summaries are original text and link to the primary papers; no publisher media or clinical images are included.

- [Watanabe et al. (2013)](https://doi.org/10.7600/jpfsm.2.243) used B-mode localisation and pulsed Doppler for middle genicular blood flow in ten healthy young men, examining the right knee. This does not establish a detection rate, left-side validation, or correspondence to an Atlas mesh.
- [Karimov and Madrakhimov (online 2023; issue 2024)](https://doi.org/10.1007/s00264-023-05977-6) assessed 12 selected total-knee-arthroplasty patients who required lateral release (seven right, five left). Day-one postoperative Doppler found an inferior lateral genicular artery in eight knees. Their ten-of-twelve intraoperative *transillumination* result identified at least one lateral artery and is a different observation.

Neither cohort establishes routine bilateral visibility in unoperated knees, a side-specific rate, patient-specific vessel boundaries, or correspondence between flow and the static source surface. Independent ultrasound acquisition, image-to-model registration, revision-bound radiologist approval, and appropriate case/Atlas/lecture access remain separate gates. This material supplies no procedural route, safe zone, diagnosis, or treatment advice.

## Verification epochs

`npm run genicular-ultrasound:test` proves the complete original transition from
`20988a1b` to the immutable feature revision `fc894122`: four authored ultrasound
placements and four Review packets change; the other9,932 placements and1,100
packets remain unchanged in that transition. Later unrelated teaching additions
are not represented as genicular regressions.

The same command bundles the actual current helper and resolver, requires their
genicular implementation to match that feature revision, checks all36 topic
placements and four Review packets for the target structures, and retains its
identity-mutation, forged-packet and stale/forged-decision refusals. Source and
teaching context remain fixed; renderer and geometry decision hashes must bind
the current audited renderer instead of an obsolete historical renderer.

These are source/security regression checks, not clinical approval, measured
ultrasound visibility or a promise that every unrelated current test passes.
