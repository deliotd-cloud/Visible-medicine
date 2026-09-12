# Thoracic-bone imaging orientation

Select an existing rib or sternal part in Thorax or Whole body, then use the existing Imaging group. CT, MRI, X-ray and Ultrasound each provide an original, introductory draft. This change adds no toolbar, nested menu, image gallery or geometric surface.

## Scope

27 selections: 12 left ribs, 12 right ribs, manubrium, sternal body and xiphoid. All four modality tabs were pending. Eight shared modality explanations (rib/sternum × four modalities) and eight landmark groups produce 108 placements, **not 108 independent lessons or new structures**. Rib groups distinguish first, second, 3–7, 8–10 and 11–12; each sternal part has its own landmark note. These are whole source bones, not separately segmented landmarks, cortex, marrow, joints or costal cartilages.

The notes distinguish X-ray projection from a rotated surface, CT source sections from a 3D reconstruction, MRI tissue signal from highlight colour and sonographic cortical visibility from atlas transparency. Sternal developmental defects are not automatically labelled fractures. The costal-margin description is conventional introductory anatomy; rib-number, cartilage and articulation variants need review and are not inferred from this one specimen. No congenital variant, disease or respiratory movement is simulated.

## References and rights

Checked 12 September 2026. Only brief original factual synthesis and external links; no quotation or imported media. References may themselves require publisher access; no purchase is needed to use the locally authored notes.

- [TTUHSC El Paso thoracic bone table](https://anatomy.ttuhscep.edu/anatomytables/bones_thorax.html): regional landmark identities. The table is copyrighted and is not reproduced. Its broad assertions about all rib-head joints and true-rib synovial joints are not adopted; atypical ribs and the first sternocostal joint require distinction.
- [Mansour et al., RadioGraphics 2022](https://pubs.rsna.org/doi/full/10.1148/rg.210095): chest-wall modality strengths and limitations, not a lesion catalogue or diagnostic algorithm.
- [Restrepo et al., RadioGraphics 2009](https://pubs.rsna.org/doi/full/10.1148/rg.293055136): sternal projection, CT anatomy and developmental variants. No figures downloaded.
- [ACR/RSNA Body CT](https://www.radiologyinfo.org/en/info/bodyct): acquired sections, reformations and simultaneous tissue depiction. No acquisition protocol imported.
- [Chest-wall ultrasound review, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11558486/): accessible superficial cortex and acoustic-shadow limitations. Relevant indexed text was accessible; direct PMC page access returned a browser challenge. No bypass or media download attempted.
- [Naeger, Diseases of the Pleura and Chest Wall, 2025](https://www.ncbi.nlm.nih.gov/books/NBK621648/): MRI assessment of chest-wall tissue planes. No treatment, staging or management recommendations imported.

Existing model licence/attribution remains BodyParts3D CC BY 4.0. No new mesh, dependency, font, texture, runtime AI service or mandatory fee. Linked reading does not grant media reuse or access to separately entitled Visible Medicine lectures.

## Binding and verification

`content/thoracic-bone-imaging-pins.json` pins 27 complete source records, two bundle hashes and the source frame. Exact runtime signatures reject altered records; matching only a display name or FMA code cannot attach the lesson. Prior pending values and all preceding teaching/recipes are recorded before integration. The append-only authoring transition checks current lesson hashes before reconstructing earlier milestones offline; it neither supplies runtime fallback content nor migrates private approvals.

Run `npm run thoracic-bone-imaging:test`. It verifies source-tree rows, level/group correspondence, model hashes, detached lesson values, content schema/exports, corrupted identity rejection, prior teaching/recipe preservation and rendering of the actual existing notes callback. No browser, GPU or patient dataset is used. The dependency-derived display revision is refreshed so old approvals cannot silently apply to changed teaching.

The older limb-bone validator's frozen `body-explorer.tsx` comparison predated the intentional foot/hand partner additions. Its one UI-file reference is now the exact accepted wrist/hand revision `a62e32a48df22b34810fb36bd80ce51467551e16`; all other preserved-file references and old lesson/pin hashes remain unchanged. The thoracic validator independently checks that UI file against the same pre-change source. This is an explicit historical-test repair, not a skipped assertion or clinical approval.

The imaging-link validator also retained an obsolete count of 1,060 versus the existing 1,078 admitted representations. Its count-only assertion now checks exact catalogue IDs, uniqueness, names and source provenance for every reference; all transform, patient-frame rejection, selection and event tests remain in place. No imaging runtime code changed.

## Remaining sign-off

The owner radiologist must approve wording, rib numbering/laterality, landmark visibility, rib/cartilage variants, sternal fusion/ossification variation and modality limitations. Detailed sequence-specific interpretation, graded pathology examples and independently licensed scan series remain outstanding. Live registration requires validated patient/series/frame correspondence, not a name match or generic slice plane. Lecture entitlements remain independent of atlas access. Device/browser acceptance and runtime publication are separate from automated tests. No clinical approval is created by this change.
