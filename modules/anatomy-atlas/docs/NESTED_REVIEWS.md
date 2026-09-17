# Nested structure reviews

The /review/nested worksheet separates each parent, dissection study and child
from whole-body, shoulder and independent-specimen reviews. There are104
admitted child destinations in19 parent/study scopes at this source revision.
The existing collapsed Learn more section links to the selected child's
worksheet; unnamed cranial parts have a geometry-only review link. Return to
dissection opens exact parent and child bundle revisions, not a generic organ.

## What is bound

- Canonical JSON parent/study tuple plus exact child ID, never a displayed name.
- Full parent/child source records, parent bundle and child bundle SHA-256,
  source version and coordinates, retained source limitations and credit.
- Current renderer, available teaching/quiz answers/references, pending states
  and checklist version. Anatomy and teaching have separate revision hashes.
- Changes require re-review. Old notes/evidence/issues may be retained as a
  draft, but stale checklist ticks and every new attestation are reset.

Neither these fingerprints nor a software test constitute clinical approval.
Of104 contexts,69 have the required introductory Anatomy/Function/Clinical/
Pathology drafts present; this is not factual validation or a complete modality
curriculum. Unnamed pieces and pending topics cannot gain teaching approval.
Acquired imaging GET/POST and storage are denied. No study, patient transform,
registration, lecture access or clinical PACS workflow is supplied.

## Private persistence and limits

Nested events use a new append-only table, nested_review_events, and separate
event/scope parsers. Prior tables/migrations and all personal records are left
alone. The account comes only from the trusted Sites dispatcher, not submitted
review JSON. Origin/content-type/body-size guards, bound queries, atomic
expected-version writes and paged indexed history are retained. Responses are
private/no-store. Uncertain saves retain edits and require history reconciliation.
Unsigned worksheets and private review exports are clearly distinguished.

This relies on trusted platform dispatch. Do not expose a raw Worker accepting
forged identity headers. Self-entered qualifications do not establish reviewer
authority; public-site reviewer-role enforcement remains a release requirement.
The new schema-only migration must be applied through the approved hosting flow.
Source tests do not establish that a hosted migration has run. No production or
local personal review database is read by the tests.

Implementation follows the existing scoped review architecture and current
[D1 bound-query documentation](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
and [Workers safeguards](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
No new dependency, font, model, texture, dataset, fee or external service is added.

## Verification

Run node scripts/validate-nested-review.mjs. It checks every current nested
destination, exact return-link resolution, stale bundle rejection, detached
material, GLB hashes/bytes, review prerequisites, account separation, invalid
payloads, explicit imaging denial, optimistic conflicts, old-table sentinels,
append-only issues, paged indexed SQLite history, stale resets and real React
workspace rendering. SQLite fixtures are synthetic/in-memory only.

Browser evidence is saved separately in the main workspace's dated checkpoint;
it is not physical-device, clinical or hosted acceptance. Build, source holds,
existing review and nested navigation/teaching regressions remain required.
