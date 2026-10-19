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

for(const [epoch,oldHash] of parent)test(`closed${epoch} reader changes only the declared old viewer alias`,()=>{
 const raw=readFileSync(new URL(`./fixtures/closed57-reader-originals/historical-current-atlas-delivery-${epoch}.mjs.raw`,import.meta.url));
 assert.equal(sha(raw),oldHash);
 const [before,after]=edits.get(epoch);
 const old=raw.toString('utf8');assert.equal(old.split(before).length,2);
 const actual=readFileSync(new URL(`./historical-current-atlas-delivery-${epoch}.mjs`,import.meta.url),'utf8');
 assert.equal(actual,old.replace(before,after));
});
