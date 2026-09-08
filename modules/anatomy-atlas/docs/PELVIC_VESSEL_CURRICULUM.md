# Pelvic vessel teaching

8 September 2026: 24 original Anatomy/Function drafts for 12 existing iliac vessel representations and 22 source components. No new controls, geometry, assets or dependencies. Independent anatomical and clinical review remains pending.

## Scope and source boundaries

The right/left common, external and internal iliac arteries and veins retain their exact BodyParts3D v4 ISA identities. All have pelvis as their primary region and the ordered memberships pelvis/abdomen/thigh. Shared navigation is not proof of a segmented perfusion or drainage territory.

| Selection | Right FMA / source files | Left FMA / source files |
| --- | --- | --- |
| Common iliac artery | FMA14765 / FJ3565 | FMA14766 / FJ3464 |
| External iliac artery | FMA18806 / FJ3567 | FMA18807 / FJ3466 |
| Internal iliac artery | FMA18809 / FJ3569 | FMA18810 / FJ3468 |
| Common iliac vein | FMA21387 / FJ3566 | FMA21388 / FJ3465 |
| External iliac vein | FMA18885 / FJ3568 | FMA18886 / FJ3484, FJ3522, FJ3523, FJ3524 |
| Internal iliac vein | FMA18887 / FJ3570, FJ3571, FJ3572, FJ3607, FJ3608, FJ3609 | FMA18888 / FJ3469, FJ3470, FJ3471 |

These exact file memberships and source names match cached official ISA index rows. This is source identity verification, not spatial or clinical acceptance. Four-component external and six-/three-component internal venous groups are not assigned named tributaries, organ territories, patent joins or mirror symmetry.

The runtime resolver requires the exact FMA, matching side, vessel category/system, pelvis primary region and every required regional membership. It fills only Anatomy/Function and retains existing coverage limits. Other topics, source transforms, review state and imaging contracts do not change.

Teaching distinguishes parent vessels from iliac divisions and pelvic routes from the external iliac route into the leg. Left common venous crossing is not treated as right-side symmetry or a diagnosis. Branch variability and the adult-male source boundary remain explicit; a female vascular model is not implied.

## Evidence and rights

Factual sections consulted on 8 September 2026:

- [Iliac arteries](https://www.ncbi.nlm.nih.gov/books/NBK519552/): common/external routes and the inguinal name transition.
- [Internal iliac arteries](https://www.ncbi.nlm.nih.gov/books/NBK537311/): pelvic course, usual divisions, territories and variation.
- [Common iliac veins](https://www.ncbi.nlm.nih.gov/books/NBK554574/) and [inferior vena cava](https://www.ncbi.nlm.nih.gov/books/NBK482353/): venous junctions, side-specific routes and caval return.
- [May–Thurner syndrome](https://www.ncbi.nlm.nih.gov/books/NBK554377/): context for the left venous crossing; no diagnostic threshold, intervention or clinical conclusion is imported.
- [Nayak and Vasudeva, iliac venous variation](https://researcher.manipal.edu/en/publications/variant-anatomy-of-the-iliac-veins-and-presence-of-two-venous-rin/): university-hosted original cadaveric-study abstract supporting pelvic/gluteal/perineal drainage and variation. Its reported venous rings and variant confluence are not portrayed as ordinary anatomy or asserted to exist in this source mesh.
- [Texas Tech pelvic-wall neurovasculature tables](https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html): corroborating arterial routes and pelvic/perineal venous drainage; no table or illustration is imported.

Sources are not assumed error-free. Unrelated embryology, valve counts, absolute branch/level claims and procedural advice were excluded. Only short original factual notes and reference links are added, not publisher prose, scans, figures, tables or datasets. Copyright/NC-ND and exclusive publishing terms are not redistribution licences. Original application text/code retain MIT terms; exact source-index evidence separately retains DBCLS BodyParts3D CC BY 4.0 attribution/change obligations. No new font, texture, mesh, paid API or private data.

## Verification and remaining work

`npm run pelvic-vessel-curriculum:test -- --source` checks twelve exact source memberships, twenty-two components, guarded dispatch, detached arrays, display/export parity, retained limits and twelve negative cases. Twenty-four offline projections preserve 1,366 pinned topic edits against the immutable original baseline. The abdominal validator projects its own historical totals; current runtime/export are not rolled back.

Current body totals: Anatomy 876 draft/146 identity-only; Function 932 draft/86 identity-only/four pending. The two foot-sesamoid groups, pelvic muscle and fornical Function holds remain protected against readiness-only promotion. Most specialist/modality teaching and authored questions remain incomplete.

Review must address bifurcations, venous confluences, source compounds, pelvic tributaries, arterial divisions, inguinal transitions, adjacent structures, sex/individual variation and wording. No vascular lumen, flow, patency, Doppler finding, pressure, safe procedural corridor, acquired scan or patient registration is established. Software tests do not confer anatomical, clinical or actual-device acceptance.

Next: remaining limb/head-neck vessels and generic nerve Anatomy entries, then source-specific clinical/modality teaching in the existing panels. Local checkpoints are not remote GitHub backup or hosted publication.
