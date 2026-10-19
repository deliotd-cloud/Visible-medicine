# Historical versus current Atlas delivery checks

This REL-01 batch repairs four shared delivery-test fixtures: forearm, neck/liver,
hand X-ray/MRI, and spinal/study/specimen. It changes tests and documentation only.
Atlas source remains `f1dc0ccc54ec82aa774720db3c822d3e0ea9c418`, tree
`d3c165a126e773f004c9a620b5271bc15d0f384a`; website HEAD remains
`b953ff3f5f1891599cb6e91cb91311d9d6006270` with preserved unpublished changes.
The Review binding remains
`bbca7076adc53030a83772c457d2dec50aac6622defb45ce2c5510464f926297`.

## Why repair was needed

The fresh pre-edit run of13 direct entries reported29 cases:15 passed and14
failed. Historical checks passed; current branches still used stale source and
manifest literals. That result is retained in `site-before-1.json` and its log.
It is not a new full-release-suite result or a reduction of the old174-failure
baseline by simple subtraction.

Current helpers now use the exact12-document current-delivery contract and clean
source tree, not arbitrary HEAD or whatever manifest happens to be on disk.
Historical f2f7adbb/88cea, transition, specimen and nonregional source proofs keep
their original hashes and behaviors. The17 exact pre-repair helper/test files
are separately hash-frozen under `tests/fixtures/delivery-before-20261016`.
These snapshots preserve source evidence; they are not claims that the old
stale-current assertions were valid or that a historical release was approved.

## Behavioral coverage, not only new hash literals

Original teaching/source identities, source components, source limits, model
preservation, private-data exclusions and independent access assertions remain.
The current interosseous CT pin has a different emitted shape, so its four exact
identity/group/topic bindings are checked instead of an obsolete minifier pattern.

The four interosseous arteries also have later, separate MRI and ultrasound
drafts. The old generic pending-string assertion is preserved for the historical
export, not misapplied to today's curriculum. The current semantic regression
checks the actual imported CT resolver plus the independent MRI/common-interosseous
US/recurrent-US resolvers, their source-bound dispatch, references, emitted learner
text and altered-identity refusals. It adds no medical content or acquired images.

## Verification and boundaries

Final selected tests, source fingerprints, typecheck, Review/checklist verification,
unchanged production hashes and recovery are recorded at
`F:/VisibleMedicine/staging/20261016-delivery-epoch-repair` and
`F:/VisibleMedicine/recovery/checkpoints/20261016-delivery-epoch-repair/checkpoint.json`.
The focused command names every selected entry; it never changes or filters the
normal complete `npm test` inventory. Source fingerprints before/after identify
that bounded run. No skipped case is counted as validation.

Checklist31 keeps the whole71-item roadmap and eight optional ideas, with all
statuses and acceptance criteria unchanged; only REL-01 evidence advances.
The old3212-case/174-failure/two-skip complete audit remains incomplete, and
current physical desktop, browser/GPU, hosted-D1, clinical, privacy, rights and
release acceptance are separate. Tests do not create approval or authority.

No application, Atlas source, model, accepted mask, private patient input,
clinical decision, entitlement, desktop PACS, dependency, schema or permission is
changed. No rebuild or preview restart is needed solely for these test/doc edits.
Sites local-only workflow is used; nothing is published. Scoped F website source
recovery is not a claim of a new GitHub or off-device website/private-data backup.
