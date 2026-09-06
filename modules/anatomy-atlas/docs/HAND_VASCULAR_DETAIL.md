# Palmar and digital arterial dissection

## Study the hand in smaller groups

The atlas now contains **984 selectable source representations / 80 body bundles**, with 201 vascular entries. The wrist/hand scope has 110 entries. This milestone adds **26 original source arterial identities / 30 components** in one 534,016-byte GLB; total body assets are 95,477,852 bytes. All previous 958 records and 79 bundle hashes remain exact. The dedicated shoulder is unchanged.

Open **Wrist & hand → Study windows & focuses**:

| Window / matching focus | Both hands | Left | Right | Explicit context |
| --- | ---: | ---: | ---: | --- |
| Palmar arches & metacarpal vessels | 18 | 9 | 9 | Deep arches, metacarpals and wrist flexor retinacula |
| Common & proper digital arteries | 22 | 10 | 12 | Superficial and deep arterial arches, without bones/muscles |
| Thumb & index arterial detail | 12 | 6 | 6 | First/second metacarpals and thumb/index proximal phalanges |
| Hand arterial detail exposed | 28 | 13 | 15 | Existing deep arches only |

Counts include context; focus-only practice targets only the authored arterial group. Every window supports existing select/frame, remove/restore/Undo, isolate/fade, labels, cutaway, explode, arrangement, related-study navigation, private study links and local saved views. Whole-body system views include the new source identities. Smaller side-specific views expose fine arteries without claiming complete arterial connectivity or digital nerves.

There are now **120 stages / 102 focuses** across eleven regions and whole body: 47 layer steps and 73 independent windows. The library offers 175 recipes as 144 cards, including 31 equivalent window/focus pairs. The hand's outdated limitation notice is corrected: wrist flexor retinacula already exist; palmar aponeurosis, extensor retinacula, tendon sheaths and digital nerves remain absent. No dissection recipe is renamed or silently removed.

## Source admission and limits

`scripts/hand-vascular-selections.mjs` explicitly lists all 26 exact official v4 names, FMA identities and source components. The admitted groups are paired superficial palmar arterial arches, paired palmar metacarpal artery identities, paired princeps-pollicis/radialis-indicis identities (two components per identity), eight source-numbered common palmar digital identities, and ten proper palmar digital identities. The proper subset has **six right and four left** entries; absent left medial-middle/ring counterparts are not mirrored or fabricated. Generic/parent aliases do not acquire separate rendered geometry.

The source labels common entries first through fourth, whereas the cited teaching table describes three common palmar digital arteries. This source-numbering/extent difference remains an explicit clinical adjudication item: the labels are preserved as provenance, not presented as validated textbook branch numbering. The source-labelled fourth entries also have greater distal extent than the first three in the raw bounds. No normal branch count, distribution, anastomosis or physiological patency is asserted.

The pinned baseline is source commit `2418244c0dcdb01807c6398d94623651fca6f7fa`, catalogue hash `d740da1d11bdf93d26ebe60ccdc82b7fc16909713779d7d2933d3d9dc10988cb`. `content/hand-vascular-baseline.json` records exact old record/bundle identities. `content/hand-vascular-source-audit.json` records all candidates, definitions/aliases, raw and canonical hashes, archive CRC/size, finite geometry, source bounds, gross envelope and source laterality. In the original coordinate frame right is negative X and left is positive X; every candidate passes that check. An initial draft reversed this diagnostic predicate; it was corrected against existing registered hand landmarks and the audit rerun before admission. No mesh was flipped or relabelled.

All candidates have zero degenerate faces and no existing canonical duplicate owner. All existing hand and forearm entries are included as comparison context, with bounding-box pruning beyond 1 mm. The 578 near pairs use at most 128 deterministic vertices per direction against every comparison triangle, with finite segment/point fallback for degenerate existing faces. No exact position triangle is shared and no pair reaches the 25%-within-0.25-mm diagnostic flag threshold. These engineering samples do not prove anatomical non-overlap, attachments, endpoints or vascular continuity. The audit itself records `admitted: false`; only the explicit allowlist imports entries.

The original source transform, geometry conversion and material/normal treatment remain unchanged. No source surface is stretched, welded, extended, thickened or bridged. Explode/arrangement is reversible display translation, not surgical dissection. Surface clipping is not an internal tissue model or scan slice.

## Rights and release gates

The [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) was rechecked on 6 September 2026: CC BY 4.0, with **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, licence link and adaptation notices retained. Source meshes and index-derived evidence are not relicensed as MIT. No new font, texture, package, paid API, generated anatomy or copied diagram is included. Brief original factual notes cite [TTUHSC upper-limb arterial facts](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html); protected tables and figures are not redistributed. Existing hosting/service terms remain; no perpetual free-hosting guarantee is made.

All surfaces and notes remain unvalidated. Specialist review must assess names/numbering, grouped extent, laterality, source variants, arch continuity, origin/endpoints, calibre/lumen, missing branches and tissue relationships. Actual mouse/touch, keyboard, accessibility, tiny-vessel selection and visual/educator acceptance remain pending. Existing muscle, optic, raphe, pelvic, mesenteric and registration holds remain in force. The imaging contract includes the new source IDs, but no CT/MRI/US study, modality adapter, patient registration or clinical approval is supplied.

## Verification and next work

`npm run hand-vascular:test` passes **16,976 assertions** from committed evidence without Site Git history: exact prior records/bundle hashes, identity/alias ownership, finite diagnostics, source laterality/transform, draft content, four windows across all three side scopes, exact target/context membership, remove/restore/Undo, source-bound links, old-link compatibility and focused find/name practice. Target sets above twenty are limited to the requested twenty questions. Optional `--raw-source` checks cached original bytes/fingerprints and transformed vertex bounds: **17,192 assertions** passed. Candidate retrieval itself needs pinned Site history/cache/network.

Historical source suites and current atlas suites pass: 3,546 dissection plus 8,640 camera cases; 90,655 workbench; 54,681 practice; 17,426 saved-view; 46,334 imaging; 97,399 navigation; 213,749 link; 36,280 library including 24 server-rendered markup cases; 1,180,759 inspection; 13,384,937 arrangement; 565,370 explode-pair and 189 review checks. These are engineering tests, not hands-on or clinical acceptance. Type checks, lint, licence audit and production build are required before private publication.

`npm run inventory:regional-triage` now groups small unused ISA definitions by exact component sets and explicit lexical domains, without choosing preferred anatomical meanings. The report is `content/regional-source-candidates.json`; its domain tags overlap and its counts are not unique missing human structures. Both flexor-pollicis-brevis and middle-constrictor aggregates retain their existing component holds. Partially represented, larger, unmatched and PART-OF definitions remain outside this bounded query, not proved absent anatomy.

Next examine exact right/left superficial and deep palmar venous arches and dorsal venous networks (FMA22912/FMA22913, FMA22915/FMA22916, FMA62506/FMA62507), comparing aliases, raw geometry and registered arterial/hand context before any admission. Then continue other source domains and regional guidance/selection-loading resilience. Do not lift existing holds without new evidence. The broad improvement goal remains active; specialist/device review and the user's real imaging adapter remain external gates.
