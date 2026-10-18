# Desktop region navigation — 7 October 2026

The integrated Atlas region picker now waits for an explicit **Go** submission.
Choosing an option no longer replaces the page. The control remains beside the
compact desktop Atlas bar and keeps all existing region destinations, including
whole body first, plus honest in-preparation labels for imaging modalities.

## Actual browser observations

The local website working tree was tested at 1280 × 720 in the Codex in-app
browser. Website parent: `97defd833fa981b62bfca152397eda7df48f6153`.
Embedded learner/Review source remains
`0b38b93e5626f34bf1a79a45734171371d52fb3d`.

Before the correction, ArrowDown on the collapsed Whole body region select
navigated to Head & neck. Once navigation finished, focus was on BODY rather
than the picker. The initial immediate read preceded that asynchronous change;
the subsequent screenshot and URL/focus read confirmed the defect.

After the correction:

- Two ArrowDown presses changed the pending choice from Head & neck to Thorax,
  while the Head & neck page and SELECT focus remained unchanged.
- Tab focused the explicit Go action; Enter then opened `/atlas/thorax-3d`.
- Back restored Head & neck with its actual region selected, not stale Thorax.
- The inspected Thorax screenshot shows the compact picker, Go focus ring,
  model and both side panels. Document width and scroll width were both1280.

The form is rekeyed when modality or route-selected region changes. It resolves
submitted values through the existing modality whitelist, and ignores missing,
unknown or already-current choices. The change adds no entitlement or imaging
registration behavior and does not edit generated Atlas files.

## Checks and limitations

The focused picker/navigation suites pass14/14; the complete website TypeScript
check passes with incremental writing disabled. Tests preserve all15 ordered 3D
destinations, intended-use links, planned imaging labels and desktop layout
assertions. Actual browser behavior above, not synthetic handlers, establishes
the observed keyboard correction. A separate read-only worker found no concrete
regression in the three changed product/test files.

Ctrl-plus left browser dimensions, DPR and root font unchanged. Consequently
this is **not native 200% zoom acceptance**. Screen-reader, real-touch,
representative GPU/RAM and complete model-failure journeys remain open.

One captured MutationObserver TypeError at `2026-10-07T02:09:38.339Z` predates
the recorded pre-edit capture at `02:12:36.777Z`. Its attribution is unresolved;
this report does not claim a clean browser console. The existing local Atlas
diagnostic is enabled in development, but its warning/stack was not collected
before closing this test tab. Investigate safely without suppressing the error
or inspecting private case/frame contents.

Evidence and screenshot:
`E:/VisibleMedicine-LocalStaging/20261007-desktop-acceptance/`.
The temporary tab and exact preview process were closed; port3000 had no
loopback listener afterward. The preview-opening UI request was queued, not a
verified user-facing handoff. No native zoom setting/viewport override was
observed changed. The live website, private decisions and all50 specialist
pending paths remain untouched. No full production build, deployment or
clinical approval is claimed. The full Atlas/website goal remains active.
