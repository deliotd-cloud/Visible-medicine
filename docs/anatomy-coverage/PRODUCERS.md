# Reproducible anatomy coverage candidates

`scripts/generate-anatomy-coverage.mjs` runs the actual root, nested, independent
and reference producers, then builds their joint index. This is a metadata-only
maintenance tool, not new anatomy or permission to approve or publish anything.
The three pure ledger builders retain their original project code unchanged.

Use the project's existing Node runtime with native TypeScript/ESM hooks (the
verified run used Node24.18.0). No package, fee, hosted service or scan is needed.

```powershell
node --test tests/anatomy-coverage-producers.test.mjs
node scripts/generate-anatomy-coverage.mjs --source-root F:/VisibleMedicine/atlas --revision ac71406105da66f77115117bbab2c38428f7e5c3 --output-root F:/VisibleMedicine/staging/coverage-candidate-new
```

Supply the exact clean source commit and a new absolute output directory whose
parent already exists. The destination must be outside both repositories. No
overwrite/force flag exists. A failed run leaves its partial outputs/logs intact;
after a relevant correction, use another fresh destination.

Each producer runs in a separate process. Its loader records actual source
imports and explicit metadata reads, including `package.json` for native ESM
interpretation. The source must remain clean at the same HEAD before and after
generation. Every recorded working file must match its immutable Git blob, with
replacement objects disabled. Module-cache reuse across producer snapshots is
refused. Source-relative legacy reads run temporarily in the verified source
directory inside that isolated child, restoring its prior directory afterward.

The reader accepts regular text/metadata paths, not model/OBJ/scan payloads,
private files, dependencies, linked inputs or escaping imports. The writer creates
fresh JSON only; it cannot replace Atlas sources or canonical website snapshots.
It rejects direct clinical/completeness/registration approval claims. These are
engineering guards, not a general patient-data detector or a hostile-code sandbox;
run only the trusted Atlas source placed in scope by the owner.

Outputs include four ledgers, `index.json`, per-producer logs/receipts and a
`candidate-manifest.json`. Receipts bind the producer implementation, runtime,
source inputs and output hashes. The reference producer re-evaluates existing
metadata only: it does not fetch the external reference manifest or revalidate
original OBJ files. Source holds, separate frames and incomplete curriculum
disclosures remain material.

## Coordinated installation remains separate

1. Preserve the existing website source, five snapshots and their bindings.
2. Run all four producers; compare factual counts, target groups, source holds,
   frames, reference classifications and limitations. Do not relabel old JSON.
3. Install the five reviewed candidate JSON files together with the source/artifact
   registry in `check-anatomy-coverage.mjs`. Retain the old evidence.
4. Recompute the coverage view's source pin, JSON-object digest and imported
   evidence digest from the actual newly imported Review manifest. Check imported
   versus source-only dependencies explicitly; do not blindly replace hashes.
5. Rebind/rebuild protected Review after changing its bound view inputs; verify
   the normal runtime imports, model inventory/policy and affected access/tests.
   No saved clinical decision transfers to a changed revision.

The ac714061 replay preserved all factual inventories and all existing166 source
dependencies; `package.json` is the one newly recorded dependency. Its167-input
index contains141 imported evidence rows and26 source-only metadata rows. Future
view integration must explicitly account for the source package metadata; the
older25-row rule must not be broadly waived. These candidate values are not a
claim that the new source or snapshot is already installed in the website.

Actual browser, clinical, acquired-image and release acceptance stay independent.
No change is made to Didanix desktop clinical PACS, authentication, scans, masks,
private decisions, source licences, dependency versions or deployment.
