# Supplied admission evidence — diagnostic, never target approval

`scripts/d1-target-admission-preflight.mjs` exports
`inspectSuppliedTargetEvidence(input)`. It has no command-line target connector,
database, arbitrary-path, repair or mutation interface. This is a local engineering
tool, not an invitation endpoint. Run its focused checks with:

```sh
node --test tests/d1-target-admission-preflight.test.mjs
```

The six own data inputs are `migrationLedger` (ordered applied names),
`sourceFileHashes` (separately claimed committed SQL names/SHA-256),
`schemaCapture` and `expectedSchema` (bounded `{type,name,tableName,sqlSha256}`
arrays), `auditRows` (ascending supplied stream) and `auditHead`
(`{rows,sequence,integrityHash}`). Reports contain fixed missing/mismatch/untrusted
codes, not records, SQL, identifiers, metadata or source exception messages.

Nine immutable SQL pins cover committed0000–0008. Pending0009, its journal,
working-schema changes and the two proposal receipt/guard tables are **not
admitted**. The eight-table capture describes the E-only candidate's write scope,
not the present deployed schema. Both expected and observed schema arrays remain
supplied; their equality does not establish schema semantics or provenance.
Visible trigger rows refuse; omitted, temporary or alternate-schema triggers are
not ruled out. Existing data, foreign keys/check expressions, target identity,
snapshot origin, retained applied history and migration safety still require
independent verification.

The adjacent audit helper is SHA-bound after CRLF→LF normalization. The exact
checked bytes are imported, avoiding a different cached/path module between hash
and execution. The existing helper bounds the supplied audit stream to100,000
rows/64MiB; it does not establish source authenticity or a stable complete target
snapshot. A stalled asynchronous source has no wall-clock acceptance guarantee.
An independently supplied head is another comparison input, not trusted authority.
Input code/iterators can run their own side effects; the diagnostic itself exposes
no write capability and must not be given untrusted executable plugins.

Every result, including exact supplied matches and forged `verified` flags, sets
`targetVerified:false`, `productionReady:false`, `invitationEnabled:false`.
Consistency is useful to find drift, not to enable access. The E-only atomic
receipt/audit/trigger proposals remain unintegrated; invitations stay disabled.
Real hosting/auth/provisioning, version/publication rights, current entitlements,
full chain/data integrity, migration retention and hosted concurrency remain gates.

The Cloudflare skill guided the distinction between source-file identity,
applied history and real-target evidence. [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
record sequential file names in the migration table, not these content hashes.
The [batch/session API](https://developers.cloudflare.com/d1/worker-api/d1-database/)
provides batch rollback on statement failure and primary-first sequential
consistency; it does not establish this tool's complete same-version capture.
