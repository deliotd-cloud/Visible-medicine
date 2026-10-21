import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-review-return-application',prep=json(stage+'/PREPARATION.json');
const inputs=new Map(json(prep.priorSnapshot).map(row=>[row.path,row]));
for(const row of prep.changes){
 const target=prep.site+'/'+row.path,expected=read(row.from).toString(),actual=read(target).toString(),normal=value=>value.replaceAll('\r\n','\n');
 assert.equal(normal(actual),normal(expected),'Only mechanical EOL formatting is permitted after patch');
 const endings=expected.match(/\r?\n/g)??[],lines=normal(actual).split('\n');assert.equal(lines.at(-1),'');assert.equal(lines.length-1,endings.length);
 const bytes=Buffer.from(lines.slice(0,-1).map((line,i)=>line+endings[i]).join(''));assert.equal(sha(bytes),row.sha256);
 if(sha(read(target))!==row.sha256)fs.writeFileSync(target,bytes);
 assert.equal(sha(read(target)),row.sha256);inputs.set(row.path,{path:row.path,bytes:bytes.length,sha256:row.sha256});
}
assert.equal(inputs.size,5155);for(const row of inputs.values())assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
const bound=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,prep.review);assert.equal(bound.inputs.length,1710);
for(const row of bound.inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
const rows=[...inputs.values()].sort((a,b)=>a.path.localeCompare(b.path));
fs.writeFileSync(stage+'/SOURCE_INPUTS_AFTER.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
const result={at:new Date().toISOString(),site:prep.site,source:prep.source,review:prep.review,paths:2,sourceInputs:5155,reviewBindings:1710,
 exactPostimages:true,untouchedPreimages:true,sourceSnapshot:stage+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(stage+'/SOURCE_INPUTS_AFTER.json')),
 stagedNativeChecks:40,actualSiteNativeChecksPending:true,freshTypesPending:true,productionBuildPending:true,browserAcceptancePending:true,
 canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,fullSuitePassingClaim:false};
fs.writeFileSync(stage+'/APPLICATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
