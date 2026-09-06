// Pinned source definitions: no inferred subdivisions, attachments or mirrored additions.
/** @type {Array<[string, string, string[], string, string, string[]]>} */
export const axialDefinitions = [
  [
    'FMA40120',
    'flexor retinaculum of right wrist',
    ['FJ1471'],
    'connective',
    'hand',
    ['forearm'],
  ],
  [
    'FMA40121',
    'flexor retinaculum of left wrist',
    ['FJ1471M'],
    'connective',
    'hand',
    ['forearm'],
  ],
  [
    'FMA58776',
    'right iliotibial tract',
    ['FJ1423'],
    'connective',
    'thigh',
    ['pelvis', 'leg'],
  ],
  [
    'FMA58777',
    'left iliotibial tract',
    ['FJ1423M'],
    'connective',
    'thigh',
    ['pelvis', 'leg'],
  ],
  ['FMA11336', 'linea alba', ['FJ1448'], 'connective', 'abdomen', []],
  [
    'FMA71307',
    'set of interspinales lumborum',
    ['FJ1550', 'FJ1550M'],
    'muscles',
    'spine',
    [],
  ],
  [
    'FMA71309',
    'set of interspinales cervicis',
    ['FJ1552', 'FJ1552M'],
    'muscles',
    'spine',
    ['head-neck'],
  ],
  [
    'FMA71442',
    'set of anterior cervical intertransversarii',
    ['FJ1549', 'FJ1549M'],
    'muscles',
    'spine',
    ['head-neck'],
  ],
  [
    'FMA71443',
    'set of posterior cervical intertransversarii',
    ['FJ1553', 'FJ1553M'],
    'muscles',
    'spine',
    ['head-neck'],
  ],
  [
    'FMA74077',
    'set of right levatores costarum breves',
    ['FJ1462'],
    'muscles',
    'spine',
    ['thorax'],
  ],
  [
    'FMA74078',
    'set of left levatores costarum breves',
    ['FJ1462M'],
    'muscles',
    'spine',
    ['thorax'],
  ],
];

// Both longi candidates span almost the same full thoracic extent as breves.
// Hold pending fibre-course, level and overlap adjudication, not proof of a source error.
export const axialHeldDefinitions = [
  ['FMA74075', 'set of right levatores costarum longi', ['FJ1463']],
  ['FMA74076', 'set of left levatores costarum longi', ['FJ1463M']],
];

export function axialSelections(isa) {
  return axialDefinitions.map(
    ([fma, name, files, system, region, extraRegions]) => {
      const source = isa.get(fma);
      if (
        !source ||
        source.name !== name ||
        JSON.stringify(source.files) !== JSON.stringify(files)
      )
        throw Error('Connective / axial source definition changed: ' + fma);
      return {
        fma,
        name,
        files: [...files],
        system,
        region,
        extraRegions,
        tree: 'isa',
        category:
          system === 'muscles'
            ? 'muscle'
            : /retinaculum/.test(name)
              ? 'ligament'
              : 'fascia',
        recovery: true,
        axialRecovery: true,
        coverageNote:
          'Unvalidated BodyParts3D 4.0 source surface in its unchanged common coordinate frame. ' +
          (name.startsWith('set of ')
            ? 'A source muscle set, not individually segmented fascicles or verified vertebral-level attachments. '
            : '') +
          (files.length > 1
            ? 'The source groups both sides under one identity; its components are not separately side-labelled. '
            : '') +
          (system === 'connective'
            ? 'Thickness, attachment footprints and tissue continuity are not certified; broad fascial source aliases do not establish a complete fascia layer. '
            : '') +
          'No patient registration or imaging appearance is established.',
      };
    },
  );
}
