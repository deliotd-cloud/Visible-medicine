# Mutation request boundaries

Learning runtime, learner portfolio, learner account and Studio POSTs use the actual
shared streamed JSON parser in `lib/mutation-json.ts`. Their measured UTF-8 byte
caps are 64,000, 12,000, 24,000 and 48,000, respectively. These retain the routes'
existing intended limits. Missing, understated or nonnumeric Content-Length cannot bypass
them. Exact `application/json` with parameters is accepted; suffixes/plain text
are refused with 415. Foreign/malformed Origin or cross-site Fetch Metadata
return 403. Malformed, empty, non-object or invalid UTF-8 JSON returns 422;
oversize returns 413. Readers are cancelled on failure and released on every
acquired-reader exit, including early refusals and failed cancellation.

Existing request-security policy still accepts absent Origin unless Fetch
Metadata is cross-site. This is not complete CSRF or trusted-host authentication
acceptance. Those four routes parse before authentication, then use the server
actor. Learner account and Studio retain their existing throttling; runtime and
portfolio do not gain a new limiter in this change. There is no new role, grant, publication gate, durable request
key or exactly-once promise. The cap bounds accumulated data, not the upstream
chunk allocation or a stalled stream's duration. Extra JSON keys remain subject
to existing service handling, not a new strict field schema.

Learner preferences and learner-data requests now also use the unchanged shared
parser, with new actual-byte caps of4,000 and12,000. Four preference booleans and
the existing1,200-character account detail fit these bounds, including fully
escaped surrogate pairs. The valid envelope is consumed before authentication;
then the original server actor, limiter scope/count/window and service order
remain authoritative. Invalid envelopes now refuse before auth/limiter rather
than consuming account quota. No new field schema or automatic deletion is added.
Data GET export shape/attachment remain unchanged; GET/POST errors and successful
responses on these routes are private/no-store/nosniff.

Preferences, learner data, pilot, readiness, people and invitation acceptance
now mark known and unexpected error responses private/no-store. Unexpected
errors use a type-only log and the existing generic message. Their existing
known error statuses/messages and service handling are unchanged. Pilot now joins
preferences, data, readiness, people and invitation acceptance in consuming a
bounded envelope first; the valid-request auth/rate/service order remains.
Pilot's 415/413 refusals are also uncached. These six already returned
limiter429 correctly; this change does not fix a 429-to-500 mapping there.
Anonymous pilot proxy-header trust remains separate hosting work. Shared error
helpers affect GET too; the older suite exercises POST, not
every GET or every service-created known message.

The runtime and portfolio routes now return private/no-store and nosniff on their
GET/POST success and failure paths. Unexpected runtime failures log only the error
type, never the original exception or learner content. Existing actions, selected
workbook forwarding, portfolio review IDs, server-derived identity, downstream
authorization errors and the Studio-only authoring409 boundary are preserved.
The runtime/portfolio suite checks their GET headers too; it does not assert every
other API GET, downstream service message or hosting-origin behavior is validated.

## Verification

```sh
node --test --test-concurrency=1 tests/mutation-json-contract.test.mjs tests/remaining-throttle-boundaries.test.mjs tests/learner-account-route.test.mjs tests/studio-rate-limit-route.test.mjs
node --test tests/runtime-mutation-envelope.test.mjs
node --test tests/learner-preferences-data-envelope.test.mjs tests/account-data-controls.test.mjs
node --test tests/platform-mutation-envelope.test.mjs tests/learning-form-draft-safety.test.mjs
```

Normal tests bundle current actual route/helper/security sources. Only explicit
server auth, service, limiter/error-class and pilot hash seams are synthetic;
unexpected imports fail. The new suites retain 18 JSON groups and 25 error-boundary
groups, plus the existing 11 learner and 13 Studio/lecture groups. An explicit
snapshot-only baseline mode preserves the 2-group/15-probe JSON and 6-group/18-probe
error-boundary negative evidence. It is not used for normal verification.
Source and bundle hashes are logged; no real D1/auth/sign-in is established here.

The additional runtime/portfolio suite has22groups and verifies actual shared
parser/security modules in each emitted bundle. Its pinned old-route baseline
retains the pre-change failures; normal verification uses current source. Current
F-drive evidence: F:/VisibleMedicine/staging/20261015-runtime-mutation-envelope/.
These are synthetic auth/service boundaries, not signed-in browser acceptance,
patient-data release, clinical approval or an exhaustive all-API security claim.

The preferences/data suite checks actual routes/helper/security with synthetic
identity/services, byte/UTF8/origin/media/lock boundaries, exact caps, current
client fields, existing429/400/403/409 and generic500 responses, server actor and
data GET export. The genuine-auth matrix includes preferences and institution
acceptance POSTs; the expanded matrix now also covers progress GET/POST and
refuses360anonymous read/write combinations before services.
The legacy throttle suite observes actual stream consumption for its five
 bounded routes; pilot now also parses first, while historical baseline mode stays intact.
Account-form tests clear currentTarget during a controlled await: success resets
the captured original form once; backend/network failure preserves the draft.
These are synthetic local checks, not signed-in browser or legal compliance
acceptance. Evidence: F:/VisibleMedicine/staging/20261015-learner-account-envelope/.

## Platform request envelopes and draft safety

Control, readiness, people and invitation acceptance use the same unchanged
parser with caps48,000/24,000/64,000/4,000 bytes. Control/people retain their
existing intended byte limits; readiness/acceptance gain new limits that fit
the service's2,000-character evidence,120-character owner and80-character token,
including escaped Unicode. People413 retains its existing roster-size message.
All four parse before auth; three retain their existing limiters and control
does not gain one. Nine control actions, scalar publication IDs, optional launch,
snapshot shapes and invitation-token forwarding are unchanged. No billing,
publication, entitlement, role or service policy is broadened.

GET/POST success/errors are private/no-store/nosniff; control unexpected logs
now retain only error type. No-Origin policy, upstream chunk allocation,
stalled-stream, full CSRF and hosting-identity limitations remain unchanged.
Embedding routes still require their own trusted-origin contract; this is not an
exhaustive all-API security or deployment acceptance claim.

Institution/pilot forms capture their elements before awaiting, avoiding false
errors after successful submission. Portfolio notes/reviews reset only after
confirmed success; backend, network and malformed-response failures retain
drafts. Resource IDs containing `::`, review-completion payloads, success views,
invitation links and markup are retained. Actual-handler fixtures are synthetic,
not browser acceptance. Pinned-before API/form failures and current evidence:
F:/VisibleMedicine/staging/20261015-platform-mutation-envelope/.

## Learner progress

Progress POST uses the unchanged shared parser/security modules before genuine
server authentication, with a new4,000-byte cap. Malformed/non-object/invalid
UTF8 bodies, foreign origins, wrong media types and oversized streams follow
the shared refusal and reader-cleanup contract. No-Origin, upstream allocation
and stalled-stream limitations still apply. No new limiter is added.

Existing atlas/course, slug and0–100 integer validation remains. Last position
now requires a nonnegative safe integer to avoid silently rounded positions.
GET/list and POST/save retain the raw server user ID. Only course100 completion
maps the actor to edu:/sites: as before. Database and completion services, course
access rules and self-reported education-only completion policy are unchanged.
This is not an entitlement review or an atomic save/completion guarantee.

All progress responses are private/no-store/nosniff. Unexpected auth/database/
completion failures return generic500 with type-only logging, not learner data.
The12-group suite includes the actual route/helper/security sources with only
synthetic auth/database/completion seams. Pinned-before mode verifies all three
original source hashes without changing product files. The separate genuine
auth suite bundles the real provider and checks360anonymous refusals plus exact
raw-ID saving and course-completion mapping. No real POST or account write is
made by these tests. Evidence: F:/VisibleMedicine/staging/20261015-progress-learning/.

```sh
node --test tests/progress-mutation-envelope.test.mjs tests/authenticated-api-contract.test.mjs
```

## Anonymous pilot request

The pilot form now uses the same actual streamed parser/security before auth,
hashing, quota or submission. Its existing intended24,000-byte cap is enforced
even when Content-Length is absent or forged. Oversize413 retains "The pilot
brief is too large."; media415 retains "JSON is required.". Bad UTF8/JSON or
non-object422, origin403 and reader cleanup follow the shared contract. Success
and errors are private/no-store/nosniff. Unknown errors remain generic/type-only.

Valid requests retain intentional null-auth submission, genuine signed-in actor,
cf-connecting-ip/first-trimmed-x-forwarded-for/unavailable peer precedence,
pilot:-prefixed SHA/24-character anonymous actor suffix, and5/hour rate scope.
Service fields, form, schema and submission behavior are unchanged. This does
not validate proxy-header provenance or prevent distributed anonymous abuse.
All-field JSON escaping at permitted text lengths can exceed24k and is413;
the body-byte cap and field-length policy are distinct, not a promise every
possible escaped representation fits. Invalid envelopes no longer consume quota.

The16-group actual-source suite tests bytes/UTF8/origin/media/cleanup, anonymous
hash selection, exact rate/submit order and actor/input forwarding, and known/
unknown errors. Pinned-before failures verify original source hashes without
product restoration. Existing genuine-provider and throttle/form suites pass;
anonymous pilot acceptance remains intentional. Tests use synthetic boundaries,
not real submissions, D1 writes, sign-in or hosting acceptance. Evidence:
F:/VisibleMedicine/staging/20261015-pilot-mutation-envelope/.

```sh
node --test tests/pilot-mutation-envelope.test.mjs tests/remaining-throttle-boundaries.test.mjs
```

Historical E-only proposal, baseline, independent review and integrated validation evidence:
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
