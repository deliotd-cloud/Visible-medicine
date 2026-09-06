# Continuous atlas improvement programme

## Objective and non-negotiable boundaries

Improve the atlas's actual anatomical coverage, functionality, detail and diagrammatic presentation through evidence-backed milestones, preparing for a future user-supplied ultrasound/CT/MRI function. Continue while meaningful, authorised work remains. Do not equate a finished software milestone with anatomical completeness or clinical release.

Preserve official Visible Medicine branding, stable identities, source registration, review-expiry safeguards and commercial licence evidence. No paid AI APIs, asset purchases, speculative nerve routes, fabricated internal tissues, scans or clinical sign-offs. Publish validated software privately to the existing anatomy Site and update only its existing GitHub backup branch. The main website and live private review data remain outside source-backup changes.

## Baseline checked on 6 September 2026

The current whole-body catalogue has 859 selectable source representations, 66 bundles, 11 regions plus whole-body scope, 88 dissection stages and 66 focused views. The dedicated shoulder has nine structures/11 source meshes in its separate bundle. All are source geometry, not a claim of full anatomical coverage or clinical validation. Current source reconciliation and admission decisions are in [source inventory](SOURCE_INVENTORY.md), with earlier holds in the [gap register](GAP_FILLING.md); do not repeatedly re-import held surfaces without new evidence.

## Ordered work queue

| Priority | Milestone | Evidence needed to accept it | Current state |
| --- | --- | --- | --- |
| 1 | Preserve study context and recover missing assets | Complete saved-state round trips, scope/version checks, camera framing, selective retries, failure-safe local storage and regression tests | Implemented; current 16,946 helper assertions pass; hands-on acceptance pending |
| 2 | Safe imaging connection contract | Runtime-validated two-way events; no feedback loops; stable structure mapping across shoulder/body; tested source-space transforms; explicit CT/MRI/US adapter boundaries and no implicit patient registration | Implemented selection contract; current 40,584 helper assertions pass; actual imaging adapter and hands-on acceptance pending |
| 3 | Systematic same-version anatomy inventory | Reconcile all unused current-source identities against admitted, duplicate, ambiguous and unavailable categories; retain asset-level commercial rights, hashes and coordinates | Complete for both official v4 indexes: 4,273 definitions / 3,492 archive entries; 8,980 inventory assertions. This is not clinical adjudication of every unused surface |
| 4 | Registered anatomy completion | Admit additional compatible surfaces where evidence permits; otherwise record exact attachment/topology/registration requirements for missing capsule/labrum/bursa, peripheral nerves, abdominal/back/pelvic anatomy | 36 further source structures admitted with prior anatomy unchanged. Next: prioritise remaining regional candidates and safely separable aggregate detail using the complete inventory. Source/clinical holds remain in force |
| 5 | More useful spatial study and practice | Source-linked, clearly draft relationships and region-specific landmarks; study-mode selection without disruptive camera jumps; answer-once correctness and targeted re-study | Existing stages and formative practice are a foundation; further work remains |
| 6 | Presentation, accessibility and resilience | Coherent branded controls, responsive layouts, label/occlusion handling, keyboard access and bounded loading; proportional tests and authorised hands-on browser/device QA | Existing automated checks pass; new-control visual/touch/assistive-technology testing remains pending |
| 7 | Integrate the user's imaging function | Supplied interface, rights-cleared/de-identified studies, modality-specific mappings, validated patient/model registration and radiologist review | External function/data/review required; do not simulate completion |

Reorder only when evidence exposes a dependency or higher-impact defect. Complete software that does not require missing external inputs while keeping the anatomy/source queue active. Add special features when they materially improve anatomical study; avoid decorative features or endless scope growth as a substitute for the release gates.

## Milestone ledger

- **Deep inspection baseline:** three-plane clipping, tissue opacity, click-through faint surfaces, regional orthographic views and varied 5/10/20-question sessions. See [deep inspection](DEEP_INSPECTION.md).
- **Study context and recovery:** device-local named views preserve explicit dissection and actual camera framing; changed source anatomy disables stale views; failed body/shoulder loads can be retried without a page refresh. See [saved views and recovery](STUDY_VIEWS.md). Source geometry, coverage and licences are unchanged.
- **Imaging connection framework:** both viewers have opt-in selection linkage, exact/alias/group mapping, source-space centres, numerical transform checks, quiz gating and adapter lifecycle/loop safeguards. No fake slice position, scans, patient registration or automatic clinical approvals. See [imaging link](IMAGING_LINK.md). Anatomical coverage and licences are unchanged; the anatomy-inventory queue remains active.
- **Source inventory and regional detail:** all 4,273 official v4 definitions are reconciled against archive/geometry evidence. Added 29 vessel segments, two ciliary ganglia and five selected organ/duct/airway representations; all 823 previous entries and 61 prior body bundles are unchanged. Added two study windows and six focuses. Superior-epigastric vein candidates are held for extent review; earlier holds persist. See [source inventory](SOURCE_INVENTORY.md). Further candidate admission, deeper relationships, presentation, actual-device testing and clinical release requirements remain actionable or externally gated.

## Per-milestone completion checklist

1. Inspect the current worktree and relevant source/licence evidence; preserve unrelated edits.
2. Implement a coherent improvement to the actual viewer or ingestion/connection pipeline.
3. Test relevant runtime helpers plus the existing geometry, inspection, dissection, explode and review safeguards; build successfully. Check source hashes and obligations for any asset/dependency changes.
4. Regenerate review fingerprints when display/geometry/content changes. Do not create reviewer approvals.
5. Privately publish the exact validated source; keep access unchanged. Update the GitHub anatomy snapshot only, with matching source-tree hashes and no credentials, patient data or personal reviews.
6. Record outcomes, limitations and the next executable action here or in the linked milestone note. Keep the ongoing goal active while meaningful work remains.

If all remaining progress genuinely requires new authority, rights-cleared data, the imaging function or specialist review, report the exact inputs needed. Do not claim perfection, anatomical completeness or clinical approval because current automated tests pass.
