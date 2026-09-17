import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const scriptsRoot = new URL('./', import.meta.url);
const expected = [
  'validate-abdominal-organ-clinical-curriculum.mjs',
  'validate-abdominal-vessel-clinical-curriculum.mjs',
  'validate-acral-bone-clinical-curriculum.mjs',
  'validate-axial-bone-clinical-curriculum.mjs',
  'validate-axial-connective-clinical-curriculum.mjs',
  'validate-central-neural-clinical-curriculum.mjs',
  'validate-cranial-bone-clinical-curriculum.mjs',
  'validate-dental-clinical-curriculum.mjs',
  'validate-foot-clinical-curriculum.mjs',
  'validate-forearm-clinical-curriculum.mjs',
  'validate-forearm-vessel-clinical-curriculum.mjs',
  'validate-hand-clinical-curriculum.mjs',
  'validate-hand-vessel-clinical-curriculum.mjs',
  'validate-head-clinical-curriculum.mjs',
  'validate-head-neck-vessel-clinical-curriculum.mjs',
  'validate-head-organ-clinical-curriculum.mjs',
  'validate-leg-clinical-curriculum.mjs',
  'validate-limb-bone-clinical-curriculum.mjs',
  'validate-limb-connective-clinical-curriculum.mjs',
  'validate-lower-limb-vessel-clinical-curriculum.mjs',
  'validate-neck-clinical-curriculum.mjs',
  'validate-orbital-neural-clinical-curriculum.mjs',
  'validate-pelvic-organ-clinical-curriculum.mjs',
  'validate-pelvic-vessel-clinical-curriculum.mjs',
  'validate-regional-connective-clinical-curriculum.mjs',
  'validate-scapular-arm-clinical-curriculum.mjs',
  'validate-shoulder-arm-vessel-clinical-curriculum.mjs',
  'validate-shoulder-clinical-curriculum.mjs',
  'validate-thigh-clinical-curriculum.mjs',
  'validate-thoracic-organ-clinical-curriculum.mjs',
  'validate-thoracic-vessel-clinical-curriculum.mjs',
  'validate-trunk-clinical-curriculum.mjs',
];

const discovered = (await readdir(scriptsRoot))
  .filter((name) => /^validate-.*-clinical-curriculum\.mjs$/.test(name))
  .sort();
assert.deepEqual(discovered, expected, 'Update the complete validator inventory');

const copyPattern =
  /const copy = \(a\) => (?<expression>\(\{[\s\S]*?\n\}\));\r?\nsame\(curriculumHash\(copy\(previous\)\),/g;
const extractCopyExpression = (source) => {
  const matches = [...source.matchAll(new RegExp(copyPattern.source, 'g'))];
  assert.equal(matches.length, 1, 'Expected one deterministic copy helper');
  return matches[0].groups.expression;
};
const catalog = { structures: [{ id: 'one' }, { id: 'two' }] };
const historical = {
  contentTabs: ['old-a', 'old-b'],
  structures: [{ id: 'historical-shoulder' }],
  dissectionProfiles: { historical: true },
  bodyContent: (structure, tab) => ({ value: `${structure.id}/${tab}` }),
};
const expectedCopy = {
  body: [
    {
      id: 'one',
      sections: {
        'old-a': { value: 'one/old-a' },
        'old-b': { value: 'one/old-b' },
      },
    },
    {
      id: 'two',
      sections: {
        'old-a': { value: 'two/old-a' },
        'old-b': { value: 'two/old-b' },
      },
    },
  ],
  shoulder: historical.structures,
  dissectionProfiles: historical.dissectionProfiles,
};
const currentApi = new Proxy(
  {},
  {
    get(_target, property) {
      throw new Error(`Historical copy read current api.${String(property)}`);
    },
  },
);

for (const name of expected) {
  test(`${name} copies one historical API snapshot`, async () => {
    const source = await readFile(new URL(name, scriptsRoot), 'utf8');
    const copy = Function(
      'catalog',
      'api',
      `"use strict"; return (a) => ${extractCopyExpression(source)};`,
    )(catalog, currentApi);
    assert.deepEqual(copy(historical), expectedCopy);
  });
}

test('contract test rejects each original current-api capture', async () => {
  const source = await readFile(
    new URL('validate-pelvic-organ-clinical-curriculum.mjs', scriptsRoot),
    'utf8',
  );
  const expression = extractCopyExpression(source);
  for (const [historicalField, currentField] of [
    ['a.contentTabs', 'api.contentTabs'],
    ['a.structures', 'api.structures'],
    ['a.dissectionProfiles', 'api.dissectionProfiles'],
  ]) {
    const mutated = expression.replace(historicalField, currentField);
    assert.notEqual(mutated, expression, `Missing ${historicalField} canary`);
    const copy = Function(
      'catalog',
      'api',
      `"use strict"; return (a) => ${mutated};`,
    )(catalog, currentApi);
    assert.throws(() => copy(historical), /Historical copy read current api\./);
  }
});
