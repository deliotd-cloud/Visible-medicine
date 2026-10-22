import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import test from 'node:test';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const originalPath = new URL('./fixtures/atlas-cervical-projection-xray-before-epoch-20261022.test.mjs.raw', import.meta.url);
const proposedPath = new URL('./atlas-cervical-projection-xray.test.mjs', import.meta.url);
const originalSha = 'a5848c319f0df5d21105f2c7710b62a2d94c8858db4a63368ef3a9e826a9b06b';
const proposedSha = '428fb397b7d5efff567754844a282223ee8ce8068fc0eb599413cbd7fe0621df';
const seams = [
  ["import { emittedTeaching } from './atlas-emitted-teaching.ts';\n", '\n\nconst revision'],
  ['const sourceRepo = currentAtlasDeliveryRoot();\n', 'const root = process.cwd();'],
  ["for (const region of ['head-neck','shoulder','lower-limb','female-pelvis'])\n", "  const tree = execFileSync"],
  ['  for(const [path,id]of tree)committed.set(`${commit}:${path}`,objects.get(id));\n}\n', 'const apiEntry = ['],
  ["  const runtimes = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];\n", '  for (const region of runtimes) {'],
  ["    const inputs = json(base + 'source-inputs.json');\n", '    assert.equal(new Set(manifest.files'],
  ['    for (const row of manifest.files) {\n', '    for (const flag of'],
];

function bounds(source, start, end) {
  const first = source.indexOf(start);
  assert.ok(first >= 0 && source.indexOf(start, first + 1) < 0, 'Unique start anchor: ' + start);
  const from = first + start.length, to = source.indexOf(end, from);
  assert.ok(to >= 0, 'End anchor: ' + end);
  return {from, to};
}
function segment(source, [start, end]) {
  const {from, to} = bounds(source, start, end);
  return source.slice(from, to);
}
function replaceSegment(source, seam, replacement) {
  const {from, to} = bounds(source, ...seam);
  return source.slice(0, from) + replacement + source.slice(to);
}
function verify(original, proposed) {
  assert.equal(sha(Buffer.from(original)), originalSha, 'Exact original raw source');
  assert.equal(sha(Buffer.from(proposed)), proposedSha, 'Only the reviewed proposal is admitted');
  let forward = original, inverse = proposed;
  for (const seam of seams) {
    forward = replaceSegment(forward, seam, segment(proposed, seam));
    inverse = replaceSegment(inverse, seam, segment(original, seam));
  }
  assert.equal(forward, proposed, 'Full-source forward reconstruction');
  assert.equal(inverse, original, 'Full-source inverse reconstruction');
}

test('cervical epoch proposal preserves the complete source and refuses other edits', () => {
  const original = readFileSync(originalPath, 'utf8');
  const proposed = readFileSync(proposedPath, 'utf8');
  verify(original, proposed);
  const helper = proposed.match(/function assertExactCheckoutBytes\(path, working, committed\) \{\n[\s\S]*?\n\}/)?.[0];
  assert.ok(helper, 'Exact working-byte guard survives');
  const assertExactCheckoutBytes = new Function('assert', helper + '\nreturn assertExactCheckoutBytes;')(assert);
  const pinnedRuntimeInput = sha(Buffer.from('unchanged pinned runtime input'));
  assert.doesNotThrow(() => assertExactCheckoutBytes('app/body-content.ts', Buffer.from('source'), Buffer.from('source')));
  assert.throws(() => assertExactCheckoutBytes('app/body-content.ts', Buffer.from('mutated'), Buffer.from('source')),
    /Current Atlas checkout differs/, 'Unrelated checkout mutation rejected with raw runtime input untouched');
  assert.equal(sha(Buffer.from('unchanged pinned runtime input')), pinnedRuntimeInput);
  const mutations = [
    proposed.replace("shoulder: '190a63238eadcf906abe89dcbb6a67c88afe70b9'",
      "shoulder: revision"),
    proposed.replace("'90dea95329aea5015ce339e430d9f342090617c82ee48613e15dd2240f08b746'",
      "'0'.repeat(64)"),
    proposed.replace("assert.equal(emittedLicence.sha256, licence.sha256", "assert.ok(emittedLicence.sha256"),
    proposed.replace("assert.equal(sha(bytes), row.sha256", "assert.ok(sha(bytes), row.sha256"),
    proposed.replace("assert.equal(preserved, 9830);", "assert.equal(preserved, 9829);"),
    proposed.replace('        assertExactCheckoutBytes(input.path, readFileSync(resolve(sourceRepo, input.path)), git(revision, input.path));',
      '        // missing checkout integrity'),
  ];
  for (const candidate of mutations) {
    assert.notEqual(candidate, proposed, 'Mutation was applied');
    assert.throws(() => verify(original, candidate), 'Unreviewed mutation refused');
  }
  assert.throws(() => verify(original.replace('current imported versus exact Git source',
    'current imported versus different Git source'), proposed), 'Altered raw preimage refused');
});

test('actual licence witness accepts exact raw or documented Windows bytes and refuses all other representations',()=>{
  const proposed=readFileSync(proposedPath,'utf8');
  const code=proposed.match(/function witnessLicenceCheckout\(\) \{\n[\s\S]*?\n\}/)?.[0];
  assert.ok(code);
  const revision='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
  const sourceRepo=process.env.VM_ATLAS_SOURCE_REPO||'F:/VisibleMedicine/atlas';
  const path='LICENSES/bodyparts3d-license-evidence.html';
  const raw=execFileSync('git',['--no-replace-objects','-C',sourceRepo,'show',revision+':'+path],{windowsHide:true,maxBuffer:32e6});
  const windows=readFileSync(sourceRepo+'/'+path);
  assert.equal(sha(windows),'90dea95329aea5015ce339e430d9f342090617c82ee48613e15dd2240f08b746');
  const witness=(working,committed=raw)=>new Function('assert','sha','git','revision','readFileSync','resolve','sourceRepo',code+'\nreturn witnessLicenceCheckout();')(
    assert,sha,(commit,name)=>{assert.equal(commit,revision);assert.equal(name,path);return committed;},revision,
    name=>{assert.equal(name,sourceRepo+'/'+path);return working;},(root,name)=>root+'/'+name,sourceRepo);
  for(const bytes of [raw,windows])assert.deepEqual(witness(bytes),{path,sha256:sha(raw)});
  for(const bytes of [Buffer.concat([raw,Buffer.from(' ')]),Buffer.from(raw.toString().replaceAll('\n','\r\n')),Buffer.concat([windows,Buffer.from('\nchanged source')])]){
    assert(!bytes.equals(raw)&&!bytes.equals(windows));assert.throws(()=>witness(bytes));
  }
  assert.throws(()=>witness(raw,Buffer.concat([raw,Buffer.from(' ')])),'Raw committed source change refused');
});

