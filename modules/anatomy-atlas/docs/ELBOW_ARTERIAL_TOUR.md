# Right elbow: collateral and recurrent arteries

Eight Guided learning stops compare four usual arterial pairs on the **right**
side. The tour appears in Forearm and Whole body through the existing library,
without a new toolbar, automatic playback or changes to the default tour.

| Pair | Existing right-sided FMA targets |
| --- | --- |
| Inferior ulnar collateral / anterior ulnar recurrent | FMA22712 / FMA22801 |
| Superior ulnar collateral / posterior ulnar recurrent | FMA22707 / FMA22804 |
| Radial collateral / radial recurrent | FMA23126 / FMA22764 |
| Middle collateral / recurrent interosseous | FMA23124 / FMA268667 |

Humerus, radius and ulna are faded context. Their existing region memberships
already include Forearm; this sequence neither rewrites membership nor combines
different specimens. The humerus retains its original shoulder-pilot ID.

## Playback and evidence

The existing player supplies pause, next/previous, keyboard controls, 14-second
stops, 1.8-second quintic orbit transitions and reduced-motion handling. Both
stops of each pair share a source-derived local camera frame. Whole bones are
not included in those camera bounds: they provide orientation without forcing
the camera to fit the entire upper limb. Their ends may be outside the frame.
Sources stay assembled and other admitted surfaces fade.

The sequence describes comparisons, not a serial blood-flow route. Parent
trunks, nerves, tunnels, tiny communicating branches and the complete vascular
network are absent. Neither apparent contact nor a gap proves a junction,
patency, occlusion, flow, perfusion or collateral adequacy. The tour does not
change any existing modality lesson or turn pending ultrasound into validated
visibility. It adds no acquired scan, anatomical image locator, probe plane,
procedural guidance or patient-space registration.

Captions were independently written using the [TTUHSC upper-limb arterial
table](https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html)
and the inspected author-institution [Yamaguchi et al. 1997 abstract](https://profiles.wustl.edu/en/publications/the-extraosseous-and-intraosseous-arterial-anatomy-of-the-adult-e/)
(DOI 10.2106/00004623-199711000-00007). The latter describes injected cadaveric
anatomy in 22 upper limbs. Its full paper was not inspected; neither that
abstract nor the teaching table validates these meshes or clinical Doppler
detection. Other search candidates were not used to infer routine visibility.

## Commercial use and source binding

New application code and captions use project MIT terms. Existing BodyParts3D
CC BY 4.0 credits remain. No publication text, illustration, image, table,
dataset or model is imported or adapted; references are factual reading links
only. Publisher/institutional rights remain intact. No dependency, font,
texture, paid asset, external runtime service or mandatory fee is added.

`content/elbow-arterial-tour-pins.json` binds eleven complete display records,
four bundles, coordinate system, version and licence to baseline
`a70b6f640c5511330f250882f525b63a4a21117b`. The matcher rejects changed, missing,
duplicate or aliased source/bundle/sequence evidence. Revision
`right-elbow-arterial-pairs-20261012-r1` remains a clinical draft. All eleven
affected Review worksheets bind the complete sequence and camera evidence;
old decisions do not approve this new sequence. Existing lessons, questions,
other tour material, access rules and specialist masks remain unchanged.

## Verification and clinical review

Run `node scripts/pin-elbow-arterial-tour.mjs --check` and
`node scripts/test-elbow-arterial-tour.mjs`, existing guided-player/Whole body/
Review/camera regressions, content/Review contracts and fresh types. Generate
renderer and trusted display bindings through their normal scripts. Website
integration must use the normal learner exporters and protected Review import,
never hand-edited generated copies.

Radiologist review must check source labels/laterality, partial or disconnected
arterial surfaces, the four usual relationships, omitted structures, camera
orientation/readability and all captions at the exact revision. Actual
signed-in desktop/GPU playback and clinical acceptance remain separate from
source/component checks. No approval or public-release clearance is inferred.
