import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const catalog = JSON.parse(
  await readFile(
    'public/models/bodyparts3d/femoral-components/catalog.json',
    'utf8',
  ),
);
assert.equal(catalog.parents.length, 2);
assert.equal(catalog.structures.length, 4);
const pins = {
  version: 1,
  parents: catalog.parents,
  bindings: catalog.structures.map((structure) => ({
    study: 'femoral-components',
    parentId: structure.parentId,
    structure,
    sourceHash: catalog.bundles.find((b) => b.id === structure.bundle)
      .sha256,
    conceptId:
      structure.role === 'lateral-circumflex'
        ? 'femoral-lateral-source'
        : 'femoral-source-remainder',
  })),
};
const path = 'content/femoral-component-teaching-bindings.v1.json';
const text = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(await readFile(path, 'utf8'), text);
else await writeFile(path, text, { flag: 'wx' });
console.log(
  'Verified four supplemental teaching bindings; historical pins unchanged.',
);
