# Selected-structure visibility and recovery

## Behaviour

A conditional notice beside the model identifies a selection whose system is off, dissection entry is removed, effective opacity is reduced, or source bounds intersect the current cutaway. It is absent when none applies and during active identification exams.

**Reveal selection** restores that removed entry, enables its system if needed, and adds selected-surface opacity/cutaway exceptions only when needed. The selected ID, camera, view, workspace, dissection stage/focus, other removal overrides, arrangement style/amount, cut plane/position/direction and other tissue opacity settings stay unchanged. Enabling a system naturally enables its other eligible entries too. Recovery is not a new selection and emits no imaging-selection event.

An active exemption is explicitly shown: “Selected structure kept uncut; other structures still follow the cutaway.” **Reapply cutaway** turns it off. The advanced inspection section also contains **Keep selection uncut**, beside Keep selection solid. The option follows the current selection when it changes. It never bypasses the shoulder's fixed source crop. Original-position references still follow the original cut. Practice uses its normal inspection state, without study exceptions.

The old Reveal uncut action cleared the global cut plane and selected system opacity (and reframed the regional camera), but failed to re-enable an off system. Its replacement is targeted and reversible. The shoulder already shows a selected muscle through a bones/cuff layer: no false “layer hidden” notice or unnecessary layer reset was added.

## Scope and limitations

Status uses the same clamped plane level as the renderer, the complete regional/side frame, and source-entry bounds. Shoulder bounds retain the existing inferior crop at -3.15 scene units. Exploded surfaces carry their cut planes with their translations, so source-space classification applies to Spread, Extract selected and Tray.

Fully rejected bounds produce “Selection clipped by cutaway”; intersecting bounds produce “Cutaway may hide part of the selection.” This is not screen-occlusion detection, a retained-surface percentage or clinical measurement. Other anatomy can still obscure a restored structure; rotate, isolate or frame as appropriate. Existing loading/retry controls handle missing/failed assets. Recovery cannot invent or download unavailable geometry.

Renderer opacity is clamped to 5–100%, not zero. Below 20%, mesh picking and labels are disabled. The selected-solid override is considered before reporting transparency. Recovery changes this exception rather than the opacity of every mesh in the system.

## State and verification

`InspectionState.keepSelectedUncut?: boolean` is optional; omission retains legacy behaviour. Saved views preserve explicit true/false and reject non-booleans. No bookmark version, ID or coordinate schema changes. `lib/selection-visibility.ts` contains the pure helpers; `sectionLevel` is shared with rendering. The fourth, selected argument of `sectionPlanes` is passed only by the body/shoulder main model loops, not original-position ghosts.

- Selection visibility: 1,485,539 assertions; 37 regional/side/shoulder scopes, 147,180 plane cases, 2,064 exact recovery-handler cases. Actual Three planes/presentation offsets, source/state immutability, model-loop AST wiring and installed notice UI server rendering are exercised.
- Inspection: 1,221,799 existing raycast/material/plane assertions. Study views: 17,721, including new-flag round-trips for body/shoulder and malformed-value rejection.
- Model-first: 2,503; shoulder workspace: 1,241, including 97 markup cases; atlas navigation: 169,702. Existing recovery, explosion, practice, imaging and review regressions pass.

These are CPU/component/source-contract checks, not browser/GPU pixels, touch, screen-reader, zoom or clinical acceptance. Confirm actual notice placement, restore/reapply keyboard flow, all three arrangements, saved-view restoration and exam exclusion in an authorised working browser-test session.

No mesh, catalogue, profile, dependency, font, licence obligation, paid service, scan or clinical approval is added. All nine shoulder display-review hashes expire; teaching hashes stay exact and imaging remains absent. Current local saves are not proof of remote GitHub backup or private Site publication while connection/access remains unavailable.

Next: consolidate the full objective against current implementation, source evidence and acceptance results. Separate genuinely actionable gaps from requirements needing rights-cleared inputs, specialist review, the user's imaging adapter, restored remote access or working browser-test tooling. Do not add speculative UI merely to keep an unbounded goal busy.
