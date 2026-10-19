// Original teaching synthesis for both dorsal venous arches; links are reading references only.
export const footVenousArchImagingTopics = {
  ct: {
    title: 'Dorsal venous arch · CT',
    body: 'The selected arch is a superficial venous pathway across the dorsum of the foot, with medial and lateral routes towards the saphenous veins. A generic foot CT or this atlas mesh does not show that the arch was opacified. Direct lower-limb CT venography can map superficial venous anatomy, but the cited review does not establish reliable visibility of this exact arch on every examination.',
    bullets: [
      'On an actual venogram, inspect source sections before accepting a projected vessel as the arch; follow any visible connection towards the medial and lateral foot margins.',
      'Keep the superficial dorsal pathway distinct from plantar or deep veins. A disconnected or unenhanced segment is not proof of an absent vessel or occlusion.',
    ],
    citations: [
      'https://pubmed.ncbi.nlm.nih.gov/23155152/',
      'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-lower-limb/',
    ],
  },
  mri: {
    title: 'Dorsal venous arch · MRI',
    body: 'An ankle MRI rendering study showed superficial veins, including a dorsal venous arch, in its results. That observation demonstrates possible depiction under its research acquisition and rendering conditions; it does not promise visibility on routine MRI or validate the shape of this atlas selection. Review the actual image data and planes when relating a suspected vein to dorsal soft tissues.',
    bullets: [
      'Use source sections to confirm the superficial course and continuity where resolved; an opacity setting can expose or hide a structure in a 3D rendering.',
      'Do not treat an unseen arch as an MRI diagnostic cutoff, infer flow from a static reconstruction, or transfer measurements from the study to this mesh.',
    ],
    citations: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC2780576/'],
  },
  ultrasound: {
    title: 'Dorsal venous arch · Ultrasound',
    body: 'High-frequency ultrasound can examine a superficial dorsal-foot vein in relation to the extensor hallucis longus tendon. In one published case of medial marginal vein and dorsal arch thrombosis, the affected vein was noncompressible and lacked colour flow; the opposite, healthy side provided a comparison. This case illustrates anatomy and combined findings, not a tested screening rule or accuracy estimate.',
    bullets: [
      'Trace a suspected arch segment along the dorsum towards the marginal veins, using its vessel continuity and position to distinguish it from a tendon.',
      'Assess compressibility together with grayscale appearance and Doppler under suitable settings. Absent colour alone neither establishes thrombosis nor identifies a deep plantar vein.',
    ],
    citations: [
      'https://pubmed.ncbi.nlm.nih.gov/31919813/',
      'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-lower-limb/',
    ],
  },
} as const;
