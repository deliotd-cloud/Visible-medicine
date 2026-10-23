import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({
  stdin: {
    contents: "export * from './lib/regional-tour-entry-navigation'; export { atlasBodyRegions } from './lib/atlas-navigation';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { atlasBodyRegions, regionalTourEntryHref, regionalTourEntrySuffix } =
  await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const source = '39dbb747a44feb0f4bc83e757310c5e3d1b49580';
const sample = region => Object.freeze({
  id: `tour:${region.id}`, revision: 'revision.1', regionId: region.id, href: region.href,
  privatePath: '/private/study', autoplay: true,
});

test('all twelve canonical regions produce bounded source-bound entries without mutation', () => {
  assert.equal(atlasBodyRegions.length, 12);
  for (const region of atlasBodyRegions) {
    const tour = sample(region);
    const href = regionalTourEntryHref(tour, source);
    assert(href?.startsWith('/atlas/3d?'));
    const parsed = new URL(href, 'https://visible.example');
    assert.equal(parsed.pathname, '/atlas/3d');
    assert.deepEqual([...parsed.searchParams.keys()], ['region', 'regionalTour', 'tourRevision', 'tourSource']);
    assert.equal(parsed.searchParams.get('region'), region.id);
    assert.equal(parsed.searchParams.get('regionalTour'), tour.id);
    assert.equal(parsed.searchParams.get('tourRevision'), tour.revision);
    assert.equal(parsed.searchParams.get('tourSource'), source);
    assert.equal(tour.href, region.href);
    assert(!href.includes('private') && !href.includes('autoplay'));
    assert.equal(regionalTourEntrySuffix(Object.fromEntries(parsed.searchParams)),
      `&regionalTour=${encodeURIComponent(tour.id)}&tourRevision=${encodeURIComponent(tour.revision)}&tourSource=${source}`);
  }
});

test('entry rejects unknown regions, noncanonical destinations and malformed binding', () => {
  const good = sample(atlasBodyRegions[0]);
  const bad = [
    { regionId: 'unknown' },
    { regionId: atlasBodyRegions[1].id },
    { href: '/atlas/3d?region=whole-body' },
    { href: 'https://unsafe.example/atlas/3d' },
    { href: '/private/study' },
    { id: '' }, { id: 'a'.repeat(141) }, { id: '../escape' }, { id: 'tour?autoplay=1' },
    { revision: '' }, { revision: 'r'.repeat(141) }, { revision: 'r&private=1' },
    { id: ['valid'] }, { revision: ['valid'] },
  ];
  for (const change of bad) assert.equal(regionalTourEntryHref({ ...good, ...change }, source), null, JSON.stringify(change));
  for (const invalid of [null, '', 'A'.repeat(40), 'a'.repeat(39), 'g'.repeat(40), source + '0']) {
    assert.equal(regionalTourEntryHref(good, invalid), null);
  }
});

test('suffix preserves absent state, validates complete own scalar fields and ignores unrelated fields', () => {
  assert.equal(regionalTourEntrySuffix({}), '');
  assert.equal(regionalTourEntrySuffix({ study: 'private', autoplay: '1' }), '');
  const good = Object.freeze({ regionalTour: 'tour:head-neck', tourRevision: 'r.1', tourSource: source,
    study: 'private', autoplay: '1' });
  const suffix = regionalTourEntrySuffix(good);
  assert.equal(suffix, `&regionalTour=tour%3Ahead-neck&tourRevision=r.1&tourSource=${source}`);
  assert(!suffix.includes('private') && !suffix.includes('autoplay'));
  for (const bad of [
    { regionalTour: 'tour' },
    { regionalTour: 'tour', tourRevision: 'r' },
    { ...good, regionalTour: ['tour', 'duplicate'] },
    { ...good, tourRevision: ['r'] },
    { ...good, tourSource: [source] },
    { ...good, regionalTour: '' },
    { ...good, regionalTour: 'a'.repeat(141) },
    { ...good, regionalTour: 'tour&autoplay=1' },
    { ...good, tourRevision: 'r'.repeat(141) },
    { ...good, tourRevision: 'r/private' },
    { ...good, tourSource: source.toUpperCase() },
    { ...good, tourSource: source.slice(1) },
    Object.create({ ...good }),
  ]) assert.equal(regionalTourEntrySuffix(bad), null);
});
