# Trunk and back muscle teaching

## Scope

Twenty-three definitions add 76 Anatomy/Function drafts for 38 existing entries in Thorax, Abdomen and Spine & back. Select the existing structure and open its current notes. No new controls, meshes, source registration, dependency, scan or clinical approval is introduced.

| Definition | Existing FMA identities | Components; source tree |
| --- | --- | --- |
| external-intercostal | FMA9756 | FJ1451,FJ1451M; isa |
| internal-intercostal | FMA9757 | FJ1455,FJ1455M; isa |
| innermost-intercostal | FMA9758 | FJ1454,FJ1454M; isa |
| external-oblique | FMA13337, FMA13336 | FJ1452M / FJ1452; isa |
| pectoralis-minor | FMA13376, FMA13375 | FJ1456M / FJ1456; isa |
| pectoralis-major | FMA13374, FMA13373 | FJ1446M,FJ1464M / FJ1446,FJ1464; partof |
| transversus-thoracis | FMA9762, FMA9761 | FJ1461M / FJ1461; isa |
| diaphragm | FMA13295 | FJ3131; isa |
| trapezius-ascending | FMA33583, FMA33581 | FJ1520M / FJ1520; isa |
| trapezius-transverse | FMA33585, FMA33584 | FJ1554M / FJ1554; isa |
| trapezius-descending | FMA33587, FMA33586 | FJ1521M / FJ1521; isa |
| lumbar-rotator | FMA23090, FMA23089 | FJ1522M / FJ1522; isa |
| thoracic-rotator | FMA23083 | FJ1525,FJ1525M; isa |
| iliocostalis-lumborum | FMA22741, FMA22740 | FJ1527M / FJ1527; isa |
| iliocostalis-thoracis | FMA22743, FMA22742 | FJ1528M / FJ1528; isa |
| longissimus-thoracis | FMA22753, FMA22751 | FJ1535M / FJ1535; isa |
| semispinalis-thoracis | FMA22873, FMA22872 | FJ1540M / FJ1540; isa |
| serratus-posterior-inferior | FMA13406, FMA13405 | FJ1541M / FJ1541; isa |
| serratus-posterior-superior | FMA13404, FMA13403 | FJ1542M / FJ1542; isa |
| spinalis | FMA77179 | FJ1543,FJ1543M,FJ1544,FJ1544M; isa |
| lateral-lumbar-intertransversarius | FMA22850 | FJ1547,FJ1547M; isa |
| medial-lumbar-intertransversarius | FMA22851 | FJ1548,FJ1548M; isa |
| interspinalis-thoracis | FMA22891, FMA22890 | FJ1551M / FJ1551; isa |

Ten definitions deliberately use **Source-group overview** wording, including intercostal groups, pectoralis major, regional rotators, spinalis, lumbar intertransversarii and thoracic interspinales. A midline catalogue label may describe a bilateral aggregate; it does not establish a single unpaired muscle. Source names and IDs remain unchanged.

## Source limits that change the teaching

- The pectoralis-major entries use PART-OF membership. Their two components per side are indexed as sternocostal and abdominal parts, not a separately identified clavicular part. Notes therefore do not attribute clavicular-head flexion to the displayed subset.
- Spinalis combines four ISA components. FJ1544/FJ1544M have explicit thoracic identities; FJ1543/FJ1543M are not assigned an independently identified cervical/capitis subtype by that index. A thoracic reference pattern is labelled as such, not transferred to every component.
- Lumbar rotators and thoracic interspinales have variable/sparse segmental descriptions. General family teaching is not proof of every level or slip, nor a measured thoracic/lumbar movement model.
- Internal intercostal portions do not all share the same respiratory action. Posterior serratus respiratory roles remain debated. The model does not settle that debate or simulate breathing.
- Trapezius fibre names describe course, not the direction the scapula must move. Medial/lateral lumbar intertransversarii have different nerve-supply descriptions. Selecting a surface does not validate those nerve paths.

The optional source extension checks 38 memberships against the appropriate official cached ISA/PART-OF index, six exact component-name rows and one unresolved-spinalis-subtype check. It downloads no assets and makes no new geometry admission. No previous source hold is lifted.

## Factual references and rights

Checked 8 September 2026 local. Each definition retains its own citation array:

- [Intercostal muscles](https://www.kenhub.com/en/library/anatomy/intercostal-muscles) and [intercostal spaces](https://www.kenhub.com/en/library/anatomy/intercostal-spaces).
- [External oblique](https://www.kenhub.com/en/library/anatomy/external-abdominal-oblique-muscle), [pectoralis minor](https://www.kenhub.com/en/library/anatomy/pectoralis-minor-muscle), [pectoralis major](https://www.ncbi.nlm.nih.gov/books/NBK525991/) and [medial pectoral nerve](https://www.ncbi.nlm.nih.gov/books/NBK556059/).
- [Transversus thoracis](https://www.kenhub.com/en/library/anatomy/transversus-thoracis-muscle), [diaphragm](https://www.kenhub.com/en/library/anatomy/diaphragm) and [trapezius](https://www.kenhub.com/en/library/anatomy/trapezius-muscle).
- [Rotatores](https://www.kenhub.com/en/library/anatomy/rotatores-muscles), [iliocostalis](https://www.kenhub.com/en/library/anatomy/iliocostalis-muscle), [longissimus](https://www.kenhub.com/en/library/anatomy/longissimus-muscle) and [semispinalis thoracis](https://www.kenhub.com/en/library/anatomy/semispinalis-thoracis-muscle).
- [Posterior serrati](https://www.kenhub.com/en/library/anatomy/serratus-posterior-muscles), [spinalis](https://www.kenhub.com/en/library/anatomy/spinalis-muscle), [lumbar intertransversarii](https://www.kenhub.com/en/library/anatomy/intertransversarii-laterales-lumborum-muscles) and [interspinales](https://www.kenhub.com/en/library/anatomy/interspinales-muscles).

The notes are brief original factual writing, not imported paragraphs, tables, images or datasets. StatPearls NC-ND terms and Kenhub publication rights are not commercial asset licences. No font, texture, new mesh, dependency or paid API is used. Existing MIT application-text/code terms remain separate from DBCLS BodyParts3D v4 CC BY 4.0 attribution/change obligations for source-derived index evidence. See [notices](../LICENSES/THIRD_PARTY_NOTICES.md).

## Verification and remaining curriculum

Run `npm run trunk-curriculum:test`, optionally `-- --source` with the existing cache. It checks independent identity/side/component/tree expectations, exact regional guards, representation limits, specific functional distinctions, detached arrays, citation/warning preservation, current exports and negative mutations. Twelve pinned transitions preserve the original whole-copy/dissection baseline through 672 explicit topic edits. Offline projections never roll back current displayed/exported lessons. Previous reports label their historical counts.

At this milestone the 1,022 body entries have 531 draft / 491 identity-only Anatomy sections, and 586 draft / 146 identity-only / 290 pending Function sections. One muscle Function section remains pending: the unresolved superficial-perineal source category, FMA19728. All other existing muscle Function branches now contain draft teaching, sometimes partial/group-level. **This is not complete muscle anatomy, detailed blood supply, clinical acceptance or a full curriculum.**

The remaining pending Function entries are 200 skeletal, 23 nervous, 43 connective, 23 organ and one muscle representation. Prioritize remaining existing nerve/organ/connective basics and skeletal/joint teaching, then source-cited blood supply, Clinical/Pathology, modality teaching and reviewed questions. Do not turn missing anatomy into invented meshes, diagnostic findings or a guessed imaging registration.

Independent review must adjudicate exact attachment/nerve/variant wording, component identity and intended teaching scope; breathing, pressure, joint mechanics and procedural safety remain unvalidated. Current browser/device acceptance, rights-cleared source gaps and actual imaging interfaces remain separate requirements. Local validation/backup is not remote delivery.
