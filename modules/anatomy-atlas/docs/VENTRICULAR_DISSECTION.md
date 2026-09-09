# Brain ventricular dissection

## Use and scope

In Head & Neck or whole-body, search **Brain**, select it, open its details and choose **Dissect brain → Ventricular spaces**. The shared dialog also offers [Brainstem and cerebellum](BRAINSTEM_DISSECTION.md); switching studies resets the nested selection, visibility, camera and loading state. The ventricular study displays four coloured space representations: left lateral, right lateral, third and fourth ventricles. Rotate freely, use six camera presets, select by name/surface, hide/restore, fade others and frame a selection. Study view offers all, lateral, or third/fourth. Undo layers retains up to 30 real visibility/selection changes. Reassemble restores all four and zero separation. View controls are not part of layer history.

The folded separation control offers **Lift selected**, **Spread in 3D**, and **Spread on flat plate**. At 0%, structures return to source positions; nonzero separation is explicitly a teaching arrangement, not a clinical displacement or fluid-flow simulation. Optional faint **brain context** reuses both thalami, both caudate nuclei and the corpus callosum. Context is hidden during separation and restored at 0% if enabled. Its sub-picking-threshold opacity and absence from the label set keep attention on the four ventricular spaces. Context surfaces are whole structures, not separately segmented ventricular walls. The cerebellum, pons, medulla and other brain components are not displayed in this focused window.

The main atlas scene unmounts while the dialog is open. Its selected structure and camera are restored on return, with focus sent to the launcher. Parent and child geometry are never rendered simultaneously. The launcher is unavailable during active practice and the dialog closes if the parent selection changes. Required-bundle loading/failure/retry is tracked independently, including optional context. The existing modal and narrow side-panel styling are reused; no new global toolbar or route.

## Exact source ownership

| Space | Source FMA | PART-OF file | Original triangles |
|---|---|---|---:|
| Left lateral ventricle | FMA78450 | FJ1767 | 17,968 |
| Right lateral ventricle | FMA78449 | FJ1814 | 18,016 |
| Third ventricle | FMA78454 | FJ1730 | 3,870 |
| Fourth ventricle | FMA78469 | FJ1731 | 6,940 |

All four files are already components of the existing brain FMA50801 selection. This is a focused subset, **not** a complete 59-file brain decomposition. The other 55 source files remain in the unchanged main brain representation. The archived 1,022-record catalogue and original GLBs are unchanged. The four new selections do not represent four newly acquired anatomical structures. They have stable `vm:anatomy:body:head-neck:<side>:space:<source-name>` IDs and exact parent/source bindings, but are not registered as independent curriculum, bookmark, quiz or imaging targets.

The generator checks pinned official tables, hold policy, raw SHA-256, full parent membership, finite geometry and one connected component per source. The four source surfaces are combinatorially closed/oriented manifolds with no reported duplicate, collapsed or degenerate faces; this does not prove no self-intersection, real anatomical apertures or clinical volumes. The left source slightly crosses source X=0 (minimum −0.447205 mm); it is one continuous source surface, not an isolated speck. It is not cropped or mirrored. The original laterality and all positions are preserved. No anatomical admission hold is cleared.

The 846,988-byte GLB contains 46,794 triangles. SHA-256: `e99326a0fd0b0bdc0a64d2a1adbb7a63c758af6f765199b8febe851e62b9eab1`. Its immutable query suffix includes this hash. `catalog.json` records the source/parent bindings, transform, per-file topology, bounds and surface label anchors. Five context records and their bundle metadata are exact copies of existing catalogue records, with no source-file overlap with the parent brain. No parent aggregate is loaded in the focused scene.

## Reproduce and validate

Run `npm run ventricles:export` against the retained BodyParts3D v4 PART-OF cache, then `npm run ventricles:test`. Source changes or missing files fail rather than fetching an unpinned substitute. The dedicated test compares every exported triangle with raw source positions and winding at 0.001 mm quantization, checks bounds/anchors and independent topology evidence, rejects stale parent bindings, preserves existing context bytes, exercises actual launcher/close camera/focus callbacks and layer state, and server-renders controls with only the GPU scene replaced. Run the eye/model-first/content regressions, TypeScript and final production build before publishing. Server markup and mathematical checks are not browser, touch, focus-trap or visual acceptance.

## Rights, teaching and clinical gates

BodyParts3D v4 is distributed under **CC BY 4.0**, with the required creator credit, licence link and modification note in this view and the notices. Official [source/licence page](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html) rechecked 9 September 2026 UTC. Existing code licence, brand reservations and dependency obligations remain; no new dependency, fee-bearing API, font, texture or scan is introduced. Source freedom does not guarantee free hosting or clinical review.

Brief original draft notes use the [UTHealth ventricular anatomy laboratory](https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p01_index.html) as a factual reference, checked 9 September 2026 UTC. No reference figure/table/text is copied. Colours depict spaces, not solid tissue, signal intensity or CSF flow. Fine channels, horns, apertures and the aqueduct are not independently segmented; no artificial connecting tubes or flow arrows were added.

Before clinical/educational release, obtain neuroanatomical review of every shape, laterality, label anchor, spatial relationship and omitted connection; editorial review of the short notes; and device/keyboard/accessibility acceptance. Assess source-bound connections explicitly before any flow teaching or pathology simulation. No hydrocephalus diagnosis, normal-volume limit, patient registration or acquired imaging is inferred from this model.

The provisional CT/MRI head project remains separate and retains its own publication/privacy/review holds. Its CT and MRI subjects are not assumed to match each other or this generic source model. Atlas and lecture entitlements remain independent. Future CT/MRI or lecture links require reviewed child-ID/annotation/lesson bindings and host authorization; no protected asset is embedded or unlocked by this change.
