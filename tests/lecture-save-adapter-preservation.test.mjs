import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha256 = text => createHash('sha256').update(text).digest('hex');
const fixtureDir = new URL('./fixtures/lecture-save-adapters-original/', import.meta.url);
const importedHelper = /^import \{lectureSavePresentation\} from '\.\.\/components\/lecture-save-presentation\.ts';\r?\n/mg;
const specs = [
  {
    file: 'lecture-anatomy-matches-ui.test.ts',
    original: 'ece4c9a2b490a27ef5ceccd5b608fdf9d76c1f1f93d765b203584f677b5dd541',
    candidate: 'b1af2dd198b5cac4f560c93ea7729431c0331317b31b30e84c6ccb6a20f72b42',
    loader: "name==='./lecture-save-presentation'?{lectureSavePresentation}:",
    prior: '',
  },
  {
    file: 'lecture-editor.test.ts',
    original: '0584c69c2ec38bf1afd682531e623539a0e0b24f16897288421980664f67a073',
    candidate: '40f8b233064fbc3eb24da3a54c332de89cbec5e7edcc4636b05619264dc3f872',
    loader: '    if (name === "./lecture-save-presentation") return {lectureSavePresentation};',
    prior: '',
    wholeLine: true,
  },
  {
    file: 'lecture-request-lifecycle.test.ts',
    original: '455ad3e3df7b5f7865762387b733c33e0d4af8035760bc4b29bd91efc2f4f396',
    candidate: 'f998bcf7afd75efb53c228164f21a228f731a9a466ec2fc267102e17fd07c640',
    loader: "name==='./lecture-save-presentation'?{lectureSavePresentation}:",
    prior: '',
  },
  {
    file: 'workbook-correction-lineage-editors.test.mjs',
    original: '96adc3ebdba20f645e0237ecf2cc5afb9288b1e516955182e6d6942ae2c711bc',
    candidate: '182b139fe1d3b2860ca2e1564f57491a20da3d3a52b977354d04b249b3342034',
    loader: "name=>name==='./lecture-save-presentation'?{lectureSavePresentation}:Object.hasOwn(mocks,name)",
    prior: 'name=>Object.hasOwn(mocks,name)',
  },
];

function replaceExactlyOnce(text, pattern, replacement, seam) {
  const matches = [...text.matchAll(pattern)];
  assert.equal(matches.length, 1, `${seam}: expected one exact seam`);
  return text.replace(pattern, replacement);
}

function recoverOriginal(spec, candidate) {
  let text = replaceExactlyOnce(candidate, importedHelper, '', `${spec.file} helper import`);
  const loader = spec.wholeLine
    ? new RegExp(`^${spec.loader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\r?\\n`, 'mg')
    : new RegExp(spec.loader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  text = replaceExactlyOnce(text, loader, spec.prior, `${spec.file} real helper loader`);
  assert.doesNotMatch(text, /lectureSavePresentation/, `${spec.file}: undeclared helper reference`);
  return text;
}

function verify(spec, candidate, original, pinCandidate = true) {
  assert.equal(sha256(original), spec.original, `${spec.file}: original fixture hash`);
  if (pinCandidate) assert.equal(sha256(candidate), spec.candidate, `${spec.file}: staged adapter hash`);
  const recovered = recoverOriginal(spec, candidate);
  assert.equal(recovered, original, `${spec.file}: complete original body and assertions`);
  assert.equal(sha256(recovered), spec.original, `${spec.file}: recovered original hash`);
}

for (const spec of specs) test(`${spec.file}: only the real typed helper loader was added`, () => {
  const candidate = readFileSync(new URL(spec.file, import.meta.url), 'utf8');
  const original = readFileSync(new URL(spec.file + '.raw', fixtureDir), 'utf8');
  verify(spec, candidate, original);
});

test('an altered original assertion is refused', () => {
  const spec = specs[1];
  const candidate = readFileSync(new URL(spec.file, import.meta.url), 'utf8');
  const original = readFileSync(new URL(spec.file + '.raw', fixtureDir), 'utf8');
  assert.match(candidate, /textOf\(node\) === "Unsaved changes"/);
  const altered = candidate.replace('textOf(node) === "Unsaved changes"', 'textOf(node) === "Save not confirmed"');
  assert.throws(() => verify(spec, altered, original, false), /complete original body and assertions/);
});

test('a duplicated helper seam is refused', () => {
  const spec = specs[0];
  const candidate = readFileSync(new URL(spec.file, import.meta.url), 'utf8');
  const original = readFileSync(new URL(spec.file + '.raw', fixtureDir), 'utf8');
  const duplicate = "import {lectureSavePresentation} from '../components/lecture-save-presentation.ts';\n" + candidate;
  assert.throws(() => verify(spec, duplicate, original, false), /expected one exact seam/);
});

test('a fake helper loader is refused', () => {
  const spec = specs[2];
  const candidate = readFileSync(new URL(spec.file, import.meta.url), 'utf8');
  const original = readFileSync(new URL(spec.file + '.raw', fixtureDir), 'utf8');
  const fake = candidate.replace(spec.loader, "name==='./lecture-save-presentation'?{lectureSavePresentation:()=>({})}:");
  assert.throws(() => verify(spec, fake, original, false), /expected one exact seam/);
});

test('the two other entries stay byte-identical to their recorded originals', () => {
  const unchanged = [
    ['workbook-correction-ui.test.mjs', '79a3d07157d8d7906e0ff2c9184103a57e1a0c4b6980a9828cbdae2efd68db4f'],
    ['workbook-retirement-contract.test.mjs', '96b5679e15fad8eaba89adcc8918116b73ef509f14cde2076af1ccab32e99734'],
  ];
  for (const [file, hash] of unchanged) {
    assert.equal(sha256(readFileSync(new URL(file, import.meta.url))), hash, file);
  }
});
