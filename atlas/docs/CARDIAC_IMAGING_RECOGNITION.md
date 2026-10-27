# Cardiac cavity imaging recognition draft

This candidate changes four MRI lessons and two right-heart ultrasound lessons only. All six remain draft. The anatomy, CT, clinical, pathology and left-heart ultrasound lessons retain their parent content. The source cavity surfaces are static orientation aids, without acquired cine or ultrasound, valve detail, phase matching, function metrics or spatial registration. No image, figure or patient material was imported.

## Primary-source claim map

| Source | Scoped teaching claim | Draft sections |
| --- | --- | --- |
| Kramer et al., SCMR CMR protocols (2020), pp. 5–7, [protocol PDF](https://jcmr-online.biomedcentral.com/counter/pdf/10.1186/s12968-020-00607-1.pdf) | Four-, two- and three-chamber long-axis orientation; RV inflow and separate outflow; LV short-axis and RV-covering cine stacks. The text is an original concise paraphrase and gives no measurement or diagnostic threshold. | MRI for right atrium, left atrium, right ventricle and left ventricle |
| Mukherjee et al., ASE right-heart assessment (2025), Tables 2–3 and focused-view guidance, [guideline PDF](https://www.asecho.org/wp-content/uploads/2026/08/ASE-Right-Heart-Guidelines-May-2025.pdf) | RA-focused view and area-contour exclusions; RV-focused view, foreshortening, FAC outflow limitation and contextual TAPSE interpretation. | Ultrasound for right atrium and right ventricle |

The existing 2019 ASE comprehensive adult TTE citation remains attached to both ultrasound lessons. The new ASE reference is scoped to the two cited concepts and does not relabel older citations. Exact section bodies, reference IDs and hashes against parent `7181b153132b55a682ddbe6558f5dca181643bf0` are in `content/cardiac-imaging-recognition-pins.json` for review. Radiologist teaching sign-off is pending for this specific revision; a software check cannot grant it.

## Focused verification for coordinator

Run `node scripts/test-cardiac-imaging-recognition.mjs` and `node scripts/test-cardiac-imaging-review.mjs` from this checkout after integration. These compare authored sections and nested review material with the exact parent cardiac file, including unrelated-topic preservation and rejection of stale teaching submissions before storage. Build and release checks remain separate coordinator work.
