// Preserve the original tongue/soft-palate test under an explicit later-neck layer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-tongue-neck-history';
const receipt='F:/VisibleMedicine/staging/20261022-corpus-cranio-assurance/SOURCE.json';
assert.equal(sha(read(receipt)),'4148e2f10b083c9fdeec9d28ead4d13effd67e8f3499f2fdee43b9e0d1311eb7');
const source=json(receipt),file='tests/tongue-palate-delivery.test.ts',before=read(source.website+'/'+file);
assert.equal(sha(before),'f6e9e4fb0db975efea146e31c873fd0ece922156e8ae49906833a03bbfd30b0a');
const seams=[
 ["import {currentAtlasDeliveryRoot, validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {currentAtlasDeliveryRoot, validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {beforeNeckXraySnapshot,beforeNeckXrayBody} from './tongue-palate-neck-history.mjs';"],
 ["    const currentSnapshotBytes=git(atlas,'show',`${current}:${snapshotPath}`);",
  "    const liveSnapshotBytes=git(atlas,'show',`${current}:${snapshotPath}`);\n    const liveSnapshot=JSON.parse(liveSnapshotBytes.toString());\n    const currentSnapshotBytes=beforeNeckXraySnapshot(liveSnapshotBytes,git(atlas,'show',`6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1:${snapshotPath}`));"],
 ["    let currentBody = git(atlas, 'show', `${current}:app/body-content.ts`).toString();",
  "    let currentBody = beforeNeckXrayBody(git(atlas, 'show', `${current}:app/body-content.ts`),git(atlas,'show','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1:app/body-content.ts')).toString();"],
 ["      assert(authoredEntry && currentEntry,`${entry.identity.id}: both source placements retained`);",
  "      assert(authoredEntry && currentEntry,`${entry.identity.id}: both source placements retained`);\n      assert.deepEqual(liveSnapshot.entries.find((row:{identity:string})=>JSON.parse(row.identity).id===entry.identity.id),authoredEntry,`${entry.identity.id}: actual current complete tongue/palate row remains exact`);"],
];
let after=before.toString();for(const[from,to]of seams){assert.equal(after.split(from).length,2);after=after.replace(from,to);}
let restored=after;for(const[from,to]of [...seams].reverse()){assert.equal(restored.split(to).length,2);restored=restored.replace(to,from);}assert.equal(restored,before.toString());
assert(!fs.existsSync(root+'/preimage.ts.raw'));fs.copyFileSync(source.website+'/'+file,root+'/preimage.ts.raw',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(root+'/tongue-palate-delivery.test.ts',after,{flag:'wx'});
const helperPath=root+'/tongue-palate-neck-history.mjs';
const {beforeNeckXraySnapshot,beforeNeckXrayBody}=await import('file:///'+helperPath);
const git=(ref,p)=>runGit(['--no-replace-objects','-C',source.atlas,'show',ref+':'+p]);
assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);
assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const historical='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const cases=[['snapshot','content/regional-teaching/head-neck.json',beforeNeckXraySnapshot],['dispatcher','app/body-content.ts',beforeNeckXrayBody]];
let refusals=0;for(const[name,p,restore]of cases){const a=git(source.atlasHead,p),b=git(historical,p);assert.deepEqual(restore(a,b),b,name);
 for(const [left,right]of [[Buffer.concat([a,Buffer.from(' ')]),b],[a,Buffer.concat([b,Buffer.from(' ')])],[b,a]]){assert.throws(()=>restore(left,right));refusals++;}}
const test=`import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeNeckXraySnapshot,beforeNeckXrayBody} from './tongue-palate-neck-history.mjs';
const seams=${JSON.stringify(seams,null,2)};
const sha=b=>createHash('sha256').update(b).digest('hex');
const beforeHash='${sha(before)}',afterHash='${sha(Buffer.from(after))}';
function restoreTest(text){for(const[from,to]of [...seams].reverse()){assert.equal(text.split(to).length,2);text=text.replace(to,from);}return text;}
test('every original tongue/palate assertion survives four exact historical-role seams',()=>{
 const before=readFileSync(new URL('./fixtures/tongue-palate-before-neck-history.ts.raw',import.meta.url)),after=readFileSync(new URL('./tongue-palate-delivery.test.ts',import.meta.url));
 assert.equal(sha(before),beforeHash);assert.equal(sha(after),afterHash);assert.equal(restoreTest(after.toString()),before.toString());
 assert.throws(()=>assert.equal(restoreTest(after.toString()+'\\n/* extra */'),before.toString()));
});
const atlas=currentAtlasDeliveryRoot(),current=validateCurrentAtlasDelivery().source;
const git=(ref,p)=>execFileSync('git',['--no-replace-objects','-C',atlas,'show',ref+':'+p],{maxBuffer:32e6,windowsHide:true});
for(const[name,p,restore]of [['snapshot','content/regional-teaching/head-neck.json',beforeNeckXraySnapshot],['dispatcher','app/body-content.ts',beforeNeckXrayBody]]){
 test(name+' authenticates current and historical source bytes without widening the original teaching',()=>{
  const a=git(current,p),b=git('${historical}',p);assert.deepEqual(restore(a,b),b);
  for(const[left,right]of [[Buffer.concat([a,Buffer.from(' ')]),b],[a,Buffer.concat([b,Buffer.from(' ')])],[b,a]])assert.throws(()=>restore(left,right));
 });
}
`;
fs.writeFileSync(root+'/tongue-palate-neck-history.test.mjs',test,{flag:'wx'});
const files=[['tongue-palate-delivery.test.ts','tests/tongue-palate-delivery.test.ts'],['tongue-palate-neck-history.mjs','tests/tongue-palate-neck-history.mjs'],
 ['tongue-palate-neck-history.test.mjs','tests/tongue-palate-neck-history.test.mjs'],['preimage.ts.raw','tests/fixtures/tongue-palate-before-neck-history.ts.raw']].map(([from,to])=>({from:root+'/'+from,to,sha256:sha(read(root+'/'+from))}));
fs.writeFileSync(root+'/RESULT.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),files,
 originalTestSha256:sha(before),seams:4,sourceOnlyProofPassed:true,sourceMutationRefusals:refusals,testsNotRun:true,
 interpretation:'Exact later three landmark X-ray lessons and dispatcher branch restore the colic historical layer before the entire original tongue/palate test runs. All eight real current complete target rows are independently equal to the authored rows. No teaching/source/medical changes.',
 productChanged:false,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/RESULT.json',sha256:sha(read(root+'/RESULT.json')),sourceOnlyProofPassed:true,sourceMutationRefusals:refusals,testsNotRun:true}));
