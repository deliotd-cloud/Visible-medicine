import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Each row pins the complete zero-context patch from installed fa1/Review0931
// to the proposed 6d7 admission adapter. Zero-hunk rows are byte-exact.
const rows=[
 ['atlas190-current-delivery.test.mjs',3,'05bd242983cd792edbc26be67e204d0d69d39affd3bc5fa495d4f472933620ab','ee51701b213d8a7b2720c5243146b286683cb791d48d5775c23f02501f842198'],
 ['body-learning-current-admission.test.mjs',0,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','cce010099839e867ebdd1fd379da1da99b7ca5681c8563b2db5d7a28ec051755'],
 ['body-learning-epoch-history-preservation.test.mjs',0,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','28c825e3bbdd69ef9b90f5b722e55727ecd9a40e2c065a9d8efd038f27af5f87'],
 ['body-learning-layout-history-preservation.test.mjs',0,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','de95cdf5b16db2679b45b915fb7933ccbb42bdc3c83e06548fd700858f60e530'],
 ['clinical-review-desktop-layout.test.mjs',2,'87d03b78d3d1abae3c18ad1c4e1cf6888f60bbccbba5f4cafe231c348a720b9e','a0c4ad2500ba988fde1cd074fa4aeaf7a3cc090eeaf32e1f7bdc548e427f32fa'],
 ['current-190-coverage.test.mjs',2,'9149e875168d88e165ba89bee7bd616d965a8ef63b9bb3fd2a1f0bd76505f747','83f74758a50eff36e3cfa320067e040ef4fc33bf70cb8f78f1a12e3ba186a9b4'],
 ['current-atlas-delivery.test.mjs',3,'5e393bc996823b8b36e7d2d35b3fcd60295de5b53a3d7b58a085a7d25509f28e','799e1b3935e6687bb47a025e5bff33acaee2c813dff83d8bec652f1102ae3b9b'],
 ['desktop-learning-row-history.test.mjs',3,'a198ac6f16f2762281c05d921f3b6e70c892e7371930eae1be1b82e571ce695f','88aa79624b76b3cb69e52f15a378b47466dc6fd2549847339721afd4f56c1514'],
 ['drawable-epoch-adapter-inverse.test.mjs',1,'78efe5e30b7ad84561a708431d4bb13c21d25d5ead6256254a95eb5f9d7c8bad','3a99641dc5092865e195e441fe0ff5b55a135bc46dcc617c650e0686ee5f76c8'],
 ['drawable-epoch-current-admission.test.mjs',8,'7f2f6f0dd7d5e831d1b31a4553faec10a6df00e2951f511c0e5898905ad3b879','08836926edb3c2cd47a69ac2b0e1c6d31a58360cf4b85781b54670c8d25fa18d'],
 ['drawable-epoch-historical-closure.test.mjs',0,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','cfeba268a313baab1ccf63858a4da09bd61e78354e86b3d0b090a4329e1a68d5'],
 ['head-neck-pilot-current.test.mjs',5,'b50341a9f378acaa7965af1e185d2ac05c1bf82f6a7487c6ef658fa4366202c9','2891a842e5c4723820ca61cfc51aea533a861809a40c4db8492808584462283d'],
 ['head-neck-pilot.test.ts',3,'468a1c0fa32b40665cda3852b2b77a96d49cfab2674c652fdbe9a9251b7f4883','5cb326883f1081550cb9940f4a603b2b9258e57ef41cee068ab3d33d786fc7d9'],
];
const sha=value=>createHash('sha256').update(value).digest('hex');
const dir=fileURLToPath(new URL('.',import.meta.url));

function inverse(newText,patch){
 const lines=newText.split('\n');
 const hunks=[...patch.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@[^\n]*\n((?:(?!^@@ ).*\n?)*)/gm)];
 for(const match of hunks.reverse()){
  const count=Number(match[4]??1),at=Number(match[3])-(count===0?0:1);
  const oldLines=[],newLines=[];
  for(const row of match[5].replace(/\n$/,'').split('\n')){
   if(row.startsWith('-'))oldLines.push(row.slice(1));
   else if(row.startsWith('+'))newLines.push(row.slice(1));
   else if(row!=='')throw Error('Unexpected patch context');
  }
  assert.equal(oldLines.length,Number(match[2]??1));
  assert.equal(newLines.length,count);
  assert.deepEqual(lines.slice(at,at+count),newLines);
  lines.splice(at,count,...oldLines);
 }
 return lines.join('\n');
}

test('all thirteen installed fa1 roots retain exact whole-source inverses outside pinned 6d7 seams',()=>{
 for(const [name,count,patchSha,forwardSha] of rows){
  const oldPath=dir+'fixtures/colic-fa1-preimage/'+name+'.raw',newPath=dir+name;
  const old=readFileSync(oldPath),forward=readFileSync(newPath);
  assert.equal(sha(forward),forwardSha,name+' adapter bytes');
  const result=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--unified=0','--',oldPath,newPath],{encoding:'utf8'});
  assert.equal(result.status,count===0?0:1,name+' declared seam status');
  const patch=count===0?'':result.stdout.slice(result.stdout.indexOf('@@ '));
  assert.equal((patch.match(/^@@ /gm)||[]).length,count,name+' seam count');
  assert.equal(sha(Buffer.from(patch)),patchSha,name+' complete seam text');
  assert.equal(inverse(forward.toString(),patch),old.toString(),name+' whole-source inverse');
 }
});
