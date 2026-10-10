# Right upper-limb venous guided learning

Source milestone: 9 October 2026. Draft; not clinical approval or public release.

Whole body → Guided learning adds **Right upper limb: superficial and deep veins**:
hand dorsal network, cephalic, basilic, medial brachial, axillary and subclavian.
The first three compare superficial routes; the fourth is a deep-system comparison,
not a serial cephalic-to-basilic-to-brachial flow path. The source has one specifically
labelled medial brachial selection here; no complete paired system is implied.

Four unchanged right-sided bones provide faded context: third metacarpal, humerus,
clavicle and first rib. The hand stop frames only the hand. Later stops use local
bones rather than framing the entire sequence. All use the established 1.8-second
quintic camera transition, 14-second dwell, manual pause/restore and reduced-motion
behavior. No new UI controls, model geometry, simulations or dependencies.

## Source and rights

`content/upper-venous-tour-pins.json` pins six complete vessel records, four context
records, eight bundles, coordinates, source version and existing licence metadata
against Atlas `74ed7e65a65c919c787d0086ce50a11c21bf779b`. The pin checker verifies
model byte counts and SHA-256. The runtime refuses changed identities, duplicate
FMA aliases, laterality, sources, bundles, coordinates or sequence. Existing asset
attribution and commercial-use obligations are unchanged.

Original short factual captions reference institutional teaching consulted on
9 October 2026:

- [TTUHSC El Paso: upper-limb veins](https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html): superficial hand, cephalic and basilic drainage.
- [TTUHSC El Paso: axilla and arm](https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_ans.html): brachial pairing, axillary tributaries and first-rib boundary.

These references are not a licence to their illustrations or prose. No diagrams,
tables, images, scans or copied passages were imported. Existing source-mesh
licensing remains in THIRD_PARTY_NOTICES; reference links are educational citations.

## Acceptance and remaining review

`npm run upper-venous-tour:test` checks exact source admission, prior-tour preservation,
local framing, stale/tampered Review refusal and shared player/camera behavior.
Ten structure packets acquire the new exact-revision tour evidence; the other
1,094 packets and all 9,936 teaching-topic placements must remain unchanged.
All previous 34 sequences remain intact; the registry becomes 35 tours/208 stops.
The historical cardiac admission test freezes its registry epoch; the new test
compares the complete immediately previous registry and every structure packet.

Radiologist review must assess actual visible surfaces, apparent junctions, source
extents, sidedness, each frame, captions and readability. Source/unit tests do not
prove live GPU visibility or clinical acceptance. No valves, patency, flow, catheter
route, image coverage or patient-space registration is established. No CT/MRI/US
deep link is added without a corresponding source-bound study target.

Source-only checkpoint precedes website integration. Import the generated regional
learner and matching protected Clinical Review together; do not hand-edit runtime
copies. Keep dedicated shoulder and all approved imaging masks unchanged.
