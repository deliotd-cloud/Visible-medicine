import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const parent=new Map([
 [54,'803f728f93b1be88fe3acc489e86304882ab5ae3f70ad369ede76627c85ec77d'],
 [55,'783665ea60285bc04841cb4bc17a6b61e83be332dfac292f67015389d77bb52f'],
 [56,'e9aa187511184e512626534368b245a0e3987fc84c24054f0b277029c3207b11'],
]);
const digest='06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841';
const edits=new Map([
 [54,[
  "'components/head-atlas.css'].includes(path)",
  "'components/head-atlas.css','components/HeadAtlasViewer.tsx'].includes(path)",
 ]],
 [55,[
  " if(frozenSpecial.has(path))return fixed(...frozenSpecial.get(path));",
  " if(path==='components/HeadAtlasViewer.tsx'){\n  const bytes=fixed('closed56-inputs/components/HeadAtlasViewer.raw','"+digest+"');\n  assert.equal(sha(bytes),oldInputs.get(path),path+' closed55 binding');\n  return bytes;\n }\n if(frozenSpecial.has(path))return fixed(...frozenSpecial.get(path));",
 ]],
 [56,[
  " if(path.startsWith('public/atlas-review-viewer/')&&emitted.has(path))return fixed('closed56-viewer/'+path,emitted.get(path));",
  " if(path==='components/HeadAtlasViewer.tsx'){\n  const bytes=fixed('closed56-inputs/components/HeadAtlasViewer.raw','"+digest+"');\n  assert.equal(sha(bytes),oldInputs.get(path),path+' closed56 binding');\n  return bytes;\n }\n if(path.startsWith('public/atlas-review-viewer/')&&emitted.has(path))return fixed('closed56-viewer/'+path,emitted.get(path));",
 ]],
]);
const oldAtlasRoot="export function currentAtlasDeliveryRoot(){\n validateCurrentAtlasDelivery();\n return frozenAtlasRoot();\n}";
const realAtlasRoot="export function currentAtlasDeliveryRoot(){\n validateCurrentAtlasDelivery();\n // This closed delivery still validates a real clean historical HEAD/tree.\n // Never pass the active current checkout off as the archived source.\n const previous=process.env.VM_ATLAS_SOURCE_REPO;\n try{\n  process.env.VM_ATLAS_SOURCE_REPO=process.env.VM_CLOSED_ATLAS_46C_SOURCE??'F:/VisibleMedicine/staging/20261020-closed46c-atlas-source';\n  return frozenAtlasRoot();\n }finally{\n  if(previous===undefined)delete process.env.VM_ATLAS_SOURCE_REPO;\n  else process.env.VM_ATLAS_SOURCE_REPO=previous;\n }\n}";
const rootEdits=[
 ["import {fileURLToPath} from 'node:url';","import {checkedHistoricalWebsiteRoot} from './historical-website-root.mjs';"],
 ["const site=new URL('../',import.meta.url);\nconst liveRoot=process.env.VM_WEBSITE_ROOT??fileURLToPath(site);\n",''],
 ["export const revision56=JSON.parse(fixed('current-atlas-delivery-56.json','3aedc6660613d5913d7e033dbe8f1395c147a58dda633089cc3f650652343e15'));","export const revision56=JSON.parse(fixed('current-atlas-delivery-56.json','3aedc6660613d5913d7e033dbe8f1395c147a58dda633089cc3f650652343e15'));\nexport const oldWebsiteRoot=checkedHistoricalWebsiteRoot(56,revision56);"],
 ["readLive=p=>readFileSync(join(liveRoot,p))","readLive=p=>readFileSync(join(oldWebsiteRoot,p))"],
 [oldAtlasRoot,realAtlasRoot],
];
const prior56Edits=[
 ["import {validateCurrentAtlasDelivery as validateDeliveryShape,currentAtlasDeliveryRoot as frozenAtlasRoot} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';","import {validateCurrentAtlasDelivery as validateDeliveryShape,currentAtlasDeliveryRoot as frozenAtlasRoot} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';\nimport {checkedAtlasHistoryRepo} from './fixtures/closed56-validator/tests/atlas-source-repo.mjs';"],
 ["export function currentAtlasDeliveryRoot(){","// Git-only replay of the exact historical commit. The archived delivery bytes\n// above remain the authority for Review; this does not validate a live checkout.\nexport function historicalAtlasGitRoot(){\n validateCurrentAtlasDelivery();\n return checkedAtlasHistoryRepo(revision56.source);\n}\nexport function currentAtlasDeliveryRoot(){"],
];

for(const [epoch,oldHash] of parent)test(`closed${epoch} reader changes only the declared old viewer alias`,()=>{
 const raw=readFileSync(new URL(`./fixtures/closed57-reader-originals/historical-current-atlas-delivery-${epoch}.mjs.raw`,import.meta.url));
 assert.equal(sha(raw),oldHash);
 const [before,after]=edits.get(epoch);
 const old=raw.toString('utf8');assert.equal(old.split(before).length,2);
 let expected=old.replace(before,after);
 if(epoch===56){
  for(const [from,to] of prior56Edits){assert.equal(expected.split(from).length,2,from);expected=expected.replace(from,to);}
  const prior=expected;
  for(const [from,to] of rootEdits){assert.equal(expected.split(from).length,2,from);expected=expected.replace(from,to);}
  let inverse=expected;
  for(const [from,to] of rootEdits.toReversed()){
   if(to===''){const anchor='const fixed=(path,digest)=>{';assert.equal(inverse.split(anchor).length,2,anchor);inverse=inverse.replace(anchor,from+anchor);}
   else{assert.equal(inverse.split(to).length,2,to);inverse=inverse.replace(to,from);}
  }
  assert.equal(inverse,prior,'Complete old56 root and Atlas source inverse');
  for(const [from,to] of prior56Edits.toReversed()){assert.equal(inverse.split(to).length,2,to);inverse=inverse.replace(to,from);}
  assert.equal(inverse,old.replace(before,after),'Complete original 56 reader inverse');
 }
 const actual=readFileSync(new URL(`./historical-current-atlas-delivery-${epoch}.mjs`,import.meta.url),'utf8');
 const difference=[...actual].findIndex((value,index)=>value!==expected[index]);
 assert.equal(actual===expected,true,`closed${epoch} first difference ${difference}; lengths ${actual.length}/${expected.length}; actual=${JSON.stringify(actual.slice(difference,difference+90))}; expected=${JSON.stringify(expected.slice(difference,difference+90))}`);
});
