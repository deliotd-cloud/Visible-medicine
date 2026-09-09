# Knee imaging comparison guides

In **Knee & leg → Explore**, select a femur, tibia or patella and open **Imaging → CT/MRI**. The patella also has an **Ultrasound** guide. Search accepts the existing bone names and “kneecap”. Whole-body selection uses the same content. The femur remains one complete bone selection: its new guides explicitly concern the distal end at the knee, not the hip.

Seven original topics / fourteen sided sections replace pending copy for six existing representations. CT now has 17 draft / 1,005 pending body entries; MRI 19 / 1,003; ultrasound 15 / 1,007. Those are teaching-readiness counts, not clinical approvals or numbers of scanned structures. No additional tabs, toolbar, route, image viewer, dependency or paid service is introduced.

| Bone | Right FMA / source | Left FMA / source | New topics |
|---|---|---|---|
| Femur | FMA24474 / FJ3365 | FMA24475 / FJ3259 | Distal-femur CT and MRI |
| Tibia | FMA24477 / FJ3387 | FMA24478 / FJ3282 | Proximal-tibia CT and MRI |
| Patella | FMA24486 / FJ3381 | FMA24487 / FJ3275 | CT/radiograph context, MRI, ultrasound landmarks |

## Teaching and sources

Checked 9 September 2026. The teaching is original short prose based on factual points in the primary references below. No scans, figures, tables, protocol sheets, article prose or external question banks are copied into the product. Linking to a reference does not imply endorsement or a licence to redistribute it.

- [AAOS: distal femur fractures](https://www.orthoinfo.org/diseases--conditions/distal-femur-thighbone-fractures-of-the-knee/): knee-end anatomy and CT assessment of joint extension and fragments.
- [AAOS: proximal tibia fractures](https://www.orthoinfo.org/diseases--conditions/fractures-of-the-proximal-tibia-shinbone/): plateau injury, CT detail and selective MRI for occult or associated soft-tissue injuries.
- [AAOS: patellar fractures](https://www.orthoinfo.org/diseases--conditions/patellar-kneecap-fractures/): patellofemoral anatomy and posterior cartilage.
- [AO Surgery Reference: patellar assessment](https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/patella/further-reading/patient-examination): radiographic context, CT not routinely obtained, complexity of articular injury and clarification of extensor-apparatus injuries with MRI/US when indicated.
- [ACR/RSNA RadiologyInfo: knee MRI](https://www.radiologyinfo.org/en/info/kneemr): acquired bone and soft-tissue imaging. No universal sequence prescription is asserted.
- [ACR/RSNA RadiologyInfo: CT](https://www.radiologyinfo.org/en/info/bodyct): acquired cross-sectional, multiplanar and 3D data; not a new knee scanning protocol.
- [ESSR knee ultrasound guide](https://essr.org/content-essr/uploads/2016/10/knee.pdf), printed pages 1–3: neighbouring tendons, off-midline coverage and restricted patellar articular access. This is a historical technical reference, not a current local protocol or competency credential.

## Source binding and verification

`lib/knee-imaging.ts` requires the exact FMA, atlas ID, name, side, system, category, source tree, region memberships, bundle, node, complete filename and source SHA. A changed or incomplete binding receives no specialised lesson. Return values have detached arrays. No source geometry or source admission changes.

`npm run knee-imaging:test` checks the six official IS-A element rows, fourteen runtime/exported sections, 276 rejected binding mutations, correct side/region availability, unchanged other lessons and study recipes, and rejection of an unrecorded lesson change. The before snapshot is taken from source e4c83c099239b1e41126ad19f90012a8207262f6. Exact fourteen-section history is reconstructed only by offline tests; runtime and exports always use current teaching. The original baseline is not repinned. The Achilles test explicitly retains its earlier comparison scope; the content contract verifies the complete transition chain.

## Outstanding validation

All new sections remain drafts pending independent anatomical, radiological and educator review. Clinical selection, protocol choice and reporting remain with the responsible clinical team. The model has no separate knee cartilage, menisci, cruciate ligaments, extensor tendons, marrow or bursae. Missing surfaces must not be interpreted as absent anatomy, and an intact source mesh must not be interpreted as a normal patient examination.

No acquired image pixels, patient measurements, CT attenuation, MR signal, ultrasound beam, fracture simulation, patellar tracking, tissue mechanics or 3D-to-scan registration is added. Explode/cutaway remain viewing tools. X-ray material is contextual text, not a new X-ray atlas. No external resource or paid lecture is enabled; all existing review/privacy/entitlement gates remain. Desktop/mobile/browser acceptance is still open.
