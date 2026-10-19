# Head practice: plane navigation

9 October 2026. Local-only follow-up to pending-pick navigation.

## Change

CT and MRI practice plane buttons now use the same cursor-navigation guard as native slice navigation. Recentring an axial, coronal or sagittal view to a different voxel clears an unsubmitted Find-it pick; an old hidden selection cannot remain available for grading. The existing guard preserves same-voxel picks, submitted feedback and label-mode answers. Free exploration does not recenter to a quiz target. The handler also rejects the disabled 3D and multiplanar actions during practice.

No scoring, target geometry, masks, clinical approval, source identity, entitlement or study-loading behavior changes. Semantic CT/MRI/3D comparison remains distinct from patient-space registration.

## Verification and recovery

- The two new actual-component CT/MRI regression cases failed before the fix and passed afterward; they exercise all three planes, history/target preservation, disabled-action rejection and ordinary exploration.
- All 75 focused history, lifecycle, native keyboard and practice checks pass, as do TypeScript and the unchanged combined Clinical Review verifier.
- Local build and route/exact-client readback receipts are recorded in `E:/VisibleMedicine-LocalStaging/20261009-practice-plane-navigation/saved-state.json` after checkpoint completion.
- This is component/hook and HTTP evidence, not new signed-in browser, GPU, native-image or clinical acceptance.

The E checkpoint contains scoped source recovery and an incremental Git bundle requiring its parent. It is same-machine recovery, not verified GitHub or off-device backup. The full roadmap remains active.
