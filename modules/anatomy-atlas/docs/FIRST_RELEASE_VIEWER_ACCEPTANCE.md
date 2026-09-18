# First-release viewer acceptance evidence

## 19 September 2026: private version 95, desktop samples

Tested website `a43c9c2e2d67245ef3a7b91edcfa1c96f1fa43b5`, generated from
Atlas `924e0dd79eb1d96ab89a61f35d6e34ddb6475026`. This file and subsequent
test-only commits do not imply that a newer viewer has been deployed.

Environment: authenticated external Chrome on Windows; mouse and keyboard;
observed screenshot canvas 1230 by 1456 pixels. No viewport override or physical
touch device was used. Browser screenshots were inspected in the task; this
record describes observed behaviour, not stored image attachments.

| Sample | Observed outcome |
| --- | --- |
| Head/neck, FMA78454 | Search opened third ventricle study; four-space find round, skip/reveal and return preserved selection/visibility; question labels hidden. |
| Thorax, FMA9466 | Fade-others blocked launch; hiding right atrial cavity reduced pool to three. Name-isolated round accepted one correct, one skipped and one wrong answer, locked grading and reported 1/3. Retry included two missed targets. |
| Cardiac return | Hidden right atrium, left ventricular selection, Fade off and Undo survived the round. Undo/redo worked; practice summary regained focus. Extract slider End/Home reached 100%/0%; reassemble restored four spaces. |
| Thigh navigation/search | `/atlas/3d?region=thigh` opened 95 structures; left rectus femoris FMA38929 selected with draft teaching/source identity. Explore and in-page Dissect worked without a separate window. |
| Thigh extract | Selecting Extract selected applied 100%. Anterior screenshot placed extracted muscle and label on screen-right; posterior screenshot placed both screen-left. Home restored 0%; ArrowRight reached 1%. Hiding selection removed its label and prompted selection of a visible target. |
| Thigh tray | Maximum separation visibly arranged tissues into rows with non-anatomical-position warning. Home/PageUp reached 0%/10%; reset returned Spread and 0%. |
| Thigh spread | PageUp reached 10%; End reached 100% and visibly separated tissues. Reset returned assembled presentation. This is visual/control evidence, not exact numerical mesh-transform comparison. |
| Thigh layers/history | Stage 1 had 95 visible, stage 2 had 89; Undo/Redo restored these counts and stage captions. After Muscles off, Undo kept that system off and reported 41 visible, without muscle labels. Reassemble and explicit system-on restored the full set. |
| Protected delivery | Existing read-only hosted diagnostic passed all 135 registered objects / 142 paths: full bytes/SHA256, HEAD, range and conditional responses. No models were uploaded. This is authenticated success-path evidence only. |

## Semantics and remaining coverage

Dissection history restores recipe/manual removal state, not independently chosen
system filters. Undo must not silently re-enable a system. Restored-but-system-
hidden structures must remain excluded from rendered labels and selectable
visible anatomy. A focused handler/visibility regression complements the actual
thigh check; neither substitutes for the complete matrix.

Still required: whole-body and every included region's common journey; both
sides and dense multi-label overlap; full intermediate/max/reassembly combinations;
slow/missing-model retry and WebGL/context recovery in a browser; real phone/tablet
touch; 200% text zoom; screen-reader/focus navigation; independent specimen checks;
signed-out, denied and expired access. Previous narrow iframe tests are responsive
layout evidence only. No global viewer gate is passed by these samples.

Known navigation issue: static public Atlas header displays Sign in even when
authenticated workspace displays Profile. Preserve independent access enforcement
when addressing it. No diagnosis, clinical approval, shipping allowlist or new
entitlement is supplied by this evidence. See `FIRST_RELEASE_CHECKLIST.md`.
