# Third-party notices

This project is designed for commercial use without per-user licence fees. Third-party software remains under its original licence.

The 36-source inventory extension and four exact official v4 index tables remain under the BodyParts3D CC BY 4.0 grant, including its DBCLS attribution and indication-of-change obligations. The derived source inventory does not convert source data to MIT. See `BODYPARTS3D_FULL_BODY.md` and `../docs/SOURCE_INVENTORY.md`. No paid service or new runtime dependency was introduced.

## Visible Medicine brand assets

The approved Visible Medicine — by Elivion lockups in `public/brand/` are reused with the user's express instruction from their existing Visible Medicine project. They are **excluded from MIT** and are not sublicensed as public-domain or OSS artwork. This repository does not grant anyone else rights to the logo or trademarks. Exact sources/hashes are recorded in `docs/BRAND_ALIGNMENT.md`. No font binary is distributed with them.

The four new shoulder illustration presets render the existing BodyParts3D geometry and retain its attribution and CC BY 4.0 terms. They introduce no separate anatomical asset licence.

## Browser/runtime dependencies

| Component | Version policy | Licence | Use |
|---|---:|---|---|
| React / React DOM | locked in `package-lock.json` | MIT | Interface runtime |
| Three.js | locked in `package-lock.json` | MIT | 3D renderer |
| React Three Fiber | locked in `package-lock.json` | MIT | React renderer for Three.js |
| React Three Drei | locked in `package-lock.json` | MIT | Camera, labels, grid and shadow helpers |
| Base UI / shadcn components | locked in `package-lock.json` | MIT | Accessible interface primitives |
| Lucide React | locked in `package-lock.json` | ISC | Interface icons |
| clsx / tailwind-merge / CVA | locked in `package-lock.json` | MIT | Class composition |

The application embeds a CC BY 4.0 BodyParts3D shoulder mesh subset. It does not embed third-party fonts, textures or imaging studies. Three previously included public-domain plates remain in the repository but are no longer used by the 3D viewer.

## Anatomical meshes

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

Official licence: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27). See `BODYPARTS3D.md`, `CC-BY-4.0.txt` and the mesh manifest for the audited grant, adaptations and source hashes. Preserve the viewer's attribution and linked full credits with commercial distribution. The licence requires attribution but has no non-commercial restriction, share-alike requirement or mandatory licence fee.

The expanded whole-body/regional library is covered by the same grant. See `BODYPARTS3D_FULL_BODY.md` for its two official source archives, 892 selectable entries, modifications and quarantined source discrepancies. The 22 deep-brain entries and 24 source components retain the same CC BY 4.0 attribution; display colours and short original teaching notes do not relicense anatomy or imply clinical approval. The latest eleven connective/deep-spinal entries / fifteen components use the same grant; see `docs/AXIAL_DETAIL.md`. No new runtime packages or bundled fonts/textures were added for the expansion. The targeted-practice update adds no assets or dependencies. The six legacy abdominal-wall candidates are diagnostic evidence only, not redistributed anatomy meshes or approved additions; exact-version rights and registration must be confirmed before admission.

## Anatomical illustrations

- **Shoulder joint (vector):** National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS); SVG version by Wikimedia Commons user Angelito7. The U.S. federal-government original is public domain in the United States, and the SVG derivative was dedicated to the public domain worldwide. Source: <https://commons.wikimedia.org/wiki/File:Shoulder_joint.svg>.
- **Posterior shoulder and upper arm:** Henry Vandyke Carter, from the 20th U.S. edition of *Gray's Anatomy of the Human Body* (1918). Public-domain mechanical scan. Source: <https://commons.wikimedia.org/wiki/File:Arm_shoulder_gray.png>.
- **Anterior superficial shoulder and arm:** Henry Vandyke Carter, *Gray's Anatomy*, plate 410 (1918). Public-domain mechanical scan. Source: <https://commons.wikimedia.org/wiki/File:Arm_muscles_front_superficial.png>.

Attribution is not required for these public-domain images, but this notice and the in-product provenance links are retained as good scholarly practice. Their inclusion does not imply endorsement by NIAMS, the U.S. Government, Wikimedia Commons or any editor.

## Build and framework dependencies

The review workspace adds Drizzle ORM 0.45.2 (Apache-2.0) and Drizzle Kit 0.31.10 (MIT), both development-only for schema definition and migration generation. Their distributed licence files are `node_modules/drizzle-orm/LICENSE` and `node_modules/drizzle-kit/LICENSE`. Runtime queries use the platform D1 binding, not a paid database SDK. The regenerated audit covers all 808 dependency entries, including newly introduced build-tool transitive/optional packages, with no unclassified licence. No new fonts, model assets, medical datasets or textures were added in this milestone. Preserve Apache notices and MIT licence text when redistributing the tooling. These licences do not guarantee perpetual free hosted storage.

Vinext, Vite, Tailwind CSS, Wrangler, the Cloudflare Vite integration and the OpenAI Sites integration are installed development/build dependencies. Their exact versions and declared licence identifiers are recorded in `dependency-license-audit.json`.

The installed dependency graph also contains commercially compatible licences that carry additional obligations:

- `MPL-2.0`: Lightning CSS, resvg-wasm, Satori and related build packages. Modified covered files must remain available under MPL terms.
- `LGPL-3.0-or-later`: optional/prebuilt libvips binaries used through Sharp dependency paths. If redistributing those binaries, retain notices and comply with LGPL relinking/source requirements.
- `CC-BY-4.0`: caniuse-lite browser-compatibility data. Retain attribution when redistributing that database.
- `Python-2.0`: argparse. Retain its licence notice when redistributing.
- `webgl-constants` 1.1.1 omits its licence field from package metadata; its distributed `LICENSE` file is the MIT licence and the audit records that file as the reviewed evidence.

These licences permit commercial use; they are not non-commercial licences and do not impose a mandatory fee. This file is not legal advice. A release owner should review the generated graph and preserve licence texts/notices when distributing build tooling or binaries rather than only deploying the compiled web application.

## Reproducible full audit

Run:

```bash
npm run licenses:audit
```

The command reads every package entry in `package-lock.json` and regenerates `dependency-license-audit.json`. The report fails to classify any newly introduced licence that is not on the reviewed commercial-compatible allowlist. Manual review remains required because package metadata can be incomplete or incorrect.
