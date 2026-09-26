# Integrated Atlas catalogue intake

26 September 2026. Applies to the shared regional/whole-body module used by the
website. No Didanix desktop files, clinical PACS, scans or masks are changed.

## Reproduction and correction

Controlled tests extract the actual catalogue-loading effect from
`app/body-explorer.tsx` and run the real display/link pipeline. At baseline
`3c935b4`, a real tooth record with a malformed source hash reached catalogue
state and initial-link resolution. A response arriving after the 30-second
timeout could also commit when its transport ignored cancellation. These are
code-level reproductions, not browser observations.

The intake now validates the raw JSON before display transformation or state
commit. Required records, source hash shape, unique identities, bundle paths,
region membership, finite coordinates, bounds, and optional presentation
metadata must satisfy the current catalogue contract. Invalid input reaches the
existing error/retry UI; records are never silently dropped, repaired or replaced.
Timeout marks that request inactive before aborting it. Late responses from a
timed-out or unmounted request cannot parse, commit, or consume the initial link.

This is structural validation, **not** cryptographic source authentication,
licence approval, clinical validation, or a replacement for exact-source gates.
A changed but well-formed hash is intentionally not authenticated by this parser.
The current catalogue remains unvalidated; revision-bound radiologist approval
continues through the separate review workflow.

## Evidence

- `node scripts/test-body-catalog-input.mjs --baseline`: two old failures reproduced.
- `npm run body-catalog-input:test`: 73 tests pass, including malformed records,
  compound metadata, HTTP/JSON failure, timeout, unmount and retry races.
- All 1,022 raw and 1,104 displayed records remain deeply unchanged on valid input.
- Viewer-effect identity, loading, scene recovery, selection visibility,
  independent navigation, Education, review and decision suites pass.
- TypeScript and changed-code lint pass. Regional production module builds:
  3,385 modules, 6.17 seconds; existing large-chunk warnings remain.
- Test log: `.local/test-logs/2026-09-26T15-54-32.972Z-52832-6d93d013.log`.

No anatomy mesh, teaching, dependency, entitlement or visible control is added.
Renderer-bound review records are refreshed without granting approval. Browser
acceptance, generated website integration, publication and new external recovery
remain pending. Main-workspace checkpoint records the exact saved revision.
