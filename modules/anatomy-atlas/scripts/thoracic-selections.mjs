export const thoracicDefinitions = [
  ['FMA4149', 'esophageal artery', ['FJ1934']],
  ['FMA10704', 'variant bronchial artery', ['FJ3418']],
  ['FMA68109', 'bronchial artery', ['FJ1933']],
  ['FMA71537', 'set of oesophageal branches of thoracic aorta', ['FJ3431']],
];
// Exact source admission only, not clinical sign-off. See THORACIC_DETAIL.md.
// FMA14177 is an alias of FMA10704/FJ3418, never a second rendered owner.
export const thoracicAdmissions = [
  'FMA4149',
  'FMA10704',
  'FMA68109',
  'FMA71537',
];
export const thoracicHeldIds = [];
export function thoracicCandidates(isa) {
  return thoracicDefinitions.map(([fma, name, files]) => {
    const record = isa.get(fma);
    if (!record || record.name !== name || record.files.join() !== files.join())
      throw Error('Source definition changed: ' + fma);
    return {
      fma,
      name,
      files,
      region: 'thorax',
      system: 'vessels',
      category: 'vessel',
      tree: 'isa',
      recovery: true,
      thoracicRecovery: true,
      coverageNote:
        'Unvalidated BodyParts3D 4.0 source surface in the unchanged common coordinate frame. Source vessel names do not establish normal branching, a complete vascular tree, continuity, lumen or perfusion. Grouped branches retain one source identity; the variant-labelled source is not a normal-anatomy template.',
    };
  });
}
export const thoracicSelections = (isa) =>
  thoracicCandidates(isa).filter((candidate) =>
    thoracicAdmissions.includes(candidate.fma),
  );
