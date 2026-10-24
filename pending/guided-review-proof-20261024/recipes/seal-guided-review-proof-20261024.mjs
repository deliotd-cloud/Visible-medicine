import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261024-guided-review-completeness';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),hash=p=>sha(read(p)),json=p=>JSON.parse(read(p));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),inputs=json(stage+'/attempt-2/SOURCE_INPUTS.json');
assert.equal(hash(prep.parentReceipt),prep.parentReceiptSha256);assert.equal(inputs.length,6498);
for(const row of inputs)assert.equal(hash(prep.website+'/'+row.path),row.sha256,row.path);
for(const row of parent.sourceRows)assert.equal(inputs.find(r=>r.path===row.path)?.sha256,row.sha256,'Every inherited source exact: '+row.path);
const added=inputs.filter(r=>!parent.sourceRows.some(p=>p.path===r.path));assert.deepEqual(added.map(r=>r.path),prep.plannedNewPaths);
const terminal=json(stage+'/attempt-2/checks/TERMINAL.json');assert.equal(terminal.code,0);
assert.deepEqual(terminal.counts,{tests:2,pass:2,fail:0,skipped:0,cancelled:0});assert(terminal.entireSourceClosureUnchanged);
assert.equal(terminal.sourceInputsSha256,hash(stage+'/attempt-2/SOURCE_INPUTS.json'));
assert.equal(terminal.stdoutSha256,hash(stage+'/attempt-2/checks/stdout.log'));assert.equal(terminal.stderrSha256,hash(stage+'/attempt-2/checks/stderr.log'));
const tap=read(stage+'/attempt-2/checks/stdout.log').toString();
const diagnostics=tap.split(/\r?\n/).filter(line=>line.startsWith('# {')).map(line=>JSON.parse(line.slice(2)));
assert.deepEqual(diagnostics,[{structures:1104,guidedStructures:320,placements:414,newStructures:10,newPlacements:10,omissionRefusals:414,closureFiles:1127},{independentMutationRefusals:69}]);
assert.equal(json(stage+'/checks/TERMINAL.json').code,1);assert(read(stage+'/checks/stdout.log').toString().includes('Actual application closure must be imported Review source'));
const audit=json(stage+'/ADJACENT_AUDIT.json');assert.equal(audit.roots.length,16);assert.equal(audit.cases,37);assert.equal(audit.negativeEvidence.length,9);
const evidence=[];
function collect(dir,prefix=''){
 for(const row of fs.readdirSync(dir,{withFileTypes:true})){
  const rel=prefix+row.name;if(rel==='website')continue;
  assert(!row.isSymbolicLink());if(row.isDirectory())collect(dir+'/'+row.name,rel+'/');
  else evidence.push({path:rel,bytes:fs.statSync(dir+'/'+row.name).size,sha256:hash(dir+'/'+row.name)});
 }
}
collect(stage);evidence.sort((a,b)=>a.path.localeCompare(b.path));
const value={at:new Date().toISOString(),schema:'vm-current-guided-review-proof/1',website:prep.website,atlas:prep.atlas,
 atlasHead:prep.atlasHead,atlasTree:prep.atlasTree,parentReceipt:prep.parentReceipt,parentReceiptSha256:prep.parentReceiptSha256,
 sourceRows:inputs,newPaths:added.map(r=>r.path),inheritedSourcePaths:6496,allInheritedSourceBytesExact:true,
 productOrGeneratedSourceChanges:false,evidence,currentSourceFocusedCases:2,currentSourceChecks:diagnostics,
 historicalAdjacentAudit:stage+'/ADJACENT_AUDIT.json',historicalAdjacentAuditSha256:hash(stage+'/ADJACENT_AUDIT.json'),historicalRoots:16,historicalCases:37,historicalSource:audit.historicalSource,
 historicalProposalIntegrated:false,historicalAllHelperClosuresAtExecutionSealed:false,independentShoulderProvenanceVerified:true,
 originalHistoricalHelperAndTheoremsByteUnchanged:true,currentCompletenessIsAdditionalIndependentGate:true,
 freshProductionBuild:false,freshTypes:false,freshBrowser:false,parentBuildEvidenceUnchanged:true,
 privateRecordsReadOrWritten:false,previewChanged:false,installed:false,clinicalApproval:false,patientSpaceRegistration:false,wholeSuitePassing:false};
write(stage+'/PROOF_BOUND.json',value);
console.log(JSON.stringify({proof:stage+'/PROOF_BOUND.json',sha256:hash(stage+'/PROOF_BOUND.json'),sourcePaths:6498,newTests:2,productChanges:false,checks:diagnostics}));
