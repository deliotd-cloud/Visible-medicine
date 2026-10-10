# Limb connective CT orientation

Six pending CT placements gain three original, source-linked drafts: right and
left long plantar ligaments (FMA44249/44250), wrist flexor retinacula
(FMA40120/40121), and iliotibial tracts (FMA58776/58777). Each side is bound
to its complete retained BodyParts3D identity and bundle bytes. These are
educational orientations for already acquired CT, not CT scan guidance or
patient-specific segmentation.

## Evidence and limits

- Long plantar: [a cadaveric morphology study](https://pubmed.ncbi.nlm.nih.gov/33413502/)
  distinguishes long and short plantar ligaments and documents shape variation.
  [ACR chronic foot pain criteria](https://acsearch.acr.org/docs/69424/Narrative)
  rate MRI and ultrasound above CT when a soft-tissue origin is suspected after
  nondiagnostic radiographs. The draft uses CT for calcaneocuboid bone/joint
  orientation, without claiming that routine CT confirms an intact ligament.
- Wrist: [a small normal-volunteer CT study](https://pubmed.ncbi.nlm.nih.gov/3685462/)
  described the carpal-tunnel osseous walls and transverse ligament under its
  study technique. [MR/anatomic correlation](https://pubmed.ncbi.nlm.nih.gov/3492109/)
  and [ACR chronic hand and wrist pain criteria](https://acsearch.acr.org/docs/69427/Narrative/)
  support the separate soft-tissue discussion. The CT draft cannot establish
  median-nerve compression, fine retinacular injury or universal visibility.
- Iliotibial tract: [cadaveric/MR anatomy](https://pubmed.ncbi.nlm.nih.gov/16533314/)
  describes its attachments, [an MR case series](https://pubmed.ncbi.nlm.nih.gov/1410374/)
  describes deep soft-tissue signal in symptomatic patients, and
  [a sonographic volunteer study](https://pubmed.ncbi.nlm.nih.gov/23804342/)
  examines its relation to the epicondyle during movement. CT bone landmarks
  alone do not establish tract injury, tissue motion or a syndrome diagnosis.

The references are reading links, not image or text licences. No publisher
figures, prose, scans, identifiers, measurements or derived pixels are imported.
The source meshes retain existing attribution and holds. No clinical approval,
case registration, PACS connection or hosted imaging is implied. Each draft
still requires revision-bound radiologist sign-off.

## Validation and integration

`node scripts/pin-limb-connective-ct.mjs --check` verifies the immutable
selection record and bundle bytes. `node scripts/test-limb-connective-ct.mjs
--source-only` checks the six pending source placements, all 9,930 other topic
placements and altered-identity refusals before dispatch. After integration,
run the test without `--source-only` to check the six draft transitions and
stale/tampered Review rejection against the current source. A source test does
not verify web delivery, browser behaviour, clinical accuracy or deployment.
