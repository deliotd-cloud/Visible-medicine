import type { ContentTab } from '../app/anatomy-data';

// Shared by FMA45097 and FMA45098. Their source groups have no verified
// medial/lateral hallux-sesamoid component assignment.
const aaos = 'https://www.orthoinfo.org/diseases--conditions/sesamoiditis/';
const variants = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3781258/';
const forefootUs = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9322853/';

export const footSesamoidLessons: Partial<Record<ContentTab, {
  body: string;
  bullets: string[];
  citations: string[];
}>> = {
  anatomy: {
    body: 'A sesamoid sits within a tendon or capsule; an accessory ossicle is an additional bone, often from an unfused ossification centre. Either may be multipartite.',
    bullets: [
      'The plantar first-MTP pair is an example, not this generic group’s verified identity.',
      'Neither component is assigned as medial/tibial or lateral/fibular.',
    ],
    citations: [variants],
  },
  function: {
    body: 'At the first MTP joint, sesamoids smooth the flexor-tendon route, improve leverage and share plantar load.',
    bullets: [
      'This usual apparatus does not prove the source group’s individual attachments, pressure or motion.',
    ],
    citations: [aaos],
  },
  ct: {
    body: 'Acquired multiplanar CT can assess sesamoid location, cortex, fragment configuration and sclerosis, including changes at an articulation.',
    bullets: [
      'Sclerosis alone does not establish osteonecrosis. The mesh has no CT attenuation, fracture line or scan correspondence.',
    ],
    citations: [variants],
  },
  mri: {
    body: 'MRI assesses sesamoid marrow and neighbouring joint, tendon and plantar tissues. Oedema may accompany stress, fracture or degeneration.',
    bullets: [
      'Oedema is nonspecific; correlate cortex, adjacent structures and history. The mesh has no MR signal or tissue interiors.',
    ],
    citations: [variants, forefootUs],
  },
  xray: {
    body: 'Acquired AP and sesamoid views can locate first-MTP ossified parts. Bipartition may resemble fracture when projection obscures margins.',
    bullets: [
      'Smooth corticated edges or an opposite-foot counterpart favour a variant; irregular edges, displacement or swelling raise injury concern. No sign is definitive.',
      'This surface is not a radiograph and identifies neither grouped component.',
    ],
    citations: [aaos, variants],
  },
  ultrasound: {
    body: 'Targeted ultrasound can inspect accessible cortex and adjacent plantar tissues, including cortical interruption or surrounding change.',
    bullets: [
      'It cannot display marrow oedema or all deep surfaces. Probe orientation matters; the mesh is not a sonogram.',
    ],
    citations: [forefootUs],
  },
  pathology: {
    body: 'Sesamoid-region symptoms may reflect repetitive stress, fracture, adjacent tendon or capsular irritation, or articular degeneration. Multipartition may be incidental or symptomatic.',
    bullets: [
      '“Sesamoiditis” labels a syndrome, not one tissue finding. The mesh establishes no pathology.',
    ],
    citations: [aaos, variants],
  },
  clinical: {
    body: 'In a first-MTP example, correlate precise plantar pain, onset, loading or injury history, examination and acquired images. Bone and adjacent tissues may both hurt.',
    bullets: [
      'This selection cannot localise patient symptoms, confirm diagnosis or direct management; component identities remain unresolved.',
    ],
    citations: [aaos, variants],
  },
  quiz: {
    body: 'Question: A first-MTP radiograph shows two smooth, corticated sesamoid parts without clear trauma. Does this prove fracture or identify this mesh’s medial component?',
    bullets: [
      'Answer: Neither. Bipartition is plausible; clinical and imaging context must settle injury.',
      'Rationale: Margins are clues, and this source group has no verified medial/lateral assignment.',
    ],
    citations: [aaos, variants],
  },
};
