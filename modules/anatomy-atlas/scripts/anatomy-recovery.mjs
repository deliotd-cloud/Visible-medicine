// Explicit source concepts only. A label match is not clinical validation.
// Prefer IS-A component surfaces: PART-OF artery concepts often include branches.
export function recoverySelections(isa, partof) {
  const rows = [];
  const add = (names, system, region, category, options = {}) => {
    for (const name of names) {
      let tree = options.tree ?? 'isa';
      let found = [...(tree === 'isa' ? isa : partof).values()].filter(
        (r) => r.name === name,
      );
      if (!found.length && options.fallback) {
        tree = 'partof';
        found = [...partof.values()].filter((r) => r.name === name);
      }
      if (found.length !== 1)
        throw new Error(`Recovery concept ${tree}: ${name} (${found.length})`);
      const r = found[0];
      rows.push({
        fma: r.id,
        name,
        files: r.files,
        tree,
        system,
        region,
        category,
        recovery: true,
        extraRegions: options.extraRegions ?? [],
        coverageNote:
          options.note ??
          'Recovered source surface. Anatomical boundaries, detail and spatial relationships have not been independently reviewed.',
      });
    }
  };
  const paired = (names) =>
    names.flatMap((name) => [`right ${name}`, `left ${name}`]);
  add(
    ['manubrium', 'body of sternum', 'xiphoid process'],
    'skeleton',
    'thorax',
    'bone',
  );
  add(
    paired(
      ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'].map(
        (n) => `${n} costal cartilage`,
      ),
    ),
    'connective',
    'thorax',
    'cartilage',
  );
  add(
    [
      'septal nasal cartilage',
      ...paired(['major alar cartilage', 'lateral nasal cartilage']),
    ],
    'connective',
    'head-neck',
    'cartilage',
    { tree: 'partof' },
  );
  add(
    [
      'thyroid cartilage',
      'cricoid cartilage',
      ...paired(['arytenoid cartilage']),
    ],
    'connective',
    'head-neck',
    'cartilage',
  );
  add(paired(['long plantar ligament']), 'connective', 'foot', 'ligament');
  add(
    ['set of lumbricals of right hand', 'set of lumbricals of left hand'],
    'muscles',
    'hand',
    'muscle',
    {
      note: 'One source mesh represents the lumbrical group on this side. Individual first–fourth lumbricals are not separately segmented; attachments and numbering require review.',
    },
  );
  add(['prostate'], 'organs', 'pelvis', 'organ', { tree: 'partof' });
  add(paired(['testis', 'seminal vesicle']), 'organs', 'pelvis', 'organ');
  add(paired(['ureter']), 'organs', 'abdomen', 'organ', {
    tree: 'partof',
    extraRegions: ['pelvis'],
  });
  add(['thymus'], 'organs', 'thorax', 'organ', { tree: 'partof' });
  add(['pituitary gland'], 'organs', 'head-neck', 'organ');
  add(paired(['eyeball']), 'organs', 'head-neck', 'organ', {
    tree: 'partof',
    note: 'Compound eyeball surface. Internal components are grouped, not an independently reviewed ocular-layer dissection.',
  });
  add(['rectum'], 'organs', 'pelvis', 'organ', {
    note: 'Source rectum surface separated from the large-intestine aggregate for selection. No wall-layer, sphincter or mesorectal dissection is supplied.',
  });

  const vessel = (names, region, extraRegions = []) =>
    add(names, 'vessels', region, 'vessel', {
      extraRegions,
      fallback: true,
      note: 'Selected source vessel segment, not a complete vascular tree. Branch continuity, calibre and vessel–nerve relationships require review. Red/blue denotes artery/vein, not oxygenation.',
    });
  vessel(
    [
      'ascending aorta',
      'arch of aorta',
      'descending thoracic aorta',
      'superior vena cava',
      'azygos vein',
      'hemiazygos vein',
    ],
    'thorax',
  );
  vessel(['abdominal aorta', 'inferior vena cava'], 'abdomen', [
    'pelvis',
    'thorax',
  ]);
  vessel(
    [
      'brachiocephalic artery',
      ...paired([
        'subclavian artery',
        'brachiocephalic vein',
        'subclavian vein',
      ]),
    ],
    'thorax',
    ['shoulder-arm', 'head-neck'],
  );
  vessel(
    paired([
      'common carotid artery',
      'internal carotid artery',
      'vertebral artery',
      'internal jugular vein',
    ]),
    'head-neck',
    ['thorax'],
  );
  vessel(
    [
      'basilar artery',
      'anterior communicating artery',
      ...paired([
        'anterior cerebral artery',
        'posterior cerebral artery',
        'posterior communicating artery',
      ]),
    ],
    'head-neck',
  );
  vessel(
    [
      'trunk of right coronary artery',
      'trunk of left coronary artery',
      'anterior interventricular branch of left coronary artery',
      'circumflex branch of left coronary artery',
      'great cardiac vein',
      'middle cardiac vein',
    ],
    'thorax',
  );
  vessel(
    paired([
      'pulmonary artery',
      'superior pulmonary vein',
      'inferior pulmonary vein',
    ]),
    'thorax',
  );
  vessel(
    [
      'celiac artery',
      'superior mesenteric artery',
      'inferior mesenteric artery',
      'common hepatic artery',
      'hepatic artery proper',
      'splenic artery',
      'left gastric artery',
      'hepatic portal vein',
      ...paired(['renal artery', 'hepatic vein']),
    ],
    'abdomen',
  );
  vessel(
    paired([
      'common iliac artery',
      'external iliac artery',
      'internal iliac artery',
      'common iliac vein',
      'external iliac vein',
      'internal iliac vein',
    ]),
    'pelvis',
    ['abdomen', 'thigh'],
  );
  vessel(
    paired([
      'axillary artery',
      'brachial artery',
      'deep brachial artery',
      'anterior circumflex humeral artery',
      'posterior circumflex humeral artery',
      'circumflex scapular artery',
      'thoracodorsal artery',
    ]),
    'shoulder-arm',
  );
  vessel(
    paired(['radial artery', 'ulnar artery', 'anterior interosseous artery']),
    'forearm',
    ['hand'],
  );
  vessel(paired(['cephalic vein', 'basilic vein']), 'forearm', [
    'shoulder-arm',
  ]);
  vessel(paired(['deep palmar arch']), 'hand');
  vessel(
    paired([
      'femoral artery',
      'deep femoral artery',
      'femoral vein',
      'great saphenous vein',
    ]),
    'thigh',
    ['pelvis', 'leg'],
  );
  vessel(
    paired([
      'popliteal artery',
      'anterior tibial artery',
      'posterior tibial artery',
      'popliteal vein',
      'small saphenous vein',
    ]),
    'leg',
    ['foot'],
  );
  vessel(
    paired([
      'dorsalis pedis artery',
      'medial plantar artery',
      'lateral plantar artery',
    ]),
    'foot',
  );
  return rows;
}
