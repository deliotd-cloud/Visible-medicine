import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface OrbitalMuscleLesson {
  key: string;
  fmaIds: readonly [string, string];
  target: 'globe' | 'upper-eyelid';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  gazeNote?: string;
  caution?: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const general = books + 'NBK519565/';
const movements = books + 'NBK10793/';
const ring = 'Common tendinous ring at the orbital apex.';
const upperIII = 'Superior division of the oculomotor nerve (CN III).';
const lowerIII = 'Inferior division of the oculomotor nerve (CN III).';

// Explicit source pairs: left first, right second. No names or numeric ranges
// are used to infer source identity at runtime.
export const orbitalMuscleLessons: readonly OrbitalMuscleLesson[] = [
  {
    key: 'medial-rectus',
    fmaIds: ['FMA49057', 'FMA49056'],
    target: 'globe',
    origin: ring,
    insertion: 'Anterior sclera on the nasal side of the globe.',
    action: 'Adducts the eye: turns its gaze towards the nose.',
    motorSupply: lowerIII,
    references: [general, movements],
  },
  {
    key: 'lateral-rectus',
    fmaIds: ['FMA49055', 'FMA49054'],
    target: 'globe',
    origin: ring,
    insertion: 'Anterior sclera on the temporal side of the globe.',
    action: 'Abducts the eye: turns its gaze away from the nose.',
    motorSupply: 'Abducens nerve (CN VI).',
    references: [general, movements],
  },
  {
    key: 'superior-rectus',
    fmaIds: ['FMA49045', 'FMA49044'],
    target: 'globe',
    origin: ring,
    insertion: 'Anterior sclera on the upper surface of the globe.',
    action:
      'From straight-ahead gaze, elevates the eye with additional intorsion and adduction.',
    motorSupply: upperIII,
    gazeNote: 'Its elevating contribution is emphasized with the eye abducted.',
    references: [books + 'NBK526067/', general, movements],
  },
  {
    key: 'inferior-rectus',
    fmaIds: ['FMA49047', 'FMA49046'],
    target: 'globe',
    origin: ring,
    insertion: 'Anterior sclera on the lower surface of the globe.',
    action:
      'From straight-ahead gaze, depresses the eye with additional extorsion and adduction.',
    motorSupply: lowerIII,
    gazeNote:
      'Its depressing contribution is emphasized with the eye abducted.',
    references: [general, books + 'NBK217/', movements],
  },
  {
    key: 'superior-oblique',
    fmaIds: ['FMA49053', 'FMA49052'],
    target: 'globe',
    origin:
      'Sphenoid at the superomedial orbital apex, outside the common tendinous ring.',
    insertion:
      'Posterior sclera after its tendon turns through the trochlea and passes beneath superior rectus.',
    action:
      'Intorts the eye, with depression and abduction also contributing to its action.',
    motorSupply: 'Trochlear nerve (CN IV).',
    gazeNote:
      'Its depressing contribution is emphasized with the eye adducted.',
    caution:
      'The trochlea and reflected tendon course are teaching relationships, not a newly segmented pulley or validated tendon footprint.',
    references: [books + 'NBK537152/', general, movements],
  },
  {
    key: 'inferior-oblique',
    fmaIds: ['FMA49051', 'FMA49050'],
    target: 'globe',
    origin:
      'Anterior medial orbital floor, lateral to the nasolacrimal groove.',
    insertion: 'Posterior inferolateral sclera beneath lateral rectus.',
    action:
      'Extorts the eye, with elevation and abduction also contributing to its action.',
    motorSupply: lowerIII,
    gazeNote: 'Its elevating contribution is emphasized with the eye adducted.',
    caution:
      'Unlike the recti, it does not arise from the orbital-apex tendinous ring.',
    references: [books + 'NBK545253/', general, movements],
  },
  {
    key: 'levator-palpebrae-superioris',
    fmaIds: ['FMA49049', 'FMA49048'],
    target: 'upper-eyelid',
    origin: 'Lesser wing of the sphenoid above the optic canal.',
    insertion:
      'Through the levator aponeurosis into upper-eyelid skin and the anterior upper tarsal plate.',
    action: 'Raises the upper eyelid; it does not rotate the eyeball.',
    motorSupply: upperIII,
    caution:
      'Do not equate this skeletal muscle with the sympathetically supplied superior tarsal smooth muscle. The selected surface does not validate separate aponeurotic or eyelid layers.',
    references: [books + 'NBK536921/', general],
  },
];
const byFma = new Map(
  orbitalMuscleLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function orbitalMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('head-neck')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Attachments' : 'Action & motor supply'} · draft`,
    body:
      tab === 'anatomy'
        ? 'Typical attachments are described here, not measured insertion distances or verified footprints on the source surface.'
        : l.action,
    bullets:
      tab === 'anatomy'
        ? [
            `Origin: ${l.origin}`,
            `Insertion: ${l.insertion}`,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}.`,
          ]
        : [
            `Motor supply: ${l.motorSupply}`,
            ...(l.gazeNote ? [l.gazeNote] : []),
            ...(l.target === 'globe'
              ? [
                  'Intorsion turns the upper pole towards the nose; extorsion turns it away. Gaze direction is anatomical, not screen left/right.',
                ]
              : []),
            'Named nerve branches are teaching references; this entry does not map their motor territories.',
          ],
    note: [
      'Draft teaching; independent anatomical and clinical review pending.',
      'The static mesh is not a gaze, muscle-force or diagnostic simulation.',
      l.caution,
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
