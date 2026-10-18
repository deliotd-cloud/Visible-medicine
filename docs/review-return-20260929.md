# Return from the review model to its worksheet

The protected model page now resolves its original source-bound link against the
public review registry and offers **Back to worksheet**. Independent specimen
close controls use that same host destination. Changing selection inside the
model does not silently change which worksheet is returned to.

Resolution compares the complete canonical query, including source, specimen,
frame and revision where present. Missing, altered or ambiguous matches fall
back to the review overview. Client close destinations must be same-origin,
known review routes with permitted, non-duplicated query keys. No arbitrary
return URL, private record read, approval migration or entitlement change.

## Verification

- All 1,575 registered selections round-trip: 9 shoulder, 1,104 body,
  106 nested and 356 specimen-scope entries.
- Invalid, duplicate, oversized, foreign and stale source inputs tested.
- 255 website tests pass; type check and production build pass.
- At 375 × 812, actual host return navigates to and renders the Corpus callosum
  worksheet; the renal model's close button renders the Left renal capsule
  specimen worksheet. Neither host/destination has horizontal overflow.
- A local development hot-reload stack overflow required restarting the existing
  preview. The above browser journeys passed after recovery; no dependency fix
  or production failure is inferred from that development-only observation.

Atlas source remains `e1ad6b0c2aa62cb0f719ef666d559ec0bc8c9eed`.
Integration hash: `ab93d781c2bae2b3126d894ca7ff2f8d7bbe32d7f1147445a08740b8367b21ce`.
No new assets, dependencies, scans, clinical content or licensing obligations.
No review submitted; no publication. Existing source/model and clinical gates remain.

Checks are recorded in the coordination workspace under
`work/review-return-website-{tests,types,build}-20260929.log`.
