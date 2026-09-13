# Visible Medicine website integration

## Current delivery

The atlas retains its independently hosted application and source. A contained, same-origin shoulder module is now also integrated into the main Visible Medicine website at `/atlas/shoulder-3d`; see `SHOULDER_WEBSITE_PILOT.md`. Both are owner-review deliveries, not public/paid launch clearance. Do not change the audience or bypass login merely to make embedding work.

The same delivery pattern now supports the female-pelvic workbench at `/atlas/female-pelvis-3d`; see `FEMALE_PELVIS_WEBSITE_PILOT.md` for its source-derived build/export, strict asset prefix and absent imaging/review connections. Consult the dated deployment checkpoint for what is actually hosted; source availability alone is not deployment evidence.

The owner designated **Visible Medicine — Website & Atlas** as the main coordination chat on 12 September 2026. The website's `docs/master-plan.md` is the canonical shared roadmap/decision log; the parent workspace's `WORKSPACE_MAP.md` locates both repositories. Keep the original website and specialist chats intact. The repositories remain separate and recoverable; grouping work in a chat does not merge source histories or grant clinical/public-release approval.

The new review workspace requires trusted authenticated-user headers and D1 storage. Keep it private even if a future anatomy viewer becomes public. Review records are per signed-in user on this Site, not shared across tasks, Sites or team accounts. A self-hosted/main-website port must replace the identity adapter and storage binding safely; never trust incoming client-supplied `oai-authenticated-user-*` headers. See `REVIEW_WORKSPACE.md`.

## Integration choices

The [shared regional module](REGIONAL_WEBSITE_MODULE.md) now covers head/neck and
thorax, abdomen, pelvis, spine, all six limb regions and the whole body with their full supported nested/context views and separately
framed specimens. The existing head-neck delivery namespace is retained;
the destination region is selected explicitly in its launch URL.
This is four runtime directories serving fifteen website module entries, not fifteen
duplicated viewers. See the dated checkpoint for actual hosted availability.

The website now uses its source-bound registered storage/protected-delivery
workflow (`docs/atlas-protected-delivery.md` in the website checkout). Preserve
canonical models and notices; omit verified build-only duplicate GLBs before
packaging. The older [lossless delivery](WEBSITE_LOSSLESS_DELIVERY.md) remains
historical evidence, not the current website publication command. Stage and
verify new registered models before publishing a runtime that needs them.

The independent right lower-limb workbench also has a contained module build and
export at `/atlas/lower-limb-3d`; see `LOWER_LIMB_WEBSITE_PILOT.md`. Five region
scopes retain their source-bound navigation; study links stay in the module and
do not invoke the standalone review database. Refer to the publication checkpoint
for hosted state.

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
