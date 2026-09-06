# Mesenteric anatomy and bowel-vessel dissection

## What is available

The current atlas contains **942 selectable source representations in 76 body bundles**, plus the unchanged dedicated shoulder. This extension adds **17 BodyParts3D v4 entries**: three mesenteric surfaces, nine arterial segments and five venous segments. Every preceding 925 catalogue record and 74 body-bundle hash is unchanged, including the corrected intestinal-junction ownership.

The new meshes use the existing registered source frame and are selectable in Abdomen and whole body. No new anatomical geometry is invented, mirrored, stretched or moved to fit expectations. The two new bundles total **953,136 bytes**; total body assets are **94,653,812 bytes**. There are now **108 authored recipes and 90 focused views** across eleven regions and whole body. Recipe count does not establish complete dissection coverage.

Open **Abdomen → Guided dissection**:

| Study window / focus | Included context | Useful action |
| --- | --- | --- |
| Mesenteric surfaces & bowel | Three mesenteric surfaces, both bowel aggregates, appendix and ileocecal junction | Hide bowel to inspect the source surfaces; restore/Undo to compare relationships |
| Mesenteric vessels exposed | Fourteen admitted vessels plus existing SMA, IMA and portal-vein context | Remove the overlying bowel/membranes and compare the available vessels |
| Colic & appendicular arteries | Nine arterial segments plus existing SMA/IMA | Select/frame a small branch; compare source extent |
| Mesenteric venous drainage | Five venous segments plus existing portal vein | Study venous surfaces without the arterial display |
| Appendix, mesoappendix & artery | Mesoappendix, appendicular artery, appendix and ileocecal junction | A close view without the large bowel aggregates; hide/restore the mesoappendix |

The existing visibility tray, Undo, isolate/frame, opacity, cutaway, spatial explode, same-scale arrangement, labels, source search, local study views and focus-target practice work with these entries. Practice is formative and the teaching notes are draft. Selecting a one-sided filter limits the relevant left/right colic entries; unpaired/unspecified mesenteric surfaces are retained as supplied. No anatomy is artificially split at the midline.

## Exact admitted source identities

| Group | Official source concepts |
| --- | --- |
| Mesenteric surfaces | FMA14643 small-intestinal mesentery; FMA14647 transverse mesocolon; FMA16549 mesoappendix |
| Arterial segments | FMA14810 middle colic; FMA14811 right colic; FMA14815 ileocolic; FMA14818 appendicular; FMA14820 ascending branch of inferior ileocolic branch; FMA14824 marginal colic; FMA14826 left colic; FMA14828/FMA14829 ascending/descending left-colic branches |
| Venous segments | FMA14332 superior mesenteric; FMA15391 inferior mesenteric; FMA15405 ileal; FMA15406 middle colic; FMA15407 right colic |

Exact original names, source files, raw hashes, canonical geometry hashes, source/scene bounds, aliases and archive evidence are recorded in `content/mesenteric-source-audit.json`. `scripts/mesenteric-selections.mjs` distinguishes twenty retrieved candidates from seventeen explicit admissions. The three mesenteric entries use an additive **membrane** category under the connective system; they are not silently classified as ligaments or a complete peritoneum. Existing category values and product IDs remain valid.

## Three withheld arterial alternatives

No canonical whole-file matches were found between candidates and previously represented anatomy. There were no exact shared triangles among candidate meshes or between candidate vessels and existing abdominal vessel entries. Those checks were insufficient: differently tessellated surfaces can be nearly coincident. A second diagnostic compared up to 96 sampled vertices in both directions against the other mesh's actual triangles, across candidate vessels and existing abdominal vessel entries.

- **FMA66358, trunk of superior mesenteric artery:** sampled median point-to-surface distances to the existing FMA14749 representation are about **0.117–0.130 mm**. Roughly three quarters of samples fall within 0.25 mm in either direction. This is treated as a potential overlapping alternative, not extra vascular coverage. The existing SMA stays unchanged.
- **FMA14809 ileal artery and FMA14819 ileal branch of the inferior ileocolic branch:** the two differently labelled surfaces have sampled median distances of **0.243–0.295 mm**, with all sampled distances under **0.601 mm**. Both are held; neither is arbitrarily preferred or relabelled.

These diagnostics establish a reason for review, not a clinical declaration that either source is erroneous. They are sampled, not exhaustive Hausdorff distances, validated centreline correspondence or a collision solver. All three holds are retained in the source inventory. Remaining candidate pairs did not trigger this particular threshold; that does not prove absence of intersections, correct attachments or vascular continuity.

## Reproduction and validation

The immutable baseline is source commit `85401e066e4f5479ca00e7177f2e8aa29676ec94`, catalogue SHA-256 `9512052d74f333f3276aac1926c8537c428badcd237dd724a5822cd7c7a005cd`. Its record hashes and bundle manifests are stored in `content/mesenteric-baseline.json`.

1. `node scripts/audit-mesenteric.mjs` retrieves/verifies twenty source candidates and reproduces the geometric diagnostics. It requires the original Site Git history, source cache and archive access; it does not itself admit anything.
2. `node scripts/ingest-full-body.mjs` includes only the explicit seventeen admitted definitions. It verifies archive CRC/size and applies the same established geometry conversion and coordinate transform.
3. `npm run inventory:audit` checks official table bytes, both archives and represented cross-tree geometry; held-candidate raw evidence remains in the mesenteric audit even where the rendered inventory intentionally carries no hash for unused files.
4. `npm run mesenteric:test` verifies all prior record/bundle hashes, exact new source bindings, bounds, licences, holds, draft content, the five stage/focus rules, side filtering, hide/restore/Undo, focused practice and source-based imaging entries. The committed evidence permits this validator to run in a source snapshot after installing dependencies, without old Git objects.
5. Run the existing geometry, inventory, historical-source, junction, dissection, workbench, practice, saved-view, imaging, inspection, arrangement, explode and review suites; perform type checks, focused lint and a production build.

Current new-feature validation passes **2,733 assertions**. Geometry contains 4,844,052 triangles / 2,427,416 vertices. Numeric/helper tests do not inspect on-screen anatomy, label collisions, actual touch/keyboard behaviour or clinical correctness.

## Commercial rights and remaining clinical gates

The source grant is **CC BY 4.0**, rechecked at the [official BodyParts3D licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) on 6 September 2026. Retain the existing DBCLS credit, licence and derivative-change notices. No paid service, additional dependency, font, texture, textbook diagram or generated anatomy is included. Brief original draft notes use [TTUHSC's peritoneal reference](https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_tables.html) and a [primary portal-drainage anatomical study](https://pubmed.ncbi.nlm.nih.gov/23749713/) as factual citations only; their authored texts/figures are not redistributed as datasets.

Specialist review is still required for all source labels, near-overlap holds, mesenteric root/leaf extent, attachments, bowel relationships, vessel endpoints, calibre, branching and variants. The three supplied membranes do not establish a complete peritoneum, omentum, complete mesentery, fascial plane or safe dissection route. Mesenteric nerves/plexuses, lymphatic networks, many vessel branches and bowel-wall layers remain absent. Earlier appendix coverage notes describe what is not reconstructed within that individual source entry; the mesoappendix is now separately selectable, not incorporated into or reconstructed from the appendix mesh.

No CT/MRI/US images, enhancement, flow, probe model, patient registration or clinical approvals are introduced. Source-coordinate selection hooks include the new identities but are not a working imaging adapter. Hands-on educator/device acceptance remains outstanding.

## Next actionable work

Continue source inventory selection for missing regional connective anatomy and compatible vascular/organ detail, without reopening a hold absent new evidence. Then address study navigation: source-linked related-structure navigation and keyboard focus/selection feedback across dense regional views. Actual imaging integration still requires the user's adapter, rights-cleared de-identified studies and modality-specific clinical validation. The main website is not integrated by this milestone.
