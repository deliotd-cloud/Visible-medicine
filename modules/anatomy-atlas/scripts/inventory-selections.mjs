// Explicit version-4 candidates identified by the exhaustive source inventory.
// Names AND component IDs are pinned. No automatic synonym, mirror or topology inference.
export function inventorySelections(isa, partof) {
  const rows = [];
  function add(
    id,
    name,
    file,
    system,
    region,
    extraRegions = [],
    tree = 'isa',
    note = '',
  ) {
    const record = (tree === 'isa' ? isa : partof).get(id);
    if (
      !record ||
      record.name !== name ||
      record.files.length !== 1 ||
      record.files[0] !== file
    )
      throw Error('Inventory source definition changed: ' + id);
    rows.push({
      fma: id,
      name,
      files: [file],
      tree,
      system,
      region,
      extraRegions,
      category: system === 'vessels' ? 'vessel' : 'organ',
      recovery: true,
      inventoryRecovery: true,
      coverageNote: (
        note +
        ' Source version 4.0 surface in its unchanged common frame. Anatomy, boundaries and continuity are unvalidated.'
      ).trim(),
    });
  }
  const vessel = (id, name, file, region, extra = []) =>
    add(
      id,
      name,
      file,
      'vessels',
      region,
      extra,
      'isa',
      'Independently selectable source segment, not a complete branching tree. Gaps are not reconstructed and vessel calibre is not certified.',
    );
  for (const [id, name, file] of [
    ['FMA3969', 'right internal thoracic artery', 'FJ1937'],
    ['FMA4068', 'left internal thoracic artery', 'FJ1972'],
    ['FMA3988', 'right superior epigastric artery', 'FJ1936'],
    ['FMA4083', 'left superior epigastric artery', 'FJ1971'],
    ['FMA10692', 'right musculophrenic artery', 'FJ1969'],
    ['FMA4077', 'left musculophrenic artery', 'FJ1979'],
    ['FMA4758', 'right internal thoracic vein', 'FJ1993'],
    // Superior epigastric veins FMA4771/FMA4785 are held after source-extent checks.
    ['FMA4772', 'right musculophrenic vein', 'FJ1996'],
    ['FMA4786', 'left musculophrenic vein', 'FJ1988'],
  ])
    vessel(
      id,
      name,
      file,
      'thorax',
      /epigastric|musculophrenic/.test(name) ? ['abdomen'] : [],
    );
  for (const [id, name, file] of [
    ['FMA3992', 'right thyrocervical trunk', 'FJ2307'],
    ['FMA4084', 'left thyrocervical trunk', 'FJ2255'],
    ['FMA5039', 'right costocervical trunk', 'FJ2276'],
    ['FMA4086', 'left costocervical trunk', 'FJ2224'],
    ['FMA4057', 'right dorsal scapular artery', 'FJ2284'],
    ['FMA10552', 'left dorsal scapular artery', 'FJ2232'],
    ['FMA10698', 'right suprascapular artery', 'FJ2303'],
    ['FMA10681', 'left suprascapular artery', 'FJ2251'],
    ['FMA13330', 'right axillary vein', 'FJ2269'],
    ['FMA13331', 'left axillary vein', 'FJ2217'],
    ['FMA50859', 'right suprascapular vein', 'FJ2302'],
    ['FMA50860', 'left suprascapular vein', 'FJ2250'],
    ['FMA66563', 'trunk of right thoraco-acromial artery', 'FJ2304'],
    ['FMA66564', 'trunk of left thoraco-acromial artery', 'FJ2252'],
    ['FMA23063', 'pectoral branch of right thoraco-acromial artery', 'FJ2361'],
    ['FMA23064', 'pectoral branch of left thoraco-acromial artery', 'FJ2330'],
    ['FMA23068', 'acromial branch of right thoraco-acromial artery', 'FJ2263'],
    ['FMA23069', 'acromial branch of left thoraco-acromial artery', 'FJ2211'],
    ['FMA23072', 'deltoid branch of right thoraco-acromial artery', 'FJ2282'],
    ['FMA23073', 'deltoid branch of left thoraco-acromial artery', 'FJ2230'],
  ])
    vessel(
      id,
      name,
      file,
      'shoulder-arm',
      /cervical/.test(name) ? ['head-neck', 'thorax'] : ['thorax'],
    );
  add(
    'FMA53549',
    'right ciliary ganglion',
    'FJ1339',
    'nerves',
    'head-neck',
    [],
    'isa',
    'Small orbital ganglion source; its roots and connecting nerve branches are not reconstructed.',
  );
  add(
    'FMA53550',
    'left ciliary ganglion',
    'FJ1288',
    'nerves',
    'head-neck',
    [],
    'isa',
    'Small orbital ganglion source; its roots and connecting nerve branches are not reconstructed.',
  );
  add(
    'FMA7395',
    'right main bronchus',
    'FJ2539',
    'organs',
    'thorax',
    [],
    'partof',
    'Proximal airway source segment only; no complete bronchial-tree or wall-layer segmentation is implied.',
  );
  add(
    'FMA7396',
    'left main bronchus',
    'FJ2450',
    'organs',
    'thorax',
    [],
    'isa',
    'Proximal airway source segment only; no complete bronchial-tree or wall-layer segmentation is implied.',
  );
  add(
    'FMA14539',
    'cystic duct',
    'FJ3080',
    'organs',
    'abdomen',
    [],
    'isa',
    'Selected biliary duct source surface; no complete biliary-tree or luminal validation is supplied.',
  );
  add(
    'FMA14668',
    'common hepatic duct',
    'FJ3079',
    'organs',
    'abdomen',
    [],
    'isa',
    'Selected biliary duct source surface; no complete biliary-tree or luminal validation is supplied.',
  );
  add(
    'FMA14542',
    'appendix',
    'FJ2565',
    'organs',
    'abdomen',
    ['pelvis'],
    'isa',
    'Reference appendix surface only; variation, wall layers and mesoappendix are not reconstructed.',
  );
  return rows;
}
