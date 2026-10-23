import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyReadback} from './check-fda-shoulder-surface-readback.mjs';

assert.equal(process.argv.length,4,'Usage: node scripts/test-fda-shoulder-surface-readback.mjs <pinned-source> <quarantine-directory>');
const source=fs.readFileSync(process.argv[2]),dir=process.argv[3];
const original=JSON.parse(fs.readFileSync(path.join(dir,'MANIFEST.json'),'utf8'));
const files=new Map(original.exports.flatMap(e=>e.files.map(f=>[f.path,fs.readFileSync(path.join(dir,f.path))])));
const sha=b=>createHash('sha256').update(b).digest('hex');
const changed=(kind,change)=>{
  const manifest=structuredClone(original),copy=new Map(files);
  change(manifest,copy);
  assert.throws(()=>verifyReadback(source,manifest,copy),undefined,kind+' must refuse');
  return kind;
};
const replace=(manifest,copy,file,mutate)=>{
  const text=copy.get(file).toString('utf8'),value=mutate(text),bytes=Buffer.from(value);
  copy.set(file,bytes);
  const record=manifest.exports.flatMap(e=>e.files).find(f=>f.path===file);
  record.bytes=bytes.length;record.sha256=sha(bytes);
};
const cases=[];
cases.push(changed('altered OBJ coordinate with recomputed file hash',(m,f)=>replace(m,f,'AC_Lig.obj',s=>s.replace(/(\nv )([^\s]+)/,(_,prefix,n)=>prefix+(Number(n)+1)))));
cases.push(changed('altered OBJ triangle with recomputed file hash',(m,f)=>replace(m,f,'AC_Lig.obj',s=>s.replace(/(\nf )(\d+) (\d+) (\d+)/,(_,prefix,a,b,c)=>prefix+b+' '+a+' '+c))));
cases.push(changed('altered source ID with recomputed file hash',(m,f)=>replace(m,f,'AC_Lig.source-map.json',s=>{const x=JSON.parse(s);x.sourceNodeIds[0]++;return JSON.stringify(x)+'\n';})));
cases.push(changed('wrong transform',(m)=>{m.exports.find(e=>e.part==='Hcart').transformRows[0][0]++;}));
cases.push(changed('forged approval',(m)=>{m.clinicalApproval=true;}));
cases.push(changed('forged registration',(m)=>{m.exports[0].registeredToBodyParts3D=true;}));
cases.push(changed('forged Gcart healthy manifold flag',(m)=>{m.exports.find(e=>e.part==='Gcart').assembledAudit.closedOrientedVertexManifold=true;}));
cases.push(changed('SHA mismatch',(m)=>{m.exports[0].files[0].sha256='0'.repeat(64);}));
console.log(JSON.stringify({mutationRefusals:cases,status:'passed'}));
