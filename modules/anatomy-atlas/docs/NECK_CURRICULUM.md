# Neck and shoulder-girdle muscle teaching

## Scope and source boundaries

Seven definitions add 28 Anatomy/Function drafts to 14 existing left/right entries. Existing panels, identifiers and registered surfaces are unchanged. There are no new controls, assets, dependencies, scans, motion simulations or clinical approvals.

| Definition | Left / right FMA | Left / right source file |
| --- | --- | --- |
| Subclavius | 13411 / 13412 | FJ1460M / FJ1460 |
| Cervical rotator | 81753 / 81752 | FJ1524M / FJ1524 |
| Platysma | 45740 / 45739 | FJ1558 / FJ1587 |
| Scalenus anterior | 13393 / 13392 | FJ1570 / FJ1592 |
| Scalenus medius | 13391 / 13390 | FJ1571 / FJ1593 |
| Scalenus posterior | 13389 / 13388 | FJ1572 / FJ1594 |
| Sternocleidomastoid | 13409 / 13408 | FJ1573 / FJ1595 |

The official BodyParts3D v4 IS-A index agrees with these catalogue names and component memberships. The M suffix is preserved, not used to infer a new mirror operation. The cervical-rotator source is a regional representation with a legacy `spine` ID; its teaching is explicitly family-level, not an assignment of individual slips, levels or thoracic rotation actions. A single sternocleidomastoid file does not independently identify two heads. Subclavius remains accessible through the current head/neck membership, but is described as a shoulder-girdle muscle.

At this milestone Anatomy has 465 draft / 557 identity-only body entries; Function has 520 draft / 146 identity-only / 356 pending. None of the current head/neck-route muscle Function branches remains pending. **That is a routing/readiness count, not complete neck anatomy or teaching:** posterior/suboccipital muscles also exist in the separate spine route with pending content; the two rotator overviews are partial group teaching. Most specialist topics remain unauthored. No source hold is lifted.

## Factual references and rights

Checked 8 September 2026 local; each definition carries its references:

- [Subclavius](https://www.kenhub.com/en/library/anatomy/subclavius-muscle) supports the shoulder-girdle notes.
- [Rotatores](https://www.kenhub.com/en/library/anatomy/rotatores-muscles) distinguishes the variable cervical group from better-described thoracic slips. Thoracic attachment levels are not imported into cervical notes.
- [Platysma](https://www.ncbi.nlm.nih.gov/books/NBK545294/) and [neck overview](https://www.ncbi.nlm.nih.gov/books/NBK542313/) support the facial-expression and motor-supply distinction.
- [Scalenus](https://www.ncbi.nlm.nih.gov/books/NBK519058/) and [scalene overview](https://www.kenhub.com/en/library/anatomy/scalene-muscles) support rib, attachment and nerve descriptions. Variation in vertebral levels and segmental supply remains explicit.
- [Sternocleidomastoid](https://www.ncbi.nlm.nih.gov/books/NBK532881/) supports the posture-dependent action and motor/proprioceptive distinction. Unrelated clinical claims and the page's inconsistent anterior-triangle boundary wording are not reproduced.

These are short original factual notes, not copied reference prose, tables or figures. StatPearls NC-ND terms and Kenhub publication rights are not treated as commercial asset licences. No diagrams, textures, fonts, meshes, packages or paid APIs are imported. Original text/code retain the existing MIT terms; DBCLS BodyParts3D index-derived evidence retains CC BY 4.0 attribution and change notices separately. See [notices](../LICENSES/THIRD_PARTY_NOTICES.md).

## Verification and next work

`npm run neck-curriculum:test` checks routing/export, an independent identity/side/component map, specific functional safeguards, citations, detached arrays, source warnings, negative mutations and preservation of unrelated teaching/recipes. With the existing official local cache, `-- --source` adds 14 index checks without downloading assets. Ten exact before/after transitions now pin 540 topic changes to the original baseline; runtime/export always use current lessons. Earlier reports preserve explicitly historical readiness totals.

Independent review must adjudicate actual attachments, cervical slips, SCM heads, nerve supply and variants; review functional terminology without equating explode translations with contraction. No surface establishes breathing dynamics, a safe needle route, thoracic-outlet diagnosis or clinical acceptance. Automated checks are not browser/GPU/mobile or specialist testing.

Next author the spine-route suboccipital/prevertebral muscles and remaining trunk groups, preserving their source scope. Then extend blood supply, Clinical/Pathology and modality teaching in staged, source-cited batches with specialist acceptance. Actual scan integration still needs user-supplied imaging and registration evidence.
