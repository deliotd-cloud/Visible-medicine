# Femoral component imaging — local website delivery

Atlas source `8386fa7e3c17c7a6da67d6a511604e95f31fdebb` replaces embedded
`2792be3`. The two lateral circumflex femoral component selections now expose
six draft CT angiography, MR angiography and colour-Doppler teaching placements
in the existing learner tabs and source-bound Clinical Review worksheet.
Source remainder and X-ray lessons remain pending; no new UI controls.

All137 model hashes/144 paths, source identities, original teaching pins and
independent Atlas/case/lecture access remain unchanged. No new image assets,
patient uploads, acquired-image approval or desktop PACS changes. Original
summaries reference three primary study abstracts, not redistributed media.
The source licence/reference note accompanies the imported review corpus.

The integration test checks exact learner/review source hashes, all six lessons,
their citations and draft status, remainder/X-ray pending states and unavailable
acquired-image review. Other existing review/access/history tests remain in force.
No clinical decision has been copied or submitted. All 261 website tests passed,
TypeScript checking passed and the production build completed. These checks
preceded further independently owned fracture edits; they are not a release
approval for that work.

Actual local browser acceptance at 375 × 812 verified the learner's lateral
circumflex ultrasound lesson, its primary reference and draft/no-synchronization
warning, with no horizontal overflow in either the website or embedded viewer.
The matching worksheet showed CT, MRI and ultrasound teaching and all three
references, with X-ray pending and acquired-imaging review unavailable. Opening
its exact dissection selected FJ2078; Back to worksheet returned to the identical
parent, study, child and source token. No review decision was submitted.
Browser evidence: main coordination workspace
`work/femoral-component-website-browser-20260929.json`.

Technically integrated locally; radiologist approval, acquired-image registration
and publication remain separate and pending. No new controls or dependencies.
