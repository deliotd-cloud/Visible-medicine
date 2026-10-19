# Guided-tour imaging notes — local delivery, 27 September

Atlas source `2d2f2b87232393e0b0d46bd6daba579d78939369`; website baseline `b34ff06`.
Both shoulder and regional learner modules plus protected Clinical Review are
regenerated from this committed source, not edited as generated bundles.

## Learner behaviour

Every active shoulder/thorax tour step offers a collapsed CT / MRI & imaging
notes reader. Four modality choices reuse exact existing structure teaching,
references, readiness and limits. Opening pauses both camera/playback. Closing
does not auto-resume; Play is explicit. Next/Back remount a collapsed CT reader
for the new target, clearing prior scroll and modality state. The reader has a
bounded height and keyboard focus to limit page scrolling without clipping text.

These are teaching notes, not acquired images. No case identifiers, scans,
registration, credentials, client-side access grants or separate desktop PACS
changes. Case and lecture entitlements remain independent. Review teaching stays
draft; renderer changes are revision-bound, with no private decision migration.

## Checks

- 108website integration tests pass, including hashes linking both shipped
  readers to protected review, all44step/modality combinations and24regional
  combinations matching review topics. Prior quick-check correction retained.
- Source tests exercise actual parent pause callbacks and reader modality,
  missing/pending and reference-safety behaviour. No invented scan launch UI.
- TypeScript, learner/review/website builds, review integrity and model-delivery
  inventory pass. Existing large-bundle warnings remain.
- Actual375px website shoulder/thorax: manualstart,Play,open notes pauses;
  CT/MRI selection matches target; Next resets subject/modality/open/scroll state;
  one canvas and no horizontal overflow. Embedded reader173pxhigh.
- Protected320px review renders CT/MRI and guided evidence without errors or
  horizontal overflow. No clinical decisions submitted.

All136model files/143delivery paths and independent lower-limb/female-pelvis
releases are unchanged. Prior generated hashed assets retained on D before
replacement. No original source or patient data removed.

Full logs/import/backup receipts: main coordination `work/tour-imaging-*20260927*`.
Sites local-only workflow; not public deployment or radiologist sign-off.
