# Orbital guided learning — local website delivery

Atlas `5a0952d7ff841e0aac20522faf2a4d4cfe030415` is imported through the generated
learner and protected Clinical Review pipelines. Six right extraocular muscle
stops use the existing corrected globe and exact source-bound frames. Head/neck
offers larynx and orbit; the whole-body library includes all thirteen tours.
The shared player retains its smooth 1.8-second camera transition and pauses
when hidden or when teaching notes open. No new toolbar or pop-out is added.

All 136 model objects / 143 delivery paths remain byte-identical. Independent
specimen pins, notices, access policies and private decisions are preserved.
There are no new assets, dependencies, mandatory fees or patient scans. The tour
is static anatomical orientation, not gaze simulation or registered patient data.
Teaching remains draft and requires revision-bound radiologist sign-off.

## Verification

- All 238 website tests, TypeScript, protected-review verification/build and
  production build pass. The existing regional-tour integration test now checks
  all thirteen tours, corrected orbital context, all six frames and rejection
  of wrong globe bundle, altered stop order and altered frame geometry. All296
  step/modality bindings match review teaching. Learner and review source hashes
  agree. Only current export fingerprints changed; historical assertions remain.
- An initial run found one stale integration fingerprint; updated after reviewing
  the generated integration inputs and passing the review verifier. No production
  validator or access gate was weakened to make the test pass.
- Actual local website at375x812: entered Guided learning, chose orbit, traversed
  all six labelled stops with one canvas and no horizontal overflow. Foreground
  playback reaches the final inferior view; hiding the tab pauses movement and
  explicit Play resumes it. Finish returns Explore and launcher focus. Screenshot
  inspected with website header, region navigation and model visible together.
- Authorized body review for right medial rectus displays all six captions,
  frame/context details, revision, references and limitations. Screenshot inspected
  with readable wrapping at375px. No decision or approval submitted.
- Long-running local preview hit a Vinext async-context stack overflow after
  regeneration; restarting only that verified preview process restored HTTP200.
  No framework, configuration or dependency patch was needed.

Logs and exact GitHub/D restore evidence live in the main coordination workspace's
`work/ORBITAL-WEBSITE-CHECKPOINT-20260928.md`. Superseded hashed runtime files were
copied and hash-checked under `work/orbital-tour-prior-generated-20260928` before
replacement; generated code was not manually edited.

This is local desktop-browser mobile emulation, not public deployment,
physical-device certification or clinical approval. The separate fracture task's
files and plan entry remain untouched and excluded from this Atlas commit.
