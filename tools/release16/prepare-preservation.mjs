import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261031-release16-main',a='G:/VisibleMedicine-temp/proposals/20261031-release16-preservation-a',b='G:/VisibleMedicine-temp/proposals/20261031-release16-preservation-b',parent=json('G:/VisibleMedicine-temp/staging/20261031-release14-family-epoch-ready/SOURCE.json');
const am=json(a+'/MANIFEST.json'),bm=json(b+'/MANIFEST.json'),rows=[];
assert(fs.readFileSync(a+'/tests/release16-preservation-line-delta.mjs','utf8').includes('2_000_000'),'Bounded diff matrix required before admission');
for(const witness of am.actualHistoricalWitnesses)assert.equal(hash(witness.path),witness.sha256,'Historical witness changed');
for(const p of am.integration.copyPaths){const r=am.files.find(r=>r.path===p);assert(r);rows.push({path:p,before:am.beforeAfter.find(x=>x.path===p)?.beforeSha256??null,after:r.sha256,from:a+'/'+p});}
for(const r of bm.files)rows.push({path:r.path,before:r.beforeSha256,after:r.afterSha256,from:b+'/'+r.path});
for(const r of rows){assert.equal(hash(r.from),r.after,r.path);assert.equal(parent.sourceRows.find(p=>p.path===r.path)?.sha256??null,r.before,r.path);}
fs.writeFileSync(root+'/PRESERVATION_ADMITTED.json',JSON.stringify({at:new Date().toISOString(),proposals:[a,b].map(p=>({path:p+'/MANIFEST.json',sha256:hash(p+'/MANIFEST.json')})),rows,mainReviewed:true,productUnchanged:true},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({files:rows.length}));
