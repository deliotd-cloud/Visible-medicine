import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {neckAttachments,neckAttachmentBones} from '../content/neck-attachments.ts';
const hash=b=>createHash('sha256').update(b).digest('hex');
const raw=await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(raw),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const catalog=JSON.parse(raw),muscles=neckAttachments.flatMap(a=>a.fmas),bones=Object.values(neckAttachmentBones).flat();
assert.equal(new Set(muscles).size,18);assert.equal(new Set(bones).size,13);
const ids=[...muscles,...bones],entries=catalog.structures.filter(s=>ids.includes(s.fmaId));
assert.equal(entries.length,31);
for(const group of [...neckAttachments.map(a=>a.fmas),...Object.values(neckAttachmentBones)])for(const [i,fma]of group.entries()){
  const found=entries.filter(s=>s.fmaId===fma);assert.equal(found.length,1);
  assert.equal(found[0].laterality,group.length===1?'midline':i===0?'right':'left');
  assert.equal(found[0].system,muscles.includes(fma)?'muscles':'skeleton');
}
const bundles=catalog.bundles.filter(b=>entries.some(s=>s.bundle===b.id));
for(const b of bundles)assert.equal(hash(await readFile('public'+b.url)),b.sha256);
const sourceCommit='e1c615a6a7acb7ce85b5df4697bdd1f4998b685f';
const output=JSON.stringify({sourceCommit,catalogSha256:hash(raw),sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries},null,2)+'\n';
const path='content/neck-attachment-pins.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),output);
else {assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));await writeFile(path,output,{flag:'wx'});}
console.log(JSON.stringify({muscles:18,bones:13,bundles:bundles.length,check:process.argv.includes('--check')}));
