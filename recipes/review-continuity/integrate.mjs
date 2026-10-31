import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-review-continuity-ready',prepared=json(root+'/PREPARED.json'),parent=json(prepared.parent.path),site=prepared.website;
const proposal='G:/VisibleMedicine-temp/proposals/20261031-quick-review-return-focus/website';
const files=[
 ['components/ClinicalReviewInbox.tsx','3d465094abf32796d8baa72d0f131011873d989d7ac8ce9c0a0517cb289c1299','bf300c65bb4b6af2482ecad157d160e3a95d72d60e10ecca2e34926171e01ec4'],
 ['components/ClinicalReviewQuickStart.tsx','72b7386a5561cb3d801b908d833ac2b050f25960c66d5bfe383e5d6f686aeebc','c18b0250a4b824d8eb9519f7962351aef7225dab350bfc24d64ac4a603738626'],
 ['tests/clinical-review-quick-return-focus.test.ts',null,'ed7c1ccc17b234b3c41e798b3d7ba05709e102234e8b0b19f610ff100fbd616f'],
];
const repairs=json(prepared.testProposal.path);assert.equal(hash(prepared.parent.path),prepared.parent.sha256);
for(const row of parent.sourceRows){const repair=repairs.files.find(r=>r.path===row.path);assert.equal(hash(site+'/'+row.path),repair?.sha256??row.sha256,row.path);}
for(const[p,before,after]of files){if(before)assert.equal(hash(site+'/'+p),before);else assert(!fs.existsSync(site+'/'+p));assert.equal(hash(proposal+'/'+p),after);fs.copyFileSync(proposal+'/'+p,site+'/'+p);}
const rows=new Map(parent.sourceRows.map(r=>[r.path,r]));for(const r of repairs.files)rows.set(r.path,{...rows.get(r.path),sha256:hash(site+'/'+r.path),bytes:fs.statSync(site+'/'+r.path).size});
for(const[p]of files)rows.set(p,{path:p,sha256:hash(site+'/'+p),bytes:fs.statSync(site+'/'+p).size});
const result={schema:'vm-review-continuity-source/1',at:new Date().toISOString(),parent:prepared.parent,website:site,websiteHead:parent.websiteHead,atlas:parent.atlas,sourceRows:[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path)),changedPaths:[...prepared.changedTestPaths,...files.filter(r=>r[1]).map(r=>r[0])],addedPaths:files.filter(r=>!r[1]).map(r=>r[0]),proposalPaths:files.map(([p,before,after])=>({path:p,before,after})),review:json(site+'/atlas-review/integration-inputs.json').sha256,installed:false,productionBuildPassed:false};
assert.equal(result.review,'1f36393188a11f9e8ff56cb54ff3cd9d50c504f3b47de3e21cde422b2104e996');
for(const r of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({sourceSha256:hash(root+'/SOURCE.json'),files:result.sourceRows.length,changed:result.changedPaths.length,added:result.addedPaths.length,reviewUnchanged:true}));
