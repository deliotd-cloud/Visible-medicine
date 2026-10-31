import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-current-release-context',site=root+'/website',parent=json(json(root+'/PREPARATION.json').parent.path);
const groups=[['20261030-native-epoch-completion',[
 ['clinical-review-elbow-arterial-tour.test.ts','c89067baa2b62a5c10a7ebfd874cd0f7b5130ff1af0da247a41f89e72b415aea'],
 ['renal-tour-epoch-admission.mjs','a71021f19b4775d9fea0ee47b019d5abe95ad53fb1a5659a1b6a7bf0b46dd5ef'],
 ['renal-tour-epoch-admission.test.mjs','e067d1b37778f40e712d9bb3805c7fcde10b6dfdbfde28a3623a32dfa79c4ef1']]],
 ['20261030-head-projection-context',[
 ['head-epoch-projections.mjs','a1ada1532cf22b59a6a962e13eeaaa91b8a8bc576dd509a29e988e1da6c8a909'],
 ['head-source-context-preservation.mjs','f8434a64619fd58227c0cf784a659f2669cfdcd4758fb66ba80b008d88d4ff70'],
 ['head-delivery-successor-projection.test.mjs','a805d6c264672ef03fc0a786de2cc81ba5895758b4da88f53d98282f494ff578']]]];
const changes=[];fs.mkdirSync(root+'/before-proposals',{recursive:true});
for(const [group,files]of groups)for(const [name,sha256]of files){const from='G:/VisibleMedicine-temp/proposals/'+group+'/website/tests/'+name,to=site+'/tests/'+name;assert.equal(hash(from),sha256);const row=parent.sourceRows.find(r=>r.path==='tests/'+name);assert.equal(hash(to),row.sha256);fs.copyFileSync(to,root+'/before-proposals/'+name,fs.constants.COPYFILE_EXCL);fs.copyFileSync(from,to);assert.equal(hash(to),sha256);changes.push({path:'tests/'+name,before:row.sha256,after:sha256,proposal:group});}
const fixture='tests/fixtures/review-rebinding-before-head-note-recovery.json',before='G:/VisibleMedicine-temp/staging/20261030-review-release-continuation/DELIVERY_PIN_BEFORE.json';assert.equal(hash(before),'2216d5cd77cdcf3455b7a8a276785b8a8f2e181a8ee7909473f1899e8e0f536e');fs.copyFileSync(before,site+'/'+fixture,fs.constants.COPYFILE_EXCL);
const sourceRows=parent.sourceRows.map(row=>({path:row.path,bytes:fs.statSync(site+'/'+row.path).size,sha256:hash(site+'/'+row.path)}));sourceRows.push({path:fixture,bytes:fs.statSync(site+'/'+fixture).size,sha256:hash(site+'/'+fixture)});sourceRows.sort((a,b)=>a.path.localeCompare(b.path));
const changedPaths=sourceRows.filter(row=>parent.sourceRows.find(p=>p.path===row.path)?.sha256!==row.sha256).map(r=>r.path);assert(changedPaths.every(p=>p.startsWith('tests/')),'Test-only successor');
const receipt={...parent,schema:'vm-current-release-context-candidate/1',at:new Date().toISOString(),website:site,parent:json(root+'/PREPARATION.json').parent,sourceRows,sourcePaths:sourceRows.map(r=>r.path),changedPaths,addedPaths:[fixture],removedPaths:[],wholeSuitePassing:false,installed:false,normalPreviewChanged:false,tested:false,productSourceUnchanged:true,clinicalApproval:false};
fs.writeFileSync(root+'/PROPOSAL_INTEGRATION.json',JSON.stringify({changes,changedPaths,productSourceUnchanged:true},null,2)+'\n',{flag:'wx'});fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({changedPaths,sourceReceiptSha256:hash(root+'/SOURCE.json')}));
