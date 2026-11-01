# Generated teaching audit

Run the read-only editorial audit from the Atlas source:

```powershell
node scripts/audit-teaching-quality.mjs --snapshots content/regional-teaching --out <new-local-report.json>
```

The destination must be a new file. Choose the authorized temporary drive when
space is limited. This command reads the generated lesson snapshots without
building the website or loading the teaching resolver.

The report records exact JSON hashes, structure identities, readiness totals,
missing or malformed citation links, quiz scoring problems, placeholders and
repeated teaching. Repetition is a review prompt, not automatically an error.

Generated `<region>.d.json.ts` files can sit beside their matching
`<region>.json` snapshots. The audit lists these as
`source.excludedCompilerCompanions`; it never evaluates them or treats their
bytes as teaching evidence. Orphans, unrelated files, directories and symbolic
links are rejected. The separate regional teaching generator check still owns
compiler declaration freshness and resolver-to-snapshot equality.

A successful audit does not establish factual accuracy, available imaging,
commercial rights, clinical approval or a successful product build. Its
`resolverFreshnessVerified` and `clinicalApproval` fields remain false.

Focused checks:

```powershell
node --test scripts/test-teaching-quality-cli.mjs scripts/test-teaching-quality-report.mjs
```
