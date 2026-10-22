// Source-byte proof only: no website/test/validator/transpiler modules execute.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {restoreCerebralCheckoutCandidate,verifyCurrentCommittedBinding} from './CODE/tests/cerebral-checkout-current-adapter.mjs';
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const stage=new URL('./',import.meta.url);
const read=p=>readFileSync(new URL(p,stage)),frozen=p=>readFileSync(website+'/'+p);
const sha=b=>createHash('sha256').update(b).digest('hex');
const exchange=(s,from,to)=>{const eol=s.includes('\r\n')?'\r\n':'\n';const a=from.replaceAll('\r\n','\n').replaceAll('\n',eol),b=to.replaceAll('\r\n','\n').replaceAll('\n',eol);assert.equal(s.split(a).length,2,'Unique full-code inverse seam');return s.replace(a,b);};
const main='cerebral-checkout-epoch-preservation.test.mjs',tour='atlas-tour-completion.test.mjs';
for(const name of [main,tour])assert.deepEqual(read('RAW/tests/'+name),frozen('tests/'+name),'Untouched full preimage');
let inverse=read('CODE/tests/'+tour).toString('utf8');
inverse=exchange(inverse,"import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';");
inverse=exchange(inverse,'const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,CURRENT_ATLAS_REVISION);\n','');
inverse=exchange(inverse,'  assert.equal(manifest.sourceCommit,pin.runtimeSources[module]);','  assert.equal(manifest.sourceCommit,revision);');
assert.deepEqual(Buffer.from(inverse),read('RAW/tests/'+tour),'Whole tour-completion source inverse');
inverse=read('CODE/tests/'+main).toString('utf8');
inverse=exchange(inverse,"import {restoreCerebralCheckoutCandidate,verifyCurrentCommittedBinding} from './cerebral-checkout-current-adapter.mjs';\n",'');
inverse=exchange(inverse,"  candidate=restoreCerebralCheckoutCandidate(candidate,fixture('expanded-viewer-test-types/atlas-cerebral-lobar-imaging.test.ts.raw'),fixture('atlas-cerebral-lobar-imaging.before-schema-admission-20261022.test.ts.raw'));\n",'');
inverse=exchange(inverse,'  verifyCurrentCommittedBinding(row,committed,working);',"  assert.equal(row.sha256,sha(working),'Current learner manifest binds working bytes');");
assert.deepEqual(Buffer.from(inverse),read('RAW/tests/'+main),'Whole cerebral preservation source inverse');
const current=frozen('tests/atlas-cerebral-lobar-imaging.test.ts');
const schema=frozen('tests/fixtures/expanded-viewer-test-types/atlas-cerebral-lobar-imaging.test.ts.raw');
const prior=frozen('tests/fixtures/atlas-cerebral-lobar-imaging.before-schema-admission-20261022.test.ts.raw');
const original=frozen('tests/fixtures/atlas-cerebral-lobar-imaging.before-6036-checkout.test.ts.raw');
const restored=restoreCerebralCheckoutCandidate(current,schema,prior);assert.deepEqual(restored,prior);
// Evaluate only the exact original local source-byte theorem, not its test file.
const old=read('RAW/tests/'+main).toString('utf8');
const a=old.indexOf('function verifyCandidate('),b=old.indexOf('\nfunction verifyCurrent(',a);
assert(a>0&&b>a);const originalTheorem=old.slice(a,b);
const replaceOnce=(source,from,to,eol)=>exchange(source,from.replaceAll('\n',eol),to.replaceAll('\n',eol));
const verifyOriginal=new Function('assert','sha','replaceOnce','originalHash','candidateHash',originalTheorem+';return verifyCandidate;')(
 assert,sha,replaceOnce,'f092a5544724a890a2d43c8f7056d06be1ae2da7d30b5cbcef54002383f3768a','15e7fe631d748d679dc8f7329916d051235abab6b22d3ce4da7f95412838b078');
verifyOriginal(restored,original);
let refusals=0;
for(const [before,after] of [['closedPin,(path:string)=>','closedPin,path=>'],['assert.equal(checkedRepresentations,9)','assert.equal(checkedRepresentations,8)'],['assert.equal(count,8);','assert.equal(count,0);']]){
 const mutant=Buffer.from(exchange(current.toString('utf8'),before,after));
 assert.throws(()=>restoreCerebralCheckoutCandidate(mutant,schema,prior));refusals++;
}
assert.throws(()=>restoreCerebralCheckoutCandidate(current,Buffer.concat([schema,Buffer.from(' ')]),prior));refusals++;
assert.throws(()=>restoreCerebralCheckoutCandidate(current,schema,Buffer.concat([prior,Buffer.from(' ')])));refusals++;
assert.throws(()=>verifyOriginal(restored,Buffer.concat([original,Buffer.from(' ')])));refusals++;
const pin=JSON.parse(frozen('tests/fixtures/current-atlas-delivery.json'));
const root='F:/VisibleMedicine/atlas';
const git=(revision,path)=>execFileSync('git',['--no-replace-objects','-C',root,'show',revision+':'+path],{windowsHide:true,maxBuffer:32e6});
const policy=JSON.parse(frozen('tests/fixtures/current-source-checkout-representations-craniofacial-ct.json'));
const inputs=JSON.parse(frozen('public/atlas-runtime/head-neck/source-inputs.json'));
assert.equal(policy.records.length,9);
for(const record of policy.records){
 const row=inputs.find(item=>item.path===record.path);assert(row);
 const committed=git(pin.source,row.path),working=readFileSync(root+'/'+row.path);
 assert.equal(verifyCurrentCommittedBinding(row,committed,working),true);
 const bad=Buffer.from(working);bad[0]^=1;
 assert.throws(()=>verifyCurrentCommittedBinding(row,committed,bad));refusals++;
 assert.throws(()=>verifyCurrentCommittedBinding({...row,sha256:'0'.repeat(64)},committed,working));refusals++;
 const wrong=Buffer.from(committed);wrong[0]^=1;
 assert.throws(()=>verifyCurrentCommittedBinding(row,wrong,working));refusals++;
}
for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])assert.equal(JSON.parse(frozen('public/atlas-runtime/'+module+'/manifest.json')).sourceCommit,pin.runtimeSources[module]);
console.log(JSON.stringify({status:'PASS_SOURCE_ONLY',wholeOriginalInverses:2,editSeams:6,composedSourceTransitions:4,originalCheckoutTransitions:2,currentMetadataRecords:9,sourceMutationRefusals:refusals,nativeRootsRerun:false}));
