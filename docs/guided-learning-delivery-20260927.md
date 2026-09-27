# Guided learning delivery — 27 September 2026

The shoulder learner, shared regional learner and protected Clinical Review now
import Atlas `6b1539f9de931cfcae0492278a04d90955974844`. The shoulder adds a separate
Guided learning subtab and an agent-authored five-stop deltoid/rotator-cuff tour.
Camera sweeps last 1.8 seconds, with quintic easing and orbital interpolation;
reduced motion skips animation. Play/pause, back/next, exit and exact starting-view
restoration are supplied by the tested source. Captions, selected structures,
camera presets, layers and source references appear in teaching review. The new
revision/checklist requires fresh assessment; no existing decisions are migrated.

All 136 model files (143 delivery paths) remain unchanged. The standalone
lower-limb and female-pelvis releases retain their previous exact pins. No new
assets, dependencies, fees, acquired scans or access grants are introduced.
CT/MRI tour pairing remains future work: shared IDs do not prove registration,
and imaging cases and lectures retain independent entitlement requirements.

## Verification

- 105 Atlas/Clinical Review integration checks pass, including exact tour-source
  parity between the learner and review, all five draft steps and review binding.
- TypeScript, website build, review-viewer build, inventory and import verification
  pass. Existing bundle-size and route-classification warnings remain.
- The initial run found a compiled-symbol-dependent accessibility assertion;
  replaced only that brittle check with exact exported/imported source identity
  and readable keyboard/pointer callback assertions. No behavior was removed.
- Actual 375px embedded learner loads Guided learning, starts the tour and advances
  from deltoid to infraspinatus with canvas retained and no horizontal overflow.
- Actual 320px Clinical Review → Shoulder → Teaching → Current material shows the
  five-step sequence and required tour checklist, without horizontal overflow.
  No review decisions submitted. Local test sign-in is not owner clinical approval.
- The long-running preview developed a reproducible Vinext ALS stack overflow
  after import/HMR. Restarted that confirmed failing session using the same normal
  dev command/port; the protected route returned HTTP200 and rendered successfully.

## Exact bindings

- Review integration: `b4f190885c50e58c27bff6a91ca0adc2718462062e9d206bb20117b8db0edf11`.
- Review renderer: `8f70a2f13bb300cf2f29e900a05bf541cdf33bd22ad63efc1eeec3e12312ec9a`.
- Shoulder manifest: `b962002fdc12852b6f352e0c66d7bf078bb8194df9250e0650de77d546111e28`.
- Regional manifest: `fa5059b14532ef06efa0d2e9a1395c8d1d0a7aad295348726fe5061a1ca1fe8b`.
- Inventory: `22fdc5a5c2f9aba262c8a4d06422ca25c2ce93c640887aa7fb7dfc6128cf7eb0`.

Replaced learner bundles were verified and backed up on D before replacement;
unchanged model files were not duplicated. Generated exports were not hand-edited.
The Sites workflow kept this delivery local: no publication or clinical approval.
Next: extend guided learning to suitable validated regional selections, preserving
compact navigation, source evidence and clinical review. Do not repeat this import.
