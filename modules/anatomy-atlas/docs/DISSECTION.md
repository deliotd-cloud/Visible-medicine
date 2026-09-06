# Guided dissection architecture and review

For the current 102-stage / 84-focus catalogue and its newly separated regional layer sequences, independent windows, transition previews and searchable/batch-restorable tray, see [regional dissection workbench](DISSECTION_WORKBENCH.md). Earlier counts below are historical milestones. Focus rules now separate exact target IDs from optional `context` rules; with `includeSkeleton: false`, only named context is restored. Focus and its corresponding window use the same rule union and still intersect regional/side scope. No clinical connectivity or physical attachment is encoded by this visibility relationship.

## Product structure

The existing shoulder viewer is preserved. The shared regional explorer adds 86 authored visibility stages and 60 focused group views. These are educational source-mesh visibility recipes: no physical tissue cutting, surgical corridor, biomechanical deformation or measured fascicle simulation is implemented. The subsequent [deep-inspection controls](DEEP_INSPECTION.md) add non-destructive surface clipping and system opacity, not reconstructed tissue interiors.

| Region | Guided progression | Focused study |
| --- | --- | --- |
| Whole body | Assembled, musculoskeletal, viscera, neural subset, bones | Regional navigation |
| Shoulder/arm | Deltoid removal, deep arm, cuff, bones | Anterior arm, posterior arm, scapular muscles |
| Forearm | Superficial flexors, deep flexors, deep extensors, bones | Flexor, extensor and deep groups |
| Hand | Outer intrinsics, adductor-pollicis heads, bones | Thumb and hypothenar subsets |
| Hip/thigh | Outer set, rectus femoris, medial group, deep hip, bones | Anterior, medial, hamstring and deep hip groups |
| Knee/leg | Gastrocnemius, soleus/plantaris, deep posterior group, bones | Anterior, lateral and deep posterior compartments |
| Foot | Available plantar layers 1–3 removed successively, bones | Hallux, plantar interossei, lumbricals |
| Thorax | Pectoralis major, external intercostal, organ window, central thorax, bones | Wall muscles and organs |
| Abdomen | Available wall, visceral window, posterior-organ window, bones | Digestive and renal/adrenal groups |
| Pelvis | Gluteus maximus, medius, limited pelvic window, bones | Short hip rotators and bladder |
| Head/neck | Platysma, sternocleidomastoid, neural and orbital windows, bones | Hyoid muscles, scalenes, pharyngeal subset |
| Back | Trapezius, outer back, deep muscles, bones, central canal | Erector-spinae columns, suboccipital subset, psoas |

Not every row is a monotonic anatomical depth progression. A **peel** cumulatively hides named available muscles; a **window** deliberately selects another group; a **skeletal** stage suppresses soft tissues. These types appear in the review manifest. The app explicitly explains incomplete wall/fascial coverage rather than inventing missing layers.

## Source and identity

`scripts/ingest-full-body.mjs` explicitly selects 60 additional named muscle components omitted by the general IS-A muscle root: deltoid parts, biceps/triceps heads, trapezius parts, pronator-teres/flexor-carpi-ulnaris heads, individual quadriceps muscles, biceps-femoris heads, gastrocnemius heads, adductor-pollicis heads, hallux muscle heads and bilateral pectoralis major. IDs, source names, ZIP CRC32 and SHA-256 checksums are retained. No whole-muscle identity is fabricated from a partial head.

The library contains 823 entries in 61 bundles (approximately 88.6 MB). Existing meshes retain their registration. The gallbladder was accidentally caught by the previous generic `bladder` name test; it now belongs to abdomen. The source-labelled superficial perineal muscle now belongs to pelvis. These corrections preserve the old product IDs and asset bindings for compatibility: do not infer present-day region membership from the region segment of an ID. Use `regions` and `region`. Adjacent hip bones, gluteal muscles and psoas are available as regional context.

The four quarantined laterality entries remain excluded. The central canal is still a space, not a full spinal cord. No new nerves or organs were invented or imported from another licence source.

## Implementation boundaries

- `app/dissection-data.ts`: typed, original profile content; declarative tissue rules; pure stage resolver and undo reducer.
- `app/dissection-controls.tsx`: accessible stage selector, navigation, progress track, compartment selector, ghost switch, guide and restore list.
- `app/body-explorer.tsx`: shared application state, source selection, system/laterality filters and practice guards.
- `app/body-scene.tsx`: source-aligned display, six camera presets, non-interactive ghosts and bounded landmark labels.
- `app/anatomy-tissue.tsx`: illustrated materials with shared shader programs and per-material uniforms; disposable materials; outline suppression in large scopes.
- `scripts/validate-dissection.mjs`: deterministic checks and review manifest generation.

The pure state consists of stage ID, optional focused-view ID, manually removed IDs and manually restored IDs. History stores 40 dissection snapshots; camera orbit and system preferences are not undo history. New stages clear manual overrides. Search restoration is explicit and marks the stage customised. Visibility is resolved before system and laterality filters; ghost display never authorises pointer selection. Practice shows only loaded candidates and suppresses dissection controls, label hints, ghosts and the guide. State is in-memory, not a saved patient session.

No additional dependency, font, texture, paid API or service is used. Required model attribution stays visible. The teaching references are links for fact checking, not imported textbook prose, figures or redistributable datasets. Illustrative hatching is not medical fibre-direction data.

The recovery extension adds 11 vascular system windows, 4 connective-tissue windows and a pelvic-organ window. Twenty-one arterial/venous focused views, one lumbrical-group view and one ocular view extend the existing groups. These windows are appended as system comparisons, not represented as further surgical depth. Source vessel endpoints and missing branches are never joined by generated geometry. See `ANATOMY_RECOVERY.md`.

## Review and extension workflow

1. Add or adjust a typed profile with stable stage IDs, exact intent, stage kind, view, landmark patterns, omissions and source references.
2. Run the validator against the checked-in catalogue. Every stage must be nonempty on both laterality filters; every peel must reduce its predecessor without restoring tissue; each focus must contain non-skeletal targets; landmarks must exist.
3. Inspect `content/dissection-manifest.json` for the explicit included/excluded IDs. A qualified anatomy reviewer must approve the actual structures, registration, depth order, view and omissions—not merely the regex spelling.
4. Review shader/label readability, clipping, occlusion and hit testing on representative desktop and mobile devices. Check 200% text, keyboard-only operation, WebGL failure/recovery and slow connections. These are not replaced by model/logic tests.
5. Add missing meshes only after licensing, source identity and clinical review. Do not relabel a source canal as cord, infer vessels or generate guessed nerve trajectories.
6. Author and independently review structure-specific function, imaging, pathology and clinical teaching content. The dissection guide does not complete those pending tabs.

## Validation status

Machine reports are `docs/full-body-validation.json` and `docs/dissection-validation.json`. They cover source integrity/bindings, finite geometry, laterality, registration, camera bounds, stage visibility, landmarks, focused groups, removal/restoration and undo. They do not certify anatomical truth or clinical readiness. Browser interaction/WebMCP checks and independent clinical validation are not claimed. No diagnostic, operative-planning or patient-registration use is supported.

## Fact-check references

- [TTUHSC El Paso forearm tables](https://anatomy.elpaso.ttuhsc.edu/schemes/forearm_tables.html)
- [TTUHSC El Paso thigh tables](https://anatomy.elpaso.ttuhsc.edu/schemes/thigh_tables.html)
- [TTUHSC El Paso leg and foot tables](https://anatomy.elpaso.ttuhsc.edu/schemes/leg_tables.html)
- [TTUHSC El Paso hand tables](https://anatomy.elpaso.ttuhsc.edu/schemes/hand_tables.html)
- [TTUHSC El Paso back tables](https://anatomy.elpaso.ttuhsc.edu/schemes/back_tables.html)
- [TTUHSC El Paso thoracic wall](https://anatomy.ttuhscep.edu/schemes/thorax_wall_tables.html)
- [TTUHSC El Paso abdominal viscera](https://anatomy.ttuhscep.edu/anatomytables/viscera_abdomen.html)
- [TTUHSC El Paso pelvic viscera](https://anatomy.ttuhscep.edu/reproductive_system/pelvicvisc_tables.html)
- [TTUHSC El Paso head/neck muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html)
- [Plantar muscle layers](https://teachmeanatomy.info/lower-limb/muscles/foot/)
- [Gluteal region](https://teachmeanatomy.info/lower-limb/muscles/gluteal-region/)
- [Official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), rechecked 2026-09-06.
