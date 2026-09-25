# Model-first regression history — 25 September 2026

Follow-up to `SCENE-SIZING-QA-20260925.md`, based on Atlas `d0f5232`.
No runtime, anatomy, content, dependency, access or review-binding changes.

The validator had not recorded two functional migrations already present in the
saved product. The original portable baseline remains byte-for-byte unchanged
and pinned to `40e47408c40fe140e1a162a7fc011ce346d4be4f` and its existing hash.

1. `e36cd877c00f57c5a3a60998dfbb6c0df770ce7c`: `changeStage` now returns false
   for an invalid/exam-blocked request and true after a valid transition. This
   lets Search preserve the view and explain rejected study activation. The
   validator reads the exact parent and child sources and verifies old
   `fb9a7f674da920c75b726868d4fe994cb7bc77fdff0c4891f94f9ec4bc138cdd`
   and new `c0507a33e617b231b93bacbcd775efc0c693b6184b3fae74b55871d25ddd81f1`
   canonical hashes, with every other handler/callback unchanged in that commit.
2. `15029f9075b6a252d0b594e6e8229bea2bf01d94`: the contextual selection notice
   adds exactly one more binding of the existing guarded `undoDissection`.
   Exact parent/child replay preserves callback multiplicity and verifies no
   named handler changed. It does not deduplicate or ignore extra callbacks.

Five current-handler execution cases additionally test accepted stage/free
transitions, invalid stages and exam rejection of both valid stage/free requests.
Rejection must leave all state setters untouched and preserve the saved camera;
acceptance must dispatch the correct action, reset separation and leave Tray.

Related evidence: Search confirmation tests cover rejection/keep-current-view;
dissection-history tests cover guarded Undo/Redo; contextual Undo tests cover
single-removal identity, scope, mode and focus restoration. The model-first suite
continues to inspect live component markup and all original baseline contracts.
This repair does not claim a browser/GPU or clinical sign-off.

The prior mobile overflow failure is resolved separately by `d0f5232`.
After this regression checkpoint, export that verified runtime through the
existing generated website module pipeline; retain private audience and all
independent Atlas/case/lecture access gates.
