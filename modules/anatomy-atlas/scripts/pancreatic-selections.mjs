export const pancreaticDefinitions = [
  [
    'FMA55077',
    'pharyngeal raphe',
    ['FJ2749'],
    'head-neck',
    'connective',
    'raphe',
  ],
  ['FMA55130', 'epiglottis', ['FJ2770'], 'head-neck', 'organs', 'organ'],
  ['FMA14782', 'anterior superior pancreaticoduodenal artery', ['FJ3409']],
  ['FMA14784', 'posterior superior pancreaticoduodenal artery', ['FJ3557']],
  ['FMA14787', 'dorsal pancreatic artery', ['FJ3430']],
  ['FMA14790', 'inferior pancreatic artery', ['FJ3444']],
  ['FMA14792', 'great pancreatic artery', ['FJ3433']],
  ['FMA14793', 'caudal pancreatic artery', ['FJ3419']],
  ['FMA14805', 'inferior pancreaticoduodenal artery', ['FJ3446']],
  ['FMA15398', 'pancreaticoduodenal vein', ['FJ3545', 'FJ3646', 'FJ3655']],
  ['FMA70479', 'anterior inferior pancreaticoduodenal artery', ['FJ3401']],
  ['FMA70480', 'posterior inferior pancreaticoduodenal artery', ['FJ3546']],
  ['FMA76574', 'trunk of gastroduodenal artery', ['FJ3432']],
];
// Explicit engineering admission, not clinical sign-off. See PANCREATIC_DETAIL.md.
export const pancreaticAdmissions = [
  'FMA55130',
  'FMA14782',
  'FMA14784',
  'FMA14787',
  'FMA14790',
  'FMA14792',
  'FMA14793',
  'FMA14805',
  'FMA15398',
  'FMA70479',
  'FMA70480',
  'FMA76574',
];
export const pancreaticHeldIds = ['FMA55077'];
export function pancreaticCandidates(isa) {
  return pancreaticDefinitions.map(
    ([
      fma,
      name,
      files,
      region = 'abdomen',
      system = 'vessels',
      category = 'vessel',
    ]) => {
      const record = isa.get(fma);
      if (
        !record ||
        record.name !== name ||
        record.files.join() !== files.join()
      )
        throw Error('Source definition changed: ' + fma);
      return {
        fma,
        name,
        files,
        region,
        system,
        category,
        tree: 'isa',
        recovery: true,
        pancreaticRecovery: true,
        coverageNote:
          'Unvalidated BodyParts3D 4.0 source surface in the unchanged common coordinate frame. Source identity is not clinical confirmation of tissue extent, attachment, continuity or variants. No patient-specific imaging or procedural guidance is established.',
      };
    },
  );
}
export const pancreaticSelections = (isa) =>
  pancreaticCandidates(isa).filter((candidate) =>
    pancreaticAdmissions.includes(candidate.fma),
  );
