# Focused CT/MRI practice follow-up

After completing or ending a CT/MRI Structure practice set, **Revisit missed structures** starts a new set of its incorrect, revealed and unanswered annotations. Already-correct items are excluded. The action is absent during a question or when no eligible misses remain.

The same question style and exact current-study objects are retained. Follow-up scores are separate: the original first-set correct/attempted, revealed and unanswered totals stay unchanged across repeated follow-ups. An in-question unscored retry still cannot replace its first attempt. Choosing a new set, starting a guided target, or changing the package/study clears the original snapshot. Results remain session-only; they are neither certification nor clinical approval.

The existing guided-origin return callback is preserved. Keyboard activation uses a native button; question, feedback, completion and setup headings retain their focus behavior. The existing results disclosure and source-bound teaching/comparison links are unchanged. No new persistence, entitlement, anatomy or source/mask transformation is introduced.

## Safety and coverage

`practiceRevisitEntries` reuses the strict completed-review filter: exact eligible study objects only, excluding point/curve-only annotations, aliases, repeated objects and shared geometry. Asynchronous load cleanup still aborts and rejects late responses. Native mask membership and source identity continue to score answers; there is no inferred whole-structure boundary or patient-space registration.

Focused helper/render/hook tests cover first-result preservation, follow-up order, original snapshot resets, label mode, repeated rounds, failed/aborted loads, stale objects and correct-versus-incorrect feedback. Synthetic actual React/browser checks cover incorrect and revealed follow-ups, keyboard activation/return, focus and desktop containment. They do not validate patient masks or clinical correctness.

Recovery and exact acceptance receipts are under `E:/VisibleMedicine-LocalStaging/20261008-practice-revisit`. Earlier E-only checkpoints are retained as historical evidence. `PREVIEW_CHECKPOINT.md` records the local build/HTTP/browser result; the later canonical integration receipt records main source verification. No public deployment is implied. See `LOCAL_PREVIEW_RUNTIME.md` for the isolated local-tool requirement and rollback instructions.
