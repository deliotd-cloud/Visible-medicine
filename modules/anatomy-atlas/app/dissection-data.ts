import type { BodyStructure, BodySystem } from './body-types';
import { neuroStudySets, neuroStudyIds } from '../lib/neuroanatomy.ts';
import { axialStudySets } from '../lib/axial-anatomy.ts';
import { headDetailStudySets } from '../lib/head-detail.ts';
import { mesentericStudySets } from '../lib/mesenteric-anatomy.ts';
import { pancreaticStudySets } from '../lib/pancreatic-anatomy.ts';
import { thoracicStudySets } from '../lib/thoracic-anatomy.ts';
import { handVascularStudySets } from '../lib/hand-vascular-anatomy.ts';
import { handVenousStudySets } from '../lib/hand-venous-anatomy.ts';
import { footVascularStudySets } from '../lib/foot-vascular-anatomy.ts';

export type DissectionView =
  | 'anterior'
  | 'posterior'
  | 'right'
  | 'left'
  | 'inferior'
  | 'superior';
export type TissueRule = {
  systems?: BodySystem[];
  pattern?: string;
  fmaIds?: string[];
};
export type DissectionStage = {
  id: string;
  title: string;
  description: string;
  view: DissectionView;
  hide?: TissueRule[];
  only?: TissueRule[];
  landmarks: string[];
  inspect: string;
  kind: 'assembled' | 'peel' | 'window' | 'skeleton';
};
export type DissectionFocus = {
  id: string;
  title: string;
  rule: TissueRule;
  view: DissectionView;
  includeSkeleton?: boolean;
  context?: TissueRule[];
  description?: string;
  inspect?: string;
  landmarks?: string[];
};
export type DissectionProfile = {
  title: string;
  orientation: string;
  limitations: string[];
  references: string[];
  stages: DissectionStage[];
  focuses: DissectionFocus[];
};
const muscle = (pattern: string): TissueRule => ({
  systems: ['muscles'],
  pattern,
});
const tissue = (pattern: string): TissueRule => ({ pattern });
const system = (...systems: BodySystem[]): TissueRule => ({ systems });
const start = (view: DissectionView = 'anterior'): DissectionStage => ({
  id: 'assembled',
  title: 'Assembled anatomy',
  description:
    'All available structures in this region are restored to their registered positions.',
  view,
  landmarks: [],
  inspect:
    'Rotate first. Notice which structures cover the others before removing a layer.',
  kind: 'assembled',
});
const bones = (view: DissectionView = 'anterior'): DissectionStage => ({
  id: 'bones',
  title: 'Skeletal framework',
  description:
    'Hide soft tissues to inspect the available bones. Joint surfaces remain source geometry, not a simulated joint.',
  view,
  only: [system('skeleton')],
  landmarks: [],
  inspect:
    'Use the remaining bones as orientation landmarks, then step back to restore the preceding view.',
  kind: 'skeleton',
});
const peel = (
  id: string,
  title: string,
  description: string,
  pattern: string,
  view: DissectionView,
  landmarks: string[],
  inspect: string,
): DissectionStage => ({
  id,
  title,
  description,
  hide: [muscle(pattern)],
  view,
  landmarks,
  inspect,
  kind: 'peel',
});
const window = (
  id: string,
  title: string,
  description: string,
  only: TissueRule[],
  view: DissectionView,
  landmarks: string[],
  inspect: string,
): DissectionStage => ({
  id,
  title,
  description,
  only,
  view,
  landmarks,
  inspect,
  kind: 'window',
});
const focus = (
  id: string,
  title: string,
  pattern: string,
  view: DissectionView = 'anterior',
): DissectionFocus => ({ id, title, rule: muscle(pattern), view });
const ref = (page: string) =>
  ({
    topothorax: 'https://anatomy.ttuhscep.edu/schemes/thorax_wall_tables.html',
    topoabd: 'https://anatomy.ttuhscep.edu/anatomytables/viscera_abdomen.html',
    pelvis:
      'https://anatomy.ttuhscep.edu/reproductive_system/pelvicvisc_tables.html',
    neck: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html',
  })[page] ?? `https://anatomy.elpaso.ttuhsc.edu/schemes/${page}_tables.html`;
const cuff = 'supraspinatus|infraspinatus|subscapularis|teres minor';
const hipDeep =
  'piriformis|obturator|gemellus|quadratus femoris|gluteus minimus|iliacus|psoas major';
const legDeep =
  'tibialis posterior|flexor digitorum longus|flexor hallucis longus|popliteus';
const forearmDeep =
  'flexor digitorum profundus|flexor pollicis longus|pronator quadratus|supinator|abductor pollicis longus|extensor pollicis|extensor indicis';

// These are authored educational visibility recipes, NOT operative approaches,
// tissue-depth measurements, or assertions that the source includes every layer.
export const dissectionProfiles: Record<string, DissectionProfile> = {
  'whole-body': {
    title: 'Whole-body orientation',
    orientation:
      'Begin with the assembled reference body, then choose a region for detailed, directional dissection.',
    limitations: [
      'Skin, fascia and most joint connective tissues are not included; vascular coverage is a selected segment subset.',
      'Whole-body stages compare systems; they are not a single anatomical depth sequence.',
      'Neural coverage is partial and no complete spinal cord is supplied.',
    ],
    references: [ref('back'), ref('thigh')],
    stages: [
      start(),
      window(
        'musculoskeletal',
        'Musculoskeletal frame',
        'Set organs and neural entries aside; retain the skeleton and available muscles.',
        [system('muscles', 'skeleton')],
        'anterior',
        ['rectus femoris', 'deltoid'],
        'Compare the regional muscle envelopes before opening a regional explorer.',
      ),
      window(
        'viscera',
        'Organ window',
        'Remove the body wall and skeleton from view to expose the supplied organ surfaces.',
        [system('organs')],
        'anterior',
        ['heart', 'liver', 'kidney'],
        'Rotate to compare the position of organs. Internal organ layers are not segmented.',
      ),
      window(
        'neural',
        'Neural subset',
        'Show the brain, selected cranial/orbital nerves and central-canal representation only.',
        [system('nerves')],
        'anterior',
        ['brain', 'ophthalmic nerve'],
        'The thin central canal is not the spinal cord. Peripheral limb nerves are absent.',
      ),
      bones(),
    ],
    focuses: [],
  },
  'shoulder-arm': {
    title: 'Shoulder & arm dissection',
    orientation:
      'Posterior orientation exposes the cuff as the deltoid parts are removed. Anterior rotation reveals subscapularis and the anterior arm.',
    limitations: [
      'Capsule, labrum, bursae and brachial plexus are not segmented.',
      'Named muscle heads remain separate source parts; no incision or tissue reflection is simulated.',
    ],
    references: [ref('back'), ref('forearm')],
    stages: [
      start('posterior'),
      peel(
        'deltoid-off',
        'Remove the deltoid',
        'Set all available deltoid parts aside to expose the rotator-cuff surfaces.',
        'deltoid',
        'posterior',
        ['supraspinatus', 'infraspinatus', 'teres minor'],
        'Compare supraspinatus and infraspinatus around the scapular spine.',
      ),
      peel(
        'arm-deep',
        'Expose the deep arm',
        'Also remove biceps heads and the long/lateral triceps heads. Brachialis and the medial triceps heads remain.',
        'biceps brachii|(?:long|lateral) head of (?:right|left) triceps',
        'anterior',
        ['brachialis', 'coracobrachialis', 'subscapularis'],
        'Rotate around the humerus to inspect the anterior and posterior surfaces.',
      ),
      window(
        'cuff',
        'Cuff study',
        'Restrict the view to cuff muscles and the skeletal framework.',
        [muscle(cuff), system('skeleton')],
        'posterior',
        ['supraspinatus', 'infraspinatus', 'subscapularis', 'teres minor'],
        'Use anterior and posterior views together; one view cannot expose the whole cuff.',
      ),
      bones('posterior'),
    ],
    focuses: [
      focus(
        'anterior-arm',
        'Anterior arm',
        'biceps brachii|brachialis|coracobrachialis',
      ),
      focus(
        'posterior-arm',
        'Posterior arm',
        'triceps brachii|anconeus',
        'posterior',
      ),
      focus(
        'scapular',
        'Scapular muscles',
        'rhomboid|levator scapulae|serratus anterior|teres major',
        'posterior',
      ),
    ],
  },
  forearm: {
    title: 'Forearm layers & compartments',
    orientation:
      'Anterior views favour the flexor side; posterior views favour the extensor side. The radius and ulna remain orientation landmarks.',
    limitations: [
      'Retinacula, intermuscular septa and forearm nerves are not supplied. Vessel segments do not form a complete tree.',
      'Source muscle heads may extend across the elbow; tendons are not always independent objects.',
    ],
    references: [ref('forearm')],
    stages: [
      start(),
      peel(
        'outer-flexors',
        'Remove superficial flexors',
        'Remove the available pronator-teres heads, wrist flexors and palmaris longus.',
        'pronator teres|flexor carpi|palmaris longus',
        'anterior',
        ['flexor digitorum superficialis'],
        'Inspect flexor digitorum superficialis before proceeding to the deep group.',
      ),
      peel(
        'deep-flexors',
        'Expose deep flexors',
        'Remove flexor digitorum superficialis as well.',
        'flexor digitorum superficialis',
        'anterior',
        [
          'flexor digitorum profundus',
          'flexor pollicis longus',
          'pronator quadratus',
        ],
        'Compare the long finger/thumb flexors with distal pronator quadratus.',
      ),
      peel(
        'deep-extensors',
        'Expose deep extensors',
        'Also remove the superficial extensor group and brachioradialis.',
        'brachioradialis|extensor carpi|extensor digitorum$|extensor digiti minimi',
        'posterior',
        ['supinator', 'abductor pollicis longus', 'extensor indicis'],
        'Follow the supplied deep extensor surfaces without treating this as a complete tendon atlas.',
      ),
      bones(),
    ],
    focuses: [
      focus('flexors', 'Flexor compartment', 'flexor|pronator|palmaris'),
      focus(
        'extensors',
        'Extensor compartment',
        'extensor|abductor pollicis longus|supinator|brachioradialis',
        'posterior',
      ),
      focus('deep', 'Deep muscle groups', forearmDeep),
    ],
  },
  hand: {
    title: 'Intrinsic hand dissection',
    orientation:
      'Explore the thenar and hypothenar groups around the metacarpals. Use rotation to compare palmar and dorsal relationships.',
    limitations: [
      'Lumbricals, palmar interossei and dorsal interossei are available as source groups per hand, not individually numbered muscles.',
      'Both flexor-pollicis-brevis entries are quarantined for a source laterality discrepancy.',
      'Wrist flexor retinacula are available. Palmar aponeurosis, extensor retinacula, tendon sheaths and digital nerves remain absent. Arterial source numbers are retained, not validated textbook branch counts.',
    ],
    references: [ref('hand')],
    stages: [
      start(),
      peel(
        'outer-intrinsics',
        'Remove outer intrinsic muscles',
        'Remove abductor pollicis brevis, abductor digiti minimi and flexor digiti minimi brevis.',
        'abductor pollicis brevis|abductor digiti minimi|flexor digiti minimi brevis',
        'anterior',
        ['opponens pollicis', 'opponens digiti minimi'],
        'The deeper opponens muscles remain; this is not a complete palmar-layer reconstruction.',
      ),
      window(
        'adductor',
        'Adductor pollicis study',
        'Keep the supplied adductor-pollicis heads with the bones.',
        [muscle('adductor pollicis'), system('skeleton')],
        'anterior',
        ['adductor pollicis'],
        'Compare the two source heads and their relationship to the metacarpals.',
      ),
      bones(),
    ],
    focuses: [
      focus('thenar', 'Thumb muscles', 'pollicis'),
      focus('hypothenar', 'Hypothenar subset', 'digiti minimi'),
    ],
  },
  thigh: {
    title: 'Hip & thigh dissection',
    orientation:
      'Start anteriorly for quadriceps; rotate posteriorly for the gluteal region and hamstrings. Compartment views are alternatives to the guided peel.',
    limitations: [
      'Femoral/sciatic nerves, fascia lata and the hip capsule are not segmented; vessels are a selected subset.',
      'Named biceps-femoris heads are selectable source components, not simulated cut ends.',
    ],
    references: [
      ref('thigh'),
      'https://teachmeanatomy.info/lower-limb/muscles/gluteal-region/',
    ],
    stages: [
      start(),
      peel(
        'surface-off',
        'Remove the outer muscle set',
        'Remove sartorius, tensor fasciae latae and gluteus maximus.',
        'sartorius|tensor fasciae latae|gluteus maximus',
        'anterior',
        ['rectus femoris', 'gluteus medius'],
        'Compare the anterior thigh with the posterior hip after changing the camera direction.',
      ),
      peel(
        'quadriceps-deep',
        'Expose vastus intermedius',
        'Remove rectus femoris to reveal the deeper quadriceps surface.',
        'rectus femoris',
        'anterior',
        ['vastus intermedius', 'vastus medialis', 'vastus lateralis'],
        'Inspect vastus intermedius against the femur, with the other vasti retained.',
      ),
      peel(
        'medial-deep',
        'Expose the deeper adductors',
        'Also remove gracilis, adductor longus and pectineus.',
        'gracilis|adductor longus|pectineus',
        'anterior',
        ['adductor brevis', 'adductor magnus'],
        'Compare the retained adductors; this view does not show their neurovascular supply.',
      ),
      peel(
        'hip-deep',
        'Expose the deep hip group',
        'Also remove gluteus medius to uncover gluteus minimus.',
        'gluteus medius',
        'posterior',
        ['gluteus minimus', 'piriformis', 'obturator internus'],
        'Inspect the short hip rotators from several angles.',
      ),
      bones(),
    ],
    focuses: [
      focus(
        'anterior',
        'Anterior thigh',
        'rectus femoris|vastus|sartorius|iliacus|psoas major',
      ),
      focus('medial', 'Medial thigh', 'adductor|gracilis|pectineus'),
      focus(
        'posterior',
        'Hamstrings',
        'biceps femoris|semitendinosus|semimembranosus',
        'posterior',
      ),
      focus('hip', 'Deep hip group', hipDeep, 'posterior'),
    ],
  },
  leg: {
    title: 'Lower-leg dissection',
    orientation:
      'The guided sequence opens the posterior calf. Separate compartment views show the anterior, lateral and deep posterior groups.',
    limitations: [
      'Crural fascia, compartment septa and peripheral nerves are absent; the selected vessels have unreviewed continuity.',
      'Paired Achilles tendon and interosseous-membrane surfaces are available. Subtendons and knee-ligament dissection remain absent.',
    ],
    references: [ref('leg')],
    stages: [
      start('posterior'),
      peel(
        'gastrocnemius-off',
        'Remove gastrocnemius',
        'Set both gastrocnemius heads aside.',
        'gastrocnemius',
        'posterior',
        ['soleus', 'plantaris'],
        'Soleus remains after the overlying gastrocnemius heads are hidden.',
      ),
      peel(
        'soleus-off',
        'Open the deep posterior group',
        'Also remove soleus and plantaris.',
        'soleus|plantaris',
        'posterior',
        [
          'tibialis posterior',
          'flexor digitorum longus',
          'flexor hallucis longus',
        ],
        'Inspect the deep posterior muscles while rotating around the tibia and fibula.',
      ),
      window(
        'deep-posterior',
        'Deep posterior study',
        'Show only the deep posterior group and bones.',
        [muscle(legDeep), system('skeleton')],
        'posterior',
        ['popliteus', 'tibialis posterior'],
        'Compare proximal popliteus with the longer deep muscles.',
      ),
      bones(),
    ],
    focuses: [
      focus(
        'anterior',
        'Anterior compartment',
        'tibialis anterior|extensor digitorum longus|extensor hallucis longus|fibularis tertius',
      ),
      focus(
        'lateral',
        'Lateral compartment',
        'fibularis longus|fibularis brevis',
        'right',
      ),
      focus(
        'deep-posterior',
        'Deep posterior compartment',
        legDeep,
        'posterior',
      ),
    ],
  },
  foot: {
    title: 'Plantar-foot layers',
    orientation:
      'Rotate to look at the sole. The four-layer convention guides removal of the available plantar muscles; missing members remain explicitly absent.',
    limitations: [
      'Long plantar ligaments are included; plantar aponeurosis, plantar plates, other major ligaments and digital nerves remain absent.',
      'Dorsal interossei and some intrinsic foot muscles are missing.',
      'The source uses flexor accessorius for quadratus plantae.',
    ],
    references: [
      ref('leg'),
      'https://teachmeanatomy.info/lower-limb/muscles/foot/',
    ],
    stages: [
      start('inferior'),
      peel(
        'layer-one',
        'Remove plantar layer 1',
        'Remove abductor hallucis, flexor digitorum brevis and abductor digiti minimi.',
        'abductor hallucis|flexor digitorum brevis|abductor digiti minimi',
        'inferior',
        ['flexor accessorius', 'lumbrical'],
        'Inspect the available second-layer muscles from the plantar surface.',
      ),
      peel(
        'layer-two',
        'Remove plantar layer 2',
        'Also remove flexor accessorius and the foot lumbricals.',
        'flexor accessorius|lumbrical',
        'inferior',
        ['flexor hallucis brevis', 'adductor hallucis'],
        'The available third-layer muscles remain.',
      ),
      peel(
        'layer-three',
        'Remove plantar layer 3',
        'Also remove the supplied short hallux flexor, hallux adductor and flexor digiti minimi brevis.',
        'flexor hallucis brevis|adductor hallucis|flexor digiti minimi brevis',
        'inferior',
        ['plantar interosseous'],
        'The supplied plantar interossei remain; dorsal interossei are not available.',
      ),
      bones('inferior'),
    ],
    focuses: [
      focus('hallux', 'Hallux muscles', 'hallucis', 'inferior'),
      focus('interossei', 'Available interossei', 'interosseous', 'inferior'),
      focus('lumbricals', 'Foot lumbricals', 'lumbrical', 'inferior'),
    ],
  },
  thorax: {
    title: 'Chest-wall & organ exposure',
    orientation:
      'Progress from the pectoral region to the rib cage, then open an educational window onto the organs.',
    limitations: [
      'Sternal parts and costal cartilages 1–7 are included. The eighth–tenth costal cartilage coverage remains incomplete.',
      'Pleura, pericardium and valves are not independently segmented. Selected coronary vessels are now separately selectable.',
      'Intercostal layers are compound meshes and cannot be removed rib-space by rib-space.',
    ],
    references: [ref('topothorax')],
    stages: [
      start(),
      peel(
        'pectoral',
        'Remove pectoralis major',
        'Remove the available pectoralis-major surfaces.',
        'pectoralis major',
        'anterior',
        ['pectoralis minor', 'external intercostal'],
        'Compare pectoralis minor with the chest-wall surface.',
      ),
      peel(
        'intercostal',
        'Expose deeper chest wall',
        'Also remove pectoralis minor and the external intercostal mesh.',
        'pectoralis minor|external intercostal',
        'anterior',
        ['internal intercostal', 'diaphragm'],
        'Internal and innermost intercostal source meshes remain.',
      ),
      window(
        'organs',
        'Open the chest window',
        'Hide ribs and wall muscles; retain organs and diaphragm.',
        [system('organs'), muscle('diaphragm')],
        'anterior',
        ['heart', 'lung', 'diaphragm'],
        'This is visibility removal, not a thoracotomy simulation.',
      ),
      window(
        'central',
        'Central thoracic study',
        'Set both lungs aside to expose the supplied central structures.',
        [tissue('^(heart|trachea|esophagus)$'), muscle('diaphragm')],
        'anterior',
        ['heart', 'trachea', 'esophagus'],
        'Rotate to compare the heart, airway and esophagus. Internal chambers are not shown.',
      ),
      bones(),
    ],
    focuses: [
      {
        id: 'organs',
        title: 'Thoracic organs',
        rule: system('organs'),
        view: 'anterior',
      },
      focus(
        'wall',
        'Chest-wall muscles',
        'pectoral|intercostal|transversus thoracis|diaphragm',
      ),
    ],
  },
  abdomen: {
    title: 'Abdominal organ windows',
    orientation:
      'The supplied wall is incomplete, so these stages are named exposure windows rather than a complete abdominal-wall dissection.',
    limitations: [
      'Rectus abdominis, internal oblique and transversus abdominis are not included.',
      'Three selected mesenteric surfaces and named vascular segments are available; peritoneal leaves, roots, organ-internal layers and complete vessel/nerve/lymphatic networks are not established.',
      'Organ removal is an educational visibility change, not a surgical sequence.',
    ],
    references: [ref('topoabd')],
    stages: [
      start(),
      peel(
        'wall',
        'Remove the available wall',
        'Set the external obliques aside. Deeper wall layers are not available.',
        'external oblique',
        'anterior',
        ['liver', 'stomach', 'large intestine'],
        'Inspect the available organs without assuming absent wall tissue has been dissected.',
      ),
      window(
        'viscera',
        'Visceral-organ window',
        'Hide remaining skeletal and muscular context.',
        [system('organs')],
        'anterior',
        ['liver', 'stomach', 'gallbladder', 'spleen'],
        'Rotate to inspect organ relationships in the reference model.',
      ),
      window(
        'posterior',
        'Posterior-organ window',
        'Set the overlying digestive organs aside to study the pancreas, kidneys and adrenal glands.',
        [tissue('pancreas|kidney|adrenal'), system('skeleton')],
        'anterior',
        ['pancreas', 'kidney', 'adrenal'],
        'These surfaces retain the shared source coordinates; they are not patient-specific.',
      ),
      bones(),
    ],
    focuses: [
      {
        id: 'digestive',
        title: 'Digestive organs',
        rule: tissue(
          'liver|gallbladder|stomach|intestine|ileocecal junction|pancreas',
        ),
        view: 'anterior',
      },
      {
        id: 'renal',
        title: 'Renal & adrenal group',
        rule: tissue('kidney|adrenal'),
        view: 'posterior',
      },
    ],
  },
  pelvis: {
    title: 'Pelvic & gluteal exposure',
    orientation:
      'Posterior stages expose the gluteal layers. The organ window shows only the supplied bladder, not a complete pelvic-organ set.',
    limitations: [
      'Levator-ani candidates are held for source adjudication; pelvic fascia and pelvic plexuses remain absent. The limited male reproductive subset includes prostate, testes, epididymides and seminal vesicles.',
      'Coccygeus and the source-labelled superficial perineal muscle do not constitute a complete pelvic floor.',
    ],
    references: [ref('pelvis')],
    stages: [
      start('posterior'),
      peel(
        'gluteal-surface',
        'Remove gluteus maximus',
        'Open the outer gluteal surface.',
        'gluteus maximus',
        'posterior',
        ['gluteus medius', 'piriformis'],
        'Inspect the retained muscles against the pelvic bones.',
      ),
      peel(
        'gluteal-deep',
        'Expose the deep gluteal group',
        'Also remove gluteus medius.',
        'gluteus medius',
        'posterior',
        ['gluteus minimus', 'obturator internus', 'gemellus'],
        'The source model has no sciatic nerve to reveal in this region.',
      ),
      window(
        'pelvic-window',
        'Pelvic muscle & bladder window',
        'Set hip-region muscles and bones aside to display the available pelvic entries.',
        [tissue('urinary bladder|coccygeus|perineal')],
        'anterior',
        ['urinary bladder', 'coccygeus'],
        'Do not interpret this sparse window as a complete pelvic-floor or pelvic-organ model.',
      ),
      bones('posterior'),
    ],
    focuses: [
      focus(
        'rotators',
        'Short hip rotators',
        'piriformis|obturator|gemellus|quadratus femoris',
        'posterior',
      ),
      {
        id: 'bladder',
        title: 'Bladder',
        rule: tissue('^urinary bladder$'),
        view: 'anterior',
      },
    ],
  },
  'head-neck': {
    title: 'Neck & cranial windows',
    orientation:
      'The neck sequence removes selected superficial muscles. Separate cranial windows bypass the skull to expose the supplied neural subset.',
    limitations: [
      'Facial coverage is incomplete; meninges and most cranial nerves are absent. Selected neck and intracranial vessel segments are available.',
      'Compound eyeballs are included, but no full orbital-layer, cranial-base or neck-fascia dissection is supplied.',
      'Cranial windows hide bone; they do not cut a skull flap.',
    ],
    references: [ref('neck')],
    stages: [
      start(),
      peel(
        'platysma',
        'Remove platysma',
        'Set the available platysma surfaces aside.',
        'platysma',
        'anterior',
        ['sternocleidomastoid', 'sternohyoid'],
        'Use the neck muscles and hyoid as orientation landmarks.',
      ),
      peel(
        'neck-deep',
        'Expose deeper neck muscles',
        'Also remove sternocleidomastoid.',
        'sternocleidomastoid',
        'anterior',
        ['scalenus', 'omohyoid', 'digastric'],
        'Inspect the retained neck muscles and available vessel segments; fascial spaces and complete neurovascular anatomy remain absent.',
      ),
      window(
        'cranial',
        'Cranial neural window',
        'Hide bones and muscles to expose the brain and available nerve branches.',
        [system('nerves')],
        'anterior',
        ['brain', 'ophthalmic nerve'],
        'This is a limited cranial/orbital subset, not all cranial nerves.',
      ),
      window(
        'orbital',
        'Orbital anatomy subset',
        'Set the brain aside; retain the compound eyeballs, available orbital nerves and extraocular muscles.',
        [tissue('nerve|eyeball'), muscle('rectus$|oblique$|levator palpebrae')],
        'anterior',
        ['ophthalmic nerve', 'superior rectus'],
        'Eyeballs are compound surfaces, not an ocular-layer dissection. Inspect the incomplete nerve and muscle subset around them.',
      ),
      bones(),
    ],
    focuses: [
      focus('hyoid', 'Hyoid-associated muscles', 'hyoid|digastric'),
      focus('scalenes', 'Scalene group', 'scalenus'),
      focus('pharynx', 'Pharyngeal subset', 'pharyn|gloss|palatin|uvular'),
    ],
  },
  spine: {
    title: 'Back-muscle dissection',
    orientation:
      'Start posteriorly and remove selected layers towards the smaller vertebral muscles. Psoas remains anterior unless a focused view excludes it.',
    limitations: [
      'Latissimus dorsi and multifidus are not supplied in this subset.',
      '22 source-labelled whole discs are available; the remaining disc level is unresolved. Spinal ligaments, meninges and spinal nerves are absent.',
      'The central-canal mesh is not the spinal cord; no laminectomy is simulated.',
    ],
    references: [ref('back')],
    stages: [
      start('posterior'),
      peel(
        'trapezius',
        'Remove trapezius parts',
        'Remove the supplied ascending, transverse and descending trapezius parts.',
        'trapezius',
        'posterior',
        ['splenius', 'iliocostalis'],
        'Inspect the remaining back-muscle envelope.',
      ),
      peel(
        'outer-back',
        'Expose the longitudinal columns',
        'Also remove splenius and serratus posterior.',
        'splenius|serratus posterior',
        'posterior',
        ['iliocostalis', 'longissimus', 'spinalis'],
        'Compare the longitudinal erector-spinae columns.',
      ),
      peel(
        'deep-back',
        'Expose smaller deep muscles',
        'Also remove the erector-spinae columns and semispinalis.',
        'iliocostalis|longissimus|^spinalis$|semispinalis',
        'posterior',
        ['rotator', 'interspinalis', 'intertransversarius'],
        'Inspect the remaining short muscles. The absent multifidus layer is not implied.',
      ),
      bones('posterior'),
      window(
        'canal',
        'Central-canal reference only',
        'Hide bones and muscles to expose the narrow source-labelled central canal.',
        [tissue('^central canal')],
        'posterior',
        ['central canal'],
        'This is not a spinal-cord segmentation and must not be used to infer cord thickness or boundaries.',
      ),
    ],
    focuses: [
      focus(
        'erector',
        'Erector-spinae columns',
        'iliocostalis|longissimus|^spinalis$',
        'posterior',
      ),
      focus(
        'suboccipital',
        'Suboccipital subset',
        'obliquus capitis|rectus capitis posterior',
        'posterior',
      ),
      focus('psoas', 'Psoas major', 'psoas major'),
    ],
  },
};

// These are system windows, not new surgical depth steps. No guessed connections
// are drawn between the selected vessel segments.
const vascularRegions = [
  'whole-body',
  'head-neck',
  'thorax',
  'abdomen',
  'pelvis',
  'shoulder-arm',
  'forearm',
  'hand',
  'thigh',
  'leg',
  'foot',
];
for (const region of vascularRegions) {
  const profile = dissectionProfiles[region];
  profile.stages.push(
    window(
      'vascular',
      'Vascular relationships',
      'Set the soft tissues aside to inspect selected arteries and veins against the bones. Gaps in the source vessel tree are not reconstructed.',
      [system('skeleton', 'vessels')],
      region === 'foot' ? 'inferior' : 'anterior',
      [],
      'Rotate to compare the source vessel segments with nearby bones. Red denotes arteries and blue denotes veins—not oxygenation. Branch continuity and calibre are not independently reviewed.',
    ),
  );
  profile.focuses.push({
    id: 'arteries',
    title: 'Selected arteries',
    rule: {
      systems: ['vessels'],
      pattern:
        'artery|aorta|palmar arch|thyrocervical trunk|costocervical trunk',
    },
    view: region === 'foot' ? 'inferior' : 'anterior',
  });
  if (!['hand'].includes(region))
    profile.focuses.push({
      id: 'veins',
      title: 'Selected veins',
      rule: { systems: ['vessels'], pattern: 'vein|vena cava' },
      view: 'anterior',
    });
}
for (const region of [
  'whole-body',
  'head-neck',
  'thorax',
  'foot',
  'forearm',
  'leg',
  'spine',
  'abdomen',
]) {
  dissectionProfiles[region].stages.push(
    window(
      'connective',
      'Connective-tissue relationships',
      'Inspect the available discs, cartilages, ligaments, membranes or tendons with their bony context. This is not a complete joint dissection.',
      [system('skeleton', 'connective')],
      region === 'foot' ? 'inferior' : 'anterior',
      [],
      'Check the available surfaces and their neighbouring bones. Most capsules, fascia, tendons and ligaments are still missing.',
    ),
  );
}
dissectionProfiles['shoulder-arm'].stages.push(
  window(
    'scapular-vascular-detail',
    'Shoulder vascular detail',
    'Compare the available axillary, scapular and thoraco-acromial source segments with the shoulder bones.',
    [
      system('skeleton'),
      {
        systems: ['vessels'],
        pattern: 'axillary|scapular|thoraco-acromial|cervical trunk',
      },
    ],
    'posterior',
    ['suprascapular artery', 'axillary vein'],
    'Separate the display gently, then return to zero to judge the source relationships. The brachial plexus is absent; branching, attachments and vessel calibre remain unreviewed.',
  ),
);
dissectionProfiles.thorax.stages.push(
  window(
    'central-airway-window',
    'Central airway window',
    'Remove the lung aggregates and chest muscles to inspect the trachea and source-labelled main bronchial segments.',
    [
      system('skeleton'),
      { systems: ['organs'], pattern: 'trachea|main bronchus' },
    ],
    'anterior',
    ['trachea', 'main bronchus'],
    'These are source-defined exterior surfaces, not a bronchoscopic lumen or a validated segmental-airway tree. Bronchial boundaries and relative lengths require review.',
  ),
);
for (const [region, id, title, systems, pattern, view] of [
  [
    'shoulder-arm',
    'scapular-vessels',
    'Scapular & axillary vessels',
    ['vessels'],
    'scapular|axillary|thoraco-acromial',
    'posterior',
  ],
  [
    'thorax',
    'chest-wall-vessels',
    'Anterior chest-wall vessels',
    ['vessels'],
    'internal thoracic|musculophrenic|superior epigastric',
    'anterior',
  ],
  [
    'thorax',
    'central-airways',
    'Central airway source segments',
    ['organs'],
    'trachea|main bronchus',
    'anterior',
  ],
  [
    'head-neck',
    'orbital-ganglia',
    'Ciliary ganglia',
    ['nerves'],
    'ciliary ganglion',
    'anterior',
  ],
  [
    'abdomen',
    'biliary-surfaces',
    'Gallbladder & selected ducts',
    ['organs'],
    '^gallbladder$|^cystic duct$|^common hepatic duct$',
    'anterior',
  ],
  [
    'abdomen',
    'appendiceal-context',
    'Appendix & large intestine',
    ['organs'],
    'appendix|large intestine|ileocecal junction',
    'anterior',
  ],
] as const) {
  dissectionProfiles[region].focuses.push({
    id,
    title,
    rule: { systems: [...systems], pattern },
    view,
  });
}

dissectionProfiles.abdomen.stages.push(
  window(
    'ileocecal-junction',
    'Bowel junction window',
    'Set unrelated organs, bones and muscles aside to compare the two bowel aggregates with their separately selectable junction.',
    [{ fmaIds: ['FMA7200', 'FMA7201', 'FMA11338'] }],
    'anterior',
    ['small intestine', 'large intestine', 'ileocecal junction'],
    'Select the junction to isolate or frame it. Removing either bowel aggregate does not remove the junction. This is an exposure window, not a surgical dissection sequence.',
  ),
);
dissectionProfiles.abdomen.focuses.push({
  id: 'ileocecal-junction',
  title: 'Ileocecal junction & bowel context',
  rule: { fmaIds: ['FMA11338'] },
  context: [{ fmaIds: ['FMA7200', 'FMA7201'] }],
  includeSkeleton: false,
  view: 'anterior',
});

dissectionProfiles.hand.focuses.push(
  focus('lumbricals', 'Lumbrical groups', 'set of lumbricals'),
  focus(
    'palmar-interossei',
    'Palmar interosseous groups',
    'set of palmar interossei',
  ),
  focus(
    'dorsal-interossei',
    'Dorsal interosseous groups',
    'set of dorsal interossei',
    'posterior',
  ),
);
dissectionProfiles.hand.stages.push(
  window(
    'interosseous-groups',
    'Between the metacarpals',
    'Set other muscles aside to inspect the supplied palmar and dorsal interosseous groups.',
    [system('skeleton'), tissue('set of (palmar|dorsal) interossei')],
    'posterior',
    ['set of dorsal interossei', 'set of palmar interossei'],
    'Each highlighted set is one selectable source group, not an individual numbered muscle.',
  ),
);
dissectionProfiles.spine.stages.push(
  window(
    'disc-column',
    'Intervertebral disc column',
    'Remove the muscles and central canal to compare the 22 available whole discs with the vertebrae.',
    [system('skeleton'), tissue('intervertebral disk')],
    'left',
    ['intervertebral disk of third lumbar'],
    'Disc shells do not expose nucleus, annulus or endplates. The unresolved source disc is intentionally absent; source names are not validated radiology level labels.',
  ),
);
dissectionProfiles.spine.focuses.push({
  id: 'discs',
  title: 'Whole-disc surfaces',
  rule: tissue('intervertebral disk'),
  view: 'left',
});
for (const region of ['forearm', 'leg']) {
  dissectionProfiles[region].focuses.push({
    id: 'interosseous-membranes',
    title: 'Interosseous membranes',
    rule: tissue('interosseous membrane'),
    view: 'anterior',
  });
}
for (const region of ['leg', 'foot']) {
  dissectionProfiles[region].focuses.push({
    id: 'achilles',
    title: 'Achilles tendon context',
    rule: tissue('calcaneal tendon|gastrocnemius|soleus'),
    view: 'posterior',
  });
}
dissectionProfiles['head-neck'].stages.push(
  window(
    'gland-window',
    'Salivary & lacrimal glands',
    'Inspect the supplied submandibular, sublingual and lacrimal glands with the bones.',
    [
      system('skeleton'),
      tissue('submandibular gland|sublingual gland|lacrimal gland'),
    ],
    'anterior',
    ['submandibular gland', 'lacrimal gland'],
    'Parotid glands and complete duct anatomy are not supplied by this window.',
  ),
);
dissectionProfiles.pelvis.stages.push(
  window(
    'pelvic-organs',
    'Pelvic organ subset',
    'Inspect bladder, ureter surfaces, rectum and the limited male reproductive subset.',
    [system('skeleton', 'organs')],
    'left',
    ['prostate', 'rectum'],
    'Compare the source positions; do not infer a complete pelvic floor, organ-wall layering, sphincters or reproductive tract.',
  ),
);
dissectionProfiles['head-neck'].focuses.push({
  id: 'ocular',
  title: 'Eyeballs & orbital muscle subset',
  rule: {
    pattern:
      'eyeball|(?:superior|inferior|medial|lateral) rectus$|(?:superior|inferior) oblique$|palpebrae',
  },
  view: 'anterior',
});

// Explicit source IDs avoid accidentally selecting similarly named vessels or aliases.
for (const study of neuroStudySets) {
  const rule: TissueRule = {
    systems: ['nerves'],
    fmaIds: neuroStudyIds(study.groups),
  };
  dissectionProfiles['head-neck'].focuses.push({
    id: study.id,
    title: study.title,
    rule,
    view: study.view,
    includeSkeleton: false,
    description: study.description,
    inspect: study.inspect,
    landmarks: study.landmarks,
  });
}
dissectionProfiles['head-neck'].stages.push(
  ...neuroStudySets
    .slice(0, 3)
    .map((study) =>
      window(
        study.id,
        study.title,
        study.description,
        [{ systems: ['nerves'], fmaIds: neuroStudyIds(study.groups) }],
        study.view,
        study.landmarks,
        study.inspect,
      ),
    ),
);
dissectionProfiles['head-neck'].limitations.push(
  'Deep-brain entries are unvalidated source surfaces. Colours identify study groups, not histology or MRI signal. The two-component choroid-plexus and mammillary records remain grouped across sides.',
);
dissectionProfiles['head-neck'].references.push(
  'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p18_index.html',
);

// Target and context rules are separate: do not reintroduce a whole skeleton
// when a close window needs only the carpal, cervical or lumbar framework.
for (const study of [
  ...axialStudySets,
  ...headDetailStudySets,
  ...mesentericStudySets,
  ...pancreaticStudySets,
  ...thoracicStudySets,
  ...handVascularStudySets,
  ...handVenousStudySets,
  ...footVascularStudySets,
]) {
  for (const [index, region] of study.regions.entries()) {
    const rule = { fmaIds: study.targetFmaIds };
    dissectionProfiles[region].focuses.push({
      id: study.id,
      title: study.title,
      rule,
      context: study.context,
      includeSkeleton: false,
      view: study.view,
      description: study.description,
      inspect: study.inspect,
      landmarks: study.landmarks,
    });
    if (index === 0)
      dissectionProfiles[region].stages.push(
        window(
          study.id,
          study.title,
          study.description,
          [rule, ...study.context],
          study.view,
          study.landmarks,
          study.inspect,
        ),
      );
  }
}

export function matchesRule(s: BodyStructure, rule: TissueRule): boolean {
  return (
    (!rule.systems || rule.systems.includes(s.system)) &&
    (!rule.fmaIds || rule.fmaIds.includes(s.fmaId)) &&
    (!rule.pattern || new RegExp(rule.pattern, 'i').test(s.sourceName))
  );
}
export function stageStructures(
  structures: BodyStructure[],
  profile: DissectionProfile,
  stageId: string,
  focusId: string | null = null,
): BodyStructure[] {
  if (focusId) {
    const choice = profile.focuses.find((f) => f.id === focusId);
    return choice
      ? structures.filter(
          (s) =>
            (choice.includeSkeleton !== false && s.system === 'skeleton') ||
            choice.context?.some((rule) => matchesRule(s, rule)) ||
            matchesRule(s, choice.rule),
        )
      : structures;
  }
  if (stageId === 'free') return structures;
  const index = profile.stages.findIndex((s) => s.id === stageId);
  if (index < 0) return structures;
  const current = profile.stages[index];
  if (current.only)
    return structures.filter((s) =>
      current.only!.some((rule) => matchesRule(s, rule)),
    );
  const hidden = profile.stages
    .slice(0, index + 1)
    .flatMap((s) => s.hide ?? []);
  return structures.filter((s) => !hidden.some((rule) => matchesRule(s, rule)));
}

export type DissectionSnapshot = {
  stageId: string;
  focusId: string | null;
  removed: string[];
  restored: string[];
};
export type DissectionState = DissectionSnapshot & {
  history: DissectionSnapshot[];
};
export const initialDissection: DissectionState = {
  stageId: 'assembled',
  focusId: null,
  removed: [],
  restored: [],
  history: [],
};
export type DissectionAction =
  | { type: 'load-view'; hiddenIds: string[] }
  | { type: 'stage'; id: string }
  | { type: 'focus'; id: string }
  | { type: 'remove' | 'restore'; id: string }
  | { type: 'restore-many'; ids: string[] }
  | { type: 'undo' | 'reset' | 'free' };
export function dissectionReducer(
  state: DissectionState,
  action: DissectionAction,
): DissectionState {
  const { history, ...snapshot } = state;
  if (action.type === 'undo') {
    const prior = history.at(-1);
    return prior ? { ...prior, history: history.slice(0, -1) } : state;
  }
  let next: DissectionSnapshot = { ...snapshot };
  if (action.type === 'load-view')
    next = {
      stageId: 'free',
      focusId: null,
      removed: [...new Set(action.hiddenIds)],
      restored: [],
    };
  if (action.type === 'reset') next = { ...initialDissection };
  if (action.type === 'free')
    next = { stageId: 'free', focusId: null, removed: [], restored: [] };
  if (action.type === 'stage')
    next = { stageId: action.id, focusId: null, removed: [], restored: [] };
  if (action.type === 'focus')
    next = { stageId: 'free', focusId: action.id, removed: [], restored: [] };
  if (action.type === 'remove')
    next = {
      ...snapshot,
      removed: [...new Set([...state.removed, action.id])],
      restored: state.restored.filter((id) => id !== action.id),
    };
  if (action.type === 'restore')
    next = {
      ...snapshot,
      removed: state.removed.filter((id) => id !== action.id),
      restored: [...new Set([...state.restored, action.id])],
    };
  if (action.type === 'restore-many') {
    const ids = new Set(action.ids);
    if (!ids.size) return state;
    next = {
      ...snapshot,
      removed: state.removed.filter((id) => !ids.has(id)),
      restored: [...new Set([...state.restored, ...ids])],
    };
  }
  return { ...next, history: [...history, snapshot].slice(-40) };
}
export function resolveDissection(
  structures: BodyStructure[],
  profile: DissectionProfile,
  state: DissectionSnapshot,
): { visible: BodyStructure[]; removed: BodyStructure[] } {
  const included = new Set(
    stageStructures(structures, profile, state.stageId, state.focusId).map(
      (s) => s.id,
    ),
  );
  const visible = structures.filter(
    (s) =>
      (included.has(s.id) || state.restored.includes(s.id)) &&
      !state.removed.includes(s.id),
  );
  const visibleIds = new Set(visible.map((s) => s.id));
  return { visible, removed: structures.filter((s) => !visibleIds.has(s.id)) };
}
