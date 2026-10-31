import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const parentFile='G:/VisibleMedicine-temp/staging/20261031-release-partition13-repairs/SOURCE.json';
assert.equal(hash(parentFile),'5912dd67d94b93dcb4e022345a0240cc691a82e1d31dcb24469b6ef2a2b9c5e6');
const parent=json(parentFile),proposal='G:/VisibleMedicine-temp/proposals/20261031-review-quick-status';
const root='G:/VisibleMedicine-temp/staging/20261031-review-quick-status',site=root+'/website';assert(!fs.existsSync(root));
const metadata=json(proposal+'/METADATA.json');const files=Array.isArray(metadata.files)?metadata.files:Object.entries(metadata.files).map(([path,v])=>({path,...v}));
assert.deepEqual(files.map(r=>r.path).sort(),['components/ClinicalReviewQuickStart.tsx','tests/clinical-review-quick-start-ui.test.mjs']);
const changes=files.map(r=>({path:r.path,before:r.before??r.beforeSha256,after:r.after??r.proposedSha256??r.proposalSha256,from:proposal+'/'+r.path}));
for(const r of changes){assert.equal(parent.sourceRows.find(p=>p.path===r.path)?.sha256,r.before,r.path);assert.equal(hash(r.from),r.after,r.path);assert.notEqual(r.before,r.after);}
const replacements=new Map(changes.map(r=>[r.path,r])),rows=[];
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);const patch=replacements.get(r.path),dest=site+'/'+r.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(patch?.from??parent.website+'/'+r.path,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),patch?.after??r.sha256,r.path);rows.push({...r,sha256:hash(dest),bytes:fs.statSync(dest).size});}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,root+'/atlas','junction');fs.mkdirSync(root+'/tmp');
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');const objects=execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/');fs.writeFileSync(site+'/.git/objects/info/alternates',objects+'\n',{flag:'wx'});git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
assert.equal(hash(parent.historicalEnvironment.path),parent.historicalEnvironment.sha256);fs.copyFileSync(parent.historicalEnvironment.path,root+'/HISTORICAL_ENVIRONMENT.json',fs.constants.COPYFILE_EXCL);
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,parent.review);for(const r of binding.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const write=(name,value)=>fs.writeFileSync(root+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'}),ref=p=>({path:p,sha256:hash(p)});
write('SOURCE.json',{...parent,schema:'vm-quick-review-status-successor/1',at:new Date().toISOString(),parent:ref(parentFile),website:site,sourceRows:rows,currentChanges:changes.map(r=>r.path),historicalEnvironment:ref(root+'/HISTORICAL_ENVIRONMENT.json'),runtimeUnchangedFromParent:false,reviewInputsUnchanged:true,installed:false});
write('COMPOSITION.json',{at:new Date().toISOString(),source:ref(root+'/SOURCE.json'),changes,proposal:ref(proposal+'/METADATA.json'),protectedInputs:binding.inputs.length,independentSourceCopies:true,reviewDecisionsUnchanged:true,installed:false});
console.log(JSON.stringify({source:ref(root+'/SOURCE.json'),changes:changes.length,protectedInputs:binding.inputs.length}));
