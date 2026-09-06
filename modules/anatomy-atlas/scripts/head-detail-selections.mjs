// Exact v4 ISA identities, not inferred tooth numbers or synthetic subdivisions.
export const headDetailDefinitions = [
  ['FMA49067', 'trochlea of right superior oblique', 'FJ1380'],
  ['FMA49068', 'trochlea of left superior oblique', 'FJ1329'],
  ['FMA49072', 'right common tendinous ring', 'FJ1342'],
  ['FMA49073', 'left common tendinous ring', 'FJ1291'],
  ['FMA55680', 'right upper lateral secondary incisor tooth', 'FJ1280'],
  ['FMA55681', 'right upper central secondary incisor tooth', 'FJ1279'],
  ['FMA55682', 'left upper central secondary incisor tooth', 'FJ1265'],
  ['FMA55683', 'left upper lateral secondary incisor tooth', 'FJ1266'],
  ['FMA55686', 'right lower secondary canine tooth', 'FJ1274'],
  ['FMA55687', 'left lower secondary canine tooth', 'FJ1260'],
  ['FMA55688', 'right upper second secondary premolar tooth', 'FJ1278'],
  ['FMA55689', 'right upper first secondary premolar tooth', 'FJ1277'],
  ['FMA55690', 'left upper first secondary premolar tooth', 'FJ1262'],
  ['FMA55691', 'left upper second secondary premolar tooth', 'FJ1264'],
  ['FMA55692', 'left lower second secondary premolar tooth', 'FJ1257'],
  ['FMA55693', 'left lower first secondary premolar tooth', 'FJ1255'],
  ['FMA55694', 'right lower first secondary premolar tooth', 'FJ1269'],
  ['FMA55695', 'right lower second secondary premolar tooth', 'FJ1271'],
  ['FMA55697', 'right upper second secondary molar tooth', 'FJ1275'],
  ['FMA55698', 'right upper first secondary molar tooth', 'FJ1276'],
  ['FMA55699', 'left upper first secondary molar tooth', 'FJ1261'],
  ['FMA55700', 'left upper second secondary molar tooth', 'FJ1263'],
  ['FMA55703', 'left lower second secondary molar tooth', 'FJ1256'],
  ['FMA55704', 'left lower first secondary molar tooth', 'FJ1254'],
  ['FMA55705', 'right lower first secondary molar tooth', 'FJ1268'],
  ['FMA55706', 'right lower second secondary molar tooth', 'FJ1270'],
  ['FMA55798', 'right upper secondary canine tooth', 'FJ1281'],
  ['FMA55799', 'left upper secondary canine tooth', 'FJ1267'],
  ['FMA57140', 'right lower lateral secondary incisor tooth', 'FJ1273'],
  ['FMA57141', 'left lower lateral secondary incisor tooth', 'FJ1259'],
  ['FMA57142', 'right lower central secondary incisor tooth', 'FJ1272'],
  ['FMA57143', 'left lower central secondary incisor tooth', 'FJ1258'],
];

export function headDetailSelections(isa) {
  return headDetailDefinitions.map(([fma, name, file]) => {
    const r = isa.get(fma);
    if (!r || r.name !== name || r.files.length !== 1 || r.files[0] !== file)
      throw Error('Dental / orbital source definition changed: ' + fma);
    const dental = name.endsWith('tooth');
    return {
      fma,
      name,
      files: [file],
      tree: 'isa',
      region: 'head-neck',
      system: dental ? 'organs' : 'connective',
      // Teeth are dental organs, not bones. A ring is tendon; a trochlea is cartilage.
      category: dental ? 'organ' : /ring/.test(name) ? 'tendon' : 'cartilage',
      recovery: true,
      headDetailRecovery: true,
      coverageNote:
        'Unvalidated BodyParts3D 4.0 source surface in the unchanged common coordinate frame. ' +
        (dental
          ? 'One source-labelled secondary tooth; no third molars, primary dentition, separately segmented enamel/dentine/pulp, periodontal tissues or certified occlusal/root anatomy. No Universal, FDI or Palmer numbering has been assigned. '
          : 'Source-labelled orbital connective surface; attachment footprints, tissue thickness, tendon continuity and neighbouring nerve passages require specialist review. ') +
        'No patient registration or imaging appearance is established.',
    };
  });
}
