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
    'Available ACA and posterior communicating routes only. MCA, ophthalmic and perforating routes are not supplied by this map.',
    [...cervicalBones, ...skullBaseBones],
  ),
  vertebral: concept(
    ['FMA3958', 'FMA4066'],
    'Paired vertebral arteries unite into the basilar artery. Subclavian origins, cerebellar and spinal branches are outside this map.',
    [...cervicalBones, ...skullBaseBones],
  ),
  basilar: concept(
    ['FMA50542'],
    'Two vertebral inflows, one basilar selection. Cerebellar and pontine branches are not mapped; the PCA origins shown are a typical pattern.',
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
} satisfies ArterialDefinitions;

type Concept = keyof typeof cerebralArterialConcepts;
export const cerebralArterialRelations: readonly {
  from: Concept;
  to: Concept;
  kind: ArterialRelationKind;
  note: string;
}[] = [
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
