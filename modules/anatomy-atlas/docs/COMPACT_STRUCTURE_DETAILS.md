# Compact structure information control

27 September 2026 — source-only presentation correction, not clinical approval.

Regional/whole-body Explore and Dissect layouts already provide a 44px
Structure info launcher when using a drawer. The additional Details shortcut
now hides in mobile, embedded-info and Focus layouts. Ordinary desktop rails
and the separate shoulder toolbar retain it. Practice also retains Details:
that action deliberately returns to Explore and opens the selected anatomy.

## Evidence

- Actual production regional build in a 375 × 577 iframe, right posterior
  communicating artery selected: camera row shrank from 82 to 38px; canvas
  grew from 353 × 147.4375 to 353 × 191.4375px (44px, approximately 30%).
- Structure info remains 44px high. Document width and scroll width both 375px.
  Closing and reopening its actual dialog shows the selected artery's notes.
- Actual mobile Practice still displays Details; clicking it returns to Explore
  and opens the selected artery's information.
- Actual 1440 × 900 desktop: normal Details remains visible; Focus hides the
  duplicate and its Structure info launcher opens the correct selection.
- `node scripts/test-compact-details.mjs`: three actual component mode handlers,
  three scoped CSS selectors and the existing launcher preserved.
- `node scripts/test-practice-result-navigation.mjs`: 23 scenarios pass.
- TypeScript, regional build, both review fingerprint checks pass. All 828
  production build source-input hashes match the current inputs.

No anatomy, model, teaching, entitlement or decision data changed. Revision
fingerprints were refreshed (shoulder first, then body because the dependency
graph includes the shoulder record). Website learner/review import is a separate
delivery step; neither the published website nor clinical approval is implied.
