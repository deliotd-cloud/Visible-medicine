# In-place head focus command — source foundation

This revision adds an optional same-origin, revision/session-bound semantic focus
command to the existing model selection channel. It is not yet wired into the
website guided-tour host, and does not claim completed smooth linked tours.

After the selection handshake, `vm-head-semantic-focus` version 1 accepts only
the exact revision, current session, increasing safe command integer and one
strict root or nested target. Targets carry anatomical IDs and source hashes,
never URLs, scan data, coordinates, access decisions or approval claims.
Nested targets additionally bind parent ID/source and current named study.
The named studies supported here are brainstem, ventricles and cerebral regions.

The active root or sole active nested owner must accept the command. Root targets
must belong to the current head/neck scope, match the current bundle and laterality,
be visible, enabled and loaded. Nested targets must match canonical parent/child
sources and the currently open study, and be visible, loaded and selectable.
Practice, local guided playback, loading/failure and ambiguous/unmounted owners
refuse focus. Cross-owner changes and hidden targets do not silently reset a view.
Refused commands are consumed, so they cannot replay after a gate changes.

Acceptance means the ordinary selection handler ran, not that geometry rendered
or a camera settled. The host must wait for the subsequent exact selection snapshot
before presenting a step as focused. It must offer an explicit standard-link
fallback for refused, unavailable or incompatible targets. Different studies may
still require opening a new view; neither this command nor its tests register CT/MRI.

The handlers do not reload the iframe or request camera/reset changes. The existing
renderer controls any selection presentation. Smooth camera and real loaded-model
acceptance still require browser checks after host integration. No new model,
dependency, licence, teaching, scan/mask or clinical approval is introduced.

Checks: `node scripts/test-head-focus-command.mjs`,
`node scripts/test-head-selection-channel.mjs`,
`node scripts/test-head-focus-routing.mjs`, and nonincremental TypeScript.
