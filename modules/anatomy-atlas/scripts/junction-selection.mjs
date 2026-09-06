export const junctionId =
  'vm:anatomy:body:abdomen:unpaired:organ:ileocecal-junction';
export const junctionParents = ['FMA7200', 'FMA7201'];
export function junctionSelections(isa) {
  const source = isa.get('FMA11338');
  if (source?.name !== 'ileocecal junction' || source.files.join() !== 'FJ2599')
    throw Error('Ileocecal source identity changed');
  return [
    {
      fma: source.id,
      name: source.name,
      files: [...source.files],
      tree: 'isa',
      region: 'abdomen',
      system: 'organs',
      category: 'organ',
      recovery: true,
      junctionRecovery: true,
      coverageNote:
        'Unvalidated BodyParts3D 4.0 ileocecal-junction source surface, separated from both bowel display aggregates without changing coordinates or shape. The source also aliases this surface to cecal and ileal-wall concepts; it is not a separately validated cecum, valve, bowel wall or surgical plane. This corrects duplicate rendering, not missing tissue. No imaging appearance or patient registration is established.',
    },
  ];
}
