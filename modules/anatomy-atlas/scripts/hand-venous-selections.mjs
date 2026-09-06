export const handVenousDefinitions = [
  ['FMA22912', 'right deep palmar venous arch', ['FJ2281']],
  ['FMA22913', 'left deep palmar venous arch', ['FJ2229']],
  ['FMA22915', 'right superficial palmar venous arch', ['FJ2301']],
  ['FMA22916', 'left superficial palmar venous arch', ['FJ2249']],
  ['FMA62506', 'dorsal venous network of right hand', ['FJ2280']],
  ['FMA62507', 'dorsal venous network of left hand', ['FJ2228']],
  ['FMA22920', 'right palmar metacarpal vein', ['FJ2290', 'FJ2350', 'FJ2353']],
  ['FMA22921', 'left palmar metacarpal vein', ['FJ2238', 'FJ2320', 'FJ2323']],
  [
    'FMA85096',
    'proper palmar digital vein of right index finger',
    ['FJ2354', 'FJ2355'],
  ],
  [
    'FMA85097',
    'proper palmar digital vein of left index finger',
    ['FJ2324', 'FJ2325'],
  ],
  [
    'FMA85098',
    'proper palmar digital vein of right middle finger',
    ['FJ2356', 'FJ2357'],
  ],
  [
    'FMA85099',
    'proper palmar digital vein of left middle finger',
    ['FJ2326', 'FJ2340'],
  ],
  [
    'FMA85100',
    'proper palmar digital vein of right ring finger',
    ['FJ2358', 'FJ2359'],
  ],
  [
    'FMA85101',
    'proper palmar digital vein of left ring finger',
    ['FJ2327', 'FJ2328'],
  ],
  [
    'FMA85102',
    'proper palmar digital vein of right little finger',
    ['FJ2349', 'FJ2351', 'FJ2360'],
  ],
  [
    'FMA85103',
    'proper palmar digital vein of left little finger',
    ['FJ2319', 'FJ2321', 'FJ2329'],
  ],
];
// Engineering admission is not clinical validation; see HAND_VENOUS_DETAIL.md.
export const handVenousAdmissions = [
  'FMA22912',
  'FMA22913',
  'FMA22915',
  'FMA22916',
  'FMA62506',
  'FMA62507',
  'FMA22920',
  'FMA22921',
  'FMA85096',
  'FMA85097',
  'FMA85098',
  'FMA85099',
  'FMA85100',
  'FMA85101',
];
export const handVenousHeldIds = ['FMA85102', 'FMA85103'];
export function handVenousCandidates(isa) {
  return handVenousDefinitions.map(([fma, name, files]) => {
    const record = isa.get(fma);
    if (!record || record.name !== name || record.files.join() !== files.join())
      throw Error('Source definition changed: ' + fma);
    return {
      fma,
      name,
      files,
      region: 'hand',
      system: 'vessels',
      category: 'vessel',
      tree: 'isa',
      recovery: true,
      handVenousRecovery: true,
      coverageNote:
        'Unvalidated BodyParts3D 4.0 source venous surface in the unchanged common coordinate frame. Grouped components retain one source identity; they are not independently named tributaries. No complete drainage pathway, valves, lumen, flow, vascular connection or patient registration is established. Missing segments and digital nerves are not invented.',
    };
  });
}
export const handVenousSelections = (isa) =>
  handVenousCandidates(isa).filter((candidate) =>
    handVenousAdmissions.includes(candidate.fma),
  );
