# Regional study library

The counts and hashes below describe the original library milestone. The [thoracic extension](THORACIC_DETAIL.md) now brings the same library to 69 independent windows, 98 focuses and 140 cards (167 recipes, 27 equivalent pairs), with 47 layer steps still separate. Current hashes and 34,836 passing assertions are in `study-library-validation.json`.

## Find a dissection view before changing the model

Open **Dissection, inspection & study tools → Study windows & focuses** in any regional or whole-body explorer. The library replaces the long window and compartment dropdowns; the numbered **Layer by layer** track remains separate.

1. Search by a view name, retained structure name or source FMA identity. Search includes context, not just focus targets.
2. Filter **Includes system** and **View type**. Order choices by authored order, fewest structures, broadest view or name. Sorting is a study aid, not a claim about anatomical depth or a surgical sequence.
3. Expand **Preview** on a card. Read its existing description and inspection notes, exact hide/restore/keep counts, loading status and retained structure list. Focus targets are distinguished from context, including automatic skeletal background where applicable.
4. Choose **Open study window** or **Open compartment focus**. Focus retains the authored target group for focus-only practice. If both buttons are present, the source visibility rules are identical, but both underlying recipe identities/actions remain available.
5. The library closes and keyboard focus returns to its trigger. Reopen it to retain the current search/order/expanded card during that explorer visit. **Clear filters** resets only the library. No library preferences, patient data or learner records are saved to browser storage or a server.

Browsing, searching, sorting and previewing never changes anatomical visibility, selection, camera, cutaway, separation or imaging selection. Explicitly opening a recipe uses the existing clean-stage behaviour: manual dissection overrides and system filters reset, selection/isolation/cutaway/separation clear, and the authored direction is framed. The same Undo, Reassemble, Free exploration and removed-tissue controls remain available. Undo restores dissection visibility history, not every prior camera/system setting; use Saved study views for a fuller configuration.

## Complete recipe coverage without duplicate menu rows

All **66 independent window choices and 95 focuses** remain reachable, represented by **137 cards** across eleven regions and whole body. Twenty-four window/focus pairs share a card. None of the **47 regional layer steps** is recast as an additional independent depth. The atlas still has **954 source entries, 78 body bundles, 113 dissection stages and 95 focuses**, plus the unchanged dedicated shoulder pilot.

Pairing requires the same authored identity, title, view direction and exact explicit visibility rules, with automatic skeletal inclusion disabled for the focus. Equal current visible sets alone are insufficient: laterality filters and empty scopes must not cause unrelated recipes to merge. Pairing does not infer an anatomical connection, add a new teaching relationship, alter underlying IDs or remove either action. Authored order is the existing profile order; the default does not invent a clinical curriculum.

**Current recipe** and **Active recipe** identify the selected recipe, not a promise that its clean visibility is unchanged after manual customization. Preview counts use the actual enabled, non-removed source IDs supplied by the explorer. Loading status distinguishes loaded, not-yet-loaded and failed entries; it does not imply that a surface is visible on screen or unoccluded. Failed status takes precedence over an old loaded flag. Views can be opened while their geometry loads, using the existing retry controls when needed.

The current scope is re-resolved before an action. Unknown IDs, unavailable windows, targetless focuses and exam-mode actions are rejected. A focus with only skeletal/context surfaces and no source targets is not presented as an available target group. During practice, the library hides its search/results and cannot apply a recipe. Filters are literal, case-insensitive, multi-term matching bounded to 256 characters; no user input becomes a regular expression or external URL.

## Presentation and verification

The existing Visible Medicine ink/teal palette, system fonts, component buttons and native filter-field conventions are reused. A bounded result list keeps the model workspace compact; cards expand inline, controls have visible keyboard focus, and filter fields enlarge on mobile. Search results and preview counts have a scoped polite announcement. No new image, anatomy mesh, dependency, paid service or licence obligation is introduced.

`npm run study-library:test` validates every window/focus across **36 region/side scopes**: exact reachability, stable grouping, negative merge cases, literal source search, all system/type filters, four ordering modes, preview partitions, loading/failure precedence, current-scope action guards, exam gating and source non-mutation. Twenty-four server-rendered markup cases cover the real component with the installed UI primitives, including labelled filters, result announcements, connected expandable panels and exam-hidden contents. They are not browser interaction, visual, touch or assistive-technology tests.

The catalogue hash remains `e253e9ec0c1a1567b3ac614501c6511338d44234a28696501733679f377821c9`; authored profiles remain `95aa36b8b050e38be80bbe867a659cd8acd6d18af3cb9deab48521d0ab56b433`. Existing source, dissection/workbench, practice, bookmark, imaging-link, navigation/link, inspection/arrangement/explode and review regressions must also pass, along with type checks, lint and a production build. The exact new report is `docs/study-library-validation.json`.

Actual device acceptance must still check expansion/scrolling, keyboard focus return, screen-reader announcements, mobile and 200% text sizing, and clarity when two recipe actions share a card. No clinical approval, anatomical completeness, imaging findings or patient registration is created. Source/clinical holds from previous milestones remain intact.

## Next executable work

Resume the remaining compatible v4 thoracic vascular source queue: esophageal artery FMA4149/FJ1934, the FJ3418 bronchial-variant/arch-branch aliases, bronchial artery FMA68109/FJ1933 and grouped oesophageal branches FMA71537/FJ3431. Retrieve and compare exact definitions, source geometry, existing thoracic vessels and common coordinates before any admission; source labels alone are insufficient. Keep the middle-constrictor aggregate and all other held components withheld. Broader anatomy, presentation/resilience, real-device/clinical acceptance and the user-supplied CT/MRI/US adapter remain ongoing goals.
