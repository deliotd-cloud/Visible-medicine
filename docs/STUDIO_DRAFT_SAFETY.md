# Studio form draft safety

The shared ActionForm in components/StudioForms.tsx protects unsent course,
template, workbook and release form values. It is not the separate workbook
content editor, server version history, clinical review or publication approval.

## Behaviour

- Recovered device-local drafts are unsent changes, not saved Studio records.
  They restore the unload warning and notify dependent form controls.
- Single selected workbook checkboxes and the default enrolment `on` value
  recover alongside grouped checkbox arrays and legacy boolean strings.
- Blocked/full browser storage does not throw through editing or falsely claim
  local protection. Current input stays in the mounted form; save it to Studio
  before leaving. Malformed or unreadable stored drafts are not silently deleted.
- Saving snapshots FormData before disabling the native fieldset. Fields and
  submit are unavailable while saving; a synchronous guard prevents duplicate
  requests. API errors retain input, local recovery and the unload warning.
- A confirmed Studio save is not reported as failed if local draft cleanup fails.
  Both current and legacy namespaces are attempted independently; a warning
  explains that an old draft may reappear and must not be submitted blindly.
- A revision guard retains any later queued edits rather than clearing them on
  an older save's completion. New edits clear the previous saved confirmation.

## Limits

These are temporary same-browser drafts, not encrypted storage, server autosave,
cross-device recovery or an off-device backup. The existing storage keys remain
unchanged and are not account-specific. Do not place patient identifiers,
clinical archives or credentials in teaching form fields. Browser storage may be
cleared, blocked or exhausted. The unload warning is advisory and cannot guarantee
protection against closing, crashes or internal navigation.

Authentication, authorization, independent Atlas/case/lecture access, review,
optimistic server versions and publication gates are unchanged. No hosted
identity is injected into local testing. Standalone local preview redirects
Studio workspace requests to the hosted ChatGPT sign-in path; that endpoint
is not provided by the standalone local server, so full signed-in acceptance
requires the normal hosted-auth environment.

## Evidence — 8 October 2026

E:/VisibleMedicine-LocalStaging/20261008-studio-draft-safety holds source-bound
checks, build/HTTP/browser receipts and source-only recovery. Nine deterministic
actual-component regression cases cover recovered dirty/unload state, checkbox
formats, invalid/blocked reads, quota/recovery, API failure, namespace cleanup,
cleanup failure, stale confirmation and pending-save/newer-edit protection.
The combined authoring/history/navigation/rate-limit suite passes48 cases;
canonical non-incremental TypeScript and the sanitized local build pass.

An isolated E-only fixture bundles the actual React form component and stylesheet
with synthetic inputs and a local completion promise. Actual desktop browser
checks verify recovery in a fresh tab, native field disabling and complete
FormData, storage warnings, cleanup-failure success and saved-confirmation
clearing. The fixture accepts no POST and cannot access accounts or create
courses. Native beforeunload UI was automatically dismissed by browser tooling;
the registered handler is covered deterministically, not claimed as native
dialog acceptance. No signed-in production, clinical or accessibility certification
is inferred. The fixture is not part of website source or deployment.
