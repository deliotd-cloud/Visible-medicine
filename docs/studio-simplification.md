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

## Standalone lecture authoring

The next checkpoint adds an explicit `lecture` mode; no fabricated imaging cases
or relaxed teaching/assessment contracts. In a course, choose **Lecture /
presentation**, then use **Content > Preview > Review** in the focused editor.
The course outline and slide outline share one editor rather than nesting a
fourth navigation sidebar. Details and source references remain collapsed.

- Add, reorder and remove plain-text slides; save incomplete drafts and reload.
  Edits survive panel changes, successful saves retain the selected slide, and
  conflicts preserve unsaved content. Leaving a dirty draft prompts the author.
- Preview with next/previous controls, arrow keys and a collapsible slide outline.
  Unpublished content is explicitly labelled draft, even after saving.
- Request independent review only for a complete saved revision. The author
  cannot approve their own lecture. Publication verifies the exact approved hash
  and stores an immutable manifest; published content cannot be edited in place.
- Learner playback requires existing course enrolment and a valid individual or
  cohort allocation. Revoked, expired, prerequisite-blocked and Atlas-only access
  do not unlock a lecture. Staff preview is restricted to their organisation and
  Studio entitlement; course URLs also verify release membership.
- Slides are plain text with an optional HTTPS source link, not copied images,
  HTML or embedded external content. No new dependency or anatomical asset.
  Maximum 80 slides, 48 KB serialized slide content, 5,000 characters per body.
  Streamed API input is bounded; server validation is authoritative.

Migration `0007_glamorous_luke_cage.sql` adds only lecture drafts, reviews and
publication tables/indexes. Runtime bootstrap uses matching additive statements.
Existing course, case and Atlas records are not rewritten. The synthetic migration
test applies the preceding migrations, preserves existing rows and checks foreign
keys; repository tests execute actual SQL with an in-memory D1 adapter.

### Remaining authoring expansion

PowerPoint/media import, lecture progress/resume, revision cloning, independent
Atlas-only activities and standalone quizzes are **not** implemented by this
checkpoint. Existing duplicate-course/workbook actions copy empty structure, not
lecture slides or approvals; the lecture route does not expose the case-only
duplicate control. Content/media licensing, de-identification and clinical review
remain required before release. Independent access gates must remain intact when
adding future content types and imaging links.

## Evidence and limits

Actual component/render and handler tests cover compact/session-aware headers,
role filtering, zero-count queues, direct encoded links, course panels, conditional
forms and protected preview reads. Actual builder tests cover state retention,
readiness, busy protection and the unchanged read-only published branch.
Browser acceptance, build, publication and exact GitHub/D recovery outcomes are
recorded in the main coordination workspace checkpoint, not inferred from tests.
The local Chrome sign-in route was blocked by the client; no security setting was
changed and no authentication bypass was introduced.
