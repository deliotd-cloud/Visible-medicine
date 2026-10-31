import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-prostate-website',site=root+'/website',atlas='G:/VisibleMedicine-temp/staging/20261031-prostate-native/atlas',out=root+'/native-export/public/atlas-runtime/head-neck';
const run=(cwd,label,args)=>{const r=spawnSync(process.execPath,['--max-old-space-size=1024',...args],{cwd,encoding:'utf8',windowsHide:true,maxBuffer:2e6});fs.writeFileSync(root+'/logs/'+label+'.log',r.stdout+r.stderr,{flag:'wx'});assert.equal(r.status,0,label);};
run(atlas,'native-export',['scripts/export-head-neck-module.mjs',out]);
const target=path.resolve(site,'public/atlas-runtime/head-neck'),prior=path.resolve(root,'runtime-before');for(const p of [target,prior])assert(p.startsWith(path.resolve(root)+path.sep));assert(!fs.existsSync(prior));
const original=json(target+'/manifest.json');for(const row of original.files)assert.equal(hash(target+'/'+row.path),row.sha256,row.path);fs.renameSync(target,prior);
const m=json(out+'/manifest.json');for(const row of [...m.files,{path:'manifest.json',sha256:hash(out+'/manifest.json')}]){assert.equal(hash(out+'/'+row.path),row.sha256);const p=target+'/'+row.path;fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(out+'/'+row.path,p,fs.constants.COPYFILE_EXCL);}
const old=json(site+'/lib/atlas-model-inventory.json');run(site,'native-inventory',['scripts/atlas-model-inventory.mjs']);assert.deepEqual(json(site+'/lib/atlas-model-inventory.json').models,old.models);
const p=site+'/lib/atlas-delivery-policy.ts',text=fs.readFileSync(p,'utf8'),match=text.match(/manifestRevision: '([a-f0-9]{64})'/);assert(match);assert(text.includes("audience: 'administrator-review'"));fs.writeFileSync(p,text.replace(match[1],hash(site+'/lib/atlas-model-inventory.json')));
run(site,'native-lecture-catalog',['scripts/lecture-body-catalog.mjs']);
run(site,'native-review-bind',['scripts/bind-clinical-review.mjs']);
fs.writeFileSync(root+'/REVIEW_PREPARED.json',JSON.stringify({at:new Date().toISOString(),sourceAtlas:atlas,review:json(site+'/atlas-review/integration-inputs.json').sha256,inputs:json(site+'/atlas-review/integration-inputs.json').inputs.length,imported:json(site+'/atlas-review/manifest.json').files.length,modelBytesUnchanged:true,privateAudienceUnchanged:true,installed:false},null,2)+'\n',{flag:'wx'});
