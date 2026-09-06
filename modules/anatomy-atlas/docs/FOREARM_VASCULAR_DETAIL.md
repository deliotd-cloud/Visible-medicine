# Forearm arteries and dissection views

## What is included

Four exact BodyParts3D 4.0 IS-A components add a 66,352-byte model bundle. They retain source coordinates, relative scale, source names and individual anatomical IDs. All preceding 1,018 records and 85 body-bundle hashes remain unchanged; the dedicated shoulder is untouched. The current atlas contains 1,022 representations in 86 body bundles, with 138 dissection stages and 120 focused views. These counts do not mean anatomical completeness.

| Source identity | Exact component | Disposition |
| --- | --- | --- |
| FMA22808 — left common interosseous artery | FJ2223 | Included, clinically unvalidated |
| FMA22807 — right common interosseous artery | FJ2275 | Included, clinically unvalidated |
| FMA268669 — left recurrent interosseous artery | FJ2245 | Included, clinically unvalidated |
| FMA268667 — right recurrent interosseous artery | FJ2297 | Included, clinically unvalidated |

The common segments' PART-OF definitions contain more than the selected single IS-A component. Generic bilateral and branch-of-artery aliases are recorded, not imported as duplicate anatomy. The source-labelled recurrent segment is not relabelled as a complete posterior interosseous artery. No source hold is lifted.

## Use the views

Open **Elbow & forearm → Study windows & focuses**:

1. **Common interosseous origins**: the common segments with ulnar/anterior-interosseous arteries, radius, ulna and interosseous membrane (12 entries for both sides; six for one).
2. **Recurrent arteries & supinator**: recurrent segments, common segments, supinators and elbow bones (12/six).
3. **Forearm arterial comparison**: five paired arterial identities with a forearm-bone/membrane framework (16/eight).

Choose a side, select and frame a fine vessel, remove a context structure, restore it or Undo. Isolation, fading, separation/tray inspection, source labels, study links and target-only practice use the existing controls. Numbered layer tracks stay separate. A rendered exterior cutaway is not an ultrasound/CT/MRI slice.

## Source and geometry evidence

`content/forearm-vascular-source-audit.json` is pinned to the pre-admission source state `baac701cffa779c6a652637a5d39d241bb081f9e`. It verifies exact definitions, all aliases, ZIP CRC/size, raw and canonical hashes, finite triangles, zero degenerate faces, source-side centres and absence of opposite-side vertices, previous owners or exact represented matches.

All 1,018 preceding records are conservatively bounds-screened in original millimetres using the inverse shared coordinate transform and a 1.01 mm tolerance. Raw files for 54 nearby structures are hash-checked. The 96 candidate-involving near-surface comparisons find no diagnostic flags. At most 128 deterministic vertex samples per direction are compared with all opposite triangles; exact shared triangles or at least 25% of samples within 0.25 mm flag review. Zero flags are not a full intersection, topology, attachment or clinical audit. No same/unspecified-side vessel passes the additional translated-shape extent filter.

The broader artery–vein screen was also refreshed for all 227 current vascular identities and 19 bundles. It retains the two withheld plantar-venous positive controls; see [method and limits](VESSEL_SHAPE_AUDIT.md).

## Reproduce and verify

After installing the existing locked dependencies:

```sh
npm run forearm-vascular:test
node scripts/validate-forearm-vascular.mjs --raw-source
npm run forearm-vascular:audit
```

The default test uses committed evidence and models; no Site Git history, network or original raw archive is required. It passes 13,260 checks. The raw-source extension requires the verified cache at `../work/bodyparts3d`; it passes 23,754 checks, verifies every corner of all 3,436 added triangles and recomputes all 96 surface comparisons. Audit regeneration additionally requires the pinned Site commit and access to the official archive. It never admits meshes automatically.

The baseline preserves every previous record/bundle hash and historical hold policy. Exact complete catalogue/inventory reconstruction is mandatory, with negative mutation fixtures. The earlier supporting-candidate classification remains a separately pinned pre-admission record; its generator and test reconstruct that evidence instead of rewriting history. Current source, dissection, loading/recovery, practice, study, library, links, imaging, arrangement, inspection and review regressions are separate from clinical/device acceptance.

## Rights and clinical release gates

Retain **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, licence links and adaptation notices. The [official licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) was checked on 6 September 2026. Meshes and derived audit/baseline data remain CC BY 4.0, not MIT or CC0. Draft teaching is concise original prose checked against the [Texas Tech forearm anatomy tables](https://anatomy.ttuhscep.edu/schemes/forearm_tables.html); no diagrams or table dataset are copied. No new dependency, font, texture, paid API or asset purchase is introduced.

Before clinical release, a specialist must review source identity, calibre, laterality, branch origin/endpoints, relation to muscles/membrane/bones, and whether the named recurrent segment's supplied extent is appropriate. Independently establish posterior-interosseous trunk, complete elbow anastomoses, lumen and variations; do not infer them from proximity. Accept picking, labels, side changes, camera framing, separation, opacity and practice on real devices. The imaging hooks preserve source identity and coordinates but supply no acquired scan, patient registration or clinical approval.

Next: audit the two tendon candidates and two superficial thumb-muscle heads against parent/extent evidence and the previously held whole-muscle alternatives. Continue shared graphics initialization/fault handling; actual-device/specialist acceptance and the user's imaging adapter/data remain open.
