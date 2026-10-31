import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const parentRoot='G:/VisibleMedicine-temp/staging/20261031-release-partition12-repairs',root='G:/VisibleMedicine-temp/staging/20261031-release-partition12-final',site=root+'/website';
const sourceFile=parentRoot+'/SOURCE.json';assert.equal(hash(sourceFile),'59bef410c6765f00f2ec890b103887eb534b2fe48441dc516c11e6c7cc7c21b6');
const parent=json(sourceFile);assert(!fs.existsSync(root));assert.deepEqual(json(parentRoot+'/CLINICAL_FOCUSED.json').counts,{tests:6,pass:4,fail:2,cancelled:0,skipped:0,todo:0});
const clinical='G:/VisibleMedicine-temp/proposals/20261031-release-twelve-clinical',studio='G:/VisibleMedicine-temp/proposals/20261031-studio-history-followup/METADATA.json';
const cm=json(clinical+'/METADATA.json'),sm=json(studio);
assert.equal(sm.sealedSourceManifestSha256,hash(sourceFile));assert.equal(sm.verification.result.pass,2);
const patches=[{path:sm.testPath,from:sm.proposedPath,after:sm.proposedSha256},...['clinical-review-neonatal-cranial-us.test.ts','clinical-review-pulmonary-venous-teaching.test.ts'].map(name=>{const p='tests/'+name,row=cm.hashes.find(x=>x.path===p);assert(row,p);return {path:p,from:clinical+'/'+p,after:row.proposed};})];
for(const p of patches){assert.equal(hash(p.from),p.after,p.path);p.before=parent.sourceRows.find(r=>r.path===p.path)?.sha256;assert(p.before&&p.after!==p.before,p.path);}
const map=new Map(patches.map(p=>[p.path,p])),rows=[];
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);const p=map.get(r.path),dest=site+'/'+r.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(p?.from??parent.website+'/'+r.path,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),p?.after??r.sha256,r.path);rows.push(p?{...r,sha256:hash(dest),bytes:fs.statSync(dest).size}:r);}
assert(!fs.readFileSync(site+'/tests/clinical-review-neonatal-cranial-us.test.ts','utf8').includes('{timeout:240000}'));
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,root+'/atlas','junction');fs.mkdirSync(root+'/tmp');
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');
const objects=execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/');
fs.writeFileSync(site+'/.git/objects/info/alternates',objects+'\n',{flag:'wx'});git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,parent.review);for(const r of binding.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const write=(p,v)=>fs.writeFileSync(root+'/'+p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});assert.equal(hash(parent.historicalEnvironment.path),parent.historicalEnvironment.sha256);
fs.copyFileSync(parent.historicalEnvironment.path,root+'/HISTORICAL_ENVIRONMENT.json',fs.constants.COPYFILE_EXCL);
const ref=p=>({path:p,sha256:hash(p)});
write('SOURCE.json',{...parent,schema:'vm-release-twelve-final-successor/1',at:new Date().toISOString(),parent:ref(sourceFile),website:site,sourceRows:rows,currentChanges:patches.map(p=>p.path),historicalEnvironment:ref(root+'/HISTORICAL_ENVIRONMENT.json'),runtimeUnchangedFromParent:true,installed:false});
write('COMPOSITION.json',{at:new Date().toISOString(),source:ref(root+'/SOURCE.json'),patches,proposals:[ref(studio),ref(clinical+'/METADATA.json')],priorFailures:[ref(parentRoot+'/PURE_CHECKS_ADDENDUM.json'),ref(parentRoot+'/CLINICAL_FOCUSED.json')],protectedInputs:binding.inputs.length,independentSourceCopies:true,productUnchanged:true,installed:false});
console.log(JSON.stringify({source:ref(root+'/SOURCE.json'),changes:patches.length,protectedInputs:binding.inputs.length}));
