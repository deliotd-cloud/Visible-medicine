export const footVascularDefinitions = [
  ['FMA43943', 'right plantar arch', ['FJ2169']],
  ['FMA43944', 'left plantar arch', ['FJ2085']],
  ['FMA69514', 'right deep plantar artery', ['FJ2136']],
  ['FMA69515', 'left deep plantar artery', ['FJ2068']],
  ['FMA43937', 'right superficial medial plantar artery', ['FJ2179']],
  ['FMA43938', 'left superficial medial plantar artery', ['FJ2089']],
  ['FMA44883', 'plantar venous arch of right foot', ['FJ2129']],
  ['FMA44884', 'plantar venous arch of left foot', ['FJ2128']],
  ['FMA44881', 'dorsal venous arch of right foot', ['FJ2061', 'FJ2062']],
  ['FMA44882', 'dorsal venous arch of left foot', ['FJ2059', 'FJ2060']],
];
// Engineering admission is not clinical validation; see FOOT_VASCULAR_DETAIL.md.
export const footVascularAdmissions = [
  'FMA43943',
  'FMA43944',
  'FMA69514',
  'FMA69515',
  'FMA43937',
  'FMA43938',
  'FMA44881',
  'FMA44882',
];
export const footVascularHeldIds = ['FMA44883', 'FMA44884'];
export function footVascularCandidates(isa) {
  return footVascularDefinitions.map(([fma, name, files]) => {
    const source = isa.get(fma);
    if (!source || source.name !== name || source.files.join() !== files.join())
      throw Error('Source definition changed: ' + fma);
    return {
      fma,
      name,
      files,
      region: 'foot',
      system: 'vessels',
      category: 'vessel',
      tree: 'isa',
      recovery: true,
      footVascularRecovery: true,
      coverageNote:
        'Unvalidated BodyParts3D 4.0 source vessel surface in unchanged common coordinates. Grouped components retain one source identity, not newly named branches. No complete vascular tree, lumen, valves, flow, confirmed connection, surgical plane or patient registration is established. Missing foot vessels and plantar nerves are not invented.',
    };
  });
}
export const footVascularSelections = (isa) =>
  footVascularCandidates(isa).filter((candidate) =>
    footVascularAdmissions.includes(candidate.fma),
  );
