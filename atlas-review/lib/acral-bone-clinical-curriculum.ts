import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type AcralBoneClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
];
interface AcralBoneClinicalGroup {
  key: string;
  identities: readonly AcralBoneClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const acralBoneClinicalGroups: readonly AcralBoneClinicalGroup[] = [
  {
    key: 'scaphoid',
    identities: [
      ['FMA24436', 'left', 'isa', ['FJ3278'], 'hand', ['hand']],
      ['FMA24435', 'right', 'isa', ['FJ3383'], 'hand', ['hand']],
    ],
    scope:
      'One intact scaphoid per side; no fracture line, perfusion, nonunion or scapholunate-ligament lesion is reconstructed.',
    pathology: {
      body: 'Scaphoid fractures may be invisible on initial radiographs. Disrupted blood supply, particularly towards the proximal fragment, can complicate healing.',
      bullets: [
        'A normal early X-ray does not exclude a clinically suspected scaphoid fracture; persistent symptoms need assessment and an appropriate imaging plan.',
      ],
    },
    clinical: {
      body: 'Distinguish the proximal pole, waist and distal pole when describing the injury, rather than treating all scaphoid fractures as equivalent.',
      bullets: [
        'CT and MRI can answer different questions about fracture configuration and occult injury; this reference surface does not measure blood flow or prove healing.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/scaphoid-fracture-of-the-wrist',
      'https://www.bssh.ac.uk/_userfiles/pages/files/professionals/Trauma%20standards/Scaphoid%20standards.pdf',
    ],
  },
  {
    key: 'lunate',
    identities: [
      ['FMA24438', 'left', 'isa', ['FJ3268'], 'hand', ['hand']],
      ['FMA24437', 'right', 'isa', ['FJ3374'], 'hand', ['hand']],
    ],
    scope:
      'This normal lunate has no marrow/perfusion data or simulated collapse. Kienböck disease is not synonymous with traumatic lunate dislocation.',
    pathology: {
      body: 'Kienböck disease involves osteonecrosis of the lunate. Its cause is multifactorial; a short ulna or one wrist shape does not by itself establish the diagnosis.',
      bullets: [
        'Early radiographs may appear normal. Symptoms, examination and appropriate imaging are needed to distinguish it from other causes of wrist pain.',
      ],
    },
    clinical: {
      body: 'Relate the lunate to the radius and neighbouring carpals, keeping bone viability separate from joint alignment.',
      bullets: [
        "Selecting or moving this bone cannot diagnose osteonecrosis, assign a disease stage or evaluate a patient's carpal stability.",
      ],
    },
    references: [
      'https://www.assh.org/handcareprod/condition/kienbocks-disease',
    ],
  },
  {
    key: 'triquetrum',
    identities: [
      ['FMA24440', 'left', 'isa', ['FJ3285'], 'hand', ['hand']],
      ['FMA24439', 'right', 'isa', ['FJ3390'], 'hand', ['hand']],
    ],
    scope:
      'The triquetrum and the palmar pisiform remain distinct bones. No dorsal fragment or ligament avulsion is drawn.',
    pathology: {
      body: 'A triquetral fracture may be isolated or part of a more extensive carpal injury involving other bones and ligaments.',
      bullets: [
        'Finding one fracture does not exclude an accompanying ligament injury.',
      ],
    },
    clinical: {
      body: 'Inspect its proximal-row relationships and the separate pisotriquetral articulation when orienting ulnar-sided wrist injury.',
      bullets: [
        'Explode separation is not traumatic carpal displacement or a test of wrist stability.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/carpal-bones/perilunate-fracture-dislocation/definition',
    ],
  },
  {
    key: 'pisiform',
    identities: [
      ['FMA24442', 'left', 'isa', ['FJ3276'], 'hand', ['hand']],
      ['FMA24441', 'right', 'isa', ['FJ3382'], 'hand', ['hand']],
    ],
    scope:
      'The pisiform is a sesamoid in the flexor carpi ulnaris tendon, not a phalanx. Adjacent ulnar nerve and artery clearance is unvalidated.',
    pathology: {
      body: 'Pisiform fractures can occur in isolation or within a complex wrist injury. Palmar-ulnar wrist symptoms should not automatically be assigned to the bone alone.',
      bullets: [
        'Nearby nerve, vessel and tendon findings remain separate clinical questions.',
      ],
    },
    clinical: {
      body: 'Distinguish the pisiform from the triquetrum behind it and the hamate hook farther distally.',
      bullets: [
        'This bony landmark does not establish a safe Guyon-canal corridor or demonstrate tendon or nerve integrity.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/carpal-bones/perilunate-fracture-dislocation/definition',
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/carpal-bones/approach/ulnar-approach-to-the-hamate-hook',
    ],
  },
  {
    key: 'trapezium',
    identities: [
      ['FMA24444', 'left', 'isa', ['FJ3283'], 'hand', ['hand']],
      ['FMA24443', 'right', 'isa', ['FJ3388'], 'hand', ['hand']],
    ],
    scope:
      'The trapezium is not the trapezoid. Thumb-base joint cartilage, contact mechanics and painful loading are not modelled.',
    pathology: {
      body: 'Basal thumb osteoarthritis affects the joint between the trapezium and first metacarpal. Radiographic changes do not always correspond to substantial pain.',
      bullets: [
        'The joint surface and symptoms matter; it is not simply a disorder of one isolated carpal bone.',
      ],
    },
    clinical: {
      body: 'Relate the trapezium to the first metacarpal when studying painful pinch or grip at the thumb base.',
      bullets: [
        'The atlas cannot grade cartilage loss, test a painful joint or determine whether surgery is needed.',
      ],
    },
    references: [
      'https://www.bssh.ac.uk/patients/conditions/24/basal_thumb_arthritis',
    ],
  },
  {
    key: 'central-carpals',
    identities: [
      ['FMA24447', 'left', 'isa', ['FJ3257'], 'hand', ['hand']],
      ['FMA24445', 'left', 'isa', ['FJ3284'], 'hand', ['hand']],
      ['FMA24446', 'right', 'isa', ['FJ3361'], 'hand', ['hand']],
      ['FMA23725', 'right', 'isa', ['FJ3389'], 'hand', ['hand']],
    ],
    scope:
      'Capitate and trapezoid retain separate identities and central/index-ray relationships. No carpal arc, ligament competence or fracture displacement is measured.',
    pathology: {
      body: 'Central carpal fractures may accompany complex fracture-dislocations. Bony and ligamentous injuries can coexist rather than being mutually exclusive alternatives.',
      bullets: [
        "An isolated reference bone cannot show the full extent of a patient's carpal injury.",
      ],
    },
    clinical: {
      body: 'Study the selected bone with its neighbouring carpal row and metacarpal base, not only as a detached object.',
      bullets: [
        'Arrangement controls move normal surfaces for teaching; they do not reproduce an injury classification or validate clinical alignment.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/carpal-bones/perilunate-fracture-dislocation/definition',
    ],
  },
  {
    key: 'hamate',
    identities: [
      ['FMA24449', 'left', 'isa', ['FJ3261'], 'hand', ['hand']],
      ['FMA24448', 'right', 'isa', ['FJ3367'], 'hand', ['hand']],
    ],
    scope:
      'The hook and body are parts of one hamate selection. There is no separately validated hook fracture, Guyon-canal lesion or tendon corridor.',
    pathology: {
      body: 'A hamate fracture can place nearby ulnar nerve structures at risk. Hook injury and injury involving the body or metacarpal-base articulations are not the same pattern.',
      bullets: [
        'Numbness or hand weakness requires clinical assessment; a bone selection cannot identify the affected nerve branch.',
      ],
    },
    clinical: {
      body: 'Relate the hook to the palmar-ulnar wrist and the body to the fourth and fifth metacarpal bases.',
      bullets: [
        'Neither absence of a modelled nerve nor a visible gap between meshes establishes neurovascular safety.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/further-reading/hand-ulnar-and-median-nerve-lesions',
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/carpal-bones/hamate-hook/orif-screw-fixation',
    ],
  },
  {
    key: 'thumb-metacarpal',
    identities: [
      ['FMA24465', 'left', 'isa', ['FJ3240'], 'hand', ['hand']],
      ['FMA24464', 'right', 'isa', ['FJ3350'], 'hand', ['hand']],
    ],
    scope:
      'One first metacarpal per side. The carpometacarpal base and metacarpophalangeal head are separate joint regions, not a single thumb joint.',
    pathology: {
      body: 'Fractures extending into the thumb-base joint, including Bennett and Rolando patterns, differ from extra-articular shaft or base fractures.',
      bullets: [
        "A fracture's relationship to the joint is important; the label 'thumb fracture' does not specify its configuration.",
      ],
    },
    clinical: {
      body: 'Locate the base against the trapezium before distinguishing it from the metacarpal head at the knuckle.',
      bullets: [
        'No fragment pattern, stability grade or treatment indication is supplied by this intact reference bone.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/thumb-fractures',
    ],
  },
  {
    key: 'central-metacarpals',
    identities: [
      ['FMA24467', 'left', 'isa', ['FJ3243'], 'hand', ['hand']],
      ['FMA24469', 'left', 'isa', ['FJ3246'], 'hand', ['hand']],
      ['FMA24471', 'left', 'isa', ['FJ3249'], 'hand', ['hand']],
      ['FMA24466', 'right', 'isa', ['FJ3352'], 'hand', ['hand']],
      ['FMA24468', 'right', 'isa', ['FJ3354'], 'hand', ['hand']],
      ['FMA24470', 'right', 'isa', ['FJ3356'], 'hand', ['hand']],
    ],
    scope:
      'Each second, third and fourth metacarpal keeps its own digit and side. The model does not measure shortening, rotational deformity or grip.',
    pathology: {
      body: 'Metacarpal fractures can alter length, angulation and rotation. Finger overlap during flexion may reveal a functional problem that is less obvious with the fingers straight.',
      bullets: [
        'Joint, tendon, skin and sensory assessment is needed alongside the bone injury.',
      ],
    },
    clinical: {
      body: 'Distinguish the carpal base, shaft and knuckle end, and consider the entire digit rather than only its metacarpal.',
      bullets: [
        'Exploding the hand is not a malrotation test and does not define acceptable deformity or a reduction technique.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/hand-fractures/',
    ],
  },
  {
    key: 'fifth-metacarpal',
    identities: [
      ['FMA24473', 'left', 'isa', ['FJ3252'], 'hand', ['hand']],
      ['FMA24472', 'right', 'isa', ['FJ3358'], 'hand', ['hand']],
    ],
    scope:
      "The fifth metacarpal is not the little finger's proximal phalanx. Its base, shaft, neck and head are not separate selectable fracture fragments.",
    pathology: {
      body: "A boxer's fracture usually describes a fifth-metacarpal neck fracture near the knuckle, not every injury to the fifth metacarpal.",
      bullets: [
        'The name does not prove that punching caused the injury; falls and other trauma can also produce this pattern.',
      ],
    },
    clinical: {
      body: 'Keep a neck injury distinct from a base injury at the carpometacarpal joint, and assess the associated finger alignment clinically.',
      bullets: [
        'This normal source neither shows a depressed knuckle nor sets an acceptable angulation or return-to-activity threshold.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/hand-fractures/',
    ],
  },
  {
    key: 'thumb-proximal-phalanx',
    identities: [
      ['FMA65470', 'left', 'isa', ['FJ3318'], 'hand', ['hand']],
      ['FMA24450', 'right', 'isa', ['FJ3327'], 'hand', ['hand']],
    ],
    scope:
      'The thumb has one interphalangeal joint and no middle phalanx. No collateral ligament, Stener lesion or stress examination is simulated.',
    pathology: {
      body: 'A thumb MCP ulnar-collateral-ligament injury may include a bony avulsion. A ligament tear and a fracture at its attachment are related but distinct findings.',
      bullets: [
        'A normal-looking bone does not establish that the MCP ligament is intact.',
      ],
    },
    clinical: {
      body: 'Relate the proximal phalanx to the metacarpal head when considering instability or weakness during pinch.',
      bullets: [
        'Clinical examination and imaging are required; do not use the separation control to stress an injured thumb or infer ligament stability.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/sprained-thumb',
    ],
  },
  {
    key: 'finger-proximal-phalanges',
    identities: [
      ['FMA71915', 'left', 'isa', ['FJ3313'], 'hand', ['hand']],
      ['FMA66791', 'left', 'isa', ['FJ3314'], 'hand', ['hand']],
      ['FMA71908', 'left', 'isa', ['FJ3316'], 'hand', ['hand']],
      ['FMA71916', 'left', 'isa', ['FJ3317'], 'hand', ['hand']],
      ['FMA24451', 'right', 'isa', ['FJ3322'], 'hand', ['hand']],
      ['FMA24454', 'right', 'isa', ['FJ3323'], 'hand', ['hand']],
      ['FMA24452', 'right', 'isa', ['FJ3325'], 'hand', ['hand']],
      ['FMA24453', 'right', 'isa', ['FJ3326'], 'hand', ['hand']],
    ],
    scope:
      'Each proximal phalanx connects an MCP and a PIP region. Side, digit and segment remain exact; no tendon excursion or joint cartilage is validated.',
    pathology: {
      body: 'Finger fractures can produce rotational deformity or involve a joint surface. Even a small bone injury can impair the function of the whole hand.',
      bullets: [
        'Clinical assessment considers finger overlap, motion and adjacent soft tissues rather than the fracture image alone.',
      ],
    },
    clinical: {
      body: 'Follow the digit from its metacarpal through the proximal and middle phalanges when describing alignment.',
      bullets: [
        'Reference mesh orientation is not a patient finger cascade, a fracture reduction target or evidence of normal tendon function.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/finger-fractures',
    ],
  },
  {
    key: 'finger-middle-phalanges',
    identities: [
      ['FMA23942', 'left', 'isa', ['FJ3291'], 'hand', ['hand']],
      ['FMA24457', 'right', 'isa', ['FJ3292'], 'hand', ['hand']],
      ['FMA23938', 'left', 'isa', ['FJ3296'], 'hand', ['hand']],
      ['FMA23944', 'left', 'isa', ['FJ3297'], 'hand', ['hand']],
      ['FMA23940', 'left', 'isa', ['FJ3299'], 'hand', ['hand']],
      ['FMA24455', 'right', 'isa', ['FJ3303'], 'hand', ['hand']],
      ['FMA24458', 'right', 'isa', ['FJ3304'], 'hand', ['hand']],
      ['FMA24456', 'right', 'isa', ['FJ3306'], 'hand', ['hand']],
    ],
    scope:
      'Middle phalanges exist in digits 2–5, not the thumb. The dorsal central slip and palmar volar plate are different, unvalidated soft-tissue attachments.',
    pathology: {
      body: 'Hyperextension can injure the PIP volar plate, with or without a bony avulsion. Central-slip injury affects the extensor mechanism and may lead to a boutonnière pattern.',
      bullets: [
        'A volar-plate injury and a central-slip injury are not interchangeable explanations for a bent or painful finger.',
      ],
    },
    clinical: {
      body: 'Orient the palmar and dorsal sides of the PIP region separately while keeping the distal DIP joint distinct.',
      bullets: [
        'The atlas does not perform tendon testing, reproduce an avulsed fragment or decide a splint position.',
      ],
    },
    references: [
      'https://www.bssh.ac.uk/patients/conditions/1021/volar_plate_injury',
      'https://www.bssh.ac.uk/patients/conditions/29/boutonniere_injury',
    ],
  },
  {
    key: 'finger-distal-phalanges',
    identities: [
      ['FMA23953', 'left', 'isa', ['FJ3183'], 'hand', ['hand']],
      ['FMA23959', 'left', 'isa', ['FJ3184'], 'hand', ['hand']],
      ['FMA23955', 'left', 'isa', ['FJ3186'], 'hand', ['hand']],
      ['FMA23957', 'left', 'isa', ['FJ3187'], 'hand', ['hand']],
      ['FMA24460', 'right', 'isa', ['FJ3193'], 'hand', ['hand']],
      ['FMA24463', 'right', 'isa', ['FJ3194'], 'hand', ['hand']],
      ['FMA24461', 'right', 'isa', ['FJ3196'], 'hand', ['hand']],
      ['FMA24462', 'right', 'isa', ['FJ3197'], 'hand', ['hand']],
    ],
    scope:
      'The distal phalanx and its DIP joint remain separate from the nail bed and terminal extensor tendon. No tendon discontinuity or fragment is modelled.',
    pathology: {
      body: 'Mallet injury disrupts the terminal extensor mechanism, sometimes with an avulsed bone fragment. It can therefore occur with or without a visible fracture.',
      bullets: [
        'Loss of active fingertip extension is a functional finding, not a diagnosis made from bone shape alone.',
      ],
    },
    clinical: {
      body: 'Distinguish dorsal-base avulsion context from a crush injury of the tuft or nail bed.',
      bullets: [
        'No splinting schedule or operative threshold is inferred from this intact reference surface.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/mallet-finger-baseball-finger',
      'https://www.orthoinfo.org/diseases--conditions/fingertip-injuries-and-amputations/',
    ],
  },
  {
    key: 'thumb-distal-phalanx',
    identities: [
      ['FMA23951', 'left', 'isa', ['FJ3188'], 'hand', ['hand']],
      ['FMA24459', 'right', 'isa', ['FJ3198'], 'hand', ['hand']],
    ],
    scope:
      "This is the thumb's terminal phalanx at its IP joint, not a finger DIP or middle phalanx. Nail bed, pulp and tendon integrity are not shown.",
    pathology: {
      body: 'A thumb-tip crush injury may affect bone, nail bed and surrounding soft tissues together. A small bony injury does not establish the severity of the whole fingertip injury.',
      bullets: [
        'Blood beneath a nail and a fracture are different findings; the atlas cannot assess either in a patient.',
      ],
    },
    clinical: {
      body: 'Relate the terminal bone to the proximal phalanx and the fingertip tissues without assuming that an intact outline means an intact tendon or nail bed.',
      bullets: [
        'Open wounds, sensation and circulation require examination; no nail-drainage or wound-treatment procedure is provided.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/fingertip-injuries-and-amputations/',
      'https://www.orthoinfo.org/diseases--conditions/thumb-fractures',
    ],
  },
  {
    key: 'talus',
    identities: [
      ['FMA24483', 'left', 'isa', ['FJ3280'], 'foot', ['foot']],
      ['FMA24482', 'right', 'isa', ['FJ3385'], 'foot', ['foot']],
    ],
    scope:
      'The talar head, neck and body remain one intact source. Ankle and subtalar joints are distinct; no perfusion, collapse or patient fracture is simulated.',
    pathology: {
      body: 'Talar fractures may disrupt the blood supply and can lead to osteonecrosis. Joint-cartilage damage may also cause post-traumatic arthritis even when a fracture heals.',
      bullets: [
        'These complications are risks, not inevitable outcomes of every talar fracture.',
      ],
    },
    clinical: {
      body: 'Consider the talus with the ankle mortise, calcaneus and navicular, distinguishing the joint surfaces involved.',
      bullets: [
        'The atlas cannot determine bone viability, fracture healing or a safe weight-bearing plan.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/talus-fractures',
    ],
  },
  {
    key: 'calcaneus',
    identities: [
      ['FMA24498', 'left', 'isa', ['FJ3256'], 'foot', ['foot']],
      ['FMA24497', 'right', 'isa', ['FJ3360'], 'foot', ['foot']],
    ],
    scope:
      'An intact heel bone, not a reconstruction of joint depression, heel widening or Achilles avulsion. Skin and soft-tissue injury are not measured.',
    pathology: {
      body: 'Calcaneal fractures can involve the subtalar joint and surrounding soft tissues. A high-energy heel injury may also be accompanied by injuries elsewhere, including the spine.',
      bullets: [
        'An associated injury is possible, not proved by the heel-fracture label.',
      ],
    },
    clinical: {
      body: 'Separate the calcaneal body, posterior heel and subtalar relationship when describing the injury.',
      bullets: [
        'Normal reference shape does not establish preserved cartilage, exclude another injury or predict walking function after a fracture.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/calcaneus-heel-bone-fractures/',
    ],
  },
  {
    key: 'navicular',
    identities: [
      ['FMA24501', 'left', 'isa', ['FJ3307'], 'foot', ['foot']],
      ['FMA24500', 'right', 'isa', ['FJ3308'], 'foot', ['foot']],
    ],
    scope:
      'The foot navicular is not the wrist scaphoid. No stress-fracture line, accessory navicular, marrow change or vascular study is included.',
    pathology: {
      body: 'Repetitive loading can cause a navicular stress fracture with gradually developing midfoot pain. Early radiographs may appear normal.',
      bullets: [
        'Persistent symptoms require clinical assessment; CT or MRI may help when radiographs do not show the suspected injury.',
      ],
    },
    clinical: {
      body: 'Relate the navicular to the talar head and cuneiforms while distinguishing overuse injury from a single traumatic event.',
      bullets: [
        'The model does not diagnose a stress injury, test bone strength or set a return-to-running timetable.',
      ],
    },
    references: [
      'https://www.footcaremd.org/foot-and-ankle-conditions/midfoot/navicular-stress-fractures',
    ],
  },
  {
    key: 'cuboid',
    identities: [
      ['FMA24529', 'left', 'isa', ['FJ3258'], 'foot', ['foot']],
      ['FMA24528', 'right', 'isa', ['FJ3364'], 'foot', ['foot']],
    ],
    scope:
      'The cuboid remains one lateral-midfoot bone. No shortening, articular depression or operative distraction is represented.',
    pathology: {
      body: 'Cuboid injury can affect the length and joint relationships of the lateral foot column. This is different from simply identifying a loose bone fragment.',
      bullets: [
        'Patient joint surfaces and soft tissues matter as well as bony length.',
      ],
    },
    clinical: {
      body: 'Study the cuboid between the calcaneus and lateral metatarsal bases rather than assessing it only in isolation.',
      bullets: [
        'Explode displacement is not a correction of column length, a gait simulation or a guide to surgical reconstruction.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/midfoot/basic-technique/plate-fixation-of-multifragmentary-cuboid-fracture',
    ],
  },
  {
    key: 'cuneiforms',
    identities: [
      ['FMA24524', 'left', 'isa', ['FJ3264'], 'foot', ['foot']],
      ['FMA24526', 'left', 'isa', ['FJ3267'], 'foot', ['foot']],
      ['FMA24522', 'left', 'isa', ['FJ3271'], 'foot', ['foot']],
      ['FMA24523', 'right', 'isa', ['FJ3370'], 'foot', ['foot']],
      ['FMA24525', 'right', 'isa', ['FJ3373'], 'foot', ['foot']],
      ['FMA24521', 'right', 'isa', ['FJ3377'], 'foot', ['foot']],
    ],
    scope:
      'Medial, intermediate and lateral cuneiforms remain separately identified. No Lisfranc ligament tear, measured diastasis or weight-bearing instability is simulated.',
    pathology: {
      body: 'Lisfranc-region injury can involve ligaments, fractures or dislocations across the midfoot joint complex. Intact-looking bones do not exclude a ligamentous injury.',
      bullets: [
        'A seemingly minor twisting injury is not enough to dismiss persistent midfoot symptoms as a simple sprain.',
      ],
    },
    clinical: {
      body: 'Relate the selected cuneiform to the navicular and metatarsal bases, examining the joint assembly rather than a single bone.',
      bullets: [
        'The atlas cannot test arch stability; separation is an illustrative arrangement, not patient diastasis.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/lisfranc-midfoot-injury',
    ],
  },
  {
    key: 'first-metatarsal',
    identities: [
      ['FMA24508', 'left', 'isa', ['FJ3241'], 'foot', ['foot']],
      ['FMA24507', 'right', 'isa', ['FJ3351'], 'foot', ['foot']],
    ],
    scope:
      'The first metatarsal head is part of the first MTP joint, not the hallux IP joint. Cartilage loss and sesamoid contact mechanics are unvalidated.',
    pathology: {
      body: 'Hallux rigidus concerns painful stiffness and arthritis at the first MTP joint. A dorsal prominence and limited motion are joint findings, not simply an abnormal first-metatarsal outline.',
      bullets: [
        'Radiological appearance, symptoms and examination must be considered together.',
      ],
    },
    clinical: {
      body: "Study the head against the hallux proximal phalanx, keeping the first-ray base and the toe's IP joint distinct.",
      bullets: [
        'This normal mesh cannot measure cartilage, painful dorsiflexion or the need for joint surgery.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/stiff-big-toe-hallux-rigidus',
    ],
  },
  {
    key: 'second-metatarsal',
    identities: [
      ['FMA24510', 'left', 'isa', ['FJ3244'], 'foot', ['foot']],
      ['FMA24509', 'right', 'isa', ['FJ3353'], 'foot', ['foot']],
    ],
    scope:
      'The distal metatarsal head and proximal midfoot base are different clinical regions. No head collapse, growth plate or marrow lesion is modelled.',
    pathology: {
      body: 'Freiberg disease most commonly affects the second metatarsal head and may flatten its articular surface. Its cause is not established by the shape of a normal reference bone.',
      bullets: [
        'It is not a synonym for every stress fracture or every painful second metatarsal, and is not assumed to occur exclusively at this bone.',
      ],
    },
    clinical: {
      body: 'Distinguish a head/joint problem at the ball of the foot from a shaft injury or proximal midfoot injury.',
      bullets: [
        'No diagnosis, disease stage, age cutoff or treatment choice is assigned by selecting this bone.',
      ],
    },
    references: [
      'https://www.royalberkshire.nhs.uk/media/h20pukxs/freibergs-condition_apr25.pdf',
    ],
  },
  {
    key: 'third-fourth-metatarsals',
    identities: [
      ['FMA24512', 'left', 'isa', ['FJ3247'], 'foot', ['foot']],
      ['FMA24514', 'left', 'isa', ['FJ3250'], 'foot', ['foot']],
      ['FMA24511', 'right', 'isa', ['FJ3355'], 'foot', ['foot']],
      ['FMA24513', 'right', 'isa', ['FJ3357'], 'foot', ['foot']],
    ],
    scope:
      'Each metatarsal keeps its exact ray and side. The normal shaft does not display a fatigue crack, marrow oedema or an individual load distribution.',
    pathology: {
      body: 'Metatarsal fractures may follow direct trauma or repetitive loading. Early stress injuries can be difficult to identify on plain radiographs.',
      bullets: [
        'An absence of visible fracture on an early X-ray is not proof that persistent load-related pain is harmless.',
      ],
    },
    clinical: {
      body: 'Separate head, shaft and base symptoms, and consider the adjacent joints and other metatarsals.',
      bullets: [
        'Spacing between exploded bones is not a stress test or a measure of safe walking, training load or recovery.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/toe-and-forefoot-fractures',
      'https://www.orthoinfo.org/diseases--conditions/stress-fractures-of-the-foot-and-ankle',
    ],
  },
  {
    key: 'fifth-metatarsal',
    identities: [
      ['FMA24516', 'left', 'isa', ['FJ3253'], 'foot', ['foot']],
      ['FMA24515', 'right', 'isa', ['FJ3359'], 'foot', ['foot']],
    ],
    scope:
      'The tuberosity, base–shaft transition and shaft remain parts of one bone. No fracture-zone boundary or healing status is segmented.',
    pathology: {
      body: 'A tuberosity avulsion and a Jones fracture are different proximal fifth-metatarsal injuries. More distal proximal-shaft stress injuries should not all be labelled Jones fractures.',
      bullets: [
        'The base–shaft junction has a different healing-risk profile from a small tuberosity avulsion; no personal nonunion probability is calculated.',
      ],
    },
    clinical: {
      body: "Locate the injury precisely within the fifth metatarsal rather than using 'base fracture' as a complete description.",
      bullets: [
        "This reference cannot classify a patient's fracture, prescribe weight bearing or choose fixation.",
      ],
    },
    references: [
      'https://www.footcaremd.org/foot-and-ankle-treatments/midfoot/fifth-metatarsal-fracture-surgery',
    ],
  },
  {
    key: 'hallux-proximal-phalanx',
    identities: [
      ['FMA43253', 'right', 'isa', ['FJ3310'], 'foot', ['foot']],
      ['FMA43254', 'left', 'isa', ['FJ3329'], 'foot', ['foot']],
    ],
    scope:
      'The hallux has two phalanges and one IP joint; there is no middle phalanx. The plantar complex and individual sesamoids are not validated by this bone.',
    pathology: {
      body: 'Turf toe concerns the plantar soft-tissue complex at the first MTP joint after hyperextension. It is not simply a fracture of the hallux proximal phalanx.',
      bullets: [
        'Bone and plantar-plate or collateral-ligament injury can require separate assessment.',
      ],
    },
    clinical: {
      body: 'Distinguish the proximal phalanx base at the MTP joint from its head at the IP joint when orienting hallux injury.',
      bullets: [
        'Explode movement does not reproduce the injury or establish ligament stability, a severity grade or readiness to return to sport.',
      ],
    },
    references: ['https://www.orthoinfo.org/diseases--conditions/turf-toe'],
  },
  {
    key: 'lesser-toe-proximal-phalanges',
    identities: [
      ['FMA32637', 'left', 'isa', ['FJ3311'], 'foot', ['foot']],
      ['FMA32639', 'left', 'isa', ['FJ3312'], 'foot', ['foot']],
      ['FMA32641', 'left', 'isa', ['FJ3315'], 'foot', ['foot']],
      ['FMA32634', 'right', 'isa', ['FJ3319'], 'foot', ['foot']],
      ['FMA32636', 'right', 'isa', ['FJ3320'], 'foot', ['foot']],
      ['FMA32638', 'right', 'isa', ['FJ3321'], 'foot', ['foot']],
      ['FMA32640', 'right', 'isa', ['FJ3324'], 'foot', ['foot']],
      ['FMA32635', 'left', 'isa', ['FJ3328'], 'foot', ['foot']],
    ],
    scope:
      'These proximal phalanges retain their own digits and sides. No plantar-plate tear, MTP dislocation or crossover-toe mechanics are reconstructed.',
    pathology: {
      body: 'Plantar-plate injury can make a lesser MTP joint unstable and allow the toe to drift from its normal position. This is a soft-tissue problem, not necessarily a fractured proximal phalanx.',
      bullets: [
        'Pain or altered toe position alone does not identify the injured tissue.',
      ],
    },
    clinical: {
      body: 'Relate the phalanx base to its metatarsal head, keeping the MTP joint distinct from the PIP joint farther along the toe.',
      bullets: [
        'The model does not perform an instability test or prove that a drifting toe has a plantar-plate tear.',
      ],
    },
    references: [
      'https://www.footcaremd.org/foot-and-ankle-conditions/toes/plantar-plate-tear',
    ],
  },
  {
    key: 'lesser-toe-middle-phalanges',
    identities: [
      ['FMA32643', 'left', 'isa', ['FJ3293'], 'foot', ['foot']],
      ['FMA32645', 'left', 'isa', ['FJ3294'], 'foot', ['foot']],
      ['FMA32647', 'left', 'isa', ['FJ3295'], 'foot', ['foot']],
      ['FMA230988', 'left', 'isa', ['FJ3298'], 'foot', ['foot']],
      ['FMA32642', 'right', 'isa', ['FJ3300'], 'foot', ['foot']],
      ['FMA32644', 'right', 'isa', ['FJ3301'], 'foot', ['foot']],
      ['FMA32646', 'right', 'isa', ['FJ3302'], 'foot', ['foot']],
      ['FMA230986', 'right', 'isa', ['FJ3305'], 'foot', ['foot']],
    ],
    scope:
      'The selected middle phalanx lies between PIP and DIP joints. The hallux has no middle phalanx; flexible versus fixed deformity is not simulated.',
    pathology: {
      body: 'Hammertoe describes flexion at the PIP joint of a lesser toe. It concerns a joint and soft-tissue balance, not simply an intrinsically bent middle-phalanx bone.',
      bullets: [
        'A bent PIP joint and a distal-joint deformity should not be described as the same anatomical finding.',
      ],
    },
    clinical: {
      body: 'Identify the involved joint before relating the toe shape to symptoms or shoe pressure.',
      bullets: [
        'A static source cannot establish whether a deformity is flexible, explain its cause or prescribe a corrective procedure.',
      ],
    },
    references: ['https://www.orthoinfo.org/diseases--conditions/hammer-toe'],
  },
  {
    key: 'toe-distal-phalanges',
    identities: [
      ['FMA32653', 'left', 'isa', ['FJ3179'], 'foot', ['foot']],
      ['FMA32655', 'left', 'isa', ['FJ3180'], 'foot', ['foot']],
      ['FMA32657', 'left', 'isa', ['FJ3181'], 'foot', ['foot']],
      ['FMA32651', 'left', 'isa', ['FJ3182'], 'foot', ['foot']],
      ['FMA32659', 'left', 'isa', ['FJ3185'], 'foot', ['foot']],
      ['FMA32652', 'right', 'isa', ['FJ3189'], 'foot', ['foot']],
      ['FMA32654', 'right', 'isa', ['FJ3190'], 'foot', ['foot']],
      ['FMA32656', 'right', 'isa', ['FJ3191'], 'foot', ['foot']],
      ['FMA32650', 'right', 'isa', ['FJ3192'], 'foot', ['foot']],
      ['FMA32658', 'right', 'isa', ['FJ3195'], 'foot', ['foot']],
    ],
    scope:
      'Each terminal phalanx keeps its own toe and side. The hallux IP and lesser-toe DIP joints differ; nail bed, skin wound and circulation are not depicted.',
    pathology: {
      body: 'Stubbing or crushing a toe may injure both bone and nearby soft tissues. A normal-looking bony outline does not exclude a fracture or an important wound.',
      bullets: [
        'A suspected big-toe fracture, a markedly deformed toe, exposed bone or numbness needs emergency assessment under NHS guidance; a significant wound also needs urgent care.',
      ],
    },
    clinical: {
      body: 'Distinguish the terminal bone from its nail and skin, and do not apply an uncomplicated lesser-toe pathway automatically to the big toe.',
      bullets: [
        'No taping, nail-drainage, wound-treatment or return-to-activity instructions are provided.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/toe-and-forefoot-fractures',
      'https://www.nhs.uk/conditions/broken-toe/',
    ],
  },
];
const byFma = new Map(
  acralBoneClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function acralBoneClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'skeleton' ||
    s.category !== 'bone'
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
