// Pure code/Git evidence only: no website test, validator, compiler or renderer.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {restorePriorConnectiveFamily} from './CODE/tests/connective-current-family-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=(part,name)=>readFileSync(new URL('./'+part+'/tests/'+name,import.meta.url));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const name='clinical-review-lower-limb-connective-xray.test.ts';
const raw=read('RAW',name),code=read('CODE',name);
assert.equal(sha(raw),'eb7e626855026127c0c02927a8b4c7ad7cc31da4637681dc5efa11c281bdd4f7');
assert.equal(sha(code),'7aa5be85013096667406747701dc40b50bec69e22a676f2163b4680a773904d3');
assert.deepEqual(raw,readFileSync(website+'/tests/'+name));
assert.equal(sha(read('CODE','connective-current-family-inverse.mjs')),'691cf2448285986ebe6aaaeb2971780b63de06ba674ff390786bc0da9aec9467');
assert.deepEqual(restorePriorConnectiveFamily(code),raw,'Actual complete current-to-frozen inverse');
for(const mutant of [Buffer.concat([code,Buffer.from('foreign')]),code.subarray(1),Buffer.from(code.toString().replace('runtimeSources.shoulder','runtimeSources.head-neck'))])
 assert.throws(()=>restorePriorConnectiveFamily(mutant),'Unknown/substituted source refused');
assert.throws(()=>restorePriorConnectiveFamily(code,{readPrior:()=>Buffer.concat([raw,Buffer.from('foreign')])}),'Frozen fixture corruption refused');
const witness='connective-xray-original-preservation.test.mjs';
const rawWitness=read('RAW',witness),newWitness=read('CODE',witness);
assert.equal(sha(rawWitness),'95155898472c71789a4cc9cbd38236dca47d64c831c765eba05cceb76ca69c7f');
assert.equal(sha(newWitness),'6c0be0f2226259d0a00dcba01c64a9bc3f25fed4bf056a8bcd8b8aff9d4731e1');
let restoredWitness=newWitness.toString();
for(const [after,before] of [
 ["import {restorePriorConnectiveFamily} from './connective-current-family-inverse.mjs';\n",''],
 [" const current=restorePriorConnectiveFamily(readFileSync(currentPath)).toString('utf8');"," const current=readFileSync(currentPath,'utf8');"],
]){assert.equal(restoredWitness.split(after).length,2);restoredWitness=restoredWitness.replace(after,before);}
assert.deepEqual(Buffer.from(restoredWitness),rawWitness,'Complete original preservation witness survives');
// Execute only the authenticated original pure LCS/verification functions, not
// the website's node:test module or any source-history/renderer implementation.
const originalWitness=rawWitness.toString(),start=originalWitness.indexOf('const originalPath='),end=originalWitness.indexOf("\ntest('");
assert(start>0&&end>start);const pureOriginal=originalWitness.slice(start,end);
assert(!pureOriginal.includes('readFileSync(')&&!pureOriginal.includes('execFileSync('));
const verifyOriginal=new Function('assert','createHash',pureOriginal+'\nreturn verify;')(assert,createHash);
const first=readFileSync(website+'/tests/fixtures/connective-xray-9f-original.test.ts.raw');
verifyOriginal(first.toString(),restorePriorConnectiveFamily(code).toString());
assert.throws(()=>verifyOriginal(first.toString()+'foreign',raw.toString()));
assert.throws(()=>verifyOriginal(first.toString(),raw.toString()+'foreign'));
const prior='190a63238eadcf906abe89dcbb6a67c88afe70b9',current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',epoch='a6797b2b0c850edc5f50918c9352c887209eac94';
const git=(revision,p)=>execFileSync('git',['--no-replace-objects','-C','F:/VisibleMedicine/atlas','show',revision+':'+p],{windowsHide:true,maxBuffer:32e6});
const pin=JSON.parse(readFileSync(website+'/tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,current);assert.equal(pin.runtimeSources.shoulder,prior);
const metadata=readFileSync(website+'/tests/fixtures/review-navigation-delivery/current-atlas-delivery.json.raw');
assert.equal(sha(metadata),'b6301e20b714a67df82575f9f9b75f642fbf44310560444cfb537692bf5cef1f');
assert.equal(JSON.parse(metadata).source,prior);assert.equal(JSON.parse(metadata).reviewIntegration,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');
const review=JSON.parse(readFileSync(website+'/atlas-review/manifest.json'));
assert.equal(review.revision,current);assert.equal(review.websiteIntegrationSha256,pin.reviewIntegration);
for(const p of ['app/body-content.ts','lib/body-review-material.ts','lib/regional-tours.ts','content/body-review-display-pins.json']){
 const source=git(current,p),row=review.files.find(r=>r.path===p);assert(row);assert.equal(row.sourceSha256,sha(source));assert.equal(row.importedSha256,sha(source));
}
for(const p of ['content/lower-limb-connective-xray.before.json','content/lower-limb-connective-xray.ts','lib/lower-limb-connective-xray.ts'])
 assert.deepEqual(git(prior,p),git(current,p),'Original connective feature source held: '+p);
const pinsAt=r=>new Map(JSON.parse(git(r,'content/body-review-display-pins.json')).pins.map(p=>[p.structureId,p.sha256]));
const introductionPins=pinsAt(epoch),priorPins=pinsAt(prior),currentPins=pinsAt(current);
const differences=(a,b)=>[...b].filter(([id,digest])=>a.get(id)!==digest).map(([id])=>id).sort();
const historic=differences(introductionPins,priorPins),later=differences(priorPins,currentPins);
assert.equal(historic.length,587);assert.equal(sha(JSON.stringify(historic)),'822b7c8cf271907325f6d90e1f0499fd1d4affe5c144a8fef95c4480065c22ef');
assert.deepEqual(later,['vm:anatomy:body:abdomen:midline:vessel:middle-colic-artery','vm:anatomy:body:abdomen:right:vessel:right-colic-artery']);
assert.equal(sha(JSON.stringify(later)),'67764eea6c280f5875a97203563de86019840415d92a80dc1ce97d8bb0486ff9');
const result={at:new Date().toISOString(),wholeSourceInverses:2,actualAdapterSuccess:true,actualOriginalPureLcsTheoremPassed:true,sourceAndFixtureMutantsRefused:6,historicalChangedPins:587,currentLaterChangedPins:2,strictCurrentValidatorUnchanged:true,nativeTestsRun:false,canonicalOrFrozenEdited:false};
const output=new URL('./SOURCE_PROOF_RESULT.json',import.meta.url);assert(!existsSync(output));writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
