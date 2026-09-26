import type { AxialStudy } from "../lib/axial-anatomy";

export const elbowStudyReferences = [
  "https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/joint-tables/joints-and-ligaments-of-the-upper-limb/",
  "https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-upper-limb/",
];
const humeri = ["FMA23130", "FMA23131"];
const radii = ["FMA23464", "FMA23465"];
const ulnae = ["FMA23467", "FMA23468"];
const supinators = ["FMA38513", "FMA38514"];
const framework = [...humeri, ...radii, ...ulnae];
export const elbowSourceFmaIds = [...framework, ...supinators];
const limitation =
  " Whole source bones and muscles remain selectable; the close-up is camera framing, not segmentation. Cartilage, capsule, collateral/annular ligaments and radial nerve branches are not supplied by these views. Zero separation shows source positions; this is not joint motion, a surgical approach, injury or a registered scan.";
export const elbowStudySets: AxialStudy[] = [
  {
    id: "elbow-bones",
    title: "Elbow: bony relationships",
    regions: ["forearm"],
    targetFmaIds: framework,
    context: [],
    view: "anterior",
    description:
      "Expose the distal humerus and proximal radius/ulna. Select Left or Right for one elbow, then rotate to compare the three articulations.",
    inspect:
      "Distinguish humeroulnar, radiocapitellar and proximal radioulnar relationships. A common region does not make these the same articular surface." +
      limitation,
    landmarks: ["humerus$", "radius$", "ulna$"],
  },
  {
    id: "elbow-humeroulnar",
    title: "Elbow: humeroulnar window",
    regions: ["forearm"],
    targetFmaIds: [...humeri, ...ulnae],
    context: [],
    view: "posterior",
    description:
      "Set the radius and soft tissues aside to compare the humerus with the proximal ulna. Undo or Bony relationships restores the radius.",
    inspect:
      "Rotate from the olecranon towards the trochlear-notch region. Removing a whole radius only opens the view; it is not a dislocation or resection." +
      limitation,
    landmarks: ["humerus$", "ulna$"],
  },
  {
    id: "elbow-radiocapitellar",
    title: "Elbow: radiocapitellar window",
    regions: ["forearm"],
    targetFmaIds: [...humeri, ...radii],
    context: [],
    view: "anterior",
    description:
      "Set the ulna and soft tissues aside to compare the radial head with the lateral distal humerus. Both bones retain their original position.",
    inspect:
      "Identify the radial head opposite the capitulum rather than the humeral trochlea. Source contact and display gaps do not measure cartilage or joint congruence." +
      limitation,
    landmarks: ["humerus$", "radius$"],
  },
  {
    id: "elbow-proximal-radioulnar",
    title: "Elbow: proximal radioulnar window",
    regions: ["forearm"],
    targetFmaIds: [...radii, ...ulnae],
    context: [],
    view: "superior",
    description:
      "Set the humerus aside to compare the proximal radius and ulna. Start from above and rotate freely to understand their relationship.",
    inspect:
      "Compare the radial-head circumference with the radial-notch region of the ulna. The annular ligament normally retains this relationship but is not modelled here; camera rotation is not forearm pronation/supination." +
      limitation,
    landmarks: ["radius$", "ulna$"],
  },
  {
    id: "elbow-supinator",
    title: "Elbow: supinator exposed",
    regions: ["forearm"],
    targetFmaIds: supinators,
    context: [{ fmaIds: framework }],
    view: "posterior",
    description:
      "Expose the supplied supinator surfaces against the three bones, with overlying forearm muscles hidden. Select the muscle for its existing teaching.",
    inspect:
      "Supinator turns the radius during supination; this static view does not simulate that action. Left/right selections represent whole source muscles, not separately segmented layers or a validated nerve tunnel. Anconeus belongs to the current arm scope and is not silently imported into this view." +
      limitation,
    landmarks: ["supinator$", "radius$", "ulna$"],
  },
];
