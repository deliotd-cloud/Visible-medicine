# Lossless website model delivery

The four contained website modules retain their canonical, source-bound exports
in `public/atlas-runtime`. After the website build, the Atlas-owned delivery
script transforms only `dist/client/atlas-runtime`. No public source mesh, scan,
mask, catalogue, licence, teaching text or viewer JavaScript is changed.

From a clean, committed Atlas checkout, after committing and building the website:

```sh
node scripts/prepare-website-model-delivery.mjs /absolute/website-checkout
node scripts/prepare-website-model-delivery.mjs /absolute/website-checkout --check
```

Use the actual absolute Windows path when appropriate. Both repositories are
required for this optional packaging optimization; an ordinary website build
still works with the unchanged canonical GLBs. Rebuilding the website resets the
optimization, so repeat these commands after the last build and before packaging.
Never copy the compressed output back into `public` or manually edit an export.

The script admits only the registered Visible Medicine website, four known module
directories and exact exported file inventories. It rejects dirty sources,
changed non-model outputs, symlinks, unexpected paths, different decoder versions
and any model that does not match the Atlas original. All modules are validated
before any build file is written. A interrupted preparation requires a fresh
website build; the original repository exports remain untouched.

Every accessor is compressed using the existing MIT meshoptimizer encoder and
decoded with the exact installed `three-stdlib` decoder used by the modules'
`@react-three/drei` loader. Every byte must round-trip. Both original and compressed
models are parsed with that loader and their actual scene snapshots compared:
names, hierarchy, transforms, attributes, indices, groups and material properties.
No quantization, mesh reduction, normal filtering or triangle/index reordering is
allowed. The four bundled loader versions must match the validator's installed
versions; no new website runtime dependency is introduced.

The delivered `manifest.json` describes actual transport file hashes. Its
`canonical-manifest.json` is the byte-identical original export manifest, while
`transport-manifest.json` binds canonical/transport hashes, proof counts, encoder
source inputs, exact Atlas/website/module commits and loader versions. Catalogue
hashes continue to identify **canonical source bytes**, not compressed payloads.
Non-model files remain byte-identical. Notices already shipped with the modules
include the MIT runtime decoder; existing model attributions are retained.

`--check` recomputes compression and actual loader equivalence and compares every
delivered file and manifest, rather than trusting a previous report. Archive size
and real browser loading must still be measured. This validates data delivery,
not clinical accuracy, patient registration, device acceptance or launch rights.
