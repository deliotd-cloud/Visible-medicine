import type {
  ArterialDefinitions,
  ArterialRelationKind,
} from '../lib/regional-arterial';

// Original bounded relationship map. No imported diagrams, vascular endpoints or donor findings.
export const upperArterialReferences = {
  neck: 'https://anatomy.ttuhscep.edu/nervous_system/antneck_tables.html',
  university:
    'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
  landmarks:
    'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/',
  scapularVariation: 'https://pubmed.ncbi.nlm.nih.gov/8808401/',
  handVariation: 'https://pubmed.ncbi.nlm.nih.gov/15061757/',
} as const;
export const upperArterialConcepts = {
  subclavian: {
    fmaIds: ['FMA3953', 'FMA4694'],
    context: 'shoulder-arm',
    note: 'This map starts at the subclavian selections. Their different right/left upstream origins and all neck branches are not mapped here.',
  },
  axillary: {
    fmaIds: ['FMA22655', 'FMA22656'],
    context: 'shoulder-arm',
    note: 'The source is one axillary selection, not independently selectable first, second and third parts. The separately supplied subscapular source does not establish a measured junction.',
  },
  brachial: {
    fmaIds: ['FMA22691', 'FMA22692'],
    context: 'shoulder-arm',
    note: 'This is a typical branching guide. High origins and other variants are not ruled out or identified in the source donor.',
  },
  deepBrachial: {
    fmaIds: ['FMA22696', 'FMA22697'],
    context: 'shoulder-arm',
    note: 'Profunda brachii is distinct from the brachial selection. Unlisted collateral branches remain outside this bounded map.',
  },
  anteriorCircumflexHumeral: {
    fmaIds: ['FMA22682', 'FMA22683'],
    context: 'shoulder-arm',
    note: 'The anterior and posterior source selections remain separate. Their names do not establish a complete connected ring or perfusion.',
  },
  posteriorCircumflexHumeral: {
    fmaIds: ['FMA22685', 'FMA22687'],
    context: 'shoulder-arm',
    note: 'This selection is an artery, not the accompanying axillary nerve. No nerve path or injury is generated.',
  },
  circumflexScapular: {
    fmaIds: ['FMA23180', 'FMA23181'],
    context: 'shoulder-arm',
    note: 'The usual subscapular parent is separately selectable. This is not shown as a direct axillary branch, and surface proximity does not prove a joined lumen.',
  },
  thoracodorsal: {
    fmaIds: ['FMA66321', 'FMA66322'],
    context: 'shoulder-arm',
    note: 'The source-labelled artery is distinct from the thoracodorsal nerve. Its separately supplied subscapular parent remains a source reference, not a verified donor junction.',
  },
  subscapular: {
    fmaIds: ['FMA22678', 'FMA22679'],
    context: 'shoulder-arm',
    note: 'The finite IS-A source is distinct from the broader branch-containing aggregate. Typical parent and branch relationships are shown; no complete collateral circuit or continuous lumen is inferred.',
  },
  radial: {
    fmaIds: ['FMA22733', 'FMA22734'],
    context: 'forearm',
    note: 'The available selection spans forearm/hand regions. Its visible surface is not proof of an uninterrupted lumen or the origins of individual thumb branches.',
  },
  ulnar: {
    fmaIds: ['FMA22797', 'FMA22798'],
    context: 'forearm',
    note: 'Deep and superficial palmar contributions stay distinct. Not all recurrent, carpal or palmar branches are independently supplied.',
  },
  commonInterosseous: {
    fmaIds: ['FMA22807', 'FMA22808'],
    context: 'forearm',
    note: 'The admitted source is the specific common interosseous selection, not an expanded aggregate of its downstream branches.',
  },
  anteriorInterosseous: {
    fmaIds: ['FMA22812', 'FMA22813'],
    context: 'forearm',
    note: 'The anterior interosseous artery is not the anterior interosseous nerve. Only available arterial selections are linked.',
  },
  recurrentInterosseous: {
    fmaIds: ['FMA268667', 'FMA268669'],
    context: 'forearm',
    note: 'The posterior interosseous trunk is not independently selectable. Its recurrent branch must not be substituted for the missing trunk.',
  },
  deepPalmarArch: {
    fmaIds: ['FMA22839', 'FMA22840'],
    context: 'hand',
    note: 'Deep and superficial arches are separate selections. Completeness, collateral adequacy and patency require evidence beyond these surfaces.',
  },
  superficialPalmarArch: {
    fmaIds: ['FMA22835', 'FMA22837'],
    context: 'hand',
    note: 'Arch formation varies and may be incomplete. Source-numbered common/proper digital arteries are not assigned parents without validated branch identities.',
  },
  palmarMetacarpal: {
    fmaIds: ['FMA22864', 'FMA22865'],
    context: 'hand',
    note: 'One grouped source selection per side is retained; this is not a set of separately numbered metacarpal branches.',
  },
  princepsPollicis: {
    fmaIds: ['FMA22905', 'FMA22907'],
    context: 'hand',
    note: 'Both supplied components remain one source identity per side. Origins vary; the radial relationship is a teaching pattern, not a verified direct source junction.',
  },
  radialisIndicis: {
    fmaIds: ['FMA22777', 'FMA22778'],
    context: 'hand',
    note: 'Both supplied components retain their source identity. Variable origins are not assigned to the source-numbered digital arteries.',
  },
  thoracoacromial: {
    fmaIds: ['FMA66563', 'FMA66564'],
    context: 'shoulder-arm',
    note: 'Only the supplied pectoral, acromial and deltoid branches are mapped. The missing independently labelled clavicular branch is not presumed anatomically absent.',
  },
  pectoral: {
    fmaIds: ['FMA23063', 'FMA23064'],
    context: 'shoulder-arm',
    note: 'This is the source-labelled pectoral branch of the thoracoacromial artery, not all pectoral blood supply.',
  },
  acromial: {
    fmaIds: ['FMA23068', 'FMA23069'],
    context: 'shoulder-arm',
    note: 'The acromial branch remains distinct from surrounding anastomoses; the map does not reconstruct a complete acromial network.',
  },
  deltoid: {
    fmaIds: ['FMA23072', 'FMA23073'],
    context: 'shoulder-arm',
    note: 'This named thoracoacromial branch is not interchangeable with either circumflex humeral artery.',
  },
  thyrocervical: {
    fmaIds: ['FMA3992', 'FMA4084'],
    context: 'shoulder-arm',
    note: 'The supplied inferior thyroid and shoulder-facing branches are mapped. Neck/thyroid supply is not a complete tree here.',
  },
  inferiorThyroid: {
    fmaIds: ['FMA10697', 'FMA10680'],
    context: 'head-neck',
    contextFmaIds: ['FMA52749', 'FMA12519', 'FMA12520', 'FMA12521', 'FMA12522', 'FMA12523', 'FMA12524', 'FMA12525'],
    note: 'A finite source artery surface, not the full thyroid/parathyroid vascular tree. Recurrent laryngeal nerves, gland tissue, lumens and exact source junctions are not supplied by this addition.',
  },
  costocervical: {
    fmaIds: ['FMA5039', 'FMA4086'],
    context: 'shoulder-arm',
    note: 'The map stops at this supplied trunk; no empty branch list should be read as an anatomical termination.',
  },
  dorsalScapular: {
    fmaIds: ['FMA4057', 'FMA10552'],
    context: 'shoulder-arm',
    note: 'Two alternative origin routes are shown for comparison, not simultaneous connections. The transverse cervical artery is not independently supplied; the donor pattern is unresolved.',
  },
  suprascapular: {
    fmaIds: ['FMA10698', 'FMA10681'],
    context: 'shoulder-arm',
    note: 'The usual thyrocervical relation is shown. This is not a complete scapular collateral circuit or an identified donor variant.',
  },
} as const satisfies ArterialDefinitions;
export type UpperArterialConcept = keyof typeof upperArterialConcepts;
export const upperArterialRelations: readonly {
  from: UpperArterialConcept;
  to: UpperArterialConcept;
  kind: ArterialRelationKind;
  note: string;
}[] = [
  {
    from: 'thyrocervical',
    to: 'inferiorThyroid',
    kind: 'branch',
    note: 'Typical inferior thyroid origin from the same-side thyrocervical trunk. Source proximity does not validate a continuous lumen or a donor-specific junction.',
  },
  {
    from: 'subclavian',
    to: 'axillary',
    kind: 'continuation',
    note: 'Name changes at the lateral border of the first rib.',
  },
  {
    from: 'axillary',
    to: 'brachial',
    kind: 'continuation',
    note: 'Name changes at the inferior border of teres major.',
  },
  {
    from: 'brachial',
    to: 'deepBrachial',
    kind: 'branch',
    note: 'Typical profunda brachii branch.',
  },
  {
    from: 'brachial',
    to: 'radial',
    kind: 'branch',
    note: 'Typical terminal branch; origin level can vary.',
  },
  {
    from: 'brachial',
    to: 'ulnar',
    kind: 'branch',
    note: 'Typical terminal branch; origin level can vary.',
  },
  {
    from: 'axillary',
    to: 'anteriorCircumflexHumeral',
    kind: 'branch',
    note: 'Typical circumflex branch.',
  },
  {
    from: 'axillary',
    to: 'posteriorCircumflexHumeral',
    kind: 'branch',
    note: 'Typical circumflex branch.',
  },
  {
    from: 'axillary',
    to: 'subscapular',
    kind: 'branch',
    note: 'Usual subscapular origin from the third part of the axillary artery; source junction unverified.',
  },
  {
    from: 'subscapular',
    to: 'circumflexScapular',
    kind: 'branch',
    note: 'Usual circumflex scapular branch; no complete scapular anastomosis is modelled.',
  },
  {
    from: 'subscapular',
    to: 'thoracodorsal',
    kind: 'branch',
    note: 'Usual thoracodorsal branch; not the thoracodorsal nerve or a verified source junction.',
  },
  {
    from: 'axillary',
    to: 'thoracoacromial',
    kind: 'branch',
    note: 'Typical thoracoacromial origin.',
  },
  {
    from: 'thoracoacromial',
    to: 'pectoral',
    kind: 'branch',
    note: 'Named pectoral branch.',
  },
  {
    from: 'thoracoacromial',
    to: 'acromial',
    kind: 'branch',
    note: 'Named acromial branch.',
  },
  {
    from: 'thoracoacromial',
    to: 'deltoid',
    kind: 'branch',
    note: 'Named deltoid branch.',
  },
  {
    from: 'ulnar',
    to: 'commonInterosseous',
    kind: 'branch',
    note: 'Typical common interosseous origin.',
  },
  {
    from: 'commonInterosseous',
    to: 'anteriorInterosseous',
    kind: 'branch',
    note: 'Anterior division.',
  },
  {
    from: 'commonInterosseous',
    to: 'recurrentInterosseous',
    kind: 'via-unmodelled',
    note: 'Via the missing posterior interosseous trunk, not a claimed direct branch.',
  },
  {
    from: 'radial',
    to: 'deepPalmarArch',
    kind: 'continuation',
    note: 'Principal radial contribution to the deep arch; no flow simulation.',
  },
  {
    from: 'ulnar',
    to: 'deepPalmarArch',
    kind: 'anastomosis',
    note: 'Via the deep palmar branch, not independently supplied. No source lumen connection is established.',
  },
  {
    from: 'ulnar',
    to: 'superficialPalmarArch',
    kind: 'continuation',
    note: 'Principal ulnar contribution; not proof of a complete arch.',
  },
  {
    from: 'radial',
    to: 'superficialPalmarArch',
    kind: 'anastomosis',
    note: 'A variable contribution via the superficial palmar branch, not independently supplied. A complete communication is not guaranteed.',
  },
  {
    from: 'deepPalmarArch',
    to: 'palmarMetacarpal',
    kind: 'branch',
    note: 'Supplied grouped selection; individual numbering is not inferred.',
  },
  {
    from: 'radial',
    to: 'princepsPollicis',
    kind: 'branch',
    note: 'Typical radial-system origin; common stems and other origins vary. No direct junction is verified.',
  },
  {
    from: 'radial',
    to: 'radialisIndicis',
    kind: 'branch',
    note: 'Typical radial-system origin; common stems and other origins vary. No direct junction is verified.',
  },
  {
    from: 'subclavian',
    to: 'thyrocervical',
    kind: 'branch',
    note: 'Typical thyrocervical origin.',
  },
  {
    from: 'subclavian',
    to: 'costocervical',
    kind: 'branch',
    note: 'Typical costocervical origin; subclavian part is not assigned.',
  },
  {
    from: 'thyrocervical',
    to: 'suprascapular',
    kind: 'branch',
    note: 'Usual origin; not a donor-specific finding.',
  },
  {
    from: 'subclavian',
    to: 'dorsalScapular',
    kind: 'variant',
    note: 'Possible direct subclavian origin, alternative to a transverse cervical route. Donor origin is not established.',
  },
  {
    from: 'thyrocervical',
    to: 'dorsalScapular',
    kind: 'variant',
    note: 'Alternative route via the unmodelled transverse cervical artery; not a claimed direct thyrocervical branch or simultaneous second inflow.',
  },
];
