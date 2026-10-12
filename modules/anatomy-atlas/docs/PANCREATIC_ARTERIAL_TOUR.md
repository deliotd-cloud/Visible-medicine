# Pancreatic arterial guided learning

The Abdomen and Whole body Guided learning libraries offer **Pancreatic arteries:
head arcades to tail**. Nine stops compare the retained anterior and posterior
head vessels, then dorsal, inferior, great and caudal pancreatic arteries. The
existing pancreas, spleen, superior mesenteric, splenic and gastroduodenal trunk
surfaces provide faded context. No new toolbar or automatic playback is added.
Each stop retains its exact source name, so the guide is searchable by any of
the nine arterial names without starting playback.

## Playback and scope

Each stop lasts 14 seconds and uses the existing 1.8-second quintic orbit
transition, pause, previous/next, keyboard and reduced-motion controls. Paired
head stops share camera bounds; later stops frame smaller branch groups. All
surfaces stay assembled. The pancreatic parent is the existing corrected
aggregate surface, not separately validated head, neck, body or tail meshes.
The duodenum, ducts and veins are not part of this sequence.

The sequence compares named relationships; it is not a serial blood-flow route.
Exterior surfaces do not establish a continuous lumen, complete arcades,
patency, perfusion, surgical planes or a universal variant pattern. Source
laterality remains unchanged. The captions distinguish the inferior pancreatic
body artery from the inferior pancreaticoduodenal trunk.

## Sources and licences

Original captions refer to the [UAMS abdomen arterial anatomy table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/)
and the primary [dual-energy CT anatomy and variation study](https://link.springer.com/article/10.1186/s13244-022-01157-z).
The study supplies variation context, not validation of these meshes or evidence
of visibility in an arbitrary scan. No article image, diagram, table, model,
scan or texture is imported. Original application code and captions use the
project MIT licence; existing BodyParts3D attribution and CC BY 4.0 terms remain.
No dependency, service, payment or new asset licence is introduced.

## Exact source and review binding

`content/pancreatic-arterial-tour-pins.json` binds the complete fourteen display
records, four bundle identities, catalogue version, coordinate system and
licence to Atlas baseline `1604303bb9377dd2390e840c079652eb59c47fb0`.
The corrected pancreas bundle is explicitly included. The matcher rejects
missing, duplicate, aliased or altered records, bundles and sequence material.
Per-stop bounds are derived from the admitted source records, not guessed
patient coordinates.

Revision `pancreatic-arterial-relationships-20261012-r1` is a clinical draft.
The fourteen affected Review worksheets include the full sequence, source
context, camera bounds, references and transition settings. Previous worksheet
revisions must not save or approve this new material. All existing teaching
topics, questions and earlier tour evidence remain unchanged.

The existing opt-in paused-tour Education mechanism can request an independently
cleared and entitled mapping when available. This sequence adds no acquired
image locator or patient-space registration. The CT/MRI head links, accepted
masks, desktop clinical PACS and independent paid access are untouched.

## Verification and clinical review

Run `npm run pancreatic-arterial-tour:test`, source content/Review checks and
fresh types. Website integration uses the four normal module exporters and
protected Review pipeline; never hand-edit generated copies. Test actual
signed-in desktop/GPU rendering separately from source and component tests.

Radiologist review must check the nine named arterial surfaces and corrected
pancreas relationship, incomplete or discontinuous branches, camera readability,
captions, variants and omission disclosures at this exact revision. No automated
check or licence establishes clinical accuracy or public-release clearance.
