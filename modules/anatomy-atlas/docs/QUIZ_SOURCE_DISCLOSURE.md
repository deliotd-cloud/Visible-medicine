# Compact practice sources

Regional/whole-body `QuizNotes` keeps the question, answer controls, feedback and
existing formative-draft status in the main reading flow. Longer source limits
and reference links sit in a native, initially collapsed **Sources & limitations**
disclosure. Full text and original reference destinations are retained.

The disclosure resets when the selected structure, question, source note or
reference list changes. It does not grade questions, alter review status, unlock
assets, load hidden teaching during exams or change scan/model geometry. Opening
or closing sources must not collapse the surrounding Quiz notes or reset an answer.
No fixed-height clipping is introduced; native summary keyboard activation and
visible focus are preserved. Missing notes/references produce no empty control.

Run `node scripts/test-quiz-source-disclosure.mjs` plus the current quiz interaction,
renderer/review-binding and TypeScript checks. Native-browser acceptance must
cover keyboard expansion/collapse, answer retention, switching structures and
visible draft status. An isolated source-module preview is not website import,
signed-in model/GPU acceptance or clinical approval.

Local evidence: `E:/VisibleMedicine-LocalStaging/20261009-quiz-disclosure/`.
The first new harness fixtures needed the established non-rendering Next Link
stub and distinct teaching-visibility/context values; initial diagnostics are
retained. No production behavior was weakened to accommodate those fixtures.
