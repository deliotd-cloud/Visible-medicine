// Test-only stock-discovery bridge. The nine original roots live beside this file
// as byte-identical, non-discoverable .mjs modules. Never alter their assertions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const currentSite=path.resolve(here,'..');
const sourceReceipt='F:/VisibleMedicine/staging/20261027-forehead-nerve-us-website/SOURCE_CANDIDATE.json';
const provenSite='F:/VisibleMedicine/staging/20261027-forehead-nerve-us-website/website';
const adjacent7eReceipt='F:/VisibleMedicine/staging/20261026-adjacent-composition-context-v2/SOURCE_CANDIDATE.json';
const adjacent7eSite='F:/VisibleMedicine/staging/20261026-adjacent-composition-context-v2/website';
const role727='F:/VisibleMedicine/staging/20261025-cervical-role-website/website';
const role727Receipt='F:/VisibleMedicine/staging/20261025-cervical-role-website/SOURCE_CANDIDATE.json';
const role727Native='F:/VisibleMedicine/staging/20261024-combined-atlas/atlas';
const historical={
 VM_ADJACENT_B79_WEBSITE:'F:/VisibleMedicine/staging/20261024-cervical-vascular-website/website',
 VM_ADJACENT_B79_ATLAS:'F:/VisibleMedicine/staging/20261024-cervical-vascular-draft/atlas',
 VM_ADJACENT_B79_RECEIPT:'F:/VisibleMedicine/staging/20261024-cervical-vascular-website/SOURCE_BOUND.json',
 VM_ADJACENT_TRANSITION:'F:/VisibleMedicine/staging/20261024-adjacent-regression-current/MAIN_TRANSITION.v2.json',
 VM_ADJACENT_190A_EXPORT:'F:/VisibleMedicine/staging/20261021-four-module-admission-v2/export/public/atlas-runtime/shoulder',
 VM_ADJACENT_190A_CHECKPOINT:'F:/VisibleMedicine/recovery/checkpoints/20261021-four-modules-verified/checkpoint.json',
 VM_ADJACENT_CLINICAL_WEBSITE:'F:/VisibleMedicine/staging/20261024-lower-limb-regression-current/website',
 VM_ADJACENT_CLINICAL_PROOF:'F:/VisibleMedicine/staging/20261024-lower-limb-regression-current/PROOF_BOUND.json',
 VM_ARTERIAL_HISTORICAL_WEBSITE:'F:/VisibleMedicine/staging/20261024-head-active-identity-website/website',
 VM_ARTERIAL_HISTORICAL_ATLAS:'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/atlas',
 VM_ARTERIAL_LOCAL_CLOSURE:'F:/VisibleMedicine/staging/20261025-arterial-delivery-roles-proposal/LOCAL_ONLY/finite-closure.json',
 VM_CERVICAL_HISTORICAL_WEBSITE:'F:/VisibleMedicine/staging/20261022-neck-xray-website-candidate/website',
 VM_CERVICAL_HISTORICAL_ATLAS:'F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/atlas',
 VM_CERVICAL_LOCAL_CLOSURE:'F:/VisibleMedicine/staging/20261025-cervical-delivery-roles-source/tests/fixtures/cervical-delivery-roles/local-closure.json',
 VM_CERVICAL_LOCAL_EVIDENCE_ROOT:'F:/VisibleMedicine/staging/20261025-cervical-role-website/cervical-child-evidence',
 VM_NOTICE_WAVE4_WEBSITE:'F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website',
 VM_NOTICE_WAVE4_ATLAS:'F:/VisibleMedicine/staging/20261021-body-learning-source-candidate/atlas',
 VM_NOTICE_ADMISSION_WEBSITE:'F:/VisibleMedicine/staging/20261020-combined-website-ui/website',
 VM_NOTICE_GUARD_WEBSITE:'F:/VisibleMedicine/staging/20261025-wave4-digest-guard-website/website',
 VM_NOTICE_LOCAL_EVIDENCE:'F:/VisibleMedicine/staging/20261025-viewer-notice-roles-source/LOCAL_ONLY/inputs.json',
};
const hashes={
 [sourceReceipt]:'127bb7af2517bc5a71c8291cbd37f6c5d20956f973d89de9d007fbfbe1775ec6',
 [adjacent7eReceipt]:'b94cfe0f5ba7183b4a2316d34cc08d3ab8847ecd8f68e97185184476d186727f',
 [role727Receipt]:'77d9a0e3ddbae2b32376e8c6205451d1deb8d2109378697d64e9ed59b6999270',
 [historical.VM_ADJACENT_B79_RECEIPT]:'d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2',
 [historical.VM_ADJACENT_TRANSITION]:'2092d001e2d94ad2f630bcdcb54ac37a3d9ba05b2980e3acd4438c66cb102f7f',
 [historical.VM_ADJACENT_CLINICAL_PROOF]:'11adb4df96f62ad19a9afcf7941b0e939ec32d7b317fe640342603aa12d3d251',
 [historical.VM_ADJACENT_190A_CHECKPOINT]:'254fc6b66c9cafa4358914654d7880736f02a5578fa47627a7fd43f5c9ebc85e',
 [historical.VM_ARTERIAL_LOCAL_CLOSURE]:'bb7f63aee42681cd7caa0bf66e9b7aae2ada2524600bf06500ac83dd4be87e5b',
 [historical.VM_CERVICAL_LOCAL_CLOSURE]:'bfd30819dadb076f5450f473f985ab6e61b19807aeedea5fcba22e662760c5ba',
 [historical.VM_NOTICE_LOCAL_EVIDENCE]:'b3f27a2c38e38c99f9dac73e4ec6ce7e3f61b9d6d069182bb8e416783b46bd77',
};
const lanes={
 'adjacent-clinical-source-roles':{site:'current',cases:4,sha:'7836321166a9a461fe57199bd76bc9f62a13df834b6d748f45dbb8e07df083da'},
 'adjacent-current-tour-source-roles':{site:'context7e',cases:4,sha:'19a9686ecb9cea52f8ae5eabc0312473e518a41a3339e9acdbe3f68ad4e640d6',fixtureSha:'66cb2d654960cb270564da64478a21672ff84fddba89b6b56f6a56d2450eb99c'},
 'adjacent-shoulder-source-roles':{site:'role727',cases:5,sha:'00a8f433689d35e859d1b9c52856f96b100fb0e136b5ae693ffb3a9e8ccbff4e'},
 'arterial-epoch-preservation':{site:'current',cases:1,sha:'52e471a4cc43e14c4180f85a3542d21675bcbcde93356c5e8e6925e78282dcc9'},
 'atlas-arterial-current-delivery':{site:'role727',cases:6,sha:'cd5b7082922746ae5af6e781c4538db225c30a0776eb41646a39c5a8e61a5df6'},
 'atlas-arterial-evidence-limits':{site:'current',cases:1,sha:'6efaa114e376ee2394d8ba773883dc36754e142eda97f16c6e3ae8ec9a3ff237'},
 'atlas-cervical-current-delivery':{site:'role727',cases:1,sha:'bc039e7935afb1b9350be102e660dd1a97a72b55eaf0beacccb1162ad7eb134e'},
 'atlas-cervical-projection-xray':{site:'current',cases:1,sha:'a3ce4a7961bb975e7261ec32863c091f137baa52398504957cd2d56bb1d522b5'},
 'atlas-current-history-wave4-contract':{site:'current',cases:1,sha:'391f59271aecb4671d07e0063cf3b6696d9414a3fee831d1c5ac7ac7494c0c02'},
};
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function exact(file,digest){assert.equal(sha(file),digest,'Historical input changed: '+file);}
function git(root,...args){return execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();}
function native(root,head,tree){assert.equal(git(root,'rev-parse','HEAD'),head);assert.equal(git(root,'rev-parse','HEAD^{tree}'),tree);assert.equal(git(root,'status','--porcelain=v1'),'','Historical native checkout changed');}
function receipt(file,website,head,tree){
 const r=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(path.resolve(r.website),path.resolve(website));assert.equal(r.atlasHead,head);
 const seen=new Set();for(const row of r.sourceRows){const name=row.path;
  assert(!seen.has(name));seen.add(name);
  // Catch-all route names contain "..."; only a complete parent segment escapes.
  assert(!path.isAbsolute(name)&&!name.includes(':')&&!name.split(/[\\/]/).includes('..'));
  const bytes=fs.readFileSync(path.join(website,name));assert.equal(bytes.length,row.bytes,name);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,name);
 }
 assert.equal(r.dependencies.length,8,'Exact dependency receipt cardinality');
 for(const dep of r.dependencies){exact(dep.file,dep.sha256);exact(dep.entry,dep.entrySha256);}
 native(r.atlas,head,tree);
}
function counts(tap,expected){
 const result={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
  const found=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];assert.equal(found.length,1,'One terminal '+key);result[key]=Number(found[0][1]);
 }
 assert.deepEqual(result,{tests:expected,pass:expected,fail:0,cancelled:0,skipped:0,todo:0},'Full original case count');
 const plans=[...tap.matchAll(/^1\.\.(\d+)\r?$/gm)],points=[...tap.matchAll(/^(?:not )?ok (\d+)(?:\s|$)/gm)];
 assert.equal(plans.length,1);assert.equal(Number(plans[0][1]),expected);
 assert.deepEqual(points.map(m=>Number(m[1])),Array.from({length:expected},(_,i)=>i+1));
 assert(!/^not ok \d+/m.test(tap));return result;
}
export function runNineHistory(name){
 assert(Object.hasOwn(lanes,name),'Undeclared nine-history root');const lane=lanes[name];
 assert.equal(path.resolve(process.cwd()),currentSite,'Stock discovery must run from this website');
 const relevant=[sourceReceipt];
 if(lane.site==='role727'){
  relevant.push(role727Receipt);
  exact(role727Receipt,hashes[role727Receipt]);
  receipt(role727Receipt,role727,'727ed5b451ae940a01e56272c8fbc703ea3b0095','6940282a3ae0462961b9b99a690c70f282ab8ce7');
  if(name==='adjacent-shoulder-source-roles'){
   relevant.push(historical.VM_ADJACENT_B79_RECEIPT,historical.VM_ADJACENT_TRANSITION,
    historical.VM_ADJACENT_190A_CHECKPOINT,historical.VM_ADJACENT_CLINICAL_PROOF);
   native(historical.VM_ADJACENT_B79_ATLAS,'b79e110d2d28f18993263926ba35aa7a3f478b20','0dd97cc55ef9aff3493b91752309d1d661c0b0c8');
  }
 }else if(name.startsWith('adjacent-')){
  if(lane.site==='context7e')relevant.push(adjacent7eReceipt);
  relevant.push(historical.VM_ADJACENT_B79_RECEIPT,historical.VM_ADJACENT_TRANSITION,
   historical.VM_ADJACENT_190A_CHECKPOINT,historical.VM_ADJACENT_CLINICAL_PROOF);
  native(historical.VM_ADJACENT_B79_ATLAS,'b79e110d2d28f18993263926ba35aa7a3f478b20','0dd97cc55ef9aff3493b91752309d1d661c0b0c8');
 }else if(name.startsWith('arterial-')||name==='atlas-arterial-evidence-limits'){
  relevant.push(historical.VM_ARTERIAL_LOCAL_CLOSURE);
  native(historical.VM_ARTERIAL_HISTORICAL_ATLAS,'6e810b188dde401f6c19a970928f316a479696df','90afe5163dbd9386aa37c93d525fa4c70e8c1b9e');
  if(name==='arterial-epoch-preservation')native(historical.VM_NOTICE_WAVE4_ATLAS,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1','e9165d7122361f809a267af1414b337b69097fe2');
 }else if(name==='atlas-cervical-projection-xray'){
  relevant.push(historical.VM_CERVICAL_LOCAL_CLOSURE);
  native(historical.VM_CERVICAL_HISTORICAL_ATLAS,'389bd0ca846a42c7f21055f55904bcf5df81a09f','25acdee40ee57e0253cdcca924aa64b4b38586c8');
 }else if(name==='atlas-current-history-wave4-contract'){
  relevant.push(historical.VM_NOTICE_LOCAL_EVIDENCE);
  native(historical.VM_NOTICE_WAVE4_ATLAS,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1','e9165d7122361f809a267af1414b337b69097fe2');
 }
 for(const file of relevant)exact(file,hashes[file]);
 if(lane.site==='context7e')receipt(adjacent7eReceipt,adjacent7eSite,
  '7e2552a300df29faf346be146929ffc727880ec5','c756d5a038cca7d8fac429b908925c63915dc519');
 else if(lane.site==='current')receipt(sourceReceipt,provenSite,
  'a28d03acf07da97a927073d4794abf3b5ce907f7','180330c12bb9b5abf1b7171adca83eeadaad476d');
 const original=path.join(here,'nine-history-original-'+name+'.mjs');exact(original,lane.fixtureSha??lane.sha);
 const child=path.join(lane.site==='role727'?role727:lane.site==='context7e'?adjacent7eSite:provenSite,'tests',name+'.test.mjs');
 exact(child,lane.sha);
 const root=lane.site==='role727'?role727:lane.site==='context7e'?adjacent7eSite:provenSite;
 const atlas=lane.site==='role727'?role727Native:JSON.parse(fs.readFileSync(lane.site==='context7e'?adjacent7eReceipt:sourceReceipt,'utf8')).atlas;
 const env={...process.env,...historical,VM_ATLAS_SOURCE_REPO:atlas,
  ATLAS_SOURCE_REPO:atlas,
  VM_WEBSITE_ROOT:root,GIT_NO_REPLACE_OBJECTS:'1'};
 delete env.VM_CURRENT_SOURCE_RECEIPT;delete env.VM_CURRENT_SOURCE_SHA256;
 // A child Node test must emit its own TAP, not the parent's V8 test protocol.
 delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',child],{cwd:root,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64e6});
 assert.equal(run.error,undefined,String(run.error));assert.equal(run.signal,null);assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 counts(run.stdout,lane.cases);
 // Check the immutable identities once more after the child, preventing a crossed run.
 exact(original,lane.fixtureSha??lane.sha);exact(child,lane.sha);for(const file of relevant)exact(file,hashes[file]);
 if(lane.site==='role727')receipt(role727Receipt,role727,
  '727ed5b451ae940a01e56272c8fbc703ea3b0095','6940282a3ae0462961b9b99a690c70f282ab8ce7');
 else if(lane.site==='context7e')receipt(adjacent7eReceipt,adjacent7eSite,
  '7e2552a300df29faf346be146929ffc727880ec5','c756d5a038cca7d8fac429b908925c63915dc519');
 else receipt(sourceReceipt,provenSite,
  'a28d03acf07da97a927073d4794abf3b5ce907f7','180330c12bb9b5abf1b7171adca83eeadaad476d');
 return {root:name,originalCases:lane.cases,site:lane.site};
}
