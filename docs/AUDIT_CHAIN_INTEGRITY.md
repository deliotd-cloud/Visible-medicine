# Read-only audit-chain integrity component

`scripts/audit-chain-integrity.mjs` checks a supplied ascending row iterable,
starting at sequence 1, using the exact current `db/bootstrap.ts:appendAudit`
UTF-8 pipe-delimited SHA-256 format. It opens no database, accepts no filenames,
writes no records and is not wired into enrolment or an HTTP endpoint. It cannot
enable invitations. Run its focused checks with:

```
node --test tests/audit-chain-integrity.test.mjs
```

The tests execute the unchanged production `appendAudit` function body and actual
hash/collision helpers against disposable synthetic SQLite, using the committed
audit-table DDL. They cover altered fields, valid-looking wrong hashes, missing
records, order, duplicate IDs, stream failure, UTF-8 and bounded processing. They
do not use private data, run bootstrap, apply migrations or contact hosted D1.

The component checks at most 100,000 rows and 64 MiB of required encoded input;
callers can lower these bounds. Encoding uses chunks of at most 4,096 UTF-16 code
units, preserving surrogate pairs, rather than allocating a full large preimage.
The limits bound checked data, not the caller's pre-existing input allocation or
the complete process's peak memory. Reports contain counts, opaque head hash and
failure category/row number, not actor, target, reason or source exception text.
Inputs are not modified. A separately captured `{rows, sequence, integrityHash}`
boundary can detect a changed or missing tail. A matching boundary means only
the supplied boundary matches; this component cannot establish its provenance.

## Deliberately incomplete acceptance

A consistent supplied prefix is not proof of a complete database. The existing
unkeyed hash chain can be fully rewritten by a database writer, and primary keys
are not hashed by the historical format. The component preserves that format;
it does not retrofit authentication, cryptographic signatures or trust in a
caller-supplied boundary. Reports always state `readyForProduction:false`, with
completeness and authenticity not established.

Before this becomes target-data acceptance evidence, obtain the exact approved
schema/trigger/migration profile and a stable **primary** snapshot: read the
whole ascending chain and independently bind its count/head and snapshot origin.
Do not copy raw audit rows, identifiers or private data into GitHub or hosted
artifacts. Concurrent appends require a reviewed snapshot/session strategy, not
an unqualified paginated scan. A failure requires investigation, not rehashing,
deleting rows, silently skipping records or automatically declaring a new genesis.

Invitation admission remains held separately. Its E-only receipt, audit and
atomic trigger-gate proofs do not establish real authentication, full target
chain/data readiness, cleared publication rights or hosted concurrency.
