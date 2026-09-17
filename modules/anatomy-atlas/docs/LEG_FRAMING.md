# Knee and leg camera framing

The default regional view frames the complete visible sources whose primary
region is `leg`: patella, tibia/fibula, lower-leg muscles, vessels and connective
tissue. In the current augmented display catalogue this is 31 records per side,
including admitted deep tibial veins and genicular arteries. Distal tendon
extensions are included rather than cut at the ankle.

Seven shared primary-thigh sources per side remain loaded at original coordinates:
whole femur, iliotibial tract, femoral/deep femoral arteries, femoral/great
saphenous veins and descending lateral circumflex femoral branch. Their proximal
parts may be off-screen. This is a reversible camera preset, not mesh cropping,
segmentation, anatomical landmarks or a change to geometry/registration.

The existing View menu offers **Fit all sources** and **Frame leg**. Selecting
a visible shared source returns to the full-source fit. Unknown, hidden or
contralateral selections, empty core, invalid side and disabled presets do not
produce a close-up. Existing focus/isolation, explosion, tray/extraction, origins,
cutaway and exam guards remain. Saved camera restoration retains precedence.
The camera recenter key distinguishes regional, dedicated-study and full-source
framing. Interactive selection/restoration therefore updates the actual camera,
not just the proposed bounds; a valid study retains its camera while selecting.

Dedicated knee/genicular dissection recipes own their camera, even if their ROI
is rejected after extra anatomy is restored. Generic leg framing is suppressed
by exact recipe identity, not merely by whether dedicated bounds were returned.
This preserves the intentional full-source fallback and existing joint caption.
Whole femur selection inside a valid knee study keeps that study's ROI; its
source remains whole and can be explored with pan/zoom or by leaving the study.

## Verification and limits

`npm run leg-framing:test` uses the actual augmented catalogue: 72 projected
fits, 152 selection cases, system/empty/side fallbacks, catalogue immutability,
12 actual component guard cases and 12 dedicated-study resolution/restoration
checks. `docs/leg-framing-validation.json` records results. Foot/hand, pelvis,
thorax, renderer, selection, dissection history, saved studies and side-switch
checks cover adjacent behavior. The standalone foot validator's obsolete
unsupported-region expectations were updated; positive leg/thorax behavior has
separate full tests.

The legacy `knee-studies:test` runner initially stopped before assertions on an
extensionless module import in its expanded dependency graph. The subsequent
runner repair uses the existing confined helper bundler without changing any
assertions. It now passes all 395 checks, including original recipe-history
hashes, source mesh/label anchors, links and renderer bounds. The leg validator
separately checks knee/genicular bound functions and their fallback interactions.

Coordinating browser evidence covers desktop/mobile default/full framing,
sides, explosion, shared-femur links and dedicated knee links. Desktop also
checks system toggle, cutaway, orthographic fit and Practice transitions.
Interactive femur selection checks a real camera-scale increase; restoring soleus
outside the bony knee recipe verifies the study-to-full-source transition.
No physical-device, clinical or source-release acceptance is inferred.
