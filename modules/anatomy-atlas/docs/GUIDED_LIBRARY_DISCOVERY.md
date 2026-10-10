# Guided learning library discovery

The whole-body Guided learning picker offers local search and a region filter
inside an optional Find a tour disclosure, collapsed initially to keep the model
prominent. Learners can find an existing tour without scrolling through the full
list. The regional picker retains its simpler scoped choices. Search uses existing
tour metadata; it does not add anatomy, new teaching or new access rights.

## Interaction contract

- Filtering is discovery only. It does not change the active tour, camera,
  playback, reading state or linked imaging context.
- Only explicitly selecting a different visible result switches tours, suspends
  the old imaging context and creates the existing source/revision-keyed player.
- No results is a recoverable search state, not an empty or failed atlas. The
  active tour and Exit remain available; clearing filters restores choices.
- Regional libraries never offer tours from outside their own region. Nested
  eye/ventricle choices still require their exact existing source bindings and
  remain lazily loaded.
- No clinical text, source identity, geometry, mask, patient-space registration,
  entitlement, approval or external dependency changes are part of this work.

## Verification and delivery

The actual picker component harness exercises discovery, selection, source scope
and unchanged active-player identity. Existing regional player and camera tests
remain separate from visual/clinical acceptance. Renderer and Review bindings
must be regenerated together; changing this UI does not carry forward approval
of a changed renderer revision.

Source-only milestone: the website learner and protected Review must be imported
together before claiming website availability. An actual desktop keyboard and
enlarged-text check remains necessary. No native-image, GPU or clinical acceptance
is inferred from component tests, type checking or a build.

Recovery evidence is under
`E:/VisibleMedicine-LocalStaging/20261008-guided-library/` on this machine only.
