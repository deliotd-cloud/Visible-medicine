# Shoulder structure checks — 26 September 2026

The nine existing shoulder quick questions now have native radio choices,
Check answer, keyed feedback/explanation and Try again. The same component is
used in Practice and the quiz note renderer. Identification remains a separate
model-selection exercise and is not disabled by an unanswered quick check.

Changing structure or any question/key/explanation clears the attempt. Missing,
ambiguous or malformed keys cannot be marked. No answers, scores or clinical
decisions are persisted. These are formative drafts, not accredited assessments.

Keys and original short explanations use the facts already taught by the
existing shoulder sections. Existing questions and options are unchanged.
No new image, dataset, dependency or font was imported. The key and explanation
are visible in Clinical Review and included in each teaching revision. All nine
require new radiologist teaching sign-off; no old approval is migrated.

Verification: focused component-event/SSR tests; 108 actual shoulder entry SSR
cases (with a scene double); review history and 235 review safety checks;
TypeScript; production shoulder module build. In the real browser component
preview, incorrect/correct answers, keyboard submission, retry focus and
structure-change reset were verified. This is not full integrated website,
mobile/touch, assistive-technology or live-deployment acceptance.

Historical validators keep their original document hashes. The only new fields
removed when reproducing pre-key teaching are correctAnswer and explanation;
all pre-existing teaching, questions, options, meshes and identities remain
hash checked. Current revision checks retain all fields.

Local-only: website generated exports and hosted deployments have not been
updated. Integration/publication and radiologist approval remain pending.

## Production-module follow-up

The exact source-pinned shoulder export was staged on D and exercised with real
WebGL anatomy: wrong/right answers, keyboard retry and independent exam scoring
work. This exposed an existing exam-exit defect: it kept the cuff-only layer and
discarded the starting presentation. Exam entry now captures a deep local study
snapshot; exit restores selection, layer, systems, layout, separation, reference
plane, opacity/cutaway, labels and camera/zoom. Exit still works if rendering
becomes unavailable. Repeated sessions capture fresh snapshots; bookmarks remain
an explicit separate restoration. No answers, scans or access rights are copied.

The actual-handler test `scripts/test-shoulder-exam-return.mjs --baseline`
reproduces the defect at 65d1563. Current behavior passes the same assertions for
all three layers, plus renderer-unavailable exit, blocked start and repeat entry.
The saved-reference-plane test continues to pass after sharing restoration code.

Run: node scripts/test-structure-quick-check.mjs
Browser component check: node scripts/preview-structure-quick-check.mjs
