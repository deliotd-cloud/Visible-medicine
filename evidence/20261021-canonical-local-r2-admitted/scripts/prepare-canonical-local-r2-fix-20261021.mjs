// Admit only developer tooling. No preview stop, staging execution or data copy.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const source='F:/VisibleMedicine/staging/20261021-source190-website/website',site='F:/VisibleMedicine/website';
const stage='F:/VisibleMedicine/staging/20261021-canonical-local-r2-fix';assert(!fs.existsSync(stage));
const allowed=['scripts/stage-clinical-review-candidate-local.mjs','scripts/local-r2-persistence.mjs','tests/local-r2-persistence.test.mjs','tests/local-preview-data-boundaries.test.mjs'];
const virtual=json('F:/VisibleMedicine/staging/20261021-source190-virtual-cutover-plan/PLAN.json');
const known=json('F:/VisibleMedicine/staging/20261021-source190-cutover-inventory/PREIMAGE_CLASSIFICATION_V2.json');
assert.equal(virtual.source,source);assert.equal(virtual.target,site);
assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(json(site+'/atlas-review/integration-inputs.json').sha256,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
assert.equal(json(source+'/node_modules/miniflare/package.json').version,'5.20260820.0-alpha');
assert.equal(json(site+'/node_modules/miniflare/package.json').version,'5.20260820.0-alpha');
const ignoreRow=json('F:/VisibleMedicine/staging/20261021-source190-cutover-inventory/NAMED_PATHS.json').find(row=>row.path==='.gitignore');
assert.equal(ignoreRow.disposition,'preserve-local-configuration');assert.equal(ignoreRow.eolOnly,true);
assert.equal(sha(read(source+'/.gitignore')),ignoreRow.proposedSha256);assert.equal(sha(read(site+'/.gitignore')),ignoreRow.beforeSha256);
assert.equal(read(source+'/.gitignore').toString().replaceAll('\r\n','\n'),read(site+'/.gitignore').toString().replaceAll('\r\n','\n'),'Ignore boundaries match exactly apart from recorded EOL; preserve canonical bytes');
for(const row of json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json'))assert.equal(sha(read(source+'/'+row.path)),row.sha256,row.path);
const changes=allowed.map(p=>{
 const row=virtual.changes.find(row=>row.path===p);assert(row,p);const next=read(source+'/'+p);assert.equal(sha(next),row.sha256);assert(!next.toString().includes('\r\n'));
 const target=path.resolve(site,p);assert(target.startsWith(path.resolve(site)+path.sep));
 if(row.beforeSha256){assert.equal(sha(read(target)),row.beforeSha256,p);const ownership=known.classifications.find(row=>row.path===p);assert(ownership&&ownership.provenance!=='unresolved-overlap');assert.equal(ownership.beforeSha256,row.beforeSha256);}
 else assert(!fs.existsSync(target),p);
 return{path:p,beforeSha256:row.beforeSha256,sha256:row.sha256,bytes:next.length};
});
const guardPaths=['.gitignore','.env.local','.dev.vars','.openai/hosting.json','package.json','package-lock.json','app/layout.tsx','lib/clinical-review-server.ts','lib/head-atlas-local.ts','atlas-review/integration-inputs.json','lib/atlas-model-inventory.json'];
const guards=guardPaths.filter(p=>fs.existsSync(site+'/'+p)).map(p=>({path:p,sha256:sha(read(site+'/'+p))}));
fs.mkdirSync(stage);fs.mkdirSync(stage+'/preimage');
for(const row of changes)if(row.beforeSha256)fs.copyFileSync(site+'/'+row.path,stage+'/preimage/'+path.basename(row.path),fs.constants.COPYFILE_EXCL);
// These environment/private-source digests stay local and are excluded from
// source-only backup selection; never copy the source file contents here.
fs.writeFileSync(stage+'/PRIVATE_SOURCE_GUARDS.json',JSON.stringify(guards,null,2)+'\n',{flag:'wx'});
const prep={at:new Date().toISOString(),stage,site,source,atlas:'F:/VisibleMedicine/atlas',changes,previewRestartRequired:false,nativeStagingExecuted:false,sourceCandidateChanged:false,reviewRuntimeChanged:false,clinicalApproval:false,publicDeployment:false,privateDataCopied:false,reason:'Install the already verified Miniflare5 resourcePersistencePath fix in native local developer tooling without waiting for or changing the frozen full-suite candidate. Four JavaScript paths only, one existing and three additions. Canonical UI/model/Review/auth and private state remain untouched.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
const patch=['*** Begin Patch'];
for(const row of changes){const target=site+'/'+row.path,next=read(source+'/'+row.path).toString().replace(/\n$/,'').split('\n');if(row.beforeSha256)patch.push('*** Update File: '+target,'@@',...read(target).toString().replace(/\n$/,'').split('\n').map(l=>'-'+l),...next.map(l=>'+'+l));else patch.push('*** Add File: '+target,...next.map(l=>'+'+l));}
patch.push('*** End Patch');console.log(patch.join('\n'));
