# Mutation request boundaries

Learner account and Studio POSTs now use the actual shared streamed JSON parser
in `lib/mutation-json.ts`. The measured UTF-8 byte caps are 24,000 and 48,000,
respectively. Missing, understated or nonnumeric Content-Length cannot bypass
them. Exact `application/json` with parameters is accepted; suffixes/plain text
are refused with 415. Foreign/malformed Origin or cross-site Fetch Metadata
return 403. Malformed, empty, non-object or invalid UTF-8 JSON returns 422;
oversize returns 413. Readers are cancelled on failure and released on every
acquired-reader exit, including early refusals and failed cancellation.

Existing request-security policy still accepts absent Origin unless Fetch
Metadata is cross-site. This is not complete CSRF or trusted-host authentication
acceptance. Both routes still parse before authentication/throttling, then use
the server actor. There is no new role, grant, publication gate, durable request
key or exactly-once promise. The cap bounds accumulated data, not the upstream
chunk allocation or a stalled stream's duration. Extra JSON keys remain subject
to existing service handling, not a new strict field schema.

Preferences, learner data, pilot, readiness, people and invitation acceptance
now mark known and unexpected error responses private/no-store. Unexpected
errors use a type-only log and the existing generic message. Their existing
known error statuses/messages and action/auth/rate/service order are unchanged.
Pilot's direct 415/413 refusals are also uncached. These six already returned
limiter429 correctly; this change does not fix a 429-to-500 mapping there.
Their legacy JSON parsers and anonymous pilot proxy-header trust remain separate
work. Shared error helpers affect GET too; the new suite exercises POST, not
every GET or every service-created known message.

## Verification

```sh
node --test --test-concurrency=1 tests/mutation-json-contract.test.mjs tests/remaining-throttle-boundaries.test.mjs tests/learner-account-route.test.mjs tests/studio-rate-limit-route.test.mjs
```

Normal tests bundle current actual route/helper/security sources. Only explicit
server auth, service, limiter/error-class and pilot hash seams are synthetic;
unexpected imports fail. The new suites retain 18 JSON groups and 25 error-boundary
groups, plus the existing 11 learner and 13 Studio/lecture groups. An explicit
snapshot-only baseline mode preserves the 2-group/15-probe JSON and 6-group/18-probe
error-boundary negative evidence. It is not used for normal verification.
Source and bundle hashes are logged; no real D1/auth/sign-in is established here.

E-only proposal, baseline, independent review and integrated validation evidence:
`E:/VisibleMedicine-LocalStaging/20261006-bounded-mutation-json/`,
`20261006-remaining-throttle-boundaries/`,
`20261006-mutation-boundary-integration-drafts/`,
`20261006-mutation-boundary-integration-review/` and
`20261006-mutation-boundary-integration/`.

Sites and [Cloudflare request-stream guidance](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
informed bounded consumption and the unchanged deployment/auth boundaries.
[Reader documentation](https://developers.cloudflare.com/workers/runtime-apis/streams/readablestreamdefaultreader/)
and current Workers type definitions support the awaited cancellation and lock
release contract. No dependency, schema, binding, private scan, Atlas geometry,
clinical approval or public deployment changes in this batch.
