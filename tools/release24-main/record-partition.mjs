import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage='G:/VisibleMedicine-temp/staging/20261031-head-clear-final',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release24-progress';
const queue=stage+'/verification-twentythree',evidence=queue+'/attempts/partition-23-lQaOFt/evidence';
const tapPath=stage+'/website/.local/website-test-runs/2026-10-31T17-39-26-969Z-8291a5f9-fcc8-49d3-b59d-5e571de3ac8b/child.tap';
const ref=p=>({path:p,sha256:hash(p)}),copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(from),hash(to));};
assert.equal(hash(stage+'/SOURCE.json'),'76bc03dce3e3cd5ac0420f67a6bc1aed48dff24edd4efc9a815195addd139bff');
const state=json(queue+'/STATE.json'),terminal=json(evidence+'/PROCESS-TERMINAL.json');assert(state.terminal);assert(terminal.terminalObserved);assert.equal(terminal.exitCode,1);
copy(tapPath,cp+'/partition23/child.tap');for(const name of ['PROCESS-TERMINAL.json','runner.stdout.log','runner.stderr.log'])copy(evidence+'/'+name,cp+'/partition23/'+name);
for(const name of ['STATE.json','PLAN.json'])copy(queue+'/'+name,cp+'/partition23/'+name);copy(stage+'/SOURCE.json',cp+'/partition23/SOURCE.json');
const text=fs.readFileSync(tapPath,'utf8'),lines=text.split(/\r?\n/),failures=[];
for(let n=0;n<lines.length;n++){if(!/^not ok \d+/.test(lines[n]))continue;const next=lines.slice(n+1,n+70);failures.push({point:lines[n],diagnostics:next.filter(line=>/duration_ms:|location:|error:|message:|expected:|actual:|operator:|tests\/.+\.(?:mjs|ts):|\.test\.(?:mjs|ts):/.test(line)).slice(0,15)});}
const counters={};for(const key of ['tests','pass','fail','cancelled','skipped','todo','duration_ms']){const m=[...text.matchAll(new RegExp('^# '+key+' ([0-9.]+)\\r?$','gm'))];assert.equal(m.length,1,key);counters[key]=Number(m[0][1]);}assert.equal(failures.length,counters.fail);
fs.writeFileSync(cp+'/partition23/FAILURES.json',JSON.stringify({source:ref(stage+'/SOURCE.json'),terminal:ref(cp+'/partition23/PROCESS-TERMINAL.json'),tap:ref(cp+'/partition23/child.tap'),counters,failures},null,2)+'\n',{flag:'wx'});
const raw=fs.readFileSync('CURRENT_CHECKPOINT.json'),i=JSON.parse(raw),c=i.activeWork.current;copy('CURRENT_CHECKPOINT.json',cp+'/INDEX_BEFORE.json');
c.activeExecutionSessions=[];c.currentReleaseQueue={...c.currentReleaseQueue,state:'partition23-terminal-failed',source:ref(stage+'/SOURCE.json'),failureInventory:ref(cp+'/partition23/FAILURES.json'),counts:counters};
c.next='Partition23 completed267cases254pass13fail. Preserve original failures and repair authenticated historical contexts without weakening assertions. Shoulder Git reader speed and carpal delivery proposals await integration/focused checks; HRA historical Atlas environment correction verified clean6d source. Installed preview unchanged. Full roadmap retained.';
i.goal.previousTurn='progress';i.activeWork.updated=new Date().toISOString();i.activeWork.lastUpdated=i.activeWork.updated;saveIndex(i);console.log(JSON.stringify({checkpoint:cp,counters,failures}));
