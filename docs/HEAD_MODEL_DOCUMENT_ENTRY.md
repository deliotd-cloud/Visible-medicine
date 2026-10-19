# Native head image → full 3D model entry

The native CT/MRI viewer's **Full 3D Atlas** link uses ordinary browser document
navigation, not client-router reuse. It stays within the Visible Medicine website.
The exact structure/side/source/part tuple is unchanged. Configured local images
open the full model in the same tab; a manually chosen folder retains its scan tab
and opens the model separately with `noopener noreferrer`, as before. The optional
side-by-side comparison is unchanged.

External Chrome reproduced an initial `about:blank` model frame when following
the old client-router link. The same exact destination loaded normally after a
full document load. Direct one-time frame-src and blank-child replacement attempts,
including a post-paint attempt, did not resolve that reproduction and were rejected.
Those experiments are retained outside the candidate source; no auto-reload loop,
timer, new dependency or model takeover is shipped. The browser-engine/framework
root cause is not established.

Actual local Chrome checks: MRI Pons selected at native slice145/256 and CT Pons
at67/199 both open the existing Pons dissection through the revised link without
a manual reload. The loaded model confirms Pons and exposes current CT/MRI links.
This is semantic anatomical comparison, not cross-subject spatial registration.
No scan screenshots, patient data uploads or clinical decisions were made.

The actual source link is extracted, compiled and rendered by
`tests/head-model-entry-navigation.test.ts`; original live-model source/origin/
revision/session/sequence/practice/guided/unmount checks remain byte-exact.
Exact website Review binding advances; Atlas source, learner exports, masks,
models, independent access, clinical approvals and the desktop PACS do not change.
Register44 preserves all71 requirements and eight optional ideas, with unchanged
statuses, owners, scope and acceptance. Historical43/42/41 proofs remain separate.

These focused checks are not whole-site regression, signed-in role acceptance,
in-app-browser crash resolution, peak-memory/GPU or clinical validation. No public
deployment or new remote/off-device backup is claimed.
