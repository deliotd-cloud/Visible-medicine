# Source-linked study navigation

## What is available

In every regional explorer and the whole-body explorer, **Browse structures** now has a name/source-ID/laterality filter, system filter and optional **Enabled in this dissection only** filter. It reports the matching count, selected identity and removed/system-off/loading/unavailable states. These are visibility settings, not a promise that a surface is unoccluded by another structure, cutaway or opacity setting.

Tab into the structure list, use Up/Down/Home/End to move focus, then Enter or Space to select. Arrow focus alone never restores anatomy, emits an imaging selection or moves the model camera. Native buttons retain their ordinary pointer and keyboard activation; a single button participates in Tab order. The list scrolls locally. Search and other controls do not acquire global keyboard shortcuts. Rows are at least 52 CSS pixels high. Actual touch, keyboard and assistive-technology acceptance remains pending.

Selecting a removed structure restores it using the existing dissection reducer and enables its system, preserving the current camera, cutaway, separation and unrelated removals. A concise live status announces the selection and any restoration. Model failures remain explicit and use the existing retry controls. Lazy loading is retained: catalogue entries can be selected before their bundle arrives, with a loading notice rather than an invented rendered-success claim.

## Study together

Select a structure and expand **Study together**. Available groups come exclusively from that region's existing authored focus rules and explicit context rules. Targets and context are listed separately in the metadata and labelled in the browsable group. A structure included only by automatic skeletal background does **not** gain a relationship edge.

Groups where the selection is a target are ordered before groups where it is context; smaller groups are presented first. **Open study view · keep selection** applies the existing focused recipe, retains the selected ID, restores recipe membership and resets cutaway, separation, isolation and framing using the established focus handler. The action explains those changes in advance. Dissection Undo restores the previous removal recipe, not the old camera; save a study view first to preserve full camera/display context.

The current catalogue still has 90 authored focuses across 12 scopes. Whole-body currently has two broad arterial/venous focuses; it does not silently borrow a regional recipe. If no group is authored for the current selection/scope, the interface says so. This feature does not introduce new clinical relationships, attachments, innervation, source geometry, anatomical segmentation or additional focus recipes. Regional-to-whole-body study deep-links are follow-on work.

## Architecture and safety

- `lib/study-navigation.ts`: pure membership derivation, multi-term filter and bounded focus-index movement. Accepts only the current region/side catalogue subset. Stable public/FMA IDs are retained; no proximity-based anatomical inference.
- `app/structure-navigator.tsx`: reusable filtered list with native buttons, roving focus, scoped keyboard handlers and non-colour selection feedback.
- `app/related-study.tsx`: compact expandable study group selector, explicit recipe-opening action and target/context browser. Selecting within a group retains the chosen group.
- `app/body-explorer.tsx`: existing source selection, restoration, focus, imaging and exam state remain authoritative. Exam mode does not render study navigation; both selection entry points reject active-exam and out-of-scope calls. A dedicated practice announcement replaces the previously over-broad live region around the entire sidebar, without exposing the correct identity before an answer in name mode.

There are no new dependencies, fonts, textures, paid APIs, permissions, saved personal data or clinical approvals. Source meshes, catalogue bytes, source coordinates, imaging contract and device-local bookmark format are unchanged. The dedicated shoulder's existing nine-item structure list and review fingerprints are unchanged.

## Source inventory check

A read-only check of unused available v4 ISA definitions with at most two mesh components and connective-tissue name terms returned only FMA50119, FMA50146 and FMA50147. These are arterial branches named for the internal capsule, not capsule/fascial surfaces. No source was admitted and no hold was lifted. This lexical check is bounded triage, not exhaustive adjudication of every unused definition; evidence is in `study-navigation-validation.json`.

## Evidence and remaining acceptance

Run `npm run study-navigation:test`. The 89,681 assertions cover membership, target/context separation, scope/laterality, retained-selection visibility, focus/Undo transitions, stable-ID search, system/enabled filtering, keyboard boundaries and offline component wiring guards across 36 region/side combinations. The test pins unchanged catalogue SHA-256 `8834615444c57b428fdf79689370c7894ba7aa400149f0b800014d9fdc158836`.

Source-integrity checks confirm all 942 entries and 76 body bundles; dissection, workbench, practice, bookmarks, imaging, inspection, arranged/exploded layouts, inventory and private-review tests also pass. Type checks, focused lint, build and the 808-package licence audit are required before publication. No browser/device testing or clinical review is claimed by these automated results.

Before release, an educator/anatomist must review authored group membership and wording. Target-device testing must verify visible focus, long names, narrow-panel scrolling, screen-reader selection announcements, keyboard/touch restoration, unavailable-bundle states, group opening/Undo and absence of study answers during practice. Existing missing anatomy, source holds, clinical-validation requirements and actual US/CT/MRI adapter/registration gates remain open.
