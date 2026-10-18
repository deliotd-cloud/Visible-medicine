# Independent application schema contract — offline audit only

```sh
node scripts/d1-schema-contract.mjs
node --test tests/d1-schema-contract.test.mjs
```

The CLI prints JSON, writes no files and always exits 2 (`blocked-not-ready`).
It never opens a user/hosted database, runs Wrangler, applies a migration or
changes bootstrap. Replay requires Node SQLite's authorizer; unsupported runtimes
refuse execution. Existing installed esbuild/Drizzle dependencies are reused.

The expected requirements come from exact hash-pinned `db/schema.ts` and
`atlas-review/db/schema.ts`, not from migration output. Compilation verifies that
only those two source files and the permitted Drizzle imports are present before
evaluating the declaration modules. The current declared schema includes pending
fracture work; it is an audit input, not an admitted deployment schema.

The separate replay uses only the immutable `1477f242` baseline's nine committed
`0000`–`0008` SQL files with exact paths and SHA-256. Current HEAD must descend
from that baseline; the report distinguishes it from the replay baseline. It
does not silently include later, working-tree or pending migrations. The imported
Atlas manifest is pinned to `3954cf5`; source/hash drift requires explicit review.

Current checked requirements: 92 tables, 787 columns, 116 named indexes, 149
foreign keys and 15 check names. The replay has 90 tables; its two findings are
the fracture workbook/answer tables present only in pending `0009`. That file
and the changed journal are not executed, modified or admitted. Startup seeds,
question/moderation/legacy-manifest backfills and platform transitions still need
a separately reviewed fresh/upgrade data path; structural matching does not
preserve those records automatically.

Comparisons use `table_info`, `index_list`, `index_xinfo` and `foreign_key_list`.
Quoted string defaults retain their contents, including numeric-looking strings,
textual booleans, escaped quotes and repeated spaces. Partial/descending/collated/
expression indexes cannot satisfy plain global index/unique requirements. Named
check-name occurrence is recorded; binding and expression equivalence are not proved.

Twelve focused synthetic tests cover mismatches, source/dependency refusal and
filesystem-capable SQL refusal. No matching result certifies the actual target's
schema, applied ledger, data, application queries, authenticated access, rollback,
clinical review or readiness. Keep invitation self-enrolment disabled through
its independent atomic-admission gate.

See [migration lifecycle](D1_MIGRATION_READINESS.md) and
[delivery priorities](DELIVERY_AUDIT_20261006.md). Cloudflare's
[migration guidance](https://developers.cloudflare.com/d1/reference/migrations/)
informed baseline/ledger separation; Node's
[SQLite authorizer](https://nodejs.org/api/sqlite.html#databasesetauthorizercallback)
informed the fail-closed replay restrictions.
