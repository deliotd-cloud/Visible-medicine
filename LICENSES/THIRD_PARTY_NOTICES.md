# Atlas navigation additions

## Incremental native head-asset checksum verification (17 October 2026)

`@noble/hashes` is pinned to version2.4.0 under the MIT licence, copyright2022
Paul Miller. The exact licence is retained in `head-atlas-noble-hashes-LICENSE.txt`.
Upstream: https://github.com/paulmillr/noble-hashes/tree/2.4.0.
Only the SHA-256 submodule is imported for local asset integrity checks. This
package has no runtime dependencies; no paid service, patient dataset, image,
model, font or texture is added. MIT permits commercial redistribution subject
to retaining its copyright and licence notice. This supplements existing notices
and does not confer clinical approval or a new whole-project rights audit.

## MRI only anatomy understanding checks

The four questions in `lib/head-mri-anatomy-checks.ts` are original. Their
explanations reuse the existing original MRI-only teaching summaries, credited
to UTHealth Neuroscience Online (Amygdala and medial cerebral structures) and
NIH/NCI SEER (pituitary anatomy). Full reference metadata and links remain in
the bound teaching packet and `docs/HEAD_MRI_ANATOMY_CHECKS.md`. No publisher
text, figures, scans, models, datasets, fonts, textures, new dependencies or paid
services were imported. Citations do not license source media. This addition
is not a new whole-project rights audit or clinical approval; earlier notices
remain in force.

## MRI only pituitary and callosal clinical correlations

`lib/head-mri-only-clinical.ts` contains original short factual summaries and
authored reflections. References: Mark Gurnell's 2025 Pituitary Society official
congress abstract, printed page 12 / PDF page 14, and Förster et al. 2022
(PMID 35478124, DOI 10.21873/invivo.12838). Exact links, evidence limits and access
date are retained in the packet and `docs/HEAD_MRI_ONLY_CLINICAL.md`.
No publisher text, figures, scans, meshes, datasets, fonts, textures, dependencies
or paid services were added. Citation does not license source assets. This is
not a new whole-project rights audit or clinical approval; earlier notices stand.

## Cerebral lobe clinical correlations (11 October 2026)

`lib/head-lobar-clinical.ts` contains original short factual summaries and
authored reflections. Primary citations: Dronkers et al. (PMID 17405763),
Mort et al. (DOI 10.1093/brain/awg200) and Zhang et al. (PMID 16567710).
Links, study limits and access date are retained with the content and in
`docs/HEAD_LOBAR_CLINICAL.md`. No publisher text, figures, scans, models,
datasets, fonts, textures, dependencies or paid services were added. Citations
do not license the publishers’ images. This is not a new whole-project rights
audit or clinical approval; existing notices remain in force.

## Cerebellar clinical correlations (11 October 2026)

`lib/head-cerebellar-clinical.ts` contains original factual summaries and authored
reflection questions. Primary citations: Stoodley et al. (PMID 27812503), Ilg et al.
(PMID 18835866), Hwang et al. (PMID 22305149), Oppenheim et al. (PMID 11003275).
Exact links, scope and access date are retained with the content and in
`docs/HEAD_CEREBELLAR_CLINICAL.md`. These are factual references, not imported
article passages or permission to redistribute publisher material. No figures,
media, scans, models, datasets, font, texture, dependency or paid service added.
This is not a new whole-project licensing audit or clinical approval.

## Linked anatomy checks (11 October 2026)

The 25 questions in `lib/head-anatomy-checks.ts` are original. Explanations reuse
the existing original factual notes in `lib/head-atlas-teaching.ts`, with their
institutional reference links retained. These references are factual citations,
not permission to redistribute publisher text, figures or datasets. No source
media, scan, model, font, texture, new dependency or paid service was imported.
See `docs/HEAD_ANATOMY_CHECKS.md` and `docs/HEAD_TEACHING_DRAFT.md` for scope and
remaining review. This addition is not a new whole-project licensing audit.

## Cerebellar native CT/MRI teaching (10 October 2026)

`lib/head-cerebellar-teaching.ts` contains original factual summaries and authored
exercises. References: UTHealth Neuroscience Online, Cerebellum (James Knierim),
https://nba.uth.tmc.edu/neuroscience/s3/chapter05.html and Neuroanatomy Online,
https://nba.uth.tmc.edu/neuroanatomy/L5/Lab05p22_index.html (accessed 10 October 2026).
These are factual citations, not imported assets or permission to redistribute
the publishers' prose, figures or datasets. No source illustration, media, scan,
new dependency, font, texture or paid service is included. Teaching remains a
separately revision-bound draft; this is not a new whole-project licence audit.

The modality tiles' image credits, exact sources, adaptations and licence links
are retained in [public/media/atlas/NOTICES.md](../public/media/atlas/NOTICES.md).
The 3D image is an adaptation of BodyParts3D under CC BY 4.0; the four imaging
previews use CC0. All are served locally. No new package, font, texture, fee,
external image service or patient dataset was added in this navigation change.

This supplements, and does not replace, each generated Atlas runtime's existing
LICENSES/THIRD_PARTY_NOTICES.md, BUNDLED_NOTICES.txt and model-specific credits.
It is not a claim that the entire existing website has been freshly re-audited.

## Private native head-atlas viewer (7 October 2026)

This authored module reuses the installed Three.js 0.185.1, React Three Fiber
9.7.0 and Drei 10.7.8 packages; no dependency, font, texture, external model,
paid service or runtime API has been added. These renderer packages declare MIT.
The installed Three.js and Drei licence texts are retained alongside this notice;
the existing `clinical-review/react-three-fiber-LICENSE.txt` retains the Fiber
notice. Existing React and transitive package notices remain applicable. This
narrow reuse check does not replace the project's wider dependency audit.

The owner's CT/MRI images, approved masks, surfaces and annotations are **not**
redistributed here and must not be inferred to be MIT, CC0 or a public dataset.
The private selected v1.0.2 release records owner-confirmed consent/permission,
not independent certification. A lossless browser transport is kept outside the
repository and public assets. Software licensing is separate from clinical,
privacy, data-rights and actual publication approval. No hosting cost guarantee
or automatic deployment authority follows from use of permissive software.

## Original head teaching summaries (8 October 2026)

The 25-note draft references UTHealth Neuroanatomy/Neuroscience Online, Duke's
surface-anatomy lab, and the credited Ostman/Bakshi publications. Exact URLs,
access dates and reuse decisions are in `lib/head-atlas-teaching.ts` and
`docs/HEAD_TEACHING_DRAFT.md`. References are not redistributed assets: no source
text, figures, diagrams, images, scans, segmentation, models or datasets were
imported. UTHealth/Duke reference content is not assumed permissively licensed.
Only independently written factual summaries and editorial exercises are added;
no package/font/service or new licence/fee obligation is introduced. This narrow
record is not a legal clearance or fresh audit of all historical website assets.

## MRI-only teaching extension (8 October 2026)

Four separate original teaching drafts cite UTHealth's amygdala/medial-cerebrum
teaching and NIH/NCI SEER's pituitary anatomy. Exact URLs, access date and reuse
decisions are in `lib/head-mri-only-teaching.ts` and
`docs/HEAD_MRI_ONLY_TEACHING.md`. NIH/NCI SEER is credited; no institutional
endorsement is implied. References do not grant redistribution rights: no source
text, figures, images, meshes or datasets were imported. No new asset, dependency,
font, service or fee is added. The current OpenStax A&P 2e pituitary page was
excluded for its non-commercial/AI-use restrictions; no material from it is used.

## Insula teaching extension (8 October 2026)

Two original summaries cite UTHealth's Insular Lobe teaching and Truwit et al.,
Radiology 1990 (PMID 2389039). Exact references, access date and reuse decisions
are in `lib/head-insula-teaching.ts` and `docs/HEAD_INSULA_TEACHING.md`.
These are factual references, not redistributed assets or inferred permissions:
no source passages, figures, images, meshes or datasets were imported. No new
dependency, font, service or fee is added. This entry is limited to this extension,
not a legal clearance or renewed audit of historical website assets.

## CT-only skull-bone teaching (9 October 2026)

Six short independently written factual summaries reference OpenStax, Anatomy
and Physiology 2e, section 7.2 (The Skull). Exact URL, access date and reference
scope are in `lib/head-ct-bone-teaching.ts`. This is a factual reference, not an
imported or relicensed asset: no publisher text, figures, images, questions,
models or datasets are redistributed. The source is not represented as having
a permissive commercial licence. No new dependency, font, service or fee is
introduced. This limited entry does not clear historical assets or replace
clinical review of the original teaching draft.
