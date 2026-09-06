# Foot vascular dissection

## Current milestone

The atlas has **1,006 selectable source representations / 82 body bundles**, including 223 vascular entries. The foot scope contains 118 entries. This milestone adds **eight source vessel identities / ten components** in one 192,916-byte GLB; total body assets are 96,248,516 bytes. All previous 998 records and 81 bundle hashes remain exact; the dedicated shoulder is unchanged.

Open **Ankle & foot → Study windows & focuses**:

| Window / matching focus | Both feet | Left | Right | Opening direction and context |
| --- | ---: | ---: | ---: | --- |
| Plantar arch & deep plantar artery | 18 | 9 | 9 | Inferior; lateral plantar arteries, dorsalis pedis and metatarsals |
| Medial plantar arterial branch | 8 | 4 | 4 | Inferior; medial plantar arteries, abductor hallucis and first metatarsals |
| Dorsal foot venous arches | 14 | 7 | 7 | Superior; metatarsals and dorsalis pedis |
| Foot arteries & dorsal veins exposed | 14 | 7 | 7 | Inferior; six existing local arterial entries |

Counts include explicit context. Focus-only practice targets the authored new vessels, not the bones/muscles/arteries retained as context. Select/frame, remove/restore/Undo, isolate/fade, labels, reversible separation, cutaway, arrangement, study links and local saved views are connected. Whole-body system views include the new source identities. No prior recipe is renamed or removed.

The atlas now has **128 stages / 110 focuses**: 47 regional layer steps and 81 independent windows. The library groups 191 window/focus recipes into 152 cards, including 39 equivalent pairs. These are visibility recipes, not proof of complete tissue layers or safe surgical dissection planes.

## Exact source admission

`scripts/foot-vascular-selections.mjs` audits ten exact BodyParts3D 4.0 ISA definitions and explicitly admits eight: paired plantar arterial arches (FMA43943/FMA43944), deep plantar arteries (FMA69514/FMA69515), superficial medial plantar arteries (FMA43937/FMA43938), and dorsal venous arches (FMA44881/FMA44882). Each dorsal arch groups two source components; no independently named tributaries are invented. Source arterial-trunk aliases of the plantar arches share the same surface and are not rendered again. Generic bilateral/parent definitions are not new selectable anatomy.

The baseline is source commit `574d408e1d46176e15d1fc0d2cb80a708149c090`, catalogue SHA256 `5d7a82b00671a07b993122317e3f22eb64bc5eed4f1df064b81c78b35b46e590`. `content/foot-vascular-baseline.json` pins old record hashes and bundle metadata. `content/foot-vascular-source-audit.json` records exact names/components and aliases, archive CRC/size, raw SHA256/canonical fingerprints, bounds, finite geometry and laterality. Ten candidates have no degenerate faces or existing canonical duplicate owners; all pass the broad foot envelope, with right negative source X and left positive X.

All existing foot and leg structures provide comparison context. Bounding boxes over 1 mm apart are pruned. The remaining **284 pairs** use at most 128 deterministic vertices in each direction against every comparison triangle, including finite segment/point fallback. No exact position triangle is shared and none reaches the 25%-within-0.25-mm diagnostic flag threshold. These samples do not prove biological non-overlap, attachments, endpoints or continuity. Running the audit admits nothing; only the explicit allowlist does.

## Why two plantar venous arches remain withheld

The right/left plantar venous arch candidates, **FMA44883/FMA44884**, are separate in the original coordinates but have nearly the same shape as the corresponding arterial arches. An additional **diagnostic-only** bounding-centre translation aligns them by approximately 4.216 mm in source Z. Bidirectional sampled aligned medians are about 0.014 mm and maxima below 0.06 mm. This is evidence of highly similar source shapes, not proof of a source error or of true arterial–venous anatomical correspondence.

Their independent venous shape/depth provenance needs specialist/source adjudication. Both remain out of the atlas; the arterial sources are not recoloured, shifted or duplicated as veins. The generic plantar venous arch aggregate cannot bypass the component holds in the candidate queue. Diagnostic alignment changes only temporary audit geometry, never raw files, catalogue transforms or rendered surfaces. Unequal raw vertex counts make index-by-index correspondence inappropriate; the recorded comparison uses distances to surfaces, not assumed matching vertices.

All other previous holds remain, including hand little-finger veins, pharyngeal raphe, mesenteric alternatives, optic/cord ambiguities, pelvic candidates and quarantined muscle surfaces. No missing plantar nerves, digital branches, vascular lumen/valves or scan tissue is generated.

## Display and content

The vessel classifier adds exact ID/name exceptions for the two source labels “right plantar arch” and “left plantar arch,” whose names omit the arterial noun. Their arterial interpretation is supported by official source arterial-trunk aliases and the cited teaching facts. All previous 215 vessel colours remain unchanged. New arterial entries are red and dorsal veins blue; unknown/conflicting types remain neutral. Colour is not oxygenation, flow, depth or clinical validation.

Original brief draft notes distinguish source identity from general teaching relationships. The [TTUHSC arterial table](https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html) supports the plantar arch/deep plantar and medial plantar relationships; the [venous table](https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html) supports general dorsal drainage relationships. Protected tables, illustrations and prose are not redistributed. Actual arterial connections, detailed venous drainage and clinical/imaging findings remain unvalidated, not manufactured from exterior meshes.

## Rights and clinical gates

The [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) was rechecked on 6 September 2026: CC BY 4.0. Retain **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, licence links and adaptation notices. Models, official indexes and derived source evidence are not relicensed as MIT. No new package, font, texture, paid API or copied diagram is added. Existing hosting terms remain; free professional validation or perpetual free hosting cannot be guaranteed.

Specialists must review source labels/aliases, arch extent, vessel course, depth, origins/endpoints, calibre/lumen, continuity, grouped dorsal components and variants. The two plantar venous candidates need independent provenance/shape adjudication. The adult-male reference is not all sexes, ages or patients. Real-device mouse/touch, keyboard, tiny-vessel picking, label occlusion, colour discrimination, accessibility and educator acceptance remain pending. The source-ID imaging contract covers the new entries; no acquired CT/MRI/US study, actual modality adapter, patient registration or clinical approval is supplied.

## Verification and next work

`npm run foot-vascular:test` passes **12,539 assertions** from committed evidence without Site Git history. Optional `--raw-source` passes **12,607** with the cached original bytes, fingerprints and transformed vertex bounds. Coverage includes all old record/bundle identities, held/alias exclusion, finite diagnostics and diagnostic-only translations, exact common coordinates, four windows across three side scopes, target/context membership, remove/restore/Undo, focused find/name practice, source-bound study links and prior-link compatibility. The colour suite passes **1,085 assertions**, including the old arterial/venous colours and the exact new identities.

Historical source suites and current full-body checks pass: 4,928,720 triangles and 2,469,898 vertices; 3,786 dissection plus 9,216 camera checks; 98,174 workbench; 54,753 practice; 17,546 saved-view; 47,346 imaging; 101,727 navigation; 222,295 study-link; 39,156 library including 24 server-rendered markup cases; 1,204,519 inspection; 13,838,560 arrangement; 589,788 explode-pair and 189 review checks. Type checks, focused lint and the 808-package licence audit pass. Production build and private publication are the delivery gate, not clinical/browser acceptance.

The updated regional source queue has 219 matched definitions / 203 component-set groups, including five held-component aggregate groups. Next broaden translated-shape/identity diagnostics before further vascular admissions, then improve regional guidance and selection/loading resilience. The wider improvement goal remains active; specialist/device review and the user's real imaging adapter remain external requirements.
