# Viewer study transitions and catalog loading

Study closure belongs to the selection event. Keeping the same parent retains
the open study; selecting another structure, clearing selection, or starting
practice clears the old parent and child state together. Returning from practice
restores the saved selection/view without reopening a closed study.

Explicit closure and ordinary selection changes restore the stored nested
launcher, falling back to the eye/ventricle launcher. A nested search that replaces
another parent's study closes it without restoring the old launcher, then stores
the new launcher's return target. Its eventual close returns to that new target.

The catalog effect initializes URL selection once before the scene mounts. This
uses the underlying state setter because no prior scene/study exists. Subsequent
selection paths use the transition callback. The effect depends on the stable
workspace mode callback and dissection dispatch, not the changing workspace
object, so mode/selection changes do not restart a request. Retry/input changes
still abort the old request and start a new one; the existing active-response,
timeout, and URL-application guards remain.

Focused evidence: `node --test scripts/test-viewer-effect-state.mjs`. Tests execute
the production callback/effect bodies with controlled state, focus queues and
catalog promises. They cover retained selection, closure/reselection, explicit
focus fallback, practice return, nested replacement and linked eye/ventricle
initialization/retry. This is source-level lifecycle evidence; browser, assistive
technology, renderer and clinical acceptance are separate checks.

## Integration verification — 26 September 2026

Nine lifecycle and 21 control-state tests pass, together with practice-return,
study-link, nested-navigation, selection-visibility, renderer, body-review,
body-decision and content-contract checks. The first nested-navigation run failed
because its extracted catalog callback fixture still supplied the old workspace
object and setter names. Updating only those bindings/assertions restores the
same behavioral checks; the rerun passes. Both logs are retained locally:

- `.local/test-logs/2026-09-26T10-58-13.304Z-25624-91a5429b.log` (initial failure).
- `.local/test-logs/2026-09-26T11-04-14.326Z-36740-5e6f4725.log` (corrected navigation
  and anterior-cardiac pathology pass).

TypeScript and focused oxlint pass, including the previously failing explorer.
The complete production module builds with 3,373 modules in 6.69 seconds using
bounded build concurrency; existing large-chunk warnings remain. Independent
read-only review found no actionable regression, but does not replace browser
acceptance. The owner subsequently allowed local-preview verification.

The fresh complete export is bound to `81ed12ca0cec3a2abdb876c165d6ac2fd5bcf031`:
199 files, 211,289,790 bytes; manifest SHA256
`2e6f13669c73c4570caf94c607f4d70ee3d08d0c74981807c76fe1b5459fa65e`.
The loopback server verified every exported file before serving. However, opening
its URL was rejected by the browser permission layer despite the owner's chat
approval. No alternate browser or indirect access was attempted; the server was
stopped. Browser/mobile/focus acceptance remains pending, as does generated website
integration. The live site is unchanged; no new GitHub or D-drive backup is claimed.
