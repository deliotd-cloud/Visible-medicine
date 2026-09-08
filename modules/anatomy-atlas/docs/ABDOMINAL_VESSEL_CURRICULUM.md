# Abdominal vessel teaching

8 September 2026: 28 original Anatomy/Function drafts for 14 existing vessel representations and 20 source components. No added controls, geometry, assets or dependencies. All are educational drafts awaiting independent review.

## Scope and source boundaries

The batch covers abdominal aorta, inferior vena cava, celiac/SMA/IMA, common/proper hepatic, splenic and left gastric arteries, hepatic portal vein, paired renal arteries and right/left hepatic veins. Source FMA, laterality, primary/secondary regions and file memberships are independently pinned in the validator and match cached official BodyParts3D v4 ISA rows.

IVC FMA10951 uses FJ3441/FJ3659; celiac FMA50737 uses FJ1846/FJ2013; SMA FMA14749 uses FJ1928/FJ2011; splenic artery FMA14773 uses FJ2562/FJ3420/FJ3544/FJ3640. Components are not automatically assigned to caval segments, branches, arcades or gastric/pancreatic territories. No missing tributary, middle hepatic vein, accessory renal artery or vascular join is reconstructed.

Runtime dispatch requires exact FMA, side, vessel category/system, abdomen primary region and every required secondary region. Abdominal aorta and IVC retain abdomen/pelvis/thorax memberships. Catalogue unspecified laterality remains unspecified; textbook location does not relabel the source.

Teaching distinguishes arterial and portal inflow from hepatic venous outflow; common from proper hepatic artery; mesenteric arterial territories from venous drainage; and the differing right/left renal courses. Portal blood travels toward the liver in the usual circulation despite being venous. Anatomy is not proof of the actual direction or adequacy of flow. Gut-supply shorthand does not make the spleen a gut derivative. No fixed flow fractions, exclusive hepatic arterial pattern or whole-rectum IMA territory is claimed.

## Evidence and rights

Factual sections consulted on 8 September 2026:

- [Abdominal aorta](https://www.ncbi.nlm.nih.gov/books/NBK525964/) and [inferior vena cava](https://www.ncbi.nlm.nih.gov/books/NBK482353/): central pathways and hepatic venous return.
- [Celiac trunk](https://www.ncbi.nlm.nih.gov/books/NBK459241/), [SMA](https://www.ncbi.nlm.nih.gov/books/NBK519560/) and [abdominal arteries](https://www.ncbi.nlm.nih.gov/books/NBK525959/): selected branch routes and usual territories.
- [Hepatoduodenal ligament](https://www.ncbi.nlm.nih.gov/books/NBK554488/) and [liver](https://www.ncbi.nlm.nih.gov/books/NBK500014/): portal/arterial inflow and hepatic outflow.
- [Renal Doppler anatomy section](https://www.ncbi.nlm.nih.gov/books/NBK572135/): renal arterial course, venous relations and accessory supply. No examination technique, thresholds or diagnostic findings are imported.

Sources are not assumed error-free. Unrelated fixed percentages, absolute branch claims, embryological assertions, caudate-drainage generalisations and procedural/diagnostic advice were not adopted. The attempted Hepatic Doppler page returned an error and the radiology review returned a browser-check page; neither is treated as inspected evidence or cited in the lessons. The source model itself does not adjudicate disputed anatomy.

Only brief original factual teaching is added, not publisher prose, figures, tables, scans or datasets. Reference copyright/NC-ND terms are not a commercial asset grant. Original application code/text retain MIT terms; source-index-derived evidence retains separate DBCLS BodyParts3D CC BY 4.0 attribution/change obligations. No new font, texture, mesh, paid API or private data.

## Verification and remaining work

`npm run abdominal-vessel-curriculum:test -- --source` verifies fourteen exact source memberships, twenty components, guarded dispatch, retained coverage warnings, detached arrays, display/export parity and twelve rejection cases. Twenty-three offline projections now preserve 1,342 pinned topic edits against the immutable original baseline. Thoracic and earlier milestone totals are historical; runtime/export remain current. Readiness-only promotion of the four held Function records remains rejected.

Current totals: Anatomy 864 draft/158 identity-only; Function 920 draft/98 identity-only/four pending. Most specialist/modality and authored quiz content remains incomplete. Counts and software checks do not establish accuracy, completeness, clinical approval or device acceptance.

Review must address source boundaries, compound membership, hepatic and renal variants, tributaries/ostia, vessel–organ relationships, bowel and liver territories, collateral pathways, wording and source calibre. No lumen patency, vascular wall pathology, measured haemodynamics, renal function, liver segment map, Doppler waveform, safe access corridor or CT/MRI registration is established. Existing held anatomy and imaging gates remain. Next: generic pelvic/limb/head-neck vessels and eleven remaining generic nerve Anatomy entries, followed by source-specific clinical/modality teaching. Local saves are not remote backup/publication.
