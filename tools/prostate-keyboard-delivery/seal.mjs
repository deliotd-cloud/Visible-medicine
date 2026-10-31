import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';

const stage='G:/VisibleMedicine-temp/staging/20261031-prostate-keyboard-delivery';
const site=stage+'/website',atlas=stage+'/atlas',installed='F:/VisibleMedicine/website';
const parentPath='G:/VisibleMedicine-temp/staging/20261031-release26/SOURCE7.json';
const parentSha='5df9e87ab64d9dd9c94ed39430b5f1225555c261874dd3587a0ab5a85c418232';
const oldAtlas='df175264724a98ca4f70de19e1bfabd325084fdb';
const newAtlas='4bb8f236a4cd57448342cbe4aa7b1641aff9743a';
const newTree='eb6c154e2edaeb9e35825348748ef5971ff0d350';
const websiteHead='b953ff3f5f1891599cb6e91cb91311d9d6006270';
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',windowsHide:true,maxBuffer:32e6}).trim();
const safe=p=>{assert(typeof p==='string'&&p.length>0&&!path.posix.isAbsolute(p)&&!p.includes('\\')&&!p.split('/').some(x=>!x||x==='.'||x==='..'),'Unsafe source path '+p);return p;};
const forbidden=p=>p.startsWith('private/')||p.startsWith('.wrangler/')||p.startsWith('db/')||p.startsWith('app/api/auth/')||p.startsWith('lib/auth/')||p.startsWith('.env');
const preserved=p=>p==='AGENTS.md'||p.startsWith('.codex/')||p==='docs/master-plan.md'||p.startsWith('docs/completion-checklist')||p.startsWith('.next/')||p.startsWith('.openai/')||p.startsWith('.local/');
const generated=p=>p.startsWith('public/atlas-runtime/head-neck/')||p.startsWith('public/atlas-review-viewer/')||p.startsWith('atlas-review/');
const protectedAsset=p=>/\.(?:glb|gltf|bin|obj|mtl|png|jpe?g|webp|ktx2|woff2?|ttf|otf|txt|license)$/i.test(p);
const nativeResult=n=>{const p=stage+'/checks/'+n+'-RESULT.json',r=json(p);assert.equal(r.passing,true,n);assert.equal(r.supervisor?.code,0,n);assert.equal(r.process?.terminalObserved,true,n);assert.equal(r.process?.interrupted,false,n);assert.equal(r.process?.exitCode,0,n);return {path:p,sha256:hash(p)};};
const checks=Object.fromEntries(['native','review','validation2','website'].map(n=>[n,nativeResult(n)]));
const originalValidationPath=stage+'/checks/validation-RESULT.json',originalValidation=json(originalValidationPath);
assert.equal(originalValidation.passing,false,'Original failed validation must remain visible');
checks.validationOriginalFailed={path:originalValidationPath,sha256:hash(originalValidationPath),passing:false};
assert.equal(hash(parentPath),parentSha);const parent=json(parentPath);
assert.equal(parent.website,'G:/VisibleMedicine-temp/staging/20261031-release26/website');
assert.equal(parent.atlasHead,oldAtlas);assert.equal(parent.websiteHead,websiteHead);
assert.equal(git(atlas,'rev-parse','HEAD'),newAtlas);assert.equal(git(atlas,'rev-parse','HEAD^{tree}'),newTree);
assert.equal(git(atlas,'status','--porcelain','--untracked-files=all'),'');
assert.equal(git(installed,'rev-parse','HEAD'),websiteHead);
const review=json(site+'/atlas-review/manifest.json'),binding=json(site+'/atlas-review/integration-inputs.json');
assert.equal(review.revision,newAtlas);assert.equal(binding.sourceCommit,newAtlas);
assert.equal(review.files.length,1655);assert(binding.inputs.length>=parent.inputs,'New binding lost prior inputs');
for(const r of binding.inputs){safe(r.path);assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
const viewer=json(site+'/public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,newAtlas);
const head=json(site+'/public/atlas-runtime/head-neck/manifest.json');assert.equal(head.sourceCommit,newAtlas);
assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
for(const p of ['tests/prostate-zonal-delivery.test.mjs','tests/current-atlas-delivery.mjs','tests/current-atlas-delivery.test.mjs','tests/fixtures/current-atlas-delivery-df175264.json','tests/fixtures/current-atlas-delivery-df175264.txt'])assert(fs.existsSync(site+'/'+p),'Missing required test or historical fixture '+p);
const rowsByPath=new Map();
for(const r of parent.sourceRows){safe(r.path);if(!generated(r.path))rowsByPath.set(r.path,null);}
for(const r of review.files){safe(r.path);rowsByPath.set('atlas-review/'+r.path,null);}
for(const [prefix,manifest] of [['public/atlas-runtime/head-neck',head],['public/atlas-review-viewer',viewer]]){
 rowsByPath.set(prefix+'/manifest.json',null);
 for(const r of manifest.files){safe(r.path);rowsByPath.set(prefix+'/'+r.path,null);}
}
for(const p of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','tests/prostate-zonal-delivery.test.mjs','tests/fixtures/current-atlas-delivery-df175264.json','tests/fixtures/current-atlas-delivery-df175264.txt'])rowsByPath.set(p,null);
const rows=[...rowsByPath.keys()].sort().map(p=>{const target=site+'/'+p;assert(fs.lstatSync(target).isFile()&&!fs.lstatSync(target).isSymbolicLink(),p);return {path:p,sha256:hash(target),bytes:fs.statSync(target).size};});
const byPath=new Map(rows.map(r=>[r.path,r]));
for(const r of parent.sourceRows){
 if(r.path==='public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'){
  assert.equal(hash(parent.website+'/'+r.path),r.sha256);
  const prior=fs.readFileSync(parent.website+'/'+r.path,'utf8');assert.equal(prior.split('Atlas source: '+oldAtlas).length,2);
  assert.equal(fs.readFileSync(site+'/'+r.path,'utf8'),prior.replace('Atlas source: '+oldAtlas,'Atlas source: '+newAtlas),'Only the exact generated source header may change; all licence text remains intact');
 }else if(protectedAsset(r.path)||r.path.startsWith('LICENSES/'))assert.equal(byPath.get(r.path)?.sha256,r.sha256,'Protected model or licence bytes changed: '+r.path);
}
assert.deepEqual(json(site+'/lib/atlas-model-inventory.json').models,json(parent.website+'/lib/atlas-model-inventory.json').models,'Model inventory .models changed');
for(const r of parent.sourceRows){if(r.path.startsWith('public/atlas-runtime/')&&!r.path.startsWith('public/atlas-runtime/head-neck/'))assert.equal(byPath.get(r.path)?.sha256,r.sha256,'Non-head runtime changed: '+r.path);}
const source={...parent,schema:'vm-prostate-keyboard-website-source/1',at:new Date().toISOString(),parent:{path:parentPath,sha256:parentSha},website:site,websiteHead,atlas,atlasHead:newAtlas,atlasTree:newTree,sourceRows:rows,review:binding.sha256,inputs:binding.inputs.length,viewerFiles:viewer.files.length,importedSourceFiles:review.files.length,checks,installed:false,allProductBuildsPassing:true,wholeSuitePassing:false,clinicalApproval:false,patientRegistration:false};
const sourcePath=stage+'/SOURCE.json';fs.writeFileSync(sourcePath,JSON.stringify(source,null,2)+'\n',{flag:'wx'});
const old=new Map(parent.sourceRows.map(r=>[r.path,r.sha256]));const operations=[],conflicts=[],preservedRows=[];
const current=p=>fs.existsSync(installed+'/'+p)?hash(installed+'/'+p):null;
for(const r of rows){const now=current(r.path);if(now===r.sha256)continue;if(preserved(r.path)){preservedRows.push({path:r.path,sha256:now});continue;}
 assert(!forbidden(r.path),'DB, auth or private write refused: '+r.path);
 if(now!==(old.get(r.path)??null)){conflicts.push({path:r.path,expected:old.get(r.path)??null,actual:now,proposed:r.sha256});continue;}
 operations.push({path:r.path,before:now,after:r.sha256,bytes:r.bytes});
}
for(const r of parent.sourceRows){if(!generated(r.path)||byPath.has(r.path))continue;assert(!protectedAsset(r.path),'Cannot delete model or licence bytes: '+r.path);
 const now=current(r.path);if(now===null)continue;if(now!==r.sha256){conflicts.push({path:r.path,expected:r.sha256,actual:now,proposed:null});continue;}
 operations.push({path:r.path,before:now,after:null,bytes:0});
}
const plan={schema:'vm-prostate-keyboard-install-plan/1',at:new Date().toISOString(),source:{path:sourcePath,sha256:hash(sourcePath)},parent:{path:parentPath,sha256:parentSha},operations,preserved:preservedRows,conflicts,sourceFiles:rows.length,beforeBytes:operations.reduce((n,r)=>n+(r.before?fs.statSync(installed+'/'+r.path).size:0),0),afterBytes:operations.reduce((n,r)=>n+r.bytes,0),websiteHead,atlasBefore:oldAtlas,atlasAfter:newAtlas,ownerTabsReloaded:false,publicDeployment:false,privateDataUploaded:false};
fs.writeFileSync(stage+'/INSTALL_PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:{path:sourcePath,sha256:hash(sourcePath)},rows:rows.length,operations:operations.length,preserved:preservedRows.length,conflicts:conflicts.map(x=>x.path),review:binding.sha256}));
if(conflicts.length)process.exitCode=1;
