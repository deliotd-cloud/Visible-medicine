# Chest-wall Quick Check website integration

The local website imports Atlas `12ae0c258cdf64fb7449385b0a8cd7918e97edeb`
into both the regional learner and protected Clinical Review. Six exact source
selections receive five original question concepts: external, internal and
innermost intercostals, right/left transversus thoracis and diaphragm.

Use **Atlas → 3D → Thorax**, select one of those structures, then open its
**Quiz** notes. The existing answer, explanation and retry controls are reused;
no new toolbar or permanent panel is added. Authorized reviewers see the same
question text and references in the corresponding body worksheet.

## Source integrity

- Learner manifest SHA-256:
  `ea03a8be6be4c98ea6dcc169aa7b47b6625f9710cb7fe6b30480eb36a9f9e715`.
- Learner input SHA-256:
  `c9d2a90cd4fb39af80ded7662bb6d137d13c88b237ef882e4bb92a50dc93832c`.
- Protected Review integration SHA-256:
  `ba35407b4ada164a2832bb8dbf325df2ddf632388722a8baae7d52bb83fa4913`.
- All 136 model files and 12 regional scopes are unchanged; 1,112 Review source
  imports share the pinned source revision. No source scan or mask is imported.

The six lessons remain drafts, not clinical approvals or patient-space
registration. Static reference surfaces do not establish respiratory movement,
individual intercostal nerves, safe procedural routes or diaphragm dysfunction.
Original factual references and licensing limits travel with the source notices.
No assets, dependencies, fees or access rights are added. Didanix desktop PACS,
accepted head masks, stored decisions and independent entitlements are unchanged.

## Verification and recovery

Fifteen affected integration tests pass, including the six exact lesson bindings,
answer uniqueness, learner/Review agreement and altered/prior packet rejection.
Canonical TypeScript and combined Review verification pass. Test pins were
updated only after inspecting the three new teaching inputs and resolver change.

The local website build, 46 route/access checks, 18 exact learner-asset readbacks
and nine denied-save/page-recovery checks pass. Local evidence, source-only
recovery and the final preview handle
are recorded at
`E:/VisibleMedicine-LocalStaging/20261008-chest-wall-integration/saved-state.json`.
Source tests cover real Quick Check components, but this import does not add a
new signed-in browser, native-image, GPU or clinical acceptance claim.
E recovery is same-machine storage, not verified GitHub/off-device backup.
Nothing is publicly deployed. Specialist edits and the pending shared-plan tail
remain separate from the integration commit.

Next: continue substantive regional and cross-modality teaching coverage;
do not repeat this completed import or postpone independent work for sign-off.
