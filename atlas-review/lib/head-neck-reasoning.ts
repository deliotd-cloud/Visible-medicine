import type { ReasoningConcept } from './reasoning-questions';

const source = (title: string, file: string) => [
  {
    title: `Loyola University: ${title}`,
    url: `https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/${file}.htm`,
  },
];
const vocalisReference = [
  {
    title: 'UAMS: thyroarytenoid and vocalis anatomy',
    url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-head-and-neck/',
  },
];
const neckAttachmentReference = [{
  title: 'University of Iowa: posterior neck muscle anatomy',
  url: 'https://iowaprotocols.medicine.uiowa.edu/protocols/posterolateral-neck-dissection-and-anatomy',
}];

// Original drafts, not a copied question bank. Multi-part identities bind all
// retained source files in order, without assuming symmetric segmentation.
// Source selections do not simulate gaze, swallowing, voice or nerve function.
export const headNeckReasoningConcepts: readonly ReasoningConcept[] = [
  {
    key: 'neck-anterior-scalene',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA13393', side: 'left', file: 'FJ1570' },
      { fma: 'FMA13392', side: 'right', file: 'FJ1592' },
    ],
    prompt: 'Which neck muscle reaches the scalene tubercle of rib one, rather than the first-rib surface behind the subclavian artery?',
    explanation: 'Anterior scalene attaches at the scalene tubercle. Middle scalene also reaches rib one, but behind the artery; posterior scalene reaches rib two. These landmarks do not define a safe procedural route.',
    distractors: ['neck-middle-scalene', 'neck-posterior-scalene', 'neck-sternocleidomastoid'],
    references: vocalisReference.map(ref => ({ ...ref, title: 'UAMS: neck muscle attachments' })),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'neck-middle-scalene',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA13391', side: 'left', file: 'FJ1571' },
      { fma: 'FMA13390', side: 'right', file: 'FJ1593' },
    ],
    prompt: 'Among these neck muscles, which attaches to rib one behind its subclavian-artery groove, rather than at the scalene tubercle?',
    explanation: 'Middle scalene has this posterior first-rib attachment. Anterior scalene reaches the tubercle, while posterior scalene reaches rib two. Shared rib-elevation actions alone would not distinguish the two first-rib muscles.',
    distractors: ['neck-anterior-scalene', 'neck-posterior-scalene', 'neck-sternocleidomastoid'],
    references: neckAttachmentReference,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'neck-posterior-scalene',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA13389', side: 'left', file: 'FJ1572' },
      { fma: 'FMA13388', side: 'right', file: 'FJ1594' },
    ],
    prompt: 'Which of these scalene muscles usually ends on rib two, distinguishing it from the two scalenes attached to rib one?',
    explanation: 'Posterior scalene reaches rib two. Anterior and middle scalene reach rib one at different sites. This distinguishes the usual attachment pattern, not an individual patient variant or simulated respiratory movement.',
    distractors: ['neck-anterior-scalene', 'neck-middle-scalene', 'neck-sternocleidomastoid'],
    references: neckAttachmentReference,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'neck-sternocleidomastoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA13409', side: 'left', file: 'FJ1573' },
      { fma: 'FMA13408', side: 'right', file: 'FJ1595' },
    ],
    prompt: 'Which muscle connects the manubrium and medial clavicle to the mastoid region and helps turn the face towards the opposite side when acting unilaterally?',
    explanation: 'Sternocleidomastoid combines these attachments with contralateral rotation. The scalene alternatives attach to upper ribs, not the mastoid region. Its source mesh remains one selection; separate heads are not inferred.',
    distractors: ['neck-anterior-scalene', 'neck-middle-scalene', 'neck-posterior-scalene'],
    references: vocalisReference.map(ref => ({ ...ref, title: 'UAMS: sternocleidomastoid anatomy' })),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-medial-rectus',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA49057', side: 'left', file: 'FJ1308' },
      { fma: 'FMA49056', side: 'right', file: 'FJ1359' },
    ],
    prompt:
      'Which rectus muscle adducts the globe and attaches to the medial sclera in front of the equator?',
    explanation:
      'Medial rectus turns the eye towards the nose. Lateral rectus has the opposing horizontal action; neither name describes movement of the eyelid.',
    distractors: [
      'head-lateral-rectus',
      'head-superior-oblique',
      'head-levator-palpebrae',
    ],
    references: [
      ...source('medial rectus', 'mr'),
      ...source('lateral rectus', 'lr'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-lateral-rectus',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA49055', side: 'left', file: 'FJ1304' },
      { fma: 'FMA49054', side: 'right', file: 'FJ1355' },
    ],
    prompt:
      'Which orbital muscle receives abducens nerve (VI) supply and turns the globe away from the nose?',
    explanation:
      'Lateral rectus produces abduction. Its motor supply differs from the oculomotor supply to the other rectus muscles; the question does not imply that the nerve is rendered.',
    distractors: [
      'head-medial-rectus',
      'head-superior-rectus',
      'head-inferior-rectus',
    ],
    references: source('lateral rectus', 'lr'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-superior-rectus',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA49045', side: 'left', file: 'FJ1323' },
      { fma: 'FMA49044', side: 'right', file: 'FJ1374' },
    ],
    prompt:
      'Which muscle supplied by the superior division of oculomotor nerve (III) elevates the globe rather than the upper lid?',
    explanation:
      'Superior rectus acts on the globe. Levator palpebrae shares that nerve division but acts on the upper eyelid, so nerve supply alone would not distinguish them.',
    distractors: [
      'head-levator-palpebrae',
      'head-inferior-oblique',
      'head-superior-oblique',
    ],
    references: [
      ...source('superior rectus', 'sr'),
      ...source('levator palpebrae superioris', 'lps'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-inferior-rectus',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA49047', side: 'left', file: 'FJ1295' },
      { fma: 'FMA49046', side: 'right', file: 'FJ1346' },
    ],
    prompt:
      'Which globe depressor receives inferior-division oculomotor supply and attaches to sclera in front of the equator?',
    explanation:
      'Inferior rectus has this action, supply and anterior attachment combination. Superior oblique can also depress the eye, but receives trochlear supply and attaches behind the equator.',
    distractors: [
      'head-superior-oblique',
      'head-inferior-oblique',
      'head-superior-rectus',
    ],
    references: [
      ...source('inferior rectus', 'ir'),
      ...source('superior oblique', 'so'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-superior-oblique',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA49053', side: 'left', file: 'FJ1322' },
      { fma: 'FMA49052', side: 'right', file: 'FJ1373' },
    ],
    prompt:
      'Which orbital muscle receives trochlear nerve (IV) supply and depresses an adducted eye?',
    explanation:
      'Superior oblique lowers the eye in this gaze position. The word superior in its name is not a rule that its action must be elevation.',
    distractors: [
      'head-inferior-rectus',
      'head-superior-rectus',
      'head-inferior-oblique',
    ],
    references: source('superior oblique', 'so'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-inferior-oblique',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA49051', side: 'left', file: 'FJ1294' },
      { fma: 'FMA49050', side: 'right', file: 'FJ1345' },
    ],
    prompt:
      'Which globe muscle begins on the orbital maxilla near the anterior orbital margin and elevates an adducted eye?',
    explanation:
      'Inferior oblique starts anteriorly and reaches sclera behind the equator. Its origin distinguishes it from the rectus muscles arising at the orbital apex.',
    distractors: [
      'head-inferior-rectus',
      'head-superior-oblique',
      'head-superior-rectus',
    ],
    references: [
      ...source('inferior oblique', 'io'),
      ...source('superior rectus', 'sr'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-levator-palpebrae',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA49049', side: 'left', file: 'FJ1306' },
      { fma: 'FMA49048', side: 'right', file: 'FJ1357' },
    ],
    prompt:
      'Which muscle reaches the upper eyelid and raises it, instead of inserting on the globe to change gaze?',
    explanation:
      'Levator palpebrae superioris raises the upper lid. Eyelid elevation and elevation of the eye itself are different actions; the static model does not animate either.',
    distractors: [
      'head-superior-rectus',
      'head-inferior-oblique',
      'head-medial-rectus',
    ],
    references: source('levator palpebrae superioris', 'lps'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-digastric',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA46293', side: 'left', files: ['FJ1555', 'FJ1560', 'FJ1578'] },
      { fma: 'FMA46292', side: 'right', files: ['FJ1556', 'FJ1579'] },
    ],
    prompt:
      'Which two-bellied hyoid muscle has mylohyoid-nerve supply anteriorly and facial-nerve supply posteriorly?',
    explanation:
      'Digastric combines differently supplied bellies. This question selects the complete retained source entry, not an individual belly; its left and right source component counts differ.',
    distractors: ['head-mylohyoid', 'head-omohyoid', 'head-stylohyoid'],
    references: source('digastric', 'dig'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-geniohyoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA46327', side: 'left', file: 'FJ1559' },
      { fma: 'FMA46326', side: 'right', file: 'FJ1580' },
    ],
    prompt:
      'Which muscle runs from the inferior mental spine of the mandible to the hyoid and receives C1 fibres carried with hypoglossal nerve?',
    explanation:
      'Geniohyoid has this mandibular attachment. Thyrohyoid shares the C1 route but begins at thyroid cartilage; travelling with nerve XII does not make these fibres cranial motor fibres of XII.',
    distractors: ['head-thyrohyoid', 'head-mylohyoid', 'head-stylohyoid'],
    references: [
      ...source('geniohyoid', 'genh'),
      ...source('thyrohyoid', 'thyh'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-mylohyoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA46322', side: 'left', file: 'FJ1562' },
      { fma: 'FMA46321', side: 'right', file: 'FJ1583' },
    ],
    prompt:
      'Which muscle begins along a line on the inner mandible, reaches a midline raphe and hyoid, and supports the floor of the mouth?',
    explanation:
      'Mylohyoid contributes to the muscular floor of the mouth. Geniohyoid has a mental-spine origin instead; their shared association with the hyoid does not make their routes identical.',
    distractors: ['head-geniohyoid', 'head-digastric', 'head-stylohyoid'],
    references: [
      ...source('mylohyoid', 'myl'),
      ...source('geniohyoid', 'genh'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-stylohyoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA45827', side: 'left', file: 'FJ1576' },
      { fma: 'FMA45826', side: 'right', file: 'FJ1598' },
    ],
    prompt:
      'Which muscle starts at the styloid process and helps elevate and retract the hyoid?',
    explanation:
      'Stylohyoid links the styloid region to the hyoid. Geniohyoid instead draws the hyoid forwards; similar distal attachments do not establish identical movement directions.',
    distractors: ['head-geniohyoid', 'head-sternohyoid', 'head-thyrohyoid'],
    references: [
      ...source('stylohyoid', 'styh'),
      ...source('geniohyoid', 'genh'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-omohyoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA13349', side: 'left', file: 'FJ1565' },
      { fma: 'FMA13348', side: 'right', file: 'FJ1586' },
    ],
    prompt:
      'Which hyoid depressor follows a route from the scapular region rather than starting on the manubrium?',
    explanation:
      'Omohyoid has the scapular origin. It remains one source selection on each side; this question does not introduce separately selectable bellies or a new tendon.',
    distractors: ['head-sternohyoid', 'head-sternothyroid', 'head-thyrohyoid'],
    references: source('omohyoid', 'omo'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-sternohyoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA13347', side: 'left', file: 'FJ1574' },
      { fma: 'FMA13346', side: 'right', file: 'FJ1596' },
    ],
    prompt:
      'Which strap muscle has a manubrial attachment and reaches the hyoid directly rather than ending on thyroid cartilage?',
    explanation:
      'Sternohyoid connects the sternal region with the hyoid and helps depress it. Sternothyroid has a different superior endpoint on thyroid cartilage.',
    distractors: ['head-sternothyroid', 'head-omohyoid', 'head-thyrohyoid'],
    references: [
      ...source('sternohyoid', 'steh'),
      ...source('sternothyroid', 'sthr'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-sternothyroid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA13351', side: 'left', file: 'FJ1575' },
      { fma: 'FMA13350', side: 'right', file: 'FJ1597' },
    ],
    prompt:
      'Which muscle runs from the manubrium to the oblique line of thyroid cartilage and depresses the larynx?',
    explanation:
      'Sternothyroid reaches cartilage rather than attaching directly to the hyoid. Its name must not be read as an attachment to the thyroid gland.',
    distractors: ['head-sternohyoid', 'head-thyrohyoid', 'head-omohyoid'],
    references: source('sternothyroid', 'sthr'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-thyrohyoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA13353', side: 'left', file: 'FJ1577' },
      { fma: 'FMA13352', side: 'right', file: 'FJ1599' },
    ],
    prompt:
      'Which short muscle spans thyroid cartilage and hyoid, with C1 fibres travelling alongside hypoglossal nerve?',
    explanation:
      'Thyrohyoid joins these two attachments. Geniohyoid shares this C1 route but reaches the mandible; nerve supply is therefore only part of the clue.',
    distractors: ['head-geniohyoid', 'head-sternothyroid', 'head-sternohyoid'],
    references: [
      ...source('thyrohyoid', 'thyh'),
      ...source('geniohyoid', 'genh'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-posterior-cricoarytenoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA46578', side: 'left', file: 'FJ2782' },
      { fma: 'FMA46577', side: 'right', file: 'FJ2800' },
    ],
    prompt:
      'Which muscle runs from posterior cricoid to an arytenoid muscular process and abducts the vocal fold?',
    explanation:
      'Posterior cricoarytenoid contributes to opening the glottis. Lateral cricoarytenoid also reaches the muscular process, but has the opposing adducting action.',
    distractors: [
      'head-lateral-cricoarytenoid',
      'head-thyroarytenoid',
      'head-oblique-arytenoid',
    ],
    references: [
      ...source('posterior cricoarytenoid', 'pcay'),
      ...source('lateral cricoarytenoid', 'lcri'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-lateral-cricoarytenoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA46581', side: 'left', file: 'FJ2778' },
      { fma: 'FMA46580', side: 'right', file: 'FJ2796' },
    ],
    prompt:
      'Which vocal-fold adductor starts on the lateral cricoid arch and reaches the arytenoid muscular process?',
    explanation:
      'Lateral cricoarytenoid has this origin and insertion. Shared laryngeal motor supply alone cannot distinguish it from muscles with different attachments or actions.',
    distractors: [
      'head-posterior-cricoarytenoid',
      'head-vocalis',
      'head-oblique-arytenoid',
    ],
    references: source('lateral cricoarytenoid', 'lcri'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-oblique-arytenoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA46585', side: 'left', file: 'FJ2780' },
      { fma: 'FMA46584', side: 'right', file: 'FJ2798' },
    ],
    prompt:
      'Which muscle crosses from an arytenoid muscular process towards the upper part of the opposite arytenoid?',
    explanation:
      'Oblique arytenoid crosses between the cartilages. A retained left or right source label does not mean that both attachments must lie on that side.',
    distractors: [
      'head-lateral-cricoarytenoid',
      'head-posterior-cricoarytenoid',
      'head-thyroarytenoid',
    ],
    references: source('oblique arytenoid', 'oary'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-thyroarytenoid',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA46590', side: 'left', files: ['FJ2784', 'FJ2785'] },
      { fma: 'FMA46589', side: 'right', files: ['FJ2802', 'FJ2803'] },
    ],
    prompt:
      'Which muscle begins inside thyroid cartilage and draws arytenoid forwards, helping shorten and relax the vocal fold?',
    explanation:
      'Thyroarytenoid follows this thyroid-to-arytenoid route. Its complete retained source entry is selected; vocalis is related medial anatomy, not an interchangeable whole-muscle answer.',
    distractors: [
      'head-posterior-cricoarytenoid',
      'head-lateral-cricoarytenoid',
      'head-oblique-arytenoid',
    ],
    references: [...source('thyroarytenoid', 'thar'), ...vocalisReference],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'head-vocalis',
    region: 'head-neck',
    bindings: [
      { fma: 'FMA46593', side: 'left', file: 'FJ2788' },
      { fma: 'FMA46592', side: 'right', file: 'FJ2806' },
    ],
    prompt:
      'Which named medial part of thyroarytenoid lies alongside the vocal ligament and contributes to fine tension adjustment?',
    explanation:
      'Vocalis denotes this medial component. The atlas retains its separate source selection, but that does not make it anatomically unrelated to thyroarytenoid or simulate vocal-fold vibration.',
    distractors: [
      'head-posterior-cricoarytenoid',
      'head-lateral-cricoarytenoid',
      'head-oblique-arytenoid',
    ],
    references: vocalisReference,
    readiness: 'draft',
    revision: 1,
  },
];
