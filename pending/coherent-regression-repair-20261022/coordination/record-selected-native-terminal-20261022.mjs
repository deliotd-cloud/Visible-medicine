import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const evidence='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/native-selected-repairs-v5';
const sha=b=>createHash('sha256').update(b).digest('hex');
const terminalBytes=readFileSync(join(evidence,'TERMINAL.json'));
const terminal=JSON.parse(terminalBytes);
const tapBytes=readFileSync(join(evidence,'child.tap'));
assert.equal(terminal.terminal,true);
assert.equal(terminal.code,1);
assert.deepEqual(terminal.sourceDrift,[]);
assert.equal(sha(tapBytes),terminal.tapSha256);
assert.equal(terminal.entryFiles,172);
assert.deepEqual(terminal.counts,{tests:386,pass:355,fail:31,cancelled:0,skipped:0,todo:0});
const planPath='F:/VisibleMedicine/staging/20261022-reviewed-source-continuation/PLAN.json';
const planBytes=readFileSync(planPath),plan=JSON.parse(planBytes);
assert.equal(sha(planBytes),'3ea1ec6220680ce72cc6796925b8066107258cc1fbdd3f5328d2df332901aa71');
const selected=new Set(plan.repairs.map(r=>r.path));
const blocks=tapBytes.toString('utf8').split(/(?=^not ok \d+ - )/m).filter(b=>b.startsWith('not ok '));
const failures=blocks.map(block=>{
 const header=/^not ok (\d+) - (.+)/.exec(block);
 const location=/^\s*location: '([^']+)'/m.exec(block)?.[1];
 assert(location,'Actual location is required: '+header[1]);
 const path=/[\\/]tests[\\/](.+?):\d+:\d+$/.exec(location.replaceAll('\\\\','/'));
 assert(path,'Exact test path required: '+location);
 return {id:Number(header[1]),title:header[2],path:'tests/'+path[1].replaceAll('\\','/'),selected47Repair:selected.has('tests/'+path[1].replaceAll('\\','/'))};
});
assert.equal(failures.length,terminal.counts.fail);
const result={at:new Date().toISOString(),terminalSha256:sha(terminalBytes),tapSha256:sha(tapBytes),
 selectedPlanSha256:sha(planBytes),counts:terminal.counts,entryFiles:172,
 uniqueFailingPaths:new Set(failures.map(f=>f.path)).size,failures,
 selected47Markers:failures.filter(f=>f.selected47Repair).map(f=>f.id),
 remainingMarkers:failures.filter(f=>!f.selected47Repair).map(f=>f.id),
 mainReviewed:false,unhandledFailureMarkers:failures.map(f=>f.id),
 note:'Inventory only. No repair acceptance, diagnostic-review gate, candidate overlay, native rerun or whole-suite claim.'};
writeFileSync(join(evidence,'TERMINAL_FAILURE_INVENTORY.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointerPath='CURRENT_CHECKPOINT.json';
const pointer=JSON.parse(readFileSync(pointerPath));
const current=pointer.activeWork.current;
current.nativeRun={...current.nativeRun,pid:null,terminal:true,result:join(evidence,'TERMINAL.json'),
 terminalSha256:sha(terminalBytes),code:1,counts:terminal.counts,sourceDrift:[],sessionFinished:true};
current.terminalFailureInventory={path:join(evidence,'TERMINAL_FAILURE_INVENTORY.json'),
 sha256:sha(readFileSync(join(evidence,'TERMINAL_FAILURE_INVENTORY.json'))),uniquePaths:result.uniqueFailingPaths,
 markers:31,allDiagnosed:false};
current.beforeFurtherWork='Native172 job is terminal386/355/31; never poll/restart session14480. Finish source review of all31 actual failure markers and later staged proposals, then a source-bound diagnostic review and coherent isolated overlay. Current V5 remains unchanged.';
current.next='Classify all31 actual native failures, compose already reviewed and newly assigned exact source-history fixes without weakening original assertions/current validators, verify the coherent candidate in isolation and save recovery. Owner preview unchanged: no restart, cutover or tab refresh. Full71/eight and clinical/private/specialist boundaries remain intact.';
current.at=result.at;
writeFileSync(pointerPath,JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({terminal:true,counts:result.counts,uniquePaths:result.uniqueFailingPaths,
 selected47Markers:result.selected47Markers,remainingMarkers:result.remainingMarkers,
 inventory:join(evidence,'TERMINAL_FAILURE_INVENTORY.json'),candidateChanged:false,ownerPreviewChanged:false}));
