// Test-only exact byte inverse. Historical assertions are not repinned.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function restorePriorConnectiveFamily(currentBytes,{readPrior=readFileSync}={}){
 assert.equal(sha(currentBytes),'7aa5be85013096667406747701dc40b50bec69e22a676f2163b4680a773904d3','Exact complete new connective test');
 const prior=readPrior(new URL('./fixtures/connective-current-family-prior/clinical-review-lower-limb-connective-xray.test.ts.raw',import.meta.url));
 assert.equal(sha(prior),'eb7e626855026127c0c02927a8b4c7ad7cc31da4637681dc5efa11c281bdd4f7','Exact complete frozen connective test');
 let text=Buffer.from(currentBytes).toString();assert.deepEqual(Buffer.from(text),currentBytes,'Lossless source UTF8');
 const inverse=[
  ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",''],
  ["const atlas=currentAtlasDeliveryRoot();", "const atlas='F:/VisibleMedicine/atlas';"],
  ["const priorRevision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst revision=CURRENT_ATLAS_REVISION;", "const revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';"],
 ];
 // The complete contiguous addition is authenticated, including its historical pin.
 inverse.push([
  " const currentPin=validateCurrentAtlasDelivery();\n assert.equal(currentPin.source,revision);\n assert.equal(currentPin.runtimeSources.shoulder,priorRevision);\n const priorDeliveryBytes=readFileSync(new URL('./fixtures/review-navigation-delivery/current-atlas-delivery.json.raw',import.meta.url));\n assert.equal(sha(priorDeliveryBytes),'b6301e20b714a67df82575f9f9b75f642fbf44310560444cfb537692bf5cef1f');\n const priorDelivery=JSON.parse(priorDeliveryBytes.toString());\n assert.equal(priorDelivery.source,priorRevision);\n assert.equal(priorDelivery.reviewIntegration,reviewIntegration,'Exact historical190 website binding remains retained');\n",'']);
 inverse.push(
  ['assert.equal(review.websiteIntegrationSha256,currentPin.reviewIntegration);','assert.equal(review.websiteIntegrationSha256,reviewIntegration);'],
  ["assert.equal(execFileSync('git',['rev-parse',`${priorRevision}:${path}`],{cwd:atlas,windowsHide:true}).toString().trim(),currentBlob,path+' exact historical190 blob');", "assert.equal(execFileSync('git',['rev-parse',`${revision}:${path}`],{cwd:atlas,windowsHide:true}).toString().trim(),currentBlob,path);"],
  ['assert.equal(learner.manifest.sourceCommit,currentPin.runtimeSources[learner.name],learner.name);','assert.equal(learner.manifest.sourceCommit,revision,learner.name);'],
  [" const priorPins=JSON.parse(git(priorRevision,displayPins).toString());\n const priorById=new Map(priorPins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));\n assert.equal(priorById.size,1104);\n assert.deepEqual(new Set(priorById.keys()),new Set(newById.keys()));\n // Preserve the original587-pin theorem at its exact190a source, not today's source.\n const currentChangedPins=[...priorById].filter(([id,digest])=>digest!==epochById.get(id)).map(([id])=>id).sort();", " const currentChangedPins=[...newById].filter(([id,digest])=>digest!==epochById.get(id)).map(([id])=>id).sort();"],
  [" const sincePrior=[...newById].filter(([id,digest])=>digest!==priorById.get(id)).map(([id])=>id).sort();\n assert.deepEqual(sincePrior,[\n  'vm:anatomy:body:abdomen:midline:vessel:middle-colic-artery',\n  'vm:anatomy:body:abdomen:right:vessel:right-colic-artery',\n ],'Only the two exact later colic teaching display pins differ from historical190');\n assert.equal(hash(sincePrior),'67764eea6c280f5875a97203563de86019840415d92a80dc1ce97d8bb0486ff9');\n",''],
 );
 for(const [after,before] of inverse){assert(after.length>0);assert.equal(text.split(after).length,2,'Unique exact connective source inverse seam');text=text.replace(after,before);}
 const restored=Buffer.from(text);assert.deepEqual(restored,prior,'Every original connective test byte remains recoverable');return restored;
}
