# Organ curriculum history repair — 17 September 2026

## Result

The historical `organ-curriculum:test` gate passes again without changing its
accepted hash, content pins, runtime teaching, geometry or recipes. The repair
is limited to the validator's reconstruction of the saved pre-organ snapshot.

## Root cause and provenance

`authoringBeforeOrgans(context)` already returned the correct historical API.
That API includes the eight tabs present at source commit
`812d8cd8ec7dcbdc5df8361a61bef2dae1765a79`, the matching shoulder teaching,
and the recipe state consumed by the existing exact recipe-history normalizer.
The validator nevertheless enumerated `api.contentTabs` and copied
`api.structures` / `api.dissectionProfiles` from the current API. In particular,
the later `xray` tab made every reconstructed body row a mixed-era record.

A detached read-only reconstruction at feature commit `b02a85b` reproduced the
accepted full-copy hash exactly:
`c5f4bd17ed2e032c70c8c397e152dc93fbcef1fd679bbb140bd9c5b4432630a0`.
The current historical helper produces that same hash only when all snapshot
schema/catalog fields come from its returned API; the previously reported
mixed-era construction reproduces
`4976bc36f6e9052c2d197629f4e653b15071ea7042d2a4ba9422ee0f35ff0c0d`.

The validator now serializes `a.contentTabs`, `a.structures` and
`a.dissectionProfiles` consistently. Two explicit negative checks prove that
reintroducing either the current tab enumeration or current shoulder teaching
cannot satisfy the accepted historical snapshot. The eight existing content
mutation guards remain, for ten negative cases total.

## Verification

- `npm run organ-curriculum:test -- --source` — PASS: 10,081 checks, 26 source
  index checks, 10 negative cases and the original 764 pinned curriculum
  sections; report: `docs/organ-curriculum-validation.json`.
- `npm run core-organ-function:test` — PASS after the repair: four source
  selections/placements, exact pins and transition, 954 rejected changed
  identity/topic cases, and 9,914 unchanged topics.
- `git diff --check` — PASS.

The requested local transcript is retained at
`.local/organ-history-repair-20260917.log`. This host's PowerShell transcript
captured command/session boundaries but not native npm stdout, so the exact PASS
summaries above are taken from the successful tool results and the generated
validation JSON rather than represented as a complete raw log.

## Boundaries

No accepted baseline, source pin, transition record, runtime/content file,
model, scan, identifier, access rule or clinical-approval record changed. This
is a historical validation repair only; it is not deployment, device testing or
radiologist sign-off.
