import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { collectRenderedPackages, renderThirdPartyNotices } from '../scripts/review-license-notices.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'review-license-notices-'));
  t.after(() => cleanFixture(root));
  return (copy, name, version, license = 'MIT', notice) => {
    const directory = join(root, copy, 'node_modules', ...name.split('/'));
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ name, version, license }));
    if (notice !== undefined) writeFileSync(join(directory, 'LICENSE'), notice);
    return join(directory, 'index.js');
  };
}

function bundle(...entries) {
  return { 'viewer.js': { type: 'chunk', modules: Object.fromEntries(entries.map(
    ([id, renderedLength = 1]) => [id, { renderedLength }])) } };
}

const render = (packages, fallbackPath) => renderThirdPartyNotices(
  packages, 'source-revision', 'Existing project notice.', fallbackPath);
const count = (body, needle) => body.split(needle).length - 1;

test('retains both rendered versions and emits each notice once in deterministic order', t => {
  const add = fixture(t);
  const newer = add('a', 'example', '2.0.0', 'MIT', 'Version two notice.');
  const older = add('b', 'example', '1.0.0', 'MIT', 'Version one notice.');
  const packages = collectRenderedPackages(bundle([newer], [older]));
  assert.deepEqual(packages.map(p => [p.name, p.version]),
    [['example', '1.0.0'], ['example', '2.0.0']]);
  const text = render(packages);
  assert.ok(text.indexOf('## example 1.0.0 (MIT)') < text.indexOf('## example 2.0.0 (MIT)'));
  assert.equal(count(text, 'Version one notice.'), 1);
  assert.equal(count(text, 'Version two notice.'), 1);
  assert.match(text, /Atlas source: source-revision/);
  assert.match(text, /Existing project notice\./);
});

test('deduplicates identical copied notices for one name and version', t => {
  const add = fixture(t);
  const first = add('a', 'example', '1.0.0', 'MIT', 'Identical notice.');
  const second = add('b', 'example', '1.0.0', 'MIT', 'Identical notice.');
  const packages = collectRenderedPackages(bundle([first], [second]));
  assert.equal(packages.length, 1);
  assert.equal(packages[0].directories.length, 2);
  assert.equal(count(render(packages), 'Identical notice.'), 1);
});

test('retains distinct notice texts from copies of one name and version', t => {
  const add = fixture(t);
  const first = add('a', 'example', '1.0.0', 'MIT', 'First notice.');
  const second = add('b', 'example', '1.0.0', 'MIT', 'Second notice.');
  const text = render(collectRenderedPackages(bundle([second], [first])));
  assert.equal(count(text, '## example 1.0.0 (MIT)'), 1);
  assert.equal(count(text, 'First notice.'), 1);
  assert.equal(count(text, 'Second notice.'), 1);
  assert.ok(text.indexOf('First notice.') < text.indexOf('Second notice.'));
});

test('rejects a rendered package copy without a notice', t => {
  const add = fixture(t);
  const withNotice = add('a', 'example', '1.0.0', 'MIT', 'Notice.');
  const missing = add('b', 'example', '1.0.0', 'MIT');
  assert.throws(() => render(collectRenderedPackages(bundle([withNotice], [missing]))),
    /Missing bundled dependency licence: example 1\.0\.0/);
});

test('rejects conflicting license expressions for the same identity', t => {
  const add = fixture(t);
  const first = add('a', 'example', '1.0.0', 'MIT', 'Notice.');
  const second = add('b', 'example', '1.0.0', 'Apache-2.0', 'Notice.');
  assert.throws(() => collectRenderedPackages(bundle([first], [second])),
    /Conflicting bundled dependency licence: example 1\.0\.0/);
});

test('rejects rendered Next even when another package is present', t => {
  const add = fixture(t);
  const example = add('a', 'example', '1.0.0', 'MIT', 'Notice.');
  const next = add('b', 'next', '15.0.0', 'MIT', 'Notice.');
  assert.throws(() => collectRenderedPackages(bundle([example], [next])),
    /Framework adapter failed: Next\.js must not be bundled/);
});

test('ignores modules with no rendered bytes', t => {
  const add = fixture(t);
  const example = add('a', 'example', '1.0.0', 'MIT', 'Notice.');
  const unusedNext = add('b', 'next', '15.0.0', 'MIT', 'Notice.');
  assert.deepEqual(collectRenderedPackages(bundle([example], [unusedNext, 0]))
    .map(p => p.name), ['example']);
});

test('uses the exact fiber 9.7.0 fallback only for that version', t => {
  const add = fixture(t);
  const fiber = add('a', '@react-three/fiber', '9.7.0', 'MIT');
  const fallbackPath = join(tmpdir(), 'unused');
  const source = mkdtempSync(join(tmpdir(), 'review-fiber-fallback-'));
  t.after(() => cleanFixture(source));
  const fallback = join(source, 'fiber-license.txt');
  writeFileSync(fallback, 'Fiber fallback notice.');
  assert.match(render(collectRenderedPackages(bundle([fiber])), fallback), /Fiber fallback notice\./);
  const other = add('b', '@react-three/fiber', '9.7.1', 'MIT');
  assert.throws(() => render(collectRenderedPackages(bundle([other])), fallbackPath),
    /Missing bundled dependency licence: @react-three\/fiber 9\.7\.1/);
});

function cleanFixture(directory) {
  const base=realpathSync(tmpdir()), target=realpathSync(directory);
  assert(target.startsWith(base+sep));
  assert.equal(resolve(directory),target);
  assert.match(target.slice(base.length+1), /^review-(?:license-notices|fiber-fallback)-[^\\/]+$/);
  rmSync(target,{recursive:true,force:true});
}
