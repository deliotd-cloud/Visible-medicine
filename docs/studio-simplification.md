# Studio simplification

## Invitation ledger and release context — 17 October 2026

Invitation-access releases now have one collapsed management panel. Opening it
loads metadata only, at most50 invitations per live keyset page, in a420px list.
Labels, usage, expiry and status are visible; codes, hashes, learner identities
and join URLs are not returned. Creating a code remains a nested action for
published releases. Collapsing the panel retains unsent DOM input. Existing
invitation self-enrolment remains held; this does not grant access or recover codes.

Revocation is explicit and source/actor/org-bound. A fresh ledger is required
after uncertain outcomes. It changes future code uses, not existing enrolments
or attempts. Metadata SQL and revocation SQL recheck current ownership, primary
membership, active account, exact staff role and Studio entitlement. Revocation
and its hash-linked audit share a guarded D1 batch with audit-head CAS. This uses
the [documented batch/session contract](https://developers.cloudflare.com/d1/worker-api/d1-database/),
not a schema migration or a claim of global Studio atomicity/exactly-once writes.

Submit/review/publish controls now receive trusted caller scope; pre/post context
checks, stale-visit retirement and uncertain-action reconciliation preserve the
existing version/material/independent-review gates and unsent-note navigation guard.
The inherited Course options button margin is corrected in the same CSS batch.

460 Studio tests, types, normal build and Review pass. Actual production-React
synthetic browser states cover pagination, cancellation, retained input, expiry,
confirmed/uncertain revocation, unavailable/changed context, stale reply retirement
and release-note protection. The full installed pilot publishing page also renders
with GET/navigation only; its example is free, not an invitation-access acceptance
fixture. No real invitation/publication mutation, hosted authentication or D1
acceptance is claimed. The background-tab viewport override did not apply, so no
new600px pass is claimed. Prior narrow-layout evidence remains separate.
Recovery: F:/VisibleMedicine/recovery/checkpoints/20261017-studio-invitation-ledger-installed

## Current local authoring safety — 17 October 2026

Course options is a compact disclosure panel instead of expanding the toolbar.
At1280px the measured outline shift is now0px (previously147px);600px containment,
Escape-to-summary and keyboard focus-exit checks pass. This preserves draft forms
and Content/Preview/Review history rather than introducing another authoring mode.

The actor/organisation-scoped recovery and context checks described below are now
installed locally, superseding the older isolated-candidate notes. Five persisted
forms receive trusted server scope. The client compares current context before
and after guarded POSTs; the server also compares it before domain dispatch.
Existing roles, ownership, CAS and independent entitlements remain authoritative.
This is request-boundary admission, not atomic organisation continuity.

Unavailable comparison retains input but locks editing/submission until an
explicit context retry. Confirmed context change retires the old form without
silently making its DOM-only input disposable. Legacy unscoped draft bytes are
not automatically read, reassigned or deleted; conflicting scoped bytes are kept.
Browser-local storage is not a confidentiality or cloud-backup mechanism.

Lost responses, malformed success receipts and ambiguous408/5xx errors require
the author to check the saved item before enabling another submission. Declining
the confirmation keeps submission blocked; accepting it sends no POST. It is a
manual reconciliation decision, not proof of a save or exactly-once creation.
Explicit ordinary validation refusals remain retryable with their input intact.

402 Studio cases and the normal types/build/Review checks pass. A real React DOM
fixture verifies recovery/retirement/uncertain-save controls using synthetic data
only; actual signed-in sessions, D1 concurrency, native navigation and shared-device
privacy remain separate acceptance gates. The two duplicate buttons now receive
trusted server actor/organisation scope and use the guarded context contract.
Ambiguous duplicates require cancellable reconciliation; changed contexts retire
until reload. Late replies after layout cleanup/source switch cannot navigate.
Explicit coded admission refusals retry context only, with no automatic POST.
Fifteen actual-React browser states pass with synthetic replies and zero console
warnings/errors. Invitations/group creation/workbook assignment now also receive
trusted server scope and use the same admission/uncertainty/retirement behavior,
without reading/writing their labels or one-time codes as local drafts. Twelve
actual-React synthetic membership states pass. Stale error text is cleared after
an accepted manual acknowledgement; that action sends no POST and recovers no code.
Course invitation ledger/revocation and release-workflow caller context remain
separate work; no atomic org continuity or hosted/real-auth acceptance is claimed.
Evidence: F:/VisibleMedicine/staging/20261017-studio-membership-scope

## Earlier interface and authoring checkpoints — from 21 September 2026

Owner approved the read-only workspace audit and requested implementation.

## Implemented interface

- Workspace pages have one compact header, not the public marketing navigation
  plus a second workspace switcher. Account links still use server session state.
- Home, Courses and Workbooks are primary. Review & publish sits under
  Delivery & administration, alongside role-filtered Learner groups, Reports
  and Organisation links. A course's Open review queue link leads to publishing.
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

## Device-local draft recovery — 17 October 2026

Course and release forms can recover unsent text from this browser only when
the draft key matches the current server-derived actor, Studio organization and
form. **Review recovered edits** opens the course form; **Check device draft**
points to a recovery problem. A recovered draft is not a saved Studio version.
Compare it with the saved item before submitting, especially after a lost save
response.

Recovery checks scoped draft field names and value shapes before changing any
field. An unreadable, unmatched or incompatible scoped draft is kept; new input
stays in the open form and is not written over those bytes. Save that new input
to Studio before leaving. Confirmed saves retire only matching scoped bytes
used or written by this form. Unscoped historical keys are never opened by
automatic recovery and are never touched by its cleanup. Storage conflicts or
failed cleanup remain visible; they do not turn a confirmed Studio save into a
failed save.

**Actor and institution scoped recovery candidate — isolated, not installed.**
The five persisted forms now receive the authenticated server actor and the
authorized Studio organization ID. A versioned tuple joins those values to the
form key for storage, cross-tab locks, comparison and cleanup. Missing context
prevents device recovery and persistence. Existing unscoped
`visible-medicine-studio-draft:*` and `elivion-studio-draft:*` bytes are never
read, assigned to an account, moved or deleted automatically. They require a
separate explicit retention/import decision. Scope changes remount the form and
retire its queued local callbacks during synchronous unmount cleanup. Malformed
contexts also get separate render boundaries while recovery stays disabled.
A pending server mutation still relies on server authorization; local scope
never grants access.

This is UI recovery separation, not browser-storage confidentiality. Anyone
controlling the same browser profile can inspect its localStorage. Full
authenticated sign-out/account-switch, back/forward-cache, another-tab and
hosted-D1 acceptance remain separate gates. No encryption, auth lifecycle
service, permission change or clinical approval is claimed. Use separate
browser profiles for shared-device privacy and keep patient identifiers and
credentials out of drafts. See [draft safety and limits](STUDIO_DRAFT_SAFETY.md).

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

The [local PowerPoint intake lane](LECTURE_PPTX_INTAKE.md) now creates source-pinned,
quarantined review packages containing actual slide order/text/notes and media
hashes. It never uploads or extracts media and cannot create accepted lecture
manifests or approvals. Six selected private decks were inspected; two raw count
differences were reconciled to explicit producer filters and all143 retained
title/note positions. Full rendering/media fidelity, contextual
alt/captions, rights/privacy clearance and independent clinical review remain.

Full PowerPoint/media conversion and admission, lecture progress/resume, revision cloning, independent
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
