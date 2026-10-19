import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface ConnectiveLesson {
  fmaIds: readonly string[];
  region: 'head-neck' | 'thorax' | 'forearm' | 'leg';
  category: 'cartilage' | 'ligament';
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const larynx = books + 'NBK538202/';
const cartilage = books + 'NBK553185/';
const costalRole =
  'Connects the rib to the anterior chest framework and contributes flexibility during breathing. Cartilage does not actively contract.';
const costalLimit =
  'Cartilage surface only, not an independently segmented joint cavity or costochondral junction. Age-related calcification, local stiffness and respiratory deformation are not simulated.';
const ligamentLimit =
  'Reference ligament surface only. Exact attachments, fibre architecture and neighbouring spaces require review; this is not a surgical or injection guide.';

// Original bounded teaching, not imported source prose, mesh admission or mechanics.
export const connectiveLessons: readonly ConnectiveLesson[] = [
  {
    fmaIds: ['FMA7875', 'FMA8005'],
    region: 'thorax',
    category: 'cartilage',
    anatomy:
      'Extends the first rib to the manubrium. Its sternal union is usually described as a synchondrosis; adult specimens may show bony fusion or other local variation.',
    function: costalRole,
    distinction:
      costalLimit +
      ' Do not assume the first sternal union behaves like the second sternocostal joint.',
    references: [
      books + 'NBK538328/',
      'https://pubmed.ncbi.nlm.nih.gov/2777528/',
    ],
  },
  {
    fmaIds: ['FMA7886', 'FMA8031'],
    region: 'thorax',
    category: 'cartilage',
    anatomy:
      'Extends the second rib towards the sternal angle, where manubrium and sternal body meet. The sternocostal articulation is normally synovial.',
    function: costalRole,
    distinction:
      costalLimit +
      ' The sternal-angle relationship is teaching context, not an independently validated landmark on this mesh.',
    references: [
      books + 'NBK459336/',
      'https://pubmed.ncbi.nlm.nih.gov/2777528/',
    ],
  },
  {
    fmaIds: [
      'FMA7913',
      'FMA8058',
      'FMA7976',
      'FMA8167',
      'FMA8070',
      'FMA8112',
      'FMA8194',
      'FMA8221',
      'FMA8248',
      'FMA8275',
    ],
    region: 'thorax',
    category: 'cartilage',
    anatomy:
      'The selected third-to-seventh costal cartilage continues its named rib to the sternum. Unlike ribs eight to ten, these ribs have their own direct sternal connections through cartilage.',
    function: costalRole,
    distinction: costalLimit,
    references: [books + 'NBK538328/'],
  },
  {
    fmaIds: ['FMA59503'],
    region: 'head-neck',
    category: 'cartilage',
    anatomy:
      'Cartilaginous anterior part of the nasal septum, continuous with the supporting framework of the external nose. It is not the complete bony and soft-tissue septum.',
    function:
      'Supports the nasal midline and helps maintain the shape of the nasal passages.',
    distinction:
      'A selected cartilage surface does not establish septal straightness, mucosal thickness or nasal airflow. Individual variations and tissue boundaries need review.',
    references: [books + 'NBK541117/'],
  },
  {
    fmaIds: ['FMA59505', 'FMA59506'],
    region: 'head-neck',
    category: 'cartilage',
    anatomy:
      'The major alar, or lower lateral, cartilage contributes to the framework of the nasal tip and nostril region.',
    function:
      'Supports the nasal tip and external nasal-valve region together with adjoining soft tissues.',
    distinction:
      'Medial/intermediate/lateral crura and small accessory cartilages are not independently dissected here. No valve-collapse or airflow simulation is provided.',
    references: [books + 'NBK558970/'],
  },
  {
    fmaIds: ['FMA59512', 'FMA59513'],
    region: 'head-neck',
    category: 'cartilage',
    anatomy:
      'The upper lateral nasal cartilage supports the middle part of the external nose, below the nasal bone and adjoining the cartilaginous septum.',
    function:
      'Helps support the nasal sidewall and contributes to the internal nasal-valve region.',
    distinction:
      'Separate source labels do not prove a natural cleavage plane between lateral and septal cartilage. Valve angle, mucosal swelling and airflow resistance are not modelled.',
    references: [
      books + 'NBK558970/',
      'https://pubmed.ncbi.nlm.nih.gov/33144032/',
    ],
  },
  {
    fmaIds: ['FMA55099'],
    region: 'head-neck',
    category: 'cartilage',
    anatomy:
      'Two laminae join anteriorly around the larynx, leaving the framework open posteriorly. Inferior horns articulate with the cricoid.',
    function:
      'Shields laryngeal structures and provides attachment sites used in vocal-fold positioning.',
    distinction:
      'Thyroid cartilage is not the hormone-secreting thyroid gland. Its joints, attachment footprints and age-related ossification are not independently validated.',
    references: [cartilage],
  },
  {
    fmaIds: ['FMA9615'],
    region: 'head-neck',
    category: 'cartilage',
    anatomy:
      'A complete cartilaginous ring at the lower larynx, with a narrow anterior arch and a broad posterior lamina.',
    function:
      'Supports the airway framework and provides articulations and attachment sites for the laryngeal movement apparatus.',
    distinction:
      'The selected cricoid groups two source files, FJ2440 and FJ2769. Their union and internal boundaries are not independently validated. This is not a patent airway measurement or procedural landmark certification.',
    references: [books + 'NBK539821/'],
  },
  {
    fmaIds: ['FMA55113', 'FMA55114'],
    region: 'head-neck',
    category: 'cartilage',
    anatomy:
      'A paired cartilage on the upper cricoid lamina. Its vocal process attaches to the vocal ligament; its muscular process receives cricoarytenoid muscle attachments.',
    function:
      'Muscle-driven motion at the cricoarytenoid joint changes vocal-fold position for breathing and phonation.',
    distinction:
      'The cartilage is moved by muscles; it does not contract. The selected surface does not establish joint motion, complete attachment footprints or a functioning vocal fold.',
    references: [books + 'NBK513252/'],
  },
  {
    fmaIds: ['FMA55115', 'FMA55116'],
    region: 'head-neck',
    category: 'cartilage',
    anatomy:
      'A small paired cartilage on the arytenoid apex, within the posterior aryepiglottic-fold region.',
    function: 'Contributes support to the posterior laryngeal-inlet framework.',
    distinction:
      'Not an independently moving vocal-fold actuator. The surrounding mucosal fold and joint detail are not reconstructed by this cartilage alone.',
    references: [larynx, cartilage],
  },
  {
    fmaIds: ['FMA55117', 'FMA55118'],
    region: 'head-neck',
    category: 'cartilage',
    anatomy:
      'A small elongated cartilage within the aryepiglottic fold, anterior to the corniculate region; it has no direct cartilage-to-cartilage articulation.',
    function:
      'Supports the aryepiglottic fold and adjacent laryngeal-inlet margin.',
    distinction:
      'Fold support is not independent epiglottic closure. Mucosa, swallowing mechanics and contact with neighbouring tissues remain unvalidated.',
    references: [larynx],
  },
  {
    fmaIds: ['FMA23707', 'FMA23708'],
    region: 'forearm',
    category: 'ligament',
    anatomy:
      'A fibrous sheet between radius and ulna. It contains distinct bands, including a prominent central band, rather than a uniform sheet with identical fibres.',
    function:
      'Contributes to radioulnar stability and load sharing. Load transfer depends on limb position and joint contact; no fixed percentage applies to every situation.',
    distinction:
      'Source class is ligament, but the representation is a membrane complex. Individual bands, insertions and strain are not segmented or simulated. Cadaver load experiments do not validate this mesh as a biomechanical model.',
    references: [
      books + 'NBK544512/',
      'https://pubmed.ncbi.nlm.nih.gov/10913208/',
    ],
  },
  {
    fmaIds: ['FMA35192', 'FMA35193'],
    region: 'leg',
    category: 'ligament',
    anatomy:
      'A fibrous membrane joining tibia and fibula, with distal continuity into the interosseous ligament of the ankle syndesmosis.',
    function:
      'Links the leg bones and provides muscle attachment. Its distal ligamentous continuation contributes to syndesmotic stability.',
    distinction:
      'This membrane is not the entire ankle syndesmosis. Separate ligament bundles, muscle footprints and force-dependent deformation are not reconstructed.',
    references: [books + 'NBK507893/', books + 'NBK547655/'],
  },
  {
    fmaIds: ['FMA49144', 'FMA49145'],
    region: 'head-neck',
    category: 'ligament',
    anatomy:
      'A connective-tissue connection between lateral-rectus-associated fascia and the lateral orbital wall.',
    function:
      'Part of the passive orbital support and restraint system, not the contracting lateral rectus muscle.',
    distinction:
      'The source check-ligament label does not establish a complete rectus pulley, exact excursion limit or active-pulley mechanics. Fibre attachments and neighbouring fascial connections require specialist review.',
    references: ['https://pubmed.ncbi.nlm.nih.gov/16384963/'],
  },
  {
    fmaIds: ['FMA49147', 'FMA49148'],
    region: 'head-neck',
    category: 'ligament',
    anatomy:
      'A connective-tissue connection between medial-rectus-associated fascia and the medial orbital wall.',
    function:
      'Part of the passive orbital support and restraint system, distinct from medial rectus contraction.',
    distinction:
      'This label is not the medial canthal tendon or a complete extraocular pulley. No exact eye-movement limit, surgical plane or force law is established by the surface.',
    references: ['https://pubmed.ncbi.nlm.nih.gov/16384963/'],
  },
  {
    fmaIds: ['FMA55138'],
    region: 'head-neck',
    category: 'ligament',
    anatomy:
      'The thickened midline part of the thyrohyoid membrane between the thyroid cartilage and hyoid body.',
    function:
      'Contributes to the connective suspension linking the larynx with the hyoid; it is not the elevator muscle.',
    distinction:
      ligamentLimit +
      ' Not the complete thyrohyoid membrane or its neurovascular apertures.',
    references: [books + 'NBK532995/'],
  },
  {
    fmaIds: ['FMA55140', 'FMA55141'],
    region: 'head-neck',
    category: 'ligament',
    anatomy:
      'A thickened lateral border of the thyrohyoid membrane linking the superior thyroid horn with the greater hyoid horn.',
    function:
      'Reinforces the lateral hyoid-to-larynx connection while permitting coordinated laryngeal movement.',
    distinction:
      ligamentLimit +
      ' A variable triticeal cartilage is not implied or independently added.',
    references: [
      books + 'NBK532995/',
      'https://www.uomustansiriyah.edu.iq/media/lectures/2/2_2022_12_21%2109_16_56_PM.pdf',
    ],
  },
  {
    fmaIds: ['FMA55227'],
    region: 'head-neck',
    category: 'ligament',
    anatomy: 'Connects the epiglottis to the hyoid bone.',
    function:
      'Provides a hyoid attachment for the epiglottis within the coordinated swallowing apparatus.',
    distinction:
      ligamentLimit +
      ' Source laterality remains unspecified. This ligament alone does not close the airway or prove safe swallowing.',
    references: [larynx],
  },
  {
    fmaIds: ['FMA55230'],
    region: 'head-neck',
    category: 'ligament',
    anatomy:
      'Connects the epiglottic stalk to the internal anterior thyroid cartilage.',
    function:
      'Anchors the epiglottic base to the laryngeal framework rather than independently driving epiglottic movement.',
    distinction:
      ligamentLimit +
      ' Distinct from the hyo-epiglottic attachment and from the vocal ligament.',
    references: [larynx, cartilage],
  },
  {
    fmaIds: ['FMA55237'],
    region: 'head-neck',
    category: 'ligament',
    anatomy:
      'The anterior midline ligament between the cricoid arch and the lower border of the thyroid cartilage.',
    function:
      'Provides a fibrous connection within the cricothyroid framework. It is not the cricothyroid muscle that changes vocal-fold tension.',
    distinction:
      ligamentLimit +
      ' Not the entire conus elasticus or a validated emergency-airway access window.',
    references: [books + 'NBK539821/'],
  },
  {
    fmaIds: ['FMA72309', 'FMA72311'],
    region: 'head-neck',
    category: 'ligament',
    anatomy:
      'A ligament in the stylohyoid chain between the temporal styloid process and the lesser horn of the hyoid.',
    function:
      'Provides a passive connection in the skull-to-hyoid supporting apparatus, distinct from the stylohyoid muscle.',
    distinction:
      ligamentLimit +
      ' Length and ossification vary. This fixed surface does not establish Eagle syndrome or vascular/nerve compression.',
    references: ['https://pubmed.ncbi.nlm.nih.gov/41300292/'],
  },
];
const byFma = new Map(
  connectiveLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function connectiveLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (s.system !== 'connective' || (tab !== 'anatomy' && tab !== 'function'))
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l || s.category !== l.category || !s.regions.includes(l.region))
    return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Structure & connections' : 'Role & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. Boundaries and attachments require independent review.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not tissue interiors, normal joint motion, tissue strain or acquired imaging.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
