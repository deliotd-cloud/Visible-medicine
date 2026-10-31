# Visible Medicine identity and asset provenance

The website uses the existing matched Visible Medicine identity. Its adoption is
recorded in commit `ff984ea1f714594f2d93aad332f25073156a8e13` (30 August 2026),
“Adopt approved Visible Medicine identity”. The former statement that no header,
splash or icon assets had been replaced was stale and should not guide delivery.

## Current website artwork

- `public/brand/approved/visible-medicine-lockup-light.png`
- `public/brand/approved/visible-medicine-lockup-dark.png`
- `public/brand/approved/visible-medicine-mark-light-theme.png`
- `public/brand/approved/visible-medicine-mark-dark-theme.png`
- Eight files in `public/brand/icons/` supply the favicon and app icons.

All 12 files match both their original `Visible-Medicine-Brand-Pack-v1` exports
and the adoption commit byte for byte. The exact export names, sizes and SHA-256
hashes are recorded in
[`brand-asset-provenance.json`](../LICENSES/native-website/brand-asset-provenance.json).
The original pack manifest and README are retained beside that record. The two
source-master hashes were checked locally; those master images are not added to
this distribution. `node scripts/check-brand-assets.mjs` verifies the current
assets against the recorded manifest. It is a provenance check, not a new design
approval or a complete release-rights audit.

## Preserve the existing design

The endorsement remains the typographic phrase `by Elivion`. Do not replace it
with the Elivion emblem. Use `Powered by Didanix` separately in the imaging viewer.
Preserve each PNG's intrinsic aspect ratio; do not stretch, recolour, retype or
reconstruct the mark. An earlier hand-built SVG changed its proportions and was
rejected; this record does not reinstate it.

The original pack README describes raster-backed SVG containers, not true vector
masters. A future vector reconstruction requires its own visual approval. The
existing raster assets remain unchanged. `scripts/build_logo_pack.py` is retained
in the adoption commit; its recorded hash is evidence of the original recipe,
which was inspected but not rerun for this audit.

The historical `/brand-preview` route refers to review masters. Do not use that
route or its `noindex` setting as proof that a particular release includes those
images, provides access control, or has received approval. Current production
asset identity comes from the manifest above.

## Rights boundary

The retained brand-pack README explicitly does not grant trademark, font,
model-release or third-party rights. Matching existing artwork to its recorded
adoption closes the provenance gap; it does not invent legal, clinical or public
release clearance. Keep any original design and rights records with the owner.
No artwork, dependency, permission or deployment changed in this correction.
