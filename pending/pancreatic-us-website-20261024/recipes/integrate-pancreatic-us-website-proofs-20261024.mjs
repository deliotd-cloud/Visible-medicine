import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-pancreatic-us-website',site=stage+'/website',proposal='F:/VisibleMedicine/staging/20261024-pancreatic-us-website-role-proposal';
assert.equal(hash(proposal+'/HANDOFF.json'),'11cf34ea575d0954566ff06a80e2fd37879c4ee44b09b46ed5825e066b6d15cc');
const handoff=json(proposal+'/HANDOFF.json'),capture=json(stage+'/CAPTURE.json'),captureSha=hash(stage+'/CAPTURE.json'),prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),records=[];
assert.equal(handoff.nativeHead,prep.atlasHead);assert.equal(handoff.nativeTree,prep.atlasTree);
for(const[n,digest]of Object.entries(handoff.files)){
 const from=proposal+'/'+n,to=site+'/tests/'+n;assert.equal(hash(from),digest);assert(!fs.existsSync(to));let text=fs.readFileSync(from,'utf8');
 if(n==='pancreatic-us-current-source-role.mjs'){assert.equal(text.split('__PIN_MAIN_CAPTURE_SHA256__').length,2);text=text.replace('__PIN_MAIN_CAPTURE_SHA256__',captureSha);}
 fs.writeFileSync(to,text,{flag:'wx'});records.push({path:'tests/'+n,proposalSha256:digest,sha256:hash(to)});
}
const helper='tests/adjacent-current-tour-source-role.mjs',old=fs.readFileSync(site+'/'+helper,'utf8'),addedImport=handoff.adjacentHelperInsertion.importExactlyOnce,branch=handoff.adjacentHelperInsertion.branch,seam=handoff.adjacentHelperInsertion.branchBefore;
assert.equal(old.split(seam).length,2);const current=addedImport+old.replace(seam,branch+seam);assert.equal(current.replace(addedImport,'').replace(branch,''),old);fs.writeFileSync(site+'/'+helper,current);records.push({path:helper,beforeSha256:hash(stage+'/preimages/'+helper+'.raw'),afterSha256:hash(site+'/'+helper),addedImport,branch,wholeOriginalInverseVerified:true});
const test='tests/current-atlas-delivery.test.mjs',before=fs.readFileSync(site+'/'+test,'utf8'),oldCount=handoff.deliveryTestInsertion.replaceCountAssertionOnce,newCount=`assert.equal(sourceFiles,${capture.sourceFiles});assert.equal(inputs,${capture.inputs});assert(artifacts>100);`;
assert.equal(before.split(parent.atlasHead).length,6);assert.equal(before.split(parent.atlasTree).length,2);assert.equal(before.split(oldCount).length,2);
const after=before.replaceAll(parent.atlasHead,prep.atlasHead).replace(parent.atlasTree,prep.atlasTree).replace(oldCount,newCount);
assert.equal(after.replaceAll(prep.atlasHead,parent.atlasHead).replace(prep.atlasTree,parent.atlasTree).replace(newCount,oldCount),before);fs.writeFileSync(site+'/'+test,after);
records.push({path:test,beforeSha256:hash(stage+'/preimages/'+test+'.raw'),afterSha256:hash(site+'/'+test),sourceSeams:5,treeSeams:1,oldCount,newCount,wholeOriginalInverseVerified:true});
fs.writeFileSync(stage+'/PROOF_INTEGRATION.json',JSON.stringify({at:new Date().toISOString(),handoff:proposal+'/HANDOFF.json',handoffSha256:hash(proposal+'/HANDOFF.json'),captureSha256:captureSha,records,previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({captureSha256:captureSha,files:records.length,source:prep.atlasHead,reviewSourceFiles:capture.sourceFiles,inputs:capture.inputs}));
