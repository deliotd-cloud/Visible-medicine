import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  archiveReader,
  sourceTable,
  parallelMap,
  base,
} from './bodyparts-archive.mjs';
import {
  parseSourceTables,
  reconcileInventory,
  geometryFingerprint,
} from './anatomy-inventory.mjs';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const catalogBytes = await fs.readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(catalogBytes);
if (catalog.sourceVersion !== '4.0' || catalog.license !== 'CC-BY-4.0')
  throw Error('Unexpected anatomy source/rights revision');
const tables = {},
  evidence = [];
await fs.mkdir('LICENSES/bodyparts3d-v4-index', { recursive: true });
for (const tree of ['isa', 'partof']) {
  const parts = await sourceTable(tree + '_parts_list_e.txt');
  const elements = await sourceTable(tree + '_element_parts.txt');
  tables[tree] = parseSourceTables(parts, elements);
  for (const [name, text] of [
    [tree + '_parts_list_e.txt', parts],
    [tree + '_element_parts.txt', elements],
  ]) {
    // Recheck official bytes; never silently replace a cached source revision.
    if (!process.argv.includes('--offline-tables')) {
      const response = await fetch(base + name, {
        signal: AbortSignal.timeout(55000),
      });
      if (
        !response.ok ||
        hash(Buffer.from(await response.arrayBuffer())) !== hash(text)
      )
        throw Error('Official source table changed: ' + name);
    }
    const path = 'LICENSES/bodyparts3d-v4-index/' + name;
    await fs.writeFile(path, text);
    evidence.push({
      name,
      path,
      url: base + name,
      sha256: hash(text),
      bytes: Buffer.byteLength(text),
    });
  }
}
const usedNames = new Set(
  catalog.structures.flatMap((s) => s.sources.map((f) => f.file)),
);
const assets = [];
const archives = [];
for (const tree of ['isa', 'partof']) {
  const zip = await archiveReader(tree);
  const items = [...zip.entries]
    .filter(([name]) => name.endsWith('.obj'))
    .sort(([a], [b]) => a.localeCompare(b));
  archives.push({
    tree,
    url: zip.source,
    directorySha256: hash(JSON.stringify(items)),
    entryCount: items.length,
  });
  let checked = 0;
  const rows = await parallelMap(items, 8, async ([name, entry]) => {
    const file = name.slice(0, -4);
    // Verify every possible cross-tree duplicate with the source SHA, not filename or CRC alone.
    const bytes = usedNames.has(file) ? await zip.get(file) : null;
    const sha256 = bytes ? hash(bytes) : null;
    const geometrySha256 = bytes ? geometryFingerprint(bytes) : null;
    if (sha256 && ++checked % 200 === 0)
      console.log(
        tree + ': verified ' + checked + ' possible represented source files',
      );
    return {
      tree,
      file,
      available: true,
      bytes: entry.unpacked,
      crc32: entry.crc,
      sha256,
      geometrySha256,
    };
  });
  assets.push(...rows);
}
for (const structure of catalog.structures)
  for (const source of structure.sources) {
    const asset = assets.find(
      (a) => a.tree === structure.sourceTree && a.file === source.file,
    );
    if (!asset || asset.sha256 !== source.sha256)
      throw Error('Rendered source no longer matches archive: ' + source.file);
  }
const inventory = {
  schemaVersion: 1,
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  credit: catalog.credit,
  catalogSha256: hash(catalogBytes.toString().replace(/\r\n/g, '\n')),
  tables: evidence,
  archives,
  limitations: [
    'Source definitions are not a count of distinct anatomy.',
    'Unused availability is not an admission or clinical approval.',
    'Unretrieved files have archive metadata only; their SHA-256 is null.',
    'Exact geometry fingerprints ignore OBJ comments, names and regenerated normals/UVs but preserve vertex coordinates, order, winding and topology. They are not a tolerant overlap detector.',
    'Identical surfaces can carry different anatomical labels; mappings still require review.',
  ],
  ...reconcileInventory({ trees: tables, catalog, assets }),
};
await fs.writeFile(
  'content/source-inventory.json',
  JSON.stringify(inventory, null, 2) + '\n',
);
console.log(JSON.stringify(inventory.summary, null, 2));
