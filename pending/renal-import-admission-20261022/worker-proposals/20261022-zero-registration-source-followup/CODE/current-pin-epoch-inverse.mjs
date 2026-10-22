import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const reviewDocuments=[
 'atlas-review/integration-inputs.json','atlas-review/manifest.json',
 'public/atlas-review-viewer/manifest.json',
];
const neckDocuments=[...reviewDocuments,
 'lib/atlas-model-inventory.json','public/atlas-runtime/head-neck/manifest.json',
 'public/atlas-runtime/head-neck/source-inputs.json',
].sort();

export function restorePreNeckPin(currentBytes,preSurfaceBytes,preNeckBytes){
 assert.equal(sha(currentBytes),'e21465496188fb9c0bd743dd98cfcf0251bd0125a84ec457392b893be0a57237','Exact current pin bytes');
 assert.equal(sha(preSurfaceBytes),'90d89bf628c988082db64bb5be0391e147ce25729920eeeb917be6a189159e19','Exact pre-surface pin bytes');
 assert.equal(sha(preNeckBytes),'a023587c2bfd645d92e809265b80c6fc24e4b17b6d973623eef110b7c25a340d','Exact pre-neck pin bytes');
 const current=JSON.parse(currentBytes),preSurface=JSON.parse(preSurfaceBytes),preNeck=JSON.parse(preNeckBytes);
 assert.deepEqual(Object.keys(current).sort(),Object.keys(preSurface).sort());
 assert.deepEqual(Object.keys(current.documents),Object.keys(preSurface.documents));
 assert.deepEqual(Object.keys(current).filter(key=>key!=='documents'&&JSON.stringify(current[key])!==JSON.stringify(preSurface[key])),['reviewIntegration']);
 assert.deepEqual(Object.keys(current.documents).filter(path=>current.documents[path]!==preSurface.documents[path]).sort(),reviewDocuments);
 const inverseSurface=structuredClone(current);
 inverseSurface.reviewIntegration=preSurface.reviewIntegration;
 for(const path of reviewDocuments)inverseSurface.documents[path]=preSurface.documents[path];
 assert.deepEqual(inverseSurface,preSurface,'Whole current pin outside exact surface Review seam');
 assert.deepEqual(Object.keys(preSurface).sort(),Object.keys(preNeck).sort());
 assert.deepEqual(Object.keys(preSurface.documents),Object.keys(preNeck.documents));
 assert.deepEqual(Object.keys(preSurface).filter(key=>key!=='documents'&&JSON.stringify(preSurface[key])!==JSON.stringify(preNeck[key])).sort(),
  ['source','sourceTree','runtimeSources','reviewIntegration','reviewSourceFiles'].sort());
 assert.deepEqual(Object.keys(preSurface.documents).filter(path=>preSurface.documents[path]!==preNeck.documents[path]).sort(),neckDocuments);
 const inverseNeck=structuredClone(preSurface);
 for(const key of ['source','sourceTree','runtimeSources','reviewIntegration','reviewSourceFiles'])inverseNeck[key]=preNeck[key];
 for(const path of neckDocuments)inverseNeck.documents[path]=preNeck.documents[path];
 assert.deepEqual(inverseNeck,preNeck,'Whole pre-surface pin outside exact neck X-ray seam');
 return preNeckBytes;
}
