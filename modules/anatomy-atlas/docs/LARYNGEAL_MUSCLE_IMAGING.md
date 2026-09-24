# Intrinsic laryngeal muscle imaging orientation

Seven retained Head/neck and Whole body selections gain CT/MRI orientation
drafts (14 placements, eight family/modality concepts). Existing information
panels and the intrinsic/posterior laryngeal study windows are reused; no new
controls, source surfaces or study data. All other 9,922 topics and recipes
remain unchanged, including Anatomy/Function, pathology, clinical, X-ray and US.

| Family | FMA identities | Source files |
| --- | --- | --- |
| Posterior cricoarytenoids | 46577 / 46578 | FJ2800 / FJ2782 |
| Lateral cricoarytenoids | 46580 / 46581 | FJ2796 / FJ2778 |
| Transverse arytenoid | 46582 | FJ2809 |
| Oblique arytenoids | 46584 / 46585 | FJ2798 / FJ2780 |

## Sources and commercial boundaries

Original short factual summaries, not imported illustrations or publisher prose:

- [TTUHSC El Paso larynx/neck anatomy table](https://anatomy.ttuhscep.edu/schemes/larynx_tables.html): anatomical landmarks used for orientation. No table, artwork or media licence is imported.
- [Romo and Curtin, AJNR 1999](https://pmc.ncbi.nlm.nih.gov/articles/PMC7056085/): clinical CT/MRI source for posterior cricoarytenoid localisation and the role of adjacent fat in boundary visibility. No disease criteria, numeric results or images are reproduced.
- [Kishimoto et al., Journal of Anatomy 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8349453/): high-resolution cadaveric MRI feasibility, explicitly distinguished from routine in-vivo imaging.

Primary-study passages were available through indexed PMC text; direct PMC and
publisher opens intermittently returned access/error pages. No paywall or access
control was bypassed. The anatomical table was directly read. No scan, PDF,
figure, table, external dataset, dependency, font, texture or mandatory fee is
added. Existing BodyParts3D CC BY 4.0 notices are retained. Reference access does
not imply commercial permission to import article assets.

## Review boundaries

All notes are source-bound drafts, not confirmed visibility of every muscle on
a routine acquisition. No study is loaded or registered. These surfaces do not
certify patient-specific contours, individual fibre tracking, denervation,
airway lumen, mucosal layers, vocal-fold motion, endoscopic findings or procedural
planes. Atlas, case and paid-lecture access remain independent.

Radiologist sign-off must verify each label-to-mesh identity, side, expected
relationships, modality wording and scan-dependent visibility. Review actual
acquisitions separately before any scan link, patient-frame registration or
clinical approval. The source hold set is unchanged.

## Engineering verification

`node scripts/pin-laryngeal-muscle-imaging.mjs --check` reconstructs immutable
prior lessons from Git `2c77186ba09a21ab07f2e05ac5dc6be04fa4b50e`.
`npm run laryngeal-muscle-imaging:test` checks the 14 placements, 9,922 untouched
topics/recipes, all source bundles, exact identities, altered-identity rejection,
the real viewer-note callback and citation links, detached arrays, and rejection
of mixed/unrecorded history. Historical replay is test-only, never an approval
mechanism. Use the coordinating checkpoint for completed broad checks, recovery
and hosted availability; source tests are not device or clinical acceptance.

Verified 24 September: immutable baseline and transition replay pass; the
focused check renders all 14 notes and 25 reference links, rejects 238 identity
mutations, and preserves the other 9,922 topics. The spinal-disc regression,
33,445 broad content checks, 1,104-selection body review, TypeScript and shared
regional production build pass. The build retains its large-chunk warning.
No new browser/device acceptance or clinical approval is claimed.
