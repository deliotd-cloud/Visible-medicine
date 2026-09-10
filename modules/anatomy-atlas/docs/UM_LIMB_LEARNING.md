# Independent lower-limb learning

## Experience

Select a structure and expand **Learn · anatomy, clinical & imaging** in the existing side panel. All 67 supplied selections have source-bound anatomy/function drafts; all 42 muscle selections include typical proximal/distal attachments and motor supply. Ten knee/hindfoot selections also have [46 introductory clinical/pathology/imaging drafts and ten clinical self-checks](UM_LIMB_CLINICAL.md). Three outer groups and their topic tabs keep the panel compact. Unsupported topics remain explicitly pending. These are general teaching facts, not measured footprints, reconstructed nerves or clinically approved segmentation labels. Grouped pelvis/foot bones keep source-scope descriptions without invented individual identities.

**Practise identification** starts a round of up to ten visible, pinned selections; at least two are required. The target is highlighted and framed; other tissues fade. Names, landmarks and origin guides are suppressed. Two to four answer buttons support keyboard/touch input, preferring same-tissue distractors. Camera presets, rotation and zoom remain available. Wrong answers allow retries, repeated clicks cannot inflate results, and revealed answers never earn first-try credit. Completed rounds offer **Retry missed** or **New round**. This is source-label recall, not an accredited exam.

Answering pauses until the renderer and required visible bundles are ready. Failed loading directs the user back to dissection to retry. Returning restores tissue choices, history and display settings; the scene remounts, so a manually dragged free-orbit pose is not restored exactly. Region changes or closing the modal end the round. Results are temporary and never sent to an account, browser storage or clinical record.

## Implementation

- `content/um-limb-teaching.ts` makes explicit concept choices. Forty-one muscles reuse Visible Medicine's original factual drafts by concept key, NOT by FMA. One extensor digitorum brevis draft and 25 bone/tissue/group entries are separately authored. Other-subject cautions, FMA identities, scan hooks and entitlements are excluded.
- `content/um-limb-teaching-bindings.v1.json` pins each complete source entry, declared bundle SHA256 and authored lesson. Runtime lookup compares selected/current entries with the pin; changed, foreign or unknown bindings fail closed. It never substitutes a similarly named structure.
- `lib/um-limb-teaching.ts` returns detached lessons and controls the visible-pool quiz, scoring and retry progression.
- `app/um-limb-learning.tsx` reuses installed Tabs, Buttons and Select. Learn stays collapsed; practice temporarily replaces the workbench without changing its state.

Inspect source identity, grouping, provenance and lesson suitability before explicitly rerunning the pin script. Repinning is NOT clinical review. Runtime binding compares catalogue metadata; it does not cryptographically hash GPU downloads. Existing geometry/export checks establish artifact integrity separately.

The briefs are original factual prose, not copied reference tables or illustrations. References remain attached per lesson. New facts were checked against OpenStax lower-limb bones/selected joints and NCBI Bookshelf knee/leg/foot chapters. These works are not imported, relicensed or claimed CC0; the UM meshes retain separate CC0 provenance. No new dependencies, fonts, textures or paid service.

## Checks and remaining work

`npm run um-limb-learning:test` checks pin freshness, all 67 bindings, mutation/foreign-source rejection, 42 muscle records, round progression/reveals/retry scoring and installed React/Base UI markup. Component checks replace only the GPU scene. Retain the existing knee/limb suites for geometry and dissection regression. These checks are not clinical or browser acceptance.

[Direct study links](UM_LIMB_NAVIGATION.md) can open an exact source selection with any available topic expanded. Pending or unbound topics cannot be linked. They identify the specimen, not a patient or paid-content entitlement.

Still needed: specialist anatomy/content review; arterial supply and deeper relationships; expanded clinical/pathology and CT/MRI/X-ray/US lessons beyond the ten-selection introductory extension; missing nerves/other structures; keyboard/screen-reader, GPU/mobile and performance acceptance; approved imaging registration and the owner's real resource manifests. Root-body teaching counts, review authority and separately paid lecture entitlements are unchanged.
