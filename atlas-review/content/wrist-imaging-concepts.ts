// Original orientation notes. References are reading links, not imported scans or prose.
export const wristImagingGroups = {
  scaphoid: ["FMA24435", "FMA24436"],
  lunate: ["FMA24437", "FMA24438"],
  ulnarProximal: ["FMA24439", "FMA24440", "FMA24441", "FMA24442"],
  radialDistal: ["FMA24443", "FMA24444", "FMA23725", "FMA24445"],
  centralDistal: ["FMA24446", "FMA24447", "FMA24448", "FMA24449"],
} as const;
export type WristImagingGroup = keyof typeof wristImagingGroups;
export type WristImagingModality = "ct" | "mri" | "xray";
export const wristImagingReferences = {
  radiographs: "https://archive.rsna.org/2014/14011989.html",
  ctOrientation: "https://archive.rsna.org/2007/5001359.html",
  sports: "https://pubs.rsna.org/doi/10.1148/radiol.2016150995",
  lunateShape: "https://pubmed.ncbi.nlm.nih.gov/12413964/",
  nonscaphoid: "https://pubmed.ncbi.nlm.nih.gov/25104893/",
  trapezoid: "https://pubmed.ncbi.nlm.nih.gov/32322329/",
  hamate: "https://pubmed.ncbi.nlm.nih.gov/28834449/",
};
export const wristImagingSelectionNotes = [
  {
    fmaIds: ["FMA24435", "FMA24436"],
    note: "Scaphoid: distinguish proximal pole, waist and distal tubercle on the same bone; these are not separate selectable parts.",
  },
  {
    fmaIds: ["FMA24437", "FMA24438"],
    note: "Lunate: its relationship with the capitate is not interchangeable with the scaphoid. This source has no adjudicated lunate morphology type.",
  },
  {
    fmaIds: ["FMA24439", "FMA24440"],
    note: "Triquetral is the source name for the triquetrum; do not confuse its body with the smaller pisiform on its palmar side.",
  },
  {
    fmaIds: ["FMA24441", "FMA24442"],
    note: "Pisiform: identify it palmar to the triquetrum. Its projected overlap does not make the two bones one selection.",
  },
  {
    fmaIds: ["FMA24443", "FMA24444"],
    note: "Trapezium: follow the thumb metacarpal base to distinguish it from the trapezoid beside it.",
  },
  {
    fmaIds: ["FMA23725", "FMA24445"],
    note: "Trapezoid: use the index-metacarpal base as an orientation landmark; it is not the thumb-side trapezium.",
  },
  {
    fmaIds: ["FMA24446", "FMA24447"],
    note: "Capitate: identify the central distal-row bone and its proximal head beneath the lunate. Source contact is not a cartilage measurement.",
  },
  {
    fmaIds: ["FMA24448", "FMA24449"],
    note: "Hamate: distinguish the palmar hook from the body. The hook is not separately segmented or independently movable here.",
  },
];
type Topic = {
  body: string;
  bullets: [string, string];
  references: (keyof typeof wristImagingReferences)[];
};
export const wristImagingTopics: Record<
  WristImagingGroup,
  Record<WristImagingModality, Topic>
> = {
  scaphoid: {
    xray: {
      body: "Follow the radial carpal column across more than one projection. Scaphoid foreshortening and superimposition change with positioning; a rotating surface view is not a scaphoid radiograph.",
      bullets: [
        "A fracture may be occult on initial radiographs; an intact-looking atlas surface cannot exclude one.",
        "Compare the proximal pole, waist and tubercle deliberately rather than treating every visible contour as the same cortex.",
      ],
      references: ["radiographs", "sports"],
    },
    ct: {
      body: "CT reformations can follow the scaphoid along its own long axis, separating cortical detail from overlap. The atlas only supplies an external surface, without the underlying CT voxels.",
      bullets: [
        "Check a suspected line in consecutive sections and another plane; a 3D rendering alone is insufficient.",
        "No fracture gap, healing, screw corridor or cortical thickness can be measured from this teaching selection.",
      ],
      references: ["ctOrientation", "sports"],
    },
    mri: {
      body: "MRI adds marrow and surrounding soft-tissue information that a bone surface cannot show. Marrow signal depends on the sequence; a highlighted mesh does not represent oedema or perfusion.",
      bullets: [
        "Localise proximal-pole, waist and distal findings separately when comparing a real study.",
        "Do not equate marrow oedema alone with a visible fracture line, or infer proximal-pole viability from this model.",
      ],
      references: ["sports"],
    },
  },
  lunate: {
    xray: {
      body: "On a properly positioned lateral wrist image, inspect radius–lunate–capitate alignment. On a frontal image, follow the carpal contours rather than judging the lunate in isolation.",
      bullets: [
        "Projection affects apparent shape; do not assign a morphology type from one silhouette.",
        "Atlas separation changes alignment deliberately and must not be interpreted as carpal instability.",
      ],
      references: ["radiographs", "lunateShape"],
    },
    ct: {
      body: "Different sections through one lunate can suggest different shapes. Use multiplanar relationships rather than a single section to understand its surfaces.",
      bullets: [
        "A CT study of healthy wrists demonstrated section-dependent shape classification; its measurements are not norms assigned to this source.",
        "The atlas does not adjudicate articular facets, subchondral plates or a patient-specific lunate type.",
      ],
      references: ["lunateShape"],
    },
    mri: {
      body: "Separate lunate marrow assessment from the nearby scapholunate and lunotriquetral intervals. Bone appearance alone does not describe ligament integrity.",
      bullets: [
        "Fluid-sensitive signal is contextual, not a standalone diagnosis of osteonecrosis or impaction.",
        "Missing ligament/cartilage surfaces are unmodelled tissues, not proof of injury or normality.",
      ],
      references: ["sports", "lunateShape"],
    },
  },
  ulnarProximal: {
    xray: {
      body: "The pisiform overlaps the triquetrum on a frontal view but lies palmar to it. A lateral or oblique comparison helps separate these relationships.",
      bullets: [
        "Look beyond the scaphoid: nonscaphoid carpal injuries also occur and may be inconspicuous.",
        "Do not turn a source seam or a deliberately displaced bone into a fracture example.",
      ],
      references: ["radiographs", "nonscaphoid"],
    },
    ct: {
      body: "Cross-sectional images separate the triquetral body from the pisiform and their joint. A source surface view cannot replace the cortical detail in serial CT sections.",
      bullets: [
        "Keep palmar pisiform and dorsal triquetral findings anatomically distinct.",
        "No fragment, joint-space width or continuity finding is supplied by hiding neighbouring surfaces.",
      ],
      references: ["ctOrientation", "nonscaphoid"],
    },
    mri: {
      body: "MRI can show marrow and associated soft-tissue abnormalities around an injured carpal bone. The two selected bones should remain separately identified across planes.",
      bullets: [
        "Bone injury may accompany other wrist injuries; reviewing one selection is not a complete wrist examination.",
        "The source does not segment the pisotriquetral cartilage or prove the integrity of adjacent ligament attachments.",
      ],
      references: ["nonscaphoid"],
    },
  },
  radialDistal: {
    xray: {
      body: "Trace the thumb and index metacarpal bases back to their respective distal-row bones. The similar names trapezium and trapezoid should not substitute for this spatial check.",
      bullets: [
        "Overlapping contours can conceal a trapezoid injury on routine radiographs.",
        "No metacarpal-base fracture or joint degeneration is encoded in this unchanged source model.",
      ],
      references: ["radiographs", "trapezoid"],
    },
    ct: {
      body: "Multiplanar CT separates crowded distal-row surfaces and their metacarpal relationships. Assess source images, not only a rendered outer shell.",
      bullets: [
        "A small trapezoid case series included an injury not identified on CT; no modality is made infallible here.",
        "This mesh contains neither CT attenuation nor a validated articular step-off measurement.",
      ],
      references: ["ctOrientation", "trapezoid"],
    },
    mri: {
      body: "MRI may demonstrate a fracture with surrounding marrow change when a small distal-row injury is occult on radiography. A four-case trapezoid series illustrates this limitation, not a universal sensitivity estimate.",
      bullets: [
        "Distinguish the trapezoid from adjacent trapezium, scaphoid and metacarpal findings.",
        "Real ligament, cartilage and tendon interpretation needs suitable acquired sequences; these tissues are not supplied by a bone selection.",
      ],
      references: ["trapezoid"],
    },
  },
  centralDistal: {
    xray: {
      body: "Check the central capitate separately from the ulnar hamate. The palmar hamate hook can be obscured by overlap on standard wrist projections.",
      bullets: [
        "A hook abnormality can be missed despite an apparently intact hamate body.",
        "A model camera preset is not a validated carpal-tunnel projection or a diagnostic positioning test.",
      ],
      references: ["radiographs", "sports", "hamate"],
    },
    ct: {
      body: "CT can separate the hamate hook from the body and nearby carpal surfaces. Follow its attachment in more than one plane instead of relying on one projected contour.",
      bullets: [
        "Keep capitate and hamate findings separate even when they occur in a combined injury.",
        "Source geometry does not establish a hook fracture, union, bipartite variant or safe surgical corridor.",
      ],
      references: ["ctOrientation", "nonscaphoid", "hamate"],
    },
    mri: {
      body: "MRI provides marrow and soft-tissue context around the capitate and hamate. Signal around the hook is not equivalent to a fracture demonstrated in its cortex.",
      bullets: [
        "Review adjacent findings in a real study without assuming they belong to the same bone.",
        "No median/ulnar nerve course, tendon lesion or carpal-tunnel contents are validated by selecting these bone surfaces.",
      ],
      references: ["sports", "hamate"],
    },
  },
};
