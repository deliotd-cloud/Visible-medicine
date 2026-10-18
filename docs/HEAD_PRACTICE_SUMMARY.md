## Checkpoint — 9 October 2026: private practice summaries

After ending a CT/MRI structure-practice set, learners can expand **Keep a
private practice summary** and download a plain-text record. The original set
and latest follow-up keep separate first-attempt results; retries do not replace
the original result. Revealed and unanswered questions are listed separately
and excluded from the attempted-score denominator. Earlier intermediate
follow-ups are not retained. This is local practice, not a certified exam,
clinical approval, account save or portable session restore.

The export accepts only exact eligible entry objects from the current study.
Only names and concept IDs from the pinned public comparison registry are
eligible for output. Raw source labels, IDs, files, hashes, geometry, private
source fields and unknown revision strings are never copied. Unlinked or stale
questions retain their ordinal and outcome but withhold their source label.
The summary contains learning-performance information and should remain private.
No network request, account write or persistent browser storage is added.

The disclosure stays closed until requested and is absent during questions and
feedback. Successful activation says **Download requested**, not **Saved**.
Failures retain the on-screen results and allow another explicit attempt.
Blob URLs are revoked after a short delay on success and immediately on failure.

Verification: 51 focused tests, TypeScript and isolated E website build pass.
The first combined run caught an incorrect expected cleanup-event order in the
new test; the assertion now matches intentional catch/finally behavior. Both
logs are retained. Tests cover privacy canaries, stale identities, foreign or
alias entries, malformed outcomes, independent original/follow-up results,
pending-answer withholding, study replacement and recoverable download errors.
Actual browser QA used synthetic entries and the finished-practice component:
keyboard disclosure/activation, visible request feedback, downloaded text-file
readback and exact privacy checks. The browser download-event observer timed
out, but the resulting file was independently found and verified on disk.
No patient scan, account, approval or authenticated persistence was involved.

Source-only recovery and evidence:
`E:/VisibleMedicine-LocalStaging/20261009-practice-summary/saved-state.json`.
Sites local-only workflow and the existing pinned Wrangler preview were used;
the preview remains on port 3000. No publication, permissions, dependency,
clinical-PACS or mask changes. The 144 redundant generated model copies were
removed only after matching existing E recovery copies; original assets remain.
E recovery is same-machine, not verified GitHub/off-device backup. The complete
goal remains active; continue substantive teaching and linked-learning work.
