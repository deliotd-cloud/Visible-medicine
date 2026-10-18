# Ventricular ultrasound: local website delivery

Atlas `61f1c97114800e161bd302652f93854c5b0a6703` adds three original referenced
ultrasound topics to four ventricular selections in learner and Clinical Review.
Existing tabs are reused. Adult source shapes are explicitly not neonatal normal
size templates, acoustic windows, echogenicity or registered patient images.

No new scan, image, model, dependency or paid service. All137 registered model
hashes/144 paths are preserved. Source identities and previous teaching are
unchanged; shared display revisions update without carrying forward approval.
Independent Atlas, case and lecture entitlements remain intact.

The dedicated integration regression checks exact imported/source hashes, four
review selections, references, draft status, absent image approval and stale-token
rejection. Source tests separately prove all prior lessons/quizzes unchanged.
Final test/browser/recovery outcomes are recorded in the coordination checkpoint.
Fracture changes remain separate. This delivery is local-only and not clinical
approval, acquired-imaging integration or publication.

Acceptance: all270 website tests, TypeScript and production build pass. The first
test run exposed an incorrect new fixture assumption (row metadata lacks FMA IDs)
and an esbuild service interruption. The fixture now uses the actual packet's
source identity; the complete suite passes with two concurrent test files.
At375×812 the learner displays all four new Ultrasound lessons. The fourth-ventricle
worksheet shows matching text/reference links and unavailable acquired-image
approval; opening its model selects FMA78469 and returns to the exact original
worksheet/source token. No horizontal overflow or review decision submitted.
These are local browser DOM checks, not physical-device or clinical acceptance.
