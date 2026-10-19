# Learning immediately after CT/MRI practice feedback

The native head viewer now offers a collapsed **Learn & compare this structure**
section after correct, incorrect or deliberately revealed answers. It reuses the
existing source-backed teaching packets and exact semantic links to the existing
anatomical 3D Atlas, plus the other imaging modality when that counterpart exists.
No new anatomy, masks, meshes, teaching facts, dependencies or licences are added.

## Boundaries

- The active target must belong by object identity to the current loaded study.
- Only explicit feedback is eligible. Pending questions, opening/error states,
  retries, next-question transitions, finished sets and replaced studies cannot
  retain the section. Its disclosure resets with target/modality/revision.
- The exact head-manifest revision and existing ID, label, side and representation
  allowlist must match. MRI-only concepts never fabricate a CT counterpart.
- Links explicitly open new tabs using `noopener noreferrer`. They preserve the
  current question and session score; scan tabs require their own approved folder
  selection. No file handles, patient coordinates or scores are passed in URLs.
- The studies and generic anatomical Atlas are separate, unregistered subjects.
  This is concept comparison, not validated patient-space synchronization.
- Existing teaching remains visibly draft with references and review revisions.
  Correct feedback is allowed to offer optional learning, but the completed-set
  Review policy and immutable first-attempt scoring are unchanged.
- Native disclosure and links retain keyboard controls; expanded learning sits
  outside the feedback live region so all prose is not announced as a status.

## Verification and acceptance

Focused component/hook tests cover all feedback outcomes, concealment, retry,
advance, study replacement, finish, stable first attempts, stale/altered identity
refusal, MRI-only links and all four existing teaching packet families. Tests
use synthetic entries and masks, not clinical scans. Static markup and a
deterministic hook scheduler are not browser/GPU or clinical acceptance.

Local evidence and source recovery:
`E:/VisibleMedicine-LocalStaging/20261009-head-feedback-learning/`.
Actual signed-in desktop/native-folder click-through and radiologist review
remain separate. No public deployment or verified off-device backup is implied.
