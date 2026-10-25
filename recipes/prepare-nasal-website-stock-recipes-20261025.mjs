import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261025-nasal-bone-website',prepFile=stage+'/PREPARATION.json';assert.equal(hash(prepFile),'78017eb848d9d94e8d1d9689d9f3787b6d0054b06982b22aa60c72fafa20fc40');const prep=json(prepFile),site=prep.website,oldStage='20261025-abdominal-us-website',newStage='20261025-nasal-bone-website';
const rows=[];
function recipe(from,to,edits=[]){let s=fs.readFileSync(from,'utf8');assert(s.includes(oldStage));s=s.replaceAll(oldStage,newStage);for(const[a,b]of edits){assert(s.includes(a),a);s=s.replaceAll(a,b);}fs.writeFileSync(to,s,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});rows.push({from,fromSha256:hash(from),to,toSha256:hash(to)});}
recipe('import-abdominal-us-website-stock-small-20261025.mjs','import-nasal-website-stock-20261025.mjs',[
 ['b26c6059a35ac212d800e9f0112d853c750c46e509618b22e1dd345b9e573e23',hash(prepFile)],
 ["['content/abdominal-arterial-ultrasound.ts','lib/abdominal-arterial-ultrasound.ts']","['content/nasal-bone-surface-imaging.ts','lib/nasal-bone-surface-imaging.ts']"],['abdominal-us-website-stock-import','nasal-website-stock-import'],
]);
recipe('generate-abdominal-us-website-coverage-20261025.mjs','generate-nasal-website-coverage-20261025.mjs');
recipe('build-abdominal-us-website-review-20261025.mjs','build-nasal-website-review-20261025.mjs', [['1612','1614'],['1816','1818']]);
recipe('refresh-abdominal-us-website-delivery-pin-20261025.mjs','refresh-nasal-website-delivery-pin-20261025.mjs');
const parent=json(prep.parent.path),native=json(prep.native.path),index=json(site+'/docs/anatomy-coverage/index.json'),sourceRows=new Map(native.sourceRows.map(r=>[r.path,r]));assert.equal(index.sourceRevision,parent.atlasHead);const inputs=Object.entries(index.evidence.sourceInputs),changed=[];assert.equal(inputs.length,171);
for(const [p,before]of inputs){assert.equal(hash(prep.atlas+'/'+p),sourceRows.get(p)?.sha256,p);if(before!==sourceRows.get(p).sha256)changed.push({path:p,beforeSha256:before,afterSha256:sourceRows.get(p).sha256});}assert.deepEqual(changed.map(r=>r.path),['package.json']);
fs.writeFileSync(stage+'/NEXT_RECIPES.json',JSON.stringify({at:new Date().toISOString(),rows,completePriorCoverageInputCount:inputs.length,changedCoverageInputs:changed,authoredCodeUnchangedExceptActualRevisionAndHashSeams:true,clinicalApproval:false},null,2),{flag:'wx'});console.log(JSON.stringify({recipes:rows.length,coverageInputs:171,changedCoverageInputs:changed}));
