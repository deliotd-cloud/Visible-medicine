# Pharyngeal CT/MRI teaching integration

The regional learner and protected Clinical Review import Atlas
`f205199ee2501ddee1b2caca4d90ab28e6dc5e87` together. Eight CT/MRI draft placements
cover the four existing bilateral superior/inferior pharyngeal constrictors.
Use Head & neck, select a constrictor, and open its CT or MRI notes. The
corresponding protected Body review worksheet contains the same source-bound
teaching. No new permanent control or additional scan package is added.

## Exact delivery

- Learner manifest SHA-256: `75c479924a9147e14ab7b41163213360496d251a03cccdc42ce7157fad8b15c3`.
- Learner source-input SHA-256: `9a3c99c544054b6d98958f4ab0351be70cdc22d7da054d8abb315a245935d6a7` (1,081 inputs).
- Review integration SHA-256: `df9d408ee64b0b5d2b7053953f1bb6ee47400855c4b6fe2aa532542613221477` (1,114 source files).
- All 136 regional models and all 12 regional scopes are unchanged.

`tests/clinical-review-pharyngeal-imaging.test.ts` verifies identical learner
and Review source bytes, eight routed lessons, bundled wording and references,
source identity, draft status and rejection of altered text/readiness/source.
Earlier regression assertions retain exact source pins; the two added source
files and updated dispatcher explain their explicit inventory/digest updates.
Original failed and corrected-check logs are retained, not hidden.

## Boundaries and recovery

These are source-backed orientation drafts, not approved anatomy, diagnostic
instructions or patient-space synchronization. The missing middle constrictor
and unsegmented cricopharyngeus are explicitly disclosed. Existing paid-resource
access and authentication remain independent. No scans, masks, private review
decisions or desktop PACS were changed. References are linked, not redistributed
as source media; existing licences and attribution remain intact.

Evidence and scoped same-machine source recovery:
`E:/VisibleMedicine-LocalStaging/20261008-pharyngeal-integration/saved-state.json`.
No publication, verified GitHub/off-device backup, signed-in/native-image/GPU
acceptance or clinical sign-off is inferred from software checks. The owner's
already-loaded scan tabs are not refreshed automatically, preserving local
packages. Source-only status in the preceding checkpoint is superseded once
the saved-state receipt confirms the paired local import and serving checks.
