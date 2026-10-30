import fs from 'node:fs';import assert from 'node:assert/strict';
import{hash,json}from'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-quick-review',site=root+'/website',prep=json(root+'/PREPARED.json'),parent=json(prep.parent.path),changed=[];
const added=['components/ClinicalReviewQuickStart.tsx','components/clinical-review-quick-start.css','lib/clinical-review-quick-start.ts','tests/clinical-review-quick-start.test.mjs','tests/clinical-review-quick-start-ui.test.mjs','tests/quick-review-source-role.mjs','tests/fixtures/quick-review-source-transition.json'];
const rows=parent.sourceRows.map(r=>{const digest=hash(site+'/'+r.path);if(digest!==r.sha256){assert(fs.existsSync(root+'/before/'+r.path),r.path);assert.equal(hash(root+'/before/'+r.path),r.sha256,r.path);changed.push(r.path);}return{path:r.path,bytes:fs.statSync(site+'/'+r.path).size,sha256:digest};});
for(const p of added){assert(!rows.some(r=>r.path===p));rows.push({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)});}
for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
for(const r of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const source={...parent,schema:'vm-quick-review-website-source/1',at:new Date().toISOString(),website:site,parent:prep.parent,sourceRows:rows.sort((a,b)=>a.path.localeCompare(b.path)),sourcePaths:rows.length,changedPaths:changed,addedPaths:added,removedPaths:[],wholeProjectTypesPassed:false,wholeWebsiteProductionBuildPassed:false,wholeSuitePassing:false,installed:false,normalPreviewChanged:false};
const output=root+'/'+(process.argv[2]??'WEBSITE_SOURCE.json');
fs.writeFileSync(output,JSON.stringify(source,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceFiles:rows.length,changed:changed.length,added:added.length,sha256:hash(output)}));
