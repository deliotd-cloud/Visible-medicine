import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const destination='content/nested-guided-learning-bindings.v1.json';
const bindings=JSON.parse(await readFile(destination,'utf8'));
const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const parent=catalog.structures.find(s=>s.fmaId==='FMA50801');
assert(parent);const parentBundle=catalog.bundles.find(b=>b.id===parent.bundle);assert(parentBundle);
const entry={parentId:parent.id,parentBundle};
const matching=bindings.bindings.filter(b=>b.parentId===parent.id);
if(process.argv.includes('--check'))assert.deepEqual(matching,[entry]);
else{
  assert(matching.length<=1);if(matching.length)assert.deepEqual(matching,[entry]);
  else bindings.bindings.push(entry);
  await writeFile(destination,JSON.stringify(bindings,null,2)+'\n');
}
console.log('Ventricular library: exact existing brain parent bundle bound; prior eye bindings unchanged.');
