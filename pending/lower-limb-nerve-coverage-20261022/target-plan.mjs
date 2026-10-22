// Editorial acquisition targets, NOT anatomy catalogue IDs, meshes or teaching.
// Conventional anatomical names only; no source tables, images or assets copied.
export const references = [
  { id: 'uams-lower-limb', title: 'UAMS: Nerves of the Lower Limb', url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-lower-limb/', checked: '2026-10-22', role: 'Naming and branch-target reference only; not geometry or asset rights.' },
  { id: 'ttuhscep-thigh', title: 'Texas Tech: Anterior and Medial Thigh', url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html', checked: '2026-10-22', role: 'Femoral, saphenous and lateral femoral cutaneous naming reference only.' },
  { id: 'ttuhscep-gluteal', title: 'Texas Tech: Hip, Posterior Thigh and Leg', url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_tables.html', checked: '2026-10-22', role: 'Sciatic and distal branch naming reference only.' },
];
const target = (key, name, batch, regions, refs, kind = 'named-nerve', aliases = []) => ({
  key: `lln-target:${key}`, name, batch, navigationRegions: regions, references: refs,
  kind, aliases, status: 'acquisition-target', admittedMeshId: null, anatomyId: null,
  geometrySource: null, rightsCleared: false, clinicallyApproved: false,
});
export const targets = [
  target('femoral', 'Femoral nerve', 1, ['thigh'], ['uams-lower-limb','ttuhscep-thigh']),
  target('obturator', 'Obturator nerve', 1, ['thigh'], ['uams-lower-limb']),
  target('sciatic', 'Sciatic nerve', 1, ['thigh'], ['uams-lower-limb','ttuhscep-gluteal']),
  target('common-fibular', 'Common fibular nerve', 1, ['leg'], ['uams-lower-limb','ttuhscep-gluteal'], 'named-nerve', ['Common peroneal nerve']),
  target('superficial-fibular', 'Superficial fibular nerve', 1, ['leg','foot'], ['uams-lower-limb'], 'named-nerve', ['Superficial peroneal nerve']),
  target('deep-fibular', 'Deep fibular nerve', 1, ['leg','foot'], ['uams-lower-limb'], 'named-nerve', ['Deep peroneal nerve']),
  target('tibial', 'Tibial nerve', 1, ['leg'], ['uams-lower-limb','ttuhscep-gluteal']),
  target('saphenous', 'Saphenous nerve', 1, ['thigh','leg','foot'], ['uams-lower-limb','ttuhscep-thigh']),
  target('sural', 'Sural nerve', 1, ['leg','foot'], ['uams-lower-limb']),
  target('medial-plantar', 'Medial plantar nerve', 1, ['foot'], ['uams-lower-limb']),
  target('lateral-plantar', 'Lateral plantar nerve', 1, ['foot'], ['uams-lower-limb']),
  target('lateral-femoral-cutaneous', 'Lateral femoral cutaneous nerve', 1, ['thigh'], ['uams-lower-limb','ttuhscep-thigh']),
  target('posterior-femoral-cutaneous', 'Posterior femoral cutaneous nerve', 1, ['thigh'], ['uams-lower-limb','ttuhscep-gluteal']),
  target('anterior-femoral-cutaneous', 'Anterior femoral cutaneous branches', 2, ['thigh'], ['uams-lower-limb','ttuhscep-thigh'], 'branch-family'),
  target('obturator-anterior', 'Anterior branch of obturator nerve', 2, ['thigh'], ['uams-lower-limb'], 'named-branch'),
  target('obturator-posterior', 'Posterior branch of obturator nerve', 2, ['thigh'], ['uams-lower-limb'], 'named-branch'),
  target('saphenous-infrapatellar', 'Infrapatellar branch of saphenous nerve', 2, ['leg'], ['uams-lower-limb','ttuhscep-thigh'], 'named-branch'),
  target('medial-sural-cutaneous', 'Medial sural cutaneous nerve', 2, ['leg'], ['uams-lower-limb','ttuhscep-gluteal']),
  target('lateral-sural-cutaneous', 'Lateral sural cutaneous nerve', 2, ['leg'], ['uams-lower-limb']),
  target('fibular-communicating', 'Fibular communicating branch', 2, ['leg'], ['uams-lower-limb'], 'named-branch'),
  target('medial-calcaneal', 'Medial calcaneal branches', 2, ['foot'], ['uams-lower-limb'], 'branch-family'),
  target('common-plantar-digital', 'Common plantar digital nerves', 2, ['foot'], ['uams-lower-limb'], 'branch-family'),
  target('proper-plantar-digital', 'Proper plantar digital nerves', 2, ['foot'], ['uams-lower-limb'], 'branch-family'),
];
export const plan = {
  schema: 'visible-medicine.lower-limb-nerve-acquisition-targets/1', requirement: 'ANAT-03',
  sourceHead: '2381efe43b75f8a7fb768a069eecd7268c508dac',
  status: 'editorial-draft-not-clinically-approved',
  prioritization: 'Coordinator proposal: major named nerves first, branch detail second. Owner may revise scope and order.',
  exhaustive: false,
  interpretation: 'These are acquisition targets, not new model structures or a mesh count. Region tags propose navigation destinations, not full anatomical extents. Generic branch families require individual labels/laterality before admission; aliases are not extra anatomy. Absence must be established against the separately revision-bound catalogue inventory, not inferred from this list.',
  boundaries: ['Lumbar/sacral plexuses and gluteal nerves require a separate pelvis/hip scope inventory.', 'Fine muscular, articular and digital branches, variants, autonomic fibres and cutaneous territories are not exhaustively specified here.', 'No masks, CT/MRI/US visibility, measured calibre, patient-space transform or source alignment is inferred.'],
  gates: [
    'Identify each original file/component, its authoring provenance, exact digest and commercial-compatible no-fee licence/required notices. A reference article does not license a mesh.',
    'Keep independent specimens and schematic paths separate from main-body geometry. Establish native units, frame, reconstructed segments and laterality before proposing any placement.',
    'Bind each proposed structure and named branch to its actual source selection; do not count file fragments, aliases or region memberships as additional nerves.',
    'Radiologist reviews exact revision, course, endpoints, relationships, branch identity and reconstruction limits before approval. Queue drafts without stalling independent development.',
    'Only then integrate source/runtime/review bindings and test selection, labels, layers, dissection, quiz eligibility and modality links. Semantic comparison is not validated spatial registration.',
  ],
  nextAction: 'Map batch1 names against retained source-candidate component manifests without importing geometry; retain every unmatched or provenance-held result explicitly. Do not repeat completed retrieval as a substitute for provenance.',
  references, targets,
};
