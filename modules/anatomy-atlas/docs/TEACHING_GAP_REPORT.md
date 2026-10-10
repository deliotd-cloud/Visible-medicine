# Selecting a teaching batch

Run the read-only inventory from the Atlas checkout:

```sh
node scripts/report-teaching-gaps.mjs --region=thorax --topic=ultrasound --readiness=pending --limit=20
node scripts/report-teaching-gaps.mjs --topic=quiz
node --test scripts/test-teaching-gap-report.mjs scripts/test-teaching-gap-cli.mjs
```

The report executes the current `bodyLesson` resolver against the displayed
root-body catalogue. It does not guess readiness from titles or prose. Every
non-draft placement is listed with its existing anatomical identity. Full-scope
totals remain unchanged by filters; `matchingRows` is the number before the
optional output limit. Unknown/duplicate options and invalid readiness fail.

The report contains no teaching prose, scans, masks, patient data or approvals.
It prints JSON to stdout without writing project files. Commit identity, dirty
state and SHA-256 hashes identify the evaluated resolver and catalogue snapshot;
a dirty working copy is not represented as a clean committed source.

## Scope and interpretation

- Root-body placements only: not shoulder-pilot, nested structures or independent
  specimen curricula. A zero count does not mean the whole Atlas is complete.
- `pending` needs authoring/evidence; `generated-identification` is a generated
  identification prompt rather than an authored structure-specific question.
- `identity-only` must retain its source/clinical restrictions. It is not an
  invitation to invent teaching or remove a source hold.
- `draft` is editorial readiness, never clinical approval or modality visibility.
- A repeated left/right placement is not a distinct educational lesson count.

Choose a coherent small batch, establish primary evidence and exact source
bindings, then delegate independent content/tests with exclusive file ownership.
Keep unsupported modalities pending. Evidence from an exceptional abnormal case
must not be generalized to routine visibility of normal anatomical structures.

This is an authoring aid, not a replacement for the requirements audit, source
holds, revision-bound Review, clinical sign-off or commercial release checks.
