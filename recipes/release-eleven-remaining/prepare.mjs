import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const stage='G:/VisibleMedicine-temp/staging/20261031-release-partition11-final',old=stage+'/verification',root=stage+'/verification-remaining';
const pin=json(old+'/PLAN.json'),checked=json(stage+'/light-checks/RESULT.json');assert(checked.passed&&checked.counts.pass===10);assert.equal(checked.source.sha256,pin.source.sha256);
assert(!fs.existsSync(root));fs.mkdirSync(root);
for(const p of ['runner.mjs','runner.test.mjs','guarded-step.mjs','run-release.mjs'])assert.equal(hash(old+'/'+p),pin.codeFiles.find(r=>r.path===old+'/'+p).sha256,p);
for(const p of ['runner.mjs','runner.test.mjs','guarded-step.mjs'])fs.copyFileSync(old+'/'+p,root+'/'+p,fs.constants.COPYFILE_EXCL);
let text=fs.readFileSync(old+'/run-release.mjs','utf8');
const replacements=[[old,root],['tests/clinical-review-femoral-arterial-xray.test.ts tests/head-filtered-layout.test.mjs tests/complete-release-followup-preservation.test.mjs tests/complete-release-five-followups-preservation.test.mjs','tests/clinical-review-femoral-arterial-xray.test.ts']];
for(const [from,to]of replacements){assert.equal(text.split(from).length,2);text=text.replace(from,to);}
fs.writeFileSync(root+'/run-release.mjs',text,{flag:'wx'});execFileSync(process.execPath,['--max-old-space-size=64','--check',root+'/run-release.mjs'],{windowsHide:true});
console.log(execFileSync(process.execPath,['--max-old-space-size=128',root+'/run-release.mjs','--seal'],{windowsHide:true,encoding:'utf8'}).trim());
fs.writeFileSync(root+'/SCOPE.json',JSON.stringify({previousPlan:{path:old+'/PLAN.json',sha256:hash(old+'/PLAN.json')},alreadyPassed:{path:stage+'/light-checks/RESULT.json',sha256:hash(stage+'/light-checks/RESULT.json')},remaining:'Full femoral root, then stock partition11. Already passed10 pure-source checks are not redundantly repeated as a focused run.',guardsUnchanged:true},null,2)+'\n',{flag:'wx'});
