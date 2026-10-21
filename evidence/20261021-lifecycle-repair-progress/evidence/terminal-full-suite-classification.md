# Terminal Website test inventory — read-only

The stock receipt is terminal, not a partial snapshot: **5,502 tests; 5,355 pass; 144 fail; 3 skip; exit code 1; signal null**. It records no test-input drift and no public-preview-asset drift, but `passingClaim=false`. The TAP plan is `1..5495`; seven indented child tests all passed and account for the higher receipt test total. There are exactly **144 top-level `not ok` markers** and no nested failed markers. [FAILURES.json](F:/VisibleMedicine/staging/20261021-website-terminal-triage/FAILURES.json) maps every marker to its TAP test title, file, registration line, first failed assertion/call line where recorded, first exact error line, scalar actual/expected values when present, cause group and batch coverage. A null first-failed line means module resolution or rendering failed before TAP recorded an assertion line; the local TAP retains the full stack/diff.

Coverage is exact-path, not a pass claim: **26** markers name test paths in `F:/VisibleMedicine/staging/20261021-clinical-assurance-ready/MANIFEST.json` (the final 49-file batch); **five** (#50–53, #70) are in the earlier coverage/arterial proposal; **one** (#503) is in the spinal proposal. The other **112** are outside those named batches, not 112 independent bugs. These are the terminal *pre-application* failures; a proposed file's presence does not prove its fix. Main is applying and verifying guarded batches separately. Do not replay the full suite until those batches and their exact admission checks finish.

Grouped first-failure inventory:

| First-failure group | Markers | Minimal repair direction |
| --- | ---: | --- |
| Epoch/source root gate | 79 | Bind genuine old histories to their closed epochs and current delivery to clean committed 485; retain original negative/source/security assertions, do not mass-replace literals. |
| Inverse/candidate preservation contracts | 19 | Reconcile exact source/test postimages and inverse proofs, keeping historical fixtures immutable. A hash mismatch here is not proof the underlying clinical behavior passed or failed. |
| Website input hash/count gates | 10 | Reconcile only the observed CSS/Review dependency or count seams against the intended lifecycle; rerun dependent rights and boundary assertions after admission. |
| Missing `GroupedReviewConfirmation` test module | 9 | Repair the test-only module-resolution/mocking seam at the nine named head Review tests; no evidence in this TAP that the actual component is absent from runtime. |
| Teaching entry href | 5 | Preserve historical links at their genuine epoch and bind current Review entry links with explicit `&t=teaching`. |
| Wrong Git repository | 5 | #1029, #1047, #1048, #1060, #1061 read current 485 through `F:/VisibleMedicine/atlas` (HEAD 98d7, no 485 commit object). Use the checked clean 485 root while preserving old Git replay. Both `content/regional-teaching/head-neck.json` and `lib/teaching-heading.ts` are **tracked in committed 485**, byte-matched in Review and learner input metadata: the earlier “missing committed source” diagnosis is superseded. |
| Coverage source contract | 4 | Use the existing bounded coverage proposal; #50/52 are exact hash mismatches, #51 is a later epoch, #53 is an overmatched declared binding. |
| Genuine historical transition | 3 | #1007 47-tour prefix versus later venous-v2 catalogue; #1017 historical 77ac test reads live manifest; #1042 mixed historical/current shoulder transition. Keep completed-era count and transition proofs separate from current continuity. |
| Router/mock contract | 2 | #790 lacks the mounted Next app-router provider during SSR; #957 nested mock has no `useRouter` function. These are not Atlas revision mismatches. |
| Imported pin LF/CRLF representation | 2 | #953/#987 rehash `abdominal-branch-imaging-pins.json` as CRLF while the current imported/learner input is LF. Prove actual bytes per epoch; do not normalize away source-hash differences. |
| Plexus source provenance | 2 | #3899/#3902 find `scripts/import-plexus-review.mjs` changed outside declared input/source seams. Re-audit that exact dependency and its pinned hash before admitting the transition. |
| Prior arterial history | 1 | #70 is covered by the earlier arterial proposal, not the generic clinical Review epoch batch. |
| Prior spinal later transition | 1 | #503 observes a changed corpus-spongiosum CT lesson where the old spinal theorem expects preservation; handled by the spinal lifecycle proposal. |
| Content hash pin | 1 | #830 girdle ultrasound Review/material digest differs; this path is in the final 49-file batch, but still requires actual assertion verification. |
| Reference graph/catalogue | 1 | #4480 expects a 408-era regional reference index against current 485; reconcile actual 35-link/topic graph without relaxing missing/foreign-link negatives. |

There is **no first-failure proof of a licence or model-rights regression** here. Several rights-bound tests stop earlier at current source/input hashes or preservation gates (for example #1523, #2711/#2715, #2855); their rights assertions remain unverified, not waived. Similarly, a revision gate's failure says nothing about later corpus, storage, radiologist-review or privacy assertions in that test.

The three skipped tests are exactly: #3694 “rejects linked assets” — `symlink privilege unavailable`; #3969 “file symlinks are refused when this Windows host permits creating them” — `File symlink creation unavailable: EPERM`; #4667 “symlinked source file is rejected when supported” — `symlinks unavailable: EPERM`. This is an explicit Windows symlink-coverage limit, not a passing result for those negative cases.

The only safe next step is grouped, owner-controlled focused verification after the respective proposals are applied: first exact inverse/admission checks, then selected historical/current clinical files, router/module tests and graph/provenance tests, and finally the stock full suite. This inventory performed no tests, builds, resolvers, corpus work, edits to frozen Website/Atlas or old proposals, network calls, or uploads. Long TAP output and any private material remain local.
