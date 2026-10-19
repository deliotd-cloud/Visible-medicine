# Upper-arm reasoning — local delivery

Atlas source `e401fbe05172f628b0f33ddfe13bf2eb38fb2f26` adds seven draft
attachment/relationship questions on fourteen existing bilateral muscle surfaces.
The regional bank now contains twenty concepts, and the full bank 153.
All prior 146 ordered concepts and all 137 model inventory entries are unchanged.
Learner and Clinical Review imports share the source revision and question hashes.

Checks: 274 website tests, TypeScript and production build pass. Actual website
learner runs at 1280×900 and touch 375×812 each complete all twenty questions,
including the new seven: four deliberate errors yield 16/20, and missed-only
retry yields 4/4. Feedback, citations and draft gates remain visible, with no
page errors or horizontal overflow. Normal local sign-in and the Clinical Review
index open the anconeus worksheet with its exact question, explanation and
reference. No approval was submitted. The new integration test checks all
fourteen exact answer/choice snapshots and teaching fingerprints.

The local preview needed a restart after a Vinext hot-reload recursion error;
the same route and browser checks then passed without changing application code.
Existing large-chunk build warnings remain. This is not physical-device, clinical
or public-deployment validation. No scans, geometry, entitlements, new dependencies
or separate fracture work changed. No publication; radiologist sign-off pending.

Factual reference and source rights scope are documented in the Atlas
`docs/UPPER_ARM_REASONING_20260929.md` and imported third-party notices.
No source table, image or question-bank content was imported.
