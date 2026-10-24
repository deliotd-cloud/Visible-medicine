import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261024-studio-route-website',site=stage+'/website',read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex'),prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),proposal=json(prep.proposalReceipt);
test('complete Website composition contains exactly the verified Studio proposal and no other changed parent source',()=>{
 assert.equal(sha(read(prep.parentReceipt)),'37ea31d0ab36e57311e11dcdb9c01a93770220cbf8c40d439fa35b08aff9c968');assert.equal(sha(read(prep.proposalReceipt)),'3d1845cd2f6734797a5d6af1551f30bf2d27ca6a25f0a32892b41c7761898f71');const changed=[];
 for(const r of parent.sourceRows){assert.equal(sha(read(parent.website+'/'+r.path)),r.sha256);const current=sha(read(site+'/'+r.path));if(current!==r.sha256){changed.push(r.path);assert.equal(current,proposal.sourceRows.find(p=>p.path===r.path)?.sha256);}}
 assert.deepEqual(new Set(changed),new Set(proposal.changedAuthoredPaths));assert.equal(changed.filter(p=>!p.startsWith('tests/')).length,1);for(const p of proposal.newPaths)assert.equal(sha(read(site+'/'+p)),proposal.sourceRows.find(r=>r.path===p).sha256);
});
test('all source-bound clinical Review inputs and production delivery remain exact without approval or display-revision transfer',()=>{
 const inputs=json(site+'/atlas-review/integration-inputs.json');assert.equal(inputs.sha256,'c8bdd276ab1f832ec5e6854df40bbd83102c7a4dbfe99c5cdde87aad89b5815d');assert.equal(inputs.inputs.length,1806);assert.deepEqual(read(site+'/atlas-review/integration-inputs.json'),read(parent.website+'/atlas-review/integration-inputs.json'));
 for(const r of inputs.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);assert(!inputs.inputs.some(r=>proposal.changedAuthoredPaths.includes(r.path)));
 const delivery=json(site+'/public/atlas-review-viewer/manifest.json');assert.equal(delivery.files.length,54);assert.equal(delivery.packages.length,24);assert.equal(delivery.personalRecordsIncluded,false);assert.deepEqual(delivery,json(parent.website+'/public/atlas-review-viewer/manifest.json'));
 for(const r of parent.sourceRows.filter(r=>r.path.startsWith('public/atlas-review-viewer/')||r.path.startsWith('atlas-review/')))assert.deepEqual(read(site+'/'+r.path),read(parent.website+'/'+r.path));
});
