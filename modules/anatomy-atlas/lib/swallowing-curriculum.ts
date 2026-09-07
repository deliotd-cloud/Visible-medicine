import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface SwallowingMuscleLesson {
  key: string;
  fmaIds: readonly string[];
  representation?: 'multi-part' | 'midline-group';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  caution?: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const supra = books + 'NBK546710/';
const cervical = books + 'NBK538136/';
const hyoid = books + 'NBK539726/';
const palate = books + 'NBK557817/';
const ansa = 'Ansa cervicalis (cervical spinal nerve fibres).';
const c1 =
  'C1 spinal fibres travelling with the hypoglossal nerve, not motor fibres originating in the hypoglossal nucleus.';
const pharyngeal = 'Vagus nerve (CN X) through the pharyngeal plexus.';

// Exact left/right source identities; the uvular representation is midline.
export const swallowingMuscleLessons: readonly SwallowingMuscleLesson[] = [
  {
    key: 'digastric',
    fmaIds: ['FMA46293', 'FMA46292'],
    representation: 'multi-part',
    origin:
      'Anterior belly: mandibular digastric fossa. Posterior belly: temporal mastoid notch.',
    insertion:
      'Both bellies meet an intermediate tendon held to the hyoid by a fibrous sling.',
    action:
      'Raises the hyoid when the jaw is stable; helps open the jaw when the hyoid is fixed.',
    motorSupply:
      'Anterior belly: nerve to mylohyoid from V3 via the inferior alveolar nerve. Posterior belly: facial nerve (CN VII).',
    caution:
      'The left entry has three source files and the right two. File counts are not belly counts; these notes do not assign individual files to a belly or validate a separate intermediate tendon.',
    references: [books + 'NBK544352/', supra],
  },
  {
    key: 'mylohyoid',
    fmaIds: ['FMA46322', 'FMA46321'],
    origin: 'Mylohyoid line on the inner mandible.',
    insertion: 'Midline mylohyoid raphe and body of the hyoid.',
    action:
      'Elevates the floor of the mouth and hyoid; can help depress the mandible with the hyoid fixed.',
    motorSupply: 'Nerve to mylohyoid, from the inferior alveolar branch of V3.',
    references: [supra, books + 'NBK557475/', hyoid],
  },
  {
    key: 'geniohyoid',
    fmaIds: ['FMA46327', 'FMA46326'],
    origin: 'Inferior mental spine of the mandible.',
    insertion: 'Body of the hyoid.',
    action:
      'Draws the hyoid upwards and forwards; can help depress the mandible when the hyoid is fixed.',
    motorSupply: c1,
    references: [hyoid, cervical],
  },
  {
    key: 'stylohyoid',
    fmaIds: ['FMA45827', 'FMA45826'],
    origin: 'Styloid process of the temporal bone.',
    insertion: 'Hyoid near the body–greater-horn junction.',
    action:
      'Draws the hyoid upwards and backwards during coordinated swallowing.',
    motorSupply: 'Facial nerve (CN VII).',
    caution:
      'Its relationship to the digastric tendon is typical teaching, not a validated tendon passage in this surface.',
    references: [supra, books + 'NBK547653/'],
  },
  {
    key: 'omohyoid',
    fmaIds: ['FMA13349', 'FMA13348'],
    origin:
      'Superior border of the scapula; inferior and superior bellies connect through an intermediate tendon.',
    insertion: 'Inferior border of the hyoid body through the superior belly.',
    action: 'Depresses and helps stabilize the hyoid.',
    motorSupply: ansa,
    caution:
      'The single source component does not independently identify the two bellies, intervening tendon or fascial sling.',
    references: [books + 'NBK538319/', hyoid, cervical],
  },
  {
    key: 'sternohyoid',
    fmaIds: ['FMA13347', 'FMA13346'],
    origin:
      'Posterior manubrium, medial clavicle and sternoclavicular ligament.',
    insertion: 'Inferior border of the hyoid body.',
    action:
      'Lowers the hyoid from an elevated position and helps stabilize it.',
    motorSupply: ansa,
    references: [books + 'NBK547693/', cervical],
  },
  {
    key: 'sternothyroid',
    fmaIds: ['FMA13351', 'FMA13350'],
    origin: 'Posterior manubrium and adjacent first costal cartilage.',
    insertion: 'Oblique line of the thyroid cartilage.',
    action: 'Draws the thyroid cartilage and larynx downwards.',
    motorSupply: ansa,
    caution:
      'Thyroid cartilage is a laryngeal cartilage, not the thyroid gland.',
    references: [
      'https://www.kenhub.com/en/library/anatomy/infrahyoid-muscles',
      cervical,
    ],
  },
  {
    key: 'thyrohyoid',
    fmaIds: ['FMA13353', 'FMA13352'],
    origin: 'Oblique line of the thyroid cartilage.',
    insertion: 'Inferior border of the hyoid body and greater horn.',
    action:
      'Lowers the hyoid when the larynx is stable, or raises the larynx when the hyoid is fixed.',
    motorSupply: c1,
    references: [
      'https://www.kenhub.com/en/library/anatomy/thyrohyoid-muscle',
      cervical,
    ],
  },
  {
    key: 'genioglossus',
    fmaIds: ['FMA46702', 'FMA46698'],
    origin: 'Superior mental spine of the mandible.',
    insertion: 'Tongue substance and hyoid through its spreading fibres.',
    action:
      'Draws the tongue forwards; coordinated bilateral activity also depresses its central region.',
    motorSupply: 'Hypoglossal nerve (CN XII).',
    caution:
      'Fibre-specific actions and tongue deformation are not resolved by this whole-muscle surface.',
    references: [books + 'NBK545141/', books + 'NBK532869/'],
  },
  {
    key: 'hyoglossus',
    fmaIds: ['FMA46704', 'FMA46703'],
    origin: 'Body and greater horn of the hyoid.',
    insertion: 'Side of the tongue.',
    action: 'Depresses and retracts the tongue.',
    motorSupply: 'Hypoglossal nerve (CN XII).',
    caution:
      'This is an extrinsic tongue muscle, not a separately resolved intrinsic fibre layer.',
    references: [books + 'NBK574565/', books + 'NBK532869/'],
  },
  {
    key: 'levator-veli-palatini',
    fmaIds: ['FMA46729', 'FMA46728'],
    origin:
      'Classically described at the petrous temporal region and auditory-tube cartilage.',
    insertion: 'Palatine aponeurosis within the soft palate.',
    action:
      'Elevates the soft palate as part of coordinated closure towards the nasopharynx.',
    motorSupply: pharyngeal,
    caution:
      'Exact proximal attachments and the midline sling require source-specific review; a surface does not demonstrate a competent swallowing seal.',
    references: [palate, books + 'NBK537171/'],
  },
  {
    key: 'tensor-veli-palatini',
    fmaIds: ['FMA46732', 'FMA46731'],
    origin: 'Sphenoid scaphoid fossa and spine, with auditory-tube cartilage.',
    insertion:
      'Palatine aponeurosis after its tendon turns around the pterygoid hamulus.',
    action: 'Tenses the soft palate and assists opening of the auditory tube.',
    motorSupply:
      'Nerve to medial pterygoid from the mandibular division of the trigeminal nerve (V3).',
    caution:
      'The tendon turn is a teaching relationship, not a newly segmented pulley or simulated tube opening.',
    references: [books + 'NBK544302/', palate],
  },
  {
    key: 'uvular-muscle',
    fmaIds: ['FMA46733'],
    representation: 'midline-group',
    origin: 'Posterior nasal spine and palatine aponeurosis.',
    insertion: 'Soft tissues of the uvula.',
    action: 'Shortens the uvula during coordinated palatal movement.',
    motorSupply: pharyngeal,
    caution:
      'One midline source entry does not resolve internal fibre organization or independently selectable left/right bundles.',
    references: [palate],
  },
  {
    key: 'thyro-arytenoid',
    fmaIds: ['FMA46590', 'FMA46589'],
    representation: 'multi-part',
    origin:
      'Inner thyroid cartilage and adjacent median cricothyroid ligament.',
    insertion: 'Arytenoid cartilage.',
    action:
      'Helps approximate and shorten the vocal folds and contributes to their tension control.',
    motorSupply:
      'Recurrent laryngeal branch of the vagus nerve (CN X), through its terminal inferior laryngeal nerve.',
    caution:
      'Each entry groups two source files. They are not independently validated vocalis or vocal-fold layers; voice pitch and vibration cannot be inferred from this static surface.',
    references: [books + 'NBK538202/'],
  },
];
const byFma = new Map(
  swallowingMuscleLessons.flatMap((l) =>
    l.fmaIds.map((id) => [id, l] as const),
  ),
);
export function swallowingMuscleLesson(
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
        ? l.representation
          ? 'A grouped source representation is selected. Typical whole-muscle relationships below do not label individual fibres, bellies or tissue layers.'
          : 'Typical attachments are described below, not measured footprints or a validated motion pathway on this surface.'
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
            'The named nerves are teaching references; this entry does not map their courses or motor territories.',
          ],
    note: [
      'Draft teaching; independent anatomical and clinical review pending.',
      'This static surface does not simulate swallowing, airway protection or phonation.',
      l.caution,
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
