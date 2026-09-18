import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const raw=await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(raw),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const compiled=await build({stdin:{contents:`export * from './content/hand-intrinsic-studies';export * from './lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(raw));
const wanted=new Set(api.handIntrinsicSourceIds);
const entries=catalog.structures.filter(structure=>wanted.has(structure.fmaId));
assert.equal(entries.length,24);
assert.deepEqual([...new Set(entries.map(entry=>entry.fmaId))].sort(),[...wanted].sort());
assert(entries.every(entry=>entry.region==='hand'&&entry.regions.includes('hand')));
assert.equal(entries.filter(entry=>entry.laterality==='left').length,12);
assert.equal(entries.filter(entry=>entry.laterality==='right').length,12);
assert(!entries.some(entry=>/flexor pollicis brevis/i.test(entry.name)),'Quarantined flexor pollicis brevis must stay excluded');
const bundles=catalog.bundles.filter(bundle=>entries.some(entry=>entry.bundle===bundle.id));
assert.equal(bundles.length,5);
for(const bundle of bundles){
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);assert.equal(hash(bytes),bundle.sha256);
}
const record={sourceCommit:'884f97dd204fe404c91ee34fc4b0b86b43ffaae0',sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,entries,bundles};
const text=JSON.stringify(record,null,2)+'\n',path='content/hand-intrinsic-study-pins.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({selections:entries.length,bundles:bundles.length,quarantinedFlexorPollicisBrevis:false,geometryWritten:false}));
