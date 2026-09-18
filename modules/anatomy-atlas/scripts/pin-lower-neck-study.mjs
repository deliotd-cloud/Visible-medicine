import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {lowerNeckSourceIds} from '../content/lower-neck-study.ts';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const raw=await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(raw),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const catalog=JSON.parse(raw),wanted=new Set(lowerNeckSourceIds);
const entries=catalog.structures.filter(structure=>wanted.has(structure.fmaId));
assert.equal(entries.length,18);assert.equal(new Set(entries.map(entry=>entry.fmaId)).size,18);
assert.deepEqual([...new Set(entries.map(entry=>entry.laterality))].sort(),['left','right']);
assert.equal(entries.filter(entry=>entry.laterality==='left').length,9);
assert.equal(entries.filter(entry=>entry.laterality==='right').length,9);
assert(entries.every(entry=>entry.regions.includes('head-neck')));
const bundles=catalog.bundles.filter(bundle=>entries.some(entry=>entry.bundle===bundle.id));
assert.equal(bundles.length,3);
for(const bundle of bundles){
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);assert.equal(hash(bytes),bundle.sha256);
}
const record={sourceCommit:'2d68ad0aa45aa270f2b0a114be82003ea6d1b9c8',sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,entries,bundles};
const text=JSON.stringify(record,null,2)+'\n',path='content/lower-neck-study-pins.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({selections:entries.length,bundles:bundles.length,geometryWritten:false}));
