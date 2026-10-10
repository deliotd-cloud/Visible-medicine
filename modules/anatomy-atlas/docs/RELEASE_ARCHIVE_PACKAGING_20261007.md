# Authoring archive and release packaging — 7 October 2026

The default packaging guard no longer requires, opens or verifies the original
abdominal-wall source ZIP. A sanitized source checkout can package without that
archive. This is one dependency fix, not proof of complete sanitized build closure.

The expected SHA-256, byte count, source/download identity and generated policy
record are pinned to the previously verified original. Packaging still refuses
unexpected generated archive bytes, aliases/symlinks, invalid arguments and
missing or changed metadata in check mode. It removes only the exact validated
generated ZIP. Existing generated policy metadata stays byte-for-byte compatible.
It does not claim to have verified or preserved an original it never inspected.

## Commands

Run from the Atlas source checkout:

```sh
node --test scripts/test-exclude-source-recovery.mjs
node scripts/verify-source-recovery.mjs
node scripts/exclude-source-recovery.mjs --check
```

`verify-source-recovery.mjs` is an explicit authoring-only integrity check of the
retained original. It is deliberately **not** part of the default build and is
not expected to pass in an archive-free sanitized restore. Keep all originals;
do not delete them to test release packaging. Fixture tests use disposable
directories, not the product's source or generated models.

Use these direct commands, not additional package aliases: `package.json` is an
explicit renderer-fingerprint input. The unnecessary aliases introduced at the
first packaging checkpoint made that fingerprint stale. They were removed,
restoring the exact previously pinned package bytes rather than regenerating
review metadata or silently invalidating all clinical review packets.

The build command remains the existing default sequence; no alternative build
profile or dependency, anatomy mesh, texture, teaching or licence is introduced.
Archive-free packaging fixtures do not prove a complete isolated application
build. Vite/plugin/environment discovery, other dynamic inputs, per-asset rights,
privacy clearance and actual restore/build acceptance remain separate gates.

## Immutable input audit

Historical source-dependent guard classifications and their original assertions
remain pinned to a byte-exact legacy fixture. The current program receives a
separate whole-program hash and exact read-expression/line classification.
Only its generated-output reads are classified; modifications and lookalike
paths remain unresolved. No archive, clinical file or recovery-named source
artifact receives a new path-policy exemption.

The source original remains held outside any release snapshot. Its presence in
the authoring public tree still produces a policy conflict in the conservative
inventory. No raw Atlas upload is authorized by this change. All clinical,
private-host, radiologist-sign-off and cross-modality registration gates remain.

Evidence and exact recovery receipts are under
`E:/VisibleMedicine-LocalStaging/20261007-release-recovery-guard/`.
E recovery is same-machine protection, not an off-device backup or deployment.
