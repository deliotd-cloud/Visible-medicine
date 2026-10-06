# Atomic request throttling

The existing fixed-window limiter now uses one conditional UPSERT with
`RETURNING` to admit a first request, increment a live window or reset an
expired window. A preceding SELECT no longer races with another request.
This is a **request throttle**, not an enrolment quota or durable admission
receipt. Invitation self-enrolment remains disabled.

The exact millisecond UTC cutoff is inclusive. Expired canonical UTC rows with
safe nonnegative INTEGER counts recover, including zero and counts damaged by
the old race or above a reduced limit. Live rows must have a positive safe count
below the limit. Negative, nonnumeric TEXT, fractional, unsafe or noncanonical
stored rows refuse without repair; investigate target data before rollout.
Future timestamps refuse until the clock catches up. SQLite column affinity
can normalize numeric inputs; this is a stored-type check, not input provenance.

The existing 220-character bucket key and delimiter ambiguity are unchanged.
A transport/result failure can consume a slot without completing the route:
there is no exactly-once/retry guarantee. Full bootstrap, target schema/triggers,
real authentication and hosted concurrency are not certified by these tests.

## Verification

```sh
node --test --test-concurrency=1 tests/rate-limit-atomic.test.mjs tests/learner-account-route.test.mjs tests/studio-rate-limit-route.test.mjs tests/lecture-api.test.ts
```

Eight limiter groups compile the **current actual** function/error class and
execute its unmodified SQL against the pinned committed table in disposable
SQLite. They cover concurrent first/last/rollover, precise expiry, reduced limits,
historical counter recovery, invalid data/configuration and failed result shape.
Schema initialization is an explicit no-op seam, not a full-bootstrap proof.

The E-only reviewed proposal additionally passes ten SQLite groups and one
isolated native D1 instance: nine selected groups / 27 assertions, with awaited
disposal and exact proposal/helper hashes. Preserved negative evidence executes
the previous actual function and reproduces both over-admission races. Canonical
function compilation is compared with that final native-proof compilation.
See local evidence under
`E:/VisibleMedicine-LocalStaging/20261006-rate-limit-atomic-v2/` and
`20261006-rate-limit-integration/`.

Eleven learner, thirteen Studio/lecture and three lecture-parser groups test
actual handlers/helpers with explicitly synthetic auth/service/limiter seams.
Learner, Studio and lecture return known limiter 429/500 privately without
mutation; unexpected messages are hidden from their responses and logs. Exact
preceding Studio/lecture sources reproduce their old 429-to-500 errors.
Studio still parses before throttling; lecture throttles before its bounded
parser. Learner/Studio now use a measured bounded JSON stream with exact media
type and existing origin policy. Six remaining throttle error boundaries now
use private/no-store refusals and type-only unexpected-error logs; 25 additional
actual-route groups verify this without changing their action/auth/rate ordering.
See [mutation request boundaries](MUTATION_REQUEST_BOUNDARIES.md) for scope and
remaining parser/host-auth limits; not every API or known service message is audited.

Cloudflare/Sites guidance informed local API/result verification and retained
deployment boundaries. Current [D1 method documentation](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
and [return-object documentation](https://developers.cloudflare.com/d1/worker-api/return-object/)
support the binding/result contract; actual native `RETURNING` behavior is
evidenced by the isolated run, not inferred from documentation alone. No package,
binding, migration, email, private record or hosted site is changed.
