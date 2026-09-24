# Shared Atlas label selection semantics — 24 September 2026

The contained regional/whole-body viewer was regenerated from committed Atlas
source `c0bdec4e799a2f0ee944ca74501e8e21684d74d1`. Its manifest SHA-256 is
`4a9d70cc39d7b1734749b88aa258365997d5cbe27bc3ffe30b61a5d19dfade3b`.
Selected scene-label buttons now expose `aria-current="true"` rather than
`aria-pressed`: they select an anatomical structure but do not toggle it off.
The other three contained viewers and their source revisions are unchanged.

The generated module was exported through the Atlas source pipeline. Its 134
model bundles and 12 regional scopes matched the prior private v108 module;
no geometry, anatomical ID, imaging case, clinical review, scan or entitlement
changed. The complete website inventory still contains 135 unique model objects
and 142 protected paths. The updated inventory SHA-256 is
`c917b5fa0b6aba8261288480766ec45dad5d200bbb62eed63650adaf99ca59c7`;
the existing administrator-review delivery policy is bound to it. The old v108
generated module is retained only in the ignored local preservation directory
until packaging and recovery are verified.

Atlas label/renderer/selection-visibility suites and TypeScript passed. The
website's exact-manifest staging and accessibility pin tests, navigation,
protected-delivery checks and TypeScript passed. These checks do not establish
screen-reader behavior, device acceptance, clinical approval or publication.
Release packaging, GitHub/D recovery and any private Sites deployment must be
recorded separately with their actual outcomes.
