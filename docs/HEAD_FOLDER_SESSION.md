# Opt-in CT/MRI folder sharing

The native head viewers can retain a verified local package's file references while
switching between CT and MRI in the same browser tab. Open the approved folder,
expand **Folder sharing**, and enable the checkbox. Use the CT/MRI link in the
viewer header, the selected anatomy comparison, or Guided learning's
**Continue this step** link. Sharing is off by default; choosing files alone is
not consent. CT/MRI handoffs stay in this tab and preserve the exact concept or
tour step. The 3D Atlas still opens separately; modifier-click/new tabs require
another import.

## Boundaries

- A layout-scoped React provider holds references only in memory, bound to the
  existing approved manifest hash. It does not read additional files or upload,
  serialize, persist, or broadcast them. No new dependency or licence obligation.
- Each mounted viewer runs the existing study/entry checksum verification. Parsed
  volumes, masks, cursors, practice attempts, answers and scores are not retained
  in the shared store. Different studies remain different subjects; this is not
  spatial registration or automatic 3D-reference synchronization.
- Closing the atlas, leaving the two head routes, pagehide, provider teardown or
  refresh clears sharing. New tabs require another import. Revoking sharing does
  not close the currently displayed scan. References being released does not
  guarantee immediate browser heap erasure or delete source files.
- Replacing a package first clears the shared reference. Failed, cancelled,
  superseded or unmounted imports must not restore it. Existing access gates,
  specialist-owned masks and desktop PACS are unchanged.

## Implementation and evidence

`lib/head-folder-session.ts` supplies an isolated revision-bound store.
`app/atlas/layout.tsx` and the provider own its lifecycle; the compact disclosure
and native viewer own explicit consent. The header uses client navigation with
prefetch disabled, as do the selected-anatomy and guided-learning CT/MRI links.
These reuse only the existing consenting provider; they never enable sharing.

The focused suite covers 78 cases across folder lifecycle, actual viewer import
races, fresh study and quiz state, source-bound links and guided handoffs. Types
pass. Scan-free browser checks exercise the actual provider and disclosure with
a synthetic route adapter: default off, opt-in, CT/MRI retention, Escape/focus,
close, departure and refresh, with no console errors. This fixture is not proof
of real framework navigation or signed-in/native-patient acceptance.

Evidence and scoped recovery live at
`E:/VisibleMedicine-LocalStaging/20261009-head-folder-session/`.
See `saved-state.json` for the exact commit and subsequent build/preview checks.
Failed intermediate fixture/static assertions are retained alongside corrected
passes. Clinical approval and private-data release are not implied.

## Remaining acceptance

With the approved local folder, verify the same-tab header switch retains the
folder through actual framework navigation, loads the destination scan correctly,
and starts fresh practice. Also verify opt-out, Close atlas, departure, refresh
and separate tabs. Do not upload the folder or treat either modality as registered
to the other subject or generic anatomical 3D model.
