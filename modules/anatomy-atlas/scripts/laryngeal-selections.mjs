import { laryngealDefinitions } from './laryngeal-candidates.mjs';
export const laryngealAdmissions = ['FMA55133', 'FMA55134'];
export const laryngealHeldIds = [
  'FMA55251',
  'FMA55252',
  'FMA46604',
  'FMA46605',
  'FMA55619',
  'FMA55620',
];
export function laryngealSelections(isa) {
  return laryngealDefinitions
    .filter(([id]) => laryngealAdmissions.includes(id))
    .map(([fma, name, file, system, category]) => {
      const source = isa.get(fma);
      if (!source || source.name !== name || source.files.join() !== file)
        throw Error('Source definition changed: ' + fma);
      return {
        fma,
        name,
        files: [file],
        region: 'head-neck',
        system,
        category,
        tree: 'isa',
        recovery: true,
        laryngealRecovery: true,
        coverageNote:
          'Unvalidated BodyParts3D 4.0 source-labelled thyrohyoid membrane in unchanged common coordinates. Full attachments, thickness, perforating vessels/nerves, swallowing and operative planes are not established. Conus elasticus, aryepiglotticus and pterygomandibular raphe candidates remain withheld for source review; no missing tissue or patient registration is invented.',
      };
    });
}
