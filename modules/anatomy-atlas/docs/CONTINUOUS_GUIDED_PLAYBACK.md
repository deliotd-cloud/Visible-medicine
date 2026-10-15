# Continuous playback for 3D guided tours

Use **Play full tour** to start one automatic sequence with synchronized
structure selection, camera, layers and notes. The secondary manual launcher
keeps step-by-step inspection available. Pause/Resume, Back/Next, the step picker
where available and Exit remain explicit controls. The final stop holds without
looping, closing, awarding completion or marking any structure reviewed.

The shared policy in `lib/guided-playback.ts` supplies an eight-second
quintic-orbit sweep. Each stop lasts at least24seconds and at least the authored
duration, extending for the camera arrival plus caption reading at180words/minute.
This estimate is adjustable source policy, not a measured learner reading speed.
The settled reading interval is intentional: a continuously rotating camera
would make small structures and text harder to inspect. Notes change with their
exact source-selected stop; opening interactive learning does not automatically
launch or scroll through an imaging study.

This applies to the regional/whole-body library, dedicated shoulder tour, both
source-ready eye guides, ventricular and cardiac-cavity guides. New regional
tours inherit the same controls/policy; nested guide types include its explicit
evidence descriptor. Manual inspection retains its original1.8-second camera
transition and authored durations. No anatomy, caption, source geometry,
accepted mask, acquisition or scan correspondence is reconstructed by playback.

Caption/reference reading, quiz/imaging interaction and library/step picking
can pause playback. A hidden page, page exit, source/model/renderer failure,
reduced-motion preference change or unmount retires queued callbacks. Returning
to a visible or ready view does not automatically restart. Reduced-motion
starts hold without camera movement; Resume remains an explicit choice.
Manual navigation invalidates the old timeout and, while playing, gives the
new caption its own full interval. Pausing freezes the camera; a paused manual
step can still move to the requested target without restarting timed playback.

Root, shoulder and nested Review material includes the continuous policy and
per-stop timing separately from manual authoring. Timing changes must be bound
through normal source/renderer/Review generation; prior approval is not copied
onto a new fingerprint. Native CT/MRI guided inspection stays manual and its
case, variant, source, consent and entitlement gates remain unchanged. This is
3D guided playback, not automatic PACS navigation or patient-space registration.

No new package, font, asset, service or mandatory fee is introduced. Existing
model rights/credits and draft clinical status remain. Component, source and
synthetic security checks are not actual browser/GPU/device/screen-reader or
radiologist acceptance. Website availability requires the separate generated
module/Review import and verified local preview; this source document alone
does not establish deployment.
