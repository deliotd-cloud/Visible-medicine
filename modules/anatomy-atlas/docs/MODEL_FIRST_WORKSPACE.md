# Model-first workspace

## Design rule

Keep the model visible on arrival. Put frequent controls beside it and secondary features behind clearly named, closed disclosures. More functionality must not mean a longer page before the atlas. Apply this rule to future regional dissection and imaging work.

## Layout and controls

- Above 1,100 CSS pixels: systems and tools on the left, model in the centre, structure information on the right. The six existing system switches keep their counts, disabled states and exact callbacks.
- At 1,100 pixels and below: **Systems & tools** opens a left sheet; the information panel remains alongside the model until 700 pixels.
- At 700 pixels and below: both panels open on demand. **Structure info** becomes **Practice** during an exam. **Return to model**, the close button and the existing dialog's Escape behaviour dismiss each panel.
- Region selection, dissection, display options, inspection, saved study views, imaging and coverage are closed by default. No feature is removed; named region links replace the redundant mobile dropdown.
- Search and selected-structure tabs precede related study links and secondary study options. The study guide and full structure browser start folded. The duplicated system-summary grid is removed.
- Only the heading and model occupy the central workspace. Existing view/side, zoom, selection, labels and separation controls stay with the model. Side panels scroll independently. Very short/zoomed windows can scroll the central pane to avoid clipping essential controls; this is not a claim of zero scrolling on every screen.
- Reference/review-pending status and the existing BodyParts3D attribution remain visible outside the folded coverage information.

## State and accessibility

The existing permissive Base UI dialog provides modal semantics and focus management; no new dependency, font, texture, source model or service is added. The portal is kept mounted when closed, retaining nested library searches and unsaved view names during ordinary open/close. Crossing the inline/sheet breakpoint remounts nested UI and may reset those transient drafts. Anatomy selections, dissection state, saved records, practice answers and camera ownership remain in the parent explorer and are not reset by panel changes. No persistence format changes.

Desktop uses labelled complementary panels. Compact layouts use labelled triggers, dialog titles/descriptions, two explicit close controls and focus outlines. The layout responds to header wrapping instead of assuming a fixed mobile header height. Browser focus order, Escape, nested select/dialog interactions, touch targets, zoom and actual scroll behaviour still require hands-on acceptance.

## Evidence and reproduction

Run `npm run model-first:test`. `scripts/validate-model-first.mjs` checks actual loaded explorer server markup in all eleven regions plus whole body, with and without a selected structure (24 cases). Catalogue/selection initial states, Next navigation/image components and the GPU view are test doubles; the surrounding control components use their real server render. Injected hooks exercise the actual responsive wrapper's open/close, breakpoint and cleanup callbacks (four cases). These are not browser or GPU tests.

The portable baseline records all 19 named domain handlers and 55 retained control callbacks from source commit `40e47408c40fe140e1a162a7fc011ce346d4be4f`; canonical syntax-tree comparisons verify they are unchanged. The old mobile dropdown navigation handler is deliberately excluded. The complete catalogue, all 86 body bundle hashes and dissection-profile hash are pinned. Stylesheet cascade checks cover sampled desktop, tablet, phone and short-window sizes, without claiming rendered pixel measurements. Results are written to `model-first-validation.json` alongside this file.

The dedicated shoulder layout is unchanged. The 1,022 body source representations, 138 stages, 120 focuses and existing clinical/source holds remain unchanged. No clinical sign-off, image registration, private review mutation, paid API or main-website release is implied.

## Remaining acceptance

1. Authorised real-browser/device checks at desktop, tablet, phone, landscape and high zoom: no unexpected document scroll, usable model area, readable controls and safe-area behaviour.
2. Keyboard/screen-reader checks of both sheets, focus return, nested menus and selection/restoration/quiz workflows.
3. Check ordinary closing preserves local drafts; clearly distinguish breakpoint changes and route changes.
4. Continue anatomy/source adjudication and clinical review separately; presentation improvements do not validate source surfaces or teaching content.
