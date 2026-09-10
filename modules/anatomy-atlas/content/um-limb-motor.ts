/** Authored teaching relationships, not nerve meshes, root maps or source labels.
 * Attached to exact source/lesson pins in um-limb-teaching-bindings.v1.json. */
export const motorNerves = {
  femoral: { label: 'Femoral nerve', view: 'anterior', note: 'Pectineus is listed by its usual femoral supply; additional obturator or accessory obturator supply can occur.' },
  obturator: { label: 'Obturator nerve', view: 'anterior', note: 'Adductor magnus has two motor territories. This source does not separate them.' },
  'sciatic-tibial': { label: 'Sciatic nerve · tibial division', view: 'posterior', note: 'These are proximal thigh branches, not the full distribution of the distal tibial nerve.' },
  'sciatic-fibular': { label: 'Sciatic nerve · common fibular division', view: 'posterior', note: 'The short head of biceps femoris differs from the long head. Distal deep/superficial fibular targets are separate groups.' },
  tibial: { label: 'Tibial nerve · leg branches', view: 'posterior', note: 'Plantar branches are listed separately; this is not the entire tibial-nerve territory.' },
  'deep-fibular': { label: 'Deep fibular (peroneal) nerve', view: 'anterior', note: 'Only supplied anterior-leg and dorsal-foot muscles are available.' },
  'superficial-fibular': { label: 'Superficial fibular (peroneal) nerve', view: 'right', note: 'Fibularis brevis is absent from this specimen; only the supplied longus can be explored.' },
  'medial-plantar': { label: 'Medial plantar nerve', view: 'inferior', note: 'Only supplied intrinsic-foot muscles are listed, not its complete motor or sensory distribution.' },
  'lateral-plantar': { label: 'Lateral plantar nerve', view: 'inferior', note: 'Many other intrinsic-foot targets are absent from the specimen.' },
  'superior-gluteal': { label: 'Superior gluteal nerve', view: 'posterior', note: 'Typical motor relationships; nerve course and motor entry points are not modelled.' },
  'inferior-gluteal': { label: 'Inferior gluteal nerve', view: 'posterior', note: 'Typical motor relationship; this is not a mapped injection or surgical corridor.' },
  'obturator-internus': { label: 'Nerve to obturator internus', view: 'posterior', note: 'Distinct from the obturator nerve. Gemellar innervation can vary.' },
  'quadratus-femoris': { label: 'Nerve to quadratus femoris', view: 'posterior', note: 'Conventional targets shown. Additional or alternative gemellar supply is reported; variants are not exhaustively mapped.' },
  piriformis: { label: 'Nerve to piriformis', view: 'posterior', note: 'Typical motor relationship, not a reconstructed sacral-plexus branch.' },
  'lumbar-rami': { label: 'Lumbar anterior rami · psoas supply', view: 'anterior', note: 'Direct lumbar branches, not the femoral nerve. No root-level or individual-branch map is supplied.' },
} as const;
export type MotorNerveKey = keyof typeof motorNerves;
export type MotorSupply = { nerve: MotorNerveKey; part?: string; caveat?: string };
const supply = (nerve: MotorNerveKey, slugs: string[]): Array<[string, MotorSupply[]]> => slugs.map(slug => [slug, [{ nerve }]]);
export const specimenMotorBindings: Record<string, MotorSupply[]> = Object.fromEntries([
  ...supply('femoral', ['iliacus', 'sartorius', 'rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius']),
  ['pectineus', [{ nerve: 'femoral', caveat: 'Usual supply; variable obturator/accessory obturator contributions are not separately mapped.' }]],
  ...supply('obturator', ['adductor-brevis', 'adductor-longus', 'gracilis', 'obturator-externus']),
  ['adductor-magnus', [{ nerve: 'obturator', part: 'Adductor part' }, { nerve: 'sciatic-tibial', part: 'Hamstring part' }]],
  ...supply('sciatic-tibial', ['biceps-femoris-long-head', 'semimembranosus', 'semitendinosus']),
  ...supply('sciatic-fibular', ['biceps-femoris-short-head']),
  ...supply('tibial', ['popliteus', 'soleus', 'gastrocnemius-medial', 'gastrocnemius-lateral', 'tibialis-posterior', 'flexor-digitorum-longus', 'flexor-hallucis-longus']),
  ...supply('deep-fibular', ['tibialis-anterior', 'extensor-digitorum-longus', 'extensor-hallucis-longus', 'extensor-digitorum-brevis']),
  ...supply('superficial-fibular', ['peroneus-longus']),
  ...supply('medial-plantar', ['abductor-hallucis', 'flexor-digitorum-brevis']),
  ...supply('lateral-plantar', ['abductor-digiti-minimi', 'quadratus-plantae']),
  ...supply('superior-gluteal', ['gluteus-medius', 'gluteus-minimus', 'tensor-fasciae-latae']),
  ...supply('inferior-gluteal', ['gluteus-maximus']),
  ...supply('obturator-internus', ['obturator-internus']),
  ['superior-gemellus', [{ nerve: 'obturator-internus', caveat: 'Additional supply from the nerve to quadratus femoris is reported.' }]],
  ...supply('quadratus-femoris', ['quadratus-femoris']),
  ['inferior-gemellus', [{ nerve: 'quadratus-femoris', caveat: 'Alternative gemellar innervation is reported.' }]],
  ...supply('piriformis', ['piriformis']),
  ...supply('lumbar-rami', ['psoas-major']),
]);
export const motorReference = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
export const motorVariationReference = 'https://pubmed.ncbi.nlm.nih.gov/11331970/';
