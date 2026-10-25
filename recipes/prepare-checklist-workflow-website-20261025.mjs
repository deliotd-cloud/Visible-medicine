import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';import {memoryGate} from './native-website-integration-stage-20261025.mjs';
const parentFile='F:/VisibleMedicine/staging/20261025-navigation-history-website/SOURCE_CANDIDATE.json',parentSha='cf8bad61e8e33160f94be74994bf13c270c68dcdf395a9d040b5bdb5c2b164f5',parent=json(parentFile);
const stage='F:/VisibleMedicine/staging/20261025-checklist-workflow-website',site=stage+'/website',proposal='F:/VisibleMedicine/staging/20261025-checklist-import-contract-v2-proposal',role='F:/VisibleMedicine/staging/20261025-checklist-v1-role-proposal';
const auth='F:/VisibleMedicine/staging/20261025-checklist-installed-source-auth',memory=memoryGate(2048);assert(!fs.existsSync(stage));assert.equal(hash(parentFile),parentSha);
for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
assert.equal(hash(proposal+'/scripts/refresh-completion-checklist.mjs'),'e1d464069e41a3e2b19465cdd13b61d023837149525cd2ed1e26806d27b5e90b');
assert.equal(hash(proposal+'/tests/completion-checklist-installed-contract.test.mjs'),'f10a930d6e1b87a392408166c3a2d742477872dc62ae24ca4c6850f3f5058ee1');
assert(json(auth+'/checks/register-preflight-attempt-2/RESULT.json').passing);
const originalList=json('F:/VisibleMedicine/website/docs/completion-checklist.json'),revisedList=json(auth+'/REGISTER_PROPOSED.json');
assert.equal(originalList.revision,232);assert.equal(revisedList.revision,233);assert.deepEqual(revisedList.items,originalList.items);assert.deepEqual(revisedList.baseline,originalList.baseline);assert.deepEqual(revisedList.importedAtlasSource,originalList.importedAtlasSource);
const git=(args)=>execFileSync('git',args,{windowsHide:true,stdio:'pipe',env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}});
assert.equal(git(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');fs.mkdirSync(stage);
git(['--no-replace-objects','clone','--shared','--no-checkout','--','F:/VisibleMedicine/website',site]);git(['-C',site,'config','--local','core.autocrlf','false']);git(['-C',site,'read-tree','HEAD']);
for(const r of parent.sourceRows){fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
for(const p of ['next-env.d.ts','.next/types/routes.d.ts'])if(!fs.existsSync(site+'/'+p)&&fs.existsSync(parent.website+'/'+p)){fs.mkdirSync(path.dirname(site+'/'+p),{recursive:true});fs.copyFileSync(parent.website+'/'+p,site+'/'+p);}
const changed=['scripts/refresh-completion-checklist.mjs','tests/completion-checklist-local-import.test.mjs','docs/completion-checklist.json','docs/completion-checklist.md'];
const added=['tests/completion-checklist-installed-contract.test.mjs'];
for(const p of changed){fs.mkdirSync(path.dirname(stage+'/PREIMAGES/'+p),{recursive:true});fs.copyFileSync(parent.website+'/'+p,stage+'/PREIMAGES/'+p);}
fs.copyFileSync(proposal+'/scripts/refresh-completion-checklist.mjs',site+'/scripts/refresh-completion-checklist.mjs');
fs.copyFileSync(auth+'/REGISTER_PROPOSED.json',site+'/docs/completion-checklist.json');fs.copyFileSync(auth+'/checks/register-preflight-attempt-2/PROPOSED_CHECKLIST.md',site+'/docs/completion-checklist.md');
let testSource=fs.readFileSync(proposal+'/tests/completion-checklist-installed-contract.test.mjs','utf8');
const marker=' const data=structuredClone(original),documents=new Map();';assert.equal(testSource.split(marker).length,2);
testSource=testSource.replace(marker,marker+'\n // Synthetic receipts never inherit live candidate pointers from the register.\n delete data.unpublishedWebsiteCandidate;');
fs.writeFileSync(site+'/tests/completion-checklist-installed-contract.test.mjs',testSource);
for(const name of ['completion-checklist-local-import.test.mjs.raw','completion-checklist.json.raw','completion-checklist-19.json.raw','completion-checklist-21.json.raw']){
  const p='tests/fixtures/checklist-v1-role/'+name;assert(!parent.sourceRows.some(r=>r.path===p));added.push(p);fs.mkdirSync(path.dirname(site+'/'+p),{recursive:true});fs.copyFileSync(role+'/'+p,site+'/'+p);
}
const wrapper=String.raw`import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync,mkdtempSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertCompleteOriginal} from './deepbrain-foot-roles.mjs';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),role=resolve(project,'tests/fixtures/checklist-v1-role');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originals=[
 ['tests/completion-checklist-local-import.test.mjs','completion-checklist-local-import.test.mjs.raw','a90edb60ae231b20ab3940a011f34b3ca7fbe46b7418219659efa72845819491'],
 ['docs/completion-checklist.json','completion-checklist.json.raw','c2b3f9aa77f815fb278f74b40a2b68f496563389906b618acf69ec74e0b3cb58'],
 ['tests/fixtures/completion-checklist-19.json','completion-checklist-19.json.raw','51d016a07f1bfe9692bbcddea3afe40168441f86f9cebdfd44e17b123abe05fd'],
 ['tests/fixtures/completion-checklist-21.json','completion-checklist-21.json.raw','2a7ebfbf4a19a31aac0b6a2a9c802f01cda2a32dbf9f0cee85f4080c24eb5411'],
];
test('original v1 checklist import: all19cases against exact parent data and current verifier',()=>{
 const verifier=readFileSync(resolve(project,'scripts/refresh-completion-checklist.mjs'));
 assert.equal(sha(verifier),'e1d464069e41a3e2b19465cdd13b61d023837149525cd2ed1e26806d27b5e90b','Exact current verifier');
 const files=originals.map(([p,name,expected])=>{const bytes=readFileSync(resolve(role,name));assert.equal(sha(bytes),expected,name);return[p,bytes];});
 const base=resolve(project,'.local/checklist-v1-evidence');mkdirSync(base,{recursive:true});const evidence=mkdtempSync(resolve(base,'run-')),child=resolve(evidence,'child');
 for(const [p,bytes] of [...files,['scripts/refresh-completion-checklist.mjs',verifier]]){const target=resolve(child,p);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes,{flag:'wx'});}
 const run=spawnSync(process.execPath,['--max-old-space-size=256','--test','--test-concurrency=1','--test-reporter=tap',resolve(child,'tests/completion-checklist-local-import.test.mjs')],{cwd:child,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:4*1024*1024});
 writeFileSync(resolve(evidence,'child.tap'),run.stdout??'',{flag:'wx'});writeFileSync(resolve(evidence,'child.stderr.log'),run.stderr??'',{flag:'wx'});
 let counts=null,error=null;try{counts=assertCompleteOriginal({code:run.status,signal:run.signal,...(run.error?{error:String(run.error)}:{})},run.stdout??'',19);}catch(e){error=String(e);}
 writeFileSync(resolve(evidence,'terminal.json'),JSON.stringify({at:new Date().toISOString(),passing:error===null,expected:19,counts,error,code:run.status,signal:run.signal,originalRootSha256:originals[0][2],originalDataSha256:originals[1][2],currentVerifierSha256:sha(verifier),exactOriginalAssertionsPreserved:true,role:'v1 compatibility under exact historical data; not current v2 installed state'},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({v1ChildEvidence:evidence,expected:19,passing:error===null}));assert.equal(error,null);
});
`;
fs.writeFileSync(site+'/tests/completion-checklist-local-import.test.mjs',wrapper);
for(const p of ['scripts/refresh-completion-checklist.mjs','tests/completion-checklist-local-import.test.mjs','tests/completion-checklist-installed-contract.test.mjs'])execFileSync(process.execPath,['--check',site+'/'+p],{windowsHide:true});
const rows=[...parent.sourceRows.map(r=>changed.includes(r.path)?{path:r.path,bytes:fs.statSync(site+'/'+r.path).size,sha256:hash(site+'/'+r.path)}:{...r}),...added.map(p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)}))].sort((a,b)=>a.path.localeCompare(b.path));
for(const r of rows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const result={...parent,schema:'vm-checklist-installed-workflow-source-candidate/1',at:new Date().toISOString(),website:site,parent:parentFile,parentSha256:parentSha,sourceRows:rows,changedPaths:changed,addedPaths:added,removedPaths:[],workflowScope:'Developer checklist verifier, source records and original v1/current v2 test roles only; shipped learner/Review/runtime/model/licence/access bytes unchanged.',newSourceStrictTypesPassed:false,newTypeCheckOrBuildExecuted:false,installed:false,ownerPreviewChanged:false,clinicalApproval:false,legacyCompatibility:{originalCases:19,originalRootSha256:'a90edb60ae231b20ab3940a011f34b3ca7fbe46b7418219659efa72845819491',rawOriginalRetained:true,actualCurrentVerifierSourcePinned:true,childTapAndTerminalPersisted:true},syntheticFixtureReset:'New v2 tests clear live unpublished-candidate pointer before constructing their own controlled receipts.'};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),memory,parent:{path:parentFile,sha256:parentSha},canonicalChecklistBefore:{path:'F:/VisibleMedicine/website/docs/completion-checklist.json',sha256:hash('F:/VisibleMedicine/website/docs/completion-checklist.json')},changed,added,privateStateCopied:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json'),paths:rows.length,changed,added,newSyntheticRootSha256:hash(site+'/tests/completion-checklist-installed-contract.test.mjs')}));
