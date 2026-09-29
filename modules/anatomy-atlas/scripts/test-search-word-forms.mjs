import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';

const compiled = await build({stdin: {contents: `
  export * from './lib/anatomy-search';
  export * from './lib/atlas-navigation';
  export * from './lib/body-display-catalog';
  export * from './lib/clinical-review-index';
  export * from './lib/atlas-search-presentation';
`, resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8')));
const snapshot = JSON.stringify(catalog);
let scopes = 0, queries = 0;
for (const region of ['whole-body', ...catalog.regions.map(r => r.id)]) {
  for (const side of ['both', 'left', 'right']) {
    const entries = api.atlasSearchIndex(catalog, region, side);
    const before = JSON.stringify(entries);
    const baseline = api.filterAtlasSearch(entries, 'inferior colliculus', 'structure');
    assert.equal(baseline.length, 2);
    assert.deepEqual(api.filterAtlasSearch(entries, 'FMA:73464', 'structure'), baseline.filter(e => e.label.includes('left')));
    assert(!api.filterAtlasSearch(entries, 'FMA7346', 'structure').some(e => baseline.includes(e)));
    assert.equal(api.filterAtlasSearch(entries, baseline[0].label)[0], baseline[0]);
    for (const query of ['inferior collicular', 'inferior colliculi', 'inferior collicular brachia', 'brachia inferior collicular']) {
      const found = api.filterAtlasSearch(entries, query, 'structure');
      assert.deepEqual(found, baseline, `${region}/${side}/${query}`);
      queries++;
    }
    for (const laterality of ['left', 'right']) {
      const found = api.filterAtlasSearch(entries, `inferior collicular brachia ${laterality}`, 'structure');
      assert.deepEqual(found, baseline.filter(e => e.label.includes(laterality)));
      assert.equal(found.length, 1);
      const entry = found[0];
      if (entry.action.type === 'dissect') {
        assert(['head-neck', 'whole-body'].includes(region));
        assert(side === 'both' || side === laterality);
        assert.match(entry.action.target.sourceHash, /^[a-f0-9]{64}$/);
      } else {
        assert.equal(entry.action.type, 'link');
        assert(entry.action.href.includes('source='));
      }
      queries++;
    }
    for (const query of ['superior collicular brachia', 'inferior collicular left right', 'inferior collicular nonsense']) {
      assert.deepEqual(api.filterAtlasSearch(entries, query, 'structure'), []);
      queries++;
    }
    const grouped = api.groupAtlasSearchResults(baseline, 'inferior collicular');
    assert.deepEqual(grouped.primary, baseline);
    assert.deepEqual(grouped.related, []);
    assert.equal(JSON.stringify(entries), before);
    scopes++;
  }
}
for (const query of ['inferior collicular', 'inferior colliculi', 'inferior collicular brachia']) {
  const actual = api.findClinicalReviewEntries({q: query, scope: 'nested'});
  const expected = api.findClinicalReviewEntries({q: 'inferior colliculus', scope: 'nested'});
  assert.equal(actual.total, 2);
  assert.deepEqual(actual.entries, expected.entries);
  for (const e of actual.entries) assert.match(new URL(e.href, 'https://local.invalid').searchParams.get('source'), /^[a-f0-9]{64}$/);
}
for (const [text, word, expected] of [
  ['colliculus', 'collicular', true], ['colliculi', 'colliculus', true],
  ['brachium', 'brachia', true], ['brachia', 'brachium', true],
  ['brachial artery', 'brachia', false], ['brachialis', 'brachium', false],
  ['precollicular', 'collicular', false], ['collicular', 'collicularx', false],
  ['cn4', 'cn6', false], ['fma73464', 'fma7346', false],
  ['fma73464', 'fma73464', true], ['fma734641', 'fma73464', false],
]) assert.equal(api.anatomySearchWordMatches(text, word), expected, `${text}/${word}`);
assert.equal(JSON.stringify(catalog), snapshot);
console.log(JSON.stringify({passed: true, scopes, queries, clinicalReviewQueries: 3,
  sourceBoundActionsUnchanged: true, heldSuperiorBrachiaAbsent: true, geometryChanged: false}));
