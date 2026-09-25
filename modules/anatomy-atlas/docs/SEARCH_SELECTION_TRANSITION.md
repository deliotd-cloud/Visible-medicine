# Keep searched anatomy visible when leaving Practice

## Reproduced defect

In the unchanged published regional module (Atlas `2b23603`, website private153),
switching Muscles off in Explore, entering idle Practice and searching for Left
sternocleidomastoid selected the structure but left its system switched off.
The panel contradicted itself: “Muscles enabled” followed by “System off”.
The same Search ordering exists in source baseline
`9f8a28c45fd20d2c9d423a06c9b7a951d06a5bba`.

Search applied selection before restoring Explore's saved display snapshot.
Reversing those operations fixes system visibility, but not every removed-target
case: the selection callback could still inspect the prior render's removed IDs.

## Correction

- Restore Explore before applying a Search structure selection from idle Practice.
- Resolve target removal against the latest functional dissection state, including
  a workspace restoration queued earlier in the same event.
- Restore only the selected target when needed. Preserve other removals and
  existing Undo/Redo when the selected structure is already present.
- Announce selection once; let the existing live visibility status describe the
  resulting state, instead of duplicating it or describing stale state.

Exam and region guards, imaging selection publication, anatomy geometry,
teaching and independent access are unchanged. This does not auto-remove tissue
covering an enabled target: its “Behind tissue” label can correctly remain.

## Verification — 25 September 2026

`node scripts/test-search-selection-transition.mjs --pre-fix-probe` passes
19 actual-component/handler scenarios. The pinned old component and callbacks
fail the visibility assertion. The old selection callback with the new Search
ordering separately fails removed-target restoration, demonstrating why both
changes are necessary. Coverage includes both learning-mode origins, destination
system settings, removed targets, repeated selections, unrelated removals,
unchanged systems, valid identity and exam rejection. The harness runs the
actual workspace hook and dissection reducer, with controlled React/DOM boundaries.

Existing study-mode transition (16 scenarios), Search preview focus, workspace
session and practice return (22 scenarios) checks pass. Renderer recovery,
selection visibility and body-review checks pass. TypeScript and shared regional
production build pass. The build retains its existing large-chunk warning.
Focused lint for `atlas-workspace.tsx` and the new test passes. Lint of
`body-explorer.tsx` still reports three issues in unmodified effects (lines 416,
420 and 464: synchronous effect updates and missing dependencies); whole-file
lint is not claimed clean.

Browser acceptance used the production build with 773 verified source inputs
and unchanged, manifest-pinned reference assets, served on loopback only:

1. The exact desktop failing journey now returns to Explore with Muscles enabled
   and the selected left sternocleidomastoid label present.
2. At 390 × 844, the same Search journey opens the Structure info drawer with
   “Left sternocleidomastoid selected. Enabled in dissection.” exactly once.
   Return to model restores focus to Structure info; the label remains present
   and document width equals the 390-pixel viewport width.
3. Hide the selected target in Explore, visit Dissect, enter idle Practice, then
   search for it again: it is restored in Explore, enabled and labelled. This
   exercises the destination-removal case in the real browser.

Temporary viewport reset, owned tab closed and QA server stopped. This is not
physical-device, screen-reader, hosted-authentication or clinical acceptance.

Renderer review binding and the unsigned 11-selection pilot index are refreshed;
all 11 imaging gates remain blocked and no approvals were issued. Generated
website integration/publication remains a separate next step recorded in the
coordination checkpoint. Do not edit the website's generated module manually.
