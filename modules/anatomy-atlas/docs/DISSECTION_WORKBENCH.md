# Regional dissection workbench

This milestone strengthens shoulder-style removal, exploration and restoration in all eleven individual regional explorers. It reorganises the existing recipes; it does not add anatomical surfaces or certify a dissection depth. The separate nine-structure shoulder pilot remains unchanged.

## How to use it

1. Choose a region and side. Regional pages begin with their available assembled anatomy.
2. Choose **Layer by layer**. Use the named layer cards, stage menu or previous/next buttons. Each card reports how many catalogue entries its clean recipe retains.
3. Expand **Next** to inspect the actual entries to hide and restore before applying the next step. A stage change clears manual removal/restoration, enables all systems, resets cutaway/opacity and separation, and fits the supplied preset. It may therefore restore anatomy hidden by a system switch or a manual edit.
4. Open **Study windows & focuses** to search, filter and preview independent organ, vascular, connective or close-up views before applying one. They are deliberately not numbered as additional layers. The whole body has system comparisons, not one global dissection-depth sequence. See the [current study library](STUDY_LIBRARY.md); earlier milestone counts below are historical.
5. Select and remove individual structures to customise a view. In the study guide, expand **Removed from this view**, search by name/source name/FMA identity/side, or filter by system. Restore one result or all matching results. A group restoration is one undoable dissection change; it does not alter unrelated removed entries.
6. Reassemble, use Undo (up to forty dissection snapshots), or save the current configuration using the existing device-local study views. Camera/system preferences are not part of dissection Undo history.

### Keyboard history — 17 September 2026

In a regional/whole-body **Dissect** workspace, use **Ctrl/Cmd+Z** to undo and
**Ctrl/Cmd+Shift+Z** to redo; **Ctrl+Y** also redoes. Keyboard focus must be
inside the Atlas workspace. These invoke the existing history actions and do
not rewind camera, separation or display settings. Existing button tooltips
and accessible shortcut metadata expose the commands; no extra toolbar is added.

Text inputs, editable content, select/combobox controls, dialogs, separate
internal/reference studies, Explore and Practice are excluded. Held-key repeat,
IME composition and already-consumed events are ignored. An unavailable action
does not consume the key. Events outside this Atlas or inside another nested
workspace are not handled. The separate shoulder pilot is unchanged.

`npm run dissection-shortcuts:test` checks chord/state guards; browser acceptance
and saved-source evidence belong to the coordinating checkpoint. These shortcuts
do not add anatomy, alter source identities or imply clinical/device acceptance.

## Regional coverage

| Region | Layer steps, including assembled/bones | Independent windows | Focused views |
| --- | ---: | ---: | ---: |
| Shoulder & arm | 4 | 3 | 6 |
| Forearm | 5 | 2 | 6 |
| Hand | 3 | 4 | 7 |
| Hip & thigh | 6 | 2 | 7 |
| Lower leg | 4 | 3 | 7 |
| Foot | 5 | 2 | 6 |
| Thorax | 4 | 6 | 7 |
| Abdomen | 3 | 5 | 7 |
| Pelvis | 4 | 3 | 4 |
| Head & neck | 4 | 13 | 18 |
| Spine & back | 5 | 5 | 7 |
| Whole body | — | 7 | 2 |

Totals: 47 regional layer steps, 55 independent views and 84 focuses. An assembled step and a bones-only step are included in each regional layer count. These are visibility recipes—not 47 anatomical depth layers. Missing abdominal-wall, fascial, neural and other anatomy remains disclosed in each region's guide.

## Implementation and safeguards

- `lib/dissection-workbench.ts` partitions the authored stage kinds, compares a proposed stage with actual enabled/non-removed catalogue IDs, and filters the removed tray. It does not change any recipe, source coordinate, mesh, identity or saved-view format.
- Existing cumulative peel semantics remain unchanged. Independent windows can restore structures, so they are excluded from the numbered progression. This avoids presenting an organ or dental study window as the next physical layer after the skeletal framework.
- `restore-many` is atomic in the existing dissection reducer. The explorer intersects requested IDs with currently removed structures in the current region/side before dispatch, and enables their systems. Practice mode rejects stage, focus and group-restore actions; preview lists and layer cards are suppressed during a quiz.
- Counts refer to catalogue visibility, not successful downloads, pixel visibility or surface occlusion. Existing loading/failure status remains the authority for asset readiness. Ghost tissues remain non-selectable and keep their existing source-aligned display.
- Controls use native buttons, a native searchable tray/filter, visible focus outlines, wrapping layouts and 44-pixel primary action targets. The layer map scrolls horizontally. No animation, dependency, font, texture, external diagram, AI API or new licence obligation is introduced.

## Validation and remaining acceptance

`npm run dissection-workbench:test` performs 70,927 assertions across all region/side combinations: every recipe remains reachable, independent windows are excluded from layer tracks, clean layer sequences only remove entries, preview deltas match actual reducer outcomes, searches stay scoped, batch restoration is deduplicated/undoable, and anatomy remains unchanged. The machine-readable report is `docs/dissection-workbench-validation.json`.

Existing dissection, practice, saved-view, imaging, source-geometry, inspection and explode regressions remain required alongside type/lint/build checks. Automated helper tests are not browser interaction or visual/device testing. Hands-on keyboard, touch, text zoom, narrow-screen readability, pointer picking and classroom usefulness are still pending, as is qualified anatomical review of the source surfaces and authored recipes. Nothing here simulates cutting, tissue reflection, surgery, scans or patient registration.

The subsequent [whole-body arrangement milestone](BODY_ARRANGEMENT.md) adds prominent system presets and a clearly non-anatomical, source-preserving arranged display. Its algorithm is original; the reference site's distributed code/assets were not copied. Regional stage/focus actions return from the tray to source-position dissection.
