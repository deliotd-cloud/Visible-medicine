# Pancreatic vessels and epiglottic dissection

## Available in the atlas

This milestone reaches **954 selectable source representations in 78 body bundles**, plus the unchanged dedicated shoulder. Twelve BodyParts3D v4 definitions add fourteen original source components in two bundles (198,324 bytes). Total body assets are 94,852,136 bytes. All preceding 942 records and 76 bundle hashes remain exact, including source coordinates, corrected intestinal ownership and public IDs.

There are **113 dissection recipes and 95 focused views** across eleven regions and whole body: 47 regional layer steps and 66 independent study windows. Counts describe authored visibility recipes and supplied reference surfaces, not complete anatomy or clinical dissection.

| Region → study window / focus | Targets and explicit context |
| --- | --- |
| Abdomen → Pancreas & supplied vessel detail | Eleven new vessel identities and the existing pancreas; set the pancreas aside and Undo to restore it |
| Abdomen → Pancreaticoduodenal arteries exposed | Six arterial identities with common-hepatic and superior-mesenteric source context; organs/veins hidden |
| Abdomen → Pancreatic body & tail vessels | Four arterial segments with pancreas and splenic-artery context; posterior preset |
| Abdomen → Pancreaticoduodenal venous context | One three-component vein group with pancreas, superior-mesenteric and portal-vein context |
| Head & neck → Epiglottis & laryngeal framework | Epiglottis with hyoid, thyroid/cricoid cartilages and two epiglottic ligaments; lateral preset |

Existing select/frame, remove/restore/Undo, isolate/fade, system switches, cutaway, spatial explode, same-scale arrangement, labels, search, related-study groups, regional links, local bookmarks and formative practice include these entries. New close views use explicit context, not a whole-region skeleton. The one-target epiglottis and vein groups support focus-only finding; focus-only naming remains unavailable when it cannot supply distinct choices. Existing saved configurations retain their conservative source-revision expiry. Previously shared structure links still resolve because prior bundle hashes are unchanged.

## Exact source admission

| Official source identity | Original IS-A component(s) |
| --- | --- |
| FMA55130 epiglottis | FJ2770 |
| FMA14782 anterior superior pancreaticoduodenal artery | FJ3409 |
| FMA14784 posterior superior pancreaticoduodenal artery | FJ3557 |
| FMA14787 dorsal pancreatic artery | FJ3430 |
| FMA14790 inferior pancreatic artery | FJ3444 |
| FMA14792 great pancreatic artery | FJ3433 |
| FMA14793 caudal pancreatic artery | FJ3419 |
| FMA14805 inferior pancreaticoduodenal artery | FJ3446 |
| FMA15398 pancreaticoduodenal vein | FJ3545, FJ3646, FJ3655 |
| FMA70479 anterior inferior pancreaticoduodenal artery | FJ3401 |
| FMA70480 posterior inferior pancreaticoduodenal artery | FJ3546 |
| FMA76574 trunk of gastroduodenal artery | FJ3432 |

The explicit allowlist is in `scripts/pancreatic-selections.mjs`. The audit records retrieval only (`admitted: false`); it cannot itself import a candidate. `content/pancreatic-baseline.json` pins source commit `aa0e55b79d707f518ebb6faa77b96278f1aae5ab`, and `content/pancreatic-source-audit.json` records all thirteen candidates, exact names/components, CRC/size, raw/canonical geometry hashes, source bounds and 180 relevant surface comparisons. No existing canonical source owner duplicates an admitted component; no compared candidate/existing pair shares an exact position triangle. All twelve admitted definitions have finite source surfaces and no degenerate triangles in this audit.

### Contact flags and conservative decisions

Proximity is a diagnostic flag, not an automatic duplicate classifier. At most 128 deterministic vertices per direction are measured against every triangle of the comparison surface. Pairs are pruned only when their source boxes are more than 1 mm apart. Existing abdominal vessels and all existing head/neck entries form the comparison set. This is not exhaustive organ-intersection, vessel-connectivity or clinical validation.

- **FMA14792 / FMA14793:** 18/72 great-artery samples are within 0.25 mm of the caudal source, but those close samples occupy less than 1 mm along every axis; the reverse direction has only 1/107 close samples. Median distances are 6.78 and 14.77 mm. Engineering inference: a local near-contact, not evidence for near-coincident whole-surface alternatives. Admit both exact labels unchanged, explicitly withholding any claim of a proven junction/anastomosis or normal branching. Do not weld, bridge or extend them.
- **FMA55130 / FMA55227:** 31/121 hyo-epiglottic-ligament samples are close to the epiglottis, versus 1/125 in the reverse direction; medians are 2.12 and 3.24 mm. There are no shared exact triangles. Admit the source epiglottis identity as an unvalidated reference surface, not a separate cartilage core. The narrow ligament contact does not establish validated attachment extent. FJ2770's broader pharyngeal-subdivision aliases are not separately rendered.
- **FMA55077 pharyngeal raphe / FJ2749 remains held.** Its source is about 2.25 mm wide and 114.85 mm superior–inferior. The component also occurs in broader anatomical-line/boundary and immaterial-entity parent definitions; these are not identical single-component definitions. About one quarter of sampled raphe vertices are close to each inferior-constrictor surface across a broad extent. This is not proof of error, but a boundary representation must not silently become thick, dissectible connective tissue. Specialist tissue/extent adjudication is required. The source is not relabelled, thickened or included as a mesh.

Some existing comparison surfaces contain degenerate triangles. The distance routine now falls back to segment/point distances for zero-area faces and non-finite projections, asserts finite diagnostics and changes no source geometry. The initial NaN-containing diagnostic output was superseded by the corrected finite audit before admission.

The FMA46622 middle-constrictor aggregate remains absent because it reuses FMA46633/FMA46634's already held components. Grouping never bypasses those holds. All earlier near-overlap/laterality/registration holds remain in force.

## Commercial provenance and clinical gates

All added meshes and source-index-derived evidence retain **CC BY 4.0**, rechecked on 6 September 2026 at the [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Preserve: **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, the licence link and indication of adaptation. The application makes the same millimetre-to-scene transform, indexed mesh conversion and display-normal/material adaptations as earlier bundles; it does not invent source anatomy.

No new package, font, texture, copied diagram, paid API or fee-bearing model is added. Brief original draft notes cite [TTUHSC abdominal arterial facts](https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html) and [laryngeal facts](https://anatomy.ttuhscep.edu/schemes/larynx_tables.html); no authored tables or illustrations are redistributed. Existing hosting/tooling terms and attribution obligations remain; no perpetual free-hosting guarantee is made.

Specialists must adjudicate source identities, component extent, organ relationships, vessel origins/endpoints and continuity, calibre, lumen, variants and grouped vein semantics. The epiglottis has no independently segmented mucosa/cartilage core, moving airway or swallowing mechanics. No normal perfusion territory, surgical plane, complete peripancreatic network, ducts or nerve/lymphatic plexus is established. All entries and notes remain unvalidated. Actual touch/keyboard/assistive-technology and visual/educator acceptance are still pending.

CT/MRI/US tabs remain explicit about absent studies. The new source identities participate in the existing reference-space selection hooks, but this is not acquired imaging, a working modality adapter, patient registration or clinical sign-off.

## Reproduction and next work

`npm run pancreatic:test` uses committed evidence and installed dependencies, so it also runs in the GitHub snapshot without the Site's original Git history or raw-download cache. The optional `node scripts/validate-pancreatic.mjs --raw-source` additionally checks cached original vertices and source bytes; all 11,249 assertions in that mode passed here. Re-running the retrieval audit itself requires the pinned Site Git history, raw cache and network. Those are not patient data and are deliberately not included in the source snapshot.

Run the pinned candidate audit, explicit full-body ingestion, source inventory reconciliation, `pancreatic:test`, the historical-source preservation suites and current dissection/workbench/practice/bookmark/imaging/navigation/link/inspection/arrangement/explode/review checks. Complete type checks, lint, licence audit and production build before private publication. `docs/pancreatic-validation.json` records **11,149 assertions**, including exact prior preservation, finite contact diagnostics, current ownership/transforms, five windows across all side filters, restore/Undo, focused practice and old-link compatibility. Numerical tests are not browser or clinical acceptance.

The refreshed unused-source query now has six candidates, including one held-component aggregate. Inspect the remaining distinct identities/aliases before any next admission; preserve all holds absent new evidence. Next functional work can improve discovery and ordered presentation of the growing regional study-window lists, with current source IDs and controls preserved. Continue the broader goal; actual imaging integration requires the user's adapter and rights-cleared de-identified studies.

Storage housekeeping: seventeen obsolete task-generated deployment packages were removed when the local drive filled. Source checkpoints, published versions, original anatomy, current packages and the GitHub snapshot were retained. Removed packages can be rebuilt from their source checkpoints; they were temporary build outputs, not unique source assets.
