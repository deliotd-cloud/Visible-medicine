import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const old='G:/VisibleMedicine-temp/staging/20261031-release16-final/verification-eighteen',stage='G:/VisibleMedicine-temp/staging/20261031-release18-followup',root=stage+'/verification-nineteen';
const plan=json(old+'/PLAN.json'),source=stage+'/SOURCE.json';assert.equal(hash(source),'3ec8df9072c64c1e72f69313e94e6b8e81ecbb72c287df00f5a724e1a1140c43');
assert(json(old+'/STATE.json').terminal);assert(json(stage+'/FOCUSED.json').result.passing);assert(!fs.existsSync(root));fs.mkdirSync(root);
for(const name of ['runner.mjs','runner.test.mjs','guarded-step.mjs','one-step-admission.mjs','one-step-admission.test.mjs']){assert.equal(hash(old+'/'+name),plan.codeFiles.find(r=>r.path===old+'/'+name)?.sha256);fs.copyFileSync(old+'/'+name,root+'/'+name,fs.constants.COPYFILE_EXCL);}
let code=fs.readFileSync(old+'/run-release.mjs','utf8');assert.equal(hash(old+'/run-release.mjs'),plan.codeFiles.find(r=>r.path===old+'/run-release.mjs')?.sha256);
code=code.replaceAll('G:/VisibleMedicine-temp/staging/20261031-release16-final',stage).replaceAll('ec5e332400ad3744044342deb9f7c6d80de0d1ab432107f96c0a5d221faecc8b',hash(source));
const first=code.indexOf('const steps='),end=code.indexOf('\nconst ref=',first);assert(first>0&&end>first);const steps=[...plan.steps.slice(1),plan.steps[0]];assert.equal(steps[0].id,'partition-19');assert.equal(new Set(steps.map(s=>s.id)).size,32);
code=code.slice(0,first)+'const steps='+JSON.stringify(steps,null,2)+';'+code.slice(end);fs.writeFileSync(root+'/run-release.mjs',code,{flag:'wx'});
fs.writeFileSync(root+'/SCOPE.json',JSON.stringify({at:new Date().toISOString(),source:{path:source,sha256:hash(source)},prior:{path:old+'/STATE.json',sha256:hash(old+'/STATE.json')},steps,priorFailuresPreserved:true,all32PartitionsPlanned:true,wholeSuitePassing:false,guardUnchanged:true,reason:'Continue remaining release checks while the isolated lower-limb historical/current repair is prepared. New candidate does not reuse prior-source passes as full-suite evidence.'},null,2)+'\n',{flag:'wx'});
console.log(root);
