import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';
const compiled = await build({
  stdin: {
    contents: "export * from './lib/body-display-catalog'; export * from './lib/anatomy-search'; export * from './lib/atlas-navigation';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const {
  bodyDisplayCatalog, anatomySearchAliases, structureSearchAliases,
  normalizeAnatomySearch, anatomySearchWordMatches, atlasSearchIndex,
  filterAtlasSearch,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const bytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = bodyDisplayCatalog(JSON.parse(bytes));
assert.equal(
  createHash('sha256').update(bytes).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const snapshot = JSON.stringify(catalog);
const indexes = {};
for (const tree of ['isa', 'partof'])
  indexes[tree] = (
    await readFile('../work/bodyparts3d/' + tree + '_element_parts.txt', 'utf8')
  )
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split('\t'));
let boundRepresentations = 0,
  rejectedBindings = 0,
  queryCases = 0,
  scopes = 0;
for (const group of anatomySearchAliases)
  for (const [fma, name, side, file] of group.members) {
    const s = catalog.structures.find((s) => s.fmaId === fma);
    assert.deepEqual(
      indexes[group.tree].filter((r) => r[0] === fma).map((r) => [r[1], r[2]]),
      [[name.toLowerCase(), file]],
    );
    assert.deepEqual(structureSearchAliases(s), group.aliases);
    assert.equal(s.laterality, side);
    boundRepresentations++;
    for (const mutate of [
      (v) => {
        v.fmaId = 'FMA_UNKNOWN';
      },
      (v) => {
        v.name += ' other';
      },
      (v) => {
        v.laterality = 'other';
      },
      (v) => {
        v.system = 'other';
      },
      (v) => {
        v.category = 'other';
      },
      (v) => {
        v.sourceTree = 'other';
      },
      (v) => {
        v.sources[0].file = 'FJ_OTHER';
      },
      (v) => {
        v.sources.push(structuredClone(v.sources[0]));
      },
      (v) => {
        v.sources = [];
      },
    ]) {
      const changed = structuredClone(s);
      mutate(changed);
      assert.deepEqual(structureSearchAliases(changed), []);
      rejectedBindings++;
    }
    const aliases = structureSearchAliases(s);
    aliases.push('mutable');
    assert(!structureSearchAliases(s).includes('mutable'));
  }
assert.equal(boundRepresentations, 25);
const canonical = Object.fromEntries(
  catalog.structures.map((s) => ['structure:' + s.id, s]),
);
const fmas = (entries) => entries.map((e) => canonical[e.key].fmaId).sort();
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)])
  for (const side of ['both', 'right', 'left']) {
    const entries = atlasSearchIndex(catalog, region, side);
    const serialized = JSON.stringify(entries);
    for (const group of anatomySearchAliases)
      for (const alias of group.aliases) {
        const found = filterAtlasSearch(entries, alias, 'structure');
        assert.deepEqual(
          fmas(found),
          group.members.map((m) => m[0]).sort(),
          region + '/' + side + '/' + alias,
        );
        for (const entry of found)
          assert.equal(entry.label, canonical[entry.key].name);
        queryCases++;
      }
    for (const [query, expected] of [
      ['left collarbone', ['FMA13323']],
      ['right shoulder-blade', ['FMA13395']],
      ['Achilles’ tendon', ['FMA258847', 'FMA264844']],
      ['Achilles’s tendon', ['FMA258847', 'FMA264844']],
      ['  LEFT   KNÉECAP ', ['FMA24487']],
      ['CN 3 superior left', ['FMA52575']],
      ['cranial nerve III inferior right', ['FMA52576']],
      ['CN-IV', ['FMA50881', 'FMA50882']],
      ['CNⅣ', ['FMA50881', 'FMA50882']],
      ['CN VI', []],
      ['CN2', []],
      ['CN 13', []],
      ['cranial nerve 13', []],
      [
        'peroneus',
        [
          'FMA22550',
          'FMA22551',
          'FMA22552',
          'FMA22553',
          'FMA22554',
          'FMA22555',
        ],
      ],
      ['right peroneus longus', ['FMA22552']],
      ['FMA:258847', ['FMA258847']],
      ['fma 258847', ['FMA258847']],
      ['quadratus plantae', ['FMA37465', 'FMA37466']],
      ['gullet', ['FMA7131']],
      ['vas deferens', ['FMA19235', 'FMA19236']],
      ['left ductus deferens', ['FMA19236']],
      ['right vas deferens', ['FMA19235']],
      ['corpus spongiosum', ['FMA19617']],
      ['FMA19617', ['FMA19617']],
      ['---', []],
      ['<script>no-result', []],
    ]) {
      assert.deepEqual(
        fmas(filterAtlasSearch(entries, query, 'structure')),
        expected.sort(),
        query,
      );
      queryCases++;
    }
    assert.equal(
      filterAtlasSearch(entries, 'FMA:258847')[0].key,
      'structure:' + catalog.structures.find((s) => s.fmaId === 'FMA258847').id,
    );
    assert(
      filterAtlasSearch(entries, 'Achilles')
        .slice(0, 2)
        .every((e) => e.kind === 'structure'),
    );
    const left = filterAtlasSearch(entries, 'left collarbone', 'structure')[0];
    if (left.action.type === 'select') {
      assert.notEqual(side, 'right');
      assert(
        region === 'whole-body' || canonical[left.key].regions.includes(region),
      );
    }
    assert.deepEqual(
      filterAtlasSearch(entries, 'a'.repeat(256) + 'extra'),
      filterAtlasSearch(entries, 'a'.repeat(256)),
    );
    assert.equal(
      JSON.stringify(entries),
      serialized,
      'Filtering never mutates the index',
    );
    scopes++;
  }
for (const roman of [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
]) {
  const n =
    [
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'VII',
      'VIII',
      'IX',
      'X',
      'XI',
      'XII',
    ].indexOf(roman) + 1;
  assert.equal(normalizeAnatomySearch('CN ' + roman), 'cn' + n);
  assert.equal(normalizeAnatomySearch('cranial nerve ' + n), 'cn' + n);
  assert.equal(
    anatomySearchWordMatches('cn' + n, 'cn' + (n === 1 ? 11 : 1)),
    false,
  );
}
assert.equal(JSON.stringify(catalog), snapshot);
const report = {
  passed: true,
  aliasGroups: anatomySearchAliases.length,
  boundRepresentations,
  sourceRowsVerified: boundRepresentations,
  rejectedBindings,
  searchScopes: scopes,
  queryCases,
  canonicalLabelsPreserved: true,
  romanArabicCranialNervesDisambiguated: true,
  partialCoverage: true,
  geometryOrTeachingChanged: false,
  externalSearchService: false,
  browserTesting: false,
  limitations:
    'Curated term lookup, not complete terminology coverage, typo correction, ontology equivalence, anatomical validation or a patient-data search. Actual browser/device/keyboard acceptance remains separate.',
};
await writeFile(
  'docs/anatomy-search-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
