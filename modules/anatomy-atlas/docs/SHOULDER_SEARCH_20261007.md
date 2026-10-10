# Shoulder search correction — 7 October 2026

An actual local website shoulder session (embedded source0b38b93) reproduced a
search defect: typing `supraspinatus` left all nine suggestions visible. The
combobox rendered a static map instead of the installed Base UI filtered
collection. The before screenshot and dated logs are retained in
`E:/VisibleMedicine-LocalStaging/20261007-desktop-journeys`.

The shoulder explorer now uses the list render callback and an explicit filter.
Search includes existing names, Latin names, authored synonyms/landmarks and
stable IDs, with normalized all-word matching. It adds no anatomical names,
identities, teaching, geometry or external search service. Input, suggestions
and clear controls have explicit accessible names. Installed primitives are
composed at the call site; no vendored UI, dependency or licence is changed.
Clearing and Escape still preserve anatomical selection.

Four focused search tests and full nonincremental types pass. The original
workspace validator passes1,463 assertions over108 markup and288 handler cases;
scene-recovery and selection-visibility checks also pass. The original shoulder
Review suite passes235 checks and its historical checks reject16 mutations.
Its display fingerprint now binds the new helper: all nine display/geometry
revisions change, teaching and imaging revisions do not. No private decision is
read or migrated; earlier display approvals cannot accept this new revision.

Initial logs are retained, including a corrected attempted import of a
non-exported convenience control. The unchanged workspace VM also lacked the
standard `structuredClone` global; the original shoulder source from2e2ef6ba
reproduced that error. Adding that global to the fixture context fixes the test
environment without changing any assertion or production API.

Actual before-change browser checks accepted correct/incorrect quick-question
feedback, retry focus and identification score1/1 with no label buttons on the
next unanswered question. This does not validate clinical questions. Fresh
post-integration search/keyboard/clear/empty-result checks must be recorded in
the website checkpoint, not inferred from unit tests. Native200%zoom,
screen-reader and physical-device acceptance remain open. The earlier
unattributed MutationObserver error is not suppressed or accepted as fixed.

No patient data, scan, mask, asset, registration, entitlement, clinical approval
or deployment is added. The full Atlas goal and all release gates remain intact.
