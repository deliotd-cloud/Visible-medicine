export type AtlasSystem =
  | "Brain"
  | "Ventricles & CSF"
  | "Vessels"
  | "Meninges"
  | "Skull";

export type AtlasStructure = {
  id: string;
  name: string;
  level: number;
  system: AtlasSystem;
  synonyms: string[];
  parent: string;
  description: string;
  relationships: string[];
  terminologyStatus: "Visible Medicine coded" | "External mapping pending";
};

export const ctHeadStructures: AtlasStructure[] = [
  {
    id: "ELV-ANAT-CTH-001",
    name: "Frontal lobe",
    level: 0,
    system: "Brain",
    synonyms: ["Frontal cortex"],
    parent: "Cerebral hemisphere",
    description:
      "The anterior part of the cerebral hemisphere, shown here as an orientation landmark on superior axial head imaging.",
    relationships: ["Falx cerebri", "Superior sagittal sinus"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-002",
    name: "Falx cerebri",
    level: 0,
    system: "Meninges",
    synonyms: ["Cerebral falx"],
    parent: "Dural reflections",
    description:
      "A midline dural fold between the cerebral hemispheres and an important landmark for assessing symmetry.",
    relationships: ["Superior sagittal sinus", "Frontal lobe"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-003",
    name: "Superior sagittal sinus",
    level: 0,
    system: "Vessels",
    synonyms: ["SSS"],
    parent: "Dural venous sinuses",
    description:
      "A midline dural venous sinus running along the superior attached margin of the falx cerebri.",
    relationships: ["Falx cerebri", "Frontal lobe"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-004",
    name: "Lateral ventricle",
    level: 1,
    system: "Ventricles & CSF",
    synonyms: ["Lateral cerebral ventricle"],
    parent: "Ventricular system",
    description:
      "A paired cerebrospinal-fluid space within the cerebral hemispheres, used as a central orientation landmark.",
    relationships: ["Caudate nucleus", "Corpus callosum", "Third ventricle"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-005",
    name: "Caudate nucleus",
    level: 1,
    system: "Brain",
    synonyms: ["Caudate"],
    parent: "Basal nuclei",
    description:
      "A C-shaped deep grey-matter nucleus that closely follows the lateral ventricle.",
    relationships: ["Lateral ventricle", "Internal capsule", "Thalamus"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-006",
    name: "Corpus callosum",
    level: 1,
    system: "Brain",
    synonyms: ["Callosal commissure"],
    parent: "Cerebral commissures",
    description:
      "The major commissural white-matter tract connecting the cerebral hemispheres.",
    relationships: ["Lateral ventricle", "Falx cerebri"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-007",
    name: "Thalamus",
    level: 2,
    system: "Brain",
    synonyms: ["Dorsal thalamus"],
    parent: "Diencephalon",
    description:
      "A paired deep grey-matter structure forming part of the lateral wall of the third ventricle.",
    relationships: ["Third ventricle", "Internal capsule", "Midbrain"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-008",
    name: "Third ventricle",
    level: 2,
    system: "Ventricles & CSF",
    synonyms: ["Ventricle III"],
    parent: "Ventricular system",
    description:
      "A narrow midline cerebrospinal-fluid space between the paired thalami.",
    relationships: ["Thalamus", "Lateral ventricle", "Midbrain"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-009",
    name: "Internal capsule",
    level: 2,
    system: "Brain",
    synonyms: ["Capsula interna"],
    parent: "Cerebral white matter",
    description:
      "A compact white-matter pathway separating the caudate nucleus and thalamus medially from the lentiform nucleus laterally.",
    relationships: ["Caudate nucleus", "Thalamus"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-010",
    name: "Midbrain",
    level: 3,
    system: "Brain",
    synonyms: ["Mesencephalon"],
    parent: "Brainstem",
    description:
      "The superior part of the brainstem between the diencephalon and pons.",
    relationships: ["Ambient cistern", "Pons", "Thalamus"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-011",
    name: "Ambient cistern",
    level: 3,
    system: "Ventricles & CSF",
    synonyms: ["Ambient cistern of brain"],
    parent: "Basal cisterns",
    description:
      "A paired cerebrospinal-fluid cistern curving around the lateral aspect of the midbrain.",
    relationships: ["Midbrain", "Temporal lobe"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-012",
    name: "Temporal lobe",
    level: 3,
    system: "Brain",
    synonyms: ["Temporal cortex"],
    parent: "Cerebral hemisphere",
    description:
      "The inferolateral part of the cerebral hemisphere, adjacent to the middle cranial fossa.",
    relationships: ["Ambient cistern", "Midbrain"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-013",
    name: "Pons",
    level: 4,
    system: "Brain",
    synonyms: ["Pons Varolii"],
    parent: "Brainstem",
    description:
      "The central portion of the brainstem, anterior to the fourth ventricle and superior to the medulla.",
    relationships: ["Fourth ventricle", "Cerebellar peduncle", "Medulla"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-014",
    name: "Fourth ventricle",
    level: 4,
    system: "Ventricles & CSF",
    synonyms: ["Ventricle IV"],
    parent: "Ventricular system",
    description:
      "A cerebrospinal-fluid space between the pons and medulla anteriorly and the cerebellum posteriorly.",
    relationships: ["Pons", "Cerebellum", "Medulla"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-015",
    name: "Cerebellar peduncle",
    level: 4,
    system: "Brain",
    synonyms: ["Cerebellar peduncles"],
    parent: "Cerebellar connections",
    description:
      "One of the paired white-matter pathways connecting the cerebellum with the brainstem.",
    relationships: ["Pons", "Cerebellum", "Fourth ventricle"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-016",
    name: "Cerebellum",
    level: 5,
    system: "Brain",
    synonyms: ["Little brain"],
    parent: "Hindbrain",
    description:
      "The posterior-fossa structure responsible for coordination, visible behind the fourth ventricle and brainstem.",
    relationships: ["Fourth ventricle", "Cerebellar peduncle", "Medulla"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-017",
    name: "Foramen magnum",
    level: 5,
    system: "Skull",
    synonyms: ["Great foramen"],
    parent: "Occipital bone",
    description:
      "The large opening at the skull base through which the lower brainstem continues as the spinal cord.",
    relationships: ["Medulla", "Cerebellum"],
    terminologyStatus: "External mapping pending",
  },
  {
    id: "ELV-ANAT-CTH-018",
    name: "Medulla",
    level: 5,
    system: "Brain",
    synonyms: ["Medulla oblongata"],
    parent: "Brainstem",
    description:
      "The inferior part of the brainstem, continuing through the foramen magnum into the spinal cord.",
    relationships: ["Pons", "Fourth ventricle", "Foramen magnum"],
    terminologyStatus: "External mapping pending",
  },
];

export const ctHeadLevels = Array.from({ length: 6 }, (_, level) =>
  ctHeadStructures.filter((structure) => structure.level === level),
);

export const ctHeadSystems = [
  "All",
  ...Array.from(new Set(ctHeadStructures.map((structure) => structure.system))),
] as const;
