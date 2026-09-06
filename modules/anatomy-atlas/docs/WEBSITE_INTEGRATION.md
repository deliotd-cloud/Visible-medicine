# Visible Medicine website integration

## Current delivery

This is the existing independently hosted anatomy module, not an edit to the main Visible Medicine website. Its private publication is suitable for owner review; it is not yet a public embed. Do not change the audience or bypass login merely to make embedding work.

The new review workspace requires trusted authenticated-user headers and D1 storage. Keep it private even if a future anatomy viewer becomes public. Review records are per signed-in user on this Site, not shared across tasks, Sites or team accounts. A self-hosted/main-website port must replace the identity adapter and storage binding safely; never trust incoming client-supplied `oai-authenticated-user-*` headers. See `REVIEW_WORKSPACE.md`.

## Integration choices

1. **Separate route/origin:** deploy this application through the website's chosen hosting workflow and link to its whole-body, regional or shoulder route. Keep source credits and clinical-status disclosures visible.
2. **Embedded module:** use an iframe with an accessible title and a responsive, sufficiently tall working area after the owner approves the production origin and audience. Test the actual website's frame/CSP policy, login and mobile scrolling; current private Sites authentication must not be assumed to work anonymously in an iframe.
3. **Same application:** port the explorer components and existing permissive dependencies into the website's React build. Namespace the module's CSS before merging; its current root/global styles are not a drop-in stylesheet for the main site. Preserve asset paths, anatomical IDs and the event contract.

## Checklist before upload/public launch

- Build with the documented Node/npm versions and the checked-in lockfile; preserve all `LICENSES` and full model credits.
- Serve GLBs/JSON with correct content types and cache/version by the recorded hashes. Keep the model catalogue and bundles from one revision together.
- The present module assumes root-absolute paths (`/models`, `/brand`, `/regions`, `/shoulder`). A subdirectory deployment requires a tested base-path/asset-path adaptation; copying the build into `/anatomy/` alone is not sufficient.
- No runtime API key, paid AI service or anatomy subscription is required. Hosting, domain, professional review or future scans may incur costs; no perpetual-free guarantee is made.
- Re-run desktop/tablet/mobile checks inside the real website, including keyboard navigation, 200% text enlargement, touch gestures, WebGL support and reduced motion. Current testing is a development-browser sample, not a device-lab certification.
- Keep educational/non-patient-specific scope and incomplete nerve/organ coverage prominent. Obtain revision-bound specialist sign-off for any claimed reviewed scope.
- Wire the opt-in selection contract in `lib/imaging-sync.ts` to the future imaging implementation using [IMAGING_LINK.md](IMAGING_LINK.md). Identity selection needs reviewed segmentation mappings; spatial synchronisation additionally requires validated patient registration. The reference-plane illustration is independent, and no imaging viewer is connected by default.
- Obtain owner approval for the final public audience and destination. Keep this atlas and the main website separately recoverable until integration is accepted.
