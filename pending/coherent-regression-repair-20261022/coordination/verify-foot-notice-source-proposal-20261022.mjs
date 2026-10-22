import assert from 'node:assert/strict';
import {existsSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-foot-notice-admission-proposal',prepared=json(root+'/PREPARED.json'),website=prepared.website;
assert(!existsSync(root+'/SOURCE_PROOF.json'));
const before=read(root+'/atlas-foot-notice-epoch.test.ts.raw'),after=read(root+'/atlas-foot-notice-epoch.test.ts');
assert.equal(sha(before),prepared.originalSha256);assert.equal(sha(read(website+'/'+prepared.path)),prepared.originalSha256);
assert.equal(sha(after),'a7e35bda866019794ea3047cd971b5367f912fab2b2f556a13007cffdc9b1a10');
const newline=after.includes(Buffer.from('\r\n'))?'\r\n':'\n';
const changes=[
 ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot}"],
 ['  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,currentSourceRevision);\n',''],
 ['manifest.sourceCommit, pin.runtimeSources[name]','manifest.sourceCommit, currentSourceRevision'],
 ['exactBytes(delivered, sourceAt(pin.runtimeSources[name]),','exactBytes(delivered, currentSourceNoticeBytes,'],
];
let inverse=after.toString();for(const[from,to]of changes){const a=from.replaceAll('\n',newline),b=to.replaceAll('\n',newline);assert.equal(inverse.split(a).length,2);inverse=inverse.replace(a,b);}
assert.equal(inverse,before.toString(),'Every original registered test and full historical/medical/model/license/refusal assertion survives exact inverse');
assert(prepared.families.every(row=>row.modelEntriesUnchanged&&row.dependencies.every(file=>file.unchanged)));
const priorProof='F:/VisibleMedicine/staging/20261022-css-notice-admission-proposal/SOURCE_PROOF.json';
assert.equal(sha(read(priorProof)),'e76fb9265f38f4d5d5461e51c7fe2b827596daaf3506a80a6052a09cec08e3f6');
const sourceProof=json(priorProof);assert(sourceProof.protectedViewerCompleteHistoricalDependencyTailRetained);
const api=await import(pathToFileURL(website+'/tests/current-atlas-delivery.mjs').href),pin=api.validateCurrentAtlasDelivery(),atlas=api.currentAtlasDeliveryRoot();
assert.equal(pin.source,sourceProof.source);assert.equal(pin.reviewIntegration,sourceProof.review);
const notice='LICENSES/THIRD_PARTY_NOTICES.md',preEpoch=prepared.historical;
const preNotice=runGit(['-C',website,'show',preEpoch+':atlas-review/'+notice]).toString().replaceAll('\r','');
const sourceFoot=runGit(['-C',atlas,'show','cdc6ad23ad5c3c13a2f6588019a057d0a063818f:'+notice]).toString().replaceAll('\r','');
assert(sourceFoot.startsWith(preNotice));const appendix=sourceFoot.slice(preNotice.length);
assert.equal(sha(Buffer.from(appendix)),'d8b0616fa0f847300666bd698efe385464e961d54e35ac0b389487bcc230cb5f');
const families=[];
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
 const base='public/atlas-runtime/'+name+'/',manifest=json(website+'/'+base+'manifest.json');assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
 const bytes=read(website+'/'+base+notice),committed=runGit(['-C',atlas,'show',pin.runtimeSources[name]+':'+notice]);assert.deepEqual(bytes,committed);
 const text=bytes.toString().replaceAll('\r','');assert(text.includes(appendix));assert.equal(text.indexOf(appendix),text.lastIndexOf(appendix),'No duplicate original foot appendix');
 assert.equal(sha(bytes),sourceProof.families.find(row=>row.name===name).noticeSha256);
 families.push({name,source:pin.runtimeSources[name],exactFamilySourceNotice:true,completeOriginalFootAppendixOnce:true});
}
const result={at:new Date().toISOString(),website,path:prepared.path,originalSha256:sha(before),proposal:root+'/atlas-foot-notice-epoch.test.ts',proposalSha256:sha(after),completeOriginalSourceInverse:true,actualFamilySourceAndFootAppendix:families,modelMetadataAndDependencyFilesUnchangedAtPreparation:true,protectedViewerTailEvidence:priorProof,protectedViewerTailEvidenceSha256:sha(read(priorProof)),nativeRootRerun:false,modelBinaryBytesRehashedThisProof:false,frozenOrCanonicalEdited:false,heavyBuildOrBroadValidation:false,clinicalApproval:false,publicDeployment:false};
writeFileSync(root+'/SOURCE_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/SOURCE_PROOF.json',sha256:sha(read(root+'/SOURCE_PROOF.json')),wholeSourceInverse:true,actualFamilyNotices:4,completeOriginalFootAppendix:true,nativeRootRerun:false}));
