# Shoulder girdle small-vessel CT and MRI drafts

Sixteen existing, side-specific donor selections receive 32 conditional CT/MRI orientation notes across eight bilateral concepts: thyrocervical and costocervical trunks, dorsal scapular artery, suprascapular vein, thoraco-acromial trunk, and its pectoral, acromial and deltoid branches. No US topic, new geometry, scan, clinical pathway or approval is added.

The pin file binds the complete source record for each FMA and FJ identity, including side, geometry bounds, component hash and source bundle. A different record does not receive this teaching. Distinct adjacent artery and vein selections do not imply a joined branch tree or validated venous drainage. Branch origin and continuity must be checked in real images; the donor is not a patient registration. The Atlas camera is not an acquisition plane. Reassemble separated anatomy before interpreting relationships.

References are reading links only. No diagram, image, mesh or source prose was copied. Primary anatomy tables and original dissection studies inform landmarks and variation; radiology references support modality limitations. These links do not grant imported asset rights or prove an individual small vessel appears on routine CT or MRI.

The linked anatomy tables and radiology pages are copyrighted, not a newly licensed asset dataset. Only original factual orientation prose and outbound reading links are included; no third-party diagram, table, font, texture, mesh or image is ingested. Existing asset notices and dependency licences remain unchanged. The suprascapular vein receives distinct venous visibility caveats: arterial CTA/MRA must not be treated as a complete venous drainage map.

- [TTUHSC upper-limb arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html)
- [TTUHSC thoracic arteries](https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html)
- [TTUHSC axilla and shoulder anatomy](https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_tables.html)
- [TTUHSC posterior neck anatomy](https://anatomy.ttuhscep.edu/nervous_system/postneck_tables.html)
- [Original dorsal scapular variation study](https://pubmed.ncbi.nlm.nih.gov/37179441/)
- [Original posterior cervical arterial variation study](https://pubmed.ncbi.nlm.nih.gov/16187318/)
- [Original external jugular tributary dissection study](https://pubmed.ncbi.nlm.nih.gov/7940081/)
- [ACR/RSNA CT angiography](https://www.radiologyinfo.org/en/info/angioct)
- [ACR/RSNA MR angiography](https://www.radiologyinfo.org/en/info/angiomr)

The first four sources describe typical anatomy; the studies demonstrate variability. The MR angiography reference specifically cautions that small-vessel assessment can be difficult. CT angiography is distinct from routine CT. None of these references certifies donor branch connectivity, vessel calibre, an individual study's visibility, or an imaging protocol.

Radiologist sign-off remains revision-bound to the exact source and teaching text. It must address vessel identity, laterality, origin/termination, continuity, variants and whether this donor illustrates the wording. The separate Didanix Education viewer must establish actual series and orientation. Case, Atlas and paid-lecture access remain independent. No patient identifiers, scans or uncleared derivatives enter this batch.

Run `node scripts/pin-shoulder-girdle-imaging.mjs` at the pinned parent before content dispatch changes; it refuses a different parent, a changed dispatcher, unexpected identities or fewer than 32 pending placements. Then integrate the lesson into CT/MRI dispatch and run `node scripts/test-shoulder-girdle-imaging.mjs`. The test checks all 9,936 prior placements, source mutation refusal, bundle bytes and teaching review fingerprints. Browser rendering, patient registration and clinical acceptance require separate evidence.
