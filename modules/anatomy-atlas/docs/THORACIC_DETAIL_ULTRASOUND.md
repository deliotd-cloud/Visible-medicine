# Thoracic ultrasound orientation drafts

These ten exact existing root-body selections receive independently written
Ultrasound-tab drafts. They are anatomical orientation, not an acquired image
library, procedural guide, validated registration or clinical approval.

| Source selection | Identity | Evidence scope |
| --- | --- | --- |
| Bronchial artery | FMA68109 / FJ1933 | Illustrated EUS branch in aortopulmonary window; not universal visibility |
| Variant bronchial artery | FMA10704 / FJ3418 | Preserve FMA14177 alias; illustration does not verify this mesh connection |
| Oesophageal artery | FMA4149 / FJ1934 | Aortic/left-gastric supply; seeing aorta does not establish a tiny feeder |
| Set of oesophageal branches | FMA71537 / FJ3431 | Group remains one source selection; not complete arterial tree |
| Hemiazygos vein | FMA4944 / FJ3434 | Published EUS relationship near lower oesophagus, not a normal sensitivity study |
| Anterior cardiac vein group | FMA76767 / FJ2725,FJ2730 | RV-to-RA drainage differs from coronary-sinus veins; no inferred echo count |
| Left/right musculophrenic arteries | FMA4077/FMA10692 / FJ1979,FJ1969 | Parent internal-thoracic US report does not establish terminal-branch visibility |
| Left/right musculophrenic veins | FMA4786/FMA4772 / FJ1988,FJ1996 | Venous drainage orientation; parent observation does not establish small-branch detection |

`lib/thoracic-detail-ultrasound.ts` compares the complete canonical identity against
unchanged existing pins, including ordered source files/hashes, donor geometry,
source-side labels and validation metadata. It returns fresh draft content only
for these ten Ultrasound placements. No grouped selection is split, renamed or
assigned a new side. All other tabs, source geometry and interactive questions
remain unchanged.

## Evidence and licensing

UAMS thoracic arterial tables and TTUHSC thoracic/mediastinal venous tables support
anatomical relationships. Original EUS teaching publications at PMC4445183 and
PMC4857566 support aortic and bronchial landmark examples; PMC5592756 supplies the
hemiazygos relationship in a pleural-EUS account. The latter includes effusion
views and is not a detection-performance study. Direct opens of the first two
encountered a provider browser check; relevant indexed publisher text was reviewed,
not an inaccessible full body. Blanco and Volpicelli (2014), DOI
10.1186/s13089-014-0013-1, was read through its primary authored PDF at the German
National Library. It describes internal-thoracic parent-vessel ultrasound based
on clinical experience, not a measured terminal-branch detection rate.

Only original factual prose and reading URLs are included. Source publications'
media/text rights are not taken as asset clearance. No scans, photographs, videos,
segmentation, models, fonts, textures, packages or services are added.

## Verification and clinical review

Run `npm run thoracic-detail-ultrasound:test` for complete source-pin mutation
refusal, exactly ten pending-to-draft transitions among 9,936 placements, ten
changed source-bound Review packets among 1,104, and stale/forged decision refusal
before storage. Regenerate regional teaching, display pins and renderer bindings
normally before Review verification. Admission history is checked at the feature
commit so later independent teaching can evolve without rewriting history.

The owner radiologist must review the exact draft revisions, anatomical identity,
relationship wording and modality limits. Actual ultrasound selection, image
clearance, visibility, source-to-image correspondence and teaching suitability
remain separate requirements. Atlas, Education cases and paid lectures retain
independent access. Do not interpret zero pending text slots as anatomical
completeness, validated ultrasound visibility, publication approval or sign-off.
