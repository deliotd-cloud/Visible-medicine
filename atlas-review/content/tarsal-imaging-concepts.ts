// Original educational summaries; reading references are not imported images or protocols.
export const tarsalImagingGroups = {
  talus: ["FMA24482", "FMA24483"],
  calcaneus: ["FMA24497", "FMA24498"],
  navicular: ["FMA24500", "FMA24501"],
  cuboid: ["FMA24528", "FMA24529"],
  cuneiform: [
    "FMA24521",
    "FMA24522",
    "FMA24523",
    "FMA24524",
    "FMA24525",
    "FMA24526",
  ],
} as const;
export type TarsalImagingGroup = keyof typeof tarsalImagingGroups;
export type TarsalImagingModality = "xray" | "ct" | "mri";
export const tarsalImagingReferences = {
  anatomy:
    "https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/bone-tables/bones-of-the-lower-limb/",
  talus: "https://www.orthoinfo.org/diseases--conditions/talus-fractures/",
  calcaneus:
    "https://www.orthoinfo.org/diseases--conditions/calcaneus-heel-bone-fractures/",
  stress:
    "https://www.orthoinfo.org/diseases--conditions/stress-fractures-of-the-foot-and-ankle/",
  midfoot: "https://pubs.rsna.org/doi/10.1148/rg.342125215",
  lisfranc:
    "https://www.orthoinfo.org/diseases--conditions/lisfranc-midfoot-injury/",
  cuboid:
    "https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/midfoot/cuboid-multifragmentary-fracture/definition",
  mri: "https://www.radiologyinfo.org/en/info/muscmr",
};
export const tarsalImagingSelectionNotes = [
  {
    fmaIds: ["FMA24482", "FMA24483"],
    note: "Talus: distinguish the trochlear body, narrowed neck and anterior head. The head faces the navicular; these landmarks are not separate selections.",
  },
  {
    fmaIds: ["FMA24497", "FMA24498"],
    note: "Calcaneus: distinguish the posterior tuberosity from the medial sustentaculum tali beneath the talus. A surface landmark does not establish a tendon footprint.",
  },
  {
    fmaIds: ["FMA24500", "FMA24501"],
    note: "Navicular: locate it between the talar head and the three cuneiforms, not in the lateral cuboid column.",
  },
  {
    fmaIds: ["FMA24528", "FMA24529"],
    note: "Cuboid: follow the lateral column from calcaneus towards the fourth and fifth metatarsal bases.",
  },
  {
    fmaIds: ["FMA24521", "FMA24522"],
    note: "Medial cuneiform: the innermost of the three cuneiforms, adjacent to the first metatarsal base.",
  },
  {
    fmaIds: ["FMA24523", "FMA24524"],
    note: "Intermediate cuneiform: the middle cuneiform; distinguish it from its medial and lateral neighbours.",
  },
  {
    fmaIds: ["FMA24525", "FMA24526"],
    note: "Lateral cuneiform: lies between the intermediate cuneiform and cuboid. It is not the lateral-most tarsal bone.",
  },
];
type Topic = {
  body: string;
  bullets: [string, string];
  references: (keyof typeof tarsalImagingReferences)[];
};
export const tarsalImagingTopics: Record<
  TarsalImagingGroup,
  Record<TarsalImagingModality, Topic>
> = {
  talus: {
    xray: {
      body: "Separate the ankle relationship above the talus from the subtalar relationship below it. Fractures can involve the neck, body or processes; one apparently intact contour is not a complete assessment.",
      bullets: [
        "Compare the selected whole bone from several directions before returning to acquired images.",
        "The atlas camera is not a calibrated ankle or mortise projection; deliberately separated bones do not demonstrate dislocation.",
      ],
      references: ["talus"],
    },
    ct: {
      body: "CT can clarify talar fracture lines that are difficult to understand on radiographs. Follow the involved part through consecutive sections and reformations, rather than judging a rendered outline alone.",
      bullets: [
        "Keep talar and adjacent calcaneal findings separately localised.",
        "This unsegmented outer surface supplies no fracture classification, articular step-off, cartilage thickness or surgical corridor.",
      ],
      references: ["talus"],
    },
    mri: {
      body: "MRI adds information from bone and surrounding soft tissues beyond the outer talar contour. A selected bone is a localisation aid, not a map of marrow signal or cartilage.",
      bullets: [
        "Distinguish a finding within the talus from a nearby tendon or ligament finding in the acquired study.",
        "Highlight colour does not indicate oedema, osteonecrosis, perfusion or an osteochondral lesion. No such diagnosis is encoded here.",
      ],
      references: ["mri"],
    },
  },
  calcaneus: {
    xray: {
      body: "The calcaneus forms the heel and supports the talus. Radiographs can show fracture and displacement, but its complex shape must not be reduced to one silhouette.",
      bullets: [
        "Orient the heel separately from the talus before comparing an acquired image.",
        "No weightbearing state, validated angle, heel width or fracture deformity can be measured from this source.",
      ],
      references: ["calcaneus"],
    },
    ct: {
      body: "CT depicts complex calcaneal fracture anatomy in greater detail. Keep the calcaneal body and its relationship with the subtalar joint distinct when reviewing the sections.",
      bullets: [
        "Compare a real image series across planes; a 3D reconstruction is only one presentation of its data.",
        "This model has no validated fracture fragments or facet subdivisions. Separating the talus does not expose a surgical plane.",
      ],
      references: ["calcaneus"],
    },
    mri: {
      body: "Calcaneal stress injury may resemble other causes of heel pain and may require MRI assessment. Symptoms alone are not diagnostic.",
      bullets: [
        "Distinguish bone from nearby plantar and Achilles soft tissues.",
        "The source contains no marrow signal, stress-fracture line or validated plantar-fascial insertion.",
      ],
      references: ["stress"],
    },
  },
  navicular: {
    xray: {
      body: "Navicular stress injury can be difficult to identify. A normal-looking external bone model cannot exclude a radiographically occult injury in a patient.",
      bullets: [
        "Do not confuse the foot navicular with the wrist scaphoid.",
        "No accessory ossicle or cortical defect is adjudicated by this source; do not turn a mesh irregularity into a clinical example.",
      ],
      references: ["stress"],
    },
    ct: {
      body: "CT may be used when a navicular stress fracture is suspected. Its cross-sectional information is different from the single outer surface available here.",
      bullets: [
        "Localise findings to the navicular instead of assigning an adjacent joint contour to the same bone.",
        "No fracture extent, healing state or treatment decision is supplied by this atlas.",
      ],
      references: ["stress"],
    },
    mri: {
      body: "MRI is another examination used to assess suspected navicular stress injury. Compare the selected bone with the acquired series; a highlighted mesh is not a stress response.",
      bullets: [
        "Retain side and bone identity while moving between image planes.",
        "Real sequence data and surrounding tissues are required; this lesson does not prescribe a scan.",
      ],
      references: ["stress"],
    },
  },
  cuboid: {
    xray: {
      body: "Cuboid compression injury can accompany more extensive Lisfranc or Chopart injuries. Locating the cuboid is therefore a starting point, not an assessment of the entire midfoot.",
      bullets: [
        "Keep the neighbouring metatarsal bases and calcaneus in view for orientation.",
        "The supplied cuboid is not a fracture example. Explode spacing is not lateral-column shortening or instability.",
      ],
      references: ["cuboid"],
    },
    ct: {
      body: "For midfoot injury, CT provides cross-sectional and 3D information about the bones and joints involved. Follow the cuboid separately from its neighbouring joint surfaces.",
      bullets: [
        "Read serial source images alongside any 3D rendering.",
        "No CT attenuation, fragment count, measured column length or joint congruence is validated in this surface model.",
      ],
      references: ["lisfranc"],
    },
    mri: {
      body: "MRI can assess bone and neighbouring soft-tissue abnormalities around the lateral midfoot. A cuboid selection alone cannot establish tendon or ligament integrity.",
      bullets: [
        "Confirm that a finding belongs to the cuboid rather than another adjacent structure.",
        "No marrow sequence or fibularis-longus tendon lesion is supplied; missing tissue is not evidence of normality.",
      ],
      references: ["mri"],
    },
  },
  cuneiform: {
    xray: {
      body: "Compare tarsometatarsal alignment on frontal, lateral and oblique images. The second metatarsal base is recessed between the medial and lateral cuneiforms; the three cuneiforms are not interchangeable.",
      bullets: [
        "Projection and loading affect interpretation; this static source is not a weightbearing examination.",
        "No normal joint-gap threshold or Lisfranc instability test can be inferred from atlas spacing.",
      ],
      references: ["midfoot"],
    },
    ct: {
      body: "Multiplanar CT helps resolve the crowded cuneiform–metatarsal relationships. Trace each cuneiform as its own bone through the sections and compare the recessed second-metatarsal base.",
      bullets: [
        "Do not confuse the joint interface between two bones with a fracture line through one bone.",
        "The atlas supplies no validated articular step-off, fusion, fixation trajectory or ligament footprint.",
      ],
      references: ["midfoot"],
    },
    mri: {
      body: "MRI can assess the soft tissues involved in a subtle Lisfranc injury. Normal-looking bone outlines alone do not establish ligament integrity.",
      bullets: [
        "Localise the selected cuneiform first, then assess the relevant tissues on actual acquired sequences.",
        "The Lisfranc ligament is not supplied as a validated selectable structure here; the gap left by hiding a bone is not a ligament view.",
      ],
      references: ["lisfranc"],
    },
  },
};
