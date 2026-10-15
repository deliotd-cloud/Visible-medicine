# Continuous 3D guided learning

Every existing 3D tour family now offers **Play full tour**. This includes the
regional/whole-body library, shoulder pilot, nested eye and ventricular/cardiac
guides, and independent specimen dissections. The last group comprises five
right-limb scopes plus abdominal wall, back layers, renal and female-pelvic
source studies. It reuses existing captions, selections and source positions.

One explicit Play progresses through the entire sequence: eight-second smooth
camera arrivals, at least 24 seconds per stop, and additional reading time for
long captions. The last stop holds without looping, exiting or awarding quiz
credit. Pause/Resume and manual Previous/Next/Finish/Exit remain available.
Manual navigation returns to step-by-step inspection. Exit restores the prior
workspace and camera; it is not a physical reassembly or surgical simulation.

Source reading, caption focus, closed guide controls, hidden/pagehide state,
model/renderer failure, retry and exit retire queued specimen playback. Returning
or recovering does not automatically resume. Reduced motion removes camera
sweeps and requires a separate explicit Resume for timed progression.

## Future tours and review

Regional tours inherit `lib/guided-playback.ts` through their shared player.
Independent specimen adapters construct `SpecimenGuidedDissection` through
`withSpecimenGuidedPlayback`; its required `continuousPlayback` descriptor is
included in the protected teaching fingerprint. Existing approvals are not
transferred to changed playback material. Review shows the timing policy and
asks the radiologist to inspect arrival, reading time, pause/resume and final hold.

`npm run continuous-guided-playback:test` covers all shared 3D players, including
the production specimen host. The host regression iterates every admitted
specimen guide and tests complete traversal plus interrupted/stale callbacks.
Future guide captions automatically receive the shared duration calculation.

Native CT/MRI slice-study sequences remain separate manual/opt-in learning;
these changes do not animate acquired scans or imply patient-space alignment.
No model, scan, mask, clinical PACS, asset, font, dependency, entitlement, fee or
public deployment is changed. Software checks are not browser/GPU/device or
clinical acceptance; those remain separate review requirements.
