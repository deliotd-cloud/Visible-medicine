import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type LimbBoneClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
];
interface LimbBoneClinicalGroup {
  key: string;
  identities: readonly LimbBoneClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const limbBoneClinicalGroups: readonly LimbBoneClinicalGroup[] = [
  {
    key: 'clavicle',
    identities: [
      ['FMA13323', 'left', 'isa', ['FJ3237'], 'shoulder-arm', ['shoulder-arm']],
    ],
    scope:
      'Whole reference clavicle, not separated fracture fragments, a ligament reconstruction or a map of subclavian neurovascular clearance.',
    pathology: {
      body: 'A clavicle fracture is a break in bone; an acromioclavicular separation or sternoclavicular dislocation concerns a joint. These are not interchangeable labels.',
      bullets: [
        'Skin tenting or an open wound after injury can indicate threatened soft tissues; clinical assessment must include the skin and the limb circulation and nerves.',
      ],
    },
    clinical: {
      body: 'Trace the sternal and acromial ends before relating a painful area to the shaft or either joint.',
      bullets: [
        'The clavicle overlies important nerves and vessels. Their proximity indicates a reason for assessment, not proof of injury in every fracture.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/clavicle-fracture-broken-collarbone/',
    ],
  },
  {
    key: 'scapula',
    identities: [
      ['FMA13396', 'left', 'isa', ['FJ3279'], 'shoulder-arm', ['shoulder-arm']],
    ],
    scope:
      'Body, neck and glenoid are parts of one intact source mesh. No fracture line, joint-surface step or chest injury is represented.',
    pathology: {
      body: 'Scapular fractures after high-energy trauma may accompany chest and other injuries; a scapular selection must not narrow assessment to one bone.',
      bullets: [
        'A glenoid fracture involves the shoulder socket. A scapular-body fracture is not automatically an articular injury.',
      ],
    },
    clinical: {
      body: 'Identify the glenoid separately from the blade and neck when describing the location of a fracture.',
      bullets: [
        'Patient imaging establishes extension and displacement. An explode gap is a teaching arrangement, not glenohumeral dislocation.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/scapula-shoulder-blade-fractures/',
    ],
  },
  {
    key: 'humerus',
    identities: [
      [
        'FMA23131',
        'left',
        'isa',
        ['FJ3262'],
        'shoulder-arm',
        ['shoulder-arm', 'forearm'],
      ],
    ],
    scope:
      'Adult reference bone only; no nerve lesion, fracture displacement, paediatric growth plate or fixation corridor is simulated.',
    pathology: {
      body: 'Fracture location changes the associated structures of concern: the axillary nerve near the surgical neck differs from the radial nerve near the shaft.',
      bullets: [
        'Radial-nerve injury can weaken wrist and finger extension; it is a possible association, not an inevitable consequence of a humeral fracture.',
      ],
    },
    clinical: {
      body: 'Describe proximal, shaft or distal involvement before considering adjacent joints and neurovascular findings.',
      bullets: [
        'A clinical motor, sensory and circulation examination cannot be replaced by the normal mesh. Keep surgical neck distinct from anatomical neck.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK448074/'],
  },
  {
    key: 'radius',
    identities: [
      ['FMA23465', 'left', 'isa', ['FJ3277'], 'forearm', ['forearm']],
      ['FMA23464', 'right', 'isa', ['FJ3349'], 'forearm', ['forearm']],
    ],
    scope:
      'An intact adult radius does not establish distal radioulnar stability, interosseous-membrane integrity or patient forearm rotation.',
    pathology: {
      body: 'A Galeazzi fracture-dislocation combines a radial shaft fracture with disruption/dislocation at the distal radioulnar joint; it is not simply a distal-radius wrist fracture.',
      bullets: [
        'Both forearm bones and the elbow and wrist relationships matter when assessing a shaft injury.',
      ],
    },
    clinical: {
      body: 'Follow the radius from the radial head to the wrist; localise the fracture before naming the associated joint injury.',
      bullets: [
        'For forearm-shaft trauma, imaging assessment includes elbow and wrist as well as the shaft. The atlas provides orientation, not diagnostic radiographs.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/forearm-shaft/simple-fracture-of-the-radius-with-dislocation-of-distal-radioulnar-joint-galeazzi/orif-plating',
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/forearm-shaft/further-reading/clinical-and-radiographic-examination',
    ],
  },
  {
    key: 'ulna',
    identities: [
      ['FMA23468', 'left', 'isa', ['FJ3286'], 'forearm', ['forearm']],
      ['FMA23467', 'right', 'isa', ['FJ3391'], 'forearm', ['forearm']],
    ],
    scope:
      'This whole adult ulna does not demonstrate radial-head alignment under load or annular-ligament integrity.',
    pathology: {
      body: 'A Monteggia fracture-dislocation combines an ulnar fracture with radial-head dislocation. Focusing only on the visible ulnar break can miss the joint injury.',
      bullets: [
        'Contrast the proximal radial-head association with the distal radioulnar-joint injury in a Galeazzi pattern.',
      ],
    },
    clinical: {
      body: 'Use the olecranon and proximal ulna to orient the elbow, then inspect the relationship of the separate radial head to the humerus.',
      bullets: [
        'An apparently aligned static reference cannot exclude a fracture-dislocation in a patient; clinical forearm-shaft assessment includes both adjacent joints.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/forearm-shaft/basic-technique/radial-head-stabilization-monteggia-fracture-dislocation',
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/forearm-shaft/further-reading/clinical-and-radiographic-examination',
    ],
  },
  {
    key: 'hip-bone',
    identities: [
      ['FMA16586', 'right', 'isa', ['FJ3152'], 'pelvis', ['pelvis', 'thigh']],
      ['FMA16587', 'left', 'isa', ['FJ3288'], 'pelvis', ['pelvis', 'thigh']],
    ],
    scope:
      'One hip bone is not the complete pelvic ring. Neither ligament competence, bleeding, bone density nor a patient-specific acetabular fracture is modelled.',
    pathology: {
      body: 'Pelvic-ring injury and an acetabular fracture describe different anatomical problems: one concerns the ring, the other the hip socket. They can coexist.',
      bullets: [
        'High-energy pelvic injury may cause serious bleeding and associated organ injury and requires emergency assessment.',
      ],
    },
    clinical: {
      body: 'Distinguish the socket in the hip bone from the femoral head and neck. Evaluate pelvic stability in the context of the whole ring and its ligamentous connections.',
      bullets: [
        'For acetabular injury, location within the socket and joint congruity matter; a smooth atlas surface cannot show patient cartilage damage or displacement.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/pelvic-fractures?webid=2FDEE455',
      'https://www.orthoinfo.org/diseases--conditions/acetabular-fractures/',
    ],
  },
  {
    key: 'femur',
    identities: [
      [
        'FMA24475',
        'left',
        'isa',
        ['FJ3259'],
        'thigh',
        ['thigh', 'pelvis', 'leg'],
      ],
      [
        'FMA24474',
        'right',
        'isa',
        ['FJ3365'],
        'thigh',
        ['thigh', 'pelvis', 'leg'],
      ],
    ],
    scope:
      'The single femur spans hip, thigh and knee routes; it contains no patient fracture, marrow oedema, bone-density measurement or growth-plate assessment.',
    pathology: {
      body: 'A hip fracture usually refers to the proximal femur, not the acetabulum. Femoral-neck, intertrochanteric and subtrochanteric locations are distinct.',
      bullets: [
        'Some nondisplaced hip fractures still permit painful weight-bearing; the ability to stand does not exclude a fracture.',
      ],
    },
    clinical: {
      body: 'Locate the head, neck and trochanteric region before describing proximal injury; keep these separate from shaft or distal-femoral injuries.',
      bullets: [
        'A fracture can be occult on initial radiographs. Ongoing clinical suspicion requires assessment and appropriate further imaging, not reassurance from a normal atlas.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/hip-fractures/',
    ],
  },
  {
    key: 'tibia',
    identities: [
      ['FMA24478', 'left', 'isa', ['FJ3282'], 'leg', ['leg']],
      ['FMA24477', 'right', 'isa', ['FJ3387'], 'leg', ['leg']],
    ],
    scope:
      'No depressed joint surface, fracture fragment, meniscal lesion, ligament tear or compartment pressure is present in this reference tibia.',
    pathology: {
      body: 'A tibial-plateau fracture extends into the knee joint; some proximal tibial fractures do not enter the joint. Articular injury and shaft injury are not equivalent.',
      bullets: [
        'Associated soft-tissue swelling can threaten muscle and nerve blood supply through compartment syndrome, a medical emergency.',
      ],
    },
    clinical: {
      body: 'Relate the plateau to the femoral condyles, then distinguish articular alignment from the condition of surrounding soft tissues.',
      bullets: [
        'The extent of an injury depends on patient examination and imaging. A well-aligned bone alone does not establish a stable, uninjured knee.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/en/diseases--conditions/fractures-of-the-proximal-tibia-shinbone/',
    ],
  },
  {
    key: 'fibula',
    identities: [
      ['FMA24481', 'left', 'isa', ['FJ3260'], 'leg', ['leg']],
      ['FMA24480', 'right', 'isa', ['FJ3366'], 'leg', ['leg']],
    ],
    scope:
      'Neither distal tibiofibular ligament integrity nor ankle stability is inferred from the intact fibular mesh or its explode position.',
    pathology: {
      body: 'A proximal fibular fracture can be part of a wider ankle injury involving the syndesmosis and medial structures; distance from the ankle does not make it irrelevant.',
      bullets: [
        'Do not assume every proximal fibular fracture has this pattern, or assess a suspected ankle injury from the lateral malleolus alone.',
      ],
    },
    clinical: {
      body: 'Follow the entire fibula rather than examining only its distal tip. Interpret its position alongside tibial, talar and ligamentous relationships.',
      bullets: [
        'Normal reference spacing cannot exclude syndesmotic disruption. No stress examination, treatment choice or fixation technique is supplied.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/malleoli/suprasyndesmotic-proximal-fibular-fracture-medial-injury-posterior-fracture/definition',
    ],
  },
  {
    key: 'patella',
    identities: [
      ['FMA24487', 'left', 'isa', ['FJ3275'], 'leg', ['leg']],
      ['FMA24486', 'right', 'isa', ['FJ3381'], 'leg', ['leg']],
    ],
    scope:
      'No patellar fracture, cartilage defect, quadriceps/patellar-tendon continuity or dynamic tracking is simulated.',
    pathology: {
      body: 'A patellar fracture may impair active knee extension and damage the joint surface; its clinical importance is not just the number of bone fragments.',
      bullets: [
        'Difficulty straightening the knee or raising the straight leg after injury prompts assessment of the extensor mechanism and the injury as a whole.',
      ],
    },
    clinical: {
      body: 'Relate the patella to the quadriceps tendon above, patellar tendon below and femoral articular surface behind.',
      bullets: [
        'A bone-only selection cannot test active extension or determine the integrity of the surrounding tendons and retinacula.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/patellar-kneecap-fractures/',
    ],
  },
];

const byFma = new Map(
  limbBoneClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function limbBoneClinicalLesson(
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
