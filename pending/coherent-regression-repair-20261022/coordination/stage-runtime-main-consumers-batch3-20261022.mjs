import assert from 'node:assert/strict';
import {existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-runtime-main-consumers-batch3';
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const sourceReceipt=website+'/../VERIFIED_SOURCE.json';
assert.equal(sha(read(sourceReceipt)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const names=['atlas-foot-venous-xray-current.test.mjs','atlas-guided-camera.test.ts','atlas-hand-bone-ultrasound.test.ts'];
const receipt=json(sourceReceipt);
const originals=names.map(name=>{const relative='tests/'+name,row=receipt.sourceRows.find(r=>r.path===relative);assert(row);assert.equal(sha(read(website+'/'+relative)),row.sha256);return{name,relative,...row};});
const mode=process.argv[2];assert(mode==='--prepare'||mode==='--verify');
if(mode==='--prepare'){
 assert(!existsSync(root));mkdirSync(root+'/preimage/tests',{recursive:true});mkdirSync(root+'/proposals/tests',{recursive:true});
 for(const row of originals){copyFileSync(website+'/'+row.relative,root+'/preimage/'+row.relative+'.raw');copyFileSync(website+'/'+row.relative,root+'/proposals/'+row.relative);}
 writeFileSync(root+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),website,sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),files:originals},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({prepared:root,files:originals.length,frozenCandidateEdited:false}));
}else{
 assert(!existsSync(root+'/VERIFIED.json'));
 const inverseEdits={
  'atlas-foot-venous-xray-current.test.mjs':[
   ['manifest.sourceCommit, delivery.runtimeSources[name], name','manifest.sourceCommit, source, name'],
   ['item.sourceCommit, delivery.runtimeSources[name]','item.sourceCommit, source'],
   ['`${delivery.runtimeSources[name]}:${path}`','`${source}:${path}`'],
  ],
  'atlas-guided-camera.test.ts':[
   ['import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}','import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot}'],
   ['  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,currentAtlas);\n',''],
   ['manifest.sourceCommit,pin.runtimeSources[name],`${name}: current source revision`','manifest.sourceCommit,currentAtlas,`${name}: current source revision`'],
   ['sha(atlas(pin.runtimeSources[name],cameraPath))','sha(source)'],
  ],
  'atlas-hand-bone-ultrasound.test.ts':[
   ['manifest.sourceCommit,pin.runtimeSources[name]','manifest.sourceCommit,CURRENT_ATLAS_REVISION'],
  ],
 };
 const repairs=[];
 for(const row of originals){
  const beforePath=root+'/preimage/'+row.relative+'.raw',proposal=root+'/proposals/'+row.relative,before=read(beforePath),bytes=read(proposal);
  assert.equal(sha(before),row.sha256);assert.deepEqual(before,read(website+'/'+row.relative));let text=bytes.toString();const eol=text.includes('\r\n')?'\r\n':'\n';
  for(const [a,b]of inverseEdits[row.name]){const from=a.replaceAll('\n',eol),to=b.replaceAll('\n',eol);assert.equal(text.split(from).length,2,row.name+': unique inverse '+a);text=text.replace(from,to);}
  assert.equal(text,before.toString(),'Whole original source '+row.name);
  repairs.push({path:row.relative,beforePath,beforeSha256:sha(before),proposal,proposalSha256:sha(bytes),wholeSourceInverse:true,nativeRootRerun:false});
 }
 const pin=json(website+'/tests/fixtures/current-atlas-delivery.json');
 assert.equal(pin.source,receipt.source);assert.equal(pin.reviewIntegration,receipt.review);
 // This is a deliberately narrow text/source proof, not execution of the stock validator or medical roots.
 for(const [p,digest]of Object.entries(pin.documents))assert.equal(sha(read(website+'/'+p)),digest,p);
 const atlas='F:/VisibleMedicine/atlas',gitAt=(revision,p)=>runGit(['-C',atlas,'show',revision+':'+p]);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),pin.source);
 assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
 const sourceInputs=[];
 const required=['content/foot-venous-arch-xray-pins.json','content/foot-venous-arch-xray.ts','lib/foot-venous-arch-xray.ts','lib/hand-bone-ultrasound.ts','content/hand-bone-ultrasound.ts','content/hand-bone-ultrasound-pins.json'];
 for(const [name,revision]of Object.entries(pin.runtimeSources)){
  const base=website+'/public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');assert.equal(manifest.sourceCommit,revision);
  for(const p of ['app/fitted-camera.tsx',...required]){
   const row=inputs.find(r=>r.path===p),expected=p==='app/fitted-camera.tsx'||name==='head-neck'||name==='shoulder';assert.equal(Boolean(row),expected,name+':'+p);
   if(row){const bytes=gitAt(revision,p);assert.equal(row.sha256,sha(bytes),name+': admitted committed source '+p);sourceInputs.push({module:name,path:p,source:revision,sha256:sha(bytes),matchesCurrentReviewSource:sha(bytes)===sha(gitAt(pin.source,p))});}
  }
 }
 const result={at:new Date().toISOString(),website,source:pin.source,review:pin.reviewIntegration,repairs,sourceInputs,completeOriginalInverses:3,currentPinDocumentsExact:true,sourceInputsAtAdmittedFamilyEpoch:true,validatorsOrPinsChanged:false,frozenOrCanonicalEdited:false,medicalNativeChecksRerun:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false};
 writeFileSync(root+'/VERIFIED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({receipt:root+'/VERIFIED.json',sha256:sha(read(root+'/VERIFIED.json')),wholeOriginalInverses:3,actualSourceInputs:sourceInputs.length,allSourceInputsMatchCurrentReview:sourceInputs.every(r=>r.matchesCurrentReviewSource),nativeRootsRerun:false}));
}
