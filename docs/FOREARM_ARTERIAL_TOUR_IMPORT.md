# Forearm arterial guided learning — local integration

Atlas source: `c440ae47d7e9a2451156caa5a9906550a35bcb50`.

The regional/whole-body learner and protected Clinical Review are imported
together from that source. In Forearm → Guided learning, choose **Right forearm:
arterial routes**. The existing muscle-tour default is retained.

Four stops compare radial, ulnar, common interosseous and anterior interosseous
arteries. Radius and ulna provide faded context. The sequence reuses eased camera
movement, pause, manual steps and reduced-motion handling. Whole-surface frames
may include the hand or crop distant context. This is not a connected lumen,
complete arterial tree, procedural path or patient-space CT/MRI registration.

Six complete source identities and three existing bundles bind the draft tour.
Original captions cite university anatomy references; no publisher assets are
imported and existing mesh licensing and attribution are retained.

The integration test checks matching learner/Review revisions, exact source
hashes, captions and six review packets, plus refusal of altered captions,
omitted tours, source changes, old revisions and invented registration claims.
Source tests separately verify 57 player cases, camera trajectories, 84 source
mutations and 36 altered packets. Signed-in GPU playback and exact-revision
radiologist acceptance remain separate; passing tests do not grant approval.

This change is local-only, not public deployment. No scans, masks, entitlements,
desktop clinical PACS, models or dependencies change. Recovery and verification
receipts: `E:/VisibleMedicine-LocalStaging/20261009-forearm-arterial-integration/`.
