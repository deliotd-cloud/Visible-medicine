# Neck muscle questions: local integration

The regional learner and protected Clinical Review import Atlas revision
`017344c4c08fda81c9e1d64853c5ab05c7320d71` together. Nine original question
groups cover eighteen bilateral scalenes, sternocleidomastoid, platysma and
infrahyoid selections. They replace identification-only prompts using existing
Quiz controls; no new panels or navigation are added.

Complete source identities and bundle hashes bind each draft. The integration
test verifies learner/Review source parity, exact question and explanation
bytes, and refusal of stale, changed-answer or changed-source review packets.
The source batch separately tests correct/incorrect feedback, retry/reset,
keyboard focus and exam concealment. These tests do not establish signed-in
browser/GPU acceptance or clinical approval.

Normal anatomy facts are referenced to the university sources recorded in
`atlas-review/content/neck-muscle-quiz.ts`; publisher prose, tables and assets
are not imported. Original wording/code retain project terms. Existing model
licences and credits are unchanged.

No models, scans, masks, specialist boundaries, desktop PACS, access policy,
dependencies or public deployment change. Source comparison does not imply
patient-space registration. Exact-revision radiologist review remains required.

Local verification and scoped recovery receipt:
`E:/VisibleMedicine-LocalStaging/20261009-neck-quiz-integration/saved-state.json`.
This is same-machine recovery, not verified GitHub or off-device backup.
