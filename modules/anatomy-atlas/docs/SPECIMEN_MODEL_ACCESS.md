# Access feedback in nested and specimen views

Eye layers, femoral/cranial arterial components, independent specimen dissection
and specimen identification now preserve the typed failure reason supplied by
the existing exact-request `BodyScene` classifier. Sign-in and access-denied
responses receive fixed guidance; other errors keep their generic messages.
Dissection keeps the existing retry button/scope and retains view/history state.
Identification directs the learner back to dissection rather than introducing
another retry control into an active question.

Success and retry clear the relevant access reasons. Multi-bundle views derive
notices only from currently required failed bundles, so an unrelated/hidden
bundle cannot replace the current message. Practice and guided progression remain
gated on renderer and required model readiness. Failure immediately revokes stale
identification callbacks; a subsequent successful load can recover the current
question without changing its answer or score.

Arterial-component retries also preserve the independently reported renderer
health. Resetting it to `starting` while only remounting an asset left the parent
waiting for a new canvas-ready event that the already-ready renderer would not
emit. The regression test first reproduced both affected arterial views, then
verified that successful asset loading alone recovers the link. Actual renderer
loss still blocks it.

`npm run specimen-model-access:test` exercises actual component callbacks with
controlled GPU/transport boundaries: fixed 401/403/generic feedback, retry cache
scope, view preservation, Education readiness, practice gating, stale answer
callbacks, recovery and unrelated bundles. Existing guided-player and eye
Education tests provide interaction regressions. This is not native browser/GPU
acceptance, authentication testing or clinical approval. No content, mesh, mask,
entitlement, licence, dependency or desktop PACS change is intended.
