import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
assert(process.argv.slice(2).every(a=>a==='--detail=95')&&process.argv.length<=3,'Unknown arguments');
const detail=process.argv.includes('--detail=95')?'95':'99';
const projectRoot=path.resolve(import.meta.dirname,'..');
const root = detail==='95'?path.join(projectRoot,'detail95'):projectRoot;
const source = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/';
const archive = source + `BodyParts3D_3.0_obj_${detail}.zip`;
const sha = b => createHash('sha256').update(b).digest('hex');
const save = async (p,b) => { await fs.mkdir(path.dirname(p),{recursive:true});try{await fs.writeFile(p,b,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;assert.equal(sha(await fs.readFile(p)),sha(b),'Existing file changed: '+p);} };
const json = v => JSON.stringify(v,null,2)+'\n';
const received = [];
async function get(url, headers={}, limit=2*1024*1024) {
  const r=await fetch(url,{headers,signal:AbortSignal.timeout(45000)});
  assert.equal(r.status,headers.Range?206:200,`${url}: ${r.status}`);
  const chunks=[]; let size=0;
  for await (const chunk of r.body) {size+=chunk.length;assert(size<=limit,'Response exceeds bound');chunks.push(chunk);}
  const bytes=Buffer.concat(chunks);received.push({url,range:headers.Range??null,status:r.status,contentRange:r.headers.get('content-range'),bytes:bytes.length,sha256:sha(bytes)});
  return {bytes,r};
}
let total;
async function range(start,end) {
  const spec=start<0?`bytes=${start}`:`bytes=${start}-${end}`;
  const {bytes,r}=await get(archive,{Range:spec});
  const cr=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(r.headers.get('content-range')??'');
  assert(cr,'Missing/invalid Content-Range');const [a,b,n]=cr.slice(1).map(Number);
  assert.equal(bytes.length,b-a+1);assert(total===undefined||total===n,'Archive size changed');total=n;
  assert.equal(a,start<0?Math.max(0,n+start):start);assert.equal(b,start<0?n-1:end);
  return bytes;
}
function crc32(bytes) {let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^(0xedb88320&-(c&1));}return(c^0xffffffff)>>>0;}
const docs=[['parts_list_e.txt',source+'parts_list_e.txt'],['composite_parts.txt',source+'composite_parts.txt'],['source-readme.html',source+'README_e.html'],['license-deed.html','https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en'],['license-legalcode.html','https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode.ja']];
let previous;try{previous=JSON.parse(await fs.readFile(root+'/ACQUISITION.json','utf8'));await save(root+'/ACQUISITION_INITIAL.json',json(previous));}catch(e){if(e.code!=='ENOENT')throw e;}
const evidence={};
for(const [name,url] of docs){let bytes;if(previous){bytes=await fs.readFile(root+'/original/'+name);assert.equal(sha(bytes),previous.evidence[name].sha256);}else{({bytes}=await get(url));}await save(root+'/original/'+name,bytes);evidence[name]={url,bytes:bytes.length,sha256:sha(bytes)};}
const names=new Map((await fs.readFile(root+'/original/parts_list_e.txt','utf8')).trim().split(/\r?\n/).map(r=>r.split('\t')));
const tail=await range(-65536);const end=tail.lastIndexOf(Buffer.from([0x50,0x4b,5,6]));assert(end>=0);
assert.equal(tail.readUInt16LE(end+4),0);assert.equal(tail.readUInt16LE(end+6),0);assert.equal(tail.readUInt16LE(end+8),tail.readUInt16LE(end+10));
const count=tail.readUInt16LE(end+10),length=tail.readUInt32LE(end+12),offset=tail.readUInt32LE(end+16);
assert(length<2*1024*1024);assert.equal(tail.length-end,22+tail.readUInt16LE(end+20));
const directory=await range(offset,offset+length-1);await save(root+'/original/central-directory.bin',directory);const entries=new Map();
for(let i=0;i<directory.length;){assert.equal(directory.readUInt32LE(i),0x02014b50);const nl=directory.readUInt16LE(i+28),el=directory.readUInt16LE(i+30),cl=directory.readUInt16LE(i+32);const filename=directory.subarray(i+46,i+46+nl).toString();const name=path.posix.basename(filename.replaceAll('\\','/'));assert(!entries.has(name),'Duplicate basename');entries.set(name,{filename,flags:directory.readUInt16LE(i+8),method:directory.readUInt16LE(i+10),crc:directory.readUInt32LE(i+16),compressedBytes:directory.readUInt32LE(i+20),bytes:directory.readUInt32LE(i+24),offset:directory.readUInt32LE(i+42)});i+=46+nl+el+cl;assert(i<=directory.length);}
assert.equal(entries.size,count);
const selection=[...names].filter(([id,name])=>/^set of dorsal interossei of (right|left) foot$/.test(name)||/^(right|left) (first|second|third|fourth|fifth) metatarsal bone$/.test(name));
// Retain metatarsals as source-frame context; names are matched exactly, not guessed.
assert.equal(selection.filter(([,n])=>n.startsWith('set of')).length,2);
assert.equal(selection.length,12);
const structures=[];
for(const [id,name] of selection){const entry=entries.get(id+'.obj');assert(entry,`No atomic mesh for ${id}`);assert.equal(entry.flags&1,0,'Encrypted ZIP');assert([0,8].includes(entry.method));assert(entry.bytes<=8*1024*1024);
  const header=await range(entry.offset,entry.offset+29);assert.equal(header.readUInt32LE(0),0x04034b50);assert.equal(header.readUInt16LE(8),entry.method);assert.equal(header.readUInt16LE(6),entry.flags);
  const nl=header.readUInt16LE(26),el=header.readUInt16LE(28);const block=await range(entry.offset+30,entry.offset+29+nl+el+entry.compressedBytes);
  assert.equal(block.subarray(0,nl).toString(),entry.filename);const packed=block.subarray(nl+el);assert.equal(packed.length,entry.compressedBytes);
  const bytes=entry.method===8?inflateRawSync(packed,{maxOutputLength:entry.bytes}):packed;assert.equal(bytes.length,entry.bytes);assert.equal(crc32(bytes),entry.crc);
  await save(root+'/original/'+id+'.obj',bytes);structures.push({id,name,path:'original/'+id+'.obj',sha256:sha(bytes),bytes:bytes.length,archiveEntry:entry});
}
for(const s of previous?.structures??[]){assert.equal(structures.find(v=>v.id===s.id)?.sha256,s.sha256);}
await fs.writeFile(root+'/ACQUISITION.json',json({schema:'vm-foot-original-acquisition/1',at:new Date().toISOString(),archive,archiveBytes:total,directory:{path:'original/central-directory.bin',sha256:sha(directory),entries:count},evidence,structures,received,previous:previous?{path:'ACQUISITION_INITIAL.json',sha256:sha(Buffer.from(json(previous)))}:null,clinicalApproval:false,admittedToAtlas:false,sourceFrame:'BodyParts3D v3 original coordinates; no v4 or patient registration'}));
console.log(json({structures:structures.map(s=>({id:s.id,name:s.name,bytes:s.bytes})),archiveBytes:total,totalReceived:received.reduce((a,v)=>a+v.bytes,0)}));
