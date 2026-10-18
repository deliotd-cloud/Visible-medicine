# Embedded model reload recovery

The embedded CT/MRI and existing 3D comparison retains an active structure
selection request when its model frame reloads. The scan stays open; a fresh
model session must confirm the current structure before the comparison reports
that the requested selection succeeded.

## Recovery behavior

If a focus request was pending, or waiting for the first model snapshot, a
reload preserves that current intent. The host waits for a valid snapshot in
the new session before sending one replacement request for the latest selected
scan concept. It then requires the new request's acknowledgement and a newer
matching snapshot. Replies from the old session cannot confirm the selection.

An annotation that is not ready sends no focus command. Model practice or an
in-model guide cancels the pending intent. Refusal and timeout also cancel it.
Reloading afterward does not silently recreate the request or overwrite a
manual selection. The existing Show structure in model action remains the
deliberate recovery path when the fresh model selection differs.

The iframe source remains stable across compatible concepts. A reconnect does
not reload the scan, select a different scan structure, create a new anatomy
mapping or change access. CT/MRI and the generic 3D model remain separate,
unregistered subjects; this is not spatial synchronization.

## Scope and review

The production change is limited to `components/HeadAtlasInlineComparison.tsx`.
Its actual-component regression harness gains reconnect cases. A separate
comparison-control test fixture was updated to supply existing disclosure props
and check the current control labels; that fixture repair adds no UI change.
Source geometry, masks, annotations, teaching packets,
quiz scoring, entitlements and the desktop PACS are unchanged. No asset,
dependency, fee, new toolbar or clinical claim is added.

Evidence is under
`F:/VisibleMedicine/staging/20261011-inline-focus-reconnect`.
The regression-before receipt retains the reproduced lost-request failure.
All 33 final linking tests, a fresh TypeScript check, protected Review verification
and the full website build pass. Earlier fixture failures and their corrected
runs are retained. All 32 protected inputs are unchanged; Atlas source remains
clean at `74a9c142`, and the Review integration remains `dabfbb8e`.
Scoped source recovery is under
`F:/VisibleMedicine/recovery/checkpoints/20261011-inline-focus-reconnect`.
These are same-machine source checkpoints, not a complete website or private
dataset backup. Signed-in browser/GPU acceptance remains separate from synthetic
component checks. No publication or clinical approval is implied.
