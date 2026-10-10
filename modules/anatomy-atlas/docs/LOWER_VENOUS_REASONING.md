# Lower-limb venous reasoning — draft

Six original questions complement the existing venous guided tour using the
current Practice → Apply anatomy controls. Both sides of small saphenous, popliteal,
femoral, great saphenous, external iliac and common iliac veins are bound to their
12 exact existing source records. Side is not a mirror transform. Left external
iliac remains a four-file aggregate; no new tributary segmentation is implied.

The bank grows from 170 to 176 concepts and 313 to 325 bound representations.
One question per concept prevents bilateral duplication in a session. Existing
same-side alternatives, loaded/visible/focus/retry filters, answer-once scoring,
feedback disclosure and exam behavior are reused without engine or UI changes.
Regional foot/leg/thigh/pelvis/abdomen scopes require a visible authored alternative;
hidden or unloaded targets cannot become questions.

## References and rights

Original concise factual synthesis refers to official TTUHSC
[posterior-limb](https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_tables.html)
and [thigh](https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html)
teaching, [Meissner et al.](https://med.stanford.edu/content/dam/sm/vascular/documents/endovasc/guidelines/hemodynamics_and_diagnosis_venous_disease-jvs_1207.pdf)
for anatomy/nomenclature only (not current management), and
[Dao and Le](https://www.ncbi.nlm.nih.gov/books/NBK554574/) for usual pelvic drainage.
Reading citations are not asset licences. No publisher images, tables, media,
datasets, question-bank text, fonts, models or dependencies were imported. Existing
commercial-compatible geometry credits and notices are preserved.

## Clinical review

All six concepts are revision 1 drafts, not validated assessments. Review the usual
superficial/deep drainage, variable small-saphenous termination, femoral terminology,
pelvic continuities and each exact source boundary. Junctions, valves, perforators
and complete calf deep veins are not independently delineated. No lumen, flow,
reflux, compressibility, thrombosis diagnosis or registered patient images are proven.

Only 12 worksheets gain new reasoning material; 1,092 other teaching fingerprints
and all 9,936 topic placements stay unchanged. Earlier teaching approval cannot
cover a newly expanded worksheet. Display pins include exact choices, answer,
references and source hashes. The conservative renderer dependency fingerprint
also advances because the question-bank closure changes; that is not a claim that
model geometry changed. No approval is carried forward automatically.

CT/MRI/US comparison requires independently cleared imaging and mappings through
Didanix Education/light. Atlas, case and separately paid lecture access remain
independent. Patient data, CT-head masks and the clinical desktop PACS stay out of
this work. Source tests/builds do not prove signed-in browser, GPU, camera-flow or
radiologist acceptance. Website import and publication are separate checkpoints.

## Reproduce source checks

Run from the Atlas source checkout, with temporary files and logs on E:

```text
node scripts/pin-lower-venous-reasoning.mjs --check
node scripts/test-lower-venous-reasoning.mjs
node scripts/generate-body-review-display-pins.mjs --check
node scripts/body-renderer-revisions.mjs --check
node scripts/validate-reasoning-practice.mjs
node scripts/test-body-reasoning-review.mjs
```

Pin generation refuses a catalogue differing from source 193fb837. Focused checks
exercise actual practice/review components, complete official file membership,
identity mutations, scoring/filtering, stale teaching revisions and preservation
against that exact baseline. Older milestone assertions retain their original
question-bank snapshots; an explicit historical replay is not current-bank acceptance.
The general practice and shared Review commands validate the actual current bank;
the thoracic-core command explicitly retains its immutable 170-concept milestone.
