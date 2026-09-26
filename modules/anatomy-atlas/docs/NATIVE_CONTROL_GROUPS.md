# Compact native control groups — 26 September 2026

Shoulder zoom buttons and regional/whole-body vessel-visibility controls now use
native named `fieldset` groups. Their existing accessible names, button/switch
handlers, disabled behaviour and tab order are unchanged. Scoped CSS removes
fieldset defaults (border, margin, padding and minimum inline size) while keeping
the vessel group's six-pixel top spacing, compact zoom buttons and existing
coarse-pointer target sizes. No additional panel, control or visual heading is
introduced. Anatomical label overlays are not changed.

The actual shoulder entry is server-rendered across structures/workspace modes;
the vessel controls are rendered with installed UI components and their real
enabled/disabled/undo callbacks are exercised. Stylesheet tests assert the
compact reset. `shoulder-workspace:test` and `vessel-visibility:test` cover this;
they do not establish browser pixels, physical touch or screen-reader behaviour.

## Vessel-history maintenance

The original validator from `44abaed` failed before reaching UI assertions. Its
`f271f3f` baseline predated the celiac display correction (`3305cb9`) and anterior
cardiac vein addition (`92d97d2`). The repaired check reads the original immutable
transition/catalogue records, verifies current records against them, and permits
only those exact changes. The original historical counts remain175 arteries and
98 veins; the current admitted set is198 arteries and99 veins. These are source
representations, not proof of a complete circulation.

The lockfile assertion also predated two recorded promotions of already present
dependencies to direct dependencies (`94fa489` and `23b8f3b`). The test reconstructs
their exact three-field delta and compares the entire lockfile with the original
commits. No package, version, lockfile or licence changes in this UI patch.

Fourteen negative mutations guard original and later vessel identities, unknown
growth, duplicate/missing structures, model-bundle metadata, dependency changes
and historical content. No old expected source hash or approval is replaced.
There are no anatomy, teaching, patient-data or entitlement changes. Updated
display review fingerprints require fresh review; this is not clinical sign-off.
