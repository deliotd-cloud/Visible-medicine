export type AtlasModule = {
  slug: string;
  title: string;
  region: string;
  modality: string;
  orientation: string;
  description: string;
  structures: number;
  images: number;
  status: "available" | "preview";
  systems: string[];
  reviewed: string;
};

export type Course = {
  slug: string;
  title: string;
  summary: string;
  level: string;
  duration: string;
  lessons: number;
  publisher: string;
  type: "official" | "institution";
  moduleSlug: string;
  outcomes: string[];
};

export const atlasModules: AtlasModule[] = [
  {
    slug: "ct-head",
    title: "CT head",
    region: "Neuroanatomy",
    modality: "CT",
    orientation: "Axial",
    description: "A guided cross-sectional tour of the brain, ventricles, deep grey nuclei, skull base and major intracranial spaces.",
    structures: 76,
    images: 120,
    status: "available",
    systems: ["Brain", "Ventricles", "Vessels", "Skull"],
    reviewed: "Editorial demonstration · August 2026",
  },
  {
    slug: "mr-knee",
    title: "MRI knee",
    region: "Lower limb",
    modality: "MRI",
    orientation: "Multiplanar",
    description: "Ligaments, menisci, tendons, cartilage and osseous landmarks across standard knee MRI planes.",
    structures: 58,
    images: 96,
    status: "preview",
    systems: ["Bones", "Ligaments", "Menisci", "Tendons"],
    reviewed: "Planned editorial module",
  },
  {
    slug: "ct-chest",
    title: "CT chest",
    region: "Thorax",
    modality: "CT",
    orientation: "Axial",
    description: "Mediastinal compartments, airways, lungs, pleura, heart and major thoracic vessels.",
    structures: 82,
    images: 138,
    status: "preview",
    systems: ["Lungs", "Mediastinum", "Heart", "Vessels"],
    reviewed: "Planned editorial module",
  },
  {
    slug: "ct-abdomen",
    title: "CT abdomen",
    region: "Abdomen",
    modality: "CT",
    orientation: "Axial",
    description: "Solid organs, bowel, retroperitoneum, vessels and abdominal wall in cross-section.",
    structures: 94,
    images: 142,
    status: "preview",
    systems: ["Organs", "Bowel", "Vessels", "Muscles"],
    reviewed: "Planned editorial module",
  },
];

export const courses: Course[] = [
  {
    slug: "foundations-ct-head",
    title: "Foundations of CT head anatomy",
    summary: "Build a reliable search pattern for normal head CT through linked atlas scenes, short explanations and image-based checks.",
    level: "Foundation",
    duration: "75 min",
    lessons: 6,
    publisher: "Elivion Editorial",
    type: "official",
    moduleSlug: "ct-head",
    outcomes: [
      "Orientate a standard axial head CT",
      "Recognise the ventricular system and deep grey nuclei",
      "Follow the major cisterns and intracranial compartments",
      "Use a repeatable anatomy review sequence",
    ],
  },
  {
    slug: "cross-sectional-neuro",
    title: "Cross-sectional neuroanatomy lab",
    summary: "An instructor-led workbook combining saved imaging scenes, polls and short-answer tasks for small-group teaching.",
    level: "Intermediate",
    duration: "2 hours",
    lessons: 8,
    publisher: "Elivion Studio demonstration",
    type: "institution",
    moduleSlug: "ct-head",
    outcomes: [
      "Navigate between related anatomical levels",
      "Compare central and peripheral structures",
      "Answer structured image-localisation questions",
      "Review progress with an educator",
    ],
  },
];

export function findAtlasModule(slug: string) {
  return atlasModules.find((module) => module.slug === slug);
}

export function findCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}
