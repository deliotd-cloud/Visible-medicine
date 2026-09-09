# Simple atlas navigation

The [curated common-name search extension](SEARCH_VOCABULARY.md) now adds aliases, normalized identifiers and disambiguated cranial-nerve numbers. The milestone details below describe the original navigation change; use `CURRENT_STATUS.md` for current anatomy/recipe counts.

## User-directed changes

These changes apply to all eleven regional explorers and whole body. The dedicated shoulder interface, source meshes and teaching data are unchanged.

1. **Explore · Dissect · Practice** groups tools by activity. Explore keeps system selection, reading and display tools; Dissect exposes the layer/window deck and study guide; Practice gathers question style, target policy, quiz notes and results. Choosing a mode alone does not reset anatomy, camera or answers, nor start a session. During an active session, other modes and search are disabled; Exit practice remains available. Side-panel feedback opens after an answer on compact/focus layouts.
2. **Slimmer system controls:** the desktop rail narrows from 264 to 216 CSS pixels, with reduced card padding, inline counts and 44px minimum rows. The left compact sheet narrows to at most 280px; system cards are at most 216px. The small native switch is not shrunk into a difficult touch target. Labels remain 14px; counts are secondary 12px metadata.
3. **View menu:** one labelled selector retains all six existing directions, including the foot's Plantar label. The current direction and separate laterality control stay visible. Choosing a direction invokes the same camera reset semantics, not a source transform.
4. **Contextual actions:** selected-structure Isolate & frame and Remove stay together. More contains Reveal uncut, Fade others, Frame selection and Clear selection. Redundant always-visible fade/frame icons are removed from the model toolbar. A Details button beside the View selector opens the information panel when needed. Existing actions and guards remain intact.
5. **Grouped information:** Anatomy contains Overview/Function; Clinical contains Clinical notes/Pathology; Imaging contains CT/MRI/Ultrasound. Quiz notes move to Practice and retain their existing body, bullets, caution and citations. A mode-entry button opens practice setup rather than silently starting an exam. No acquired imaging is added or implied.
6. **Focus view:** desktop/tablet users can collapse both sidebars, with Systems & tools and Structure info launchers remaining above the model. Show panels returns to the ordinary layout. Phones already use on-demand panels, so the redundant Focus view button is hidden there. Only one side sheet opens at a time. Focus toggles close existing sheets and do not move/reset source anatomy.
7. **Unified search:** Search atlas covers all 1,022 source structures and body-region routes, plus available study windows/focuses in the current region and side. Filters distinguish those result types. Search matches names, source names and anatomical IDs; it never invents aliases or relationships. Local selections use the existing selection/restoration handler. Non-local structures use validated source-bound study links with explicit laterality; region links disclose that they open a fresh view. Study results first show a clean-view warning and require Open study view before changing custom dissection. Equivalent window/focus recipes keep their distinct actions. Results paginate within the dialog; there is no page-wide result list pushing the atlas down.

## State and safety

The presentation provider owns only mode, panel visibility and focus-layout state. It does not import anatomy reducers or mutate camera refs. Ordinary mode changes hide rather than unmount tool panels, preserving their nested state. Ordinary sheet close retains mounted content. Switching between inline and sheet presentation (window breakpoint or Focus view) still remounts nested UI, so unsaved bookmark-name drafts and local tab/search state inside those panels can reset; saved views and all parent dissection/practice/camera state survive. Route navigation starts a fresh explorer and explicitly advises saving custom work first.

Search typing/filtering and preview do not change model state. Confirmed study actions reuse existing recipe-reset semantics and guards; search is unavailable during exams. Selecting a source outside the current side or region navigates through the existing source-hash/laterality validator rather than forcing it into an incompatible scope. Search has no external service or history storage. Query text is bounded to 256 characters.

Attribution, laterality, incomplete-coverage warnings, review-pending status and the clinical caution remain. No dependency, font, texture, model, paid service, image registration, private review record or main-website modification is added. All 1,022 representations, 86 body GLBs, 138 stages and 120 focuses remain exact.

## Verification

- `npm run atlas-navigation:test`: current result in `atlas-navigation-validation.json`. Index and filtering cover all 36 region/side scopes; all generated cross-scope structure links resolve through the actual source-hash validator. Actual component event closures are exercised with injected hooks for workspace/focus, exam locking, direction validation, local selection, study preview/confirmation and post-answer panel attention.
- `npm run model-first:test`: current result in `model-first-validation.json`. Actual loaded explorer markup covers 72 region/selection/mode combinations. Four responsive panel scenarios and seven bounded stylesheet cascade sizes supplement the markup. All 19 named domain handlers and 52 retained callbacks match the pinned baseline; three intentionally superseded bindings are replaced by four explicitly pinned menu/search bindings. The baseline itself is not weakened or regenerated.
- Existing dissection/workbench, practice, saved-view, imaging-link, source navigation/link/library, loading/guidance, recovery, inspection, arrangement, review and licensing regressions remain required, with type checks and a successful production build.

These are non-browser tests: catalogue/selection/mode fixtures and GPU/Next navigation doubles are explicit. They do not measure pixels, actual scroll, browser focus/Escape or nested-menu behaviour, real touch targets, screen-reader navigation or physical-device graphics. Hands-on acceptance remains required. The UI improvement confers no anatomical or clinical approval.

## Next work

After authorised device acceptance, apply evidence-driven consistency improvements to the dedicated shoulder where useful. Future unified-search work may add cross-region recipe navigation only through an explicit validated route contract. Continue source-specific tendon/thumb adjudication and graphics-initialisation recovery separately; keep this model-first, task-based structure when integrating the user's future US/CT/MRI function.
