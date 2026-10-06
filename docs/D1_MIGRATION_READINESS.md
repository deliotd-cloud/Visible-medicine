# Database migration readiness — local audit, not deployment authority

Run from the website checkout:

```sh
node scripts/d1-migration-readiness.mjs
node --test tests/d1-migration-readiness.test.mjs
```

The first command is deliberately read-only and exits 2 (`blocked-not-ready`).
It inventories the SQL/journal, checks committed source admission and can replay
SQL in disposable memory. It never opens a user database, invokes Wrangler,
applies migrations, changes request bootstrap, or certifies hosted readiness.
Built-in SQLite authorisation is required for replay; older Node versions refuse
replay rather than execute SQL without that protection. Tests use only synthetic
temporary inputs and in-memory SQLite, not patient records.

Optional exact inputs are `--migrations-dir`, `--journal`, `--repo`, `--boundary`,
`--expected-schema` (independently supplied `.sql`) and `--ledger` (a separately
preserved `{ "applied": [{ "name": "0000_example.sql", "sha256": "…" }] }`
manifest). Supplied files are evidence to compare, not trusted approval. This
extended name/hash manifest is **not** a claim that Cloudflare's native migration
table stores those hashes. A matching ledger prefix does not prove pending
migrations have been applied or that the real application schema is complete.

The current local draft inventory includes pending migration `0009` and journal
changes outside this batch. They are not admitted or added to the sanitised
backup by this utility. Replay success alone does not establish parity with
Drizzle/platform/lecture/request-bootstrap schemas. Application bootstrap still
does DDL, seed and backfill work; merely removing it could break preserved data
or omit tables, columns and records not covered by the migration chain.

Next integration work: establish exact target and preserved schema/data baseline;
reconcile the complete application schema and required data transitions; prepare
a reviewed deploy-time migration sequence; test fresh and upgraded disposable
databases; then replace request-time mutation with a fail-closed version/readiness
check. Verify authenticated private D1/R2 persistence and rollback against the
real chosen deployment. No live operation is implied by this local checkpoint.

The Cloudflare skill informed the versioned SQL/ledger separation and the decision
not to run remote commands. [D1 migration documentation](https://developers.cloudflare.com/d1/reference/migrations/)
describes sequential SQL, the default `d1_migrations` table and configurable
migration directories. [Node SQLite authorisation](https://nodejs.org/api/sqlite.html#databasesetauthorizercallback)
informs the replay deny rules: memory alone does not prevent filesystem effects.
