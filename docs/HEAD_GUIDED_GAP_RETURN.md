# Returning to an unavailable CT/MRI guided step

## Corrected behavior

After visiting ordinary anatomy, reopening Guided learning could retain that anatomy's selected mask even when the saved tour step was absent from the loaded study. Returning now uses the same position-change boundary as stepping within a tour: a missing or unstarted step clears the selection and grouped overlays immediately. The requested tour/step remains explicit; no nearby or similarly named anatomy is substituted.

Available steps retain the existing exact-source selection path. Browser Back restores the actual prior anatomy selection. This does not modify loaded native image values, accepted masks, geometry, mapping identities, quiz grading, entitlements or the desktop PACS. CT/MRI/3D links remain semantic comparisons, not spatial registration.

## Evidence

Both new CT and MRI regressions failed before the correction because the previous pons selection remained visible. They now check first-render group clearing, absent highlight, exact retained tour URL and Back restoration. All 67 focused viewer/history, guided-step, handoff and image-navigation cases pass, as do TypeScript and the unchanged Clinical Review verifier.

The implementation is a shared-handler reuse, not a new control or layout. Native-image/GPU acceptance, signed-in persistence and clinical sign-off are not inferred from synthetic component tests.

Evidence and scoped source recovery: `E:/VisibleMedicine-LocalStaging/20261009-guided-gap-return`. The original failed regression log is retained alongside corrected tests, build and HTTP evidence; `saved-state.json` records the exact final commit and preview handle. No public deployment or verified GitHub/off-device backup is claimed. Specialist files and the full pending shared-plan tail are preserved.

The local E website build and four route/exact-client HTTP checks pass. Preview session 97548 on port 3000 replaces the deliberately stopped 10821; historical port 3001 and loaded scan tabs are untouched. Only 144 redundant build model copies were removed after exact recovery verification on E; source assets remain unchanged.
