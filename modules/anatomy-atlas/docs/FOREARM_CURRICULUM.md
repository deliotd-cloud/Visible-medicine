# Forearm muscle teaching drafts

## Scope

Twenty-one explicit lesson definitions serve 42 existing bilateral muscle/head representations, adding **84 Anatomy/Function drafts** in the current notes panel. The 17 whole-muscle definitions and four pronator-teres/flexor-carpi-ulnaris head definitions retain exact FMA identities, side, source component counts and coverage warnings. No automatic name matching, mirrored mesh admission, new control or anatomical surface is introduced.

Anatomy describes typical proximal/distal attachments, not verified footprints on the supplied mesh. Function supplies short actions and motor innervation; named limb nerves are not rendered. Grouped FDS/ECU sources do not become individual tendon slips; shared head attachments do not become complete independently segmented muscles. FDP's divided motor supply, finger-flexor insertion levels, thumb extensor identities and source grouping are explicit. All lessons need independent anatomical/editorial review. Clinical, pathology, imaging and quiz topics are unchanged.

Body totals are 269 draft Anatomy / 753 identity-only and 331 draft Function / 146 identity-only / 545 pending. Forearm's 66 entries have 49 draft Anatomy / 17 identity-only and 49 draft Function / 10 generic disclaimers / 7 pending. These are authoring counts, not clinical completeness.

## References and rights

Facts were checked on 7 September 2026. Per-lesson citations are retained in `lib/forearm-curriculum.ts`; these teaching references do not establish source-mesh fidelity or clinical acceptance:

- [Texas Tech upper-limb anatomy](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html): selected attachment/action cross-checks, especially APL, ECRL, FCR and EPB.
- [ECU](https://www.ncbi.nlm.nih.gov/books/NBK539760/), [ECRB](https://www.ncbi.nlm.nih.gov/books/NBK539719/), [brachioradialis](https://www.ncbi.nlm.nih.gov/books/NBK526110/) and [ED/EDM](https://www.ncbi.nlm.nih.gov/books/NBK534805/).
- [FDS](https://www.ncbi.nlm.nih.gov/books/NBK539723/), [FDP](https://www.ncbi.nlm.nih.gov/books/NBK526046/), [FPL](https://www.ncbi.nlm.nih.gov/books/NBK538490/), [palmaris longus](https://www.ncbi.nlm.nih.gov/books/NBK519516/) and [FCU](https://www.ncbi.nlm.nih.gov/books/NBK526051/).
- [Extensor indicis](https://www.ncbi.nlm.nih.gov/books/NBK545260/), [index extension](https://www.ncbi.nlm.nih.gov/books/NBK538428/) and [posterior interosseous/extensor anatomy](https://www.ncbi.nlm.nih.gov/books/NBK544294/).
- [Pronator teres and supinator](https://www.ncbi.nlm.nih.gov/books/NBK580564/), [radial nerve](https://www.ncbi.nlm.nih.gov/books/NBK526056/) and [forearm compartments](https://www.ncbi.nlm.nih.gov/books/NBK539784/).
- Research abstracts on [APL anatomy](https://pubmed.ncbi.nlm.nih.gov/2032936/) and [extensor tendon variation](https://pubmed.ncbi.nlm.nih.gov/14707639/) support caution about extrapolating a single surface to every person, not a new validated variant map.

Only original brief factual explanations are authored. No third-party chapter, table dataset, image, scan or question bank is copied, traced, translated or redistributed. StatPearls chapters carry CC BY-NC-ND restrictions and are **not** admitted as commercially reusable assets. Texas Tech and research publications retain their own rights. Citations do not license reuse. Original app text/code retain MIT; existing anatomy retains CC BY 4.0/DBCLS attribution. No new dependency or fee-bearing service is introduced. This is a documented reuse boundary, not blanket legal clearance of those external resources.

## Preservation and checks

Before authoring, `content/forearm-curriculum.before.json` captured the exact 42 entries at source `c8cd866894e0254c0a92cd5d0b5f7012ccd25714`. Its canonical JSON SHA-256 is `443f8440d4d8d1be167b8de621fb562f0e8315c7ca43031d2affc2cd1d34d2c6`; the after-transition hash is `ec16ddf412ef25209111e5d57f2036d3d778149c1bc94d4fa9dbaf8b33299dde`.

`forearm-curriculum-transition.mjs` verifies all 84 current hashes before projecting their old sections solely for offline preservation. Stacking the earlier shoulder/arm transition retains the original all-copy/recipe baseline. No runtime or exported draft is rolled back. The prior shoulder/arm suite keeps its actual lesson tests and explicitly labels historical projected readiness counts. Five negative mutation cases reject unrecorded target, unrelated, specialist-topic and earlier-curriculum edits.

`npm run forearm-curriculum:test` passes 9,228 checks; `npm run shoulder-arm-curriculum:test` passes 8,947; `npm run content:test` passes 31,373 across all 1,031 scoped records, 1,033 nodes and 87 GLBs, with 148 explicitly changed topics across both curricula. The actual source geometry, catalogue, manifest, source transforms, shoulder lessons/export, review fingerprints, recipes and lockfile remain unchanged. These are software checks, not verification of medical truth or device presentation.

## Next acceptance and authoring

An anatomist must review identity, laterality, actual attachment extent, grouping and variants. An educator must review learning level and wording before acceptance. Draft content must not inherit shoulder-pilot approvals. Modality/clinical lessons and acquired images require their own evidence and review; no patient registration or missing nerve geometry is implied.

Next inspect admitted hand-muscle identities for the same bounded Anatomy/Function treatment, then extend region by region. Fill clinical relevance/pathology, CT/MRI/ultrasound teaching and questions in separate cited/reviewed batches. Keep pending topics visible and reuse the existing panel/schema. Private remote delivery, actual-device acceptance, held-source adjudication and the user's real imaging adapter remain separate gates.
