import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-arterial-current-role-followup',site=root+'/website';
const parentReceipt='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/SOURCE.json',parent=json(parentReceipt);assert.equal(sha(read(parentReceipt)),'65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522');
const target='tests/arterial-history-preservation.test.mjs',before=read(parent.website+'/'+target),pinPath='tests/fixtures/current-atlas-delivery.json',pin=json(parent.website+'/'+pinPath),files=[target,'tests/atlas-arterial-evidence-limits.test.mjs','tests/fixtures/atlas-arterial-evidence-limits-before-current-admission.txt','tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs',pinPath,...Object.keys(pin.documents)];
assert(!fs.existsSync(root));fs.mkdirSync(root);const fixtureRows=[];
for(const relative of files){assert(!path.isAbsolute(relative)&&!relative.split('/').includes('..'));const bytes=read(parent.website+'/'+relative),row=parent.sourceRows.find(r=>r.path===relative);assert(row&&sha(bytes)===row.sha256,relative);const dest=site+'/'+relative;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes,{flag:'wx'});fixtureRows.push({path:relative,bytes:bytes.length,sha256:sha(bytes)});}
fs.copyFileSync(parent.website+'/'+target,root+'/arterial-history-preservation.before.mjs.raw',fs.constants.COPYFILE_EXCL);
const one=(text,from,to)=>{assert.equal(text.split(from).length,2,from.slice(0,80));return text.replace(from,to);};
const helper=`// Only the declared native-source scalar may differ from the closed6d7 subject.
function nativeSource6d7(bytes){
 const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text,'utf8'),bytes);
 const currentPin="  assert.equal(CURRENT_ATLAS_REVISION,'"+CURRENT_ATLAS_REVISION+"');";
 const closedPin="  assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');";
 const restored=Buffer.from(replaceUnique(text,currentPin,closedPin));
 assert.equal(sha(restored),currentSubjectSha6d7,'Complete closed6d7 subject after only the current native-source scalar inverse');
 return restored;
}

`;
let proposed=before.toString();proposed=one(proposed,"import test from 'node:test';\n","import test from 'node:test';\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\n");
proposed=one(proposed,"test('arterial admission retains the complete prior contract across the native source epoch',()=>{",helper+"test('arterial admission retains the complete prior contract across the native source epoch',()=>{");
proposed=one(proposed,'const originalBytes=readFileSync(original),admittedBytes=readFileSync(admitted);','const originalBytes=readFileSync(original),admittedBytes=nativeSource6d7(readFileSync(admitted));');
const additions=`
test('native role restoration refuses source edits outside its one declared scalar',()=>{
 const bytes=readFileSync(admitted),text=bytes.toString();
 assert.equal(sha(nativeSource6d7(bytes)),currentSubjectSha6d7);
 assert.throws(()=>nativeSource6d7(Buffer.concat([bytes,Buffer.from('/* foreign source */')])));
 const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>nativeSource6d7(changed));
 const originalAssertion='assert.equal(refused,142);';assert(text.includes(originalAssertion));
 assert.throws(()=>nativeSource6d7(Buffer.from(text.replace(originalAssertion,'assert.equal(refused,141);'))));
});

test('a foreign native-source scalar cannot be admitted by the historical inverse',()=>{
 const text=readFileSync(admitted).toString(),native="assert.equal(CURRENT_ATLAS_REVISION,'"+CURRENT_ATLAS_REVISION+"');";
 assert.equal(text.split(native).length,2);
 assert.throws(()=>nativeSource6d7(Buffer.from(text.replace(native,"assert.equal(CURRENT_ATLAS_REVISION,'"+'0'.repeat(40)+"');"))));
});
`;
proposed+=additions;
// Prove the complete original file survives exactly, not just selected assertions.
let restored=one(proposed,"import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\n",'');restored=one(restored,helper,'');restored=one(restored,'admittedBytes=nativeSource6d7(readFileSync(admitted));','admittedBytes=readFileSync(admitted);');restored=one(restored,additions,'');assert.deepEqual(Buffer.from(restored),before);
assert(!/\btest\.(?:skip|only|todo)\s*\(/.test(proposed));fs.writeFileSync(site+'/'+target,proposed);
const args=['--test','--test-concurrency=1','--test-reporter=tap',target],native=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,maxBuffer:8e6});
fs.writeFileSync(root+'/native.stdout.log',native.stdout??'',{flag:'wx'});fs.writeFileSync(root+'/native.stderr.log',native.stderr??'',{flag:'wx'});const output=(native.stdout??Buffer.from('')).toString(),counts=Object.fromEntries([...output.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],+m[2]]));
const result={at:new Date().toISOString(),parentSourceReceipt:parentReceipt,parentSourceReceiptSha256:sha(read(parentReceipt)),target,beforeSha256:sha(before),afterSha256:sha(Buffer.from(proposed)),original:root+'/arterial-history-preservation.before.mjs.raw',proposed:site+'/'+target,wholeOriginalSourceInversePassed:true,fixtureRows,fixtureScope:'Exact copied current contract and its12 metadata documents plus historical source text; no app/runtime/geometry/scan/public-preview claim.',args,nativeCode:native.status,counts,stdoutSha256:sha(read(root+'/native.stdout.log')),stderrSha256:sha(read(root+'/native.stderr.log')),nativeFailures:[...output.matchAll(/^not ok \d+ - (.*)$/gm)].map(m=>m[1]),productChanged:false,frozenFullRunChanged:false,ownerPreviewChanged:false,fullSuitePassing:false,publicDeployment:false,next:'Main must integrate this source-role overlay only after the current frozen complete gate is terminal, keeping the entire original historical theorem and new tamper checks.'};
fs.writeFileSync(root+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/RESULT.json',sha256:sha(read(root+'/RESULT.json')),nativeCode:native.status,counts,failures:result.nativeFailures}));assert.equal(native.status,0);assert.deepEqual(counts,{tests:3,pass:3,fail:0,cancelled:0,skipped:0,todo:0});
