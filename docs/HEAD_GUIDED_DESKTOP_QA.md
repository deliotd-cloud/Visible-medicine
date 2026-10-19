# Guided learning desktop acceptance

9 October 2026. Browser inspection at 1280px found that the question-style
label inherited a horizontal layout inside Sequence steps: its words wrapped
beside a squeezed selector. The scoped `.head-sequence-steps label` grid rule
now places the label above the full-width control, without expanding the
disclosure by default or adding another toolbar.

## Reusable scan-free check

From this website checkout, run:

```powershell
node scripts/qa/serve-head-guided.mjs E:/VisibleMedicine-LocalStaging/guided-qa-new
```

Use a new disposable evidence directory. Open the printed loopback URL; stop
that process afterwards. It uses the installed build tool, exports only three
explicit GET resources, refuses other paths/methods, and writes a bundle/hash
receipt outside the source checkout. It never opens a patient package, invokes
the image loader, changes authentication, or creates a production route.

The fixture renders the actual Guided learning component and CSS with invented
descriptors. Its callbacks show requested entries and question mode; they do
not run image grading. Synthetic descriptors deliberately lack valid image
files/hashes and must never be passed to the native viewer.

## Browser checks performed

- Real CT page empty state and desktop three-column layout, in a separate tab.
- Collapsed Sequence steps opened with Enter in a 264px panel.
- Label preference alone starts nothing; explicit Enter starts the ordered CT
  callback with three targets, or MRI with two when its middle target is absent.
- Missing Pons remains step 2 of 3, receives heading focus and never substitutes
  another structure. Next reaches the exact medulla descriptor.
- Finish restores Sequence focus. Find mode still reaches the explicit callback.
- No horizontal page/panel overflow or captured console warnings/errors.
- Corrected selector occupies its full 223px content width, with the label above.

Thirteen focused tests, fresh TypeScript and the unchanged Clinical Review
verifier pass. Evidence and scoped recovery are under
`E:/VisibleMedicine-LocalStaging/20261009-guided-desktop`.
The first preview verification caught an unsynchronised staging stylesheet and
an incorrect CSS asset-directory assumption; neither was counted as acceptance.
A subsequent build encountered a lock from the owned preview process. It was
stopped before rebuilding; original receipts are retained.

This is component/browser acceptance, not native-image grading, signed-in
persistence, anatomical accuracy, registration, clinical sign-off or public
deployment. Source masks, 3D models and specialist work are unchanged.
