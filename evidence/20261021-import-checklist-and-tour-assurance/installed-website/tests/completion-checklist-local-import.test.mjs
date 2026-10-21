import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {evidencePath,validateChecklist,renderChecklist,verifyImportedAtlasEvidence} from '../scripts/refresh-completion-checklist.mjs';
const site=fileURLToPath(new URL('../',import.meta.url));
const current=JSON.parse(readFileSync(new URL('../docs/completion-checklist.json',import.meta.url)));
const hash=b=>createHash('sha256').update(b).digest('hex');
test('local import retains the immutable audit baseline and all bounded roadmap requirements',()=>{
 const data=structuredClone(current);assert(data.importedAtlasSource);assert.equal(validateChecklist(data),data);
 assert.equal(data.items.length,71);assert.equal(data.items.filter(i=>i.scope==='optional').length,8);
 assert.equal(data.baseline.atlasCommit,'98d7f17e2d120b031633e59e47fc50c82d44b2d0');assert.notEqual(data.baseline.atlasCommit,data.importedAtlasSource.commit);
 const baseline=structuredClone(data.baseline),items=structuredClone(data.items),text=renderChecklist(data);assert.deepEqual(data.baseline,baseline);assert.deepEqual(data.items,items);
 for(const value of ['## Recorded audit baseline','## Current local Atlas import','recorded audit baseline above is unchanged','not clinical sign-off or release approval'])assert(text.includes(value));
 assert(text.includes(data.baseline.atlasCommit)&&text.includes(data.importedAtlasSource.commit));
});
test('legacy imported and pending fixtures retain their original baseline obligations and wording',()=>{
 for(const [file,imported]of [['completion-checklist-19.json',false],['completion-checklist-21.json',true]]){const d=JSON.parse(readFileSync(new URL('./fixtures/'+file,import.meta.url)));assert.equal(d.importedAtlasSource,undefined);assert.equal(validateChecklist(d),d);assert(renderChecklist(d).includes(imported?'**Imported into the website baseline above.**':'Not imported into the website baseline above.'));}
});
for(const [name,edit]of [
 ['unbound source',d=>{d.importedAtlasSource.commit='0'.repeat(40);}],
 ['unbound tree',d=>{d.importedAtlasSource.tree='0'.repeat(40);}],
 ['changed topic split',d=>{d.importedAtlasSource.rootDraftPlacements++;d.importedAtlasSource.rootPendingPlacements--;}],
 ['invented approval',d=>{d.importedAtlasSource.clinicalApproval=true;}],
 ['missing evidence digest',d=>{delete d.importedAtlasSource.evidenceSha256;}],
 ['unsafe evidence',d=>{d.importedAtlasSource.evidence='website:../private.json';}],
 ])test('local import rejects '+name,()=>{const d=structuredClone(current);edit(d);assert.throws(()=>validateChecklist(d));});
function virtual({editProof=()=>{},editReview=()=>{},editViewer=()=>{},editLearner=()=>{},tamperProof=false,wrongTree=false,wrongCommit=false,tamperInputs=false}={}){
 const data=structuredClone(current),r=data.importedAtlasSource,inputs={sourceCommit:r.commit,inputs:[{path:'owned-source.ts',sha256:'1'.repeat(64)}]};
 r.reviewIntegration=hash(JSON.stringify(inputs.inputs));inputs.sha256=r.reviewIntegration;
 const proof={applied:true,publicDeployment:false,sourceAtlas:r.commit,review:r.reviewIntegration};editProof(proof);let bytes=Buffer.from(JSON.stringify(proof));r.evidenceSha256=hash(bytes);if(tamperProof)bytes=Buffer.from(JSON.stringify({...proof,applied:false}));
 const review={revision:r.commit,websiteIntegrationSha256:r.reviewIntegration,files:Array.from({length:r.reviewSourceFiles},()=>({}))};editReview(review);
 const viewer={sourceCommit:r.commit,websiteIntegrationSha256:r.reviewIntegration,personalRecordsIncluded:false};editViewer(viewer);if(tamperInputs)inputs.inputs[0].sha256='2'.repeat(64);
 const documents=new Map([[evidencePath(data,r.evidence),bytes],...Object.entries({'atlas-review/manifest.json':review,'atlas-review/integration-inputs.json':inputs,'public/atlas-review-viewer/manifest.json':viewer}).map(([p,value])=>[resolve(site,p),Buffer.from(JSON.stringify(value))])]);
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){const learner={sourceCommit:r.commit,patientDataIncluded:false};editLearner(learner,name);documents.set(resolve(site,'public/atlas-runtime/'+name+'/manifest.json'),Buffer.from(JSON.stringify(learner)));}
 const refs=[];return{data,options:{read:p=>{assert(documents.has(p),'Only declared source/evidence documents read');return documents.get(p);},git:(_repo,ref)=>{refs.push(ref);assert(!ref.startsWith('HEAD'),'Do not conflate newer unimported source HEAD with Website import');return ref.endsWith('^{tree}')?(wrongTree?'0'.repeat(40):r.tree):(wrongCommit?'0'.repeat(40):r.commit);}},refs};
}
test('physical import check requires immutable source objects and coherent delivery without reading private decisions',()=>{const v=virtual();verifyImportedAtlasEvidence(v.data,site,v.options);assert.deepEqual(v.refs,[v.data.importedAtlasSource.commit+'^{commit}',v.data.importedAtlasSource.commit+'^{tree}']);});
for(const [name,options]of [
 ['unapplied proposal',{editProof:p=>{p.applied=false;}}],['public-release substitution',{editProof:p=>{p.publicDeployment=true;}}],['altered proof bytes',{tamperProof:true}],
 ['wrong source object',{wrongCommit:true}],['wrong source tree',{wrongTree:true}],['mismatched Review source',{editReview:r=>{r.revision='0'.repeat(40);}}],
 ['changed input closure',{tamperInputs:true}],['personal viewer records',{editViewer:v=>{v.personalRecordsIncluded=true;}}],
 ['one stale learner',{editLearner:(l,n)=>{if(n==='shoulder')l.sourceCommit='0'.repeat(40);}}],['patient-data learner',{editLearner:(l,n)=>{if(n==='head-neck')l.patientDataIncluded=true;}}],
 ])test('physical import check refuses '+name,()=>{const v=virtual(options);assert.throws(()=>verifyImportedAtlasEvidence(v.data,site,v.options));});
