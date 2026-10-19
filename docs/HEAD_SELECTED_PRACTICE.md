# Practice the selected CT/MRI structure

In a loaded CT or MRI head study, choose an annotation in the Structure index.
The Structure panel now offers **Practise this structure**, starting a fresh
one-question “Find it on the scan” set using that exact saved mask. This reuses
the existing answer, reveal, retry, focus, scoring and results controls.

The action is available only for the exact loaded entry that is also the current
selection and passes the existing distinct-mask eligibility filter. Points,
curves, shared-geometry aliases and duplicate mask hashes cannot start it; a
disabled action explains why. Opening/failed/stale selections show no action.
The saved region may be partial: no inferred boundary is scored.

A successful start clears completed session results and prior Guided learning
context, conceals comparison/answer information and opens Practice. A rejected
start leaves results, selection, URL and panel intact. It neither invents a tour
return target nor persists a score. Existing sequence practice is unchanged.

## Verification

The actual viewer component is exercised through synthetic hook/event tests for
CT and MRI, including exact-object dispatch, rejected starts, completed-result
preservation, hidden mask before feedback, cleared tour/navigation context,
excluded representations and pending selections. The existing practice hook
tests retain correctness, first-attempt scoring, reset and stale-read coverage.
The focused suite passes 71 tests, with full canonical TypeScript also passing.

The local build, four route/exact-client HTTP checks and nine denied-save
recovery checks pass. Evidence and scoped source recovery are recorded in
`E:/VisibleMedicine-LocalStaging/20261008-selected-practice`. This is software
verification, not new signed-in/browser/GPU/native-image or clinical acceptance.
The action adds no anatomy, source masks, modality mappings, patient registration,
approvals, dependencies, access rights or public deployment. Stored clinical
decisions, independent entitlements and the desktop PACS are unchanged.

Source recovery is same-machine E storage, not verified GitHub/off-device backup.
The full Atlas/website roadmap remains active.
