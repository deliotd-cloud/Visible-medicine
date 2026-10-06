# Authentication contracts and remaining hosting gates

Run `node --test tests/auth-contract.test.mjs` for fifteen focused groups against
actual `lib/auth.ts` and `app/chatgpt-auth.ts`, with only explicit Next header and
navigation seams. The exact source pins are enforced before compilation; update
them deliberately with independent review if these helpers change. All fixture
identities/headers are synthetic. The test never calls a real identity provider,
database or hosted account and does not alter authentication or roles.

Required ID/email header absence produces no ChatGPT user. Accepted headers map
to `edu:<id>` / `sites:<id>` without deriving identity from email/name. Optional
percent-encoded UTF-8 names decode only with the exact encoding marker; invalid
values fall back to email. Header service failures propagate. Production absence
returns null; every other NODE_ENV, including staging/unset, retains the existing
demo fallback. Any privately deployed environment must verify production mode:
calling an environment staging does not disable the demo identity.

Sign-in/out return URLs preserve ordinary relative paths/query/hash, normalize
internal backslashes and reject external/protocol-relative paths and exact or
dot-normalized reserved auth paths. The tests retain observed, not newly approved,
same-origin aliases `/%63allback`, `/callback/`, `/CALLBACK` and encoded slash paths.
Dispatcher handling of aliases is unverified. No proven external redirect exploit
is inferred. Future deliberate hardening can change those observation assertions.
The role helper is case-sensitive any-of; it is not membership/permission evidence.

## Required private-deployment acceptance

1. Verify the chosen hosting boundary strips caller-supplied identity headers and
   supplies the authenticated user pair, with correct production environment.
   This Sites header adapter cannot be reused on an untrusted self-hosted origin
   merely by forwarding these header names.
2. Verify real-owner identity and independent server-side organisation/admin
   authority, user isolation and account suspension/revocation behavior.
3. Verify durable revision-bound Clinical Review decisions and exact material
   readback. Identity, Atlas access, case access and paid-lecture access remain
   independent; no stored decision or grant is migrated by these tests.
4. Verify dispatch-owned sign-in/sign-out/callback paths and return-path alias
   behavior on that actual hosting configuration. Keep services' access credentials
   distinct from signed-in user identity and never expose them to client code.

The Sites authentication skill informed this trust separation: SIWC identity is
not workspace authority, email/name are display/contact information, and service
access does not provide user identity. No new auth scaffold/provider, credential,
paid service, private record, desktop application or deployment is introduced.

Exact current proof/review/integration logs remain under E
`20261006-auth-contract/`, `20261006-auth-contract-review/` and
`20261006-auth-contract-integration/`. These are regression evidence, not genuine
signed-in browser, upstream header-provenance or clinical acceptance.
