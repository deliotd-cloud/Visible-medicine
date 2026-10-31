import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const sourceBase=process.env.VM_HISTORY_SOURCE_TESTS?
  pathToFileURL(process.env.VM_HISTORY_SOURCE_TESTS+'/'):new URL('./',import.meta.url);
const {restorePreCanonicalNavigation}=await import(new URL('./canonical-navigation-source-inverse.mjs',sourceBase));
const {restorePreKeyboardHelp}=await import(new URL('./keyboard-help-source-inverse.mjs',sourceBase));
const {restorePreIssueDetails}=await import(new URL('./body-learning-issue-source-inverse.mjs',sourceBase));

const read = path => {
  const bytes=readFileSync(new URL(path, sourceBase));
  return path==='../components/AtlasBodyLearning.tsx'?Buffer.from(restorePreIssueDetails(bytes.toString())):bytes;
};
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
  const current=read('./atlas-body-learning-component.test.mjs');
  assert.equal(sha(current),'edad2769b2afdd3316d1470c8c72a5321e861638f93bae12ba2e51a7ff4e3bb6',
    'exact later component test root');
  // The later guided-caption role is also declared in complete-release-five-followups-preservation.
  let restored=current.toString('utf8');
  restored=once(restored,"import {restorePreGuidedCaption} from './head-guided-caption-inverse.mjs';\n",'');
  restored=once(restored,
    "name==='HeadAtlasGuidedModel'?restorePreGuidedCaption(candidate):candidate",
    'candidate');
  assert.equal(sha(Buffer.from(restored)),
    '77047b19fb6aaa40b79f3395799a34a28c6cb5620dc7dc6cb0276cfe72315ca5');
  assert.deepEqual(Buffer.from(restored),
    read('./fixtures/atlas-body-learning-component.current-original.test.mjs.raw'));
  assert.throws(()=>once(current.toString('utf8').replace('restorePreGuidedCaption(candidate)',
    'restorePreGuidedCaption(other)'),"name==='HeadAtlasGuidedModel'?restorePreGuidedCaption(candidate):candidate",'') );
});
