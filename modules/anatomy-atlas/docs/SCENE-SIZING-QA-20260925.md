# Responsive scene sizing — 25 September 2026

Base: `962a0c6b3342f9820d6f62e3e3c0138892ba9406`. Local viewer, not hosted acceptance.

## Observed issue and correction

On the thorax route, after desktop → 390px → 320px resizing, the WebGL scene's
previous dimensions contributed to the grid's intrinsic minimum. At 320 × 740,
the model pane had 571px available but 768px of content; the explode toolbar
ended at y=793.61, below the viewport. This required unnecessary scrolling.

The root `.body-canvas > .body-scene` now uses `contain: size`. Its grid track,
not the previous drawing buffer, supplies its intrinsic size. This is not paint
containment: labels and focus outlines are not clipped. The existing 160px scene
floor, wrapping controls, intrinsic control rows and scroll fallback remain.
Nested organ/study scenes are not targeted.

## Actual browser observations

| Sample | Result |
| --- | --- |
| Thorax 1280 × 720 | Spread 100%, Tray 100%, Reset to Spread 0%, selected right-lung extraction all responded; settled extraction label appeared on the same screen side as the structure. |
| Thorax 390 × 844 | Extraction controls usable; Home restored 0%; entering Dissect opened tools; next stage removed pectoralis major and returning to model showed sided pectoralis-minor labels. |
| Thorax 320 × 740, corrected | Pane client/scroll height 571/571; scene 232px; toolbar bottom y=666.61; credits and controls visible together. |
| Whole body 320 × 740, corrected | Same 571/571 fit; Spread End reached 100%, Reset restored 0%. Sample used the existing bones-only visibility state, not all-system acceptance. |
| Whole body 390 × 844, corrected | Pane client/scroll height 675/675; scene 438px; toolbar bottom y=787.41. |
| Whole body 844 × 390, corrected | 160px scene floor retained; pane 265/410 scroll fallback; keyboard focus brought slider into view, toolbar bottom y=333.19. |
| Whole body 1280 × 720, restored | Pane 643/643; scene 374px; toolbar bottom y=663.41. Browser viewport override reset. |

These are sampled desktop-browser responsive checks, not physical touch-device,
screen-reader, all-region, every label/camera angle, or clinical acceptance.
No geometry, source holds, access rules or clinical teaching was changed.

## Regression evidence and remaining work

- `node --test scripts/test-scene-intrinsic-sizing.mjs`: seven passing CSS-contract
  cases, including six viewport sizes and root-only containment. These are not
  a browser layout engine; the observations above provide separate evidence.
- `renderer:test`: 710 checks pass; `selection-visibility:test`: 1,485,539 checks pass.
- Shared production module build passes, with the existing large-chunk warning.
- Targeted lint passes. Renderer/shoulder review identities were regenerated:
  old approvals must not transfer across changed display revisions.
- `model-first:test` fails before its CSS assertions on the historical
  `changeStage` handler hash. The validator is unchanged from the base revision,
  and `app/body-explorer.tsx` is unchanged. Expected `fb9a7f67...`, actual
  `c0507a33...`. Do not weaken or replace that baseline to obtain a pass. Trace
  and record the actual historical migration before website integration.
- Local focused log: `.local/test-logs/2026-09-25T13-29-46.954Z-48248-6da61073.log`.

Website integration/publication is deliberately not claimed for this source
checkpoint. Continue with the historical-handler check, then generated integration
and broader regional acceptance under the unchanged full atlas goal.
