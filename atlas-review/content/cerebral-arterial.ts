// Original, brief teaching relationships; no imported figures, vessel paths or flow data.
import type {
  ArterialDefinitions,
  ArterialRelationKind,
} from '../lib/regional-arterial';

const cervicalBones = [
  'FMA12519',
  'FMA12520',
  'FMA12521',
  'FMA12522',
  'FMA12523',
  'FMA12524',
  'FMA12525',
];
const skullBaseBones = ['FMA52735', 'FMA52736', 'FMA52738', 'FMA52739'];
const concept = (
  fmaIds: string[],
  note: string,
  contextFmaIds = skullBaseBones,
) => ({
  fmaIds,
  note,
  context: 'head-neck',
  contextFmaIds,
});

export const cerebralArterialReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_head_neck.html',
  variation: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4683875/',
};
export const cerebralArterialConcepts = {
  commonCarotid: concept(
    ['FMA3941', 'FMA4058'],
    'The internal carotid is one terminal branch. External carotid and aortic-origin routes are outside this map.',
    cervicalBones,
  ),
  internalCarotid: concept(
    ['FMA3949', 'FMA4062'],
    'ACA, posterior communicating and a partial right MCA source are available. Left MCA, ophthalmic and perforating routes are not mapped.',
    [...cervicalBones, ...skullBaseBones],
  ),
  vertebral: concept(
    ['FMA3958', 'FMA4066'],
    'Paired vertebral arteries unite into the basilar artery; PICA source groups are available. Subclavian origins and spinal branches are outside this map.',
    [...cervicalBones, ...skullBaseBones],
  ),
  basilar: concept(
    ['FMA50542'],
    'Two vertebral inflows, one basilar selection. PCA and superior cerebellar routes are available; AICA and pontine branches remain outside this map.',
  ),
  anteriorCerebral: concept(
    ['FMA50029', 'FMA50030'],
    'Each ACA connects with the anterior communicating artery. A1/A2 segments and cortical or perforator territories are not separately selectable here.',
  ),
  anteriorCommunicating: concept(
    ['FMA50169'],
    'This midline communication links both ACAs. No flow direction, collateral adequacy or complete donor circle is established.',
  ),
  posteriorCerebral: concept(
    ['FMA50584', 'FMA50585'],
    'Nine official parts remain one PCA selection. A fetal-type PCA can receive predominant carotid supply; that variant is not assigned to this donor.',
  ),
  posteriorCommunicating: concept(
    ['FMA50085', 'FMA50086'],
    'The ipsilateral carotid–PCA connection is shown. Small or absent communicating segments occur; source surfaces do not establish patency.',
  ),
  middleCerebral: concept(
    ['FMA50082'],
    'Right MCA only: three original PART-OF files form six components. No left counterpart, complete tree or separate M1/M2 labels are inferred.',
  ),
  posteriorInferiorCerebellar: concept(
    ['FMA50519', 'FMA50520'],
    'Each PICA group contains thirteen original files and fourteen components. Source gaps remain visible; this is not a continuous lumen or complete perfusion territory.',
  ),
  superiorCerebellar: concept(
    ['FMA50574', 'FMA50575'],
    'Source names retain their laterality despite a small proximal midline crossing. No vessel is repositioned to enforce a side or junction.',
  ),
} satisfies ArterialDefinitions;

type Concept = keyof typeof cerebralArterialConcepts;
export const cerebralArterialRelations: readonly {
  from: Concept;
  to: Concept;
  kind: ArterialRelationKind;
  note: string;
}[] = [
  {
    from: 'internalCarotid',
    to: 'middleCerebral',
    kind: 'branch',
    note: 'Typical MCA origin. Only the supplied right-side group is selectable.',
  },
  {
    from: 'vertebral',
    to: 'posteriorInferiorCerebellar',
    kind: 'branch',
    note: 'Typical same-side PICA origin; no donor lumen continuity is demonstrated.',
  },
  {
    from: 'basilar',
    to: 'superiorCerebellar',
    kind: 'branch',
    note: 'Typical paired superior cerebellar origins; no individual variation is assigned.',
  },
  {
    from: 'commonCarotid',
    to: 'internalCarotid',
    kind: 'branch',
    note: 'At the carotid bifurcation; the other terminal branch is not mapped.',
  },
  {
    from: 'internalCarotid',
    to: 'anteriorCerebral',
    kind: 'branch',
    note: 'Same-side ACA origin; not the complete carotid termination.',
  },
  {
    from: 'anteriorCerebral',
    to: 'anteriorCommunicating',
    kind: 'anastomosis',
    note: 'The midline ACom connects the two ACAs.',
  },
  {
    from: 'internalCarotid',
    to: 'posteriorCommunicating',
    kind: 'branch',
    note: 'Same-side posterior communicating origin.',
  },
  {
    from: 'posteriorCommunicating',
    to: 'posteriorCerebral',
    kind: 'anastomosis',
    note: 'Same-side communication; no collateral flow is simulated.',
  },
  {
    from: 'vertebral',
    to: 'basilar',
    kind: 'confluence',
    note: 'The two vertebral arteries unite; the basilar artery is not a paired vertebral branch.',
  },
  {
    from: 'basilar',
    to: 'posteriorCerebral',
    kind: 'branch',
    note: 'Typical paired PCA termination; individual configurations vary.',
  },
];
