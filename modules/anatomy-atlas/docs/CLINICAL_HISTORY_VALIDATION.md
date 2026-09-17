# Historical clinical snapshot validation

The clinical validators reconstruct earlier teaching milestones to verify that
later additions have not changed unrelated content. Each snapshot must use its
own tab list, shoulder records and dissection recipes alongside its body text.

## Regression corrected, 17 September 2026

Thirty-one validators incorrectly captured the current `api` for the tab list,
shoulder records and recipes inside `copy(a)`, even when `a` was a historical
adapter. The older snapshots predate the X-ray tab. Mixing current tabs with
historical body content produced a different hash despite unchanged accepted
teaching. All three fields now come from `a`, following the already-correct neck
validator. No accepted baseline or transition hash is updated.

For the reported pelvic case, the mixed snapshot produced
`776677065d98b8363235db86a4e968c333307d95fff6d20334b8424b11f39920`.
The correctly reconstructed snapshot reproduces the original accepted
`c253fb9a5b840a1a27c7cabd452dde6cb52e9a3c19dd4b326d6407253b435aab`.

This changes validation only: no model, teaching text, source licence, asset,
viewer interaction, entitlement, renderer revision or clinical approval changes.
Historical adapters remain offline test machinery, not runtime content.

## Checks

`node --test scripts/test-clinical-history-copy.mjs` exercises the actual helper
from every clinical validator, including the neck precedent, with deliberately
different historical data and a current API that throws if accessed. This guards
against accidentally mixing current and historical tabs, shoulder or recipes.

The focused full regression command is:

```sh
node scripts/run-focused-checks.mjs head-organ-clinical-curriculum:test pelvic-organ-clinical-curriculum:test abdominal-organ-clinical-curriculum:test
```

These run the existing content comparisons and rejection matrices; assertions
and accepted hashes are not relaxed. Other full regional matrices are not
claimed as run merely because their copy helper passed the shared regression.
Consult the current main-workspace checkpoint and ignored `.local/test-logs`
manifest for actual execution results and source identity. No browser, build or
clinical acceptance can be inferred from a validation-script correction.

The focused command does not pass `--source`, so its regenerated reports record
zero source-index checks; prior source audits are not rerun or extended. The
legacy `historicalMilestoneReadiness` report iterates today's tab names even
though its lessons come from a historical adapter. Its X-ray row must not be
interpreted as proof that X-ray existed in the original milestone. This report
label/iteration issue is separate from the now-strict snapshot hash comparison.
