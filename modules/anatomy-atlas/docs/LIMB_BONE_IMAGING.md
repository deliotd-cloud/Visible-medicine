# Limb-bone imaging orientation

Select the bone and open the existing **Imaging** group. No additional toolbar or dialog is introduced. This is an original introductory teaching extension, not a radiograph gallery or registered CT/MRI viewer.

| Source concept | Sided selections | New topics | Existing material |
| --- | ---: | --- | --- |
| Radius | 2 | X-ray, CT, MRI | Other topics retained |
| Ulna | 2 | X-ray, CT, MRI | Other topics retained |
| Fibula | 2 | X-ray, CT, MRI | Other topics retained |
| Femur, tibia, patella | 6 | Knee X-ray | Knee CT/MRI and available US retained |

Total: 12 existing selections, six concepts, 12 distinct topic texts, six shared landmark notes and 24 placements (12 X-ray / 6 CT / 6 MRI). Sided repetitions are not independent lessons or new anatomy. Whole source bones stay whole; the knee notes do not provide hip or ankle teaching for the other ends of the femur/tibia. Radius/ulna notes distinguish the elbow from the wrist. Fibular notes distinguish the proximal head from the ankle. No tissue, lesion, acquisition protocol or diagnostic measurement is generated from the surface model.

## Reading references and reuse

Read 12 September 2026. Short original factual synthesis and external reading links only; no quotation, source image, diagram, protocol table or patient data imported. Source authority does not establish approval of our model.

- [TTUHSC El Paso upper-limb bone table](https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html): radius/ulna landmark identities. The notes do not reproduce the table or its attachment catalogue.
- [TTUHSC El Paso lower-limb bone table](https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html): knee/fibular landmarks. Only the listed landmarks are summarised; potentially oversimplified source claims such as absence of fibular weightbearing are not imported.
- [AAOS adult forearm fractures](https://www.orthoinfo.org/diseases--conditions/adult-forearm-fractures/): projected bone relationships and adjacent-joint injury context.
- [AAOS distal radius fractures](https://www.orthoinfo.org/diseases--conditions/distal-radius-fractures-broken-wrist/): selected CT use for bony injury detail.
- [AAOS olecranon fractures](https://www.orthoinfo.org/diseases--conditions/elbow-olecranon-fractures/): proximal ulnar and elbow injury context.
- [AAOS ankle fractures](https://www.orthoinfo.org/diseases--conditions/ankle-fractures-broken-ankle/): malleolar identities and CT/MRI distinction; MRI is not presented as routine fracture imaging.
- [AAOS distal femur fractures](https://www.orthoinfo.org/diseases--conditions/distal-femur-thighbone-fractures-of-the-knee/): radiographic fracture localisation.
- [AAOS proximal tibia fractures](https://www.orthoinfo.org/diseases--conditions/fractures-of-the-proximal-tibia-shinbone/): plateau injury and radiographically occult injury context.
- [AO patellar examination](https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/patella/further-reading/patient-examination): complementary patellar projections and limitations of cursory image review. No positioning recipe or operative instructions imported.
- [ACR/RSNA Body CT](https://www.radiologyinfo.org/en/info/bodyct): acquired cross-sectional and reconstructed data, not a bone-specific examination recommendation.
- [ACR/RSNA musculoskeletal MRI](https://www.radiologyinfo.org/en/info/muscmr): bone/joint/soft-tissue distinction. These references do not supply detailed sequence teaching.

Existing BodyParts3D model terms remain CC BY 4.0. Public reference pages are not blanket permission to reuse images. No new dependency, font, texture or paid service is required. Future imaging atlases and separately paid lectures require their own rights and entitlement checks.

## Binding, checks and review

`content/limb-bone-imaging-pins.json` stores 12 complete source records, the three source bundles and the prior pending values. The runtime resolver rejects a changed record or unsupported topic; it never matches only a name/FMA identifier. Current source metadata, geometric frame and bundle hashes are checked independently by the pin/validation scripts. These are reference-model identities, not DICOM or patient registration.

`npm run limb-bone-imaging:test` checks source-tree rows, model hashes, exact binding mutations, detached lesson values, current exports/schema, the actual notes callback and preservation of all prior teaching/recipes. The append-only authoring transition allows historical curriculum checks to reconstruct preceding content only after validating the current recorded lesson hashes; it does not migrate private approvals. The dependency-derived display revision changes conservatively and requires re-review.

Remaining acceptance: the owner radiologist must review wording, projection/landmark interpretation and actual landmark visibility. Device/GPU/accessibility checks have not been performed in this background pass. Model limitations, incomplete associated soft tissues, detailed sequence teaching, actual licensable scans, scan correspondence and per-resource access remain open. Draft coverage is not clinical sign-off or complete anatomy. Publishing status is recorded separately in release checkpoints.
