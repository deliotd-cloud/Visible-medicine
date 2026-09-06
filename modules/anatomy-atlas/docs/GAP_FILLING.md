# Gap recovery and source adjudication — 6 September 2026

This records the second recovery milestone (823-entry snapshot). For the later 859-entry atlas, exhaustive source inventory and 36 further additions, see [SOURCE_INVENTORY.md](SOURCE_INVENTORY.md). All holds below remain in force.

## Shipped in this pass

62 additional source representations, taking the library from 761 to 823. All are BodyParts3D **4.0 / CC BY 4.0** in the existing shared frame. There are no new dependencies, external fonts, textures, paid APIs or generated anatomical surfaces. The original 53 GLB bundles and all 761 existing identities are unchanged; eight separate `*-gaps.glb` bundles add approximately 2.40 MB. These are draft educational assets, not clinically validated anatomy.

| Addition | Entries | Navigation |
| --- | ---: | --- |
| Whole intervertebral disc surfaces | 22 | Spine; cervical, thoracic and lumbar regional context |
| Palmar/dorsal hand interosseous sets | 4 | Hand; dedicated group views |
| Forearm and leg interosseous membranes | 4 | Forearm/leg; membrane focus |
| Calcaneal (Achilles) tendons | 2 | Leg and foot; tendon/calf context |
| Trochlear nerve source segments | 2 | Head & neck; neural system |
| Tongue, paired lacrimal/submandibular/sublingual glands | 7 | Head & neck; gland window |
| Paired epididymides and urethra | 3 | Adult-male pelvic organ subset |
| Corniculate/cuneiform cartilage and selected orbital/laryngeal/stylohyoid ligaments | 18 | Head & neck; connective system |

The catalogue now comprises 203 skeletal, 363 muscular, 30 neural, 39 organ, 117 vascular and 71 connective entries in 61 bundles (88.63 MB). Counts describe selectable source representations, not distinct complete organs or total human anatomy. The dissection deck has 86 stages and 60 focused views. Groups are explicitly described as groups. Four new families have concise, cited draft function notes; specialist imaging/pathology/clinical tabs remain honestly pending.

## What the broader search established

The official v3 index identified candidate concepts missing from the prior importer. Many could be traced back to the current v4 archive without changing licensing or registration. `scripts/gap-recovery.mjs` records exactly which were admitted. `content/recovery-manifest.json` records both recovery passes (221 entries total); the public catalogue records every source hash and bundle binding.

**Do not mix v3 meshes directly into the current body.** Seven control bones were compared in the common source axes. For example, the v3 right tibia extends from 59.5543 to 406.194 source mm superiorly, whereas the current v4 counterpart extends from approximately -6.0371 to 373.9200 mm. Other bones have different discrepancies, so a universal translation is insufficient. The official v4 release notes explicitly document skeletal alterations and repositioning of existing parts. The older surfaces may be valuable reference inputs for future reconstruction, but require registered attachment landmarks and expert review.

The older archive's explicit licence is **CC BY-SA 2.1 Japan**, permitting commercial use with attribution and share-alike obligations. We did not assume it had been relicensed, import it into the product, or introduce that obligation into this release. Its cache is an offline research input only. Z-Anatomy's mixed upstream attribution still prevents blanket import. No externally found illustration has been copied, traced or presented as proprietary anatomy.

## Held candidates and unresolved gaps

| Candidate / gap | Evidence and decision |
| --- | --- |
| Pubococcygeus, puborectalis, iliococcygeus; levator-ani tendinous arch | Source concepts exist, but the left-side/arch aggregates contain near-coincident alternatives, and right-side surfaces extend substantially across the midline. Hold FMA45854–FMA45859 and FMA46442 pending anatomical adjudication; do not merge all alternatives, reflect or silently relabel them. |
| Optic nerves | FMA50875/FMA50878 each map to overlapping source alternatives. Hold rather than draw both surfaces as a validated single nerve. Trochlear segments were independently admitted. |
| Remaining disc | FJ3211 is associated with a generic disc concept, not an unambiguous named level in the current mapping. Do not silently assign it to T12–L1; 22 named surfaces are included, not a claimed complete set of 23. |
| Rectus abdominis, internal oblique, transversus abdominis, latissimus dorsi, multifidus and dorsal foot interossei | Candidate v3 meshes exist but were not directly mixed into altered v4 proportions. Need shared-landmark registration and reviewed attachment/volume constraints. |
| Plexuses, limb nerves and spinal cord | Neither source audit establishes clean complete models. The central-canal/cord alias persists even in v3. No guessed tubes are added. |
| Joint capsules, labra, bursae, spinal ligaments, fascia; female, lymphatic and detailed organ anatomy | Remain incomplete or absent. Need asset-level rights, actual 3D constraints and independent anatomical review. A single 2D plate cannot establish hidden geometry. |

The four previously quarantined laterality entries remain excluded separately in the catalogue. The held candidates above are research findings, not newly rendered or clinically resolved anatomy.

## Reproduction and review

Run `node scripts/audit-legacy-anatomy.mjs` for the historical identity/coordinate comparison, and `node scripts/audit-gap-candidates.mjs` for current candidate bounds. The latter writes an audit into the external work directory and reports overlap with the current catalogue (admitted entries will match themselves after ingestion). Import through `node scripts/ingest-full-body.mjs`, then run the full-body, recovery and dissection validators. The import fails on unexpected source-component overlaps and preserves existing public IDs. Every added surface uses ZIP CRC/size verification, SHA-256, the shared transform and an explicit unvalidated status.

AI-assisted reconstruction remains a possible next stage, using the constrained authoring/review pipeline in `ANATOMY_RECOVERY.md`. It has **not** been completed in this pass. No automated geometry check establishes clinical accuracy. Clinical review, low-powered mobile/browser interaction testing, specialist teaching content and patient-coordinate registration remain outstanding. No fee-bearing service was used; asset licence freedom does not guarantee indefinitely free hosting, clinical review or bandwidth.

## Evidence ledger

- [Official current data and licence](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html): v4 source/adaptation input, CC BY 4.0; required DBCLS credit retained. Checked 2026-09-06.
- [Official v4 release notes](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/release_4.0_e.html): coordinate-change evidence; factual reference only.
- [Official v3 archive](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/README_e.html): historical identity/coordinate research; no v3 asset distributed.
- [CC BY-SA 2.1 Japan terms](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en) and [legal code](https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode.ja): older source's separate commercial/share-alike conditions.
- [Z-Anatomy upstream notices](https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/License.txt): mixed asset-level restrictions; collection not imported.
- TTUHSC El Paso original anatomy teaching tables: [hand muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html), [back joints](https://anatomy.ttuhscep.edu/anatomytables/joints_back.html), [cranial nerves](https://anatomy.ttuhscep.edu/anatomytables/nerves_head_neck.html), [leg muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html). Copyrighted factual references only: no prose/figures/data tables redistributed. New teaching notes are short original summaries and remain draft.
