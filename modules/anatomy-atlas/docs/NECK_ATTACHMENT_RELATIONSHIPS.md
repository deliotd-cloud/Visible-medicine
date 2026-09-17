# Neck and upper-back attachment navigation

17 September extension: [left longus colli parts](LONGUS_COLLI_ATTACHMENTS.md)
reuse this panel under their own exact admission contract. There are now 21
supported muscle selections and 12 relationships; the original paired mappings
and pins described below remain unchanged. Current validation counts are in
`neck-attachments-validation.json`, not the historical 13 September totals below.

13 September 2026. The existing collapsed muscle-attachment panel now supports
18 existing selections: bilateral rectus capitis anterior/lateralis/posterior
major/posterior minor, obliquus capitis superior/inferior, longus capitis,
splenius cervicis and levator scapulae. Thirteen existing bones provide their
bony relationships. This is interactive relationship teaching, not new meshes
or verified donor attachment footprints.

## Use and regional scope

Select a supported muscle in **Spine & back**, **Shoulder & arm** (levator
scapulae), or **Whole body**, then expand **Muscle attachment relationships**.
Origin and insertion group the relevant bones into two readable rows. Select a
bone for its existing information, or use **Show** to reveal the muscle and
available attachment bones. Shared midline vertebrae/occiput and explicitly sided
scapulae are handled separately. Both muscle homologues remain in the visibility
plan so the normal side switch continues to work.

The source assigns the capitis/splenius muscles to spine and levator scapulae to
shoulder-arm; this change does not add them to the head-neck regional catalogue.
Out-of-region bones are readable, non-clickable entries. **Open this muscle in
whole body** preserves selection and side without silently importing other
regions into the current dissection. All partners are available there.

In the website, whole-body continuation also updates the outer region selector
and heading. Only bounded study fields pass through the host; the Atlas still
checks source identity/revision and rejects stale or malformed selections. Long
Show labels wrap inside the side panel instead of creating horizontal overflow.

The panel is initially collapsed, closes when selection changes, and is absent
in exam mode. Show resets separation, cutaway and camera, enables bones/muscles,
and uses one reversible dissection action. Undo/Redo restores dissection state,
not camera or system switches. No additional permanent toolbar is introduced.

## Source and clinical boundaries

`content/neck-attachment-pins.json` binds all 31 records and five bundle records
to their unchanged original source. Admission rejects altered identities, sides,
source hashes, region memberships, coordinates, duplicate records, bundles,
licence or source version. No reflection, proximity match or guessed landmark
coordinates are used. Generic typical attachments do not establish exact donor
slip endpoints, entheses, tendon surfaces, biomechanics or scan registration.

Obliquus capitis inferior retains C2 and C1, not the skull. Splenius cervicis uses
the explicit typical T3–T6/C1–C3 description in the cervical MR/anatomy reference,
not a combined splenius table's broader capitis/cervicis range. Splenius capitis,
unresolved grouped spinal endpoints and coccygeus without a distinct coccyx
selection remain outside this increment. All relationships need revision-bound
radiologist review, including donor identity, laterality and gross spatial fit.
No source scans, masks, clinical acceptance or patient-space mappings changed.

## References and rights

Original concise factual labels, not copied tables, diagrams or article prose:

- [UAMS head/neck anatomy](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-head-and-neck/): anterior capitis, longus capitis and levator scapulae.
- [TTUHSC back anatomy](https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html): posterior recti and oblique capitis muscles.
- [Cervical muscle MR/anatomical cross-reference](https://link.springer.com/article/10.1186/s12891-018-2074-y): splenius cervicis.
- [Craniovertebral junction anatomical study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5111321/): rectus capitis lateralis and its occipital jugular-process attachment.

Consulted 13 September 2026. No media, dataset, font, dependency or paid service
was added. Original code/text retain MIT terms; existing BodyParts3D CC BY 4.0
attribution and change notices remain required. Reference access is not a licence
to redistribute other publisher assets.

## Verification

Run `node scripts/pin-neck-attachments.mjs --check` and
`node scripts/validate-neck-attachments.mjs`. The latter covers 72 exact sided/
regional plans, 28 whole-body continuation links, 223 changed-source rejections,
36 actual panel renders, 96 actual bone-button callbacks and 36 parent-handler
executions including exam denial. Independent expected FMA sets distinguish C1,
C2, other levels and paired scapulae; Undo/Redo and catalogue immutability are
tested. Existing arm and thigh attachment suites also remain intact.
Eighteen actual integration-link renders preserve identity/side and navigate the
whole website to Whole body, rather than leaving a stale outer regional heading.

These are CPU/SSR/callback checks, not browser/device or clinical acceptance.
Actual browser sampling and publication/backup results are recorded separately
in the coordinating checkpoint, never inferred from a generated report.

The previously failing `validate-atlas-navigation.mjs` now bundles its unchanged
production helpers through the existing hermetic test builder. This fixes Node's
extensionless transitive TypeScript import failure without changing production
imports or weakening navigation assertions. Its existing raw-catalogue scope is
retained; it does not independently certify every displayed nested source.
