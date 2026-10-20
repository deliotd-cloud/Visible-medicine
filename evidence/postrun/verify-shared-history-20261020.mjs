import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261020-shared-history-contexts';
const site='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const atlas='F:/VisibleMedicine/staging/20261020-inferior-thyroid-mra-source';
const roots='F:/VisibleMedicine/staging/20261020-review-regression-wave/roots';
const groups={sourceEol:['next-five-special-admission.mjs'],closed56:['historical-current-atlas-delivery-56.mjs','clinical-review-femoral-arterial-admission-56-closed.test.mjs','clinical-review-femoral-venous-admission-56-closed.test.mjs','closed56-femoral-epoch.test.mjs','closed57-original-tests.test.mjs']};
const files=[];
for(const [group,names] of Object.entries(groups))for(const name of names){
 const file='tests/'+name,from=stage+'/'+group+'/files/'+file,before=stage+'/'+group+'/before/'+file;
 assert.equal(sha(read(before)),sha(read(site+'/'+file)),'Frozen original changed: '+file);
 files.push({path:file,from,before,beforeSha256:sha(read(before)),sha256:sha(read(from)),bytes:read(from).length});
}
for(const stem of ['femoral-arterial','femoral-venous','hand-arterial']){
 const file=`tests/clinical-review-${stem}-xray.test.ts`,from=roots+'/files/'+file,before=roots+'/before/'+file;
 assert.equal(sha(read(before)),sha(read(site+'/'+file)));
 const text=read(from).toString(),root='const atlas=currentAtlasDeliveryRoot();';
 const imp='import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot}';
 assert.equal(text.split(root).length,2);assert.equal(text.split(imp).length,2);
 assert.equal(text.replace(root,"const atlas='F:/VisibleMedicine/atlas';").replace(imp,'import {CURRENT_ATLAS_REVISION}'),read(before).toString());
 files.push({path:file,from,before,beforeSha256:sha(read(before)),sha256:sha(read(from)),bytes:read(from).length,fullByteInverse:true,originalModulePassed:false});
}
const helper=files.find(row=>row.path==='tests/historical-current-atlas-delivery-56.mjs');
const original=read(helper.before).toString();
const line="import {validateCurrentAtlasDelivery as validateDeliveryShape,currentAtlasDeliveryRoot as frozenAtlasRoot} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';";
const addition="\nimport {checkedAtlasHistoryRepo} from './fixtures/closed56-validator/tests/atlas-source-repo.mjs';";
const fn="// Git-only replay of the exact historical commit. The archived delivery bytes\n// above remain the authority for Review; this does not validate a live checkout.\nexport function historicalAtlasGitRoot(){\n validateCurrentAtlasDelivery();\n return checkedAtlasHistoryRepo(revision56.source);\n}\n";
assert.equal(original.split(line).length,2);
const expected=original.replace(line,line+addition).replace('export function currentAtlasDeliveryRoot(){',fn+'export function currentAtlasDeliveryRoot(){');
assert.equal(read(helper.from).toString(),expected,'Archived reader/root semantics unchanged outside explicit new historical function');
const companion=files.find(row=>row.path==='tests/closed57-original-tests.test.mjs');
const companionText=read(companion.from).toString(),start=companionText.indexOf('// Explicit later current-source seams;'),end=companionText.indexOf("for(const [name,digest,candidate,edits] of cases)");
assert(start>=0&&end>start);
const block=" if(name==='closed56-femoral-epoch.test.mjs'){\n  const previous=exact;\n  for(const [before,after] of closed56CurrentEdits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}\n  let inverse=exact;\n  for(const [before,after] of closed56CurrentEdits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}\n  assert.equal(inverse,previous,'Complete epoch migration inverse');\n }\n";
assert.equal(companionText.split(block).length,2);
assert.equal((companionText.slice(0,start)+companionText.slice(end)).replace(block,''),read(companion.before).toString(),'All original closed57 cases/assertions byte exact');
const specs=[
 [stage+'/sourceEol/SOURCE_EOL_ACTUAL_STRICT_V2.json',11,'Actual unmodified staged helper and strict current validators; synthetic read-result corruption, exact inverse'],
 [stage+'/closed56/CLOSED56_ACTUAL_GUARDS_AND_EPOCH.json',10,'Full two original closed femoral guards plus epoch module; independent closed reader and exact original-file inverses'],
 [stage+'/closed56/CLOSED57_ACTUAL_COMPANION.json',4,'Full original four-case closed57 preservation companion with exact later epoch seams'],
 ['F:/VisibleMedicine/staging/20261020-hand-xray-focused/HAND_XRAY_ACTUAL_CURRENT_SOURCE.json',1,'Selected actual current hand source/Review/learner case, not full module'],
 ['F:/VisibleMedicine/staging/20261020-hand-xray-focused/FEMORAL_XRAY_ACTUAL_CURRENT_SOURCES.json',2,'Selected actual current two femoral source/Review/learner cases, not full modules'],
];
const checks=specs.map(([receipt,count,scope])=>{
 const result=json(receipt);assert.equal(result.code,0);assert.equal(result.signal,null);assert.equal(sha(read(result.log)),result.logSha256);
 for(const text of [`ℹ tests ${count}`,`ℹ pass ${count}`,'ℹ fail 0','ℹ skipped 0'])assert(result.footer.includes(text),text);
 return {receipt,receiptSha256:sha(read(receipt)),log:result.log,logSha256:result.logSha256,cases:count,scope};
});
const output=site+'/.local/website-test-runs/2026-10-20T15-33-34-089Z-a0219b57-000e-43ab-ae31-06f67f26fcbd';
const manifest=json(output+'/manifest.json');assert.equal(manifest.files.length,5019);
for(const row of manifest.files)assert.equal(sha(read(path.join(manifest.root,row.path))),row.sha256,'Frozen full-run input changed: '+row.path);
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),'87ed7e343260c7df48a40d53503f25bbfd34cfa5');
assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'f5097af8493701d64a8e2a2b5797df380f3b348a');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const processOutput=execFileSync('powershell.exe',['-NoProfile','-Command',"Get-CimInstance Win32_Process -Filter 'ProcessId = 156072 OR ProcessId = 249656' | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress"],{windowsHide:true,encoding:'utf8'}).trim();
const processes=processOutput?JSON.parse(processOutput):[];
const live=Array.isArray(processes)&&processes.some(p=>p.ProcessId===156072&&p.CommandLine==='node scripts/run-website-tests.mjs --run')&&processes.some(p=>p.ProcessId===249656&&p.ParentProcessId===156072&&p.CommandLine.includes('2026-10-20T15-33-34-089Z-a0219b57-000e-43ab-ae31-06f67f26fcbd'));
const terminal=fs.existsSync(output+'/receipt.json')?json(output+'/receipt.json'):null;assert(live||terminal);
const evidence={schema:'vm-shared-history-focused-verification/1',at:new Date().toISOString(),stage,site,atlas,files,checks,
 helperFullByteInverse:true,closed57CompanionFullByteInverse:true,guardFullByteInversesExecuted:true,epochFullByteInverse:json(stage+'/closed56/COMPANION_PREPARATION.json'),
 limitations:['SourceEol worker original probe stubbed strict root and is not strict-root evidence; superseded by actual V2 test.','Initial actual harness had3 failures because paths with doubled slash did not match synthetic probes. Only harness path canonicalization changed; original failure retained.','Original full content/history femoral/hand modules remain unrun.','Two other historical56 current-root callers and separate57 caller remain outside this patch; no blanket fallback added.','Current full-suite prefix is not a final result or remaining failure count.','No canonical runtime installation, owner editor refresh, mask, access, clinical or deployment changes.'],
 fullSuite:{output,sourceInputsVerifiedUnchanged:5019,sourceSha256:manifest.sourceSha256,live,processes,terminalReceiptObserved:!!terminal,passingClaim:terminal?.passingClaim===true},canonicalInstalled:false,fullGoalActive:true};
fs.writeFileSync(stage+'/VERIFICATION.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({evidence:stage+'/VERIFICATION.json',sha256:sha(read(stage+'/VERIFICATION.json')),files:files.length,cases:checks.map(r=>r.cases),live,terminal:!!terminal}));
