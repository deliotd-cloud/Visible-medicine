# Upper-limb vessel teaching

8 September 2026: 92 original Anatomy/Function drafts for 46 existing vessel selections, using 23 bilateral teaching groups and 48 source components. Educational drafts, not clinical acceptance. Existing panels, controls, geometry and dependencies are unchanged.

## Coverage and identity

The batch includes axillary/brachial/deep brachial arteries, circumflex humeral and scapular arteries, thoracodorsal artery, radial/ulnar/anterior interosseous arteries, cephalic/basilic/axillary/suprascapular veins, deep palmar arches, thyrocervical/costocervical trunks, dorsal scapular/suprascapular arteries, thoracoacromial trunks and their pectoral/acromial/deltoid branches.

Primary-region counts: shoulder-arm 34, forearm 10, hand two. Secondary head-neck, thorax, shoulder-arm and hand memberships remain exact. Overlapping navigation does not create extra structures or segmented vascular territories.

All forty-six source FMA names, sides and file memberships match cached official BodyParts3D v4 ISA rows. They are separately pinned in the validator, not inferred from the authored lesson. Posterior circumflex humeral selections FMA22685/FMA22687 contain FJ2291/FJ2292 and FJ2239/FJ2240 respectively. Each two-file group is one selectable identity, not two independently identified branches. All other selections in this batch use one file. Source counts do not prove continuity or clinical correctness.

The resolver requires vessel system/category, exact FMA/side, primary region and every required secondary region. Paired entries share concise reference teaching but retain distinct source identities. Display and exports receive fresh lesson arrays, existing coverage limits and explicit draft status. Only Anatomy/Function are filled; no other topic, source transform, review record or imaging binding changes.

## Teaching boundaries

Notes distinguish superficial venous return from arteries and deep veins, vessel names along a route from separate branches, and the deep arch from the superficial arch. They flag incomplete scapular/palmar connections and source compounds. Named nerve relationships do not add missing nerve meshes. A source vessel is not a measured perfusion map, Doppler study, safe puncture site, vascular lumen, patent arch or usable surgical pedicle. Exploded arrangement is not a physiological position.

## Factual references and commercial rights

Relevant factual sections consulted on 8 September 2026:

- [Axillary artery](https://www.ncbi.nlm.nih.gov/books/NBK482174/?report=printable) and [posterior circumflex humeral artery](https://www.ncbi.nlm.nih.gov/books/NBK538283/): shoulder routes and named boundaries. The ordinary axillary page returned 403; its public print view was read successfully.
- [Brachial artery](https://www.ncbi.nlm.nih.gov/books/NBK537145/), [forearm arteries](https://www.ncbi.nlm.nih.gov/books/NBK545155/) and [hand arteries](https://www.ncbi.nlm.nih.gov/books/NBK546583/): selected arterial pathways.
- [Cubital fossa](https://www.ncbi.nlm.nih.gov/books/NBK551674/) and [venous drainage](https://www.ncbi.nlm.nih.gov/books/NBK27370/): venous routes; conflicting or erroneous terminal descriptions were not adopted as universal anatomy.
- [Thyrocervical arteries](https://www.ncbi.nlm.nih.gov/books/NBK555996/) and [costocervical trunk](https://www.ncbi.nlm.nih.gov/books/NBK556020/): trunk context, without imposing a fixed branch count or side-specific source level.
- [Dorsal scapular nerve—vascular section](https://www.ncbi.nlm.nih.gov/books/NBK459343/) and [latissimus dorsi—vascular section](https://www.ncbi.nlm.nih.gov/books/NBK448120/): selected artery context only.
- [External jugular veins](https://www.ncbi.nlm.nih.gov/books/NBK538222/) and [supraclavicular fossa](https://www.ncbi.nlm.nih.gov/books/NBK537265/): limited suprascapular venous context.
- [Texas Tech axillary tables](https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_tables.html) and [UAMS upper-limb arterial tables](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/): corroboration and source-specific branch teaching.
- [Kenhub thoracoacromial artery](https://www.kenhub.com/en/library/anatomy/thoracoacromial-artery): short branch-course facts only; no illustrations or tables imported.

Sources are not assumed error-free. Conflicting thyrocervical branch counts, erroneous vessel-type wording, teres-minor versus teres-major transitions, fixed digital territories, percentages, neurological/embryological claims and procedural safety assertions were not copied into lessons. The failed dissector-page opening and PubMed browser-check response were not treated as inspected full-text evidence. General textbook descriptions do not adjudicate the specific meshes.

Only brief original factual text and links are added. No publisher prose, diagrams, tables, scans, anatomy dataset, font or texture is imported. NC-ND/copyright terms are not commercial redistribution grants. Original application text/code retain MIT terms; source-index evidence separately retains DBCLS BodyParts3D CC BY 4.0 attribution/change notices. No new dependency, paid service, patient data or private review export.

## Verification and remaining work

`npm run upper-limb-vessel-curriculum:test -- --source` checks 46 exact memberships, 48 components, dispatch boundaries, fresh arrays, display/export parity, retained warnings and twelve rejected regressions. Twenty-five offline projections preserve 1,458 pinned topic edits against the original immutable baseline. The pelvic report now labels historical totals; runtime/export stay current.

Current body totals: Anatomy 922 draft/100 identity-only; Function 978 draft/40 identity-only/four pending. Held Function records FMA45097/FMA45098, FMA19728 and FMA61970 remain protected. Most specialist/modality and authored quiz teaching remains incomplete.

Independent review must address source identities, branch origins, boundaries, vascular/nerve clearances, venous junctions, collateral connections, regional supply and wording. No complete vessel tree, nerve reconstruction, acquired scan, patient registration or actual-device acceptance is established. Next: remaining lower-limb/head-neck vessels, unresolved generic nerve Anatomy, then deeper clinical/modality lessons in existing panels. Local commits are not GitHub upload or hosted publication.
