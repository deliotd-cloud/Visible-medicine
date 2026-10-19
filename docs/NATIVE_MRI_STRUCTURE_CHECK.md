# Native MRI formative structure check

14 October 2026. Local private draft within Regional MRI Review. This does not
release a learner exam or confer clinical approval.

## Use

Open `/workspace/atlas-review/regional-mri` with the existing authorized account,
load the independently bound local package, choose a sequence and explicitly
select an accepted-scoped annotation. **Try structure check** appears only when
that verified annotation has a focus within the source volume and the sequence
offers at least three distinct eligible concepts/answer labels.

The check replaces the right-hand inventory rather than adding a new window or
another simultaneous panel. The saved extent is highlighted in the existing
native image; the focus is restored and the answer-bearing canvas label is
replaced by a neutral description. Choose an answer using native buttons.
Correct feedback never asks the learner to try again. Revealing the answer is
distinct from a correct attempt. Return to inspection restores the source list.
Slice/plane/window controls remain available; annotation visibility and opacity
stay on while checking. Return to saved focus is available if the user scrolls
away. Answers/reveal wait for successful current-context canvas drawing and at
least one visible saved mask pixel, marker or curve segment in that frame.
Off-annotation slices pause answering without trapping focus/return navigation.

This is a check about the explicitly selected saved annotation, not a randomized
exam, anatomical completeness assessment, diagnostic rule or clinical outcome.
The user may already have seen its name during inspection. No score, attempt
history, completion certificate or server record is created.

## Source and lifecycle limits

- Question revision: `regional-mri-structure-check-20261014-v1`.
- Exact loader-owned package, study and overlay references are held in a WeakMap;
  copied/forged questions or a different source/sequence/overlay cannot be graded
  or revealed. Full private context, not a truncated hash, keys the local UI.
- Only scoped-display, accepted-scoped geometry with an in-bounds saved focus can
  be a target. Provisional inspection, deferred/absent geometry, empty masks and
  out-of-volume targets are refused. No source variant is selected implicitly.
- Distractors are distinct accepted-scoped geometry-bearing concepts/labels from
  the same sequence's verified manifest. Their geometry is not loaded by this
  feature, and their inclusion does not claim successful display or completeness.
  Target-concept variants and ambiguous target labels are excluded/refused.
- Answer positions vary deterministically, including the first position. The
  question metadata is detached/frozen; no answer field is exposed in it.
- Source changes/loading retire questions. Existing unsaved-correction confirmation
  is preserved before hiding the worksheet. Old/speculative/unmounted callbacks,
  retired sources and an undrawn image cannot grade or reveal an answer.
- All source masks/scans, annotation statuses, accepted boundaries, existing
  guided paths, reference mappings, entitlement checks and desktop PACS remain
  unchanged. No question data enters model messages, URLs, storage or network.

## Verification and review

Synthetic actual-loader tests cover choices, variants, ambiguous labels, insufficient
inventory, ownership, geometry/focus refusal, answer ordering and exact feedback.
The rendered UI is exercised both with controlled lifecycle fixtures and the
actual loader/question API. Parent integration checks cover canvas drawing,
inventory replacement/restoration, source retirement and dirty-note refusal;
all preceding parent assertions are retained.

Main review corrected a positional cue (the first draft never placed the correct
answer first) and replaced a truncated UI key with full context. Independent
review also found and prompted the off-annotation display gate. Initial passes
and review findings are retained alongside corrected results. Exact final checks and
scoped source-only recovery proof, when terminal, are at:
`F:/VisibleMedicine/recovery/checkpoints/20261014-native-mri-check/checkpoint.json`.

The radiologist should review actual annotation scope, labels, distractors,
native focusing, feedback and usability for this exact question/source revision.
Annotation acceptance is not teaching/question/release approval. This draft does
not add persisted inbox approvals. Signed-in browser/GPU and clinical acceptance
remain unclaimed. No new assets, dependencies, fonts, fees, public deployment,
permissions or private-data upload; broader UI redesign remains proposal-only.
