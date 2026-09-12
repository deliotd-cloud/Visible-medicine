# Pelvic-organ imaging orientation

## Scope

This addition fills 44 previously pending introductory CT/MRI/X-ray/Ultrasound placements for 11 existing source selections. Seven teaching groups cover bladder, prostate, paired seminal vesicles, paired ureters, male-reference urethra, paired testes and paired epididymides. There are 24 distinct modality topics, seven anatomical orientation notes and seven explicit model-limit notes; shared plain-film/scrotal-CT limits are not counted as unique lessons.

These are draft orientation notes, not comprehensive radiological training, acquired images, a segmentation, a scanning protocol, diagnostic decision support or clinical approval. Prostate zoning/PI-RADS, bladder-wall staging, scrotal tissue characterisation and urethral segment measurements are not modelled. The source donor is male; these records do not substitute for the separate female-pelvis specimen. Rectum, appendix and ductus deferens are outside this bounded addition.

## Use

Select a supported organ in Pelvis or Whole body, then open its existing imaging tab. Ureters are also available in Abdomen because their established regional memberships span both areas. No extra toolbar, layout or viewer control is added. The UI still states **No imaging study loaded**. Scrotal organs' inclusion in the Pelvis navigation group is explicitly not a claim that they lie within the pelvic cavity.

The notes distinguish routine pelvic CT, CT/MR urography, transrectal prostate ultrasound, scrotal ultrasound, specialised sonourethrography, retrograde urethrography and voiding cystourethrography. A method being described is not a recommendation to obtain it in a particular patient. Actual images, orientation, contrast technique, acquisition and patient anatomy require independent review.

## Source and implementation

- `content/pelvic-organ-imaging.ts`: concise original teaching with primary institutional/society references, exact group FMA IDs and explicit model limits.
- `content/pelvic-organ-imaging-pins.json`: immutable admission from source `b1e371033ce1ad851d57badea5d7a72ced78d23d`, including exact structure records, original pending lessons, preceding whole-atlas content/recipe hash, coordinate frame and four source bundles.
- `lib/pelvic-organ-imaging.ts`: exact-record resolver. Changes to identity, laterality, source files/hashes, regions, coordinates or validation fields prevent application; no name matching, mirror invention or transfer to another specimen.
- `app/body-content.ts`: integrates into the current source-bound content resolver and exported content database without changing controls, entitlements, imaging events or private CT workflows.

The original anatomy/function/clinical/pathology/quiz sections and all unrelated structures are preserved. No source model, triangle, normal, source ID, dependency, font, image or patient data is added or altered. The source-image candidates discussed with the owner are not imported by this change.

## Verification

Run `node scripts/pin-pelvic-organ-imaging.mjs --check` and `node scripts/validate-pelvic-organ-imaging.mjs`.

The validator checks source ontology rows and all four bundle hashes; 44 pending-to-draft changes; preservation of all 9,739 other root-topic placements via the pinned pre-change whole-content/recipe hash; 616 altered-source rejection cases; content schema/export parity; defensive-copy behaviour; and 44 server renders of the existing real notes callback. Its evidence is saved in `docs/pelvic-organ-imaging-validation.json`. Reference-derived word counts are checked per linked source, with original short model limitations recorded separately. These are CPU/schema/SSR tests, not browser, mobile, GPU, clinical or image-registration acceptance.

## Reference and licence boundary

Primary factual references are linked in the individual tabs: NIDDK urinary-tract imaging; NCI SEER male accessory-gland anatomy; ACR/RSNA RadiologyInfo urinary, prostate, scrotal and plain-film guidance; ACR scrotal appropriateness evidence; EAU urethral-stricture diagnostic guidance. Accessed 12 September 2026. Reference links do not grant reuse of publisher images, diagrams, questionnaires or guideline tables. No such assets are redistributed. Existing BodyParts3D CC-BY-4.0 attribution remains mandatory; original code and short authored teaching follow the project's existing MIT terms.

## Remaining acceptance and next work

The owner radiologist should review the teaching distinctions, source identity/sex/side and clinical limitations as a regional batch when ready. Clinical input on CT-head segmentation stays in **Visible medicine— CT Head Atlas**; this addition neither modifies nor approves its masks.

Next prioritise the most useful remaining real-imaging or substantive regional anatomy gap rather than repeating these introductory notes. The normal-kidney ultrasound candidate is promising but still needs exact-file provenance, individual image reuse/privacy review and clinical selection before inclusion. Its adoption must distinguish illustrative images from spatially registered scans. No paid lecture access should be inferred from an atlas subscription.
