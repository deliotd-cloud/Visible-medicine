# Cardiac chamber–vessel comparisons

Open **Heart → Explore heart chambers → Study view**. Four additional choices expose relevant great-vessel landmarks beside one chamber cavity, using the existing panel and camera controls. No new toolbar, route or whole-heart overlay is added.

| Study view | Selected cavity | Orientation context | Initial camera |
| --- | --- | --- | --- |
| Right atrium & superior vena cava | FMA11359 | SVC FMA4720 | Right |
| Right ventricle & pulmonary arteries | FMA9291 | Right/left FMA50872/FMA50873 | Anterior |
| Left atrium & pulmonary veins | FMA9465 | Right/left superior FMA49914/FMA49916; right/left inferior FMA49911/FMA49913 | Posterior |
| Left ventricle & ascending aorta | FMA9466 | Ascending aorta FMA3736 | Left |

These are **source-surface comparisons, not validated physical junctions or a flow simulation**. The pulmonary trunk is not separately delineated; no valves or ostia are added. The long abdominal IVC representation is intentionally omitted rather than cropped/repositioned to imply an atrial connection. Compound vein surfaces remain compounds; do not infer variant drainage or four separately measured ostia.

## Compact interaction

A guide selects one cavity, shows only its relevant vessel group, frames the preset view and resets separation/cutaway. **Show vessel landmarks** toggles those surfaces without losing the chosen guide. A small colour key names every shown vessel; colours distinguish landmarks, not CT/MRI signal. Context cannot intercept chamber selection and does not become a new nested anatomy target.

Lift, spatial spread and flat-plate separation hide the context; returning to 0% restores it. The prior cutaway keeps its stable cavity-defined frame. **Reassemble**, another chamber selection, manual layer changes or Undo leave the guided vessel context; ordinary atrial-wall context remains available through the original control. Existing loading/failure/Retry and Frame selected guards account for the optional vessel bundle.

## Source evidence

Eight existing root structures reuse one existing `thorax-vessels-recovery` bundle, with no extra default download or new GLB. The eleven original ISA files are FJ3645, FJ3019, FJ2924, FJ3020, FJ2925, FJ2933, FJ3040, FJ2944, FJ2950, FJ2955 and FJ3413. Their 9,720 triangles are unchanged. Each file has one connected component and zero reported duplicate/degenerate/collapsed faces, boundary/nonmanifold edges or inconsistent winding. Several labelled vein groups contain multiple source files: individually closed surfaces do not establish a continuous lumen between them or with an atrium.

`cardiac-context:audit` checks exact current table/source hashes, source holds, parent identity, transform, existing bundle bytes and topology. The pinned result is `public/models/bodyparts3d/cardiac/great-vessel-context.json`; rerunning cannot silently overwrite changed pins. `lib/cardiac-context.ts` resolves only the exact parent and unique context matches. `cardiac-context:test` independently checks original transformed triangle bags/winding/multiplicity, actual GLB bounds, stale-parent rejection, four controlled guide states, context passthrough, cut-frame stability, presets, separation, recovery and failed-bundle retry.

The root catalogue, four cardiac children, 53 nested teaching bindings, 97 existing GLBs and nine shoulder fingerprints are unchanged. New context does not increase unique anatomical coverage, clinical teaching readiness, imaging registration or lecture entitlements.

## References, rights and acceptance

Original short factual guides were checked 10 September 2026 against [University of Minnesota cardiac physiology](https://www.vhlab.umn.edu/atlas/physiology-tutorial/the-human-heart.shtml), [NCI SEER heart structure](https://training.seer.cancer.gov/anatomy/cardiovascular/heart/structure.html) and [NHLBI heart anatomy](https://www.nhlbi.nih.gov/health/heart/anatomy). Their illustrations, animations, chapters and tables are not copied. Commercial source reuse retains the [official BodyParts3D CC BY 4.0 licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) and required DBCLS credit. No new dependency, font, texture, fee or external service.

All guidance remains draft. Specialist review must assess vessel identity/extent, compound mappings, spatial orientation and the clinical meaning of apparent contact/gaps. Automated source agreement is not anatomical approval. GPU/browser/mobile transparency, context clicking, camera presets, label placement, cutaway and 200% text acceptance remain untested this turn. No patient scans or perfusion simulation are provided.
