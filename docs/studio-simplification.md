# Studio simplification — 21 September 2026

Owner approved the read-only workspace audit and requested implementation.

## Implemented interface

- Workspace pages have one compact header, not the public marketing navigation
  plus a second workspace switcher. Account links still use server session state.
- Home, Courses, Library and Review & publish are primary. Role-filtered learner
  groups, reports and organisation links sit in a collapsed Manage disclosure.
- Home prioritises current drafts, courses and nonzero review work. Drafts open
  the builder directly; no unsupported recency claims or empty status cards.
- New course is a dedicated two-field flow, with an optional code or template.
- Course Content, Preview and Review & publish views retain their form state.
  Release metadata/pricing no longer occupies the ordinary editing screen.
- Content entries open the actual builder directly. The builder keeps the course
  outline alongside one active editor panel. Settings, templates, optional polls,
  review checks and history appear on demand; existing controls remain available.
- Draft edits persist across panels. Unsaved navigation prompts, busy-fieldset
  protection and review-request disabling prevent misleading submission of edits
  that have not been saved. Published workbooks retain their read-only branch.
- Assessment duration and paid price/currency fields are conditional. Existing
  private/invitation defaults, independent review and server permissions remain.

No schema, database, course record, case, review decision, asset, dependency,
entitlement or Atlas source change is part of this interface checkpoint.

## Remaining authoring expansion (not silently represented as implemented)

The existing workbook contract is case-based. Standalone lectures/presentations,
Atlas-only activities and standalone quizzes need explicit content types and
delivery/review support; they must not use fabricated cases or relaxed assessment
validation. The current creation choices truthfully describe imaging teaching and
case-based quizzes/exams.

Next add an isolated lecture workbook mode with workbook-keyed slides, explicit
draft validation, independent review, immutable publication manifest and protected
learner playback without a viewer/case requirement. Preserve current teaching and
assessment case requirements, media clearance, conflicts, revisions and independent
course/Atlas/lecture access. Test draft/save/reload, empty/invalid slide rejection,
reviewer separation, exact published revisions, entitlement denial and playback.
Then implement independently valid Atlas activities and standalone quizzes, and
map their learner-facing Course > Sections > Lessons hierarchy without relabelling
existing records as types they do not support.

## Evidence and limits

Actual component/render and handler tests cover compact/session-aware headers,
role filtering, zero-count queues, direct encoded links, course panels, conditional
forms and protected preview reads. Actual builder tests cover state retention,
readiness, busy protection and the unchanged read-only published branch.
Browser acceptance, build, publication and exact GitHub/D recovery outcomes are
recorded in the main coordination workspace checkpoint, not inferred from tests.
The local Chrome sign-in route was blocked by the client; no security setting was
changed and no authentication bypass was introduced.
