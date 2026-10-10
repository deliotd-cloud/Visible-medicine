# Selected anatomy before the layer checklist

9 October 2026. Desktop inspection of the existing website at 1280×800 and
1440×900 showed that the selected Right insula card, Fade others, Frame selected
and Learn more were entirely below the long cerebral layer checklist. A learner
had to scroll the side panel to reach the selected structure's actions.

The shared nested-dissection component now renders its existing selected card
directly after Study view, before the practice launcher and structure checklist.
This is real document order, not a visual CSS reorder: keyboard and reading order
follow the same sequence. No duplicate controls, new panel, extra overlay or
automatic focus/scroll change is added. The card is absent without a selection.

The card's source identity, draft wording, clipped-selection warning, teaching,
Fade others and Frame selected callbacks are unchanged. It remains inside the
same guided-mode disabled/inert fieldset. Active identification practice still
replaces the workbench, rather than exposing its selected-answer card.

## Verification and delivery boundary

- `node scripts/test-nested-selection-order.mjs`: 25 component checks for exact
  Right insula and third-ventricle selection, preset/card/list order, single card,
  learning child, deselection/reselection and practice answer hiding.
- `node scripts/test-ventricular-component.mjs`: 160 existing component checks.
- Coordinator validation and exact source recovery are recorded under
  `E:/VisibleMedicine-LocalStaging/20261009-nested-selection-order`.
- Baseline browser evidence is `before-1280.jpg` in that directory. Post-change
  website/GPU acceptance requires the matching generated learner and protected
  Clinical Review import; a component test or build does not establish it.

No geometry, masks, clinical content, patient-space registration, assets,
licensing, entitlements or clinical approval changed. Renderer-dependent review
revisions must be regenerated and imported together with the learner module.
