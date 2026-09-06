// Explicit engineering admissions; source surfaces remain clinically unvalidated.
export const ocularDefinitions = [
  ['FMA59582', 'right lacrimal canaliculus', ['FJ1349']],
  ['FMA59583', 'left lacrimal canaliculus', ['FJ1298']],
  ['FMA59555', 'right nasolacrimal duct', ['FJ1353']],
  ['FMA59556', 'left nasolacrimal duct', ['FJ1302']],
  ['FMA59545', 'right lacrimal sac', ['FJ1360']],
  ['FMA59546', 'left lacrimal sac', ['FJ1309']],
  ['FMA59091', 'tarsal plate of right upper eyelid', ['FJ1375']],
  ['FMA59092', 'tarsal plate of left upper eyelid', ['FJ1324']],
  ['FMA59089', 'tarsal plate of right lower eyelid', ['FJ1379']],
  ['FMA59090', 'tarsal plate of left lower eyelid', ['FJ1328']],
];
export const ocularAdmissions = ocularDefinitions.map(([fma]) => fma);
export function ocularSelections(isa) {
  return ocularDefinitions.map(([fma, name, files]) => {
    const source = isa.get(fma);
    if (!source || source.name !== name || source.files.join() !== files.join())
      throw Error('Source definition changed: ' + fma);
    const plate = name.includes('tarsal plate');
    return {
      fma,
      name,
      files,
      region: 'head-neck',
      system: plate ? 'connective' : 'organs',
      category: plate ? 'connective-tissue' : 'organ',
      tree: 'isa',
      recovery: true,
      ocularRecovery: true,
      coverageNote:
        'Unvalidated BodyParts3D 4.0 eye-region source surface in unchanged common coordinates. Source names do not establish complete eyelid layers, attachments, puncta, valves, gland ducts, canalicular subdivisions, lumen, tear flow or patient registration. No absent structure or connection is invented.',
    };
  });
}
