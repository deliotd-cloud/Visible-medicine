# Direct modality entry for linked tours

The head/neck linked-tour library now starts each existing sequence directly in
3D, CT or MRI, where a canonical mapping exists. Nine existing sequences have
nine 3D starts, nine MRI starts and seven CT starts. MRI-only sequences do not
offer a misleading CT button. Every launch retains the first concept, step zero
and the existing head-link revision; 3D links retain their exact source tuple.

The library uses compact rows and grouped modality links with distinct accessible
names and visible keyboard focus. Rows wrap on narrow surfaces. It stays a
server-rendered component: no new client state, fetch, bridge or storage.
Unavailable canonical starts render no fallback destination.

The existing sequence order, concept registry, source/review revisions, import
rules, quiz concealment, independent access checks and all clinical approval
gates are unchanged. CT/MRI still require an approved local-folder import;
direct navigation does not load a scan, grant access, register subjects or record
progress. No clinical facts, scans, masks, meshes, dependencies or assets changed.

Verification and local recovery are recorded at
`E:/VisibleMedicine-LocalStaging/20261009-tour-modality-entry/saved-state.json`.
Tests cover actual rendered links, all exact first-step source tuples, image
intent round-trips, missing canonical destinations and MRI-only CT omission,
alongside existing comparison, navigation and picker regressions. Browser and
local runtime results are recorded separately from clinical/image acceptance.
