# Six-joint soft-tissue source inventory — 21 October 2026

Read-only metadata screen of the clean frozen Atlas checkout `F:/VisibleMedicine/staging/20261020-inbox-material-source` at `485df97c2530e8e81a8d39a5ee61073ce76d93db`. Exact IDs, source member names, catalogue hashes and per-joint mappings are in [inventory.json](inventory.json). These are provisional inventory targets, not a curriculum, accepted anatomy, geometry inspection or clinical clearance.

| Inspected source | Catalogue SHA-256 | Named records in this bounded screen |
| --- | --- | ---: |
| `public/models/bodyparts3d/full-body/catalog.json` | `109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7` | 10 regional context entries: 2 forearm membranes, 2 wrist retinacula, 2 leg membranes, 2 calcaneal tendons, 2 long plantar ligaments |
| `public/models/um-knee/catalog.json` | `946249f2b30bf29f4338e5c11cd324aec00b8616fcb02349376a258f93a6544e` | 10 knee tissue entries: 3 cartilage, 5 ligament, 1 grouped meniscus, 1 quadriceps tendon |
| `public/models/um-limb/catalog.json` | `fc27b778fe8a0e13f773f272bd0bd9bdf9d22117029bd5a5b5d11f0dc39c83fb` | 2: femoral-head cartilage and calcaneal tendon |
| `app/anatomy-data.ts` (SHA `75a91a07a3bf268088f7b6e011e71ffd27bbc0366d2d01a3dbbd7f28da64a4cb`) | dedicated shoulder, no catalogue | 0 separately indexed joint-soft-tissue entries among 9 structures |

The v4 source uses `sourceVersion: 4.0` and its common BodyParts3D millimetre coordinate frame. The UM knee frame is `um-5t6tz7-v1-2:knee`; the UM lower-limb catalogue identifies `um-5t6tz7-v1-2:lower-limb`. They share a cited UM archive, yet remain independent source/catalogue scopes and are explicitly not registered to BodyParts3D (`registeredToBodyParts3D: false`, `imagingRegistration: null` in both catalogues). The dedicated shoulder has its own nine-entry teaching index and GLB path (`app/anatomy-scene.tsx:260`); `app/anatomy-data.ts` declares no standalone frame ID. Do not combine these into one joint frame or infer patient registration.

## Per-joint readout

- Shoulder: dedicated `app/anatomy-data.ts:42-52,59-61,625-637` permits only bone, muscle or tendon categories and currently indexes bones and muscles. Its biceps-long-head note at line 519 says the source mesh is not a separately segmented tendon. Labrum, capsule and bursa occur as prose, not independent indexed entries. No separate named evidence in inspected metadata for capsule, labrum, bursa, shoulder ligaments or articular cartilage.
- Elbow: v4 forearm interosseous membranes `FMA23707/FJ1476` and `FMA23708/FJ1476M` supply regional context. No separate named elbow capsule, collateral ligaments, articular cartilage or bursa in inspected metadata.
- Wrist: v4 flexor retinacula `FMA40120/FJ1471` and `FMA40121/FJ1471M` are named. No separate named TFCC, wrist capsule, articular cartilage or bursa in inspected metadata.
- Hip: UM lower-limb `femoral-head-cartilage` is the one named articular tissue. No separate named acetabular cartilage, labrum, capsule or bursa in inspected metadata. `lib/um-limb-studies.ts:50-51` explicitly limits the study to the supplied femoral surface.
- Knee: UM knee independently indexes distal femoral, grouped tibial and patellar cartilage, ACL/PCL/MCL/LCL/patellar ligament, a grouped meniscus surface and quadriceps tendon. `lib/um-knee-study.ts:30-35` admits them to named views; line 33 explicitly does not separate medial/lateral menisci or tibial cartilage. No separate named capsule or bursa in inspected metadata.
- Ankle: v4 long plantar ligaments, leg interosseous membranes and paired calcaneal tendons, plus the independent UM calcaneal tendon, are regional context. The long plantar ligament is a foot entry, not an ankle collateral ligament. No separate named ankle capsule, collateral complex, articular cartilage or bursa in inspected metadata. `lib/um-limb-studies.ts:60-66` defines the foot/ankle views and limitations.

## Admission and interpretation boundaries

`lib/um-knee-study.ts:9-25` says the renderer's empty FMA does not map UM records into BodyParts3D imaging/teaching IDs, labels the independent right-limb source as unvalidated, and states the display transform is not calibrated measurement. `lib/um-limb-studies.ts:16-20,26-39` builds distinct regional study scopes from the source surfaces; lines 45, 50-51 and 63-66 disclose unmapped bursae, labrum/capsule and retinacular/ligament gaps. The separate `docs/UPPER_JOINT_SOURCE_SCREEN_20260918.md:3-16` describes an earlier upper-limb candidate search with no admitted dataset; it is historical search evidence, not a current catalogue entry. `docs/FULL_BODY_COVERAGE.md:3,9,23,29` distinguishes historical milestones and incomplete joint coverage from current display state. Source admission and holds remain governed by `docs/SOURCE_INVENTORY.md:47-53,83`; unused root FMA text or an innervation label is not a mesh.

“No separate named evidence in inspected metadata” means only this bounded set did not index it. It is not biological absence, a statement that no usable geometry exists, a licence review of other sources, a placement proposal or radiologist sign-off. Other source archives and candidate datasets were not inventoried. No model bytes were decoded, and no source, test output, Git state or hosted artifact was changed.
