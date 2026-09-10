# Renal vascular study

Select either kidney in Abdomen or Whole body, then **Explore renal vessels**. Alternatively search the vessel name or FMA ID: the exact nested part opens selected and isolated. Closing returns to the main atlas with its captured camera. No new permanent toolbar or page is introduced.

## Included anatomy

| Side | Source-labelled group | Tree / source files |
| --- | --- | --- |
| Right | Ureteric renal arterial segment · FMA70492 | PART-OF / FJ3581, FJ3582 |
| Left | Ureteric renal arterial segment · FMA70493 | PART-OF / FJ3481 |
| Right | Inferior suprarenal artery · FMA69265 | PART-OF / FJ3584 |
| Right | Renal vein · FMA14335 | ISA / FJ3577, FJ3578 |
| Left | Renal vein · FMA14336 | ISA / FJ3477, FJ3478 |
| Right | Suprarenal vein · FMA14343 | ISA / FJ3580 |
| Left | Suprarenal vein · FMA14349 | ISA / FJ3480 |

Four right and three left selectable groups preserve original source geometry. The side association is a navigation context: adrenal vessels are not labelled as kidney tissue. Source fragments retain their shared group labels. No endpoints, segmental territories or connected lumens are inferred.

The optional context initially shows the same-side kidney, adrenal gland, ureter and root renal artery with the abdominal aorta and inferior vena cava. Context is faint, nonselectable and absent during separation. Only relevant context bundles load, although the small shared renal bundle contains both sides; opposite-side meshes are not rendered.

## Compact controls

- Presets: all supplied vessels, arterial branches, venous groups, adrenal vessels.
- Select, hide, Undo/Redo layers, fade/isolate, frame selection and reassemble.
- Existing camera directions, free rotation and labels.
- Existing separation choices: spread in 3D, layers and lift selected; the optional original-position guide is a display aid, not an anatomical attachment.
- Collapsed axial/coronal/sagittal cutaway and teaching sections. A cut clips supplied surfaces; it does not reveal reconstructed cortex, medulla or a renal collecting system.
- Source-bound search and study links; missing assets expose Retry, and rejected source bindings fail closed.

## Teaching and future integration

Four shared concepts serve seven source-bound parts, within 37 nested concepts / 60 representations. Core teaching and unscored self-checks remain drafts. The [renal teaching extension](RENAL_TEACHING.md) adds 14 shared sections: Pathology/CT/MRI for all seven parts and ultrasound for the ureteric arterial and renal venous groups. Adrenal-vessel ultrasound stays pending. Right- or left-specific reference examples are explicitly identified; a shared lesson is not evidence of equivalent contralateral imaging. Five new references complement the two existing abdominal-table keys, with one combined word budget per source. No reference tables or images are copied.

The opt-in learning registry now supports 1,091 representations (1,031 legacy plus 60 nested), but production still configures zero resources and zero correspondences. The renal study discriminator does not authorize scans or separately paid lectures. Atlas and target-resource access, review clearance, revision and exact source binding remain independent checks. The 2 MB import cap is unchanged; growing test fixtures are validated in bounded batches. This is not live CT/MRI/X-ray/US synchronization or a billing integration.

## Source integrity and rights

The [source audit](RENAL_VASCULAR_SOURCE_REVIEW.md) preceded integration. `scripts/export-renal.mjs` verifies the pinned audit, source holds, raw hashes and deterministic prototype, then changes metadata only. Every exported vertex and triangle index is compared with that prototype. The public GLB contains seven meshes / 14,332 triangles / 266,784 bytes; SHA-256 `410fb0c4179785c91d018e549cd0ffbdd48c8e9919620dc0f32cdac3559c6a3e`.

BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International. Retain attribution and modification notices for commercial distribution. No new dependency, font, texture, paid service, publisher illustration or patient image is introduced. [Asset register](../LICENSES/ASSET_REGISTER.md) and [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md) remain part of distribution.

## Deliberate exclusions and clinical acceptance

- FMA66363/FJ3576 and FMA66364/FJ3476 alternative renal trunks overlap existing arterial courses; they are not double-rendered as additional anatomy.
- FMA69266/FJ3467 left inferior suprarenal artery contains a defective tiny duplicate component and remains withheld. It has not been mirrored from the right or silently repaired. This asymmetry is model coverage, not anatomical absence.
- Cortex, medulla, pyramids, calyces and pelvis are not separately supplied. Complete intrarenal arteries/veins, all adrenal arterial sources, fascia, surrounding fat, variants and lumen continuity remain unvalidated.
- Specialist review must confirm source identity, laterality, scale, assembled relationships, vessel course, fragment grouping and teaching accuracy. No diagnostic measurements, perfusion territories, surgical planes or disease conclusions are supported.
- Browser/GPU, mobile, keyboard/screen-reader, label legibility, overlap and camera/explode acceptance remain pending. Source and controlled-callback tests do not replace those checks.

## Reproducible checks

Run `npm run renal:test`, `npm run renal:export -- --check`, `npm run renal-vascular:audit -- --check`, `npm run renal-vascular:prototype -- --check`, and the `nested-history:test`, `nested-cutaway:test`, `origin-guides:test`, `nested-navigation:test`, `nested-teaching:test` and `nested-learning:test` suites. The exporter needs the documented raw cache and staged prototype; first-time reconstruction follows the source-review scripts. It refuses to overwrite existing generated files; `--check` verifies them in place.

All 53 pre-existing teaching bindings and seven historical parent records remain byte-equivalent as JSON arrays. The root catalogue, source meshes, original renal focus recipes, review database and access policies are unchanged. Build/type checks and the requirement inventory are separate release checks. Publication and same-PC recovery receipts are recorded in the dated checkpoint, not inferred from test counts.
