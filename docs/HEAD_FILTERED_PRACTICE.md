# Practice from filtered CT/MRI anatomy

When a local study is loaded and the structure index has active search, system or 3D-linked filters, **Find filtered masks (N)** starts a new Find-it practice set using eligible displayed entries in their existing order. The action is absent from the ordinary unfiltered index and hidden during active questions. Zero eligible results disable it. It adds no panel, persistent storage, dependency or external request.

Eligibility is intersected with the entire current study's existing practice pool before starting. A filtered alias, point, curve or duplicate mask cannot become a scored target merely because its canonical representative was filtered out. The displayed count describes eligible distinct saved masks, not complete anatomy or clinical approvals. A 3D concept link alone is insufficient for scoring.

Starting is explicit and replaces the previous session practice set, clears non-practice URL/tour context and opens the existing right-side question interface. Rejected starts leave navigation and prior results alone. A stale callback cannot restart an already active set. Existing result review, first-attempt scoring, retries, exact native-mask checks and independent access remain in place. Other question styles remain available through the ordinary Practice panel.

## Verification and limits

Four CT/MRI regressions fail before implementation and pass after it. They cover linked-only targets, multiword search plus system filters, zero-result refusal, hidden duplicate representatives, rejected starts, active-answer concealment and stale callback refusal. The final combined index/viewer/practice lifecycle/source-link suite passes all 88 cases; fresh TypeScript and the unchanged Clinical Review verifier pass. Initial and final runs are retained separately.

Evidence and scoped same-machine source recovery: `E:/VisibleMedicine-LocalStaging/20261009-filtered-head-practice`. The final build, HTTP readbacks, commit and preview handle are recorded in `saved-state.json`. Synthetic component tests do not establish signed-in native-image/GPU or clinical acceptance. Source scans, accepted masks, models, generated modules, Review material and desktop PACS are unchanged. No public deployment or verified GitHub/off-device backup is claimed; the full roadmap remains active.

The local E website build and four route/exact-client HTTP checks pass. Preview session 37897/3000 replaces the deliberately stopped 97548; historical3001 and loaded scan tabs are unchanged.144 redundant build-only model copies were removed after verifying exact existing E recovery copies; canonical assets remain intact.
