import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function restoreLaterElbowEpoch(bytes){
 const witness=readFileSync(new URL('./fixtures/elbow-later-current-epoch-seams.json',import.meta.url));
 assert.equal(sha(witness),'f7983f44becf2327d02ccd9fe3b157e4d53b23c84bb542cd2f362f05e07acbc4',
  'Exact independently witnessed later elbow seams');
 const proof=JSON.parse(witness);
 assert.equal(proof.schema,'vm-elbow-later-current-epoch-seams/1');
 assert.equal(proof.currentSha256,'eddc3c4ae42e954aba37176ac0eeda8549b8e676c99702b03adcab8cb5e064bb');
 assert.equal(proof.historicalSha256,'8f16b3d999c5ee2964a5cce9d936debfeb5df51f8b3d50f6fa43183bf46f7776');
 assert.equal(sha(bytes),proof.currentSha256,'Exact later elbow source bytes');
 const text=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,'Lossless later elbow UTF-8 source');
 const lines=text.match(/[^\n]*\n|[^\n]+$/g)||[];
 assert.equal(lines.length,proof.currentLines);
 assert.equal(proof.seams.length,6,'Only six declared later elbow hunks');
 for(const seam of [...proof.seams].reverse()){
  assert.deepEqual(lines.slice(seam.afterStart,seam.afterStart+seam.after.length),seam.after,
   'Exact later elbow hunk');
  lines.splice(seam.afterStart,seam.after.length,...seam.before);
 }
 assert.equal(lines.length,proof.historicalLines);
 const restored=Buffer.from(lines.join(''));
 assert.equal(sha(restored),proof.historicalSha256,'Earlier current elbow role recovered exactly');
 return restored;
}
const cases={
 'clinical-review-elbow-us-followup.test.ts':{
  current:'8f16b3d999c5ee2964a5cce9d936debfeb5df51f8b3d50f6fa43183bf46f7776',
  frozen:'dfe5b2522ed20791134dadd37a35e6fff235b4b7d8b139953a00252595159b7a',
  prior:'52ebcddab39cc165bf4c3c94dee0659abfea6814c92e55f85bf86f25eb6c57d8',
 },
 'clinical-review-forearm-vascular-xray.test.ts':{
  current:'90b1c26a19220053633a277b10d94b74c4d3c2f6ebc6e3cd8ccf4bccdd2fdda4',
  frozen:'fca614cc591eb44623f87e36dd35cea42aa3ea0e755ede1118b368e871f06861',
  prior:'108d94b7a5b0ead7e302ab576b2f295d44eb7cd7c2229de686115402379b6778',
 },
};
export const currentEpochNames=Object.freeze(Object.keys(cases));
const seams=[
 ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
 ["  assert.equal(checkedCurrent.source,CURRENT_ATLAS_REVISION,'Active Review source is authenticated current Atlas');\n  assert.equal(checkedCurrent.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9',\n    'Earlier non-head runtime source remains pinned');\n  assert.equal(git(['merge-base',checkedCurrent.runtimeSources.shoulder,checkedCurrent.source]).toString().trim(),\n    checkedCurrent.runtimeSources.shoulder,'Earlier 190a runtime epoch precedes current Review');",
  "  assert.equal(checkedCurrent.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
];
const source190Seams=[
 ["import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
 ["  const previousDeliveryPath='tests/fixtures/source190-admission/previous-current.json';\n  const previousDeliveryBytes=readFileSync(previousDeliveryPath);\n  assert.equal(sha(previousDeliveryBytes),'7f08673542eedf10d211b4668aad93efc65ab7854d6141ec409512edd3785eba');\n  const previousDelivery=JSON.parse(previousDeliveryBytes.toString());\n  assert.equal(previousDelivery.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');\n  assert.equal(previousDelivery.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');\n  assert.equal(git(['rev-parse',`${previousDelivery.source}:lib/regional-tours.ts`]).toString().trim(),'fb65a9c68d8753fc1789c7e6281e36c2889e0136');\n  const checkedCurrent=validateCurrentAtlasDelivery();\n  assert.equal(checkedCurrent.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  assert.equal(git(['rev-parse','HEAD']).toString().trim(),checkedCurrent.source);\n  assert.equal(git(['merge-base',previousDelivery.source,checkedCurrent.source]).toString().trim(),previousDelivery.source);",
  "  assert.equal(git(['rev-parse','HEAD']).toString().trim(),'485df97c2530e8e81a8d39a5ee61073ce76d93db');"],
];
export function restorePriorCurrentEpoch(name,currentBytes){
 const item=cases[name];assert(item,'Only elbow and forearm current-source transitions admitted');
 if(name==='clinical-review-elbow-us-followup.test.ts')currentBytes=restoreLaterElbowEpoch(currentBytes);
 assert.equal(sha(currentBytes),item.current,'Exact current source bytes: '+name);
 const prior=readFileSync(new URL('./fixtures/current-epoch-prior/'+name+'.raw',import.meta.url));
 assert.equal(sha(prior),item.prior,'Exact full historical witness source bytes: '+name);
 let restored=Buffer.from(currentBytes).toString('utf8');
 for(const [current,previous] of seams){
  assert.equal(restored.split(current).length,2,'Unique current-epoch seam: '+name);
  restored=restored.replace(current,previous);
 }
 assert.equal(sha(Buffer.from(restored)),item.frozen,'Exact frozen Review source recovered: '+name);
 for(const [frozen,previous] of source190Seams){
  assert.equal(restored.split(frozen).length,2,'Unique source190 admission seam: '+name);
  restored=restored.replace(frozen,previous);
 }
 const bytes=Buffer.from(restored);
 assert.deepEqual(bytes,prior,'Complete current→frozen→historical source inverse: '+name);
 return bytes;
}
