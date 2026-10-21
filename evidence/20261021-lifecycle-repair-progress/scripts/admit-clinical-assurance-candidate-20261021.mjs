// Main-owned hash-guarded test candidate admission. Never touches the owner preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-clinical-assurance-application';
const candidate='F:/VisibleMedicine/staging/20261021-clinical-assurance-ready';
const manifest=json(candidate+'/MANIFEST.json');
assert.equal(sha(read(candidate+'/MANIFEST.json')),'f779ffe231ca860640c6452b236ad6f15338b5e28a77d6a6eddf271a2b67a12d');
const site=manifest.site;assert.equal(site,'F:/VisibleMedicine/staging/20261020-combined-website-ui/website');
assert.equal(manifest.files.length,49);assert.equal(manifest.actualModules.length,20);
assert(!fs.existsSync(stage));
const out=site+'/.local/website-test-runs/2026-10-20T23-20-11-575Z-314c80d2-a04f-4372-af8e-e9f086c9cc86';
const full=json(out+'/receipt.json'),queuePath='F:/VisibleMedicine/staging/20261021-after-suite-dental/state.json',queue=json(queuePath);
assert.equal(full.schema,'vm-complete-test-receipt-1');assert.equal(full.entryCount,1050);
assert.equal(full.testInputDrift,false);assert.equal(full.publicPreviewAssetDrift,false);
assert.equal(full.child.signal,null);assert.equal(full.child.exitCode,1);assert.equal(full.counts.fail,144);assert.equal(full.counts.cancelled,0);
assert.equal(queue.phase,'complete-needs-coordinator-review');assert.equal(queue.actualFullDentalGatePass,true);
assert.equal(queue.steps.length,3);for(const step of queue.steps){assert.equal(step.code,0);assert.equal(step.signal,null);assert.equal(sha(read(step.receipt)),step.receiptSha256);const r=json(step.receipt);assert.equal(sha(read(r.log)),r.logSha256);}
assert.equal(queue.actualFullTheorem.changedTopics,28);assert.equal(queue.actualFullTheorem.preservedTopics,9908);
assert.equal(queue.actualFullTheorem.changedPackets,28);assert.equal(queue.actualFullTheorem.preservedPackets,1076);assert.equal(queue.actualFullTheorem.storageCalls,0);
assert.equal(queue.currentSourcePaths.length,21);for(const row of queue.currentSourcePaths)assert.equal(sha(read(queue.target+'/'+row.path)),row.sha256);
const processJson=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
 "@(Get-CimInstance Win32_Process -Filter 'ProcessId=262080 OR ProcessId=255564 OR ProcessId=238208' | Select-Object ProcessId,ParentProcessId,CommandLine) | ConvertTo-Json -Depth 3 -Compress"],{encoding:'utf8',windowsHide:true});
assert(!processJson.trim()||JSON.parse(processJson)===null||Array.isArray(JSON.parse(processJson))&&JSON.parse(processJson).length===0,'Previous heavy jobs must actually be gone');
const prep=json('F:/VisibleMedicine/staging/20261021-complete-website-assurance/PREPARATION.json');
const originals=json(prep.sourceInputs);assert.equal(originals.length,5053);
for(const row of originals)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path+' original full-run frozen input');
for(const row of manifest.files){
 assert(row.path==='.gitattributes'||row.path.startsWith('tests/'));
 assert(!path.isAbsolute(row.path)&&!row.path.split('/').some(part=>!part||part==='.'||part==='..'));
 const to=path.resolve(site,row.path);assert(to.startsWith(path.resolve(site)+path.sep));
 assert.equal(sha(read(candidate+'/files/'+row.path)),row.sha256,row.path+' reviewed postimage');
 assert.equal(fs.existsSync(to)?sha(read(to)):null,row.beforeSha256,row.path+' application preimage');
}
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
fs.mkdirSync(stage);const save=(p,b)=>{const to=stage+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});assert.equal(sha(read(to)),sha(b));};
save('original-full-terminal.json',read(out+'/receipt.json'));save('original-source-inputs.json',read(prep.sourceInputs));save('queued-dental-terminal.json',read(queuePath));
for(const row of manifest.files)if(row.beforeSha256)save('originals/'+row.path,read(site+'/'+row.path));
// Only after every preflight succeeded. These are admitted mechanical source copies.
for(const row of manifest.files){const to=site+'/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(candidate+'/files/'+row.path,to);assert.equal(sha(read(to)),row.sha256);}
const after=new Map(originals.map(row=>[row.path,row]));
for(const row of manifest.files)after.set(row.path,{path:row.path,bytes:read(site+'/'+row.path).length,sha256:row.sha256});
for(const row of after.values())assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path+' complete after-input identity');
assert.equal(after.size,5081);
save('source-inputs-after.json',Buffer.from(JSON.stringify([...after.values()].sort((a,b)=>a.path.localeCompare(b.path)),null,2)+'\n'));
save('PREPARATION.json',Buffer.from(JSON.stringify({stage,site,atlas:manifest.atlas,scope:'Actual affected corpus tests on admitted49path unpublished candidate; no owner preview cutover.'},null,2)+'\n'));
const result={at:new Date().toISOString(),site,candidateManifestSha256:sha(read(candidate+'/MANIFEST.json')),appliedPaths:49,
 preservedFullRun:{receiptSha256:sha(read(out+'/receipt.json')),entries:1050,counts:full.counts,passingClaim:false,originalInputsVerified:5053},
 queuedSource:{actualFullDentalGatePass:true,currentSourcePaths:queue.currentSourcePaths,actualFullTheorem:queue.actualFullTheorem},
 afterInputs:5081,afterInputsSha256:sha(read(stage+'/source-inputs-after.json')),actualCorpusModulesPassed:false,
 ownerPreviewOrCanonicalChanged:false,clinicalApproval:false,spatialRegistration:false};
save('ADMISSION.json',Buffer.from(JSON.stringify(result,null,2)+'\n'));
console.log(JSON.stringify({admission:stage+'/ADMISSION.json',sha256:sha(read(stage+'/ADMISSION.json')),appliedPaths:49,afterInputs:5081,
 priorFullRunFail:144,dentalTransitionPassed:true,canonicalInstalled:false}));
