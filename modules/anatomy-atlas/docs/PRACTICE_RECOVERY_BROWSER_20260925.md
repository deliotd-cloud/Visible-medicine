# Practice recovery — real browser sample, 25 September 2026

Tested the exact regional export from Atlas
`acc99b3a2af285e068e0018b1644c4343ec1242b`, also embedded in private website151.
Manifest SHA256:
`ec4786990f829d71819bc52f31c417946fbe7603563a5592102ccd3f29409024`.
Both loopback servers verified all 199 manifest files before serving. No production
JavaScript, models, scans, masks, website access or patient data were changed.

## Download failure, practice and return

The first request for `thigh-muscles-dissection.glb` deliberately returned 503.
The second served the verified original after 5 seconds. Server evidence recorded
exactly those two target requests. Real in-app Chromium, default 1280×720 viewport:

1. The missing group produced an anatomy warning and Retry missing anatomy.
2. Prepared stage 2, selected left femur FMA24475, Posterior camera, Spread 1%,
   and Imaging/CT. There were 89 enabled structures and 77 loaded quiz candidates.
3. Started 5-question Find on model practice. Question 1 was left adductor magnus;
   unavailable surfaces were excluded. The irrelevant failed-group notice was
   absent during practice because the quiz requests only its retained candidates.
4. Skip & reveal produced Skipped and score 0/1. Exit practice → Dissect restored
   left femur, stage 2, Posterior, 1% and Imaging/CT.
5. Retry missing anatomy showed 11/12 groups loading, then the warning/loading
   indication disappeared. A screenshot confirmed rendered surfaces and the
   restored study state. This is not a failure of an already-loaded quiz target.

## Actual WebGL context interruption during practice

A separate parent QA page embedded the unchanged application. Two local-only
buttons invoked the browser's `WEBGL_lose_context` extension on the child canvas;
the parent reported actual `webglcontextlost`/`webglcontextrestored` events.
This is software-triggered real context loss, not a simulated React notice and
not a physical graphics-driver reset. The shell is not shipped with the website.

1. Started 5-question practice with 95 loaded candidates. Question 1 was right hip
   bone, score 0/0.
2. Context loss displayed the interruption/recovery notice and paused practice.
   Skip & reveal was disabled; question, target and score remained unchanged.
3. Restoring that context re-enabled Skip & reveal on the same question at 0/0.
4. Skipped it, producing feedback and 0/1. A second loss retained that feedback
   and disabled Next structure.
5. The application's Restart 3D view restored availability without discarding
   feedback or score. Next structure advanced exactly once to question 2,
   left iliotibial tract, still 0/1. Screenshot confirmed anatomy rendered again
   with labels hidden and the expected question.
6. During a third loss, Exit practice remained usable. Explore became available
   and its structure panel remained accessible while the interruption notice
   offered Restart 3D view.

## Evidence boundaries and follow-up

- Current source tests: practice-return-view 22 actual-handler scenarios;
  renderer 774 checks/12 sequences/40 handler cases pass.
- Download console included the deliberate 503 and existing THREE.Clock warning.
- The framed context-test page logged one `MutationObserver.observe` non-Node
  TypeError at initial page load, without a source URL/stack in the available log.
  The recovery interactions above subsequently passed. Source inspection found
  the practice popup observer guarded by an existing element check.
  A follow-up diagnostic attached error listeners to both page realms (neither
  captured that error). An empty-iframe control containing **no Atlas code or
  scripts** reproduced the identical error at a fresh timestamp. This isolates
  the error from Atlas application code in this browser environment, although
  its precise browser/instrumentation component remains unidentified. Do not
  claim a clean overall browser console or change application code to hide it.
- These are one-region, desktop, Find on model samples. No mobile/touch,
  screen-reader, all-question-mode, physical GPU reset, malformed GLB or patient
  imaging acceptance is claimed. The overall viewer gate remains pending.
- All owned QA and diagnostic tabs were closed, all server handles stopped,
  and none of the four test ports remained listening (closing TCP sockets may
  remain briefly).

Harnesses retained in the main coordination workspace and D recovery:
`work/serve-practice-retry-qa-20260925.mjs` and
`work/serve-practice-context-qa-20260925.mjs`. Diagnostic/control harness:
`work/serve-context-diagnostic-20260925.mjs`; only that diagnostic version adds
an error listener to served HTML, leaving all production JavaScript/models exact.
