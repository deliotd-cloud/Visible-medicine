# Celiac-trunk candidate: already spatially represented

18 September 2026. Baseline Atlas `af0f5866ea01b6979cdac2ad16ad23dccf275d8a`.

**Decision: do not add FMA14812 / FJ3421 as another structure.** Its source
filename is absent from the displayed catalog, but that does not make its
anatomy missing. It nearly coincides with the existing FMA50737 celiac-artery
surfaces. This is a source-admission decision, not radiologist approval.

## Verified evidence

- Official BodyParts3D 4.0 IS-A definition: FMA14812, celiac trunk, BP10622,
  FJ3421. PART-OF: the same concept and filename, representation BP10650.
- Both archive directories match the retained directory hashes and entry
  counts; extracted bytes pass original ZIP CRC and length verification.
- IS-A OBJ: 14,327 bytes; SHA256
  `7c0030c4502c344512b92428a3bb856d45cab28783f1a2019d2caeba09043d10`.
- PART-OF OBJ: 14,330 bytes; SHA256
  `f70068564c53bd6297ebcd1f129e6af6c6441b9a7f2a771ac6e466dde7bfaf1e`.
- Byte hashes differ, but parsed vertex arrays and ordered face arrays match
  exactly. Neither matching filenames nor similar bounds alone established this.
- Each is one closed, consistently oriented combinatorial component: 121 unique
  vertices, 238 triangles; no collapsed/degenerate/duplicate faces or detected
  non-manifold edges/vertices. This does not prove no self-intersections.
- All 1,818 unique source files used by the current 1,104 root selections,
  104 reachable nested selections and dedicated shoulder were hash-verified.
  Bounds/shape screening produced 23 detailed comparisons. Separate-specimen
  v3/HRA/UM coordinate frames are intentionally excluded.
- No exact file/fingerprint match was found. Nevertheless, the candidate shares
  27 exact triangles with each existing `isa/FJ1846` and `isa/FJ2013`, both owned
  by FMA50737. All 121 unique vertices were tested in **both** directions for
  these two comparisons. Maximum unsigned distances were 0.009816 mm and
  0.010006 mm, respectively, without moving either source surface.

The historical inventory's 1,022 admitted raw selections is not the current
1,104 displayed count. Its `unused-available` status records source availability,
not anatomical novelty or an import recommendation. The initial filename-only
triage has been superseded by this surface audit.

## Reproduce and interpret

From the Atlas checkout, run `node scripts/audit-celiac-trunk.mjs --check`.
It rechecks source-table/archive identities, downloaded/cached OBJ hashes,
current root/nested/shoulder coverage and the complete saved report. The audit
asserts both near-duplicate owners and the measured distance bound; changing
catalog coverage or the rejection evidence requires deliberate re-review.
The report pins 99 computation inputs, including the audit, local helper import
closure, actual compiled runtime inputs, lockfile and shoulder manifest. Fixed
root/nested/file counts guard against silently reduced coverage. The baseline is
asserted to be an ancestor of the checked-out commit, not falsely reported as
the current HEAD; changes to any pinned computation input fail report comparison.
Computation-input text normalizes CRLF to LF for Windows/Git portability; OBJ
bytes, archive entries and geometry verification remain exact and unnormalized.

The first recording command (without `--check`) is create-only and will not
overwrite existing evidence. Source cache: `../work/bodyparts3d/{isa,partof}`.
Raw meshes stay outside the application and are not newly hosted. No new
dependency, model, identifier alias, search label or teaching draft is introduced.

This document and audit do not add an exporter-policy hold. Future importers
must still consult this adjudication and perform spatial comparison; passing
the older `no-known-source-hold` check is not clearance. Existing celiac-artery
geometry, including its two source components, is unchanged. Determining whether
those components should be deduplicated is a separate source-preserving renderer
review, not a reason to add a third nearly identical surface.

Follow-up inspection of the current generated `abdomen-vessels-recovery` GLB
(SHA256 `e41d66684de08fd9bd7dfca340acb63cbf7714eb09a3ea9594184f497c509abe`)
found 476 triangles in node FMA50737 but only 238 unique oriented coordinate
triangles (cyclic rotations equivalent; reversed winding not collapsed). Its two
source OBJs also have identical parsed vertices and ordered faces. A future
correction should preserve both source records and the existing structure ID,
remove only the proven duplicate render copy, and go through generation,
regression, revision-binding and immutable-model delivery checks. Nothing has
yet been removed or newly published.

No new branch completeness, wall/lumen distinction, trifurcation, clinical
registration, or diagnostic accuracy is asserted. Unsigned sampled distances
are not continuous-surface intersection proofs.

## Rights

Publisher [licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
and [v4 README](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html)
were rechecked on 18 September 2026: CC BY 4.0 with the specified DBCLS attribution.
Existing licence notices remain applicable: BodyParts3D, © The Database Center
for Life Science licensed under CC Attribution 4.0 International. No paid or
non-commercial source was substituted; commercial compatibility still requires
observing the licence, and does not eliminate hosting or clinical-review costs.
