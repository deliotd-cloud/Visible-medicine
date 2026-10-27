import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePreCanonicalNavigation} from './canonical-navigation-source-inverse.mjs';
import {restorePreKeyboardHelp} from './keyboard-help-source-inverse.mjs';

const read = path => readFileSync(new URL(path, import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const once = (text, after, before) => {
  assert.equal(text.split(after).length, 2, 'one exact setup seam');
  return text.replace(after, before);
};

test('all three original space blocks and complete original source survive setup-only inverse', () => {
  const frozen = read('./fixtures/atlas-body-learning-space.current-original.test.mjs.raw');
  const after = read('./atlas-body-learning-space.test.mjs');
  assert.equal(sha(frozen), 'eebac7324514d16b9b2902c389b58d787a5bb937224a5cf444db21a2afec7a0e');
  let restored = after.toString();
  restored = once(restored, "import {restorePreCanonicalNavigation} from './canonical-navigation-source-inverse.mjs';\n", '');
  restored = once(restored,
    "const original=readFileSync(path.join(proposal,'tests/fixtures/atlas-body-learning-installed.tsx.raw'),'utf8').replaceAll('\\r\\n','\\n');",
    "const original=readFileSync(path.join(website,'components/AtlasBodyLearning.tsx'),'utf8').replaceAll('\\r\\n','\\n');");
  restored = once(restored,
    "const candidate=restorePreCanonicalNavigation(readFileSync(path.join(proposal,'components/AtlasBodyLearning.tsx'),'utf8'));",
    "const candidate=readFileSync(path.join(proposal,'components/AtlasBodyLearning.tsx'),'utf8').replaceAll('\\r\\n','\\n');");
  assert.equal(restored, frozen.toString(), 'entire original test source, including all three blocks');
  assert.equal(after.toString().slice(after.toString().indexOf("test('all source")),
    frozen.toString().slice(frozen.toString().indexOf("test('all source")), 'original test blocks are byte-exact');
});

test('the two authentic body learning epochs and Help transition have exact inverses and reject mutations', () => {
  const current = read('../components/AtlasBodyLearning.tsx');
  const prior = read('./fixtures/atlas-body-learning-installed.tsx.raw');
  assert.equal(sha(current), '058b63bd82d999cbc2020bc0e9221990432156f1d943b958b7aed1c222185af7');
  assert.equal(sha(prior), '8512c42af12098b2833a901245ac08406f081c3edacbfabe2d6bc5d73b544d42');
  assert.equal(restorePreCanonicalNavigation(current.toString()), prior.toString());
  assert.throws(() => restorePreCanonicalNavigation(current.toString().replace('sameAtlasDocument(src,', 'sameAtlasDocument(other,')));
  assert.throws(() => restorePreCanonicalNavigation(current.toString().replace('Atlas access does not unlock paid lectures.', 'Atlas unlocks lectures.')));
  const frame = read('../components/AtlasRuntimeFrame.tsx').toString();
  assert.equal(sha(frame), '35ecba7a2f3bb94bb86f2d4a2662d3460bbfb04e93a080c1c3bbe711078ed75e');
  assert.equal(sha(restorePreKeyboardHelp(frame)), '7d4d9d36f5f8b7a88477355ba76b3adb4e93d080cff9356dfe5725f3fc6c76d8');
  assert.equal(restorePreKeyboardHelp(restorePreKeyboardHelp(frame)), restorePreKeyboardHelp(frame),
    'authenticated pre-Help history passes through byte-exact');
  assert.throws(() => restorePreKeyboardHelp(frame.replace('Keyboard controls', 'Mouse controls')));
});

test('complete original component root remains byte exact', () => {
  assert.equal(sha(read('./atlas-body-learning-component.test.mjs')),
    '77047b19fb6aaa40b79f3395799a34a28c6cb5620dc7dc6cb0276cfe72315ca5');
  assert.deepEqual(read('./atlas-body-learning-component.test.mjs'),
    read('./fixtures/atlas-body-learning-component.current-original.test.mjs.raw'));
});
