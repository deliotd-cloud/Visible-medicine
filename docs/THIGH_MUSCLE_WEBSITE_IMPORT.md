# Thigh muscle Quick Checks — local integration

Atlas source `4bb7a85b962e2cbd20ee9f329ddd0ae38e4f0642` supplies the same questions to the generated regional learner and protected Clinical Review. Seven original question groups cover 22 bilateral selections: gluteus maximus, medius/minimus, rectus femoris, vasti, long and short biceps femoris heads, and semitendinosus/semimembranosus.

Open the thigh region, select a covered muscle and choose Quiz. These questions replace identification-only notes; no new navigation or visual layout is introduced. Correctness is exact-answer-bound, with the established retry/explanation and exam-concealment behavior.

## Provenance and review

- Every question remains a revision-bound radiologist-review draft, not clinical approval.
- Learner source graph and Review imported-source hashes agree. Review rejects prior question content, altered answers and changed source identities.
- Original wording and primary references are documented in Atlas `docs/THIGH_MUSCLE_QUIZ.md`; no external images, geometry, copied teaching prose or new dependencies were introduced by this import.
- All 136 regional model bundles and 12 scopes are unchanged. This is teaching delivery, not new anatomical geometry or validated patient-space registration.
- Atlas, imaging-case and paid-lecture access remain independent. Clinical PACS, private scans and specialist masks are untouched.

## Verification and recovery

Evidence is kept locally at `E:/VisibleMedicine-LocalStaging/20261009-thigh-muscle-integration/`. The focused integration suite checks all 22 actual Review lesson packets and matching generated learner text, including stale/modified packet rejection, plus prior regional teaching and delivery/access regressions. Initial failures identified the intentionally changed dispatcher hash and three added source inputs; both expectations were updated after inspecting the exact source diff, retaining original failure evidence.

The checkpoint receipt records final type/build/verifier and local HTTP results and the exact website commit. No new signed-in browser, GPU, native-image or clinical acceptance is implied. The E recovery is scoped and same-machine, not verified GitHub or off-device backup. Nothing was publicly deployed.
