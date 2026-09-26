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

Run: node scripts/test-structure-quick-check.mjs
Browser component check: node scripts/preview-structure-quick-check.mjs
