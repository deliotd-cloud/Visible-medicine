# Clinical Review queue navigation

One page of24 review rows stays bounded. Previous/Next controls are now beside
the live result summary, above the list; reviewers do not need to scroll past
all24 rows to change page. Existing explicit-pagination focus, source/context
admission, reset and loaded-only count contracts remain in place.

Pause and Resume share one keyed control at the same DOM position. Native
keyboard focus stays there across pause, retry and resume. If successful scan
completion removes that focused control, its commit-phase ref hands focus to
the existing Refresh reviews button without scrolling. No focus moves if the
reviewer has moved elsewhere, the scan/source is invalid, a newer generation
has replaced it, or the component is being retired. Background loading still
does not focus result rows. Retained scan/refresh callbacks refuse a replaced
scan or retired generation.

Automatic sequential loading, current authorization checks, catalogue/context
invalidation, resumable failures, new-tab worksheets and independent approvals
are unchanged. The inbox reads statuses; it cannot record a clinical decision.
No source anatomy, accepted masks, model, private data, entitlement, dependency,
renderer binding or schema is changed. Atlas0ac11ca2 and Reviewa058b135 remain.

The preceding checklist40, current-delivery fixture and original head-toolbar
test are frozen in tests/fixtures/clinical-inbox-before-navigation. Checklist41
adds this evidence only to UX-01/02; all71 requirements/eight ideas retain their
status, owner, scope and acceptance criteria.

Actual React browser checks use synthetic valid batches with network disabled,
not personal review records or an authorization bypass. Exact source identities,
baseline failures, verification results and layout/focus observations belong in
the dated local checkpoint. This is not real-account/hosted-D1, complete keyboard
or assistive-technology, clinical, privacy or public-release acceptance.
# Verification limits

The original `clinical-review-inbox-source-update.test.ts` still expects the
historical Atlas commit `408759d5`, not the installed `0ac11ca2`. It fails the same
first revision assertion in the unchanged canonical site and this candidate.
Its source/assertions are retained unchanged; this is not a queue regression or
a whole-suite pass. Current exact-delivery and access tests run separately.
Actual React browser checks use synthetic batches only: they do not exercise a
real account, hosted database or clinical decision.
