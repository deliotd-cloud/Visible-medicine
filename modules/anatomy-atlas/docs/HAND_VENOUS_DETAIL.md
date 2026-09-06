# Hand venous dissection and vessel colours

## Current milestone

The atlas contains **998 selectable source representations / 81 body bundles**, including 215 vascular entries. The wrist/hand scope has 124 entries. This milestone adds **14 original venous identities / 24 source components** in one 577,748-byte GLB; total body assets are 96,055,600 bytes. All previous 984 records and 80 body-bundle hashes remain exact. The dedicated shoulder is unchanged.

Open **Wrist & hand → Study windows & focuses**:

| Window / matching focus | Both hands | Left | Right | Explicit context |
| --- | ---: | ---: | ---: | --- |
| Palmar venous & arterial arches | 10 | 5 | 5 | Arterial arches and wrist flexor retinacula |
| Dorsal hand venous networks | 12 | 6 | 6 | Ten metacarpal bones |
| Palmar & finger vein segments | 12 | 6 | 6 | Four venous arches |
| Hand arteries & veins exposed | 42 | 20 | 22 | Twenty-eight arterial entries |

Counts include context; focus-only practice targets the authored venous subset. The dorsal view opens posteriorly. Use side filters, selection/frame, removal/restore/Undo, isolate/fade, labels, cutaway, explode, arrangement, related-study links and local saved views. Whole-body system views include the new identities. No previously authored recipe is removed or renamed.

There are now **124 stages / 106 focuses**: 47 regional layer steps and 77 independent windows. The searchable library groups 183 window/focus recipes into 148 cards, including 35 equivalent pairs. Recipes are visibility comparisons, not claims of complete tissue layers or surgical dissection planes.

## Admission evidence and conservative holds

`scripts/hand-venous-selections.mjs` audits sixteen exact BodyParts3D v4 ISA definitions and explicitly admits fourteen: paired deep/superficial palmar venous arches, paired dorsal venous networks, paired grouped palmar metacarpal veins, and paired index/middle/ring proper digital veins. Each digital identity groups two components, and each metacarpal identity groups three. No independent branch names are invented.

**FMA85102/FMA85103 are withheld.** The source-labelled little-finger groups include FJ2349/FJ2319, each spanning about 58 mm across the source X axis and reaching substantially across the palm beyond the other finger components. The overall grouped span is about 78 mm. This is not proof of a source error, but is enough identity/extent uncertainty to require specialist adjudication. All three components of each group stay out; none is split, shortened, renamed or silently substituted. Source holds are recorded in `scripts/anatomy-inventory.mjs` and propagated to the inventory. Larger aliases cannot bypass held components in the regional candidate queue. Generic common-digital and dorsal-metacarpal/tributary alias families remain unadmitted, not proved absent anatomy.

The baseline is source commit `6f7fe0df4124d13b029404ab3502c026b2d39230`, catalogue SHA256 `6402d7b654eaddb137fea383d796e64cd7674117d525492d89aa8daa31fe6593`. `content/hand-venous-baseline.json` pins prior record hashes and bundle metadata. The source audit records exact names/component lists, aliases, archive CRC/bytes, raw SHA256/canonical geometry fingerprints, component bounds, finite faces and laterality. All sixteen candidates have zero degenerate faces, no existing canonical duplicate owner, and pass the broad hand envelope with right negative X / left positive X.

All existing hand and forearm entries provide comparison context. After bounding-box pruning beyond 1 mm, **597 pairs** were checked with at most 128 deterministic vertex samples per direction against every comparison triangle, including finite segment/point fallback. No exact position triangle is shared and no pair reaches the 25%-within-0.25-mm flag threshold. Sampling does not prove biological non-overlap or connections. The audit records `admitted: false`; the separate explicit allowlist is the only admission mechanism. Numerical checks did not override the two extent holds.

The common source transform and standard mesh conversion are unchanged. No reshaping, thickening, new surface generation, added lumen, bridging, patient registration or missing nerve reconstruction is performed. Near surfaces do not establish patent connections.

## Vessel presentation correction

The old renderer recognised “vein” but not “venous,” which would colour the new arch/network labels red. `lib/anatomy-vessels.ts` now applies case-insensitive whole-word artery/vein terms and six exact identity/name exceptions for pre-existing arterial trunks and deep palmar arches. Unrecognised or conflicting names stay neutral grey instead of defaulting to artery. Non-vessels cannot be classified as vessels. All **201 previous vessel colours are unchanged**; the fourteen additions are blue. Red/blue denote artery/vein, not oxygenation, direction of flow, depth or clinical validation. Existing study-selection/highlight behaviour remains separate.

## Rights, teaching and release gates

The [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), checked 6 September 2026, specifies CC BY 4.0. Retain **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, licence links and adaptation notices. Meshes/index-derived evidence are not relicensed as MIT. The [database description](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html) describes one adult-male whole-body source, not all sexes, ages or variants. No new package, font, texture, paid API or copied diagram is included. Brief original dorsal-drainage notes cite [TTUHSC upper-limb venous facts](https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html); its protected prose/table/figures are not redistributed. Other new notes describe source identity and pending review, not invented clinical findings. No perpetual free-hosting or free professional-validation guarantee is made.

Specialists must adjudicate grouped extent, superficial/deep relationships, drainage territories, tributaries, endpoints, valves, calibre/lumen, continuity and variants, including the held little-finger groups and the broad metacarpal groups. Digital nerves, complete hand veins, thumb-specific/common-digital detail, tendon sheaths and palmar fascia remain incomplete or absent. Existing muscle, optic, cord, raphe, mesenteric and pelvic holds remain. Real-device mouse/touch/keyboard, tiny-vessel picking, labels, accessibility, colour discrimination and educator acceptance remain pending. Source-coordinate imaging hooks include the new IDs; no CT/MRI/US study, modality adapter, patient registration or clinical approval is provided.

## Verification and next work

`npm run hand-venous:test` passes **16,817 assertions** from committed evidence without Site history: prior record/bundle preservation, ownership and holds, source coordinates, four windows in all side scopes, exact context, removal/restore/Undo, focused find/name practice, source-bound links and old-link compatibility. Optional cached `--raw-source` checks pass **16,949 assertions**. `npm run vessels:test` passes **1,055 assertions** including every old vessel colour and ambiguous/future/non-vessel identities.

Current suites pass: 3,666 dissection and 8,928 camera checks; 94,862 workbench; 54,717 practice; 17,486 saved-view; 46,978 imaging; 99,975 navigation; 218,711 study-link; 37,688 library including 24 server-rendered markup cases; 1,195,879 inspection; 13,672,601 arrangement; 580,868 explode-pair and 189 review checks. Historical source suites, type checks, focused lint and the 808-package licence audit pass. Production build and private publication are required for delivery. No browser/visual or clinical acceptance is inferred from these checks.

The refreshed regional queue has 235 matched definitions / 217 component-set groups, with four existing-held aggregate groups. Next inspect the remaining foot-vessel candidates against registered foot/leg context, then strengthen regional guidance and selection/loading resilience. Continue the broader goal; real-device/specialist acceptance and the user's actual imaging adapter remain external gates.
