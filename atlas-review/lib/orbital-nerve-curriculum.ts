import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface OrbitalNerveLesson {
  key: string;
  fmaIds: readonly string[];
  origin: string;
  course: string;
  function: string;
  distinction: string;
  caution: string;
  references: readonly string[];
}
const ophthalmic =
  'https://www.kenhub.com/en/library/anatomy/the-ophthalmic-branch-of-the-trigeminal-nerve';
const orbit = 'https://www.kenhub.com/en/library/anatomy/nerves-of-the-orbit';
const face =
  'https://www.kenhub.com/en/library/anatomy/superficial-nerves-of-the-face-and-scalp';
const oculomotor =
  'https://www.kenhub.com/en/library/anatomy/the-oculomotor-nerve';
const ciliary = 'https://www.ncbi.nlm.nih.gov/books/NBK553182/';
const eye =
  'https://www.kenhub.com/en/library/anatomy/blood-vessels-and-nerves-of-the-eye';

// Original brief teaching; exact admitted identities, not newly inferred branches.
export const orbitalNerveLessons: readonly OrbitalNerveLesson[] = [
  {
    key: 'ophthalmic',
    fmaIds: ['FMA52623', 'FMA52622'],
    origin: 'Ophthalmic division of the trigeminal nerve (CN V1).',
    course:
      'Runs from the trigeminal ganglion along the cavernous-sinus lateral wall towards the superior orbital fissure, giving frontal, lacrimal and nasociliary branches.',
    function:
      'Conveys general sensation from upper facial and orbital territories.',
    distinction:
      'This is not the optic nerve (CN II) and does not carry vision.',
    caution:
      'The parent entry does not certify every terminal branch or its sensory territory.',
    references: [ophthalmic, orbit],
  },
  {
    key: 'frontal',
    fmaIds: ['FMA52640', 'FMA52639'],
    origin: 'A branch of CN V1.',
    course:
      'Passes beneath the orbital roof, above levator palpebrae superioris, then divides into supraorbital and supratrochlear nerves.',
    function:
      'Carries sensation from forehead, anterior scalp and upper-eyelid territories through its branches.',
    distinction:
      'Sensory supply is distinct from the facial-nerve branches that move the forehead.',
    caution:
      'The displayed parent surface is not an independently mapped skin territory.',
    references: [ophthalmic, face],
  },
  {
    key: 'supraorbital',
    fmaIds: ['FMA52657', 'FMA52656'],
    origin: 'A terminal branch of the frontal nerve, within CN V1.',
    course:
      'Leaves the orbit at the supraorbital notch or foramen and spreads into the forehead and scalp.',
    function:
      'Provides sensation to the upper eyelid, adjacent conjunctiva, forehead, anterior scalp and frontal sinus.',
    distinction:
      'Its sensory role does not make it the motor nerve of frontalis.',
    caution:
      'Notch/foramen variation and small branch endpoints are not established by this surface; it is not a nerve-block guide.',
    references: [face, ophthalmic],
  },
  {
    key: 'lacrimal',
    fmaIds: ['FMA52630', 'FMA52629'],
    origin: 'A branch of CN V1.',
    course: 'Travels towards the superolateral lacrimal gland.',
    function:
      'Conveys sensation from the gland and lateral upper-eyelid region; it can also convey secretomotor fibres received from a zygomatic-nerve communication.',
    distinction:
      'Those postganglionic parasympathetic fibres come via the pterygopalatine ganglion from a CN VII pathway, not from V1 motor neurons.',
    caution:
      'A selected lacrimal nerve does not establish a complete tear-production circuit or communication variant.',
    references: [ophthalmic, orbit],
  },
  {
    key: 'nasociliary',
    fmaIds: ['FMA52670', 'FMA52669'],
    origin: 'A branch of CN V1.',
    course:
      'Crosses towards the medial orbit over the optic nerve, with ciliary, ethmoidal and infratrochlear connections.',
    function:
      'Carries general sensation from the eye and medial orbital/nasal territories through its branches.',
    distinction:
      'Its sensory root passes through the ciliary ganglion without synapsing; parasympathetic fibres synapse there instead.',
    caution:
      'Named connections are teaching references, not proof that every branch, ganglion or continuous axon is represented.',
    references: [orbit, ophthalmic, ciliary],
  },
  {
    key: 'anterior-ethmoidal',
    fmaIds: ['FMA52677', 'FMA52676'],
    origin: 'A branch of the nasociliary nerve (CN V1).',
    course:
      'Passes via the anterior ethmoidal foramen towards the anterior cranial floor and nasal roof; an external nasal continuation reaches nasal skin.',
    function:
      'Conveys sensation from anterior nasal mucosa and, through its external nasal branch, part of the external nose.',
    distinction: 'General nasal sensation is different from olfaction.',
    caution:
      'Intracranial transitions and terminal continuations require source review; exploded gaps are not anatomical openings.',
    references: [orbit, face, ophthalmic],
  },
  {
    key: 'posterior-ethmoidal',
    fmaIds: ['FMA52716', 'FMA52715'],
    origin: 'A branch of the nasociliary nerve (CN V1).',
    course:
      'Runs medially through the posterior ethmoidal foramen towards the posterior sinus region.',
    function:
      'Provides general sensation to posterior ethmoidal and sphenoidal sinus mucosa.',
    distinction: 'It is not the anterior ethmoidal nerve or a nerve for smell.',
    caution:
      'This description does not validate sinus-wall penetration, a surgical approach or the full terminal distribution.',
    references: [ophthalmic],
  },
  {
    key: 'long-ciliary',
    fmaIds: ['FMA82735', 'FMA82734'],
    origin: 'Branches associated with the nasociliary nerve (CN V1).',
    course:
      'Enter the posterior sclera and continue towards anterior ocular tissues.',
    function:
      'Carry ocular sensory fibres and postganglionic sympathetic fibres involved in pupil dilation.',
    distinction:
      'Do not equate long ciliary nerves with the short ciliary parasympathetic route for pupil constriction and near focusing.',
    caution:
      'The singular source label does not establish a complete count of ciliary branches or fibre-level autonomic segregation.',
    references: [eye, ophthalmic, ciliary],
  },
  {
    key: 'oculomotor-superior',
    fmaIds: ['FMA52575', 'FMA52574'],
    origin: 'Superior division of the oculomotor nerve (CN III).',
    course:
      'Enters the orbit through the superior orbital fissure within the common tendinous ring, then supplies superior rectus and levator palpebrae superioris.',
    function:
      'Drives superior-rectus actions and elevation of the upper eyelid by its levator.',
    distinction:
      'Its two targets move the globe and eyelid respectively; this division is not the inferior division carrying the ciliary-ganglion parasympathetic root.',
    caution:
      'Superior/inferior name the divisions, not a complete description of gaze actions or a tested movement model.',
    references: [oculomotor],
  },
  {
    key: 'oculomotor-inferior',
    fmaIds: ['FMA52577', 'FMA52576'],
    origin: 'Inferior division of CN III.',
    course:
      'Enters through the superior orbital fissure within the tendinous ring, supplying medial rectus, inferior rectus and inferior oblique.',
    function:
      'Controls these three extraocular muscles and carries preganglionic parasympathetic fibres towards the ciliary ganglion.',
    distinction:
      'After synapsing in that ganglion, parasympathetic fibres reach sphincter pupillae and ciliary muscle via short ciliary nerves, supporting pupil constriction and near focusing.',
    caution:
      'The ganglion, short ciliary paths and each muscle endpoint are not validated by selecting this division; no pupil-response simulation is provided.',
    references: [oculomotor, ciliary],
  },
];
const byFma = new Map(
  orbitalNerveLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function orbitalNerveLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'nerves' ||
    !s.regions.includes('head-neck')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Origin & course' : 'Role & fibre pathways'} · draft`,
    body: tab === 'anatomy' ? l.course : l.function,
    bullets:
      tab === 'anatomy'
        ? [
            `Origin: ${l.origin}`,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}.`,
            'Typical course, not a measured or independently validated nerve pathway.',
          ]
        : [l.distinction],
    note: [
      'Draft teaching; independent anatomical and clinical review pending.',
      'Explode and cut controls do not simulate nerve conduction, reflexes or a safe procedure.',
      l.caution,
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
