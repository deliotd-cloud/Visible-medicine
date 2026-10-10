# Generated-import audit — 7 October 2026

The offline default-build auditor now describes the computed import at
`scripts/generate-nested-review-bindings.mjs:5` as an exact source-expression
construction: an in-memory `data:text/javascript;base64,` URL assembled from
`result.outputFiles[0].text`. It does not execute the generator, the workspace
builder, installed esbuild or the generated module.

Recognition requires the immutable whole-program hashes of both generator and
workspace builder, their exact paths, a sole recognized default-build invocation
`node scripts/generate-nested-review-bindings.mjs --check`, the exact import AST
expression and line, and a regular policy-allowed literal entry. The builder's
Git blob, byte count and SHA-256 and the entry's Git blob and byte count are
recorded. Different programs, commands or paths do not inherit these semantics.
Dirty working-tree bytes cannot alter a committed-source classification.

The `classifiedImports` report field is descriptive, not an admission gate.
The generic `COMPUTED_IMPORT` marker at this site becomes the more actionable
**unresolved** `GENERATED_BUNDLE_PAYLOAD_UNVERIFIED`. Actual output cardinality,
emitted payload bytes, resolved transitive inputs, runtime imports, installed
tool identities and source execution all remain explicitly unverified. Static
classification is not a substitute for collecting that evidence in an isolated,
cleared build; it cannot reject an absent/multiple/unsafe output it never runs.

A fresh comparison at Atlas `a10496da94d9d054306bbc48e5ae9c98239d82b5`
retains all 1,283 discovered input identities, 25 policy conflicts and **44
unresolved obligations**. Only the one unresolved marker changes. Two existing
inputs gain explanatory builder/entry reasons; no new input bytes are admitted.
The model inventory and all other existing report fields remain identical.
Evidence: `E:/VisibleMedicine-LocalStaging/20261007-generated-import-audit/`,
especially `baseline-report.json`, `classified-report-final.json` and
`comparison-final.json`; the earlier pre-traceability reports are retained.

Eight new synthetic-Git regressions pass, covering dirty checkout immunity,
modified programs/options, missing or nonregular inputs, incorrect/duplicate
build invocation, non-default reachability and unrelated computed imports.
The initial 5/6 run is retained: its traceability assertion found an entry reason
without the generator path. The implementation now supplies that path; the
assertion was preserved. Tests use process-local temporary storage, never run
the fixture generators/builders and retain every admission restriction.

No held model/archive bytes are read by this audit. Closure, isolated-build,
rights/privacy and source-backup admission flags remain false. Raw Atlas upload
remains held. Runtime geometry, dependencies, notices, renderer/review bindings,
clinical sign-off and the website's integrated Atlas are unchanged. No website
build or deployment is required for this offline tooling change.

Next: obtain exact emitted-output/tool/resolved-input evidence only in a
separately reviewed, history-free, policy-cleared environment. Resolve all
remaining discovery, per-asset rights/privacy and isolated-restore gates before
claiming a complete sanitized source backup. Authentic private reviewer,
assistive-technology/native-zoom acceptance and radiologist sign-off remain
separate; CT-head masks and desktop clinical PACS stay out of scope.
