# Forearm superficial veins: cross-sectional orientation draft

This milestone adds original CT search prompts for eight exact bilateral source selections: cephalic, basilic, median cubital, and median antebrachial. MRI prompts are added only for the four median cubital and median antebrachial selections. Existing cephalic and basilic MRI drafts stay in place. All new material remains a draft for revision-bound radiologist review.

The teaching follows superficial lateral, medial, and anterior forearm routes across serial images. It distinguishes the median cubital connector from the median antebrachial ascending route and describes their variable confluences. Neither a source mesh nor a single image profile proves the patient's full network, lumen, patency, exact junction, or visibility. CT teaching applies to an already acquired series and does not recommend obtaining a scan. The cited CT venography study tested central venous stenosis and noted possible superficial/deep upper-limb depiction; it did not test visibility of these individual forearm veins or ordinary CT. The MR venography abstract reports assessment of larger veins and small branches; it does not establish visibility of these individual connectors on routine MRI.

Primary sources informing the draft:

- [128-arm cadaveric study of cubital superficial vein patterns](https://pubmed.ncbi.nlm.nih.gov/23131916/) — median cubital absence and variable median antebrachial drainage.
- [Original population study of cubital superficial vein patterns](https://pmc.ncbi.nlm.nih.gov/articles/PMC9256478/) — median antebrachial course and variable confluence.
- [Original study of visible superficial cubital vein variations](https://pmc.ncbi.nlm.nih.gov/articles/PMC4371182/) — alternative lateral-medial connections and absent communicating branches.
- [CT venography study of central venous stenosis](https://pubmed.ncbi.nlm.nih.gov/27757189/) — notes potential upper-limb superficial/deep depiction; the actual tested outcome was central stenosis/occlusion.
- [Upper-limb MR venography acquisition comparison](https://pubmed.ncbi.nlm.nih.gov/22920352/) — sequence-dependent depiction of large veins and small branches, with no claimed median-connector validation.

`content/forearm-venous-cross-sectional-pins.json` records the entire retained source records, coordinate system, two bundle hashes, and parent lessons at `d5c55031e1e032392469288a205bc88d48013eb0`. Run `npm run forearm-venous-cross-sectional:test` for the source-pin and transition checks. The dispatcher is integrated in Atlas source; website learner and protected Clinical Review import is the next separate milestone. No patient images, assets, geometry, approval, or entitlement changes are part of this draft.

## Verification and recovery

The integrated focused suite passes 12 pending-to-draft placements, 9,924 unchanged other placements and 144 altered-identity refusals. Current review packets parse; stale and modified packets are rejected. The prior shoulder/upper-arm quiz suite still checks its actual current target lessons and 32 component interactions; its completed non-target transition is pinned to its own historical epoch, while this new suite protects current non-targets.

Source pins, fresh TypeScript, scene recovery, content contract, body review and decision validators, generated renderer/exports/review display pins, requirement audit/check and the isolated E regional build pass. Displayed root-body draft coverage is now CT 983 and MRI 999 placements; these are not unique lessons, linked image datasets or clinical approvals.

The worker reported pre-integration missing-dispatch and stale-review-pin failures. These are not presented as passes or as retained log files. The first coordinator generation preceded final reference wording; the final generation supersedes it and both generation logs are retained. Final focused evidence is `E:/VisibleMedicine-LocalStaging/20261009-forearm-venous-cross-sectional/focused-result.json`; all completed coordinator checks have separate logs there.

This is source-only draft teaching. No new browser/GPU, patient-image visibility, geometric, clinical or public-release acceptance is implied. The existing website preview and loaded scans remain untouched. The recovery receipt at the same E directory is same-machine scoped source recovery, not verified GitHub or off-device backup.
