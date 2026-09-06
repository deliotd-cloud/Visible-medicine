// Same-version source identities, not inferred segmentations or neural pathways.
/** @type {Array<[string, string, string[]]>} */
export const neuroDefinitions = [
  ['FMA72826', 'right caudate nucleus', ['FJ1802']],
  ['FMA72827', 'left caudate nucleus', ['FJ1754']],
  ['FMA72828', 'right putamen', ['FJ1823']],
  ['FMA72829', 'left putamen', ['FJ1776']],
  ['FMA72830', 'right globus pallidus', ['FJ1805']],
  ['FMA72831', 'left globus pallidus', ['FJ1757']],
  ['FMA72832', 'right amygdala', ['FJ1829']],
  ['FMA72833', 'left amygdala', ['FJ1753']],
  ['FMA258714', 'right thalamus', ['FJ1827']],
  ['FMA258716', 'left thalamus', ['FJ1782']],
  ['FMA73303', 'right lateral geniculate body', ['FJ1813']],
  ['FMA73304', 'left lateral geniculate body', ['FJ1766']],
  ['FMA73309', 'right medial geniculate body', ['FJ1816']],
  ['FMA73310', 'left medial geniculate body', ['FJ1816M']],
  ['FMA72924', 'right fornix of forebrain', ['FJ1804']],
  ['FMA72925', 'left fornix of forebrain', ['FJ1756']],
  ['FMA61961', 'anterior commissure', ['FJ1734']],
  ['FMA61970', 'commissure of fornix of forebrain', ['FJ1741']],
  ['FMA62072', 'posterior commissure', ['FJ1799']],
  ['FMA86464', 'corpus callosum', ['FJ1742']],
  ['FMA61934', 'choroid plexus of cerebral hemisphere', ['FJ1755', 'FJ1803']],
  ['FMA74877', 'mammillary body', ['FJ1768', 'FJ1815']],
];

export function neuroSelections(isa) {
  return neuroDefinitions.map(([fma, name, files]) => {
    const source = isa.get(fma);
    if (
      !source ||
      source.name !== name ||
      JSON.stringify(source.files) !== JSON.stringify(files)
    )
      throw Error('Deep-brain source definition changed: ' + fma);
    return {
      fma,
      name,
      files: [...files],
      tree: 'isa',
      system: 'nerves',
      category: 'organ',
      region: 'head-neck',
      extraRegions: [],
      recovery: true,
      neuroRecovery: true,
      coverageNote:
        'Unvalidated deep-brain source surface in the unchanged BodyParts3D 4.0 reference frame. ' +
        (files.length > 1
          ? 'The source definition groups left and right components; they are not separately labelled here. '
          : '') +
        'No internal nuclear subdivision, axonal connectivity, diffusion tractography, MRI signal or patient registration is established.',
    };
  });
}
