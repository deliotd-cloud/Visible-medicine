# Specimen quiz availability checkpoint — 5 October 2026

Canonical Atlas source: `3a60c543c292066864437e4721efaded5c48bf64`.
This is a local integrated education checkpoint, not a public deployment or
clinical/assessment sign-off.

Identification answers, Reveal, Next/Finish and round replay now require the
renderer and every required source bundle to be ready. A synchronous readiness
guard revokes previously captured callbacks immediately on renderer or required
bundle failure. The current question, feedback and first-try results are retained;
Back to dissection remains available. Existing missing-bundle instructions still
require returning to dissection to retry; no new in-place asset recovery is claimed.

Callbacks are additionally bound to their question and round. Advancing or
replaying immediately invalidates old handlers, including before React rerenders.
The original identification reducer and scoring rules are unchanged.

Source evidence: 1,434 focused checks, including four availability scenarios and
three stale-question/round scenarios, plus the selected source integration checks.
Generated runtime, review binding, website access, persistence, motion and private
candidate regressions are recorded under the E-drive checkpoint below. Browser
evidence and any interrupted attempts are retained there separately; synthetic
renderer-loss events do not establish physical GPU/device acceptance.

Recovery/evidence locations:

- `E:/VisibleMedicine-LocalStaging/20261005-specimen-quiz-readiness/`
- `E:/VisibleMedicine-LocalStaging/20261005-specimen-quiz-readiness-website/`

No meshes, exact-source teaching packets, dependencies or licence notices were
changed. The current renderer/display revision invalidates old geometry approvals;
revision-bound radiologist review is still required. No approvals were created or
migrated. Patient scans, CT-head accepted boundaries, private candidates, paid
lecture access and the desktop clinical PACS remain outside this change.
