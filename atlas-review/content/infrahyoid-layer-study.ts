// Existing BodyParts3D v4 exterior surfaces only; no inferred fascia or motion.
const rows = [
  ['left-omohyoid', 'FMA13349', 'left', 'FJ1565', '1552449f945343885869b8495474e44963c906ce559abf2f508506f784357b59'],
  ['right-omohyoid', 'FMA13348', 'right', 'FJ1586', '2ec30a6720efb6eaf451bc141c61d2419b33027b2f10c5b00378f54861be0605'],
  ['left-sternohyoid', 'FMA13347', 'left', 'FJ1574', 'ea466d41ef524b945f5e4e50620b74d8c493288c36a3d0207922f514364a5c65'],
  ['right-sternohyoid', 'FMA13346', 'right', 'FJ1596', '262225d820e3b09f05a269a23f32eb1d97ce29dfa569d569c73e88c0a106708c'],
  ['left-sternothyroid', 'FMA13351', 'left', 'FJ1575', '2b6162444c2c9447e9f0d2bb0947d9f95d76498ddf71a3277e96dabfef550f5f'],
  ['right-sternothyroid', 'FMA13350', 'right', 'FJ1597', '82534889c09ad8efb043e374fdedb9af25dbffa59299d425f233c17173182c11'],
  ['left-thyrohyoid', 'FMA13353', 'left', 'FJ1577', 'f342f7656d7164fc8bf24f3690f3ba1b2ac029beea0ad435347809476c7f8d81'],
  ['right-thyrohyoid', 'FMA13352', 'right', 'FJ1599', 'fe3834ea88fcbf9d0140df58928bd7df22e00c8b602ef47a92102e507af2266c'],
] as const;

export const infrahyoidMuscleBindings = rows.map(([slug, fmaId, laterality, file, sha256]) => ({
  id: `vm:anatomy:body:head-neck:${laterality}:muscle:${slug}`,
  fmaId, laterality, bundle: 'head-neck-muscles', nodeName: fmaId,
  sources: [{ file, sha256 }],
}));

export const infrahyoidContextBindings = [
  {
    id: 'vm:anatomy:body:head-neck:midline:bone:hyoid-bone',
    fmaId: 'FMA52749', laterality: 'midline', bundle: 'head-neck-skeleton', nodeName: 'FMA52749',
    sources: [
      { file: 'FJ2772', sha256: 'c8c6cfdd66285cdda16fa441829f723d3943823d0ffebf5e394ff8dc49a598b1' },
      { file: 'FJ3201', sha256: 'c52dd55001d86286d6469190d3673cc8b2b03fb3d9c29d45cec211192950c027' },
    ],
  },
  {
    id: 'vm:anatomy:body:head-neck:midline:cartilage:thyroid-cartilage',
    fmaId: 'FMA55099', laterality: 'midline', bundle: 'head-neck-connective-recovery', nodeName: 'FMA55099',
    sources: [{ file: 'FJ2808', sha256: '48cd41bcd4044c7013ba10c971e212766afc970408f51875f9ef8e8c407c0687' }],
  },
] as const;

const contextFmaIds = infrahyoidContextBindings.map((binding) => binding.fmaId);
export const infrahyoidLayerStudies = [
  {
    id: 'infrahyoid-superficial-pair',
    title: 'Infrahyoid · superficial layer',
    targetFmaIds: infrahyoidMuscleBindings.slice(0, 4).map((binding) => binding.fmaId),
    contextFmaIds,
    description: 'Compare the supplied sternohyoid and omohyoid exterior surfaces with the hyoid and thyroid cartilage as fixed source landmarks.',
    inspect: 'Select a surface, Remove it, and Undo to restore it; rotate to compare the supplied shape from another side. This conventional superficial grouping does not prove a fascia plane, attachment, innervation, thyroid boundary, motion, swallowing, airway clearance, procedural route, or patient-image registration. Source boundaries and relationships await radiologist review.',
  },
  {
    id: 'infrahyoid-deep-pair',
    title: 'Infrahyoid · deep layer',
    targetFmaIds: infrahyoidMuscleBindings.slice(4).map((binding) => binding.fmaId),
    contextFmaIds,
    description: 'Compare the supplied sternothyroid and thyrohyoid exterior surfaces with the same fixed hyoid and thyroid-cartilage landmarks.',
    inspect: 'Select a surface, Remove it, and Undo to restore it; rotate to compare the supplied shape from another side. This conventional deep grouping does not prove a fascia plane, attachment, innervation, thyroid boundary, motion, swallowing, airway clearance, procedural route, or patient-image registration. Source boundaries and relationships await radiologist review.',
  },
] as const;
