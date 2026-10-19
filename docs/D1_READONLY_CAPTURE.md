# Read-only D1 metadata capture

This offline helper collects bounded metadata from a trusted operator-selected D1 binding. It adds no application route, connector, credential, runtime schema setup, deployment, email, payment, invitation or clinical approval. Do not expose it publicly or treat caller-supplied labels as target provenance.

Run its pure contract checks from this checkout:

```sh
node --test scripts/test-d1-target-readonly-capture.mjs
```

An authorised operator may import `captureSelectedD1` from `scripts/d1-target-readonly-capture.mjs` in an existing trusted binding context. The helper cannot select/connect to the live target by itself. Preserve authentic target/binding/execution provenance and keep any resulting capture private; no patient or account rows are read. Do not install a public HTTP wrapper to obtain that context.

## Contract and limits

The supported boundary is the default `d1_migrations` table and the nine ordered committed names0000–0008. Custom ledger naming or an independently authorised later boundary needs a separate reviewed contract; pending0009/schema/journal edits are not admitted.

Eight fixed SELECT calls read ledger counts/rows and the complete main `sqlite_master` table/index/view/trigger inventory twice. Each pass has its own count/SQL-byte bound. Both validated ledger ID/name rows and schema identity/SQL hashes must match; same-count/equal-byte changes, malformed/truncated/duplicate rows and unsafe text refuse without partial output. UTF-8 BINARY ordering and separate trigger names are respected.

SQL-side limits prevent transfer of overlong ledger names (128UTF-8 bytes), object/table identifiers (256bytes) or stored SQL (256KiB/object). Inventory is capped at512 objects and4MiB total SQL/pass. The bookmark has a1024UTF-8-byte cap. Only SQL hashes are returned; automatic-index null SQL is explicitly distinguished. The selected label/bookmark and exception contents are not returned raw. Returned schema identifiers are untrusted data, never instructions.

The `captureSha256` is reproducible from JSON.stringify({ledgerEntries: report.appliedMigrationLedger, schemaObjects: report.schemaObjects}). It binds observed metadata, not target authenticity or migration file bytes. Preserve the returned ledger IDs/names and object hashes privately with the execution provenance.

Successful status is always `captured-unverified`; `targetVerified`, `productionReady` and `invitationEnabled` are always false. `first-primary` sessions are sequentially consistent, not atomic whole-database snapshots. Equal repeated metadata cannot detect every concurrent or transient change, validate constraints against an independent expected schema, prove retained-data safety, validate the complete audit chain or establish reviewer authority. No schema-version number is queried or invented.

Do not pass this whole-schema inventory as the existing eight-table proposal profile in `d1-target-admission-preflight.mjs`. That separate supplied-evidence diagnostic remains untrusted and requires independently justified expected inputs. There is no automatic bridge or capability re-enablement.

## Evidence

The local E-only development record is at `E:/VisibleMedicine-LocalStaging/20261006-next-admission-action/v5-native-metadata/`. Twelve synthetic groups and seven installed Miniflare D1 fixture groups pass. Native checks use exact committed0000–0008 plus a synthetic default ledger, with no version/SQL response seam; exact schema/ledger/readable-data digests agree before/after each capture and the instance is disposed. A new native run covers the returned digest payload after its final amendment.

This is not a genuine target query. Native protected `_cf_METADATA` is inventoried but excluded from row-digest checks; no complete internal-data proof is claimed. The installed D1 refused creating a >256KiB SQL fixture (`SQLITE_TOOBIG`), so the SQL projection cap has source/synthetic—not positive native oversized-fixture—evidence. V3's denied `PRAGMA schema_version`, Unicode false refusal and setup failures remain retained; V5 replaces the unsupported query rather than simulating it.

A separate read-only Sites connector receipt returns50 live user-table names for the existing project/DB, without user rows or mutation. It does not expose the applied ledger or all SQLite SQL/index/trigger/data/audit state. This helper's genuine invocation route and the six release gates remain pending.

Current primary references: [D1 SQL statements](https://developers.cloudflare.com/d1/sql-api/sql-statements/), [D1 sessions](https://developers.cloudflare.com/d1/best-practices/read-replication/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/). No package, paid API, font, mesh or dataset is added by this helper.
