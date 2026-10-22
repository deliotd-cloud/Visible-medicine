import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-runtime-family-batch2-v2',website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const mode=process.argv[2];assert(mode==='--prepare'||mode==='--verify');
const surface='F:/VisibleMedicine/staging/20261022-foot-surface-loader-diagnostic';
const followup='F:/VisibleMedicine/staging/20261022-foot-ultrasound-followup-loader-diagnostic';
const femoral='F:/VisibleMedicine/staging/20261022-femoral-projection-admission-diagnostic';
const notice='F:/VisibleMedicine/staging/20261022-foot-notice-admission-proposal';
const specs=[
 ['atlas-femoral-clinical.test.ts',femoral+'/atlas-femoral-clinical.test.ts.raw-preimage',femoral+'/atlas-femoral-clinical.test.ts.proposed','de7b83bc5ff2c805349aa679f8cb5de1835f0897754f62d5020f13b8cf61ead7',[
  ['  const pin=validateCurrentAtlasDelivery();\n  const source=CURRENT_ATLAS_REVISION;\n  assert.equal(source,pin.source);','  const source=CURRENT_ATLAS_REVISION;'],
  ['entry.sourceCommit,pin.runtimeSources[entry.module],entry.module','entry.sourceCommit,source,entry.module'],
  ['manifest.sourceCommit,pin.runtimeSources[entry.module],entry.module','manifest.sourceCommit,source,entry.module'],
 ]],
 ['atlas-foot-arterial-projection-xray.test.mjs',femoral+'/atlas-foot-arterial-projection-xray.test.mjs.raw-preimage',femoral+'/atlas-foot-arterial-projection-xray.test.mjs.proposed','2361dc562113dda720fee4fd5a71839b501087e825f40a62f08697f8c2ef226f',[
  ['manifest.sourceCommit, pin.runtimeSources[name], name','manifest.sourceCommit, pin.source, name'],
  ['inventorySource.sourceCommit, pin.runtimeSources[name]','inventorySource.sourceCommit, pin.source'],
  ['`${pin.runtimeSources[name]}:${path}`','`${pin.source}:${path}`'],
 ]],
 ['atlas-foot-surface-imaging-checks.mjs',surface+'/preimage/tests/atlas-foot-surface-imaging-checks.mjs',surface+'/proposed/tests/atlas-foot-surface-imaging-checks.mjs','5c84d857ddb504db0a6ff971694aa5e6e47f590ab4ec205360591d8980c26a80',[
  ["source.sourceCommit,currentPin.runtimeSources[source.module],source.module+':source'","source.sourceCommit,currentSource,source.module+':source'"],
  ["manifest.sourceCommit,currentPin.runtimeSources[source.module],source.module+':manifest'","manifest.sourceCommit,currentSource,source.module+':manifest'"],
 ]],
 ['atlas-foot-ultrasound-followup-current.mjs',followup+'/preimage/tests/atlas-foot-ultrasound-followup-current.mjs',followup+'/proposed/tests/atlas-foot-ultrasound-followup-current.mjs','fc008cb5f8dbe8c993f166f87e671280b35fc6ca0c7333ceafdeedb5a53d78ed',[
  ['import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}','import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot}'],
  ['  const currentPin=validateCurrentAtlasDelivery();\n',''],
  ["manifest.sourceCommit,name==='review'?deliveryRevision:currentPin.runtimeSources[name],name+' source'","manifest.sourceCommit,deliveryRevision,name+' source'"],
  ['source.sourceCommit,currentPin.runtimeSources[name]','source.sourceCommit,deliveryRevision'],
 ]],
 ['atlas-foot-ultrasound-followup-checks.mjs',followup+'/preimage/tests/atlas-foot-ultrasound-followup-checks.mjs',followup+'/proposed/tests/atlas-foot-ultrasound-followup-checks.mjs','8cf64d8032e244ea3ecbed6d8c80e4457595d0930b64fc3daeec69d5546e501e',[
  ["import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",''],
  ['const currentPin = validateCurrentAtlasDelivery();\n',''],
  ["manifest.sourceCommit, name === 'review' ? deliveryRevision : currentPin.runtimeSources[name]",'manifest.sourceCommit, deliveryRevision'],
 ]],
 ['atlas-foot-notice-epoch.test.ts',notice+'/atlas-foot-notice-epoch.test.ts.raw',notice+'/atlas-foot-notice-epoch.test.ts','a7e35bda866019794ea3047cd971b5367f912fab2b2f556a13007cffdc9b1a10',[
  ['import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}','import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot}'],
  ['  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,currentSourceRevision);\n',''],
  ['manifest.sourceCommit, pin.runtimeSources[name]','manifest.sourceCommit, currentSourceRevision'],
  ['exactBytes(delivered, sourceAt(pin.runtimeSources[name]),','exactBytes(delivered, currentSourceNoticeBytes,'],
 ]],
];
if(mode==='--prepare'){
 assert(!existsSync(root));assert.equal(new Set(specs.map(row=>row[0])).size,specs.length);
 for(const[name,before,proposal,expected]of specs){assert.match(expected,/^[a-f0-9]{64}$/);assert.equal(sha(read(proposal)),expected);assert.deepEqual(read(before),read(website+'/tests/'+name));}
 mkdirSync(root+'/proposals/tests',{recursive:true});mkdirSync(root+'/preimage/tests',{recursive:true});
 for(const[name,before,proposal]of specs){copyFileSync(proposal,root+'/proposals/tests/'+name);copyFileSync(before,root+'/preimage/tests/'+name+'.raw');}
 writeFileSync(root+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),website,files:specs.map(([name,before,proposal,expected])=>({path:'tests/'+name,originalSha256:sha(read(before)),workerOrMainProposal:proposal,workerOrMainProposalSha256:expected})),preserveProjectionRegisteredNameAtMainReview:true,frozenCandidateEdited:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({prepared:root,files:6,next:'Keep the original projection test registration in the main-owned copy, then --verify'}));
}else{
 assert(!existsSync(root+'/VERIFIED.json'));const results=[];
 for(const[name,beforePath,,workerHash,edits]of specs){
  const before=read(beforePath),proposal=root+'/proposals/tests/'+name,bytes=read(proposal),text=bytes.toString();assert.deepEqual(before,read(website+'/tests/'+name));
  const newline=text.includes('\r\n')?'\r\n':'\n';let inverse=text;
  for(const[from,to]of edits){const a=from.replaceAll('\n',newline),b=to.replaceAll('\n',newline);assert.equal(inverse.split(a).length,2,'Unique inverse '+name+':'+a.slice(0,70));inverse=inverse.replace(a,b);}
  assert.equal(inverse,before.toString(),'Entire original source and registered checks '+name);
  results.push({path:'tests/'+name,beforePath:root+'/preimage/tests/'+name+'.raw',beforeSha256:sha(before),proposal,proposalSha256:sha(bytes),workerOrMainProposalSha256:workerHash,wholeSourceInverse:true,nativeRootRerun:false});
 }
 const previousPath='F:/VisibleMedicine/staging/20261022-regression-repair-queue/QUEUE.json';assert.equal(sha(read(previousPath)),'6f2687ed182588c0ceb3b867b651fc195e7ccefd467c5f96753a9ad08f90a6c3');
 const previous=json(previousPath),combined=[...previous.repairs,...results];assert.equal(combined.length,13);assert.equal(new Set(combined.map(row=>row.path)).size,13);
 for(const row of combined){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(website+'/'+row.path)),row.beforeSha256);}
 const noticeProof=notice+'/SOURCE_PROOF.json';assert.equal(sha(read(noticeProof)),'7d098ca6ff64977116b69fe95934a24db91156d74473328da1cf78487876a550');
 const receipt={at:new Date().toISOString(),website,source:previous.source,review:previous.review,previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),repairs:combined,additionalFiles:previous.additionalFiles,newWholeSourceInverses:6,allWholeSourceInverses:13,footNoticeSourceProof:noticeProof,footNoticeSourceProofSha256:sha(read(noticeProof)),projectionRegistrationRetained:true,allValidatorsAndPinsUnchanged:true,frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,sourceBackupIncludesThisWholeBatch:false,clinicalApproval:false,publicDeployment:false,next:previous.next};
 writeFileSync(root+'/VERIFIED.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/VERIFIED.json',sha256:sha(read(root+'/VERIFIED.json')),proposedFiles:13,wholeSourceInversesVerified:13,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:previous.sourceBackup,next:receipt.next};pointer.activeWork.updated=receipt.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
 console.log(JSON.stringify({receipt:root+'/VERIFIED.json',sha256:sha(read(root+'/VERIFIED.json')),newWholeSourceInverses:6,totalWholeSourceInverses:13,nativeRootsRerun:false,frozenCandidateEdited:false}));
}
