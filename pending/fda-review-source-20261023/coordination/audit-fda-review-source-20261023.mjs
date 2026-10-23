import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-fda-review-source',root=stage+'/atlas',proposal='F:/VisibleMedicine/staging/20261023-review-ssr-framework-compat';
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),json=p=>JSON.parse(fs.readFileSync(p));
assert.equal(hash(proposal+'/SEALED_RECEIPT.json'),'6eb852c4abe9f0128fff37eaeba4346178cc22e198dc0d7c4cc97b81f72e7777');
const readme=json(proposal+'/SEALED_RECEIPT.json');assert.equal(hash(proposal+'/FORWARD.patch'),readme.proposal.forwardPatchSha256);
for(const check of readme.checks)assert.equal(hash(proposal+'/'+check.log),check.logSha256);
for(const [file,pinned]of [['scripts/review-ssr-vinext-navigation.mjs',readme.proposal.newFixtureSha256],['scripts/test-review-entry-track.mjs',readme.proposal.proposedEntryTrackSha256]])assert.equal(hash(root+'/'+file),pinned);
// First reverse the independent framework fixture seams, then all three FDA
// legacy-proof seams; recover the complete original356-source validator.
const source=fs.readFileSync(root+'/scripts/validate-specimen-review.mjs','utf8');let inverse=source;
const framework=[
 ['import {vinextNavigation,withVinextAppRouter} from \'./review-ssr-vinext-navigation.mjs\';\n',''],
 ["  require: id => id === 'next/navigation' ? vinextNavigation : require(id),\n  console,",'  require,\n  console,'],
 ['    withVinextAppRouter(React,React.createElement(module.exports.SpecimenReviewWorkspace, {','    React.createElement(module.exports.SpecimenReviewWorkspace, {'],
 ['      invalid: false,\n    })),','      invalid: false,\n    }),'],
];
for(const[from,to]of framework){assert.equal(inverse.split(from).length,2);inverse=inverse.replace(from,to);}
const legacy=json(stage+'/validator-preservation/INVERSE.json');assert.equal(createHash('sha256').update(inverse).digest('hex'),legacy.currentSha256);
for(const[from,to]of [...legacy.seams].reverse()){assert.equal(inverse.split(to).length,2);inverse=inverse.replace(to,from);}
assert.equal(createHash('sha256').update(inverse).digest('hex'),legacy.originalSha256);assert.equal(legacy.originalSha256,readme.proposal.originalValidatorSha256);
const pilotBefore=json(stage+'/pilot-refresh/first-release-review-pilot.before.json'),pilot=json(root+'/docs/first-release-review-pilot.json');
assert.equal(pilot.approval,false);assert.equal(pilot.clinicalRecordsRead,false);assert.equal(pilot.entries.length,11);
for(const [i,p]of pilot.entries.entries())for(const key of ['kind','fmaId','name','laterality','structureId','regions','parentId','study','decision'])assert.deepEqual(p[key],pilotBefore.entries[i][key],key);
assert(pilot.entries.every(e=>e.context.revisions.imaging===null&&e.context.blockers.imaging.length>0&&e.decision==='not-recorded-in-this-index'));
const originalReport=JSON.parse(fs.readFileSync('F:/VisibleMedicine/staging/20261023-fda-shoulder-reference/atlas/docs/specimen-review-validation.json'));
assert.deepEqual(json(root+'/docs/specimen-review-validation.json'),originalReport);
const build=json(stage+'/checks/build/TERMINAL.json');assert.equal(build.code,0);for(const k of ['stdout','stderr'])assert.equal(hash(stage+'/checks/build/'+k+'.log'),build[k+'Sha256']);
const files=[];function walk(directory,prefix=''){for(const e of fs.readdirSync(directory,{withFileTypes:true})){assert(!e.isSymbolicLink());const p=prefix+e.name;if(e.isDirectory())walk(directory+'/'+e.name,p+'/');else files.push({path:p,bytes:fs.statSync(directory+'/'+e.name).size,sha256:hash(directory+'/'+e.name)});}}walk(root+'/dist');files.sort((a,b)=>a.path.localeCompare(b.path));
fs.writeFileSync(stage+'/BUILD_ARTIFACTS.json',JSON.stringify({at:new Date().toISOString(),command:'Original npm run build',files,ownerPreviewChanged:false,publiclyDeployed:false},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/MAIN_AUDIT.json',JSON.stringify({at:new Date().toISOString(),completeOriginalValidatorRecovered:true,mainSeams:3,workerSeams:4,entryTrackSeams:3,workerReceipt:proposal+'/SEALED_RECEIPT.json',workerReceiptSha256:hash(proposal+'/SEALED_RECEIPT.json'),originalLegacyReportUnchanged:true,elevenUnsignedPilotIdentityFieldsUnchanged:true,clinicalRecordsRead:false,geometryOrSourceCatalogChanged:false,privateDecisionsMigrated:false,buildArtifacts:files.length,fullWebsiteIntegration:false,fullSuitePassing:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({completeValidatorInverse:true,originalLegacyReportExact:true,unsignedPilot:11,productionFiles:files.length,productionBytes:files.reduce((n,r)=>n+r.bytes,0)}));
