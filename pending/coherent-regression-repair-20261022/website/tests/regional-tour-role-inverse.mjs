// Pure, exact-byte adapter for four current→frozen test source transitions.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const old='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const currentImport="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const priorImport="import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
const cases={
 'clinical-review-elbow-arterial-tour.test.ts':{
  current:'4cfe1d8c84bd0be8f628ac4c1e5bf8d080f563e608a6918c77ed550be50b0402',
  prior:'1b2f22d6bee38da836cc3e491b1b16fec3c0bc4fca0b577cf9e127cf0d081490',
  seams:[
   ["import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
    "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
   ["  const currentPin=validateCurrentAtlasDelivery();assert.equal(currentPin.source,currentRevision);\n  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,currentPin.runtimeSources[name],name);",
    "  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,currentRevision,name);"],
  ],
 },
 'clinical-review-lower-venous-tour-v2.test.ts':{
  current:'a06c263636799e7238d200f38061d6e6340da28ccb9619fc51da0711166e24a9',
  prior:'f52a3fd3ba12fc9836344febb9ab59a0a6c3f2b9bd6199595e0def5ef74ad4ae',
  seams:[
   [currentImport,priorImport],
   [" assert.equal(currentPin.source,CURRENT_ATLAS_REVISION);\n assert.equal(currentPin.runtimeSources.shoulder,'"+old+"');",
    " assert.equal(currentPin.source,'"+old+"');"],
   [" assert.equal(pin.source,CURRENT_ATLAS_REVISION);\n assert.equal(pin.runtimeSources.shoulder,'"+old+"');",
    " assert.equal(pin.source,'"+old+"');"],
  ],
 },
 'clinical-review-medial-thigh-tour.test.ts':{
  current:'558c0c4d8565651bfaacb6e9b47277dafc4446e6532deb5bf36d7e1001ee2406',
  prior:'03b265445b7937621a9d01ce849294ea170232c245f6f8c7a3f34b19325b4916',
  seams:[
   [currentImport,priorImport],
   [" assert.equal(currentPin.source,CURRENT_ATLAS_REVISION);\n assert.equal(currentPin.runtimeSources.shoulder,'"+old+"');",
    " assert.equal(currentPin.source,'"+old+"');"],
   [" assert.equal(pin.source,CURRENT_ATLAS_REVISION);\n assert.equal(pin.runtimeSources.shoulder,'"+old+"');",
    " assert.equal(pin.source,'"+old+"');"],
  ],
 },
 'clinical-review-regional-tour.test.ts':{
  current:'5e07bfe4b0fab462660f6d01c59f91b6cc4630202cdcdb5aecb8b68315cec3e7',
  prior:'af4d4f3efee33d61db8c1769632909680bf07e89d46e514c97601499097ea7ff',
  seams:[
   ["import { currentAtlasDeliveryRoot,validateCurrentAtlasDelivery } from './current-atlas-delivery.mjs';",
    "import { currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';"],
   ["  const pin=validateCurrentAtlasDelivery();\n  assert.equal(review.revision,pin.source);\n  assert.equal(learner.sourceCommit,pin.runtimeSources['head-neck']);\n  assert.equal(pin.runtimeSources.shoulder,'"+old+"');",
    "  assert.equal(review.revision,'"+old+"');\n  assert.equal(learner.sourceCommit,'"+old+"');"],
   ["test('regional learner and review retain compact guided teaching and reading pause',()=>{\n  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  const pin=validateCurrentAtlasDelivery();assert.equal(review.revision,pin.source);",
    "test('regional learner and review retain compact guided teaching and reading pause',()=>{\n  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  assert.equal(review.revision,'"+old+"');"],
   ["test('all structure-check hosts deliver the corrected success/retry component',()=>{\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  const pin=validateCurrentAtlasDelivery();assert.equal(review.revision,pin.source);",
    "test('all structure-check hosts deliver the corrected success/retry component',()=>{\n  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n  assert.equal(review.revision,'"+old+"');"],
   ["    assert.equal(manifest.sourceCommit,pin.runtimeSources[module]);",
    "    assert.equal(manifest.sourceCommit,'"+old+"');"],
  ],
 },
};
export const regionalTourRoleNames=Object.freeze(Object.keys(cases));
export function restorePriorRegionalTourRole(name,currentBytes,{readPrior=readFileSync}={}){
 const item=cases[name];assert(item,'Only four declared regional-tour source transitions admitted');
 assert.equal(sha(currentBytes),item.current,'Exact current source bytes: '+name);
 const prior=readPrior(new URL('./fixtures/regional-tour-role-prior/'+name+'.raw',import.meta.url));
 assert.equal(sha(prior),item.prior,'Exact frozen prior fixture: '+name);
 let text=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(text),currentBytes,'Lossless current UTF-8: '+name);
 assert(!text.includes('\r'),'LF current source: '+name);
 for(const [after,before] of item.seams){
  assert.equal(text.split(after).length,2,'Unique exact current role seam: '+name);
  text=text.replace(after,before);
 }
 const restored=Buffer.from(text);
 assert.deepEqual(restored,prior,'Complete current→frozen source inverse: '+name);
 return restored;
}
