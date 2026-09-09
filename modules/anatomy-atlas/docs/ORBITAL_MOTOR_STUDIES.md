# Orbital motor-supply study views

In **Head & neck → Dissect**, find **CN III superior division & muscles**, **CN III inferior division & muscles**, or **CN IV & superior oblique**. Alternatively, select a participating nerve or muscle and expand **Study together**. The existing whole-body study links also lead to these regional views while retaining the selected structure and side.

| View | Study targets | Explicit context |
| --- | --- | --- |
| CN III superior division | Supplied superior-division nerve surfaces | Superior rectus, levator palpebrae, grouped eyeballs |
| CN III inferior division | Supplied inferior-division nerve surfaces | Medial rectus, inferior rectus, inferior oblique, grouped eyeballs |
| CN IV | Supplied trochlear nerve surfaces | Superior oblique, grouped eyeballs |

These are three focused views using 20 existing sided source representations (six nerve, twelve muscle, two compound eyeball records). They add three focus recipes and matching dissection windows, paired into three cards by the existing study library. Every earlier recipe is unchanged. The atlas now has 141 stages and 123 focuses; these totals are not measures of anatomical completeness.

Choose a side, rotate, select, isolate or set a structure aside. The existing **Open study view · keep selection** action resets cutaway/separation/camera and restores the recipe's structures; Dissection Undo restores the previous removal state, not the whole prior camera/view. Automatic skull context is disabled for these close views. Existing system toggles, model-loading guidance, failed-load recovery, labels, explode styles and exam restrictions remain responsible for their normal behaviour. No new toolbar or top-level control is added.

## Source and teaching boundaries

The relationships are short original factual teaching, referenced to the [UAMS head/neck nerve table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/) and [Loyola superior-oblique reference](https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/so.htm), opened directly during authoring. The existing profile reference list includes these URLs. No university images, complete tables, copied question bank or other assets were imported.

The source-labelled orbital nerves are not validated complete nerve courses. Terminal branches, neuromuscular endpoints, axon continuity and attachment footprints are not established. The inferior-division view does not reconstruct the parasympathetic route; no eye movement, pupil response or nerve conduction is simulated. Grouped eyeballs are reference surfaces, not additional eyelid or globe layers. No CN VI relationship view is invented for the currently absent abducens source. Clinical/anatomical review and browser/device acceptance remain required.

Stable FMA membership and complete official source component membership are checked against the retained IS-A/PART-OF tables and unchanged catalogue. These identity checks do not provide spatial or clinical approval. Existing BodyParts3D CC BY 4.0 credit and all dependency obligations remain. No dependency, font, paid resource, patient data, lecture access policy, imaging correspondence, authentication/billing integration or private review is changed.

## Verification and historical comparisons

`npm run orbital-motor:test` executes the actual rules, side scopes, related-study lookup, window/focus library grouping, dissection reducer/Undo and source-pinned deep-link helpers. It rejects seven unrelated or incorrect profile mutations. It does not claim browser interaction or clinical acceptance. Other current navigation/library/renderer checks continue using the actual extended profiles.

`scripts/recipe-history.mjs` handles historical copy comparisons only. It requires an exact current full-profile hash and the exact three-window/three-focus/two-reference addition before reconstructing the previously pinned profile snapshot. It verifies the earlier full-profile hash rather than repinning it. Already historical snapshots are idempotent. No runtime profile is replaced or silently filtered by a prefix. The shared curriculum comparison helper canonicalizes only complete body/shoulder/profile snapshots; lesson and transition hashes remain raw. Content and renderer historical checks therefore preserve earlier evidence while separately validating this explicit addition.

Original profile SHA-256: `d127268c45678a49ff8eeae4c5622172d4549497aca33d5b3b19507557d83e9c`. Current: `646198113536b582de64366f719bd54fb88e228205f45597f89e1cbd501f4701`. Changes to either old or new recipes require a separately reviewed transition; this helper does not permit future arbitrary edits.
