import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

// Bind lessons to the retained, complete source surfaces, not name matching.
export const achillesImagingIdentities = [
  {
    fmaId: 'FMA258847',
    side: 'right',
    file: 'FJ1405',
    sha256: '64696f68cd961e4dfb7809ab9899a6777e994ea3bf696213da7a0ac1a507bed9',
  },
  {
    fmaId: 'FMA264844',
    side: 'left',
    file: 'FJ1405M',
    sha256: '192692c7351198ed60745072f921cf10b0a3a73fa25bc2fe2df4fb1c45a449f0',
  },
] as const;

const topics = {
  mri: {
    title: 'MRI comparison guide',
    body: 'Start with the assembled tendon behind the ankle and follow it towards the heel. Use this 3D relationship to orient yourself before reviewing a real MRI; rotating the model does not select an MRI slice.',
    bullets: [
      'Planes: sagittal images follow the tendon along its length; axial images show its cross-section. The referenced university protocol also includes coronal imaging. Check the actual series orientation and side markers rather than assuming that screen-left is patient-left.',
      'Sequences: the referenced protocol combines T1, proton-density and fat-suppressed T2 imaging. These are different acquisitions, not colour presets for this surface. The local imaging team determines the examination protocol.',
      'Clinical question: MRI can help establish the location and extent of a tear and assess alternative injuries. The atlas cannot measure a patient’s tear, retraction or tendon quality.',
      'Model limits: subtendons, paratenon and the tendon–bone insertion microstructure are not separately segmented. A surface cutaway has no MR signal or internal tissue information.',
    ],
    citations: [
      'https://radiology.wisc.edu/wp-content/uploads/2018/11/3T_Achilles.pdf',
      'https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear/',
    ],
  },
  ultrasound: {
    title: 'Ultrasound comparison guide',
    body: 'Use the posterior 3D view to locate the Achilles tendon between the calf and heel. In ultrasound, a long-axis view follows the tendon; a short-axis view crosses it. Neither is produced by the atlas camera.',
    bullets: [
      'Coverage: the ESSR guide follows the tendon from the muscle–tendon junction to its calcaneal insertion in both planes, with attention to its surrounding tissues and bursae. This model does not separately show those envelopes or bursae.',
      'Pitfall: beam angle can create a dark area through anisotropy rather than injury. A trained examiner assesses the appearance across views and probe angles; the atlas does not simulate an ultrasound beam.',
      'Pitfall: an intact plantaris tendon can be mistaken for remaining Achilles fibres after a complete tear. Identifying a nearby cord or an intact-looking atlas surface does not demonstrate Achilles continuity.',
      'Dynamic assessment: real-time ultrasound can assess tendon behaviour with ankle movement. Explode is only a viewing arrangement, not a dynamic test, tear gap or measure of mechanical function.',
    ],
    citations: [
      'https://www.essr.org/content-essr/uploads/2016/10/ankle.pdf',
      'https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear/',
    ],
  },
} as const;

export function achillesImagingLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'mri' && tab !== 'ultrasound') return undefined;
  const identity = achillesImagingIdentities.find((i) => i.fmaId === s.fmaId);
  if (!identity) return undefined;
  if (
    s.id !==
      `vm:anatomy:body:leg:${identity.side}:tendon:${identity.side}-calcaneal-tendon` ||
    s.name !==
      `${identity.side === 'right' ? 'Right' : 'Left'} calcaneal tendon` ||
    s.system !== 'connective' ||
    s.category !== 'tendon' ||
    s.laterality !== identity.side ||
    s.sourceTree !== 'isa' ||
    s.region !== 'leg' ||
    s.regions.join('|') !== 'leg|foot' ||
    s.bundle !== 'leg-connective-gaps' ||
    s.nodeName !== identity.fmaId ||
    s.sources.length !== 1 ||
    s.sources[0].file !== identity.file ||
    s.sources[0].sha256 !== identity.sha256
  )
    return undefined;
  const topic = topics[tab];
  return {
    readiness: 'draft',
    title: `${s.name} · ${topic.title} · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    note: 'Original teaching draft; independent anatomical, radiological and educator review pending. No patient images, measurements or registered correspondence are loaded. This is not a diagnostic report or a scanning competency assessment.',
  };
}
