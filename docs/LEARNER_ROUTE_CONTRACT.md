# Learner enrolment request contract checks

Run `node --test tests/learner-account-route.test.mjs`. Eleven checks compile the
actual `POST /api/learner/account` handler, streamed JSON parser and request-security helpers,
replacing only its explicit server auth, education-service and rate-limit seams.
All records, identifiers and email addresses are synthetic; no database, bootstrap,
hosted authentication, email, scan or clinical application is used.

The positive check submits another user's identity, administrator roles,
organisation and auth-looking JSON keys. The route must pass the exact **server**
auth object to enrolment, alongside only the release ID and invitation code; it
must not derive the learner from that JSON. The successful response stays private
and uncached. Negative checks cover foreign origin/fetch metadata, non-JSON,
declared oversized content length, absent server auth, unknown action and an
education-service refusal. They record auth/rate-limit calls to verify which
boundaries run before refusal.

Three additional checks return limiter429 and known500 before enrolment and
hide an unexpected database message in both response and type-only log. All
failure responses now explicitly remain private/no-store.

These are route contract tests, not authentication acceptance. The auth seam
does not prove trusted upstream header stripping or a genuine signed-in browser
session. The parser now measures a 24,000-byte stream bound, independently of
declared headers; eighteen additional learner/Studio groups cover exact limits,
malformed/non-object JSON, fatal UTF-8, origin/media refusals and reader cleanup.
See [mutation request boundaries](MUTATION_REQUEST_BOUNDARIES.md).
The rate limiter is stubbed here; separate
[atomic limiter evidence](ATOMIC_RATE_LIMIT.md) covers its local concurrency.
The route's current extra JSON keys are ignored; this test does not invent a
strict request parser, durable request key, replay contract or rights gate.

Invitation self-enrolment remains literally disabled in the actual education
service and is verified separately by `tests/course-invitation-hold.test.mjs`.
The successful synthetic service seam is not evidence that invitations work,
grant access, pass clinical review or are ready to enable. Real auth/provisioning,
publication/version/rights and target schema/data/ledger acceptance remain open.
