# Colic-artery ultrasound teaching

Two original, acquisition-specific **drafts** extend the ultrasound tab for the
exact retained middle-colic (FMA14810) and right-colic (FMA14811) root surfaces.
The baseline is `fa1bf9a233c6989fef42b533bbbac9d6ab034311`. Whole-body and
regional placements use the same exact root identity; specimens and unnamed
parts do not inherit this content.

- Middle colic: illustrative **linear endoscopic ultrasound (EUS)** views,
  not a routine transabdominal detection study. Primary reading:
  [Sharma et al., 2019](https://pubmed.ncbi.nlm.nih.gov/31134898/), figures 13/18.
- Right colic: **intraoperative ultrasound (IOUS)** in a selected surgical
  series, not normal intact-abdomen visibility. Primary reading:
  [Sadakari et al., 2021](https://pubmed.ncbi.nlm.nih.gov/34095976/).
  The separate [cadaveric study](https://pubmed.ncbi.nlm.nih.gov/27502338/)
  supports the caution about variable right-colic origin and presence; it
  supplies no ultrasound visibility evidence.

`draft` means an editorial note is available. It does **not** mean routine
transabdominal visibility has been established. That claim remains unsupported
for both roots. Left colic (FMA14826) remains pending: a flow measurement in
bowel near an anastomosis is not direct depiction of that named artery.

The full source record, source-file hash, root ID, FMA, side, region and bundle
must match. Existing evidence holds precede this resolver. Static donor surfaces
establish neither patency nor flow, patient-specific variants, scan boundaries,
image registration, procedural routes or diagnostic thresholds. Actual clinical
review is still required and old material hashes cannot approve these drafts.
There are no new scans, figures, quotations, models, textures, dependencies,
access grants or fees. Bibliographic links are not image-reuse licences.

Run from the Atlas checkout:

```sh
node --test scripts/test-colic-artery-ultrasound.mjs
```

The seven tests compare all 9,936 topic placements and 1,104 review packets with
the exact baseline; only two ultrasound lessons and their teaching fingerprints
may differ. They also exercise complete source-identity mutations, unchanged
left-colic teaching, actual note rendering, detached arrays and the real
save-time stale-revision gate with no database writes. Production export,
website import, current delivery/source admission and browser acceptance are
separate integration evidence, not implied by this source test.

The normal regional-snapshot, Review display-pin and renderer generators must
run before these tests. They bind the new text; stale pins must reject the new
packet, not be bypassed. Only the two teaching display hashes may change. The
renderer closure additionally identifies the dispatch, two new modules and the
generated abdominal snapshot. Review display pins are regenerated independently;
no existing approval is manufactured.
