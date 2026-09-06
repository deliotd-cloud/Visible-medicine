# Abdominal-wall source decision

The current 892-entry catalogue is unchanged by this audit. Six specifically named candidates were rechecked against both official BodyParts3D v4 indexes: right/left rectus abdominis (FMA13377/FMA13378), internal oblique (FMA13892/FMA13893) and transversus abdominis (FMA22344/FMA22345). None has an entry in the current v4 indexes. All six resolve to single, separately named OBJ files in the official version-3 archive.

The broad v4 anterior-abdominal-wall definitions FMA20278, FMA14627 and FMA78435 use only FJ1452/FJ1452M, already rendered under the external-oblique identities. An aggregate wall label does not establish a rectus, transversus or internal-oblique segmentation and must not be used to relabel those surfaces.

`content/abdominal-wall-audit.json` records the six legacy file hashes/bounds, current index hashes, broad-wall alias membership and three diagnostic source-frame controls. Version-3 versus current version-4 bounding-centre deltas differ:

| Control | X / Y / Z delta, mm (approximately) |
| --- | --- |
| Right hip bone | −6.49 / +12.93 / −7.78 |
| Third lumbar vertebra | +0.45 / +2.81 / −9.36 |
| Right femur | −2.04 / −2.65 / −21.84 |

These are bounding-centre comparisons, **not corresponding anatomical landmarks**. They do not fit a transform, prove that rigid registration is impossible or validate any attachment. They reinforce why a guessed global offset is not an acceptable admission method. No v3 mesh was added to the atlas, moved, mirrored or deformed by this audit. Evidence can be regenerated with `node scripts/audit-abdominal-wall.mjs`; it reads the official legacy archive and writes diagnostic metadata only.

The [official source README](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html) distinguishes atomic geometry from compound definitions and records the v3/v4 releases. The [current archive licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) was rechecked; existing admitted v4 geometry retains its attribution and modification notices. The legacy candidates are evidence-only inputs, not admitted commercially cleared delivery assets. Reconfirm the applicable asset/version grant and downstream obligations before any future redistribution of their actual meshes.

To admit these candidates: establish rights for the exact assets, define homologous bony/attachment landmarks in both versions, estimate and validate an appropriate local registration without inventing missing layers, examine interfaces against current pelvis/ribs/linea alba/adjacent muscles, retain uncertainty and source hashes, and obtain independent anatomical review. Do not claim a complete rectus sheath, internal aponeuroses, inguinal canal or surgical dissection plane merely by adding muscle surfaces.

This is a specific source/registration gap, not a blocker for other safe improvements. Continue with the remaining v4 candidate inventory, study relationships, accessibility and presentation; actual imaging linkage still requires the user's function, appropriately handled studies and validated model/patient registration.
