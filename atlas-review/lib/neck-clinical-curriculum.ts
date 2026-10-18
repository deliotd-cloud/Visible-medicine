import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type NeckClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
];
interface NeckClinicalGroup {
  key: string;
  identities: readonly NeckClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const neckClinicalGroups: readonly NeckClinicalGroup[] = [
  {
    key: 'subclavius',
    identities: [
      ['FMA13412', 'right', 'isa', ['FJ1460'], 'head-neck', ['head-neck']],
      ['FMA13411', 'left', 'isa', ['FJ1460M'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Navigation retains the source head-neck membership, but subclavius is a shoulder-girdle muscle. No costoclavicular pressure or plexus compression is modelled.',
    pathology: {
      body: 'Thoracic-outlet symptoms may involve nerves or blood vessels; a painful subclavicular region does not establish subclavius disease.',
      bullets: [
        'A swollen, warm, painful arm can indicate a clot and needs urgent assessment; in the UK contact an urgent GP service or NHS 111.',
      ],
    },
    clinical: {
      body: 'Use the muscle beneath the clavicle as an orientation landmark, not evidence that the underlying passage is open or compressed.',
      bullets: [
        'An explode gap is artificial and must not be measured as the costoclavicular space.',
      ],
    },
    references: ['https://www.nhs.uk/conditions/thoracic-outlet-syndrome/'],
  },
  {
    key: 'cervical-rotator',
    identities: [
      ['FMA81752', 'right', 'isa', ['FJ1524'], 'spine', ['spine', 'head-neck']],
      ['FMA81753', 'left', 'isa', ['FJ1524M'], 'spine', ['spine', 'head-neck']],
    ],
    scope:
      'Regional cervical-rotator representation with variable slips; one file is not one muscle slip. Thoracic levels and precise rotation actions are not transferred to it.',
    pathology: {
      body: 'Local pain after a sudden neck movement does not identify an injured cervical rotator.',
      bullets: [
        'Whiplash symptoms can involve several tissues; the normal reference mesh cannot grade a strain or exclude a fracture.',
      ],
    },
    clinical: {
      body: 'Relate these deep regional surfaces to neighbouring vertebrae while keeping muscle and ligament identities distinct.',
      bullets: [
        'After neck injury, weakness, tingling or difficulty walking needs urgent assessment, not a conclusion based on the displayed muscle.',
      ],
    },
    references: ['https://www.nhs.uk/conditions/whiplash/'],
  },
  {
    key: 'platysma',
    identities: [
      ['FMA45740', 'left', 'isa', ['FJ1558'], 'head-neck', ['head-neck']],
      ['FMA45739', 'right', 'isa', ['FJ1587'], 'head-neck', ['head-neck']],
    ],
    scope:
      'This facial-expression sheet is not skin, the deep cervical fascia or a complete map of facial-nerve branches.',
    pathology: {
      body: 'A wound breaching platysma is classified as a penetrating neck injury; the skin opening alone does not show which deeper structures are involved.',
      bullets: [
        'Do not probe a wound or infer injury depth from this atlas. Suspected penetrating neck trauma needs emergency assessment.',
      ],
    },
    clinical: {
      body: 'The superficial muscle is an important depth landmark, not a protective barrier around the airway or vessels.',
      bullets: [
        'A hidden platysma surface is a teaching cutaway, not a safe surgical approach.',
      ],
    },
    references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC5849205/'],
  },
  {
    key: 'anterior-scalene',
    identities: [
      ['FMA13393', 'left', 'isa', ['FJ1570'], 'head-neck', ['head-neck']],
      ['FMA13392', 'right', 'isa', ['FJ1592'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Neurogenic and vascular thoracic-outlet problems are different clinical categories, not diagnoses made from a tight-looking scalene.',
      bullets: [
        'Symptoms require examination and appropriate investigation; selected geometry cannot establish the affected structure.',
      ],
    },
    clinical: {
      body: 'The brachial plexus lies in relation to the anterior–middle scalene interval; the phrenic nerve runs on the anterior scalene surface.',
      bullets: [
        'A reference muscle does not validate those nerve courses or provide an interscalene injection route.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK519058/',
      'https://www.nhs.uk/conditions/thoracic-outlet-syndrome/',
    ],
  },
  {
    key: 'middle-scalene',
    identities: [
      ['FMA13391', 'left', 'isa', ['FJ1571'], 'head-neck', ['head-neck']],
      ['FMA13390', 'right', 'isa', ['FJ1593'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Arm symptoms may prompt consideration of thoracic-outlet disease, but proximity to middle scalene does not prove entrapment.',
      bullets: [
        'Neurovascular relationships vary; an apparent mesh contact is not a patient compression site.',
      ],
    },
    clinical: {
      body: 'Middle scalene is a boundary of the interscalene interval, with nearby nerve paths that may pass through or around the muscle.',
      bullets: [
        'Do not infer a nerve territory or a safe needle path from one muscle boundary.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK519058/',
      'https://www.nhs.uk/conditions/thoracic-outlet-syndrome/',
    ],
  },
  {
    key: 'posterior-scalene',
    identities: [
      ['FMA13389', 'left', 'isa', ['FJ1572'], 'head-neck', ['head-neck']],
      ['FMA13388', 'right', 'isa', ['FJ1594'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Pain in the lower lateral neck is not specific for posterior-scalene injury; accessory respiratory activity is not itself disease.',
      bullets: [
        'A static surface cannot measure breathing effort or identify a cause of breathlessness.',
      ],
    },
    clinical: {
      body: 'Its usual second-rib attachment differs from the first-rib attachments of anterior and middle scalene.',
      bullets: [
        'Do not use it as the posterior boundary of the anterior–middle interscalene interval or invent an accessory scalene.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK519058/'],
  },
  {
    key: 'sternocleidomastoid',
    identities: [
      ['FMA13409', 'left', 'isa', ['FJ1573'], 'head-neck', ['head-neck']],
      ['FMA13408', 'right', 'isa', ['FJ1595'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Each side is one source component, not independently segmented sternal/clavicular heads or validated motor territories.',
    pathology: {
      body: 'Cervical dystonia causes involuntary patterned head or neck movement. A torticollis posture is not synonymous with sternocleidomastoid shortening.',
      bullets: [
        'Congenital fibrosis, structural disorders and compensatory postures can mimic dystonia; a static head position is insufficient to distinguish them.',
      ],
    },
    clinical: {
      body: 'For ordinary rotation, compare the opposite-side action of sternocleidomastoid with the same-side action of splenius.',
      bullets: [
        'Dystonic and compensatory activity must be distinguished clinically; the atlas provides neither treatment-muscle selection nor injection instructions.',
      ],
    },
    references: [
      'https://www.aapmr.org/about-physiatry/conditions-treatments/pain-neuromuscular-medicine-rehabilitation/cervical-dystonia',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC4975836/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC6898896/',
    ],
  },
  {
    key: 'longus-capitis',
    identities: [
      ['FMA46310', 'left', 'isa', ['FJ1561'], 'spine', ['spine']],
      ['FMA46309', 'right', 'isa', ['FJ1582'], 'spine', ['spine']],
    ],
    scope:
      'Longus capitis reaches the skull; it is not longus colli. No longus-colli tendon calcification, fluid collection or abscess is reconstructed here.',
    pathology: {
      body: 'Acute calcific longus-colli tendinitis can mimic deep-neck infection, but that condition must not be relabelled as longus-capitis disease.',
      bullets: [
        'Neck pain with swallowing difficulty requires clinical assessment. Calcium deposits and retropharyngeal fluid need patient-specific imaging interpretation.',
      ],
    },
    clinical: {
      body: 'Distinguish the selected skull-reaching muscle from the separate longus colli when orienting the prevertebral region.',
      bullets: [
        'Neither a normal mesh nor a single laboratory result excludes an abscess. No drainage route is supplied.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/32720813/',
      'https://www.ncbi.nlm.nih.gov/books/NBK560569/',
    ],
  },
  {
    key: 'rectus-capitis-anterior',
    identities: [
      ['FMA46314', 'left', 'isa', ['FJ1566'], 'spine', ['spine']],
      ['FMA46313', 'right', 'isa', ['FJ1588'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'A painful or restricted nodding movement is not evidence of an isolated rectus-capitis-anterior lesion.',
      bullets: [
        'Post-traumatic neck symptoms must be assessed across the craniocervical region, not assigned to this small surface alone.',
      ],
    },
    clinical: {
      body: 'This anterior atlanto-occipital muscle is distinct from the posterior suboccipital group.',
      bullets: [
        'Do not transfer posterior C1 suboccipital-nerve teaching to the anterior-ramus supply of the prevertebral muscles.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK560569/',
      'https://www.nhs.uk/conditions/whiplash/',
    ],
  },
  {
    key: 'rectus-capitis-lateralis',
    identities: [
      ['FMA46318', 'left', 'isa', ['FJ1569'], 'spine', ['spine']],
      ['FMA46317', 'right', 'isa', ['FJ1591'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'A head tilt may be muscular, neurological, structural or compensatory; it does not isolate rectus capitis lateralis.',
      bullets: [
        'The normal reference surface cannot distinguish a fixed deformity from abnormal muscle activation.',
      ],
    },
    clinical: {
      body: 'Keep this short lateral atlas-to-occiput muscle distinct from rectus capitis anterior and the posterior suboccipital muscles.',
      bullets: [
        'Its skull-base relationships require patient-specific assessment; no jugular-foramen approach is validated.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK560569/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC6898896/',
    ],
  },
  {
    key: 'rectus-capitis-posterior-major',
    identities: [
      ['FMA32531', 'left', 'isa', ['FJ1567'], 'spine', ['spine']],
      ['FMA32530', 'right', 'isa', ['FJ1589'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Posterior head pain can arise from different mechanisms, including referred cervical pain and occipital neuralgia.',
      bullets: [
        'Tenderness over a suboccipital muscle does not by itself establish either diagnosis.',
      ],
    },
    clinical: {
      body: 'Major is one of the muscular boundaries of the suboccipital triangle; compare it with minor, which is not.',
      bullets: [
        'The nearby vertebral artery and upper cervical nerves make this a relationship lesson, not an injection or operative map.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK567762/',
      'https://ichd-3.org/13-painful-cranial-neuropathies-%20and-other-facial-pains/13-4-occipital-neuralgia/',
    ],
  },
  {
    key: 'rectus-capitis-posterior-minor',
    identities: [
      ['FMA32533', 'left', 'isa', ['FJ1568'], 'spine', ['spine']],
      ['FMA32532', 'right', 'isa', ['FJ1590'], 'spine', ['spine']],
    ],
    scope:
      'The myodural connection is not separately segmented; a displayed muscle does not prove dural traction or an individual headache mechanism.',
    pathology: {
      body: 'Cervical imaging findings can also occur in people without headache, so a visible abnormality does not establish causation.',
      bullets: [
        'Do not infer a headache diagnosis from a proposed myodural mechanism or from the atlas surface.',
      ],
    },
    clinical: {
      body: 'Distinguish minor from the three muscular boundaries of the suboccipital triangle.',
      bullets: [
        'Keep a normal anatomical relationship separate from evidence that a structure is causing symptoms.',
      ],
    },
    references: [
      'https://ichd-3.org/11-headache-or-facial-pain-attributed-to-disorder-of-the-cranium-neck-eyes-ears-nose-sinuses-teeth-mouth-or-other-facial-or-cervical-structure/11-2-headache-attributed-to-disorder-of-the-neck/11-2-1-cervicogenic-headache/',
      'https://www.ncbi.nlm.nih.gov/books/NBK567762/',
    ],
  },
  {
    key: 'obliquus-capitis-superior',
    identities: [
      ['FMA32535', 'left', 'isa', ['FJ1564'], 'spine', ['spine']],
      ['FMA32534', 'right', 'isa', ['FJ1585'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Neck tenderness accompanying headache is not proof of an obliquus-capitis-superior lesion.',
      bullets: [
        'Cervicogenic attribution needs clinical evidence of causation; appearance or location alone is insufficient.',
      ],
    },
    clinical: {
      body: 'Superior reaches the occiput, unlike the C2-to-C1 inferior oblique; both belong to the posterior suboccipital group.',
      bullets: [
        'Explode displacement does not reproduce extension, side-bending or an assessment of joint stability.',
      ],
    },
    references: [
      'https://ichd-3.org/11-headache-or-facial-pain-attributed-to-disorder-of-the-cranium-neck-eyes-ears-nose-sinuses-teeth-mouth-or-other-facial-or-cervical-structure/11-2-headache-attributed-to-disorder-of-the-neck/11-2-1-cervicogenic-headache/',
      'https://www.ncbi.nlm.nih.gov/books/NBK567762/',
    ],
  },
  {
    key: 'obliquus-capitis-inferior',
    identities: [
      ['FMA32537', 'left', 'isa', ['FJ1563'], 'spine', ['spine']],
      ['FMA32536', 'right', 'isa', ['FJ1584'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Occipital neuralgia is a nerve-pain syndrome, not a synonym for an inferior-oblique muscle spasm.',
      bullets: [
        'Shooting scalp pain and nerve-distribution findings require clinical interpretation; muscle tenderness alone is insufficient.',
      ],
    },
    clinical: {
      body: 'The greater occipital nerve has a close relationship to the inferior border of this C2-to-C1 muscle; it is distinct from the C1 motor suboccipital nerve.',
      bullets: [
        'No nerve entrapment or injection trajectory is established by the muscle selection.',
      ],
    },
    references: [
      'https://ichd-3.org/13-painful-cranial-neuropathies-%20and-other-facial-pains/13-4-occipital-neuralgia/',
      'https://www.ncbi.nlm.nih.gov/books/NBK542213/',
    ],
  },
  {
    key: 'splenius-capitis',
    identities: [
      ['FMA22728', 'right', 'isa', ['FJ1545'], 'spine', ['spine']],
      ['FMA22729', 'left', 'isa', ['FJ1545M'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Splenius can participate in cervical dystonia, but an abnormal posture may also include compensatory activity.',
      bullets: [
        'A visually prominent muscle is not necessarily the primary dystonic driver.',
      ],
    },
    clinical: {
      body: 'Compare ipsilateral splenius action with contralateral sternocleidomastoid during ordinary rotation.',
      bullets: [
        'Clinical pattern assessment must consider mixed head/neck movement; no toxin dose, injection site or treatment plan is supplied.',
      ],
    },
    references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4975836/'],
  },
  {
    key: 'splenius-cervicis',
    identities: [
      ['FMA22726', 'right', 'isa', ['FJ1546'], 'spine', ['spine']],
      ['FMA22727', 'left', 'isa', ['FJ1546M'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Pain and stiffness after abrupt neck movement do not distinguish splenius-cervicis strain from adjacent tissue injury.',
      bullets: [
        'The model has no oedema, tear grading or patient motion examination.',
      ],
    },
    clinical: {
      body: 'The cervical selection ends on vertebrae rather than the mastoid; compare it with splenius capitis before interpreting movement.',
      bullets: [
        'An isolated surface cannot reveal whether a movement is limited by pain, weakness or a joint disorder.',
      ],
    },
    references: [
      'https://www.nhs.uk/conditions/whiplash/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'longissimus-capitis',
    identities: [
      ['FMA22754', 'right', 'isa', ['FJ1533'], 'spine', ['spine']],
      ['FMA22756', 'left', 'isa', ['FJ1533M'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Difficulty holding the head upright can reflect neck-extensor weakness rather than excessive activity of an opposing muscle.',
      bullets: [
        'Dropped-head presentations and dystonic flexion are different possibilities; a selected extensor cannot identify the cause.',
      ],
    },
    clinical: {
      body: 'Keep muscle weakness distinct from overactivity when relating this head-reaching extensor to head posture.',
      bullets: [
        'The atlas cannot test strength or diagnose isolated neck-extensor myopathy; clinical examination must consider other involved muscles.',
      ],
    },
    references: [
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC6898896/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'longissimus-cervicis',
    identities: [
      ['FMA22757', 'right', 'isa', ['FJ1534'], 'spine', ['spine']],
      ['FMA22758', 'left', 'isa', ['FJ1534M'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Cervical cord dysfunction must not be dismissed as neck-muscle stiffness when limb coordination is also changing.',
      bullets: [
        'New or worsening combinations of clumsy hands, gait imbalance and limb weakness need emergency assessment. In the UK attend A&E or call 999.',
      ],
    },
    clinical: {
      body: 'Distinguish this cervical extensor from the spinal cord and exiting roots; the location of neck pain does not identify the affected tissue.',
      bullets: [
        'No patient cord compression, neurological examination or diagnostic MRI is shown by selecting a paraspinal muscle.',
      ],
    },
    references: [
      'https://www.royalfree.nhs.uk/patients-and-visitors/patient-information-leaflets/degenerative-cervical-myelopathy',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'semispinalis-capitis',
    identities: [
      ['FMA22876', 'right', 'isa', ['FJ1538'], 'spine', ['spine']],
      ['FMA22877', 'left', 'isa', ['FJ1538M'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Occipital pain may involve an occipital nerve or be referred from cervical structures; semispinalis tenderness alone does not distinguish these.',
      bullets: [
        'A normal reference muscle cannot demonstrate nerve entrapment.',
      ],
    },
    clinical: {
      body: 'The greater occipital nerve travels in relation to semispinalis capitis and inferior oblique; keep that sensory pathway distinct from muscle motor supply.',
      bullets: [
        'These reference relationships do not validate an individual nerve course or a nerve-block target.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK542213/',
      'https://ichd-3.org/13-painful-cranial-neuropathies-%20and-other-facial-pains/13-4-occipital-neuralgia/',
    ],
  },
  {
    key: 'semispinalis-cervicis',
    identities: [
      ['FMA22874', 'right', 'isa', ['FJ1539'], 'spine', ['spine']],
      ['FMA22875', 'left', 'isa', ['FJ1539M'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Neck pain with worsening hand dexterity or walking balance warrants consideration of cord disease, not just a paraspinal muscle problem.',
      bullets: [
        'New combinations of neurological symptoms require emergency assessment; the atlas cannot rule out cervical myelopathy.',
      ],
    },
    clinical: {
      body: 'Cervicis and capitis are separate source identities: the former reaches cervical spines and the latter the skull.',
      bullets: [
        'A shared muscle-family name does not imply identical attachments, nerve branches or clinical deficits.',
      ],
    },
    references: [
      'https://www.royalfree.nhs.uk/patients-and-visitors/patient-information-leaflets/degenerative-cervical-myelopathy',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'iliocostalis-cervicis',
    identities: [
      ['FMA22744', 'right', 'isa', ['FJ1526'], 'spine', ['spine']],
      ['FMA22745', 'left', 'isa', ['FJ1526M'], 'spine', ['spine']],
    ],
    scope:
      'Reference surfaces only: no patient muscle activation, nerve lesion, joint instability or safe procedural corridor is simulated.',
    pathology: {
      body: 'Lower-neck pain after sudden movement can involve muscle injury, but the location does not establish an iliocostalis lesion.',
      bullets: [
        'There is no tear, oedema or contraction simulation in this source surface.',
      ],
    },
    clinical: {
      body: 'This cervical part belongs to the erector-spinae column; its usual lower attachments are on ribs rather than directly on the iliac crest.',
      bullets: [
        'Do not transfer a whole-column attachment description to every named part.',
      ],
    },
    references: [
      'https://www.nhs.uk/conditions/whiplash/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'cervical-interspinales',
    identities: [
      [
        'FMA71309',
        'midline',
        'isa',
        ['FJ1552', 'FJ1552M'],
        'spine',
        ['spine', 'head-neck'],
      ],
    ],
    scope:
      'Bilateral grouped source set: “midline” is a catalog convention, not one unpaired muscle. Per-side fascicles and individual vertebral levels are not separately validated.',
    pathology: {
      body: 'Pain between cervical spinous processes does not establish an interspinal-muscle tear.',
      bullets: [
        'After neck trauma, accompanying limb weakness or altered sensation requires urgent assessment rather than muscle-only attribution.',
      ],
    },
    clinical: {
      body: 'Distinguish a short interspinal muscle from the neighbouring interspinous ligament.',
      bullets: [
        'An explode gap is artificial; it does not demonstrate ligament rupture or vertebral instability.',
      ],
    },
    references: [
      'https://www.nhs.uk/conditions/whiplash/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'lumbar-interspinales',
    identities: [
      ['FMA71307', 'midline', 'isa', ['FJ1550', 'FJ1550M'], 'spine', ['spine']],
    ],
    scope:
      'Bilateral grouped source set: “midline” is a catalog convention, not one unpaired muscle. Per-side fascicles and individual vertebral levels are not separately validated.',
    pathology: {
      body: 'Low-back pain may have muscular, joint, disc or other causes; midline pain does not isolate this muscle set.',
      bullets: [
        'Back pain with new bladder/bowel problems, saddle sensory loss or symptoms in both legs needs emergency assessment; in the UK call 999 or attend A&E.',
      ],
    },
    clinical: {
      body: 'This is the lumbar set, not a cervical selection despite its presence in the shared spine route.',
      bullets: [
        'Grouped short muscles cannot identify a symptomatic segment or exclude cauda-equina compression.',
      ],
    },
    references: [
      'https://www.nhs.uk/conditions/back-pain/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'anterior-cervical-intertransversarii',
    identities: [
      [
        'FMA71442',
        'midline',
        'isa',
        ['FJ1549', 'FJ1549M'],
        'spine',
        ['spine', 'head-neck'],
      ],
    ],
    scope:
      'Bilateral grouped source set: “midline” is a catalog convention, not one unpaired muscle. Per-side fascicles and individual vertebral levels are not separately validated.',
    pathology: {
      body: 'Painful lateral neck movement is a functional complaint, not proof that this anterior intertransverse set is injured.',
      bullets: [
        'No per-level muscle tear or nerve-root lesion is identified by this grouped selection.',
      ],
    },
    clinical: {
      body: 'Keep anterior and posterior cervical intertransverse sets separate when studying the transverse-process region.',
      bullets: [
        'Do not assign a uniform nerve supply or a specific root deficit to all subdivisions; those distinctions remain under review.',
      ],
    },
    references: [
      'https://www.nhs.uk/conditions/whiplash/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'posterior-cervical-intertransversarii',
    identities: [
      [
        'FMA71443',
        'midline',
        'isa',
        ['FJ1553', 'FJ1553M'],
        'spine',
        ['spine', 'head-neck'],
      ],
    ],
    scope:
      'Bilateral grouped source set: “midline” is a catalog convention, not one unpaired muscle. Per-side fascicles and individual vertebral levels are not separately validated.',
    pathology: {
      body: 'A posterior intertransverse muscle selection is not a model of cervical radiculopathy or a localised nerve injury.',
      bullets: [
        'Limb symptoms after neck trauma need assessment beyond the visible paraspinal muscle.',
      ],
    },
    clinical: {
      body: 'The posterior source set is separate from the anterior set, but its individual subdivisions and segmental branches are not labelled.',
      bullets: [
        'Shared lateral-bending function does not validate identical innervation for every component.',
      ],
    },
    references: [
      'https://www.nhs.uk/conditions/whiplash/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'levatores-costarum-breves',
    identities: [
      ['FMA74077', 'right', 'isa', ['FJ1462'], 'spine', ['spine', 'thorax']],
      ['FMA74078', 'left', 'isa', ['FJ1462M'], 'spine', ['spine', 'thorax']],
    ],
    scope:
      'Right and left breves are source groups; individual rib slips are not separately labelled. Longi candidates remain withheld, not inferred from these surfaces.',
    pathology: {
      body: 'Posterior chest pain with breathing cannot be attributed to a short rib-elevator muscle solely because it lies nearby.',
      bullets: [
        'Chest discomfort with breathlessness, sweating or spreading pain needs emergency assessment; in the UK call 999.',
      ],
    },
    clinical: {
      body: 'Compare the short rib-elevator set with the intercostal layers rather than treating them as one muscle group.',
      bullets: [
        'Reference separation does not measure rib motion, respiratory contribution or an injury.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html',
      'https://www.nhs.uk/symptoms/chest-pain/',
    ],
  },
];

const byFma = new Map(
  neckClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function neckClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'muscles' ||
    s.category !== 'muscle'
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions] = match.identity;
  if (
    s.laterality !== side ||
    s.sourceTree !== tree ||
    s.region !== region ||
    !same(s.regions, regions) ||
    !same(
      s.sources.map((p) => p.file),
      files,
    )
  )
    return undefined;
  const { group } = match,
    topic = group[tab];
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'pathology' ? 'Injury & disease' : 'Clinical context'} · draft`,
    body: topic.body,
    bullets: [...topic.bullets, group.scope],
    note: [
      'Draft teaching; independent anatomical and clinical review pending. Educational context, not a patient diagnosis or treatment plan.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...group.references],
  };
}
