import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const sourceRoot = resolve(process.env.VM_ATLAS_SOURCE_REPO ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
const dependencyRoot = resolve(process.env.VM_ATLAS_DEPENDENCY_REPO ?? sourceRoot);
const require = createRequire(join(dependencyRoot, 'package.json'));
const postcss = require('postcss');
const fixturePath = join(sourceRoot, 'scripts', 'fixtures', 'body-drawable-space-original.css.raw');
const sourcePath = join(sourceRoot, 'app', 'body-explorer.css');
const [fixture, proposed] = await Promise.all([readFile(fixturePath), readFile(sourcePath)]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const originalSha = '9834c72543476b41ba5acb5a47427dced3596d56320c59502d91f9e9e2524dca';
const proposalSha = '9722246697fafcd54f55e586797eaec33930c5f3f87d653117b064787ebe2904';

test('complete canonical CSS preimage stays byte-exact and proposal is additive only', () => {
  assert.equal(sha256(fixture), originalSha);
  assert.equal(fixture.length, 64441);
  assert(proposed.length > fixture.length);
  assert(proposed.subarray(0, fixture.length).equals(fixture),
    'Every original byte, including line endings and all historical rules, must remain unchanged');
  assert.equal(sha256(proposed), proposalSha);
});

test('full stylesheet and appended three-rule desktop density block parse as CSS', () => {
  const parsed = postcss.parse(proposed.toString('utf8'), { from: sourcePath });
  assert(parsed.nodes.length > 0);
  const appended = proposed.subarray(fixture.length).toString('utf8');
  const delta = postcss.parse(appended, { from: `${sourcePath}:additive` });
  assert.deepEqual(delta.nodes.map(node => node.type), ['comment', 'atrule']);
  const media = delta.nodes[1];
  assert.equal(media.name, 'media');
  assert.equal(media.params, '(min-width: 1101px) and (min-height: 360px)');
  assert.deepEqual(media.nodes.map(node => node.type), ['rule', 'rule', 'rule']);
});

test('only panel desktop gutters change; controls, text, camera and overflow stay untouched', () => {
  const delta = postcss.parse(proposed.subarray(fixture.length).toString('utf8'));
  const rules = delta.nodes[1].nodes;
  const expected = [
    [
      ".body-app[data-presentation='panel'] > .body-topbar[data-shared-header='true']:not([hidden])",
      [['padding-block', '0']],
    ],
    [
      ".body-app[data-presentation='panel'] .body-workspace .body-canvas:not([hidden])",
      [['row-gap', '0'], ['padding-block', '0'], ['margin-bottom', '0']],
    ],
    [
      ".body-app[data-presentation='panel'] .body-workspace .body-canvas:not([hidden]) > .body-toolbar",
      [['padding-block', '1px']],
    ],
  ];
  assert.deepEqual(rules.map(rule => [
    rule.selector,
    rule.nodes.map(node => {
      assert.equal(node.type, 'decl');
      assert(!node.important);
      return [node.prop, node.value];
    }),
  ]), expected);
});
