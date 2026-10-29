import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),atlas=process.env.VM_ATLAS_ROOT??'F:/VisibleMedicine/atlas';
// The stock archive reader resolves its cache from cwd; keep all acquisition writes on G.
process.chdir(import.meta.dirname);
const {archiveReader}=await import(pathToFileURL(atlas+'/scripts/bodyparts-archive.mjs'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const catalogBytes=await fs.readFile(atlas+'/public/models/bodyparts3d/full-body/catalog.json'),catalog=JSON.parse(catalogBytes);
const acquired=JSON.parse(await fs.readFile(root+'/ACQUISITION.json')),ids=new Set(acquired.structures.map(s=>s.id)),rows=catalog.structures.filter(s=>ids.has(s.fmaId));assert.equal(rows.length,10);
const archive=await archiveReader('isa');const result=[];await fs.mkdir(root+'/original-v4',{recursive:true});
for(const row of rows){assert.equal(row.sourceTree,'isa');assert.equal(row.sources.length,1);const source=row.sources[0],bytes=await archive.get(source.file);assert.equal(sha(bytes),source.sha256);await fs.writeFile(root+'/original-v4/'+source.file+'.obj',bytes);result.push({fmaId:row.fmaId,...source,bytes:bytes.length});}
await fs.writeFile(root+'/V4_CONTEXT.json',JSON.stringify({at:new Date().toISOString(),catalogSha256:sha(catalogBytes),archive:archive.source,structures:result,comparisonOnly:true,notUsedInReviewModel:true},null,2));console.log(JSON.stringify({verifiedOriginals:result.length,bytes:result.reduce((a,s)=>a+s.bytes,0)}));
