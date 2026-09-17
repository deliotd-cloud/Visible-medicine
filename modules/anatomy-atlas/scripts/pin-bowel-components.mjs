import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadSourceHolds} from './load-source-holds.mjs';
const {catalog,records,policy}=await loadSourceHolds();
const inventory=JSON.parse(await readFile('content/source-inventory.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const definitions=[
 {key:'small',title:'Small-bowel components',parentFma:'FMA7200',fmas:['FMA7200','FMA11338']},
 {key:'large',title:'Large-bowel components',parentFma:'FMA7201',fmas:['FMA7201','FMA14544','FMA11338']},
];
const fmas=[...new Set(definitions.flatMap(d=>d.fmas))];
const entries=fmas.map(f=>{const a=catalog.structures.filter(s=>s.fmaId===f);assert.equal(a.length,1);return a[0];});
for(const s of entries){
 assert.equal(s.laterality,'unpaired');assert.equal(s.category,'organ');assert.equal(s.system,'organs');
 const record=records.find(r=>r.tree===s.sourceTree&&r.id===s.fmaId);assert(record);policy.assertNoKnownHolds([record]);
 for(const part of s.sources){
  const asset=inventory.assets.find(a=>a.tree===s.sourceTree&&a.file===part.file);assert(asset);
  assert.equal(asset.sha256,part.sha256);
  assert.equal(catalog.structures.filter(x=>x.sources.some(p=>p.file===part.file)).length,1,'Every retained file has one root owner');
 }
}
const partitions=definitions.map(d=>{
 const official=records.find(r=>r.tree==='partof'&&r.id===d.parentFma);assert(official);
 const parts=d.fmas.flatMap(f=>entries.find(s=>s.fmaId===f).sources);
 assert.equal(new Set(parts.map(p=>p.file)).size,parts.length,'No component repeated in this set');
 assert.deepEqual(parts.map(p=>p.file).sort(),[...official.files].sort(),'Existing separate owners account for every official source file');
 for(const f of official.files){
  const owner=entries.find(s=>s.sources.some(p=>p.file===f));
  const original=inventory.assets.find(a=>a.tree==='partof'&&a.file===f);
  const displayed=inventory.assets.find(a=>a.tree===owner.sourceTree&&a.file===f);
  assert(original&&displayed&&original.geometrySha256);assert.equal(original.geometrySha256,displayed.geometrySha256,'Cross-tree equivalence is geometry, not filename');
 }
 return {...d,officialFiles:official.files};
});
assert.equal(partitions.find(d=>d.key==='large').officialFiles.length,8);
const bundles=catalog.bundles.filter(b=>entries.some(s=>s.bundle===b.id));
for(const b of bundles)assert.equal(hash(await readFile('public'+b.url)),b.sha256);
const sourceCommit='674f8bae853f6c372d2c2f00ed94a551a10dc7da';
const out=JSON.stringify({sourceCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,definitions:partitions,entries,bundles,clinicalApproval:false},null,2)+'\n';
const path='content/bowel-component-pins.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),out);
else {assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));await writeFile(path,out,{flag:'wx'});}
console.log(JSON.stringify({entries:entries.length,bundles:bundles.length,partitions:partitions.map(d=>({key:d.key,files:d.officialFiles.length})),sourceGeometryUnchanged:true,check:process.argv.includes('--check')}));
