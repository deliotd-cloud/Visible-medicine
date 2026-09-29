# Regional viewer acceptance — 29 September 2026

Local website `130228c1` / Atlas `2792be3`. No runtime or geometry change was
needed for this sample. No deployment, new assets or clinical approval.

## Verified coverage

All 12 regional/whole-body routes were exercised at 1440×1000 and 375×812.
Each case loaded a real canvas, searched one named structure, selected its FMA
identity, closed the notes sheet, focused the canvas and dispatched ArrowRight.
Every case changed its announced orbit, retained the selected label, avoided
page scrolling and had no horizontal overflow or visible alert at observation.
Canvas dimensions were 882×520.4375 desktop and 353×206.03125 mobile.

The 24 observations and exact queries are in
[the evidence JSON](evidence/regional-viewer-20260929.json).
[The reusable DOM probe](../scripts/regional-viewer-browser-probe.mjs) uses public
DOM controls only. Navigate each listed route at each viewport and evaluate the
probe with its query; require focused, rotationChanged, rotationAnnounced,
scrollStable and selectionVisible true; overflow false, loading null, alerts empty.
The probe throws on missing canvas/search/result; inspect the chosen FMA too.
It is not a replacement for native keyboard or visual inspection.

## Supplemental native input and visual samples

- Desktop whole body: native ArrowRight and Shift+ArrowUp announced 10°/86°.
  Tab escaped the canvas. Spread at 100% and Tray at 100% were visually inspected;
  selected clavicle retained its label and non-anatomical-layout guidance.
  Tray advertised panning rather than rotation; native ArrowRight panned it.
- Mobile foot: Extract selected at 100% visibly separated Right talus with a
  leader label. After closing Structure info, native ArrowRight changed orbit
  from 10° to 20°; native Tab moved to the Right talus label.
  Native Home on Selected structure separation returned its value to 0 and
  preserved selection. This is control/reset evidence, not a measured transform
  equality or clinical spatial verification.
- Early exploratory programmatic checks ran while the mobile notes sheet was
  open. Those are excluded from the 24-case evidence; the final probe explicitly
  closes it and checks active focus and before/after orientation.
- An exploratory lookup used the Spread slider label after choosing Extract.
  The null lookup was a test-selector error: Extract correctly names it
  Selected structure separation. The native reset used the actual label.

## Still required

This sample is not full first-release acceptance. Physical touch/pinch, screen
reader, GPU/device coverage, all 1,104 root structures, all labels/occlusions,
every system/layer/hide/undo combination, precise reassembly and every nested
study remain outside this sample. Shoulder-specific runtime has separate prior
evidence and is not the shoulder-arm regional route here. Clinical approval and
cross-modality registration remain separate gates.

