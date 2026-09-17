# Regional text preferences and keyboard navigation

Source-only improvement, 17 September 2026. No anatomical, teaching, clinical
review, imaging entitlement or geometry change. No new controls or dependencies.

## Reproduced problems and changes

Shared regional styles used fixed pixel text sizes. On the running thigh page,
doubling the root font left Search atlas at 14px and its dialog heading at 20px.
The styles now use equivalent rem values: those become 28px and 40px with a 200%
root preference, while default 16px-root sizing is preserved. This conversion
covers 228 font-size declarations and seven font shorthand sizes in the two
existing regional/workspace stylesheets; spacing and anatomy dimensions stay put.

Enlarged text exposed a Practice label beyond the 390px viewport and a squeezed
search select. Workspace modes can now wrap. Search-dialog children do not shrink,
and input/select minimum heights account for their text and padding. The bounded
dialog scrolls so results and its exit remain keyboard reachable. Existing source
selection, side/system state, dissection and focus controls are reused.

The structure count, its caption, review eyebrow and system counts use the existing
`--vm-muted` palette colour. Four actual foreground/background samples measure
4.628:1 on ivory and 4.965:1 on white. The target follows
[W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
This measurement is not a claim that every label, state or asset meets WCAG.

## Evidence and remaining acceptance

Coordination-workspace scripts/evidence:

- `work/check-regional-text-navigation-20260917.mjs`: Whole body, Thigh, Foot,
  Spine and Head & neck at desktop default, desktop 200% root font and mobile
  200% root font. Tests real Tab access and Enter selection in search, visible
  focus, readable form height, enlarged headings, mode arrow keys, system Space
  toggles, mobile sheet return/Escape and desktop focus-view return.
- `work/check-atlas-metadata-contrast-20260917.mjs`: four computed-style samples,
  including ancestor background composition, not screenshot colour estimates.
- `work/probe-regional-usability-20260917.mjs`: includes a 720×480 short-layout
  sample. That sample is not native browser zoom; root-font changes are not
  browser-wide zoom or text-only-zoom certification.

The full keyboard order, screen readers, native browser zoom, physical phones,
lower-powered GPU, dedicated shoulder and every nested study still need broader
acceptance. These checks do not approve anatomical relationships or certify the
website-hosted module. Source-only release and clinical/privacy gates remain.
