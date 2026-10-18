import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
import pins from '../content/shoulder-xray-bindings.json' with { type: 'json' };

export type ShoulderXrayBone = 'scapula' | 'humerus' | 'clavicle';
export const xrayReferences = {
  orientation:
    'https://orthop.washington.edu/patient-care/articles/shoulder/shoulder-basics.html',
  relationships:
    'https://orthop.washington.edu/patient-care/articles/shoulder/evaluation-of-the-rough-shoulder.html',
  landmarks:
    'https://anatomy.ttuhscep.edu/radiology/upper_limb/shoulder_bones.html',
  limitations: 'https://www.radiologyinfo.org/en/info/bonerad',
} as const;
export function pendingXrayLesson(): ContentLesson {
  return {
    readiness: 'pending',
    title: 'X-ray teaching pending',
    body: 'A source-specific X-ray lesson has not yet been authored for this selection. The coloured 3D surface is not a radiograph.',
    note: 'No X-ray image, detector geometry or registered correspondence is loaded. Separate imaging-atlas and lecture access will be checked independently.',
  };
}
export function shoulderXrayLesson(bone: ShoulderXrayBone): ContentLesson {
  const topics = {
    scapula: {
      title: 'Scapula · X-ray orientation',
      body: 'Locate the glenoid, coracoid and scapular spine on the assembled model. AP imaging in the scapular plane and an axillary view show the glenoid–humeral relationship from different directions; a lateral scapular view adds another bony profile.',
      bullets: [
        'Compare the glenoid with the humeral head before isolating the scapula. Separation is a study aid and changes their apparent relationship.',
        'A free-orbit camera is not a prescribed radiographic projection. This surface does not establish a measured joint space or normal alignment.',
      ],
      citations: [
        xrayReferences.landmarks,
        xrayReferences.orientation,
        xrayReferences.relationships,
      ],
    },
    humerus: {
      title: 'Proximal humerus · X-ray orientation',
      body: 'Find the humeral head, neck and glenoid as an assembled relationship. Scapular-plane AP and axillary radiographs provide complementary views; the projected appearance of the humeral neck depends on positioning.',
      bullets: [
        'Use the head and surgical neck as orientation landmarks, not a template for diagnosing a fracture.',
        'The body atlas retains the whole humerus; this lesson concerns its shoulder end. The dedicated shoulder model is cropped. Neither supplies radiographic bone density, cartilage thickness or a patient measurement.',
      ],
      citations: [
        xrayReferences.landmarks,
        xrayReferences.orientation,
        xrayReferences.relationships,
      ],
    },
    clavicle: {
      title: 'Clavicle · X-ray orientation',
      body: 'Identify the clavicle on the shoulder radiograph reference, then relate its lateral end to the acromion in 3D. Focused acromioclavicular and axillary views can examine this articulation from different directions; the appropriate clinical views depend on the question being investigated.',
      bullets: [
        'Keep adjacent bones visible while studying the relationship. An exploded gap is not a radiographic joint space.',
        'Do not interpret the atlas colour as X-ray attenuation. Radiographs provide limited information about individual muscles and tendons; no ligament integrity or joint stability is established here.',
      ],
      citations: [
        xrayReferences.landmarks,
        xrayReferences.relationships,
        xrayReferences.limitations,
      ],
    },
  };
  return {
    ...topics[bone],
    readiness: 'draft',
    note: 'Original orientation draft · independent radiology and anatomy review pending. References open separately; no images are copied or loaded, no acquisition protocol is simulated, and no patient assessment is provided.',
  };
}
const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v)
          .sort()
          .map(
            (k) =>
              `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`,
          )
          .join(',')}}`
      : JSON.stringify(v);
export function bodyXrayLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const source = pins.structures.find((p) => p.id === s.id);
  // Exact independent pins; reject foreign IDs before traversing record data.
  if (!source || canonical(source) !== canonical(s)) return pendingXrayLesson();
  return shoulderXrayLesson(
    source.sourceName.split(' ')[1] as ShoulderXrayBone,
  );
}
