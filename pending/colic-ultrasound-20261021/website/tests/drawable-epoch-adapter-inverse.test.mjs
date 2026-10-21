import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// The complete, byte-pinned 0df/c4a tests are the historical side of every
// adapter. A zero-context patch pins every forward seam, including additions.
const rows = [
 ['atlas190-current-delivery.test.mjs',2,'90d0020fa58287e146d81e88c37358f07c6dcbbd8a4f0b254fe384e96e31cf34','68f170aa438a01fc548ebe009e780190cfafcf7a0704506b5b6d6add4dd1dee2'],
 ['body-learning-current-admission.test.mjs',4,'6cca2f6ade8702c37de26a3fd6ead91956ade88314c184d800e0af1b209d222a','cce010099839e867ebdd1fd379da1da99b7ca5681c8563b2db5d7a28ec051755'],
 ['body-learning-epoch-history-preservation.test.mjs',2,'dfdd7c6200ce99b9e253713fd2881d856b5f8ea6ebaa521d3dc2f9050f30b621','28c825e3bbdd69ef9b90f5b722e55727ecd9a40e2c065a9d8efd038f27af5f87'],
 ['body-learning-layout-history-preservation.test.mjs',1,'c60a15eb498527e93d7deb1c259d068a7290cb2a97ddc645ae661582985bb568','de95cdf5b16db2679b45b915fb7933ccbb42bdc3c83e06548fd700858f60e530'],
 ['clinical-review-desktop-layout.test.mjs',2,'3c72f63e75b4e0833eada85e92ac889b1257409abdb7e63d33f30244126d904b','218948fa1d5e7e5a42a2de03a540ce122feeda87d599012a49dd367d634cc1fb'],
 ['current-190-coverage.test.mjs',3,'94f8800ace1f11fbdd8828b5cbbf88e9d454d960ac9f75e0b9a752e095337d79','902e58cb7c44ea29a56f21fbf91648df059d25870ea7250925c6de471b07c457'],
 ['current-atlas-delivery.test.mjs',2,'132c9bbc5c076552396bdf1de5e00c8caebbb33a65c112b8ca98649a62a1a1ce','9d17e32eced75ffd5b6f670251bd6f36983e6e21d5654b7dec9bc8ed5fc1ab91'],
 ['desktop-learning-row-history.test.mjs',7,'a0a1af6ab3be2c894eb8425f87529f692e6b6cbedbb0af0d80011a8f8892c404','837fa885e9f71db663a87016f460235248f698faf3fc0d02c0bca117b994e9a1'],
 ['head-neck-pilot-current.test.mjs',5,'9dbae70466813c3da3066b7f8eb1f7e4f9480d9e42fed5f1f450925a7a88e05f','fdfdbaad3d26b8b6d5e4f137718563ef3e5b242b7dbd15fe049e131eb941cc2a'],
 ['head-neck-pilot.test.ts',3,'7c8de2932de686d192179cfca6f412511e2ebb2fe5269ed95685093d0af68c8d','520649d10168b76fe7e78f28738deebb8f0472ae58bc91eacda24f4dc46aedd8'],
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const dir = fileURLToPath(new URL('.',import.meta.url));

function inverse(newText, patch) {
 const lines = newText.split('\n');
 const hunks = [...patch.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@[^\n]*\n((?:(?!^@@ ).*\n?)*)/gm)];
 for (const match of hunks.reverse()) {
  const at = Number(match[3]) - (Number(match[4] ?? 1) === 0 ? 0 : 1);
  const oldLines = [], newLines = [];
  for (const row of match[5].replace(/\n$/,'').split('\n')) {
   if (row.startsWith('-')) oldLines.push(row.slice(1));
   else if (row.startsWith('+')) newLines.push(row.slice(1));
   else if (row !== '') throw new Error('Unexpected patch context');
  }
  assert.equal(oldLines.length,Number(match[2] ?? 1));
  assert.equal(newLines.length,Number(match[4] ?? 1));
  assert.deepEqual(lines.slice(at,at+newLines.length),newLines);
  lines.splice(at,newLines.length,...oldLines);
 }
 return lines.join('\n');
}

test('all ten forward adapters invert to complete frozen 0df/c4a sources outside exact pinned seams',()=>{
 for (const [name,count,patchSha,forwardSha] of rows) {
  const oldPath=dir+'fixtures/drawable-epoch-preimage/'+name+'.raw',newPath=dir+'fixtures/colic-fa1-preimage/'+name+'.raw';
  const old=readFileSync(oldPath),forward=readFileSync(newPath);
  assert.equal(sha(forward),forwardSha,name+' forward bytes');
  const result=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--unified=0','--',oldPath,newPath],{encoding:'utf8'});
  assert.equal(result.status,1,name+' must differ by declared seams');
  const patch=result.stdout.slice(result.stdout.indexOf('@@ '));
  assert.equal((patch.match(/^@@ /gm)||[]).length,count,name+' seam count');
  assert.equal(sha(Buffer.from(patch)),patchSha,name+' complete seam text');
  assert.equal(inverse(forward.toString(),patch),old.toString(),name+' whole-source inverse');
 }
});
