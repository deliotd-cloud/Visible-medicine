# Orbital nerve and ciliary-ganglion clinical teaching

This document retains its historical milestone counts. The subsequent [central neural extension](CENTRAL_NEURAL_CLINICAL_CURRICULUM.md) adds separate lessons; the orbital suite still tests its current direct/export content and compares unrelated sections through the explicitly pinned historical projection.

## Scope — 9 September 2026

Sixty original Clinical/Pathology drafts cover 28 existing orbital nerve selections and two ciliary ganglia. Fifteen paired definitions bind to 30 individually observed ISA identities and source files. Pairing shares teaching, not inferred geometry or contralateral IDs. The existing tabs, compact layout, dissection controls, branding and meshes are unchanged.

| Teaching group | Paired identities |
| --- | --- |
| Ophthalmic division (V1) | FMA52622 / FMA52623 |
| Frontal | FMA52639 / FMA52640 |
| Supraorbital | FMA52656 / FMA52657 |
| Supratrochlear | FMA52643 / FMA52644 |
| Infratrochlear | FMA52698 / FMA52699 |
| Lacrimal | FMA52629 / FMA52630 |
| Nasociliary | FMA52669 / FMA52670 |
| Anterior ethmoidal | FMA52676 / FMA52677 |
| Posterior ethmoidal | FMA52715 / FMA52716 |
| Long ciliary | FMA82734 / FMA82735 |
| Nasociliary sensory connection | FMA52673 / FMA52674 |
| Superior oculomotor division | FMA52574 / FMA52575 |
| Inferior oculomotor division | FMA52576 / FMA52577 |
| Trochlear (CN IV) | FMA50881 / FMA50882 |
| Ciliary ganglion | FMA53549 / FMA53550 |

The source-labelled single long-ciliary component is not a count of all branches. A ganglion is categorised as an organ within the nervous system; a nerve-only guard would incorrectly omit it. No limb plexus, missing cranial nerve, axonal pathway or nerve ending has been invented.

## Evidence and editorial boundaries

Group-specific citations are included in the displayed/exported lessons. UAMS and Texas Tech university anatomy tables support the branch distinctions; Texas Tech's autonomics module supports root-versus-relay teaching. Stanford neuro-ophthalmology material supports ocular-motor localization and its mimics. AAO EyeWiki supports shingles, corneal sensory disease and tonic-pupil context. The linked published ocular-autonomics review supports the long-ciliary sympathetic component. The published neuro-ophthalmic zoster review supports the limitations of nasal warning signs.

Two primary reports support brow-nerve trauma context: [Stewart et al., 2012](https://pubmed.ncbi.nlm.nih.gov/22914241/) and [Hanwright et al., 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6839972/). Case reports/small selected surgical series are not incidence estimates or general treatment evidence. No procedures, outcome percentages, drug doses, nerve-block instructions or publisher question banks are reproduced.

Brief, original factual synthesis only: no downloaded article, table, illustration, screenshot, texture, scan, publisher prose or model asset is shipped. Reference access does not grant rights to reuse its images. Copyright remains with the respective publishers/authors; no new asset licence, dependency, service or fee is introduced. Links were checked on 9 September 2026; this is not a systematic review or legal/clinical clearance.

Where only an anatomical consequence is supported (for example, an isolated small sensory branch injury), the lesson explicitly says **anatomical inference**. It does not invent a named syndrome. Corneal sensation, pupil examination, tear production, eye alignment and lesion localization require clinical evidence, not mesh appearance. [NHS double-vision guidance](https://www.nhs.uk/symptoms/double-vision/) supplies UK-specific urgent/emergency wording; local service wording needs review before other jurisdictions use it.

## Contract and checks

`lib/orbital-neural-clinical-curriculum.ts` accepts only the exact FMA, category, source tree, ordered files, side and primary/ordered regions for these selections, and only the two specified tabs. Results retain coverage notes and return independent arrays. Current runtime and export use current lessons; nothing is marked clinically approved.

The before capture was taken at clean source `0f5d8a8563b12120f8a3e734cca04cfc6507da5a`. Its pinned projection precedes hand/foot-bone history, giving 44 offline projections / 2,778 explicit section changes. Original baseline and previous captures remain unchanged. The previous hand/foot report now labels its milestone totals; its current direct/export assertions remain active.

Run `npm run orbital-neural-clinical-curriculum:test -- --source`, prior orbital-nerve/neural-anatomy and acral-bone clinical suites, the content contract, requirements freshness, TypeScript and the production build. Tests reject mismatched identities, unintended copy changes and held-readiness changes, and compare source rows and exported sections. Source-index checks use the separately retained official index in `work/bodyparts3d`.

Clinical and Pathology each now have 599 draft / 423 pending body entries. Anatomy remains 1,020 draft / two identity-only, Function 1,018 draft / four pending; CT/MRI/US and Quiz are unchanged. The other 24 nervous-system selections remain pending for clinical teaching, including the disputed forniceal commissure. This is a milestone within the whole-atlas goal, not completion of nervous-system coverage.

## Remaining acceptance

Independent anatomy, ophthalmology/neuro-ophthalmology and neuroradiology review must check every branch/side mapping, sensory versus motor distinction, autonomic relay, disease association, evidence caveat and warning. Review paediatric applicability separately. Geometry completeness, real imaging registration, interactive/device testing and clinical approval are separate gates. No browser or patient-image acceptance is claimed by these automated content checks.
