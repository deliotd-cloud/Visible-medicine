export const handVascularDefinitions = [
  ['FMA22835', 'right superficial palmar arterial arch', ['FJ2300']],
  ['FMA22837', 'left superficial palmar arterial arch', ['FJ2248']],
  ['FMA22864', 'right palmar metacarpal artery', ['FJ2289']],
  ['FMA22865', 'left palmar metacarpal artery', ['FJ2237']],
  ['FMA22905', 'right arteria princeps pollicis', ['FJ2371', 'FJ2372']],
  ['FMA22907', 'left arteria princeps pollicis', ['FJ2338', 'FJ2339']],
  ['FMA22777', 'right arteria radialis indicis', ['FJ2342', 'FJ2363']],
  ['FMA22778', 'left arteria radialis indicis', ['FJ2314', 'FJ2332']],
  ['FMA22856', 'right first common palmar digital artery', ['FJ2343']],
  ['FMA85118', 'left first common palmar digital artery', ['FJ2315']],
  ['FMA85119', 'right second common palmar digital artery', ['FJ2344']],
  ['FMA85120', 'left second common palmar digital artery', ['FJ2316']],
  ['FMA85121', 'right third common palmar digital artery', ['FJ2345']],
  ['FMA85122', 'left third common palmar digital artery', ['FJ2317']],
  ['FMA85123', 'right fourth common palmar digital artery', ['FJ2370']],
  ['FMA85124', 'left fourth common palmar digital artery', ['FJ2337']],
  [
    'FMA22858',
    'lateral proper palmar digital artery of right middle finger',
    ['FJ2365'],
  ],
  [
    'FMA22860',
    'lateral proper palmar digital artery of left middle finger',
    ['FJ2334'],
  ],
  [
    'FMA23050',
    'medial proper palmar digital artery of right index finger',
    ['FJ2364'],
  ],
  [
    'FMA23051',
    'medial proper palmar digital artery of left index finger',
    ['FJ2333'],
  ],
  [
    'FMA23052',
    'medial proper palmar digital artery of right ring finger',
    ['FJ2369'],
  ],
  [
    'FMA23054',
    'lateral proper palmar digital artery of right little finger',
    ['FJ2368'],
  ],
  [
    'FMA23055',
    'lateral proper palmar digital artery of left little finger',
    ['FJ2336'],
  ],
  [
    'FMA85112',
    'medial proper palmar digital artery of right middle finger',
    ['FJ2367'],
  ],
  [
    'FMA85115',
    'lateral proper palmar digital artery of right ring finger',
    ['FJ2366'],
  ],
  [
    'FMA85116',
    'lateral proper palmar digital artery of left ring finger',
    ['FJ2335'],
  ],
];
// Source-level engineering admission, not clinical approval. See HAND_VASCULAR_DETAIL.md.
export const handVascularAdmissions = [
  'FMA22835',
  'FMA22837',
  'FMA22864',
  'FMA22865',
  'FMA22905',
  'FMA22907',
  'FMA22777',
  'FMA22778',
  'FMA22856',
  'FMA85118',
  'FMA85119',
  'FMA85120',
  'FMA85121',
  'FMA85122',
  'FMA85123',
  'FMA85124',
  'FMA22858',
  'FMA22860',
  'FMA23050',
  'FMA23051',
  'FMA23052',
  'FMA23054',
  'FMA23055',
  'FMA85112',
  'FMA85115',
  'FMA85116',
];
export const handVascularHeldIds = [];
export function handVascularCandidates(isa) {
  return handVascularDefinitions.map(([fma, name, files]) => {
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
      handVascularRecovery: true,
      coverageNote:
        'Unvalidated BodyParts3D 4.0 source surface in the unchanged common coordinate frame. Source labels and numbering do not establish a normal branching pattern, complete arterial arch, patent connection, lumen or perfusion. Multiple components retain their grouped source identity; absent counterparts and nerves are not invented.',
    };
  });
}
export const handVascularSelections = (isa) =>
  handVascularCandidates(isa).filter((candidate) =>
    handVascularAdmissions.includes(candidate.fma),
  );
