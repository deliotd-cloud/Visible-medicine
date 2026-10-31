import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-cerebral-detail-ultrasound-atlas',site=root+'/atlas',proposal='G:/VisibleMedicine-temp/proposals/20261031-cerebral-detail-ultrasound';
const inspection=json(proposal+'/SOURCE_INSPECTION.json'),baseline=json(root+'/BASELINE.json');
assert.equal(baseline.sourceHead,inspection.parent.head);assert.equal(hash(proposal+'/SOURCE_INSPECTION.json'),'dbda64288e8f1fa38dfe9a8d4aa568c80f79241c31f8713edb14c754cb7df41e');
const rows=[];
for(const row of inspection.sourceFiles){
 assert.equal(hash(proposal+'/files/'+row.path),row.sha256);
 const previous=baseline.sourceRows.find(x=>x.path===row.path);
 if(previous)assert.equal(hash(site+'/'+row.path),previous.sha256);else assert(!fs.existsSync(site+'/'+row.path));
 fs.copyFileSync(proposal+'/files/'+row.path,site+'/'+row.path);
 assert.equal(hash(site+'/'+row.path),row.sha256);
 rows.push({...row,previousSha256:previous?.sha256??null});
}
for(const row of baseline.sourceRows)assert.equal(hash(baseline.source+'/'+row.path),row.sha256);
fs.writeFileSync(root+'/CONTENT.json',JSON.stringify({at:new Date().toISOString(),proposal:{path:proposal+'/SOURCE_INSPECTION.json',sha256:hash(proposal+'/SOURCE_INSPECTION.json')},rows,parentUnchanged:true,canonicalUnchanged:true,installed:false,runtimeValidated:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({appliedSourceFiles:rows.length,newFiles:rows.filter(x=>!x.previousSha256).length,parentUnchanged:true,installed:false}));
