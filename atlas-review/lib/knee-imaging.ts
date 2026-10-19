import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

// Whole source bones remain whole: these lessons address their knee region.
export const kneeImagingIdentities = [
  {
    fmaId: 'FMA24475',
    side: 'left',
    bone: 'femur',
    file: 'FJ3259',
    sha256: 'd291cc3619c32c68edb9d29e0b755634c2cb85e3db89f0d0b63a316f879ef86d',
  },
  {
    fmaId: 'FMA24487',
    side: 'left',
    bone: 'patella',
    file: 'FJ3275',
    sha256: '768362d04f0f91cea9a28f4aeae9d9f63f3c82450b68d185fa4afefe75d75cc1',
  },
  {
    fmaId: 'FMA24478',
    side: 'left',
    bone: 'tibia',
    file: 'FJ3282',
    sha256: '40e55d7d28f060be61815603ee5eb1c0ba4c2e93af6fed6b5db7ca88d4ed82ef',
  },
  {
    fmaId: 'FMA24474',
    side: 'right',
    bone: 'femur',
    file: 'FJ3365',
    sha256: '5eff0f92905dd45bd0e79b1de0144dc15988c73c683468163255ba1452d58037',
  },
  {
    fmaId: 'FMA24486',
    side: 'right',
    bone: 'patella',
    file: 'FJ3381',
    sha256: 'b513b8cb6b37e3eb4211fd35a4469efdf79de37887a0af8c582efc836a6f6307',
  },
  {
    fmaId: 'FMA24477',
    side: 'right',
    bone: 'tibia',
    file: 'FJ3387',
    sha256: '01879d7310938e82eecc02e1115332497e94085ff5cc1fa8eeee47ad1f5d3578',
  },
] as const;

const references = {
  femur:
    'https://www.orthoinfo.org/diseases--conditions/distal-femur-thighbone-fractures-of-the-knee/',
  tibia:
    'https://www.orthoinfo.org/diseases--conditions/fractures-of-the-proximal-tibia-shinbone/',
  patella:
    'https://www.orthoinfo.org/diseases--conditions/patellar-kneecap-fractures/',
  assessment:
    'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/patella/further-reading/patient-examination',
  ct: 'https://www.radiologyinfo.org/en/info/bodyct',
  mri: 'https://www.radiologyinfo.org/en/info/kneemr',
  ultrasound: 'https://essr.org/content-essr/uploads/2016/10/knee.pdf',
} as const;
type Topic = {
  title: string;
  body: string;
  bullets: readonly string[];
  citations: readonly string[];
};
type Bone = (typeof kneeImagingIdentities)[number]['bone'];
type Modality = 'ct' | 'mri' | 'ultrasound';
const topics: Record<Bone, Partial<Record<Modality, Topic>>> = {
  femur: {
    ct: {
      title: 'Distal femur · CT comparison',
      body: 'The selected surface is the entire femur. For a knee study, concentrate on its lower end above the tibia, with the patella in front; the femoral head belongs to a different joint.',
      bullets: [
        'Orientation task: find the distal condyles in the assembled model, then compare their cross-sectional shape across a real CT series. Confirm the patient side and image orientation first.',
        'Clinical question: CT can clarify a distal femoral fracture, including extension into the knee joint and the number of fragments. A surface rendering alone is not a fracture assessment.',
        'Imaging distinction: CT uses X-rays and can provide multiplanar and 3D reconstructions from acquired data. This atlas surface contains no CT slices or attenuation measurements.',
        'Model limit: Explode separates whole structures for study. It does not create fracture fragments, displacement or an articular step measurement.',
      ],
      citations: [references.femur, references.ct],
    },
    mri: {
      title: 'Distal femur · MRI comparison',
      body: 'Use the distal femur as an orientation landmark for knee MRI. The model outlines the bone; real MRI also examines tissues inside and around it.',
      bullets: [
        'Orientation task: distinguish the condyles beside the tibia from the anterior surface facing the patella. Follow the same region through the acquired series rather than matching a single screenshot.',
        'Clinical question: knee MRI can assess injuries involving bone, cartilage and supporting soft tissues, including fractures not apparent on radiographs.',
        'Sequence check: identify the actual series and orientation before comparing appearances. Atlas colour and opacity controls do not change an MR sequence or simulate marrow signal.',
        'Model limit: the articular cartilage, internal marrow and individual cruciate ligaments are not separately represented here. Empty model space is not evidence that these tissues are absent or normal.',
      ],
      citations: [references.femur, references.mri],
    },
  },
  tibia: {
    ct: {
      title: 'Proximal tibia · CT comparison',
      body: 'Follow the tibia upwards from its shaft to the broad plateau beneath the femur. These notes concern the knee end, not the ankle end of the selected whole bone.',
      bullets: [
        'Orientation task: compare the plateau and underlying proximal bone across the real CT planes, keeping the patient side consistent with the assembled atlas.',
        'Clinical question: CT helps define a proximal tibial fracture. In a plateau injury, ask whether the joint surface is split, depressed or involved in a more complex pattern.',
        'Imaging distinction: multiplanar CT reconstructions contain acquired internal information; the atlas cutaway only hides part of a surface and does not reveal cancellous bone.',
        'Model limit: separation between displayed bones is not a measurement of joint-space loss, plateau depression or instability. No patient-specific fracture or alignment is represented.',
      ],
      citations: [references.tibia, references.ct],
    },
    mri: {
      title: 'Proximal tibia · MRI comparison',
      body: 'Locate the tibial plateau below the femoral condyles before opening a real knee MRI. Use the atlas for the bone relationship, not for internal tissue appearance.',
      bullets: [
        'Clinical question: MRI may reveal an occult plateau injury or associated soft-tissue damage when clinically indicated; it is not a routine requirement for every tibial fracture.',
        'Marrow distinction: an injured bone may show a marrow reaction on MRI. A normal-looking external atlas surface cannot exclude injury inside a patient’s tibia.',
        'Neighbouring tissues: menisci, cartilage and ligaments require their own review on the acquired examination. This bone selection neither segments nor assesses them.',
        'Model limit: no marrow signal, meniscal horn, cruciate attachment footprint or patient measurement is generated by the cutaway or Explode controls.',
      ],
      citations: [references.tibia, references.mri],
    },
  },
  patella: {
    ct: {
      title: 'Patella · CT and radiograph comparison',
      body: 'Find the kneecap in front of the distal femur. Its posterior articular relationship matters when comparing a patient’s fracture images.',
      bullets: [
        'Radiograph context: patellar assessment commonly uses frontal, lateral and patellofemoral views. AO notes that CT is not commonly obtained; these notes are not an instruction to request CT for every injury.',
        'When CT is available: compare the bone across its reconstructed planes. A 3D reconstruction comes from that patient’s CT data, not from this atlas model.',
        'Clinical distinction: the extent of articular injury and comminution can be underestimated on a cursory radiograph review. The intact atlas shape cannot resolve a suspected fracture.',
        'Model limit: Explode is a teaching arrangement, not patellar displacement, and the whole patella mesh does not contain a fracture simulation or separate cartilage layer.',
      ],
      citations: [references.assessment, references.ct],
    },
    mri: {
      title: 'Patella · MRI comparison',
      body: 'Distinguish the anterior kneecap surface from the posterior surface facing the femur. On MRI, the patella is only one part of the patellofemoral and extensor-mechanism assessment.',
      bullets: [
        'Orientation task: relate the patella to the femur behind it and the tibia below it. Check the real series orientation and side markers before comparing views.',
        'Clinical question: MRI may help clarify an uncertain injury of the extensor apparatus. An intact bone surface does not establish that the quadriceps tendon, patellar tendon or retinacula are intact.',
        'Tissue distinction: cartilage covering the posterior patella is a different tissue from the underlying bone. Its appearance and integrity must be assessed on acquired images, not inferred from this surface.',
        'Model limit: the separate cartilage, tendons, retinacula and marrow are not provided by this selection. Rotation cannot demonstrate patellar tracking or automatically locate an MRI slice.',
      ],
      citations: [references.assessment, references.patella, references.mri],
    },
    ultrasound: {
      title: 'Patella · ultrasound landmarks',
      body: 'Use the patella as a surface landmark for the anterior knee. An ultrasound examination evaluates accessible tissues around the bone, not a transparent version of the atlas.',
      bullets: [
        'Neighbouring tendons: the ESSR guide examines the quadriceps tendon above the patella and the patellar tendon below it in longitudinal and transverse views.',
        'Coverage pitfall: patellar tendon pathology may lie away from the midline. A single central long-axis image is not a complete examination.',
        'Access limit: the guideline describes limited access to the medial patellar articular facet; the lateral facet is not visible with that ultrasound approach. Rotating the atlas does not remove acoustic limitations.',
        'Model limit: the prepatellar bursa, retinacula and separate extensor tendons are not segmented here. No ultrasound image, beam, dynamic examination or needle guidance is simulated.',
      ],
      citations: [references.ultrasound, references.assessment],
    },
  },
};

export function kneeImagingLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri' && tab !== 'ultrasound') return undefined;
  const identity = kneeImagingIdentities.find((i) => i.fmaId === s.fmaId);
  if (!identity) return undefined;
  const { side, bone } = identity;
  const region = bone === 'femur' ? 'thigh' : 'leg';
  if (
    s.id !== `vm:anatomy:body:${region}:${side}:bone:${side}-${bone}` ||
    s.name !== `${side === 'left' ? 'Left' : 'Right'} ${bone}` ||
    s.system !== 'skeleton' ||
    s.category !== 'bone' ||
    s.laterality !== side ||
    s.sourceTree !== 'isa' ||
    s.region !== region ||
    s.regions.join('|') !== (bone === 'femur' ? 'thigh|pelvis|leg' : 'leg') ||
    s.bundle !== `${region}-skeleton` ||
    s.nodeName !== identity.fmaId ||
    s.sources.length !== 1 ||
    s.sources[0].file !== identity.file ||
    s.sources[0].sha256 !== identity.sha256
  )
    return undefined;
  const topic = topics[bone][tab];
  if (!topic) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${topic.title} · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    note: 'Original teaching draft; independent anatomical, radiological and educator review pending. No patient images, measurements or registered correspondence are loaded. Imaging selection and interpretation require the responsible clinical team; this is not a diagnostic or scanning-competency assessment.',
  };
}
