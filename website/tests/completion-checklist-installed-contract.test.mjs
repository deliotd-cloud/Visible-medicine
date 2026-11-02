import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {evidencePath,validateChecklist,renderChecklist,verifyCurrentAtlasInstallation} from '../scripts/refresh-completion-checklist.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const original=JSON.parse(readFileSync(new URL('../docs/completion-checklist.json',import.meta.url)));
const sha=value=>createHash('sha256').update(value).digest('hex');
const bytes=value=>Buffer.from(JSON.stringify(value));
const regions=['head-neck','shoulder','lower-limb','female-pelvis'];
function specimen(){
 const data=structuredClone(original),documents=new Map();
 // Synthetic receipts never inherit live candidate pointers from the register.
 delete data.unpublishedWebsiteCandidate;
 const source='a'.repeat(40),old='b'.repeat(40),tree='c'.repeat(40),oldTree='d'.repeat(40);
 data.updatedAt='2026-11-02';
 // Keep every live checklist item while giving its evidence roots the
 // alphabetic aliases required by evidencePath's existing contract.
 const alias=root=>root.toLowerCase().replace(/[0-9]/g,digit=>['zero','one','two','three','four','five','six','seven','eight','nine'][Number(digit)]);
 for(const [root,path]of Object.entries(data.roots))data.roots[alias(root)]=path;
 for(const item of data.items)item.evidence=item.evidence.map(ref=>ref.replace(/^([^:]+):/,(_match,root)=>alias(root)+':'));
 data.pendingAtlasSource={commit:'e'.repeat(40),tree:'f'.repeat(40),rootDraftPlacements:data.baseline.rootDraftPlacements,rootPendingPlacements:data.baseline.rootPendingPlacements,rootGeneratedIdentificationPlacements:data.baseline.rootGeneratedIdentificationPlacements,websiteImported:false,evidence:'globalbodysearch:SYNTHETIC_PENDING.json',note:'Synthetic pending source for contract tests.'};
 const integrationInput=bytes('input'),reviewSource=bytes('review'),viewerAsset=bytes('viewer'),learnerAsset=bytes('learner');
 const inputs={sourceCommit:source,inputs:[{path:'app/input.ts',sha256:sha(integrationInput)}]};inputs.sha256=sha(JSON.stringify(inputs.inputs));
 const review={revision:source,websiteIntegrationSha256:inputs.sha256,files:[{path:'app/review.ts',importedSha256:sha(reviewSource)}]};
 const viewer={sourceCommit:source,websiteIntegrationSha256:inputs.sha256,personalRecordsIncluded:false,files:[{path:'asset.js',sha256:sha(viewerAsset)}]};
 const snapshotRows=[{path:'app/input.ts',bytes:integrationInput.length,sha256:sha(integrationInput)}];
 const installed={installation:'globalbodysearch:V2_INSTALLATION.json',sourceSnapshot:'globalbodysearch:V2_SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:'0'.repeat(64),readback:'globalbodysearch:V2_READBACK.json',review:{commit:source,tree,integration:inputs.sha256,sourceFiles:1,inputFiles:1,manifestSha256:sha(bytes(review)),inputsSha256:sha(bytes(inputs)),viewerSha256:sha(bytes(viewer))},learners:{}};
 const put=(path,value)=>documents.set(resolve(site,path),value);
 put('app/input.ts',integrationInput);put('atlas-review/app/review.ts',reviewSource);put('public/atlas-review-viewer/asset.js',viewerAsset);
 put('atlas-review/manifest.json',bytes(review));put('atlas-review/integration-inputs.json',bytes(inputs));put('public/atlas-review-viewer/manifest.json',bytes(viewer));
 for(const region of regions){
  const commit=region==='head-neck'?source:old,learner={sourceCommit:commit,patientDataIncluded:false,files:[{path:'asset.js',sha256:sha(learnerAsset)}]};
  const manifest=bytes(learner);installed.learners[region]={commit,tree:commit===source?tree:oldTree,manifestSha256:sha(manifest)};
  put(`public/atlas-runtime/${region}/manifest.json`,manifest);put(`public/atlas-runtime/${region}/asset.js`,learnerAsset);
 }
 const manifestRows=[['atlas-review/manifest.json',installed.review.manifestSha256],['atlas-review/integration-inputs.json',installed.review.inputsSha256],['public/atlas-review-viewer/manifest.json',installed.review.viewerSha256],...regions.map(region=>[`public/atlas-runtime/${region}/manifest.json`,installed.learners[region].manifestSha256])].map(([path,sha256])=>({path,bytes:documents.get(resolve(site,path)).length,sha256}));
 snapshotRows.push(...manifestRows);const snapshot=bytes(snapshotRows);installed.sourceSnapshotSha256=sha(snapshot);
 const receipt={source,tree,review:inputs.sha256,sourceSnapshot:evidencePath(data,installed.sourceSnapshot),sourceSnapshotSha256:installed.sourceSnapshotSha256,controlledInputs:snapshotRows.length,publicDeployment:false,clinicalApproval:false,spatialRegistration:false};
 const receiptBytes=bytes(receipt);installed.installationSha256=sha(receiptBytes);data.installedAtlasSource=installed;
 documents.set(evidencePath(data,installed.installation),receiptBytes);documents.set(evidencePath(data,installed.sourceSnapshot),snapshot);
 const proof={schema:'vm-authenticated-installed-atlas-readback/1',passing:true,existingInstallation:{path:evidencePath(data,installed.installation),sha256:installed.installationSha256},existingInstallationSnapshot:{path:evidencePath(data,installed.sourceSnapshot),sha256:installed.sourceSnapshotSha256},atlasCommit:source,atlasTree:tree,reviewIntegration:inputs.sha256,reviewSources:1,protectedInputs:1,reviewViewerFiles:1,clinicalApproval:false,patientRegistration:false,publicDeployment:false,newInstallationExecuted:false,manifestRows,modules:Object.fromEntries(regions.map(region=>[region,{manifestPath:`public/atlas-runtime/${region}/manifest.json`,manifestSha256:installed.learners[region].manifestSha256,sourceCommit:installed.learners[region].commit,sourceTree:installed.learners[region].tree,files:1,patientDataIncluded:false}]))};
 const proofBytes=bytes(proof);installed.readbackSha256=sha(proofBytes);documents.set(evidencePath(data,installed.readback),proofBytes);
 const options={read:path=>{assert(documents.has(path),'Undeclared source/evidence read: '+path);return documents.get(path);},realpath:path=>path,git:(_repo,ref)=>ref.endsWith('^{tree}')?(ref.startsWith(source)?tree:oldTree):ref.slice(0,40)};
 return{data,documents,options,put};
}
function editReadback(s,edit){
 const c=s.data.installedAtlasSource,path=evidencePath(s.data,c.readback),value=JSON.parse(s.documents.get(path));edit(value);
 const revised=bytes(value);s.documents.set(path,revised);c.readbackSha256=sha(revised);
}
function sourceReadback(s){
 editReadback(s,proof=>{proof.schema='vm-installed-atlas-source-readback/1';proof.authenticatedBrowserVerified=false;});
}
function editReceipt(s,edit){
 const c=s.data.installedAtlasSource,path=evidencePath(s.data,c.installation),value=JSON.parse(s.documents.get(path));edit(value);
 const revised=bytes(value);s.documents.set(path,revised);c.installationSha256=sha(revised);
 editReadback(s,proof=>{proof.existingInstallation.sha256=c.installationSha256;});
}
function editSnapshot(s,edit){
 const c=s.data.installedAtlasSource,path=evidencePath(s.data,c.sourceSnapshot),rows=JSON.parse(s.documents.get(path));edit(rows);
 const revised=bytes(rows);s.documents.set(path,revised);c.sourceSnapshotSha256=sha(revised);
 editReceipt(s,receipt=>{receipt.sourceSnapshotSha256=c.sourceSnapshotSha256;receipt.controlledInputs=rows.length;});
 editReadback(s,proof=>{proof.existingInstallationSnapshot.sha256=c.sourceSnapshotSha256;});
}
test('exact mixed-epoch installed readback succeeds with immutable receipt and all declared bytes',()=>{
 const s=specimen();verifyCurrentAtlasInstallation(s.data,site,s.options);
 assert.equal(s.data.importedAtlasSource.commit,original.importedAtlasSource.commit,'Historical import retained');
});
test('exact source-only readback succeeds while explicitly declining browser and release claims',()=>{
 const s=specimen();sourceReadback(s);verifyCurrentAtlasInstallation(s.data,site,s.options);
 const proof=JSON.parse(s.documents.get(evidencePath(s.data,s.data.installedAtlasSource.readback)));
 for(const field of ['authenticatedBrowserVerified','clinicalApproval','patientRegistration','publicDeployment','newInstallationExecuted'])assert.equal(proof[field],false,field);
});
for(const [name,edit]of [
 ['missing browser-verification flag',proof=>{delete proof.authenticatedBrowserVerified;}],
 ['true browser-verification flag',proof=>{proof.authenticatedBrowserVerified=true;}],
 ])test('source-only readback rejects '+name,()=>{
 const s=specimen();sourceReadback(s);editReadback(s,edit);
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Source readback must explicitly decline authenticated browser verification/);
});
test('source-only readback rejects an altered Review input byte',()=>{
 const s=specimen();sourceReadback(s);s.put('app/input.ts',bytes('tampered'));
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Review input/);
});
test('source-only readback rejects an altered learner byte',()=>{
 const s=specimen();sourceReadback(s);s.put('public/atlas-runtime/shoulder/asset.js',bytes('tampered'));
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/shoulder learner/);
});
test('unknown installed readback schema refuses',()=>{
 const s=specimen();editReadback(s,proof=>{proof.schema='vm-unknown-installed-atlas-readback/1';});
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Unknown installed readback schema/);
});
test('an altered Review input byte fails even when the list closure is unchanged',()=>{
 const s=specimen();s.put('app/input.ts',bytes('tampered'));assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Review input/);
});
test('a missing learner module manifest fails the exact module closure',()=>{
 const s=specimen();s.documents.delete(resolve(site,'public/atlas-runtime/shoulder/manifest.json'));assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options));
});
test('a wrong Review integration closure fails with otherwise valid manifest bytes',()=>{
 const s=specimen();const path=resolve(site,'atlas-review/integration-inputs.json'),value=JSON.parse(s.documents.get(path));value.sha256='0'.repeat(64);
 const changed=bytes(value);s.documents.set(path,changed);s.data.installedAtlasSource.review.inputsSha256=sha(changed);
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Readback manifest|Installation Review|Review input-list closure|Expected values/);
});
test('one commit with conflicting declared trees refuses before Git deduplication',()=>{
 const s=specimen(),different='e'.repeat(40);s.data.installedAtlasSource.learners['head-neck'].tree=different;
 editReadback(s,proof=>{proof.modules['head-neck'].sourceTree=different;});
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/conflicting trees/);
});
for(const [name,edit,pattern]of [
 ['wrong manifest binding',rows=>{rows.find(row=>row.path==='public/atlas-runtime/shoulder/manifest.json').sha256='0'.repeat(64);},/differs from installation snapshot/],
 ['missing original manifest',rows=>{rows.splice(rows.findIndex(row=>row.path==='public/atlas-runtime/shoulder/manifest.json'),1);},/missing from installation snapshot/],
 ['duplicate original manifest',rows=>{rows.push({...rows.find(row=>row.path==='public/atlas-runtime/shoulder/manifest.json')});},/Duplicate installation snapshot path/],
 ])test('original installation snapshot rejects '+name,()=>{const s=specimen();editSnapshot(s,edit);assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),pattern);});
for(const [name,edit]of [
 ['missing current manifest row',rows=>{rows.pop();}],
 ['duplicate current manifest row',rows=>{rows.push({...rows[0]});}],
 ])test('authenticated readback rejects '+name,()=>{
 const s=specimen();editReadback(s,proof=>edit(proof.manifestRows));
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Readback manifest cardinality/);
});
for(const [name,which,pattern]of [
 ['missing receipt','installation',/Undeclared source\/evidence read/],
 ['missing snapshot','sourceSnapshot',/Undeclared source\/evidence read/],
 ['missing readback','readback',/Undeclared source\/evidence read/],
 ['tampered receipt','installation',/Exact immutable installation receipt/],
 ['tampered snapshot','sourceSnapshot',/Exact installation source snapshot/],
 ['tampered readback','readback',/Exact authenticated installed readback/],
 ])test('pinned evidence rejects '+name,()=>{
 const s=specimen(),path=evidencePath(s.data,s.data.installedAtlasSource[which]);
 if(name.startsWith('missing'))s.documents.delete(path);else s.documents.set(path,Buffer.from('tampered'));
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),pattern);
});
test('spatial registration claim in the exact receipt refuses',()=>{
 const s=specimen();editReceipt(s,receipt=>{receipt.spatialRegistration=true;});assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/spatial registration/);
});
test('a stale but internally rehashed installation receipt refuses its source identity',()=>{
 const s=specimen();editReceipt(s,receipt=>{receipt.source='f'.repeat(40);});assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Installation source/);
});
test('patient registration claim in authenticated readback refuses',()=>{
 const s=specimen();editReadback(s,proof=>{proof.patientRegistration=true;});assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Readback has no patient registration/);
});
test('unsafe installed evidence path refuses before any read',()=>{
 const s=specimen();s.data.installedAtlasSource.installation='globalbodysearch:../V2_INSTALLATION.json';
 assert.throws(()=>validateChecklist(s.data),/Unsafe evidence path/);
});
test('a linked Review input escaping the website refuses even with matching bytes',()=>{
 const s=specimen(),originalRealpath=s.options.realpath;s.options.realpath=path=>path===resolve(site,'app/input.ts')?'F:/outside/input.ts':originalRealpath(path);
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/escapes site through link/);
});
test('an unsafe learner artifact path refuses after coherent manifest and snapshot updates',()=>{
 const s=specimen(),region='shoulder',path=`public/atlas-runtime/${region}/manifest.json`;
 const learner=JSON.parse(s.documents.get(resolve(site,path)));learner.files[0].path='../asset.js';
 const changed=bytes(learner),newHash=sha(changed);s.put(path,changed);s.data.installedAtlasSource.learners[region].manifestSha256=newHash;
 editSnapshot(s,rows=>{const row=rows.find(x=>x.path===path);row.sha256=newHash;row.bytes=changed.length;});
 editReadback(s,proof=>{proof.manifestRows.find(row=>row.path===path).sha256=newHash;proof.manifestRows.find(row=>row.path===path).bytes=changed.length;proof.modules[region].manifestSha256=newHash;});
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Unsafe installed path/);
});
test('a wrong learner source manifest refuses the exact installed document',()=>{
 const s=specimen();s.put('public/atlas-runtime/shoulder/manifest.json',bytes({sourceCommit:'0'.repeat(40),patientDataIncluded:false,files:[{path:'asset.js',sha256:sha(bytes('learner'))}]}));
 assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Installed document/);
});
test('altered learner asset refuses declared module closure',()=>{
 const s=specimen();s.put('public/atlas-runtime/shoulder/asset.js',bytes('wrong'));assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/shoulder learner/);
});
test('altered Review imported source refuses declared source closure',()=>{
 const s=specimen();s.put('atlas-review/app/review.ts',bytes('wrong'));assert.throws(()=>verifyCurrentAtlasInstallation(s.data,site,s.options),/Review source/);
});
test('an unpublished website candidate cannot exist without an installed contract',()=>{
 const s=specimen();delete s.data.installedAtlasSource;s.data.unpublishedWebsiteCandidate={sourceReceipt:'globalbodysearch:CANDIDATE.json',sourceReceiptSha256:'1'.repeat(64)};
 assert.throws(()=>validateChecklist(s.data),/requires an installed record/);
});
test('a current pending Atlas source cannot equal the installed Review commit',()=>{
 const s=specimen(),pending=s.data.pendingAtlasSource;pending.websiteImported=false;pending.commit=s.data.installedAtlasSource.review.commit;pending.tree=s.data.installedAtlasSource.review.tree;
 assert.throws(()=>validateChecklist(s.data),/differ from installed Review source/);
});
test('rendering distinguishes audit, historical import, current install and unpublished candidates',()=>{
 const s=specimen(),d=s.data;d.pendingAtlasSource.websiteImported=false;d.pendingAtlasSource.commit='e'.repeat(40);d.pendingAtlasSource.tree='f'.repeat(40);
 d.unpublishedWebsiteCandidate={sourceReceipt:'globalbodysearch:CANDIDATE.json',sourceReceiptSha256:'1'.repeat(64)};
 const rendered=renderChecklist(d);
 for(const label of ['## Recorded audit baseline','## Historical local Atlas import','## Verified current local installation','## Unpublished website candidate','Pending Atlas source:'])assert(rendered.includes(label),label);
 assert(!rendered.includes('Historical Pending Atlas source:'));
 assert(rendered.includes('This unpublished Atlas source is not installed in the current website'));
});
