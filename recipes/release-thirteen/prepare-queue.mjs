import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const stage='G:/VisibleMedicine-temp/staging/20261031-release-partition13-repairs',root=stage+'/verification';
const previous='G:/VisibleMedicine-temp/staging/20261031-release-partition12-final',old=previous+'/verification';
assert.equal(process.argv.length,3);const sourceSha=process.argv[2];assert.equal(hash(stage+'/SOURCE.json'),sourceSha);assert(!fs.existsSync(root));
const plan=json(old+'/PLAN.json');assert.equal(hash(old+'/PLAN.json'),'f3f5412439bf2a1011cf6420fa8d7b0fee33c59d7fb48284f00521a4ec51725d');assert(json(old+'/STATE.json').terminal);
const files=['runner.mjs','runner.test.mjs','guarded-step.mjs','run-release.mjs'];for(const f of files)assert.equal(hash(old+'/'+f),plan.codeFiles.find(r=>r.path===old+'/'+f)?.sha256,f);
fs.mkdirSync(root,{recursive:true});for(const f of files.filter(p=>p!=='run-release.mjs'))fs.copyFileSync(old+'/'+f,root+'/'+f,fs.constants.COPYFILE_EXCL);
// Only existing test roots changed: helper additions do not change partition assignment.
const steps=Array.from({length:20},(_,i)=>({id:'partition-'+(i+13),command:'scripts/run-website-tests.mjs --run --partition '+(i+13)+'/32'}));
let code=fs.readFileSync(old+'/run-release.mjs','utf8');assert.equal(code.split('const steps=').length,2);assert.equal(code.split('\nconst ref=').length,2);
const start=code.indexOf('const steps='),end=code.indexOf('\nconst ref=',start);code=code.slice(0,start)+'const steps='+JSON.stringify(steps,null,2)+';'+code.slice(end);
code=code.replaceAll(old,root).replaceAll(previous,stage);
const prior="sha256:'e464d5ac847dfe8fcc1885eb0b05ad5db89ac6d84f1af0ac44dc6f2259de9a5f'";assert.equal(code.split(prior).length,2);code=code.replace(prior,"sha256:'"+sourceSha+"'");fs.writeFileSync(root+'/run-release.mjs',code,{flag:'wx'});
fs.writeFileSync(root+'/SCOPE.json',JSON.stringify({at:new Date().toISOString(),source:{path:stage+'/SOURCE.json',sha256:sourceSha},priorPlan:{path:old+'/PLAN.json',sha256:hash(old+'/PLAN.json')},steps,controllerUnchanged:true,guardUnchanged:true,wholeSuitePassing:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:root,steps:steps.length,sourceSha}));
