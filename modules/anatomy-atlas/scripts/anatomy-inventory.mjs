import { createHash } from 'node:crypto';
const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
// Source coverage is not anatomical completeness. No name heuristic admits a mesh.
export const inventoryHolds = {
  FMA55077:
    'Pharyngeal raphe FJ2749 also occurs in anatomical-line/boundary parent definitions. Its narrow, long source surface has broad sampled contact with both inferior constrictors. Tissue extent versus a boundary representation needs adjudication before displaying it as dissectible connective tissue; no relabelling or thickening.',
  FMA66358:
    'SMA trunk candidate is a near-coincident alternative to the already displayed superior mesenteric artery: sampled bidirectional surface distances are mostly below 0.25 mm. Keep the existing source unchanged pending extent/overlap adjudication.',
  FMA14809:
    'Ileal artery and ileal branch of inferior ileocolic branch (FMA14819) are near-coincident differently labelled source meshes. Both are withheld pending source identity/extent adjudication.',
  FMA14819:
    'Near-coincident alternative to FMA14809 with a different ileal/ileocolic identity. Both candidates are withheld rather than duplicated or silently relabelled.',
  FMA74075:
    'Levatores costarum longi source needs fibre-course, level and overlap adjudication against breves; similar full thoracic extent is not proof of source error.',
  FMA74076:
    'Levatores costarum longi source needs fibre-course, level and overlap adjudication against breves; similar full thoracic extent is not proof of source error.',
  FMA71313:
    'Grouped levatores costarum longi alias of the two held source surfaces; no independent admission.',
  FMA4771:
    'Source-labelled superior epigastric vein lies inferior to the expected upper-abdominal arterial context; extent/identity review required.',
  FMA4785:
    'Source-labelled superior epigastric vein lies inferior to the expected upper-abdominal arterial context; extent/identity review required.',
  FMA37388: 'Previously quarantined laterality/position discrepancy.',
  FMA37389: 'Previously quarantined laterality/position discrepancy.',
  FMA46633: 'Previously quarantined laterality/position discrepancy.',
  FMA46634: 'Previously quarantined laterality/position discrepancy.',
  FMA45854:
    'Pelvic-floor alternatives/cross-midline bounds require adjudication.',
  FMA45855:
    'Pelvic-floor alternatives/cross-midline bounds require adjudication.',
  FMA45856:
    'Pelvic-floor alternatives/cross-midline bounds require adjudication.',
  FMA45857:
    'Pelvic-floor alternatives/cross-midline bounds require adjudication.',
  FMA45858:
    'Pelvic-floor alternatives/cross-midline bounds require adjudication.',
  FMA45859:
    'Pelvic-floor alternatives/cross-midline bounds require adjudication.',
  FMA46442: 'Pelvic-floor alternatives require adjudication.',
  FMA50875: 'Optic-nerve overlapping alternatives require adjudication.',
  FMA50878: 'Optic-nerve overlapping alternatives require adjudication.',
  FMA7647:
    'Spinal-cord / central-canal source alias; no complete cord is established.',
  FMA13509: 'Unresolved disc-level assignment.',
};
export function geometryFingerprint(bytes) {
  const digest = createHash('sha256');
  let vertices = 0,
    faces = 0;
  for (const raw of bytes.toString().split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [kind, ...fields] = line.split(/\s+/);
    if (kind === 'v') {
      const coordinates = fields.map(Number);
      if (coordinates.length !== 3 || !coordinates.every(Number.isFinite))
        throw Error('Unsupported OBJ vertex');
      digest.update('v ' + coordinates.join(' ') + '\n');
      vertices++;
    } else if (kind === 'f') {
      const indices = fields.map((field) => Number(field.split('/')[0]));
      if (
        indices.length < 3 ||
        indices.some((i) => !Number.isInteger(i) || i === 0)
      )
        throw Error('Invalid OBJ face');
      digest.update(
        'f ' +
          indices.map((i) => (i < 0 ? vertices + i + 1 : i)).join(' ') +
          '\n',
      );
      faces++;
    } else if (!['vn', 'vt', 'g', 'o', 's', 'mtllib', 'usemtl'].includes(kind))
      throw Error('Unsupported OBJ directive ' + kind);
  }
  if (!vertices || !faces) throw Error('Empty OBJ surface');
  return digest.digest('hex');
}
export function parseSourceTables(partsText, elementsText) {
  const records = new Map();
  const rows = (text, header) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.shift() !== header) throw Error('Unexpected source table header');
    return lines.map((line) => {
      const fields = line.split('\t');
      if (
        fields.length !== 3 ||
        !/^FMA\d+$/.test(fields[0]) ||
        fields.some((f) => !f)
      )
        throw Error('Malformed source row');
      return fields;
    });
  };
  for (const [id, representation, name] of rows(
    partsText,
    'concept id\trepresentation id\ten',
  )) {
    if (records.has(id)) throw Error('Duplicate source concept');
    records.set(id, { id, name, representation, files: [] });
  }
  for (const [id, name, file] of rows(
    elementsText,
    'concept id\tname\telement file id',
  )) {
    if (!/^FJ\d+M?$/.test(file)) throw Error('Unsafe source filename');
    const r = records.get(id);
    if (!r || r.name !== name) throw Error('Source definition/name mismatch');
    if (r.files.includes(file)) throw Error('Duplicate element row');
    r.files.push(file);
  }
  return [...records.values()];
}
export function reconcileInventory({ trees, catalog, assets }) {
  const byKey = new Map(
    assets.map((asset) => [asset.tree + '/' + asset.file, asset]),
  );
  const sourceOwners = new Map();
  for (const structure of catalog.structures)
    for (const source of structure.sources) {
      const asset = byKey.get(structure.sourceTree + '/' + source.file);
      if (!asset?.geometrySha256 || asset.sha256 !== source.sha256)
        throw Error('Unverified displayed source');
      const key = asset.geometrySha256;
      if (!sourceOwners.has(key)) sourceOwners.set(key, []);
      sourceOwners.get(key).push(structure.id);
    }
  const records = [];
  for (const [tree, concepts] of Object.entries(trees)) {
    const aliases = new Map();
    for (const concept of concepts) {
      const signature = [...concept.files].sort(compareText).join(',');
      if (!aliases.has(signature)) aliases.set(signature, []);
      aliases.get(signature).push(concept.id);
    }
    for (const concept of concepts) {
      const sourceAssets = concept.files.map((file) =>
        byKey.get(tree + '/' + file),
      );
      const unavailable = concept.files.filter(
        (_, i) => !sourceAssets[i]?.available,
      );
      const represented = sourceAssets.map((asset) =>
        asset?.geometrySha256
          ? (sourceOwners.get(asset.geometrySha256) ?? [])
          : [],
      );
      const displayed = catalog.structures.find((s) => s.fmaId === concept.id);
      const displayedFiles = displayed?.sources
        .map(
          (s) => byKey.get(displayed.sourceTree + '/' + s.file).geometrySha256,
        )
        .sort(compareText)
        .join(',');
      const sameDefinition =
        !!displayed &&
        sourceAssets.every((a) => a?.geometrySha256) &&
        sourceAssets
          .map((a) => a.geometrySha256)
          .sort(compareText)
          .join(',') === displayedFiles;
      const heldReason =
        inventoryHolds[concept.id] ??
        (concept.files.length === 1 && concept.files[0] === 'FJ3211'
          ? 'Generic disc surface does not establish the unresolved named level.'
          : null);
      const status = heldReason
        ? 'held-source-review'
        : !concept.files.length
          ? 'no-element-definition'
          : unavailable.length
            ? 'source-file-unavailable'
            : displayed
              ? sameDefinition
                ? 'admitted'
                : 'admitted-other-definition'
              : represented.every((ids) => ids.length)
                ? 'represented-not-selectable'
                : represented.some((ids) => ids.length)
                  ? 'partly-represented'
                  : 'unused-available';
      records.push({
        tree,
        ...concept,
        status,
        displayedId: displayed?.id ?? null,
        heldReason,
        representedBy: [...new Set(represented.flat())].sort(compareText),
        unavailable,
        sharedDefinitionWith: concept.files.length
          ? aliases
              .get([...concept.files].sort(compareText).join(','))
              .filter((id) => id !== concept.id)
          : [],
      });
    }
  }
  const statuses = {};
  for (const r of records) statuses[r.status] = (statuses[r.status] ?? 0) + 1;
  const knownFiles = new Set(
    records.flatMap((r) => r.files.map((f) => r.tree + '/' + f)),
  );
  return {
    summary: {
      conceptDefinitions: records.length,
      uniqueConceptIds: new Set(records.map((r) => r.id)).size,
      archiveEntries: assets.length,
      archiveEntriesWithoutConcept: assets.filter(
        (a) => !knownFiles.has(a.tree + '/' + a.file),
      ).length,
      admittedStructures: catalog.structures.length,
      statuses,
    },
    records,
    assets: assets.map((asset) => ({
      ...asset,
      representedBy: asset.geometrySha256
        ? [...new Set(sourceOwners.get(asset.geometrySha256) ?? [])].sort(
            compareText,
          )
        : [],
    })),
  };
}
