# Upper-limb muscles by nerve

The shared control now also offers separately pinned [lower-limb groups](LOWER_LIMB_MOTOR.md). Upper-limb source definitions and membership below are unchanged; one shared source/visibility engine serves both region sets, and the full upper-limb regression suite remains applicable.

In **Shoulder & arm, Forearm or Hand**, choose **Dissect → Muscles by nerve**. Select a nerve/branch, then **Show muscles & bones**. The existing viewer shows available source muscles with regional bony context. Select a muscle from the model or list for the existing anatomical and clinical notes. No second viewer or permanent list is added; the new control starts collapsed in the narrow rail and is absent in exam mode.

## Scope

**102 unchanged muscle selections**, 112 typical motor relationships, 17 named nerve/branch groups. Source selections include paired muscles, separately supplied heads and compound surfaces; these numbers are not unique whole muscles, nerve territories or new anatomy. The groups cover only the available muscles in these three regions, not the full upper limb, plexus or entire territory of a nerve. Pectoral/latissimus/trapezius targets outside these regions and absent flexor pollicis brevis geometry are not invented or silently added. The independent lower-limb explorer remains separate and unchanged.

| Region | Important distinctions |
| --- | --- |
| Shoulder & arm | Axillary versus suprascapular cuff supply; upper/lower subscapular contributions; long thoracic versus dorsal scapular; cervical contributions to levator; musculocutaneous and qualified radial brachialis supply |
| Forearm | Proximal radial versus deep radial versus posterior interosseous; direct median versus anterior interosseous; ulnar forearm branches; mixed FDP supply |
| Hand | Recurrent median versus digital motor branches; deep ulnar targets; whole lumbrical group appears with explicit partial-supply cautions |

Subscapularis, levator scapulae, brachialis, FDP and the lumbrical group have qualified multiple relationships. Showing either supply never creates a separately innervated mesh territory. ECRB branch origin and radial brachialis contribution are variable; this reference does not demonstrate the pattern in its donor. No motor entry points, root map, sensory field, palsy simulation, nerve course or patient correspondence are provided.

## Behaviour and source integrity

The selected group is applied with one existing `load-view` reducer action. Both-sided membership is retained internally so Left/Right filters continue to show the same nerve group rather than unexpectedly revealing other muscles. Selection respects the current side. Whole region bones remain contextual; other tissues are hidden. Separation, cutaway, fading and ghosting reset for a clear assembled view, and the bone/muscle system switches are enabled.

Existing Undo/Redo restores the previous **stage, focus and removal state**. It does not restore camera, separation or system switches; the interface states this. Repeated application of the same tissue mask does not consume history. Existing user-saved views can retain the resulting custom view; the motor grouping is not mislabeled as a named source dissection recipe. Applying a group does not emit a fictional nerve/imaging event. Subsequent ordinary muscle selection uses the existing exact-structure controls.

`content/upper-limb-motor.ts` explicitly assigns FMA records; no innervation is inferred from names, motor-supply text, adjacency, a nerve ancestor or another specimen. `upper-limb-motor-pins.json` retains 166 complete source muscle/bone records plus their full source frame and bundle bindings. Before any group is offered, the actual regional muscle/bone membership, identities, source version, licence, frame, hashes and duplicate IDs are checked. Changed/foreign source records or frames disable the affected group scope pending explicit re-admission. Unrelated display corrections are preserved. Source catalogue, meshes, existing lessons, practice questions, study recipes and review fingerprints are not edited.

## Sources and rights

Checked 11 September 2026. Original brief factual metadata and explanatory cautions only:

- [Texas Tech Health El Paso upper-limb muscles](https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html): named motor relationships.
- [Hand anatomy](https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html): thenar/digital/deep-ulnar distinctions and mixed lumbrical supply.
- [Axilla and posterior shoulder anatomy](https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla.html): upper/lower subscapular targets. Dissection instructions and illustrations are not reproduced.
- [Radial nerve branching and innervation study](https://pmc.ncbi.nlm.nih.gov/articles/PMC7345276/): variation in brachialis and ECRB supply. No population frequency is treated as a guarantee for this donor.
- [Anterior interosseous/pronator quadratus anatomical study](https://pmc.ncbi.nlm.nih.gov/articles/PMC9048100/): AIN muscle targets and intramuscular scope.

No publisher tables, text passages, diagrams, photographs, scans, protocols or question banks are imported, embedded or relicensed. Original code/prose uses the existing MIT grant; the existing BodyParts3D v4 source/mesh attribution and CC BY 4.0 terms remain separate. No new asset, dependency, font, texture, service, fee or external runtime call. No imaging/paid-lecture entitlement changes.

A bounded additional nerve-source search found no newly cleared geometry in the inspected results. University of Michigan's [2026 dissection laboratory page](https://sites.google.com/umich.edu/anatomy503) states educational-purpose donor-media scope, not commercial asset permission. Existing unresolved candidates remain documented in [Peripheral nerve candidates](PERIPHERAL_NERVE_CANDIDATES.md); no candidate was downloaded or reconstructed. This does not prove that no suitable open model exists.

## Verification and remaining gates

`npm run upper-limb-motor:test` checks the source pins, all 102 official name/file records, 54 region/side plans, visibility through actual dissection reducers, reversible history, side changes, source/frame rejection, mixed-supply cautions, installed-React panel/detail markup and execution of the real parent handler. It is not browser/WebGL, keyboard/touch/accessibility, educator or anatomical validation.

Independent specialist adjudication of each relationship/variation and anatomical source label remains required. Real licensed peripheral-nerve geometry, tissue interfaces, source-specific scan registration and separately enforced lecture entitlements are still missing. Oral detail remains lower priority; this completes the introductory upper-limb relationship explorer, not the wider atlas goal.
