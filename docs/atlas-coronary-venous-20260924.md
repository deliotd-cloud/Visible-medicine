# Coronary venous source integration — private website candidate

The generated shared regional and whole-body viewer now binds committed Atlas
source `201f8c9d075c1eda29e1dd93e94b458a44563d62`. The Heart action offers
the coronary venous nested study alongside the existing four-cavity study. Its
two selections are coronary sinus FMA4706/FJ2655 and small cardiac vein
FMA4714/FJ2724+FJ2731. The latter files remain one source-labelled selection.
The heart aggregate is excluded from this nested scene; its root selection and
the pre-existing chamber study remain. This is original source geometry for a
teaching draft, with no demonstrated joined lumen, ostium, flow, patient
registration, clinical accuracy or radiologist approval. The private native MRI
checker was not exported.

`npm run coronary-venous:test` passed in the Atlas source checkout. The
documented `npx vite build --config integration/head-neck/vite.config.mjs` and
`node scripts/export-head-neck-module.mjs <candidate head-neck>` passed after
the explicit regional delivery gate was reviewed and committed in Atlas.
`node scripts/prepare-regional-upgrade.mjs <website> <candidate head-neck>
<offline output>` verified complete original manifests, companion hashes,
regional identities and existing geometry before the website module changed.
It retained 12 scopes, all 135 original models and 142 protected paths, then
identified one 40,996-byte GLB to add. The proposed inventory has 136 models
and 143 paths, with no original geometry replaced. The v117 module is retained
at `C:\Users\delio\AppData\Local\Temp\vm-coronary-b57b1ad9ff3f47d5aefa80354a54ccec\v117-head-neck`;
the offline readiness report and exact upload bytes are in the sibling
`offline-plan` directory. These temporary files are recovery evidence for
this local integration, not remote or durable backup.

Exact SHA-256 values: candidate manifest
`a39c8b154e77da5170a7669d9c68532a65ffea2b3b242962a7775a38fbead784`;
proposed inventory
`7b45168985215b85cc91dc6c3899bd26ef5911c46c801e51422a3bf5c7e7536a`;
new coronary venous GLB
`4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12`.
The administrator-review policy's manifest revision equals the new inventory
hash. Case, Atlas and paid-lecture access remain independent; the focused
website test checks that the new path is registered, rejects stale hashes and
denies non-administrator draft access.

Website `npm test` passed 177/177 tests, including the new focused integration
and existing access tests. `node scripts/atlas-model-inventory.mjs --check`,
`npx tsc --noEmit`, `npm run lint`, `npm run build` and `git diff --check`
passed. An initial TypeScript check identified an inference error in the
existing central-airway test; explicit local type annotations resolved it
without changing that test's assertions. This is source-only integration.
Authenticated storage upload/full-byte verification, protected delivery
activation, owner-private publication and actual website browser/device review
are separate pending steps. All six first-release gates and revision-bound
radiologist sign-off remain pending; the full Atlas goal stays active.
