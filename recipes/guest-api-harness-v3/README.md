# Guest API negative first-request harness v3 — QA proposal

This two-case proposal has **not been run**. It leaves both failed 404 suites and the v2 embed observer failure unchanged. The retained v2 embed first request returned the required HTTP 503 and `Signed launches are unavailable.` body with no D1 error; its inspector saw `I: Signed launches are unavailable.` The prior observer expected an unminified class name and reported failure. V3 matches any valid JavaScript identifier class prefix followed by the **exact** expected message. Every different exception message, D1/SQLite error, wrong status, or wrong body fails.

Run after main review:

```powershell
node F:/VisibleMedicine/staging/20261025-guest-api-harness-v3-proposal/run-sequential.mjs
```

The controller creates `F:/VisibleMedicine/staging/20261025-guest-api-negative-v3-suite` and fresh create-only states for embed (3061/49361) then pilot (3062/49362). The inspector attaches before the first application request in each isolate. Embed posts only `invalid-token` with its local parent origin and requires HTTP 503, the exact unavailable-signing error, and no session. Pilot posts `{}` with same-origin JSON and requires HTTP 422, the exact invalid-email error, and no application ID. The pilot request cannot form a valid application.

Source receipt SHA-256 `078a315d863ce312d0d3cd28ab4464407ea2a57a9234762cbb5c2c3014400255`, the passing build receipt, dependency package/entry hashes, all source rows, artifact receipt hash, and all built artifacts are checked before and after. Local-only bindings, a sanitized environment, 768 MiB Worker heap cap, 2 GiB free-memory admission, owned process creation/ancestry checks, terminal receipt, and both port cleanup checks remain in force. No private data, real email/token/identity, remote service, source edit, owner preview change, fee, or clinical action is included.

Any failure stops the sequence and retains evidence. This API check does not repair or pass the unresolved 404 behavior: v2 control and certificate had the same exception kinds but different counts, so that suite remains failed.
