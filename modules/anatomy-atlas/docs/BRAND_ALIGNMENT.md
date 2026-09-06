# Visible Medicine brand alignment

## Approved sources retrieved 6 September 2026

- Task **Visible medicine**, `01a02c32-4729-7501-9215-b0dc59355c13`: approved production lockups in `visible-medicine-site/public/brand/approved/`. The previous hand-redrawn mark was rejected. This module copies the approved PNGs byte-for-byte, including the standard “by Elivion” endorsement.
- Task **Visible Medicine – X-ray fracture basics…**, `01a059a3-114a-74d1-99d0-e9db775a1b56`: approved course palette and lockups, confirmed in `work/presentation/build_presentation.mjs` and the delivered course. This is the exact course identity, not a colour sampled from a screenshot.

| Token | Hex | Application |
| --- | --- | --- |
| Midnight | `#041A23` | Header and core controls |
| Deep ink | `#002631` | Text and active navigation |
| Visible teal | `#16C6B2` | Brand edge, focus, navigation accents |
| Signal lime | `#D2DC16` | Selected label only; restrained use |
| Ivory | `#F8F7F2` | Anatomical drawing surface |
| Muted | `#5D7477` | Secondary text |

## Schematics and anatomy conventions

The module carries the established dark/ivory contrast, teal accents, restrained lime highlights and exact lockup into an interactive working surface. Bone, muscle, nerve and vessel colours remain anatomical encodings; these must not be replaced wholesale by the brand palette. Red/blue vessels denote artery/vein, not oxygenation.

Shoulder plates are parallel-projection renderings of the same registered BodyParts3D geometry used by the rotatable model. Four presets cover anterior cuff, posterior cuff, lateral surface and deep skeletal views. Selection and labels use the same anatomical IDs and surface anchors. The schematic adaptation is authored for this module, not a claim that the other tasks contained an approved 3D anatomy specification. Hatching is visual texture, not measured fascicle direction. No new diagram was traced or imported to fill anatomical gaps.

Use a system UI font stack without distributing font binaries. Do not add “Powered by Didanix”: this module does not currently host a Didanix imaging viewer. Do not distort or redraw the approved logo. No upstream main-website source files were changed.

## Exact copied files

- `public/brand/visible-medicine-lockup-dark.png`: SHA-256 `360265d257a9eb3d8adf9535de686363c5d5cc6e0051bd6e5aa3ef5e664c2e98`.
- `public/brand/visible-medicine-lockup-light.png`: SHA-256 `b99ff216f299d62541cd7ecd73b0ad12cdba7d7e289069d3189a1dd75aa30c42`.

These are user-authorised Visible Medicine brand assets, not public-domain/OSS assets. They are excluded from the application's MIT licence. Preserve the brand owner's permissions when distributing or reusing the project; the project does not grant third parties a trademark or logo licence.
