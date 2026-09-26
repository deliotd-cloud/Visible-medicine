# Whole-body skin candidate — 26 September 2026

Status: original source acquired and assessed; **not admitted to the runtime atlas**.
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
