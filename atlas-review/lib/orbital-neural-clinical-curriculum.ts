import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type OrbitalNeuralClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'nerve' | 'organ',
];
interface OrbitalNeuralClinicalGroup {
  key: string;
  identities: readonly OrbitalNeuralClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const orbitalNeuralClinicalGroups: readonly OrbitalNeuralClinicalGroup[] =
  [
    {
      key: 'ophthalmic',
      identities: [
        [
          'FMA52622',
          'right',
          'isa',
          ['FJ1363'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52623',
          'left',
          'isa',
          ['FJ1312'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'V1 is selected, not the whole trigeminal nerve, its ganglion or the optic nerve. The model does not reconstruct a skin eruption or an individual sensory field.',
      pathology: {
        body: 'Herpes zoster ophthalmicus involves the ophthalmic trigeminal distribution and may injure ocular tissues.',
        bullets: [
          'A V1 rash with eye symptoms requires prompt clinical assessment; the rendered nerve cannot show infection.',
        ],
      },
      clinical: {
        body: 'Separate facial/ocular sensation carried by V1 from vision carried by CN II. Several affected ocular motor nerves plus V1 sensory findings raise a broader localization question.',
        bullets: [
          'Cavernous-sinus and orbital-apex disorders can involve multiple nerves; associated optic-nerve dysfunction helps distinguish the apex pattern. This is not a diagnostic rule.',
        ],
      },
      references: [
        'https://eyewiki.aao.org/Herpes_Zoster_Ophthalmicus',
        'https://neuro-ophthalmology.stanford.edu/2018/06/pearls-and-oy-sters-of-localization-in-ophthalmoparesis/',
        'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html',
      ],
    },
    {
      key: 'frontal',
      identities: [
        [
          'FMA52639',
          'right',
          'isa',
          ['FJ1341'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52640',
          'left',
          'isa',
          ['FJ1290'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'This proximal V1 branch is distinct from its supraorbital and supratrochlear branches. No terminal skin territory is segmented.',
      pathology: {
        body: 'As an anatomical inference, a frontal-nerve lesion could affect sensation across more than one of its terminal branch territories.',
        bullets: [
          "An atlas selection is not evidence that a patient's forehead pain arises at this particular level.",
        ],
      },
      clinical: {
        body: 'Trace the parent-to-branch relationship: frontal nerve to supraorbital and supratrochlear nerves. Frontalis movement is not its motor function.',
        bullets: [
          'Compare a proximal sensory-pathway question with a single distal branch; the model cannot test sensation.',
        ],
      },
      references: [
        'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/',
      ],
    },
    {
      key: 'supraorbital',
      identities: [
        [
          'FMA52656',
          'right',
          'isa',
          ['FJ1376'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52657',
          'left',
          'isa',
          ['FJ1325'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'The selected supraorbital segment and its source side are retained; notch/foramen variants and painful neuromas are not individually modelled.',
      pathology: {
        body: 'Forehead trauma can injure the supraorbital nerve and cause focal pain or altered sensation. Published reports describe this even after minor head injury.',
        bullets: [
          'These reports do not establish how commonly it occurs or exclude other causes of post-traumatic headache.',
        ],
      },
      clinical: {
        body: "Relate forehead symptoms to the nerve's exit at the superior orbital rim, while distinguishing local sensory findings from a complete neurological assessment.",
        bullets: [
          'This is localization teaching, not a nerve-block target or a head-injury clearance test.',
        ],
      },
      references: [
        'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/',
        'https://pubmed.ncbi.nlm.nih.gov/22914241/',
      ],
    },
    {
      key: 'supratrochlear',
      identities: [
        [
          'FMA52643',
          'right',
          'isa',
          ['FJ1377'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52644',
          'left',
          'isa',
          ['FJ1326'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'This is a sensory frontal-nerve branch, not the trochlear motor nerve. Distal fascicles and neuromas are absent.',
      pathology: {
        body: 'Trauma near the brow can injure supratrochlear as well as supraorbital nerves; painful neuromas have been reported.',
        bullets: [
          'Small surgical series do not justify a treatment recommendation for everyone with forehead pain.',
        ],
      },
      clinical: {
        body: 'Use the medial forehead course to distinguish supratrochlear sensory symptoms from superior-oblique weakness caused by a CN IV palsy.',
        bullets: [
          'Similar names do not imply the same function. No injection, ablation or surgical route is provided.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC6839972/',
        'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/',
      ],
    },
    {
      key: 'infratrochlear',
      identities: [
        [
          'FMA52698',
          'right',
          'isa',
          ['FJ1347'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52699',
          'left',
          'isa',
          ['FJ1296'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'Nasociliary sensory branch below the trochlea; not CN IV and not a lacrimal drainage duct. Fine eyelid endings are unresolved.',
      pathology: {
        body: 'Anatomical inference: damage to this branch could alter sensation near the medial eyelids and adjacent nose.',
        bullets: [
          'Pain or numbness there does not by itself identify a single injured branch.',
        ],
      },
      clinical: {
        body: 'Medial eyelid sensation and superior-oblique motor function belong to different pathways.',
        bullets: [
          'Keep the nerve, superior-oblique pulley and neighbouring tear-drainage structures conceptually separate when dissecting.',
        ],
      },
      references: [
        'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/',
      ],
    },
    {
      key: 'lacrimal',
      identities: [
        [
          'FMA52629',
          'right',
          'isa',
          ['FJ1351'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52630',
          'left',
          'isa',
          ['FJ1300'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'This segment is not the gland, sac or duct. The complete facial-to-pterygopalatine secretomotor pathway and its variable communications are not reconstructed.',
      pathology: {
        body: 'A lesion involving the lacrimal nerve must be considered in the context of sensory and accompanying secretomotor fibres, rather than treating all fibres as originating in V1.',
        bullets: [
          'Dry eye alone does not establish a lesion in this selected segment.',
        ],
      },
      clinical: {
        body: 'V1 supplies sensation here; tear-secretory parasympathetic fibres reach the gland through a pathway originating with CN VII and relaying in the pterygopalatine ganglion.',
        bullets: [
          'Following a rendered nerve is not a tear-production or tear-drainage test.',
        ],
      },
      references: [
        'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html',
      ],
    },
    {
      key: 'nasociliary',
      identities: [
        [
          'FMA52669',
          'right',
          'isa',
          ['FJ1361'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52670',
          'left',
          'isa',
          ['FJ1310'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'The parent nerve is shown, not every ocular/nasal ending. There is no patient-specific corneal or skin examination.',
      pathology: {
        body: 'Nasociliary involvement in ophthalmic shingles increases concern for ocular disease. Nasal lesions can be a warning sign, but their absence does not exclude eye involvement.',
        bullets: ['A rash diagram cannot substitute for an eye examination.'],
      },
      clinical: {
        body: 'Corneal sensory loss may accompany neurotrophic keratitis, with poor epithelial healing despite limited pain.',
        bullets: [
          'A quiet or relatively painless eye is not proof of a healthy cornea. The mesh cannot measure corneal sensation.',
        ],
      },
      references: [
        'https://eyewiki.aao.org/Herpes_Zoster_Ophthalmicus',
        'https://eyewiki.aao.org/NEUROTROPHIC_KERATITIS',
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC11306775/',
      ],
    },
    {
      key: 'anterior-ethmoidal',
      identities: [
        [
          'FMA52676',
          'right',
          'isa',
          ['FJ1333'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52677',
          'left',
          'isa',
          ['FJ1283'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'This is the anterior ethmoidal nerve, not an olfactory filament or an artery. Only one source component is selected.',
      pathology: {
        body: 'Anatomical inference: injury along this sensory branch could affect its nasal territory; loss of smell is not its primary sensory deficit.',
        bullets: [
          'No nasal fracture, mucosal lesion or nerve injury is visualized.',
        ],
      },
      clinical: {
        body: 'Relate its orbit-to-nose course to anterior nasal sensation; its external nasal branch helps explain the nasal warning sign discussed with ophthalmic shingles.',
        bullets: [
          'Use this as spatial context, not a sinus-surgery corridor or a way to exclude ocular shingles.',
        ],
      },
      references: [
        'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/',
        'https://eyewiki.aao.org/Herpes_Zoster_Ophthalmicus',
      ],
    },
    {
      key: 'posterior-ethmoidal',
      identities: [
        [
          'FMA52715',
          'right',
          'isa',
          ['FJ1366'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52716',
          'left',
          'isa',
          ['FJ1315'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'Posterior ethmoidal selection only; sinus mucosal innervation is not individually traced. Do not interchange it with the anterior branch.',
      pathology: {
        body: 'Anatomical inference: this branch is relevant to sensory disturbances in the posterior ethmoid/sphenoid region.',
        bullets: [
          'Neither a sinus disorder nor nerve damage can be inferred from the atlas surface.',
        ],
      },
      clinical: {
        body: "Distinguish posterior sinus sensation from the anterior branch's nasal distribution and from olfaction.",
        bullets: [
          'The labelled branch does not establish the cause of a headache or a safe operative boundary.',
        ],
      },
      references: [
        'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/',
      ],
    },
    {
      key: 'long-ciliary',
      identities: [
        [
          'FMA82734',
          'right',
          'isa',
          ['FJ1369'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA82735',
          'left',
          'isa',
          ['FJ1318'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'One source-labelled long ciliary representation per side is not a count of all ciliary nerves. Corneal endings and autonomic axons are not resolved.',
      pathology: {
        body: 'Loss of corneal sensory innervation can impair epithelial healing and lead to neurotrophic keratitis.',
        bullets: [
          'The cause may lie anywhere in the relevant sensory pathway; selecting this distal segment does not localize it.',
        ],
      },
      clinical: {
        body: 'Long ciliary nerves carry ocular sensory fibres and sympathetic fibres; they are not the parasympathetic relay of the ciliary ganglion.',
        bullets: [
          'Differentiate a sensory pathway from a pupil-response pathway. No touch testing, pupil simulation or measured axonal continuity is included.',
        ],
      },
      references: [
        'https://eyewiki.aao.org/NEUROTROPHIC_KERATITIS',
        'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html',
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC8788436/',
      ],
    },
    {
      key: 'sensory-root',
      identities: [
        [
          'FMA52673',
          'right',
          'isa',
          ['FJ1362'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52674',
          'left',
          'isa',
          ['FJ1311'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'The source calls this a communicating nasociliary-to-ciliary-ganglion branch. It is not the ganglion or its oculomotor motor root.',
      pathology: {
        body: "Anatomical inference: a lesion limited to this sensory connection is not equivalent to loss of the ganglion's parasympathetic relay.",
        bullets: [
          'This short segment cannot establish an isolated clinical syndrome or show which microscopic fibres are damaged.',
        ],
      },
      clinical: {
        body: 'Sensory fibres pass through the ciliary ganglion without synapsing, unlike the parasympathetic fibres that relay there.',
        bullets: [
          'Do not explain a dilated pupil solely by highlighting the sensory root.',
        ],
      },
      references: [
        'https://anatomy.ttuhscep.edu/modules/head_autonomics_module/autonomics_05.html',
      ],
    },
    {
      key: 'superior-oculomotor',
      identities: [
        [
          'FMA52574',
          'right',
          'isa',
          ['FJ1372'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52575',
          'left',
          'isa',
          ['FJ1321'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        "Superior CN III division only; the nerve's nucleus, full cisternal course and individual motor units are not reconstructed.",
      pathology: {
        body: 'Impairment of this division can weaken superior rectus and levator palpebrae superioris, affecting eye elevation and eyelid position.',
        bullets: [
          'A pattern of ptosis and ophthalmoparesis is not specific to this segment; neuromuscular and orbital disorders can mimic nerve disease.',
        ],
      },
      clinical: {
        body: "Distinguish the superior division's muscle targets from the inferior division and its parasympathetic connection.",
        bullets: [
          'Sudden double vision or eye pain with double vision needs urgent assessment. Under NHS guidance, blurred/double vision with a severe headache or enlarged pupil, or double vision after head injury, needs 999/A&E.',
          'Normal pupil appearance does not establish the cause or safety of an acute ocular motor deficit.',
        ],
      },
      references: [
        'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html',
        'https://neuro-ophthalmology.stanford.edu/2018/06/pearls-and-oy-sters-of-localization-in-ophthalmoparesis/',
        'https://www.nhs.uk/symptoms/double-vision/',
      ],
    },
    {
      key: 'inferior-oculomotor',
      identities: [
        [
          'FMA52576',
          'right',
          'isa',
          ['FJ1344'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA52577',
          'left',
          'isa',
          ['FJ1293'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'Inferior CN III division only. Neither a compressing aneurysm nor a complete pupillary reflex arc is present in the model.',
      pathology: {
        body: 'This division supplies medial rectus, inferior rectus and inferior oblique and carries preganglionic parasympathetic fibres toward the ciliary ganglion.',
        bullets: [
          'An injury can therefore combine ocular-movement and pupil/accommodation deficits, depending on which fibres are affected.',
        ],
      },
      clinical: {
        body: 'Separate muscle weakness from parasympathetic dysfunction; an incomplete palsy need not reproduce a complete third-nerve pattern.',
        bullets: [
          'Sudden double vision or eye pain with double vision needs urgent assessment. Under NHS guidance, blurred/double vision with a severe headache or enlarged pupil, or double vision after head injury, needs 999/A&E.',
          'Do not use pupil sparing or a normal-looking mesh to exclude a dangerous cause.',
        ],
      },
      references: [
        'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html',
        'https://anatomy.ttuhscep.edu/modules/head_autonomics_module/autonomics_05.html',
        'https://neuro-ophthalmology.stanford.edu/2018/06/pearls-and-oy-sters-of-localization-in-ophthalmoparesis/',
        'https://www.nhs.uk/symptoms/double-vision/',
      ],
    },
    {
      key: 'trochlear',
      identities: [
        [
          'FMA50881',
          'right',
          'isa',
          ['FJ1381'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
        [
          'FMA50882',
          'left',
          'isa',
          ['FJ1330'],
          'head-neck',
          ['head-neck'],
          'nerve',
        ],
      ],
      scope:
        'CN IV is distinct from the supratrochlear and infratrochlear sensory nerves. The selected side is a peripheral source label, not a mapped nuclear lesion.',
      pathology: {
        body: 'Trochlear palsy can produce vertical or oblique binocular diplopia, often troublesome when reading or looking down.',
        bullets: [
          'Congenital/decompensated and acquired causes differ. Superior-oblique weakness can also be mimicked by muscle or neuromuscular disease.',
        ],
      },
      clinical: {
        body: 'Relate impaired depression of the adducted eye to superior-oblique function; not every vertical misalignment is a fourth-nerve palsy.',
        bullets: [
          'Sudden double vision or eye pain with double vision needs urgent assessment. Under NHS guidance, blurred/double vision with a severe headache or enlarged pupil, or double vision after head injury, needs 999/A&E.',
          'The atlas does not perform a clinical three-step test or distinguish skew deviation automatically.',
        ],
      },
      references: [
        'https://neuro-ophthalmology.stanford.edu/2018/04/questions-of-the-week-noi13-diplopia-6-4th-nerve-palsy/',
        'https://www.nhs.uk/symptoms/double-vision/',
      ],
    },
    {
      key: 'ciliary-ganglion',
      identities: [
        [
          'FMA53549',
          'right',
          'isa',
          ['FJ1339'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
        [
          'FMA53550',
          'left',
          'isa',
          ['FJ1288'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'This autonomic ganglion is not the trigeminal ganglion. Cell bodies, short ciliary nerves and iris responses are not individually resolved.',
      pathology: {
        body: 'Damage to the parasympathetic ciliary-ganglion/short-ciliary pathway can produce a tonic pupil, with abnormal light and near responses.',
        bullets: [
          'Adie tonic pupil is one clinical context, not a label for every unequal pupil; other causes require clinical assessment.',
        ],
      },
      clinical: {
        body: 'Differentiate the parasympathetic relay from sensory and sympathetic fibres passing through the ganglion.',
        bullets: [
          'The model cannot diagnose anisocoria or perform pharmacological pupil testing. A new pupil change with blurred/double vision or severe headache must not be dismissed as Adie pupil.',
          'Sudden double vision or eye pain with double vision needs urgent assessment. Under NHS guidance, blurred/double vision with a severe headache or enlarged pupil, or double vision after head injury, needs 999/A&E.',
        ],
      },
      references: [
        'https://eyewiki.aao.org/Adie_Pupil',
        'https://anatomy.ttuhscep.edu/modules/head_autonomics_module/autonomics_05.html',
        'https://www.nhs.uk/symptoms/double-vision/',
      ],
    },
  ];
const byFma = new Map(
  orbitalNeuralClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function orbitalNeuralClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'nerves')
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions, category] = match.identity;
  if (
    s.category !== category ||
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
