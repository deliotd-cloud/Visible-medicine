# Foot arterial X-ray teaching drafts

Twelve existing bilateral selections now have six original teaching topics in
the X-ray tab: dorsalis pedis, medial plantar parent, lateral plantar parent,
plantar arch, deep plantar connection and superficial medial plantar branch.
These are source-bound orientation drafts, not acquired-image examples or
clinically approved anatomy. Plain radiography may depict arterial-wall
calcification; it does not provide a contrast-filled lumen examination.

## Source identity and commercial use

`content/foot-arterial-projection-xray-pins.json` records the complete selected
identities, coordinate frame and two existing BodyParts3D bundles at parent
commit `589263554141ba94548f9073327d4e51674bc33b`, tree
`ba724f0a46448132a6e5fc4c24f63730b53540f9`. The resolver accepts only those exact
identities and the X-ray tab. Names, laterality, components, source hashes,
bounds and validation fields cannot silently drift into another lesson.

Existing project MIT terms and BodyParts3D 4.0 CC BY 4.0 attribution remain in
force. Reading references supply factual support, not rights to redistribute
their text, illustrations or datasets. No publisher prose, figure, table,
scan, mask, mesh, font, texture, dependency or paid service is added.

## Evidence and teaching limits

- [Texas Tech lower-limb anatomy tables](https://anatomy.ttuhscep.edu/schemes/leg_tables.html)
  support regional anatomical orientation, not visibility of a named channel
  on a patient's radiograph.
- [Plain-film arterial calcification study](https://pubmed.ncbi.nlm.nih.gov/20041296/)
  concerns arterial calcification in chronic kidney disease. It does not
  establish normal branch-lumen visibility or perfusion.
- [Upton foot arterial anatomy study](https://pubmed.ncbi.nlm.nih.gov/9810995/)
  correlates dissection and angiographic anatomy in a selected clinical series.
  Variable patterns are not a universal circulation map or an imaging protocol.
- [Gabrielli deep plantar arch study](https://pubmed.ncbi.nlm.nih.gov/11694970/)
  describes adult cadaveric arch variation and contributions, not proof of a
  complete patent arch in this model or a patient.
- [Papon deep plantar artery study](https://pubmed.ncbi.nlm.nih.gov/9787393/)
  supports the dorsal-to-plantar connection through the first intermetatarsal
  space. It does not establish universal presence or procedural suitability.

Static surfaces and exploded gaps cannot establish patency, occlusion, arch
completeness, collateral flow, treatment targets or patient-space registration.
The two venous-arch X-ray placements and four small-branch ultrasound placements
are outside this batch. They remain pending at introduction; future independently
supported lessons are not prohibited by this feature's reusable tests.

## Verification and review

The one-time introduction proof is retained with the coordinator's integration
evidence on F drive. It compares the full 1,104-structure, 9,936-placement corpus
against the immutable parent: exactly 12 X-ray placements change from pending
to draft and the other 9,924 placements must remain identical. It also checks
complete normal-generated display pins, unchanged model bytes, source and
teaching fingerprints, forged identities, stale decisions and refusal before
storage. Its receipts, not this description, establish the actual result.

`npm run foot-arterial-projection-xray:test` is the reusable selected-structure
contract. It independently replays the historical catalogue, checks the current
12 selections and two licensed bundle hashes, and rejects mismatched sources
and topics. It does not freeze unrelated catalogue growth or future lessons.
Normal content, renderer, display-pin, source-hold, geometry and build gates
remain separate; altered renderer bindings may require new review even when
mesh bytes are unchanged.

Radiologist review must verify each exact source selection, factual wording,
reference applicability, ordinary-radiograph versus contrast-angiography
distinction and the limits of the six anatomical families. Geometry and teaching
approvals remain separate. Website import and any clinical or public release
require their own verified revisions and acceptance.
