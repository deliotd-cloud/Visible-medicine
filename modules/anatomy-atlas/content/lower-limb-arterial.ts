// Original relationship metadata; no source table, artery centreline or flow simulation.
export const arterialReferences = {
  university:
    'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
  branching: 'https://www.ncbi.nlm.nih.gov/books/NBK536981/',
  variation: 'https://pubmed.ncbi.nlm.nih.gov/16843754/',
} as const;
export const arterialConcepts = {
  aorta: {
    fmaIds: ['FMA3789'],
    context: 'pelvis',
    note: 'Only the lower-limb inflow branches are included here; this is not the complete abdominal aortic tree.',
  },
  commonIliac: {
    fmaIds: ['FMA14765', 'FMA14766'],
    context: 'pelvis',
    note: 'Typical common iliac division into external and internal iliac arteries; branching varies.',
  },
  externalIliac: {
    fmaIds: ['FMA18806', 'FMA18807'],
    context: 'pelvis',
    note: 'The femoral name begins distal to the inguinal ligament. This is a continuation, not a separate side branch.',
  },
  internalIliac: {
    fmaIds: ['FMA18809', 'FMA18810'],
    context: 'pelvis',
    note: 'Pelvic branches are outside this lower-limb route map. An empty downstream list does not mean the artery has no branches.',
  },
  femoral: {
    fmaIds: ['FMA70249', 'FMA70250'],
    context: 'thigh',
    note: 'The source has one femoral selection, not separate common and superficial femoral segments. The deep femoral artery is a branch; popliteal is the distal continuation at the adductor hiatus.',
  },
  deepFemoral: {
    fmaIds: ['FMA20796', 'FMA20797'],
    context: 'thigh',
    note: 'Circumflex and perforating branches are not individually added by this map. It does not define a complete supply territory.',
  },
  popliteal: {
    fmaIds: ['FMA77380', 'FMA77381'],
    context: 'leg',
    note: 'Typical branching includes anterior tibial and a tibioperoneal trunk. The trunk is not separately selectable; the fibular artery is also missing as an individual root selection. Variants occur.',
  },
  anteriorTibial: {
    fmaIds: ['FMA43896', 'FMA43897'],
    context: 'leg',
    note: 'The anterior tibial artery continues as dorsalis pedis at the ankle. The name change is not a second independent inflow.',
  },
  posteriorTibial: {
    fmaIds: ['FMA43898', 'FMA43899'],
    context: 'leg',
    note: 'The upstream route is through a tibioperoneal trunk that is not separately selectable here; the fibular branch must not be mistaken for normally absent anatomy.',
  },
  dorsalisPedis: {
    fmaIds: ['FMA43916', 'FMA43917'],
    context: 'foot',
    note: 'The deep plantar branch connects dorsal and plantar systems; this limited map omits other dorsal branches and normal variations.',
  },
  medialPlantar: {
    fmaIds: ['FMA43929', 'FMA43930'],
    context: 'foot',
    note: 'Medial plantar is not represented as the usual main contributor to the deep plantar arch. Its supplied superficial branch remains distinct.',
  },
  lateralPlantar: {
    fmaIds: ['FMA43931', 'FMA43932'],
    context: 'foot',
    note: 'The lateral plantar artery contributes the principal plantar course towards the arch; no flow or patency is demonstrated.',
  },
  arch: {
    fmaIds: ['FMA43943', 'FMA43944'],
    context: 'foot',
    note: 'This source-labelled plantar arch is arterial. Digital branches and completeness of the arch are not established by the surface.',
  },
  deepPlantar: {
    fmaIds: ['FMA69514', 'FMA69515'],
    context: 'foot',
    note: 'This is the deep plantar arterial branch, not a nerve or a plantar vein. A typical anastomosis is not proof of a joined source lumen.',
  },
  superficialMedial: {
    fmaIds: ['FMA43937', 'FMA43938'],
    context: 'foot',
    note: 'Only the supplied superficial medial plantar segment is represented; a complete digital distribution is not mapped.',
  },
} as const;
export type ArterialConcept = keyof typeof arterialConcepts;
export type ArterialRelation =
  | 'branch'
  | 'continuation'
  | 'via-unmodelled'
  | 'anastomosis';
export const arterialRelations: readonly {
  from: ArterialConcept;
  to: ArterialConcept;
  kind: ArterialRelation;
  note: string;
}[] = [
  {
    from: 'aorta',
    to: 'commonIliac',
    kind: 'branch',
    note: 'Lower-limb inflow branch.',
  },
  {
    from: 'commonIliac',
    to: 'externalIliac',
    kind: 'branch',
    note: 'External division.',
  },
  {
    from: 'commonIliac',
    to: 'internalIliac',
    kind: 'branch',
    note: 'Internal division.',
  },
  {
    from: 'externalIliac',
    to: 'femoral',
    kind: 'continuation',
    note: 'Name changes at the inguinal ligament.',
  },
  {
    from: 'femoral',
    to: 'deepFemoral',
    kind: 'branch',
    note: 'Deep femoral (profunda) branch.',
  },
  {
    from: 'femoral',
    to: 'popliteal',
    kind: 'continuation',
    note: 'Name changes at the adductor hiatus.',
  },
  {
    from: 'popliteal',
    to: 'anteriorTibial',
    kind: 'branch',
    note: 'Typical anterior tibial branch.',
  },
  {
    from: 'popliteal',
    to: 'posteriorTibial',
    kind: 'via-unmodelled',
    note: 'Via the tibioperoneal trunk, not separately modelled; not a claimed direct branch. The fibular branch is also not individually selectable.',
  },
  {
    from: 'anteriorTibial',
    to: 'dorsalisPedis',
    kind: 'continuation',
    note: 'Name changes at the ankle.',
  },
  {
    from: 'posteriorTibial',
    to: 'medialPlantar',
    kind: 'branch',
    note: 'Medial plantar branch.',
  },
  {
    from: 'posteriorTibial',
    to: 'lateralPlantar',
    kind: 'branch',
    note: 'Lateral plantar branch.',
  },
  {
    from: 'dorsalisPedis',
    to: 'deepPlantar',
    kind: 'branch',
    note: 'Deep plantar branch.',
  },
  {
    from: 'lateralPlantar',
    to: 'arch',
    kind: 'continuation',
    note: 'Continuation into the plantar arterial arch.',
  },
  {
    from: 'deepPlantar',
    to: 'arch',
    kind: 'anastomosis',
    note: 'Typical anatomical communication; no assigned flow direction or demonstrated patency.',
  },
  {
    from: 'medialPlantar',
    to: 'superficialMedial',
    kind: 'branch',
    note: 'Supplied superficial branch; other branches are outside this map.',
  },
];
