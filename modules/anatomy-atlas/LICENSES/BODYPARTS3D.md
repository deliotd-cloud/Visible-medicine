# BodyParts3D shoulder meshes — commercial-use audit

Reviewed 2026-09-05 against the official JST/NBDC LSDB Archive.

**Credit (retain in every redistributed model or rendered product):**

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

- Official grant: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27).
- Version 4.0 archive: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip
- README/update history: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html
- Terms: https://creativecommons.org/licenses/by/4.0/legalcode.en
- Exact licence text and evidence snapshots are retained alongside this notice.

The current official archive explicitly licenses the database under **CC BY 4.0**, including acquisition, redistribution and creation/distribution of derivatives. Commercial use is permitted, with attribution and indication of changes. No payment, subscription, non-commercial limitation or share-alike provision is imposed by this grant. Do not apply additional restrictions or technological measures that prevent recipients from exercising the licensed rights to these assets. Attribution must travel with exported screenshots/models, not just this repository.

Older BodyParts3D websites and third-party mirrors can display CC BY-SA terms. This subset was acquired from the official archive under its February 2025 updated grant, not from those mirrors or the mixed-licence Z-Anatomy collection. Do not generalise this audit to other assets, models or terminology distributions.

The eleven selected OBJ files, their SHA-256 hashes, FMA cross-references, source-to-scene matrix and derivative hash are in `public/models/bodyparts3d/manifest.json`. Only those source-provided IDs are included, not a full FMA ontology. Three deltoid components share one product selection ID. The biceps long head is correctly bound to a muscle ID; it is not falsely represented as an independently segmented tendon.

Adaptations: subset extraction; common rigid axis/centre transform and uniform scale; vertex welding; smooth normals; GLB encoding; display-only cropping; new material colours, contours and illustrative (unmeasured) hatching. Explode mode is deliberately non-anatomical spatial separation. Source geometry is otherwise unchanged. No textures, fonts, patient scans or commercial anatomy atlas images were imported for this revision.

The visible attribution link opens `public/models/bodyparts3d/credits.html`, containing the full credit, source, licence link and modifications. Preserve that page and link in commercial distributions. Source institution endorsement is not implied. Source accuracy, clinical fitness and identity boundaries still need independent expert review. This audit is evidence-backed engineering due diligence, not a legal opinion.
