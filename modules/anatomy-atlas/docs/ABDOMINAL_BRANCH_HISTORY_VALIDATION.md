# Abdominal branch imaging: historical and live validation

The original pre-batch checksum remains
`51321821be2ecf570797817581b626ed0f9b9448359ded72e9de3802fc136166`.
Do not regenerate the original pins or change that checksum to accommodate later
authorised teaching or clinical holds.

`scripts/abdominal-branch-imaging-epoch.mjs` reconstructs the completed milestone
from Git commit `e8350cc87eb019a35148d5cc85af343ab30b4721`. Its Git-backed local
module graph verifies the immutable pin/transition hashes, exact identities and
48 pending-to-draft transitions. The old checksum and 9,861 other placements are
tested against that recorded graph, not today's cumulative teaching content.
Git history and the referenced module paths must be available; this is not a
shallow-export-only test. Installed build dependencies are current, not an archived
reproduction of the old toolchain. CRLF/LF is normalized only when comparing authored
source text; parsed fingerprints, content equality and model bytes remain strict.

The existing validator independently checks the current implementation:

- Exact source version, licence, frame, unique pinned identities and five bundle
  contracts, byte lengths and hashes.
- All 48 source-bound drafts retained in the live getter and content registry,
  with no clinical approval implied.
- Forty-eight renderings of the actual current note callback and real
  `SourceDisplayNotes` component, including bodies, bullets, source notes, citations
  and review-pending/no-study warnings.
- The original 912 altered-source refusals, defensive copies, wrong-topic guards,
  reference budgets and unrecorded-topic rejection through the rolling helper.

The report's `unchangedTopics` and `pendingTopics` describe the historical batch.
For those historically held topics the current branch-specific getter must still
return nothing. Independently authored later batches may provide teaching through
other getters; this test does not overwrite their content or claim it is pending.
The rolling history helper remains unchanged for its other callers.

Run from the Atlas checkout:

```sh
npm run abdominal-branch-imaging:test
```

The validator refreshes `docs/abdominal-branch-imaging-validation.json`. This is
test-only infrastructure, not viewer code, image ingestion, clinical validation,
registration, publication or a new anatomical asset. Other historical validators
and the complete suite have not been declared repaired by this change.
