## Owner clarification — 7 October 2026: acute fractures only

The Group 2 owner review explicitly states that only acute fractures are marked.
The scoring truth table below therefore refers to acute fracture present/absent.
Old/healed changes alone are negative when owner review confirms no acute
fracture, as recorded for Group 2 case 49. Future learner papers must make this
scope clear with “Is there an acute fracture?” and the corresponding instructions.
No other case is reclassified automatically. Existing frozen review worksheets
and their revisions stay intact so submitted notes remain restorable. This is
an assessment-policy clarification, not a new image diagnosis or release approval.

# Two-mark scoring and next local review batch

29 September 2026. Local implementation, not published or clinically approved.

## Owner's scoring rule

One case is one question, regardless of the number of supplied views. Each future
paper contains exactly 50 unique cases and totals 100 marks.

| Reference | Submitted response | Marks |
| --- | --- | ---: |
| Fracture | Yes + accepted bone answer | 2 |
| Fracture | Yes + wrong or missing bone | 1 |
| Fracture | No | 0 |
| No fracture | No | 2 |
| No fracture | Yes, whatever bone is entered | 0 |

`FractureCaseResponse` supplies Yes/No buttons and a bone field after Yes. Submit
locks the response; the private reviewer can explicitly reset the preview attempt.
This component is shared by the Didanix Education workspace and the offline
review worksheet. Structured responses use the existing revision-protected save
path. Old free-text workbooks retain their original format and stored responses.

`lib/fracture-scoring.mjs` implements the rule and the exact 50-case/100-mark paper
total. Case and whitespace normalization is allowed; matching uses explicitly
listed complete answers, not substring/fuzzy/AI grading. Multiple-bone cases need
complete accepted answers including every required bone. Unsubmitted answers or
pending/unknown keys produce no numeric paper result. A private review package
cannot claim a clinically approved key. This is not a learner exam release system.

## New candidate batch

Open the local file:
`.local/fracture-exams/candidate-review-20260929-b01/review.html`.

- 20 new paediatric wrist studies / 40 original PNG views.
- 10 fracture-labelled and 10 no-fracture-labelled studies, interleaved for review.
- 20 distinct source patient groups, all from the existing training partition.
- No indeterminate studies, cast/metal flags, repeated image hashes or patient
  overlap with prior local pilots; 256 existing blinded-review patients and nine
  prior local patient groups excluded.
- Every source view in each selected study is retained. Absence of flags is not
  visual clearance for casts, surgical hardware or other surgery.
- Bone answers remain blank. Labels are source annotations, not verified diagnoses.
- Five four-case packages satisfy the existing bounded website import contract;
  these packages remain local. They require the updated code before importing.

Batch revision:
`68f9a81dbcb87a8571cca836f99546941bf2b091dab5056869029e2801237091`.

The owner reviews all views, records include/exclude and fracture yes/no, supplies
accepted bone answers, and records cast/surgery, privacy and reuse checks. The
"Try this draft key" control previews scoring only. Export notes and keep the
download in the private batch folder; restore accepts only matching-batch notes.
Notes are kept in memory until exported, with an unsaved-change warning. Exported
notes do not authorize upload or constitute release approval. Original pilots
remain untouched as history; this is the next batch, not a regenerated pilot.

Next owner action: review these 20 cases and export the completed notes. Expand to
250–500 reviewed cases only after establishing the desired regional/difficulty
mix and proportion of negatives. This balanced wrist batch is not an agreed exam
blueprint. Final cases also require revision-bound clinical/privacy/reuse decisions.

## Checks and recovery

10 Python selection checks and 39 Node checks passed, covering the scoring truth
table, complete-answer matching, pending keys, 50 unique cases/100 marks, rendered
controls, submission locking, persisted responses, strict package handling,
ownership and actual Worker authorization. TypeScript passes in the shared root.
An isolated production build passes against the previously published Atlas
baseline in the existing fracture worktree; unrelated live Atlas edits are not
copied, built over, staged or published by this task.

Interactive browser QA is incomplete: the browser tool rejected the synthetic
local-file preview because its URL policy permits only HTTP(S). No alternate
browser or protocol workaround was attempted. Component rendering/event tests
and production compilation passed; they do not establish visual browser QA.

Private `preservation-check.json` records unchanged size/mtime for all 116,169
source files, matching SHA256 for all 40 selected originals, 20 distinct patients
and zero prior-patient overlap. No real pixels were sent to a browser tool, AI,
hosting or Git. The batch is under the verified Git-ignored `.local` directory.

Recovery source backup:
`D:\CodexBackups\VisibleMedicine\fracture-exams\scoring-batch-20260929`.
`verification.json` contains source/backup hashes. This backup contains generic
source/tests/docs only, not scans, private metadata or image packages.

Website deployment unchanged: last fracture publication version159, source
`50d3c577946671a33186aca55874c1e2465045da`. Current scoring changes are local
and uncommitted; the isolated checkout contains the same ten web/test file bytes
as the root. Publication and approved exams have not been generated by this work.
