import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-study-plan-release-ready',prepared=json(root+'/PREPARED.json'),parent=json(prepared.parent.path),site=prepared.website;
assert.equal(hash(prepared.parent.path),prepared.parent.sha256);
const changes=['tests/review-successor-source-role.test.mjs','tests/inbox-return-focus-current-inverse.mjs','tests/inbox-return-focus-current-inverse.json'];
for(const r of parent.sourceRows)if(!changes.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const rows=new Map(parent.sourceRows.map(r=>[r.path,r]));for(const p of changes)rows.set(p,{path:p,sha256:hash(site+'/'+p),bytes:fs.statSync(site+'/'+p).size});
const source={...parent,schema:'vm-study-plan-release-source/1',at:new Date().toISOString(),parent:prepared.parent,website:site,sourceRows:[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path)),authoredPaths:[...new Set([...parent.authoredPaths,...changes])],currentChanges:changes,runtimeUnchangedFromParent:true,installed:false};
const pin=root+'/SOURCE.json';fs.writeFileSync(pin,JSON.stringify(source,null,2)+'\n',{flag:'wx'});
const result=spawnSync(process.execPath,['--max-old-space-size=1024','--test','tests/review-successor-source-role.test.mjs'],{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024,env:{...process.env,TEMP:root+'/tmp',TMP:root+'/tmp'}});
const log=result.stdout+result.stderr;fs.writeFileSync(root+'/FOCUSED.tap',log,{flag:'wx'});assert.equal(result.status,0,log.slice(-5000));assert.match(log,/^ℹ pass 5\r?$/m);assert.match(log,/^ℹ fail 0\r?$/m);
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const parentRoot='G:/VisibleMedicine-temp/staging/20261031-saved-plan-ready',validation=json(parentRoot+'/VALIDATION.json');
assert.equal(validation.source.sha256,prepared.parent.sha256);assert(validation.prebuild.passed);
for(const r of json(parentRoot+'/SCOPED_TYPES.json').graph){const file=r.path.startsWith(parent.website+'/')?site+r.path.slice(parent.website.length):r.path;assert.equal(hash(file),r.sha256,r.path);}
fs.writeFileSync(root+'/VERIFIED.json',JSON.stringify({at:new Date().toISOString(),source:{path:pin,sha256:hash(pin)},focused:{roots:1,pass:5,fail:0,skip:0},parentValidation:{path:parentRoot+'/VALIDATION.json',sha256:hash(parentRoot+'/VALIDATION.json'),productByteIdentity:true},sourceUnchanged:true,fullBuildPassed:false,wholeSuitePassing:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:hash(pin),files:source.sourceRows.length,focused:5,runtimeUnchanged:true}));
