# Portal venous X ray teaching drafts

Four existing Abdomen and Whole body selections gain original orientation for
contrast X-ray venography. Plain abdominal radiographs, catheter/DSA studies,
CT venography, MR venography and Doppler ultrasound remain distinct. The
drafts do not supply acquired images or establish patient-space registration.

| Existing selection | Retained source | Teaching emphasis |
| --- | --- | --- |
| Hepatic portal vein | FMA50735, FJ1853 | Usual splenic/SMV confluence; portal inflow is distinct from hepatic venous outflow |
| Splenic vein | FMA14331, FJ3641 | Demonstrated splenic-to-portal course; projected proximity is not a collateral connection |
| Superior mesenteric vein | FMA14332, FJ3647 | Distinguish the vein from the artery; retained segment is not complete bowel drainage |
| Inferior mesenteric vein | FMA15391, FJ3443 | Confirm the actual junction; selected interventional evidence is not routine visibility |

The complete identities already pinned by central-vessel and abdominal-branch
imaging are reused unchanged. Exact source, bundle, bounds, validation and
coverage limits must match; names or FMA IDs alone cannot activate a lesson.
Only these four X-ray placements change. Other modalities, geometry, guides,
dissection profiles, source catalogues and access decisions remain unchanged.

## Evidence and limits

[UAMS selected abdominal veins](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-abdomen/)
provides the usual reference relationships. [ACR/RSNA catheter angiography](https://www.radiologyinfo.org/en/info/angiocath)
distinguishes contrast X-ray vessel imaging from plain radiographs.

[Sturm et al. 2021](https://doi.org/10.1371/journal.pone.0261499)
studied 49 patients with non-malignant acute splanchnic vein thrombosis, not
healthy volunteers. The IMV was not among its five evaluated vessel regions;
the drafts do not extend that evidence to it. [Entezari et al.](https://pubmed.ncbi.nlm.nih.gov/33230650/)
reported four selected PVT/cavernous-transformation cases, with one IMV access
and three SMV accesses. These observations do not establish a recommended
procedure, normal visibility or universally interchangeable imaging tests.

## Review and verification

The lessons are drafts for revision-bound radiologist review. Changed teaching
must change the teaching fingerprint and material hash without changing the
source fingerprint. Stale or altered Review submissions must be refused before
storage. No clinical approval is inferred from the source or automated tests.

Run `node scripts/test-portal-venous-xray.mjs` for exact identity, content,
admission-transition, review security and unchanged-source checks. The website
test `tests/clinical-review-portal-venous-xray.test.ts` checks committed source,
all learner-module identities, emitted Abdomen/Whole-body teaching and protected
Review equality. Normal export/import/bind workflows remain required; generated
website modules must not be edited by hand. Browser/GPU and clinical acceptance
remain separate release checks.

## Commercial reuse scope

All application wording and code are original project work under its MIT terms.
References supply factual reading links only. No publication text extracts,
figures, tables, sonograms, angiograms, scans or datasets are imported. PLOS
identifies its article as CC BY; the Entezari article's temporary pandemic
research permissions are not treated as a commercial media licence. UAMS and
publisher rights remain with their owners. Existing BodyParts3D CC BY 4.0
attribution is unchanged. No new model, texture, font, dependency, paid service
or fee is introduced.
