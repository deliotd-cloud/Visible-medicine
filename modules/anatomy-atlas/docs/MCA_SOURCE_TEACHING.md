# Right MCA · source-part explanations

Three existing selections now have original source-scoped draft explanations:
FJ1662, FJ1663 and FJ1692. No mesh, source file, anatomical identity or missing
left counterpart is added. Open the right middle cerebral artery's source-part
study in Head/neck or Whole body, select a file, then expand the existing Learn
more panel. No extra toolbar or navigation tab is introduced.

## Deliberately limited teaching

Each Anatomy explanation names the selected file, its inherited parent FMA and
its particular identification pitfall. FJ1662/FJ1663 have repeated source-header
descriptions but different identities; archive order does not establish clinical
branch order; FJ1692's header does not certify an M1 boundary. Parent-MCA context
is explicitly labelled, not presented as the selected file's territory.

Three distinct unscored self-checks address those pitfalls. CT and MRI notes
distinguish acquired angiographic examinations from source surfaces. Function,
Clinical and Pathology remain **pending for the component**, preserving teaching
sign-off blockers. X-ray/ultrasound and acquired-image correspondence remain
pending. A visible note is not a clinical approval, registered scan link, vessel
patency claim or complete curriculum. The later [PICA source explanations](PICA_SOURCE_TEACHING.md)
add 26 separately bound file drafts, without changing these MCA notes or silently
substituting a parent paragraph for a child.

## References and commercial scope

- [UAMS artery table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-head-and-neck/): parent-MCA origin and broad cortical supply only. No source-file mapping.
- [Bash et al., AJNR 2005, original abstract](https://pubmed.ncbi.nlm.nih.gov/15891154/): comparison of acquired CTA, TOF MRA and DSA in 28 patients; not validation of these files. No modern diagnostic-performance recommendation is inferred.

References checked 2 October 2026. Concise original paraphrases and links only;
no copied text, figures, scan images, meshes, fonts, datasets or dependencies.
The already admitted BodyParts3D CC BY 4.0 meshes retain existing attribution and
change notices. Free-to-read papers are not treated as licensed reusable image
collections. Existing THIRD_PARTY_NOTICES and asset holds remain unchanged.

## Identity, review and verification

`content/mca-source-teaching-bindings.v1.json` binds each lesson to its complete
parent record, selected record and exact child bundle. The dedicated pin script
refuses to overwrite existing changed bindings. FMA50082 alone cannot select a
lesson; all three child files share that parent FMA but have separate concepts.
Changed source, side, geometry record, file order, parent or selected identity
rejects the lesson instead of falling back to another child/parent.

Review packets use actual lesson bytes/references, source hashes and renderer
revisions. Only these three authored teaching payloads change; unrelated source and teaching
remain fixed. The renderer dependency graph conservatively changes display
revisions when the new teaching module is added. No stored opinion is read or
migrated; earlier acceptance never silently applies to new material. Imaging
approval remains unavailable and the three missing core topics block teaching
sign-off.

Run `npm run mca-source-teaching:test`, the cranial-component, nested-teaching,
nested-review, nested-navigation and nested-learning checks, then types/build.
The new tests compare all other selections against the exact pre-change source,
exercise altered-record rejection and render the real folded teaching component.
They are not browser/GPU acceptance or anatomical/clinical sign-off.

Next: radiologist adjudication before finer branch names or clinical territories;
then reviewed acquired-image correspondence without inventing missing anatomy.
