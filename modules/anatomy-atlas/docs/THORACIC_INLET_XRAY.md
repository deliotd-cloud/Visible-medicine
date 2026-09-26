# Thoracic inlet X-ray orientation drafts

Six original short notes target the unchanged pinned source identities for right/left subclavian arteries (FMA3953/FMA4694), subclavian veins (FMA4755/FMA4763) and brachiocephalic veins (FMA4751/FMA4761). The resolver requires the entire identity from `content/thoracic-branch-imaging-pins.json`, including side and geometry provenance. Only X-ray is handled; other topics fall through.

The artery notes use the vascular pedicle relationship described in [Radiology Assistant](https://radiologyassistant.nl/chest/chest-x-ray/heart-failure): the left border relates to the left subclavian origin, while the right border relates to the SVC. The left landmark is not mirrored onto the right artery. No width threshold or haemodynamic diagnosis is taught.

The vein notes use [Radiology Masterclass central line anatomy](https://www.radiologymasterclass.co.uk/tutorials/chest/chest_tubes/chest_xray_central_line_anatomy) for named venous joins and qualified catheter-course orientation. Catheter silhouettes are not vessel walls and do not clear placement. No procedural advice or tip-position threshold is supplied.

These are cited orientation drafts with no imported media or copied quotations. Each lesson retains patient-side/projection checks, 0% separation, no patient measurement/registration and independent Case/Atlas/lecture access. Geometry and source-coordinate frames are unchanged. Anatomy/radiology review and revision-bound radiologist acceptance remain pending.

Focused check: `node --import tsx scripts/test-thoracic-inlet-xray.mjs`. It checks exact FMA/name/side bindings, detached returned arrays, every identity leaf mutation, added nested keys/array members, non-target rejection and other-mode fallthrough. Unique body/cue prose is conservatively limited to 140 words per source page across the batch. Integration, history and review records are coordinated separately.

## Integration and immutable history

Recorded before dispatcher integration at parent
`03e05321688e893463e1a45547373b304cc9896e`:

- Before hash `fcbe16f258434417aba02c0f1b0a5e85010e4954cb6e8a3a14f5a365bba8a00b`.
- Transition hash `de808af35f01c54502f8cbdd79291f627fad368bdf291162cc0a93a807ca8e28`.
- Original source pins and displayed catalogue retain their original hashes;
  physical vessel bundle bytes retain their original size/SHA256.

`validate-thoracic-inlet-xray.mjs` checks six changed X-ray placements, 9,930
unchanged root-topic placements and unchanged recipes. It executes the viewer's
actual note-render callback with SourceDisplayNotes, checks all six exports and
rejects 210 altered identities. Mixed/unrecorded histories fail. The new adapter
preserves earlier immutable snapshots; none are rewritten to fit the new notes.

The unit test additionally rejects 276 altered identities, including added
properties/array members, and checks 74 unaffected cases. Main review clarified
the paired venous confluences before recording the transition. Repeated vein
orientation is intentionally shared, not presented as four full curricula.
These checks do not constitute browser, clinical or image-registration approval.

The new/hilar/cardiac teaching and original-history checks pass in
`.local/test-logs/2026-09-26T12-00-27.208Z-46668-0fd09d12.log`. Final unique
source-derived body/cue prose is 60/75 words per page. Content contract and
body-review/decision checks pass in
`.local/test-logs/2026-09-26T12-03-25.224Z-28880-757c56e0.log`.
All eleven pilot imaging blockers remain; no reviewer approval was migrated.
TypeScript and focused lint pass. The production module builds successfully:
3,378 modules in 7.24 seconds, with existing large-chunk warnings retained.
Browser acceptance and publication are separate pending stages.
