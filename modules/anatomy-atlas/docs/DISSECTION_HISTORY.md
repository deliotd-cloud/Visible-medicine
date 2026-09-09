# Undo and Redo in regional dissection

Open **Dissect** in any body region or the whole-body view. **Undo** restores the previous dissection state; **Redo** reapplies the last undone change. The controls sit beside Reassemble and use the existing compact, wrapping toolbar. No new panel or shortcut is required. This applies to the body explorer, including Shoulder & arm; the separate shoulder-pilot viewer is unchanged.

History covers selected layers, study windows/focuses, manual removals, individual/batch restoration, free exploration, reassembly and the visibility portion of loading a saved study view. It does not rewind camera rotation, system switches, source meshes, clipping, opacity or other display options. Undo/Redo clear the current selection, isolation/fading and zoom back to the normal context, matching the earlier Undo behaviour. If a system is switched off, its structures remain switched off until the user enables it.

The most recent **40 actual changes** are retained in memory. Repeated unchanged actions do not consume Undo or erase Redo. A new meaningful dissection change after Undo starts a new branch and clears the abandoned Redo branch. Both buttons are disabled when their stack is empty and during active practice; the actual action handlers also check those conditions before changing anything. The current view can still be bookmarked, but Undo/Redo history belongs only to the current explorer session; it is not stored in browser storage or sent anywhere. Reloading starts a fresh history.

## Implementation and checks

`app/dissection-data.ts` keeps past/current/future visibility snapshots. Snapshots contain exactly stage, focus and removed/restored IDs, never recursively nested history. Reducer updates are immutable; past/future stacks are capped. `app/body-explorer.tsx` supplies the guarded actions to `app/dissection-controls.tsx`. Existing labelled buttons, focus behaviour and responsive wrapping are reused.

`npm run dissection-history:test` exercises actual reducer replay across all 36 region/side scopes, source-bound visibility, every existing recipe, removal/restoration, saved-view visibility, no-op handling, branching, the 40-change cap and frozen-input immutability. It executes the actual explorer handler bodies and checks actual toolbar server-rendered markup for available/empty history and practice mode. The original handler baseline is retained with exactly the separately verified Undo/Redo migration; other handlers and callbacks remain pinned. This is software verification, not browser/touch or clinical acceptance.

No catalogue entry, study recipe, content lesson, clinical approval, licence, dependency, external viewer or paid-lecture permission is changed. No new anatomy or biomechanical simulation is implied. Independent clinical review and browser/device acceptance remain open.

The regenerated dissection manifest and workbench report now also include the three orbital motor views already present in the running atlas. This repairs a stale exported inventory; it does not introduce new recipes or change their definitions.
