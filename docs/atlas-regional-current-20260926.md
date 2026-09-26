# Shared regional atlas — local integration, 26 September 2026

The website's shared regional module now uses Atlas source
`f46b48c19266fe96a2126327042317484a0a4187`. This serves eleven body regions and
the whole-body view through the existing head-neck runtime namespace. It brings
the saved regional workspace-return, keyboard/camera and label-focus improvements,
plus previously authored draft CT/MRI/ultrasound/X-ray teaching, into the website.
No new teaching or anatomical geometry was authored during this integration.

Switching sides in Explore and returning to Dissect no longer revives a focus
whose source anatomy is unavailable on the chosen side. Valid layer removals
remain saved. Missing opposite-side source anatomy is not fabricated.

## Exact delivery

- Manifest SHA-256: `c2cfe3ac4debfe9a64d3e6ed292bc19def38540d5bc9610df90a364691e79265`.
- Inventory SHA-256: `d689cc1ede3a1edb45637c16705790076cfaad7aed5f67e5449fc99c940ebff6`.
- 199 runtime companion files; every size/hash checked before and after import.
- All 136 registered models / 143 paths / 199,033,932 model bytes are unchanged.
- The three separate shoulder, female-pelvis and lower-limb modules are unchanged.
- Clinical Review remains independently pinned; this import grants no approvals
  and does not migrate old decisions onto newer anatomy/teaching revisions.
- Previous regional module retained under
  `D:/VisibleMedicine-Atlas-Recovery/regional-before-current-integration-20260926`.

The existing source exporter was used; generated website chunks were not edited.
The upgrade planner found zero added/replaced models. All notices remain present.
Administrator-review access, separate lecture/case entitlements and absent patient
data are preserved. No storage upload, publication or clinical release occurred.

## Verification

- Regional production build, website production build and TypeScript pass.
- 64 website checks pass: exact source bindings, prior teaching/features, model
  preservation, packaging, delivery authorization and durable Clinical Review.
- Inventory check verifies actual bytes and notices across all four modules.
- Actual local website: open the left-only Longus colli study, switch to Explore,
  select Right, return to Dissect: assembled right anatomy is restored. Undo does
  not revive the unavailable focus.
- At 390 × 844: remove platysma, switch Explore → Dissect; the removal is retained.
  The model and mobile controls remain usable. This is sampled browser evidence,
  not certification of every region, device or clinical relationship.
- Screenshots in `D:/VisibleMedicine-Atlas-Recovery/`:
  `regional-current-website-desktop-20260926.png` and
  `regional-current-website-mobile-20260926.png`.

Older tests compared unrelated modules against historical snapshots predating
the separately saved shoulder update. They now use its exact independently
verified release fixture; historical geometry assertions remain. Export script
allowlists include the source-pinned free-space preflight. The camera assertion
retains keyboard callback wiring while allowing its new projection dispatch.
Initial failures and passing recheck logs are retained in the main task's work
folder; no test was disabled. Existing bundle-size/build-classification warnings
remain. The public website is unchanged.
