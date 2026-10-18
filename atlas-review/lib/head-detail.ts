import type { AxialGroup, AxialStudy } from './axial-anatomy';

const dentalReference =
  'https://www.dentalcare.com/en-us/ce-courses/ce500/types-of-teeth-and-their-functions';
const orbitalReference =
  'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html';
const dentalCaution =
  'Only whole exterior tooth surfaces are supplied. Enamel, dentine, pulp, root canals, periodontal ligament and gingiva are not separately modelled. Root shapes, tooth positions and occlusion require dental review; no clinical numbering system is assigned.';
const orbitalCaution =
  'Attachment footprints, thickness, tendon continuity and nerve passages have not been independently validated. These surfaces do not establish a surgical plane or an imaging appearance.';

// Original short draft summaries; no third-party diagrams or textbook datasets.
export const headDetailGroups: AxialGroup[] = [
  {
    id: 'incisors',
    name: 'Secondary incisors',
    fmaIds: [
      'FMA55680',
      'FMA55681',
      'FMA55682',
      'FMA55683',
      'FMA57140',
      'FMA57141',
      'FMA57142',
      'FMA57143',
    ],
    anatomy:
      'The source identifies eight secondary incisors: central and lateral entries on each side of the upper and lower arches.',
    function: 'Incisors cut food with their anterior biting edges.',
    caution: dentalCaution,
    references: [dentalReference],
  },
  {
    id: 'canines',
    name: 'Secondary canines',
    fmaIds: ['FMA55686', 'FMA55687', 'FMA55798', 'FMA55799'],
    anatomy:
      'Four source-labelled secondary canines lie between the incisor and premolar groups, one in each side of each arch.',
    function: 'Canines help grasp and tear food.',
    caution: dentalCaution,
    references: [dentalReference],
  },
  {
    id: 'premolars',
    name: 'Secondary premolars',
    fmaIds: [
      'FMA55688',
      'FMA55689',
      'FMA55690',
      'FMA55691',
      'FMA55692',
      'FMA55693',
      'FMA55694',
      'FMA55695',
    ],
    anatomy:
      'Eight source-labelled premolars are available: first and second entries behind each canine group.',
    function: 'Premolars help crush and grind food.',
    caution: dentalCaution,
    references: [dentalReference],
  },
  {
    id: 'molars',
    name: 'First and second secondary molars',
    fmaIds: [
      'FMA55697',
      'FMA55698',
      'FMA55699',
      'FMA55700',
      'FMA55703',
      'FMA55704',
      'FMA55705',
      'FMA55706',
    ],
    anatomy:
      'The source supplies eight first/second molars behind the premolars. Third molars are not included; this is a 28-tooth source subset, not a complete dentition for every adult.',
    function: 'Molars provide broad chewing surfaces for grinding food.',
    caution: dentalCaution,
    references: [dentalReference],
  },
  {
    id: 'orbital-rings',
    name: 'Common tendinous rings',
    fmaIds: ['FMA49072', 'FMA49073'],
    anatomy:
      'The common tendinous ring lies at the orbital apex. The four rectus muscles arise from this tendinous region.',
    function:
      'It provides a shared proximal attachment region for the rectus muscles.',
    caution:
      orbitalCaution +
      ' The view does not contain a complete optic or abducens nerve.',
    references: [orbitalReference],
  },
  {
    id: 'orbital-trochleae',
    name: 'Superior-oblique trochleae',
    fmaIds: ['FMA49067', 'FMA49068'],
    anatomy:
      'The superior-oblique tendon passes through the trochlea, a fibrocartilaginous pulley in the orbit.',
    function:
      'The trochlea redirects the superior-oblique tendon. The displayed mesh is not a simulation of tendon motion.',
    caution: orbitalCaution,
    references: [orbitalReference],
  },
];
export const headDetailGroupFor = (fmaId: string) =>
  headDetailGroups.find((g) => g.fmaIds.includes(fmaId));
export const dentalIds = headDetailGroups.slice(0, 4).flatMap((g) => g.fmaIds);
export const upperDentalIds = [
  'FMA55680',
  'FMA55681',
  'FMA55682',
  'FMA55683',
  'FMA55688',
  'FMA55689',
  'FMA55690',
  'FMA55691',
  'FMA55697',
  'FMA55698',
  'FMA55699',
  'FMA55700',
  'FMA55798',
  'FMA55799',
];
export const lowerDentalIds = dentalIds.filter(
  (id) => !upperDentalIds.includes(id),
);
const archInspect =
  'Rotate to compare the source crown and root surfaces; select any tooth for its full source name. Explode is illustrative separation, not orthodontic movement. No tooth numbering, occlusion or internal tissues have been validated.';
export const headDetailStudySets: AxialStudy[] = [
  {
    id: 'dental-arches',
    title: 'Teeth & jaws',
    regions: ['head-neck'],
    targetFmaIds: dentalIds,
    context: [
      {
        systems: ['skeleton'],
        pattern: '^(mandible|right maxilla|left maxilla)$',
      },
    ],
    view: 'anterior',
    description:
      'A close dental window with 28 individually selectable source teeth, the mandible and maxillae. The rest of the skull and head are set aside.',
    inspect:
      'Teeth are in the Organs system, not Bones. Hide or fade a jaw to inspect root surfaces. Third molars, gingiva and periodontal tissues are absent; this is not a certified occlusal model.',
    landmarks: [
      'upper central secondary incisor',
      'lower secondary canine',
      'second secondary molar',
    ],
  },
  {
    id: 'upper-dental-arch',
    title: 'Upper tooth surfaces',
    regions: ['head-neck'],
    targetFmaIds: upperDentalIds,
    context: [],
    view: 'inferior',
    description:
      'The 14 supplied upper teeth alone, viewed from below. Bone and lower teeth are removed for access to the chewing surfaces.',
    inspect: archInspect,
    landmarks: [
      'upper central secondary incisor',
      'upper secondary canine',
      'upper first secondary molar',
    ],
  },
  {
    id: 'lower-dental-arch',
    title: 'Lower tooth surfaces',
    regions: ['head-neck'],
    targetFmaIds: lowerDentalIds,
    context: [],
    view: 'superior',
    description:
      'The 14 supplied lower teeth alone, viewed from above. Bone and upper teeth are removed for access to the chewing surfaces.',
    inspect: archInspect,
    landmarks: [
      'lower central secondary incisor',
      'lower secondary canine',
      'lower first secondary molar',
    ],
  },
  {
    id: 'orbital-tendinous-rings',
    title: 'Orbital rings & rectus muscles',
    regions: ['head-neck'],
    targetFmaIds: ['FMA49072', 'FMA49073'],
    context: [
      {
        fmaIds: [
          'FMA49044',
          'FMA49045',
          'FMA49046',
          'FMA49047',
          'FMA49054',
          'FMA49055',
          'FMA49056',
          'FMA49057',
          'FMA12514',
          'FMA12515',
        ],
      },
    ],
    view: 'posterior',
    description:
      'The two source rings, four rectus muscles on each side and eyeballs, without the enclosing skull or brain.',
    inspect:
      'Choose a side and inspect from behind; hide the eyeball or a rectus muscle when needed. Do not infer a complete nerve-passage map, attachment footprint or surgical corridor.',
    landmarks: ['common tendinous ring', 'medial rectus', 'superior rectus'],
  },
  {
    id: 'superior-oblique-pulleys',
    title: 'Superior oblique & trochlea',
    regions: ['head-neck'],
    targetFmaIds: ['FMA49067', 'FMA49068'],
    context: [{ fmaIds: ['FMA49052', 'FMA49053', 'FMA12514', 'FMA12515'] }],
    view: 'superior',
    description:
      'A small orbital window with the superior-oblique muscles, their source-labelled trochleae and the eyeballs.',
    inspect:
      'Choose a side, then rotate or hide the eyeball. The source muscle is not independently segmented into belly and tendon; pulley contact and continuity need review. Explode separates objects, not tissue attachments.',
    landmarks: ['trochlea of', 'superior oblique'],
  },
];
