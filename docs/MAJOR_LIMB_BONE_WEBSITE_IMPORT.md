# Major limb bone questions: local website integration

The regional learner and protected Clinical Review now share Atlas source
`1dc4f82f677c3a9ccd04f2d0d875210ac0d1ef98`. Ten original question groups cover
17 retained selections. They remain formative drafts awaiting revision-bound
radiologist review, not clinical approval or scored fracture/image exams.

The separate Atlas remains independently versioned. Its existing generators
produce learner and Review content; no generated module was hand-edited.
Existing website presentation and access controls are preserved. No new asset,
dependency, fee, patient data, imaging registration or entitlement is introduced.

## Evidence

- 28 integration tests pass, including exact source hashes, all 17 question
  placements and rejection of stale teaching, altered answers and source data.
- 35 CT/MRI-to-3D linking/guided-learning tests pass.
- Fresh TypeScript and the combined Review verifier pass: 1,144 source files.
- Regional module and isolated E website builds pass. The first website build
  encountered an EPERM output lock; the current preview session was confirmed
  live, deliberately stopped, and the build rerun successfully. Both logs remain.
- 46 HTTP route/access/Review checks and 19 exact learner asset readbacks pass.
- All 136 regional models and 12 scopes are unchanged; the full delivery
  inventory still has 137 models at 144 paths with unchanged geometry records.

Learner manifest SHA-256:
`d442f8e3ffb60d9eb234a38ebf9e761eca962b28da430e9adf386e5842faee1d`.
Learner source inputs: 1,111. Review integration SHA-256:
`68f7db8f7a940cd1a30a71f8d834c86a6d4674babfff8bab678c8e3bdca91481`.

Actual 1280×720 browser verification used a separate temporary tab, navigating
through Atlas → 3D, selecting Left radius, then Practice → Quiz notes. Correct
and incorrect feedback, explanation, cleared answers, disabled Check answer and
focus return after both reset paths were confirmed. The initial guessed
`/atlas/forearm-3d` path returned 404; verification used the current visible
navigation instead. The temporary tab was closed. Existing scan/model tabs and
the historical preview on port 3001 were not reloaded or changed.

The anonymous tab correctly received the sign-in message for model assets.
Question interaction is verified, but signed-in model/GPU, native CT/MRI and
clinical acceptance are not inferred from this check.

## Recovery and next work

`E:/VisibleMedicine-LocalStaging/20261009-major-limb-bone-integration/saved-state.json`
records the scoped local commit, source-only recovery hashes and incremental
bundle. This is same-machine E recovery, not verified GitHub/off-device backup.
32 obsolete generated chunks have verified recovery copies on E. After matching
existing recovery hashes, 144 duplicate build-only model files were removed;
canonical model sources remain unchanged.

Local preview session 52688 serves port 3000; it replaces deliberately stopped
session 86943. No public deployment, sign-off, scan/mask/PACS or access change.
Specialist files and the full pending shared-plan tail are preserved. Continue
substantive regional teaching and linked-learning gaps; do not repeat this
completed import. The complete project goal remains active.
