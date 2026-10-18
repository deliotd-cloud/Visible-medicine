# CT/MRI structure search

9 October 2026. The existing structure-index search accepts literal words in any
order, with repeated spaces, tabs and Unicode whitespace ignored. For example,
`caudate left` finds an entry whose saved label is `Left caudate nucleus`.
All terms must occur within the same row's existing label, raw ID, declared side
or exact mapped concept metadata. Raw and canonical IDs remain literal strings;
there is no regex, alias inference, side substitution or query language.

Family and 3D-linked-only filters still intersect the result. Discovery never
changes the source identity, concept admission, mask, clinical status or practice
eligibility. Search does not select a result or navigate automatically. The index
remains hidden throughout active questions. The placeholder now mentions side;
no extra panel or control was introduced.

## Evidence

The new reversed-order test failed before correction. After implementation,
one legacy expectation needed updating: the unmapped caudate entry with declared
left laterality legitimately matches `LEFT CAUDATE` under the new AND-term
semantics. The linked-only version still excludes it. Initial diagnostics remain
on E, rather than being overwritten.

All55 focused index, CT/MRI callback, history, navigation and link checks pass.
Fresh TypeScript and the unchanged Clinical Review verifier pass. Read-only
worker risk review found no concrete regression. Synthetic CT/MRI callbacks
confirm no automatic selection/history change, whitespace reset and quiz answer
concealment. No new actual-browser, native-image, GPU or clinical acceptance is
claimed by those checks.

The Sites workflow remains local-only. Evidence and source-only recovery:
`E:/VisibleMedicine-LocalStaging/20261009-head-search/`.
The incremental bundle requires website parent
`dc821adf2fd6f9e6a4d0f1561686dbfed0f42791`; this is same-machine recovery,
not a verified GitHub or off-device backup. Atlas0141a706, generated modules,
Review packets, source models, accepted masks, PACS, authentication, entitlements
and specialist work remain outside the change.

The E website build and four route/exact-client HTTP checks pass. Preview77379
serves port3000, replacing deliberately stopped79139. Historical3001 and loaded
scan tabs were not touched.144 redundant build-only model copies were removed
after exact E recovery checks; canonical source model files remain intact.
