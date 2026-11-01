import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {safeChild,nativeHead,reviewCount,bindingCount} from './plan.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {verifyNativeReuse} from './reuse-native.mjs';
const root=process.env.VM_CATALOG_DELIVERY_ATTEMPT;assert(root&&/^G:\/VisibleMedicine-temp\/staging\/20261101-focus-delivery\/attempt-[1-9]\d*$/.test(root));
const p=json(root+'/PREPARATION.json'),site=root+'/website';assert.equal(p.website,site);assert.equal(p.nativeHead,nativeHead);
const run=(cwd,name,args)=>{const out=execFileSync(process.execPath,args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:4e6});fs.writeFileSync(root+'/logs/'+name+'.log',out,{flag:'wx'});};
const out=safeChild(root,'export/public/atlas-runtime/head-neck');
const reused=process.env.VM_CATALOG_NATIVE_REUSE?verifyNativeReuse(process.env.VM_CATALOG_NATIVE_REUSE,p.native):null;
if(reused){
 assert(!fs.existsSync(out));
 const sourceManifest=json(reused.exportPath+'/manifest.json');fs.mkdirSync(out,{recursive:true});
 for(const row of [...sourceManifest.files,{path:'manifest.json',sha256:reused.manifestSha256}]){
  const from=safeChild(reused.exportPath,row.path),to=safeChild(out,row.path);
  assert.equal(hash(from),row.sha256,'Prior runtime drift');fs.mkdirSync(path.dirname(to),{recursive:true});
  fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256,'Copied runtime drift');
 }
 fs.writeFileSync(root+'/RUNTIME_REUSE.json',JSON.stringify({source:nativeHead,receipt:reused.receiptPath,receiptSha256:reused.receiptSha256,manifestSha256:reused.manifestSha256,files:reused.files,sourceInputs:reused.sourceInputs,reused:true,nativeBuildExecutedInAttempt:false},null,2)+'\n',{flag:'wx'});
}else run(p.native,'regional-export',['scripts/export-head-neck-module.mjs',out]);
const manifest=json(out+'/manifest.json');assert.equal(manifest.sourceCommit,nativeHead);
const target=safeChild(root,'website/public/atlas-runtime/head-neck'),old=safeChild(root,'prior-runtime');assert(!fs.existsSync(old));
assert(fs.realpathSync(target).startsWith(fs.realpathSync(root)+path.sep),'Runtime move must remain inside the attempt');
fs.renameSync(target,old);
for(const row of [...manifest.files,{path:'manifest.json',sha256:hash(out+'/manifest.json')}]){const from=safeChild(out,row.path),to=safeChild(target,row.path);assert.equal(hash(from),row.sha256);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256);}
const inventory=json(site+'/lib/atlas-model-inventory.json');run(site,'inventory',['scripts/atlas-model-inventory.mjs']);assert.deepEqual(json(site+'/lib/atlas-model-inventory.json').models,inventory.models,'No model bytes or scope may change');
const policy=site+'/lib/atlas-delivery-policy.ts',text=fs.readFileSync(policy,'utf8'),matches=[...text.matchAll(/manifestRevision: '([a-f0-9]{64})'/g)];assert.equal(matches.length,1);assert(text.includes("audience: 'administrator-review'"));fs.writeFileSync(policy,text.replace(matches[0][1],hash(site+'/lib/atlas-model-inventory.json')));
run(site,'lecture-catalog',['scripts/lecture-body-catalog.mjs']);
// The source-coverage snapshot is already at b688; verify the sealed revision.
run(site,'coverage',['scripts/check-anatomy-coverage.mjs','--source-root',p.native]);
run(site,'catalog-types',['scripts/atlas-catalog-types.mjs']);
run(site,'bind',['scripts/bind-clinical-review.mjs']);
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.inputs.length,bindingCount);assert.equal(json(site+'/atlas-review/manifest.json').files.length,reviewCount);
fs.writeFileSync(root+'/ASSEMBLED.json',JSON.stringify({source:nativeHead,review:binding.sha256,modelsUnchanged:true,nativeRuntimeReused:!!reused,nativeBuildExecutedInAttempt:!reused,clinicalApproval:false,installed:false},null,2)+'\n',{flag:'wx'});
