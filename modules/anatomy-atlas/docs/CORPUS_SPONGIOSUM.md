# Corpus spongiosum — bounded bulb/shaft source

One original BodyParts3D v4 IS-A surface is added to **Pelvis** and **Whole body**
as **Corpus spongiosum · bulb/shaft source**. Use the existing search or organ
list, then selection, fade/isolate, removal/Undo and separation controls.
No new toolbar, panel, imaging viewer or dissection mechanism is introduced.
The midline selection remains available in both side filters.

This is a source-bound draft, not a complete penis or complete corpus
spongiosum. The separately supplied glans and cavernous-body surfaces are
excluded. Existing Urethra provides context but does not prove a lumen,
enclosure, attachment, continuity or scan registration.

## Original-source decision

Official source archive:
https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip

| Definition | Original | Triangles | Components | Duplicate faces | Decision |
| --- | --- | ---: | ---: | ---: | --- |
| FMA19617 corpus spongiosum of penis | FJ3133 | 576 | 1 | 0 | Bounded bulb/shaft draft |
| FMA19618 corpus cavernosum of penis | FJ3132 | 1,272 | 6 | 4 | Offline review required |
| FMA18247 glans penis | FJ3134 | 1,374 | 5 | 3 | Offline review required |

The single FJ3133 component passes the oriented closed-manifold test. That
test does not establish anatomical accuracy, lack of self-intersection or
urethral enclosure. The other candidates fail that topology condition; their
original fragments/faces are not repaired or discarded. FJ3132 is a combined
midline source, not an inferred right/left pair. No new formal hold is added.

The replayable [source audit](penile-source-audit.json) checks official
definitions, archive CRC/size, source hashes, current holds, prior root
ownership, bounds, exact triangles and plausible translated duplicates.
All 3,222 source triangles remain in the offline originals; 69 bounded
candidate-to-existing comparisons find no duplicate admission. These are
engineering checks, not a spatial/anatomical clearance.

Original SHA-256:

- FJ3133: `e90e440d57d2e6b0b85c622650c46bafe34c0886a6eed898062b914b5df1f14e`
- FJ3132: `81a9ef903f013d7f5eed82bdb6740709cfc19c04b7f5ad41595ac6e46327557f`
- FJ3134: `30e1b727121b6f105f9156af132171f9a79bdd3588567148572479ad6c2a1efe`

The exported 11,856-byte GLB has SHA-256
`f704a79a0fe2c9b30a93380d36ab31cb241f1ca81f701b870ff288bfb616d826`.
Every ordered face corner round-trips against the original within Float32
storage precision. Original source coordinates and faces are not edited.
Source-to-scene transformation, exact-coordinate indexing and normals are
documented in the exporter and catalogue.

## Runtime and review boundaries

- Stable ID: `vm:anatomy:body:pelvis:midline:organ:corpus-spongiosum-of-penis`.
- Atomic admission pins source identity, coordinates, frame, licence, bundle
  and five existing context records; rejects altered or colliding sources.
- Three short Anatomy, Function and Quiz drafts; six other topics pending.
  [NCI SEER](https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html)
  is a factual reading reference, not imported text or artwork.
- Existing 1,101 selection records, bundles and all 9,909 topics are pinned
  unchanged. Current root total is 1,102 selections / 9,918 topic slots,
  not an anatomical completeness claim. The archival 1,022-record catalogue
  remains byte-identical.
- Six scope/side links preserve actual source coordinates without assigning
  a DICOM FrameOfReferenceUID or registered imaging correspondence.
- Original audit OBJ files stay under `content/prototypes`; only the admitted
  GLB is a runtime asset. No patient data, generated anatomy or paid service.

Required radiologist review: inspect bulb/shaft shape and orientation, proximal
and distal limits, relationship to urethra and surrounding structures, and
draft teaching. Glans, paired cavernosa, skin/tunical layers and neurovascular
detail remain missing. Geometry quality, functional controls, clinical content
and hosting require separate acceptance; no previous sign-off carries over.

## Replay

```sh
node scripts/audit-penile-sources.mjs --check
npm run corpus-spongiosum:test
npm run anatomy-search:test
node scripts/validate-reference-coverage.mjs
node scripts/validate-current-source-holds.mjs
```

The dedicated validator checks 576 triangles, six study links, reversible
hide/Undo, exact source-bound teaching and 66 invalid-admission rejections.
Search uses the real bundled workspace code; its existing expectations are
retained, with two additional lookup cases. Browser/device acceptance remains
separate from these tests. Export/publication is recorded in the main workspace
checkpoint, not inferred from this document or a successful local build.

## Rights

BodyParts3D © DBCLS, CC BY 4.0; retain attribution, licence and source/change
notices. See [third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md).
This permits commercial reuse under the stated terms; it does not confer
clinical approval or waive third-party rights. No new dependency or asset fee.
