// A second explicit pass, traced from the older concept index back to v4 meshes.
// Do not import v3 coordinates into v4: the skeleton and organs were repositioned.
export function gapSelections(isa) {
  const rows = [];
  const add = (ids, system, region, category, extraRegions = [], note = '') => {
    for (const id of ids) {
      const r = isa.get(id);
      if (!r) throw new Error(`Missing v4 gap source ${id}`);
      rows.push({
        fma: id,
        name: r.name,
        files: r.files,
        tree: 'isa',
        system,
        region,
        category,
        extraRegions,
        recovery: true,
        gapRecovery: true,
        coverageNote:
          `${note} Recovered from the v4 source in its unchanged common coordinate frame. Independent anatomical review is pending.`.trim(),
      });
    }
  };
  add(
    ['FMA42402', 'FMA42403', 'FMA42404', 'FMA42405'],
    'muscles',
    'hand',
    'muscle',
    [],
    'One source surface represents a set of interossei on this side, not individually segmented or numbered muscles.',
  );
  add(
    ['FMA23707', 'FMA23708'],
    'connective',
    'forearm',
    'ligament',
    [],
    'Interosseous membrane surface; individual bundles and insertions are not separately segmented.',
  );
  add(
    ['FMA35192', 'FMA35193'],
    'connective',
    'leg',
    'ligament',
    [],
    'Interosseous membrane surface; individual bundles and insertions are not separately segmented.',
  );
  add(
    ['FMA258847', 'FMA264844'],
    'connective',
    'leg',
    'tendon',
    ['foot'],
    'Calcaneal (Achilles) tendon surface. Subtendons, paratenon and enthesis are not separately segmented.',
  );
  // Pelvic-floor candidates are held: near-coincident alternative surfaces and
  // cross-midline right-side bounds need mesh-level anatomical adjudication.
  // Optic-nerve candidates also contain overlapping alternatives; do not combine.
  add(
    ['FMA50881', 'FMA50882'],
    'nerves',
    'head-neck',
    'nerve',
    [],
    'Selected source cranial-nerve representation only; this does not add limb nerves or a complete cranial-nerve tree.',
  );
  add(
    [
      'FMA54640',
      'FMA59102',
      'FMA59103',
      'FMA59802',
      'FMA59803',
      'FMA59804',
      'FMA59805',
    ],
    'organs',
    'head-neck',
    'organ',
    [],
    'Whole source organ representation; internal layers, ducts and subdivisions have not been independently authored.',
  );
  add(
    ['FMA18256', 'FMA18257', 'FMA19667'],
    'organs',
    'pelvis',
    'organ',
    [],
    'Selected adult-male urinary/reproductive source representation; no complete tract or wall-layer dissection is implied.',
  );
  add(
    ['FMA55115', 'FMA55116', 'FMA55117', 'FMA55118'],
    'connective',
    'head-neck',
    'cartilage',
  );
  add(
    [
      'FMA49144',
      'FMA49145',
      'FMA49147',
      'FMA49148',
      'FMA55138',
      'FMA55140',
      'FMA55141',
      'FMA55227',
      'FMA55230',
      'FMA55237',
      'FMA55245',
      'FMA55246',
      'FMA72309',
      'FMA72311',
    ],
    'connective',
    'head-neck',
    'ligament',
    [],
    'Selected source ligament surface. Attachments and adjoining spaces require specialist review.',
  );
  const cervical = [
    'FMA25058',
    'FMA13896',
    'FMA13897',
    'FMA13898',
    'FMA13899',
    'FMA13900',
  ];
  const thoracic = [
    'FMA10458',
    'FMA13495',
    'FMA13500',
    'FMA13501',
    'FMA13502',
    'FMA13503',
    'FMA13504',
    'FMA13505',
    'FMA13506',
    'FMA13507',
    'FMA13508',
  ];
  const lumbar = ['FMA16033', 'FMA16034', 'FMA16035', 'FMA16036', 'FMA16037'];
  for (const [ids, extra] of [
    [cervical, ['head-neck']],
    [thoracic, ['thorax']],
    [lumbar, ['abdomen']],
  ])
    add(
      ids,
      'connective',
      'spine',
      'cartilage',
      extra,
      'Whole-disc source surface. Annulus, nucleus and endplates are not independently segmented. Source vertebral naming is retained; this is not a validated radiological level annotation.',
    );
  return rows;
}
