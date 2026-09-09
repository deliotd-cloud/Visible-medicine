import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type CranialBoneClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
];
interface CranialBoneClinicalGroup {
  key: string;
  identities: readonly CranialBoneClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const cranialBoneClinicalGroups: readonly CranialBoneClinicalGroup[] = [
  {
    key: 'hyoid',
    scope:
      'This is a neck bone, not part of the skull proper. The two source components remain one hyoid selection; their separation is not a fracture line or a validated body/horn partition.',
    pathology: {
      body: 'Hyoid injury can follow direct neck trauma, including sport or road collisions. Painful or difficult swallowing may accompany it; a hyoid fracture does not by itself establish the mechanism of injury.',
      bullets: [
        'Breathing difficulty or a new voice change after neck trauma needs urgent emergency assessment. Associated laryngeal injury must be considered separately.',
      ],
    },
    clinical: {
      body: 'Relate the hyoid to the tongue and larynx without treating the bony surface as a swallowing or airway examination.',
      bullets: [
        'The cited literature includes small case series and case reports. No treatment success rate, forensic conclusion or management protocol is inferred.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/22691692/',
      'https://pubmed.ncbi.nlm.nih.gov/26564301/',
      'https://pubmed.ncbi.nlm.nih.gov/33962266/',
    ],
    identities: [
      [
        'FMA52749',
        'midline',
        'isa',
        ['FJ2772', 'FJ3201'],
        'head-neck',
        ['head-neck'],
      ],
    ],
  },
  {
    key: 'ethmoid',
    scope:
      'The cribriform region, nasal septal contribution and medial orbital walls belong to one reference bone. No dural defect, olfactory-fibre disruption or sinus infection is reconstructed.',
    pathology: {
      body: 'Cribriform-plate trauma may injure olfactory fibres and can accompany an anterior skull-base injury. A skull-base defect with a cerebrospinal-fluid leak creates a route for infection.',
      bullets: [
        'Clear nasal drainage after head injury requires urgent assessment; appearance alone does not confirm that the fluid is cerebrospinal fluid.',
      ],
    },
    clinical: {
      body: 'Keep the nasal roof and adjacent orbit distinct when considering symptoms after central facial trauma.',
      bullets: [
        'Loss of smell or nasal discharge cannot be localised to this bone from the atlas alone. Patient examination and appropriate testing are needed.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/cmf/trauma/skull-base-cranial-vault/further-reading/complications',
      'https://www.nice.org.uk/guidance/NG232/chapter/recommendations',
    ],
    identities: [
      ['FMA52740', 'midline', 'isa', ['FJ3199'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'frontal',
    scope:
      'One frontal-bone mesh is not a validated reconstruction of the sinus walls, drainage route, dura or intracranial contents.',
    pathology: {
      body: 'Frontal sinus injuries can affect the anterior wall, posterior wall or outflow region differently. A forehead contour defect and a possible communication with the cranial cavity are not equivalent findings.',
      bullets: [
        'Posterior-wall and drainage involvement must be considered separately from the visible external shape.',
      ],
    },
    clinical: {
      body: 'Use the frontal bone to orient the forehead, orbital roof and anterior cranial boundary.',
      bullets: [
        'Patient CT can define fracture extent across these areas; selecting or exploding the reference mesh cannot determine sinus drainage or dural integrity.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/cmf/trauma/skull-base-cranial-vault/frontal-sinus-posterior-table/definition',
    ],
    identities: [
      ['FMA52734', 'midline', 'isa', ['FJ3200'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'inferior-concha',
    scope:
      'Only the bony inferior concha is selected, not its complete vascular mucosal covering. This static model does not show decongestion or the nasal cycle.',
    pathology: {
      body: 'Nasal obstruction may involve swollen turbinate tissue as well as fixed structural narrowing. It should not automatically be attributed to an enlarged or displaced bone.',
      bullets: [
        'Alternating congestion can reflect the normal nasal cycle; it is not itself proof of a septal deformity.',
      ],
    },
    clinical: {
      body: 'Compare the inferior concha with the septum while remembering that the living airway includes soft tissue absent from bone-only isolation.',
      bullets: [
        'No airflow, symptom severity or need for an operation is measured by the space between these reference meshes.',
      ],
    },
    references: [
      'https://leaflets.ekhuft.nhs.uk/septoplasty/html/',
      'https://www.rightdecisions.scot.nhs.uk/ggc-primary-care/ear-nose-and-throat-ent/ear-nose-and-throat-ent-referral-guidance/nose-conditions/nasal-obstructioncongestion/septal-deviation/',
    ],
    identities: [
      ['FMA54738', 'left', 'isa', ['FJ3263'], 'head-neck', ['head-neck']],
      ['FMA54737', 'right', 'isa', ['FJ3369'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'lacrimal',
    scope:
      'The lacrimal bone is neither the tear-producing gland nor the drainage duct. Duct patency, sac inflammation and surgical boundaries are not represented.',
    pathology: {
      body: 'A blocked tear-drainage pathway can cause a watery eye. This concerns the drainage apparatus beside the nose, not necessarily disease of the lacrimal bone itself.',
      bullets: [
        'Watering reflects the balance of tear production and drainage; the selected bone cannot establish the cause.',
      ],
    },
    clinical: {
      body: 'Distinguish the gland near the outer upper orbit from the drainage pathway towards the inner eyelids, tear sac and nose.',
      bullets: [
        'The bony landmark supports orientation only; it cannot substitute for an eye examination or demonstrate whether the nasolacrimal duct is open.',
      ],
    },
    references: [
      'https://www.cuh.nhs.uk/patient-information/dacryocystorhinostomy-dcr/',
    ],
    identities: [
      ['FMA53646', 'left', 'isa', ['FJ3265'], 'head-neck', ['head-neck']],
      ['FMA53645', 'right', 'isa', ['FJ3371'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'maxilla',
    scope:
      'Each maxilla remains side-specific. Its orbital-floor contribution is not the entire orbit, and no extraocular-muscle entrapment or patient fracture is modelled.',
    pathology: {
      body: 'Orbital-floor fractures may occur alone or with more extensive midface injuries. A bony defect and involvement of the orbital soft tissues are separate findings.',
      bullets: [
        'A floor fracture does not automatically establish muscle entrapment; the eye examination and patient imaging must be considered together.',
      ],
    },
    clinical: {
      body: 'Relate the upper jaw to the orbital floor while keeping the globe, muscles and infraorbital tissues distinct.',
      bullets: [
        'CT bone and soft-tissue views answer different questions. New visual loss after facial trauma needs emergency assessment, not reassurance from a normal atlas.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/cmf/trauma/midface/orbit-floor/definition',
      'https://surgeryreference.aofoundation.org/cmf/trauma/midface/orbit-floor/reconstruction',
    ],
    identities: [
      ['FMA53650', 'left', 'isa', ['FJ3269'], 'head-neck', ['head-neck']],
      ['FMA53649', 'right', 'isa', ['FJ3375'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'nasal',
    scope:
      'These paired bones describe the nasal bridge, not the cartilaginous septum or a septal blood collection. External shape does not show the entire nasal injury.',
    pathology: {
      body: 'A nasal injury can include a septal haematoma even when the outside of the nose appears straight. The urgent problem is the septal collection, not simply whether the nasal bones look displaced.',
      bullets: [
        'Suspected septal haematoma needs same-day emergency ENT assessment; persistent painful blockage or septal swelling after injury should not be dismissed.',
      ],
    },
    clinical: {
      body: 'Separate examination of the nasal bridge from assessment of the internal septum and airway.',
      bullets: [
        'A straight reference nose neither excludes a fracture nor rules out a septal complication. No self-manipulation or reduction technique is provided.',
      ],
    },
    references: [
      'https://www.gloshospitals.nhs.uk/your-visit/patient-information-leaflets/suspected-broken-nose-nasal-fracture/',
      'https://www.rightdecisions.scot.nhs.uk/ggc-primary-care/ear-nose-and-throat-ent/ear-nose-and-throat-ent-referral-guidance/nose-conditions/nasal-fractureseptal-haematoma/',
    ],
    identities: [
      ['FMA53648', 'left', 'isa', ['FJ3272'], 'head-neck', ['head-neck']],
      ['FMA53647', 'right', 'isa', ['FJ3378'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'palatine',
    scope:
      'The palatine bone contributes to the hard palate; it is not the entire palate or the muscular soft palate. This reference is not a cleft-palate or speech simulation.',
    pathology: {
      body: 'A cleft can involve the soft palate alone or extend into the hard palate. In a submucous cleft, an apparently intact surface can conceal abnormal muscle continuity.',
      bullets: [
        'A normal-looking bony roof does not establish normal soft-palate function or exclude every type of cleft.',
      ],
    },
    clinical: {
      body: 'Distinguish the fixed bony roof from the moving soft palate when relating anatomy to eating and speech.',
      bullets: [
        'Speech assessment concerns functional closure and airflow as well as structure; moving a palatine bone in explode view does not demonstrate that process.',
      ],
    },
    references: [
      'https://www.newcastle-hospitals.nhs.uk/resources/cleft-palate/',
      'https://www.cuh.nhs.uk/patient-information/how-is-the-palate-involved-in-speech/',
    ],
    identities: [
      ['FMA53656', 'left', 'isa', ['FJ3273'], 'head-neck', ['head-neck']],
      ['FMA53655', 'right', 'isa', ['FJ3379'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'parietal',
    scope:
      'These paired vault bones remain intact reference surfaces. Sutures, fractures, scalp wounds and intracranial bleeding are not interchangeable findings.',
    pathology: {
      body: 'A suspected open or depressed skull fracture after head injury is a warning sign that needs urgent emergency assessment. The severity of brain injury is not determined by the external skull contour alone.',
      bullets: [
        'No fracture or bleeding is simulated; absence of a defect in the reference bone provides no patient reassurance.',
      ],
    },
    clinical: {
      body: 'Orient the cranial vault while keeping bone injury separate from the underlying brain and meningeal assessment.',
      bullets: [
        'NICE does not recommend plain skull radiographs to diagnose important traumatic brain injury. This atlas likewise cannot rule out intracranial injury.',
      ],
    },
    references: [
      'https://www.nice.org.uk/guidance/NG232/chapter/recommendations',
    ],
    identities: [
      ['FMA52789', 'left', 'isa', ['FJ3274'], 'head-neck', ['head-neck']],
      ['FMA52788', 'right', 'isa', ['FJ3380'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'temporal',
    scope:
      'Each temporal bone is one reference selection, not a resolved ossicular chain, cochlea, facial canal lesion or hearing test.',
    pathology: {
      body: 'Temporal-bone trauma can be associated with hearing loss, vertigo, facial weakness or a cerebrospinal-fluid leak. Ear injury can also occur without a temporal-bone fracture.',
      bullets: [
        'Conductive problems in the outer or middle ear and sensorineural injury are different mechanisms; a fracture label alone does not establish which is present.',
      ],
    },
    clinical: {
      body: 'Consider hearing, balance and facial movement as separate clinical questions beside the bony injury.',
      bullets: [
        'The cited review supports orientation and complication awareness only. Its treatment schedules, drug recommendations and prognostic estimates are not imported.',
      ],
    },
    references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC3052678/'],
    identities: [
      ['FMA52739', 'left', 'isa', ['FJ3281'], 'head-neck', ['head-neck']],
      ['FMA52738', 'right', 'isa', ['FJ3386'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'zygomatic',
    scope:
      'One zygomatic bone is not the whole zygomatic arch or fracture complex. Arch continuity, jaw clearance and orbital support require their neighbouring structures.',
    pathology: {
      body: 'A zygomatic injury can involve the orbital rim or floor as well as the cheek. Eye symptoms must not be treated as a purely cosmetic consequence of a displaced cheekbone.',
      bullets: [
        'Reduced vision, double vision or pain with eye movement after facial trauma requires prompt specialist assessment.',
      ],
    },
    clinical: {
      body: 'Inspect the cheek and its orbital relationships together, without assuming the selected bone represents the full injury pattern.',
      bullets: [
        'Isolation is an orientation aid, not evidence that the orbit or adjacent soft tissues are uninjured.',
      ],
    },
    references: [
      'https://www.rightdecisions.scot.nhs.uk/tam-treatments-and-medicines-nhs-highland/emergency-guidelines/emergency-management-of-maxillo-facial-dental-oral-injuries-guidelines/',
    ],
    identities: [
      ['FMA52893', 'left', 'isa', ['FJ3287'], 'head-neck', ['head-neck']],
      ['FMA52892', 'right', 'isa', ['FJ3392'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'mandible',
    scope:
      'The mandible is one bone with two sides and two joint relationships. It is not split into independently normal left/right bones, and no occlusion or joint disc is validated.',
    pathology: {
      body: 'Mandibular fractures may alter the bite and limit jaw movement. Lower-lip or chin numbness can reflect injury to the sensory nerve running through the mandible.',
      bullets: [
        'More than one fracture can occur; a single painful site does not establish the full extent of injury.',
      ],
    },
    clinical: {
      body: 'Relate the tooth-bearing body to both rami and condylar regions when describing a jaw injury.',
      bullets: [
        'Patient dental occlusion, sensation and imaging are needed. A reference bone cannot test the bite, prove nerve transection or determine fracture treatment.',
      ],
    },
    references: [
      'https://www.rightdecisions.scot.nhs.uk/media/04thi3ao/fractures-of-the-mandible_initial-assessment-management-and-referral-of-common-maxillofacial-presentations.pdf',
      'https://www.hey.nhs.uk/patient-leaflet/fracture-lower-jaw/',
    ],
    identities: [
      ['FMA52748', 'midline', 'isa', ['FJ3289'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'occipital',
    scope:
      'Both occipital condyles remain parts of one skull-base bone. No craniocervical ligament injury, stability test or safe neck range is represented.',
    pathology: {
      body: 'An occipital-condyle fracture and an injury involving the craniocervical ligaments are different patterns. Displacement and associated soft-tissue injury affect how the junction is assessed.',
      bullets: [
        'Normal-looking alignment alone does not establish that the skull–neck junction is stable after trauma.',
      ],
    },
    clinical: {
      body: 'Study the occiput with C1 rather than treating the skull base and upper cervical spine as unrelated regions.',
      bullets: [
        'Explode view is a teaching arrangement, not a simulation of traumatic distraction or permission to move an injured neck.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/1a-isolated-bony-injury-condyle/definition',
      'https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/about',
    ],
    identities: [
      ['FMA52735', 'midline', 'isa', ['FJ3309'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'sphenoid',
    scope:
      'The single sphenoid selection includes skull-base and orbital contributions. It is not a validated optic-canal, cavernous-sinus or pituitary lesion model.',
    pathology: {
      body: 'Trauma near the optic canal or superior orbital fissure can affect vision or eye movement through injury to nearby nerves. These are distinct pathways, not a single generic eye-muscle injury.',
      bullets: [
        'Acute visual loss after trauma needs emergency assessment; selecting a normal sphenoid cannot exclude an optic-nerve or orbital injury.',
      ],
    },
    clinical: {
      body: 'Separate the optic-nerve route through the optic canal from the nerves passing through the superior orbital fissure.',
      bullets: [
        'Foramen location is anatomical context, not proof of which nerve is injured. Patient neurological and ophthalmic findings remain essential.',
      ],
    },
    references: [
      'https://surgeryreference.aofoundation.org/cmf/trauma/skull-base-cranial-vault/skull-base-lateral/definition',
      'https://surgeryreference.aofoundation.org/cmf/trauma/midface/orbit-floor/reconstruction',
    ],
    identities: [
      ['FMA52736', 'midline', 'isa', ['FJ3394'], 'head-neck', ['head-neck']],
    ],
  },
  {
    key: 'vomer',
    scope:
      'The vomer is only part of the bony nasal septum, not the septal cartilage, lining or complete partition. No patient airflow or mucosal disease is measured.',
    pathology: {
      body: 'Septal deviation may contribute to nasal blockage, but congestion can also involve turbinate and mucosal swelling. A selected vomer shape does not identify the entire cause of obstruction.',
      bullets: [
        'The bony septum and the front cartilaginous septum must not be treated as the same tissue.',
      ],
    },
    clinical: {
      body: 'Locate the vomer in the septal assembly rather than equating it with the externally visible nasal bridge.',
      bullets: [
        'This reference cannot establish symptom severity or the need for septal surgery; that requires patient-specific assessment.',
      ],
    },
    references: [
      'https://leaflets.ekhuft.nhs.uk/septoplasty/html/',
      'https://www.rightdecisions.scot.nhs.uk/ggc-primary-care/ear-nose-and-throat-ent/ear-nose-and-throat-ent-referral-guidance/nose-conditions/nasal-obstructioncongestion/septal-deviation/',
    ],
    identities: [
      ['FMA9710', 'midline', 'isa', ['FJ3395'], 'head-neck', ['head-neck']],
    ],
  },
];
const byFma = new Map(
  cranialBoneClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function cranialBoneClinicalLesson(
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
