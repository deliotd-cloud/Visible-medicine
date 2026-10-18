# Large publication correction lineage

17 October 2026. Local repair; no publication, learner migration or approval.

A valid synthetic publication manifest occupied 1,943,096 bytes. Embedding that
string in a JSON metadata snapshot escaped it again and expanded it to 2,005,261
bytes. Cloudflare documents a 2,000,000-byte maximum for a string, BLOB or table
row: https://developers.cloudflare.com/d1/platform/limits/ . The previous query
therefore failed under the local D1-size guard despite a valid source manifest.

The lineage repository now returns the raw manifest separately from its metadata
snapshot. Both are captured for this check, verified against the immutable
source hash and included in the final primary authority/source SELECT. Changes
to the source, version, organization, author access, audit or draft context still
refuse. No source content, publication, assignments, attempts, marks or review
decisions are changed by this lineage read. Normal authentication provisioning
and route rate-limiting remain unchanged and may have their existing side effects.

The original failing reproduction and all existing assertions are retained.
The expanded test additionally bounds individual values, query size, parameter
count and result-row byte content with explicit fixture headroom. It proves a
raw-byte change during the final read refuses even when parsed canonical content
would be equivalent; a later independent consistent check may capture those
bytes anew. A synthetic byte-content guard is not an exact SQLite record-size
model or hosted-D1 proof. Boundary-sized publications and real signed-in hosting
still need their own acceptance checks; no universal size guarantee is inferred.

Evidence: F:/VisibleMedicine/staging/20261017-studio-large-publication . The final
checkpoint records canonical focused checks, type/build/Review/scope verification
and restored/hash-verified source recovery. Other unchanged test-history batches
are not rerun merely to reproduce their saved evidence. The full suite remains
open; checklist36 retains71items/eightideas/statuses/originalacceptance.

Cloudflare platform guidance and latest Workers type signatures were retrieved.
Types5.20261016.1 are cached for reference only, not installed into the project;
no dependency, schema, permission, binding, fee or hosting change is made. Atlas
58926355, imported Review56b9e313, learner modules, models, accepted masks,
private inputs and desktop clinical PACS remain unchanged. No public deployment,
new GitHub backup or clinical/patient-registration approval is claimed.
