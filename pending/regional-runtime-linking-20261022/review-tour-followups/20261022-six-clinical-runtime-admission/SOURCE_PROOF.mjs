import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sourceRoot='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=[
  ['clinical-review-tour-imaging.test.ts',
    '5b6973bb2241ab63ffccb4a911a48e5c2ee9adef3f7ce8c6cfb1345d3deb4be4',
    '21186d4ade0a595cba0f7121b0c439dfe81acc597d7d93e581b0467a9c2158de',
    'currentPin.runtimeSources[module]'],
  ['clinical-review-um-ankle-imaging.test.ts',
    '57c7250be0b65ea1756f992b822803cad98560389eb9aa3f551c33414d5bd2c5',
    '62449d6ba0d2719e16d7cd4acd7b48a5215d261cd44822a23d0d796da718b3ac',
    'pin.runtimeSources[module]'],
  ['clinical-review-upper-venous-tour.test.ts',
    '58876d6c84dc39aab6330e7a8a24f2656efa3c9223ae72470dc6bfa47d0c395d',
    'd9718a82a25fd9533a7f3dcc7483acb131404738e012e7bab8ec2109dee5668f',
    'validateCurrentAtlasDelivery().source'],
  ['clinical-review-visceral-arterial-xray.test.ts',
    '4c20690db0b8894ffd1eb583e545c61bccc6cb5894b715964f8ff2ff38fe82ca',
    'be2e213ba210247d94a964bb4521c2630edab81f4496c3e2363d2cf725921c7b',
    'pin.runtimeSources[name]'],
  ['clinical-review-vocal-tissue-teaching.test.ts',
    '957869680b17019ea178d75b9effacdc2f4333e9737abfad5bbd5906058b5c71',
    '36d9b0a2d2b33c1426207c95103279966e53bbba5c61b325ecff757482a59c91',
    'pin.runtimeSources[name]'],
  ['tongue-palate-delivery.test.ts',
    'bf4528110979d7691f05701fb9113ee6e66214156214ef9478a40d763ce61145',
    '5dd1101cc8ce1a84618878d905b890d82484229bef3efc1c71c8015c4546b665',
    'Only 28 dental and two inferior-thyroid MRI lessons change the complete authored 6036 snapshot'],
  ['regional-tour-role-preservation-20261021.test.mjs',
    '11900802b88e160a98b7810f18dc0afae9b4df66918f2cbaf148dc49aecba912',
    '99cfb5b368c4ad51545d431916fbd5ee204d3ce1e27b5ad57b74273c391b0fc5',
    'restoreCurrentTour(current.toString())'],
  ['limb-suprahyoid-role-preservation-20261021.test.mjs',
    '81a6a02d6a25426c64e9cd7a313e19a3be1b4ab44183b0a89c0c90000076a038',
    'd51678cc4a2f42badbc9fb3fd0afffabb6094c7af2fa2f225f4acb907c6e0fcb',
    'restoreCurrentAnkle(current.toString())'],
  ['venous-urinary-role-preservation-20261021.test.mjs',
    '425a72be30edf51159b4c2cc19bc12c15866372b4b8e2793b465deda7eef63e2',
    '4130539addc372692276dcad2da6bb8b1913e93b41df98394045ae42f7d58b4e',
    'newestUpperSeams'],
];
for(const [name,rawSha,codeSha,marker] of cases){
  const raw=readFileSync(new URL('./RAW/tests/'+name,import.meta.url));
  const code=readFileSync(new URL('./CODE/tests/'+name,import.meta.url));
  assert.equal(sha(raw),rawSha,name+': exact V5 preimage');
  assert.deepEqual(readFileSync(sourceRoot+name),raw,name+': frozen candidate untouched');
  assert.equal(sha(code),codeSha,name+': exact staged proposal');
  assert(code.toString('utf8').includes(marker),name+': declared source-family seam');

  // The pinned replacement span covers every changed byte, including retained
  // material between nearby edits. Restore it into the complete unchanged
  // prefix/suffix and compare the full original buffer, not selected lines.
  let prefix=0;
  while(prefix<raw.length&&prefix<code.length&&raw[prefix]===code[prefix])prefix++;
  let suffix=0;
  while(suffix<raw.length-prefix&&suffix<code.length-prefix&&
    raw[raw.length-1-suffix]===code[code.length-1-suffix])suffix++;
  assert(prefix>0&&suffix>0&&prefix+suffix<raw.length&&prefix+suffix<code.length,
    name+': exact nonempty changed span');
  const originalSpan=raw.subarray(prefix,raw.length-suffix);
  const currentSpan=code.subarray(prefix,code.length-suffix);
  const inverse=Buffer.concat([code.subarray(0,prefix),originalSpan,code.subarray(code.length-suffix)]);
  assert.deepEqual(inverse,raw,name+': complete original buffer inverse');
  assert.equal(sha(inverse),rawSha,name+': authenticated original recovered');
  const rebuilt=Buffer.concat([raw.subarray(0,prefix),currentSpan,raw.subarray(raw.length-suffix)]);
  assert.deepEqual(rebuilt,code,name+': exact forward composition');

  const mutated=Buffer.from(code);
  mutated[prefix]^=1;
  assert.notEqual(sha(mutated),codeSha,name+': mutation changes proposal hash');
  assert.throws(()=>assert.equal(sha(mutated),codeSha),name+': mutation refused');
  assert.notDeepEqual(mutated.subarray(prefix,mutated.length-suffix),currentSpan,
    name+': exact current span changed');
  console.log(name+': full-buffer inverse, current seam and mutation refusal passed');
}
