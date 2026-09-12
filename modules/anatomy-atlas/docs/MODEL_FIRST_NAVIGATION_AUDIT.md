# Navigation regression audit — 12 September 2026

The model-first regression failed because its allowed handler fingerprints did
not include subsequent, intentional functional additions. This was a test
maintenance defect, not evidence of a broken atlas interaction. No application
code, geometry, teaching content, dependency, branding or access policy was
changed in this repair.

## Preserved evidence

- The original `40e47408c40fe140e1a162a7fc011ce346d4be4f` portable baseline is
  unchanged. Its parsed JSON digest remains
  `4311b7a578d31acb4af1d298fa3bdb71415739b91b4ca357d6216bfb75993ef1`.
- Original root catalogue and geometry checks remain mandatory. Explicitly
  documented handler/callback exceptions replace no historical baseline.
- Render fixtures now use the application's actual `bodyDisplayCatalog`
  admission pipeline, including supplemental source selections, rather than
  pretending the archival catalogue alone is the current loaded atlas.
- No weakened assertion, automatic acceptance of current hashes, dependency
  addition or clinical approval was introduced.

## Functional checks executed

| Action                  | Verification                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Study/stage transitions | Actual handlers; exam/source-change rejection, camera-reset handling, no false related-study success notice (`validate-limb-vascular-studies.mjs`). |
| Muscle relationships    | Actual source-bound plans and parent handler in normal/exam states (`validate-lower-limb-motor.mjs`).                                               |
| Arterial relationships  | Actual plans, region links, rejected catalogues and parent handler (`validate-lower-limb-arterial.mjs`).                                            |
| Venous relationships    | Actual plans and normal/exam parent handlers (`validate-systemic-venous.mjs`).                                                                      |
| Quiz loading            | Actual next/submit readiness checks, including missing/failed geometry (`validate-scene-recovery.mjs`).                                             |
| Explode slider          | Actual JSX callback with scalar/array values at 0%, 50% and 100%.                                                                                   |
| Compact navigation      | Actual server-rendered explorer, retained controls/notes order, responsive panel state and bounded CSS cascade checks (`validate-model-first.mjs`). |

Additional explicit callback fingerprints cover the four existing independent
specimen launch/close pairs, three relationship panels' selection/actions, and
the component imaging launcher. Fingerprints confirm bindings, not full browser
acceptance or validation of separate specimens' coordinate frames.

The generated `model-first-validation.json` reports the completed current run.
No browser, touch, keyboard-focus, screenshot, pixel layout, GPU performance or
clinical validation is claimed. Those still require appropriate acceptance
testing and the radiologist owner's sign-off.
