import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectRenderedPackages, assertReviewedPackages } from '../scripts/review-license-notices.mjs';

const site = fileURLToPath(new URL('../', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const root = fs.mkdtempSync(join(tmpdir(), 'frozen-license-'));
  t.after(() => {
    const target = fs.realpathSync(root), base = fs.realpathSync(tmpdir());
    assert.equal(target, resolve(root));
    assert(target.startsWith(base + sep));
    assert.match(target.slice(base.length + 1), /^frozen-license-[^\\/]+$/);
    fs.rmSync(target, { recursive: true, force: true });
  });
  const pkg = (copy, name, version, license = 'MIT') => {
    const directory = join(root, copy, 'node_modules', name);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(join(directory, 'package.json'), JSON.stringify({ name, version, license }));
    return join(directory, 'index.js');
  };
  return { root, pkg };
}
function bundle(ids, unused = []) {
  return { viewer: { type: 'chunk', modules: Object.fromEntries([
    ...ids.map(id => [id, { renderedLength: 1 }]),
    ...unused.map(id => [id, { renderedLength: 0 }])
  ]) } };
}
const approved = (name, version, license = 'MIT') => ({ name, version, license });

test('authenticated original builder can hide an unreviewed version behind either later version', t => {
  const f = fixture(t), old = fs.readFileSync(join(site, 'tests/fixtures/build-clinical-review-candidate.before.mjs.raw'), 'utf8');
  assert.equal(sha(old), '5f4f8e719ee06e30a528d6ddea3e37c0dd0492415059caa539d2ccb6f5bd7cf5');
  const start = old.indexOf('generateBundle(_options,bundles){'), end = old.indexOf('\n }],build:', start);
  assert(start > 0 && end > start);
  const generate = new Function('bundles', 'packages', 'fs', 'path',
    old.slice(start + 'generateBundle(_options,bundles){'.length, end).replace(/\}\s*$/, ''));
  const gateStart = old.indexOf('for(const p of packages.values())if(');
  const gateEnd = old.indexOf('\nfs.mkdirSync(path.dirname(output)',gateStart);
  assert(gateStart > end && gateEnd > gateStart);
  const legacyGate = new Function('packages','currentViewer',old.slice(gateStart,gateEnd));
  const v1 = f.pkg('one', 'example', '1.0.0'), v2 = f.pkg('two', 'example', '2.0.0');
  for (const ids of [[v1, v2], [v2, v1]]) {
    const legacy = new Map();
    generate(bundle(ids), legacy, fs, { dirname, join });
    assert.equal(legacy.size, 1);
    assert.equal(legacy.get('example').version, ids[1] === v1 ? '1.0.0' : '2.0.0');
    const reviewed = [approved('example',legacy.get('example').version)];
    assert.doesNotThrow(()=>legacyGate(legacy,{packages:reviewed}));
    assert.throws(()=>assertReviewedPackages(collectRenderedPackages(bundle(ids)),reviewed),/unreviewed dependency/);
  }
});

test('actual frozen builder uses the shared collector and exact reviewed predicate', t => {
  const f = fixture(t);
  const v1 = f.pkg('one', 'example', '1.0.0'), v2 = f.pkg('two', 'example', '2.0.0');
  const source = fs.readFileSync(join(site, 'scripts/build-clinical-review-candidate.mjs'), 'utf8');
  const hook = source.match(/generateBundle\(_options,bundles\)\{([^{}]+)\}/)?.[1];
  assert(hook);
  const generate = new Function('bundles','collectRenderedPackages','let packages;'+hook+';return packages;');
  const gate = source.match(/\n(assertReviewedPackages\([^;]+;)/)?.[1];assert(gate);
  const check = new Function('packages','currentViewer','assertReviewedPackages',gate);
  const projection = source.match(/packages:([^\n]+?),sourceAdapterSha256:/)?.[1];assert(projection);
  const evidencePackages = new Function('packages','return ('+projection+');');
  for (const ids of [[v1, v2], [v2, v1]]) {
    const rows = generate(bundle(ids),collectRenderedPackages);
    assert.deepEqual(rows.map(({ name, version, license }) => ({ name, version, license })),
      [approved('example', '1.0.0'), approved('example', '2.0.0')]);
    assert.throws(() => check(rows, {packages:[approved('example', '1.0.0')]}, assertReviewedPackages),
      /unreviewed dependency: example 2\.0\.0/);
    assert.doesNotThrow(() => check(rows,
      {packages:[approved('example', '1.0.0'), approved('example', '2.0.0')]},assertReviewedPackages));
    assert.deepEqual(evidencePackages(rows),[approved('example','1.0.0'),approved('example','2.0.0')]);
    assert(!JSON.stringify(evidencePackages(rows)).includes(f.root));
    for(const record of evidencePackages(rows))assert.deepEqual(Object.keys(record).sort(),['license','name','version']);
  }
  assert.throws(() => assertReviewedPackages(collectRenderedPackages(bundle([v1])),
    [approved('example', '1.0.0', 'Apache-2.0')]), /unreviewed dependency/);
});

test('unrendered packages do not trigger false rejection; Next remains rejected', t => {
  const f = fixture(t);
  const used = f.pkg('used', 'example', '1.0.0');
  const unused = f.pkg('unused', 'unreviewed', '9.0.0');
  const rows = collectRenderedPackages(bundle([used], [unused]));
  assert.deepEqual(rows.map(({ name }) => name), ['example']);
  assert.doesNotThrow(() => assertReviewedPackages(rows, [approved('example', '1.0.0')]));
  const next = f.pkg('next', 'next', '15.0.0');
  assert.throws(() => collectRenderedPackages(bundle([used, next])), /Next\.js must not be bundled/);
});
