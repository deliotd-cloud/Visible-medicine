import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const previous='G:/VisibleMedicine-temp/staging/20261031-release-partition12-final',root='G:/VisibleMedicine-temp/staging/20261031-release-partition13-repairs',site=root+'/website';
const sourceFile=previous+'/SOURCE.json';assert.equal(hash(sourceFile),'e464d5ac847dfe8fcc1885eb0b05ad5db89ac6d84f1af0ac44dc6f2259de9a5f');
const parent=json(sourceFile);assert(!fs.existsSync(root),'Create a fresh candidate; never edit an existing receipt');
const proposals=['history','clinical','studio','role'].map(name=>'G:/VisibleMedicine-temp/proposals/20261031-release-thirteen-'+name);
const patches=[],evidence=[];
for(const dir of proposals){const metadata=dir+(dir.endsWith('-history')?'/CORRECTED_METADATA.json':'/METADATA.json');const m=json(metadata);evidence.push({path:metadata,sha256:hash(metadata)});if(dir.endsWith('-history'))assert.equal(hash(metadata),'e8ad98da81d93075b1d4c955e27ffa49f273cecfc6b1b7b0aacfb19184d73ae7');const files=Array.isArray(m.files)?m.files:Object.entries(m.files).map(([path,v])=>({path,...v}));for(const f of files){assert(f.path.startsWith('tests/')&&!f.path.includes('..'));patches.push({path:f.path,before:f.before??f.beforeSha256??null,after:f.after??f.proposalSha256??f.proposedSha256,from:dir+'/'+f.path});}}
const main='G:/VisibleMedicine-temp/proposals/20261031-release-thirteen-main';const font=json(main+'/FONT_PROPOSAL.json');patches.push({...font,from:main+'/'+font.path});evidence.push({path:main+'/FONT_PROPOSAL.json',sha256:hash(main+'/FONT_PROPOSAL.json')});
assert.equal(new Set(patches.map(r=>r.path)).size,patches.length,'Exclusive file ownership');
const map=new Map(patches.map(r=>[r.path,r]));
for(const p of patches){assert.equal(parent.sourceRows.find(r=>r.path===p.path)?.sha256??null,p.before,p.path+': exact baseline');assert.equal(hash(p.from),p.after,p.path+': reviewed proposal');assert.notEqual(p.before,p.after);}
const rows=[];
for(const row of parent.sourceRows){assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);const p=map.get(row.path),dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(p?.from??parent.website+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),p?.after??row.sha256,row.path);rows.push({...row,sha256:hash(dest),bytes:fs.statSync(dest).size});}
for(const p of patches.filter(p=>p.before===null)){const dest=site+'/'+p.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(p.from,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),p.after);rows.push({path:p.path,sha256:p.after,bytes:fs.statSync(dest).size});}
rows.sort((a,b)=>a.path.localeCompare(b.path));
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,root+'/atlas','junction');fs.mkdirSync(root+'/tmp');
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');
const objects=execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/');
fs.writeFileSync(site+'/.git/objects/info/alternates',objects+'\n',{flag:'wx'});git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,parent.review);for(const row of binding.inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
assert.equal(hash(parent.historicalEnvironment.path),parent.historicalEnvironment.sha256);const inherited=json(parent.historicalEnvironment.path);const eus=json(main+'/EUS_ENVIRONMENT.json');assert(eus.sourceVerified&&!eus.runtimeExecuted);
const write=(name,v)=>fs.writeFileSync(root+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),ref=p=>({path:p,sha256:hash(p)});
write('HISTORICAL_ENVIRONMENT.json',{schema:'vm-partition-thirteen-historical-environment/1',parent:ref(parent.historicalEnvironment.path),additions:ref(main+'/EUS_ENVIRONMENT.json'),environment:{...inherited.environment,...eus.environment},globalConfigurationChanged:false});
write('SOURCE.json',{...parent,schema:'vm-release-thirteen-repair-successor/1',at:new Date().toISOString(),parent:ref(sourceFile),website:site,sourceRows:rows,currentChanges:patches.map(p=>p.path),historicalEnvironment:ref(root+'/HISTORICAL_ENVIRONMENT.json'),runtimeUnchangedFromParent:true,installed:false});
write('COMPOSITION.json',{at:new Date().toISOString(),source:ref(root+'/SOURCE.json'),patches,proposals:evidence,priorFailures:ref(previous+'/PARTITION13_FAILURES.json'),protectedInputs:binding.inputs.length,independentSourceCopies:true,productUnchanged:true,installed:false});
console.log(JSON.stringify({source:ref(root+'/SOURCE.json'),changes:patches.length,sourceFiles:rows.length,protectedInputs:binding.inputs.length}));
