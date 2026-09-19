# Private review-host refresh — 19 September 2026

The standalone review host was last published from `b4d84f2a` (12 September),
while the main website's regional viewer uses `e6ce513f`. Do not transfer
approvals between these deployments or between independent source catalogues.

The full build found stale dedicated-shoulder review fingerprints after the
keyboard preview correction. Regeneration updates the nine shoulder geometry
fingerprints, the transitive body renderer fingerprint and the unsigned
11-selection review pilot. Geometry/source bytes and teaching are unchanged.
The new renderer fingerprint is
`6ed7d54d41092a581baf43f34cf9d010c366530f8639eb163f7305e43132e2b5`.

Existing shoulder/root review tables and their migrations are unchanged.
Migrations 0002 and 0003 only create separate specimen and nested review-event
tables. Keep the same Site and logical DB binding; do not copy records, replace
the database, or create synthetic decisions in production. Existing decisions
remain historical and must satisfy exact current revisions to count as current.

Review software checks cover identity isolation, immutable history, optimistic
concurrency, stale-revision rejection and server-side approval prerequisites.
These are not radiologist approval or evidence of successful hosting. Publication
and read-only hosted verification are recorded in the coordination checkpoint.

The main website remains on its previous renderer fingerprint until separately
integrated. Before directing the radiologist to sign off a website release,
verify the exact source, renderer and teaching mappings against this refreshed
review packet. All eleven acquired-imaging reviews remain blocked; all six
first-release gates remain pending.
