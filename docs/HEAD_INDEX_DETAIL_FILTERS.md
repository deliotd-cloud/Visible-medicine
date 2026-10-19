# Side and annotation-type filters

9 October 2026. Local desktop-first CT/MRI anatomy discovery improvement.

The structure index now has a collapsed **More filters** disclosure. Anatomical
side and annotation type come directly from the current study's declarations;
there is no inferred laterality or reclassification of partial masks. The
disclosure marks active filters even while closed. Both controls are disabled
until a package is opened and are absent during active practice.

These filters intersect search, system and exact-source 3D linking. Filtering
does not change the image, current selection, history or score. Filtered practice
still intersects the whole-study distinct-mask pool. Reset filters, closing or
replacing a study, explicit learning selection and opposite-side navigation clear
the additional filters so they cannot hide the newly requested target. Invalid
select values are ignored. Unknown or missing metadata is not inferred from names.

Tests exercise exact intersections, unchanged source objects, CT and MRI viewer
controls, excluded point questions, explicit practice start, answer concealment,
reset/reopen and opposite-side recovery. Existing navigation, source-link,
guided-practice and lifecycle regressions remain included. Final test/type/Review,
build, served-client and scoped-source recovery evidence is under
`E:/VisibleMedicine-LocalStaging/20261009-head-index-detail-filters/`.

No source scans, masks, model geometry, teaching approvals, independent access
rules, dependencies, fees, public deployment or desktop clinical PACS changed.
Synthetic interaction tests are not clinical or native-image/GPU acceptance.
E recovery remains same-machine, not a verified GitHub/off-device backup.
