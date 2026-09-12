# Source-scoped specimen search

12 September 2026. The existing **Tissues & search** panel now accepts words in any order, side, source name, local structure ID and assigned FMA identifier. For example, `left multifidus`, `multifidus left` and `FMA: 22879` find the same declared back-layer surface. Case, accents, spacing and punctuation are normalized for lookup only; visible source labels are unchanged.

This applies to the five independent lower-limb scopes, abdominal wall, female pelvis and back layers. It follows the audited-source recommendation for compact navigation and source identity without adding a permanent toolbar or merging specimens.

- All query terms must match one surface within the current specimen. FMA identifiers are exact, not numeric prefix matches. Unmapped surfaces are not assigned ontology identities by search; main-body clinical aliases are not borrowed into another donor's data.
- Results keep source order. Empty search restores the complete list. Punctuation-only or unknown queries return no matches.
- A short status row appears only while searching, reports matching and hidden structures, and provides **Clear search**, returning focus to the input.
- Typing and clearing affect only the list, not study, separation, camera, selection, visibility, practice answers or history. The existing explicit selection action can restore a hidden tissue; Undo remains available. Visibility switches retain their current behaviour.

`node scripts/validate-specimen-search.mjs` checks actual metadata across all eight scopes, exact identifier and side exclusions, unchanged definitions/dissection state, hidden selection/Undo, real React markup and selection/visibility/clear callbacks. The focus callback is tested with an explicit element double, not a physical browser. Existing specimen/navigation tests and the production build provide integration checks; browser/mobile/assistive-technology acceptance remains outstanding.

No model, anatomy claim, source admission, teaching approval, font, texture, dependency, licence obligation or paid service is added. Original source and ShareAlike notices remain intact. Imaging and lecture authorizations are unchanged; this is lookup, not cross-donor or patient registration.
