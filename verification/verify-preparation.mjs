import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const own='G:/VisibleMedicine-temp/proposals/20261101-renal-website',root='G:/VisibleMedicine-temp/staging/20261101-renal-website',site=root+'/website';
const prep=json(root+'/PREPARATION.json'),parent=json(prep.parent.path);
const git=(...args)=>execFileSync('git',['-C',prep.native,...args],{encoding:'utf8',windowsHide:true}).trim();
assert.equal(hash(prep.parent.path),prep.parent.sha256);assert.equal(git('rev-parse','HEAD'),prep.nativeHead);assert.equal(git('rev-parse','HEAD^{tree}'),prep.nativeTree);assert.equal(git('status','--porcelain'),'');
assert.equal(json(site+'/atlas-review/manifest.json').revision,prep.parent.atlasHead,'Import was not admitted; do not claim it is current');
assert(!fs.existsSync(root+'/checks/source'));assert(!fs.existsSync(root+'/SOURCE_CHECKS.json'));
const deltas=[],rows=[];
for(const row of parent.sourceRows){
 assert.equal(hash(parent.website+'/'+row.path),row.sha256,'Frozen parent changed: '+row.path);
 const sha256=hash(site+'/'+row.path);if(sha256!==row.sha256)deltas.push(row.path);
 rows.push({path:row.path,bytes:fs.statSync(site+'/'+row.path).size,sha256});
}
assert.deepEqual(deltas,['scripts/import-clinical-review.mjs']);
const original=fs.readFileSync(parent.website+'/scripts/import-clinical-review.mjs','utf8');
assert.equal(fs.readFileSync(site+'/scripts/import-clinical-review.mjs','utf8'),original.replace("const revision = '"+prep.parent.atlasHead+"';","const revision = '"+prep.nativeHead+"';"));
const test='tests/renal-coverage-binding.test.mjs';assert.equal(hash(site+'/'+test),hash(own+'/renal-coverage-binding.test.mjs'));
rows.push({path:test,bytes:fs.statSync(site+'/'+test).size,sha256:hash(site+'/'+test)});rows.sort((a,b)=>a.path.localeCompare(b.path));
const expected=new Set(rows.map(row=>row.path)),actual=[];
function walk(dir,rel=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=rel?rel+'/'+entry.name:entry.name;if(p==='node_modules')continue;assert(!entry.isSymbolicLink(),'Unexpected source symlink: '+p);if(entry.isDirectory())walk(path.join(dir,entry.name),p);else{assert(entry.isFile());actual.push(p);}}}
walk(site);assert.equal(new Set(actual).size,actual.length);assert.deepEqual(actual.sort(),[...expected].sort());
assert.equal(fs.realpathSync(site+'/node_modules'),fs.realpathSync(parent.website+'/node_modules'));
const waiting=json(own+'/BUDGET_WAIT.json');assert.equal(waiting.ready,false);assert.equal(waiting.minimum,3200);assert.equal(waiting.aggregate,1024);
const restore=json(own+'/RESTORE_VERIFIED.json');assert.equal(restore.httpStatus,200);assert.equal(restore.sourceCommit,'df175264724a98ca4f70de19e1bfabd325084fdb');
const evidence={schema:'vm.prepared-website-not-imported/1',at:new Date().toISOString(),website:site,targetNative:prep.nativeHead,targetTree:prep.nativeTree,
 currentImportedNative:prep.parent.atlasHead,parent:prep.parent,sourceRows:rows,changedPaths:deltas,newPaths:[test],
 privateHeldPacketsRemainLocal:true,sourceCopyVerified:true,guardedChecksAdmitted:false,imported:false,coverageGenerated:false,reviewBindingRegenerated:false,fullBuild:false,installed:false,clinicalApproval:false,patientRegistration:false,
 next:'Run the prepared source checks only under their unchanged resource guard; do not select this preparation as an imported or built website candidate.'};
fs.writeFileSync(root+'/PREPARED_WEBSITE.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourcePaths:rows.length,unchangedParentPaths:rows.length-2,changedPaths:deltas,newPaths:[test],imported:false,installed:false}));
