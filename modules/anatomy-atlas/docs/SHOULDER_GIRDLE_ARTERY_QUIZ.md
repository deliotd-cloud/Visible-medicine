# Shoulder-girdle arterial question coverage

Four original formative question groups are prepared for the eight existing
right/left selections: thyrocervical trunk, costocervical trunk, dorsal scapular
artery and suprascapular artery. Each has an exact source identity and one
question shared across sides. The questions describe usual anatomy and known
variation, not anatomy established by a visible mesh. There is no geometry,
scan, mask, entitlement or review-status change in this source batch.

## Factual references and provenance

- [Texas Tech University Health Sciences Center, arteries of the upper limb](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html): typical first-part subclavian origin of the thyrocervical trunk and supraspinatus/infraspinatus territory of the suprascapular artery. The two questions and explanations attributed to this page total **76 original words** including choices.
- [Alabduladhem and Lasrado, StatPearls/NCBI Bookshelf, costocervical trunk arteries](https://www.ncbi.nlm.nih.gov/books/NBK556020/): usual deep cervical and superior intercostal branches and described variation. The attributed question and explanation total **43 original words** including choices.
- [Dorsal scapular artery anatomical dissection and radiologic study, PubMed PMID 26920558](https://pubmed.ncbi.nlm.nih.gov/26920558/): a direct subclavian origin or a transverse-cervical route is documented. The attributed question and explanation total **49 original words** including choices.

References inspected 10 October 2026. Counts use the focused test's whitespace
tokenization of question, choices and explanation; they are conservative counts
of source-attributed original wording, not copied text. No prose, figures,
tables, exam items or imagery were imported from the references. Citations
support facts, not redistribution rights for those publications or images.
Origin frequencies differ by study and are deliberately absent from the answer
key. Existing model licences and attribution remain in force.

## Source and verification contract

Immutable parent: `fa74cf70009f5ad8e21087ab12e4589547ebf741`.
The pin record retains complete displayed source identities, prior
identification-only lessons, coordinate system and bundle byte lengths/SHA-256.
Its SHA-256 over canonical JSON is
`4fb745d06a9ee8ec2d920c7472672f5c160439507fcf6fbf6fa82d975f2bdca9`.
The helper accepts only its own exact empty bootstrap stub for initial write;
later verification uses `--check`.

Run `node scripts/pin-shoulder-girdle-artery-quiz.mjs --check` and
`node scripts/test-shoulder-girdle-artery-quiz.mjs --source-only` before shared
dispatcher integration. The source-only test checks eight target placements,
9,928 untouched placements, 96 altered-source refusals, exact bundles, four
balanced answer positions and four correct/wrong/reset component cycles. It does not
claim a learner dispatch. After the coordinator wires the dispatcher and
refreshes review/display evidence, run the test without `--source-only`; that
mode requires exactly those eight Quiz lessons and rejects stale or tampered
Review packets. The coordinator owns shared metadata writers and website
integration. A current Review packet is not radiologist sign-off. Clinical,
browser/GPU, deployment and off-device backup acceptance remain separate.
