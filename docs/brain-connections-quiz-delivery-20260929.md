# Brain connections quick checks — local website delivery

29 September 2026. Imports Atlas
`e1ad6b0c2aa62cb0f719ef666d559ec0bc8c9eed` into the learner shoulder/regional
runtimes and protected Clinical Review. Six original referenced questions cover
eight existing selections: paired amygdalae and fornices, anterior commissure,
corpus callosum, cerebral choroid plexus and grouped mammillary bodies.

No new navigation controls: learners use Practice → Quiz notes; reviewers expand
Quiz notes within Current teaching. All remain draft and formative. An existing
scoped review is not migrated onto the new teaching or website integration.

## Verification

- 253 local website tests, TypeScript and production build pass. The new review
  test checks exact source identities, source/learner/review hashes, all eight
  answer keys/explanations and reference rendering, with approval false. Existing
  access-control and clinical-review endpoint tests remain in the suite.
- 883 imported source files, 31 review-viewer files, 22 bundled packages. Exact
  integration hash:
  `74c4e812b625fdd7d2517446fb2275ea42a6b85ed87224002db4b166e2f508c2`.
- Source tests previously proved only eight Quiz placements changed, with 9,928
  other topic placements, geometry and dissection recipes preserved. Source
  corpus-callosum and amygdala mobile/desktop browser checks also passed.
- Actual website at 375×812: open head-neck atlas, search Corpus callosum,
  select it, open Structure info → Practise this anatomy → Quiz notes. Check
  starts disabled, fourth answer receives Correct plus explanation and Practise
  again, not Try again. No iframe horizontal overflow.
- Actual protected body review opens the same canonical corpus-callosum ID.
  Expanded Quiz notes shows matching draft answer/explanation and reference.
  No unsaved edits and no decision submitted; no page horizontal overflow.
- All 136 model assets / 143 registered paths and separate source frames retain
  their previous bytes and scope. No scans, masks, registration, permissions,
  clinical decisions, dependencies or new third-party media are introduced.
- The first website run found one stale LF-source hash in the existing shoulder
  CT delivery test. Updated only after checking the exact committed Atlas blob;
  the final suite passes. Existing build chunk-size warnings remain.

## Recovery and limits

Coordination logs: `work/brain-connections-quiz-*20260929.*`. Prior generated
bundles are retained in `work/brain-connections-quiz-prior-generated-20260929`;
only superseded generated JS filenames were removed from delivery directories.
GitHub and independent D-drive restore evidence belongs to the coordination
checkpoint. Tests/build reflect the current local workspace; separately unstaged
fracture work is preserved and excluded from this Atlas commit.

This is not a publication, radiologist approval or completed CNS curriculum.
Atlas/case/lecture entitlements remain independent. Didanix Education integration
and private patient-image release gates are unchanged. Native MRI remains done.
