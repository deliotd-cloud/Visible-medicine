# Whole-body skin candidate — 26 September 2026

Status: original source acquired, seam-screened and compared with selected internal
anatomy; available in a separate read-only candidate inspector, **not admitted to
the learner atlas**.
No clinical approval, regional skin definitions, patient registration or new deployment.

## Provenance and commercial use

Both pinned BodyParts3D version 4 IS-A and part-of tables map FMA7163 (skin) to
FJ2810. The original OBJ was obtained by bounded HTTP ranges from the official
IS-A ZIP, without downloading the entire archive. ZIP size/CRC32 were checked.
The exact 14,465,502-byte file has SHA-256
`682f402206f15592acdeaae8ffb6b34c3e5c3267fa4685e63d2e4920ef2a80e0`.

The [official rights statement](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
and [archive README](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html)
were checked on 26 September 2026. CC BY 4.0 permits commercial reuse subject to
its terms, including attribution and indicating changes. This is not CC0.
Retain: **BodyParts3D, © The Database Center for Life Science licensed under CC
Attribution 4.0 International.** License text is in `LICENSES/CC-BY-4.0.txt`.
These rights do not constitute clinical validation or a guarantee about future hosting costs.

Original bytes remain outside the repository in `../work/bodyparts3d/isa/FJ2810.obj`.
The code and numerical evidence are in Git; no patient files were used.

## Findings and limits

- 102,467 vertices and 203,382 triangles; no unused vertices, repeated-index
  triangles, exactly zero-area triangles, or edges shared by more than two faces.
- 1,512 single-face edges; 100 **indexed** connected components. The largest two
  have 54,949 and 47,178 vertices. These are topology statistics, not anatomical
  subdivisions. Coincident-position seams have not been welded or ruled out.
  **Follow-up:** exact-coordinate equivalence accounts for all these indexed
  boundaries: 776 duplicate positions collapse diagnostically to one connected
  component with zero boundary or nonmanifold edges. No source mesh was changed.
  This does not establish absence of self-intersections or clinical validity.
- Source superior/inferior extent is about 1,719 mm. The existing source-to-scene
  transform is recorded, not changed to fit this candidate.
- Three original-geometry orthographic projections visibly show a whole-body
  exterior. This is a promising optional surface layer, not proof of its alignment
  with the atlas's bones, organs, nerves or patient imaging.
- No self-intersection, normal-vector quality, enclosed-volume, dermal thickness,
  regional boundary or clinical accuracy claim is made. An open mesh may still be
  displayable; it must not be treated as a watertight segmentation mask.

## Reproduce the evidence

From the Atlas source directory, with the original cache present:

```sh
node scripts/audit-skin-source.mjs --check
node scripts/render-skin-source.mjs --check
```

The audit check is offline, compares the full measured report and fails on changed
bytes or source mappings. Initial acquisition omits `--check`; it pins the exact
source hash and refuses to overwrite the saved audit. The renderer makes
`../work/skin-source-review-20260926.png`, refuses overwrite, checks that every
vertex fits its panels, uses every triangle, and labels the source and limitations.
It uses the existing Sharp dependency and system fonts, with no new library/font.
Do not repeatedly rerun acquisition or rendering over existing evidence.
To verify an existing projection without overwriting it, add `--verify-output`
to the renderer command (same Sharp/system-font environment required).

## Next admission gates

1. Inspect boundary edges and exact-position seam equivalence without changing
   original bytes. Determine which discontinuities are source seams versus holes.
2. Overlay retained internal anatomy in the identical source frame; inspect
   anterior/posterior/lateral and oblique views, especially hands, feet and head.
3. If suitable, offer one whole-body surface, default hidden or translucent, with
   reliable selection of deeper anatomy. Do not invent named regional patches.
4. Bind candidate geometry and renderer revision to the clinical review workflow;
   the owner's explicit sign-off remains required. Test mobile performance,
   visibility, reset and dissection interaction before publication.

## Follow-up: seams and context (26 September)

`docs/skin-seam-screen-20260926.json` records the exact-coordinate diagnostic,
cross-checked against the earlier indexed topology. No tolerant welding or repair.

`docs/skin-context-screen-20260926.json` records a four-view screen of 18 retained
bones, heart and bilateral lung aggregates. Actual shipped GLB bytes are verified
against the pinned catalogue, source holds are checked, and the common catalogue
matrix is inverted for all context geometry. No structure is independently fitted.
The partial lung aggregates must not be described as complete pleural surfaces.

Anterior, posterior and left-lateral screens found no flags in those selections.
The anterior-oblique screen flagged two raster pixels for FMA52734/frontal bone.
Three recorded surface samples across those pixels were independently confirmed
with ray/triangle intersection, not dismissed as rounding error. Their nearest
skin-surface distances were approximately 25–29 mm; the much larger ray-depth
discrepancy (up to 113.68 mm) is **not** a normal-to-surface distance or a certified
anatomical defect measurement. This narrow area needs source-level/clinical
inspection before admission. No automated correction is justified by this screen.

The comparison image `../work/skin-context-review-20260926.png` shows the internal
structures through ghosted skin, all at the same scale and source coordinates.
Pixel coverage is about 2.08 mm/pixel. A view-ray depth interval is not a solid
interior test; concavities, missing surfaces, narrow intersections and untested
structures require separate review. A low number of flags is not a clinical pass.

```sh
node --test scripts/test-skin-seam-topology.mjs scripts/test-skin-context-projection.mjs
node scripts/audit-skin-seams.mjs --check --verify-output
node scripts/render-skin-context.mjs --check --verify-output
```

For first creation of those derived artifacts omit `--verify-output`. Only when
intentionally revising this context screen, `--refresh` replaces its two generated
outputs; it never edits the source models. The original source audit is immutable.
## Section follow-up and read-only inspector

The flagged frontal samples were checked against the original FJ3200 source,
not just its transformed display. Nearest original-surface discrepancies are
0.0000109–0.0000180 mm, consistent with export rounding rather than displacement.
Axial, sagittal and coronal surface intersections through the sample place it
within the head outline. The oblique view ray traverses the facial opening; its
depth interval is therefore inconclusive, not proof of a protruding frontal bone.
No skin or frontal geometry has been shifted, repaired or fitted independently.
This remains a numerical/visual screen, not a clinical sign-off or solid-inside test.

`/review/candidates/skin` provides the original whole-body surface, opacity,
optional frontal context, rotation/zoom and four camera presets. It is linked
separately from the four approval scopes; there is deliberately no approval/save
action or learner catalogue entry. Source findings are collapsed to keep the
model visible. The section figure is labelled as model geometry, not CT/MRI.

`content/skin-review-candidate.json` pins the source, GLB, figure, context bundle
and four evidence reports. The GLB retains every source vertex/triangle in the
common transform. Float32 round-trip maximum source displacement is 0.000105 mm;
display normals are recomputed. No regional patches or additional anatomy are
inferred. Metadata line endings are pinned for reproducible evidence on Windows.

Four section-helper tests, full geometry/provenance checks and TypeScript pass.
Browser component inspection verifies whole-body/head framing, keyboard camera
activation and opacity adjustment without losing head framing. Pointer targeting
in the browser automation required screenshot coordinates; the original camera
effect is retained, not replaced with an unneeded render-loop workaround.
This is isolated-component evidence, not integrated route, device or clinical
acceptance. The application has not been redeployed.

```sh
node --test scripts/test-source-plane-sections.mjs
node scripts/skin-head-sections.mjs --check --verify-output
node scripts/export-skin-review-candidate.mjs --check --verify-output
node scripts/test-skin-review-candidate.mjs
```

Next: radiologist inspection of this candidate, broader internal context,
mobile/touch and integrated-route acceptance, then a revision-bound admission
decision. No automatic learner admission follows a passing technical test.
