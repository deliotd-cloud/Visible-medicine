// Local Miniflare emulator only. No remote option, credentials, DB, overwrite or delete.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {Miniflare} from 'miniflare';
import {localCandidateMiniflareOptions} from './local-r2-persistence.mjs';
import {validatePrivateReferenceRegistry,privateReferenceObjectKey} from '../lib/clinical-review-reference-registry.ts';
const root=path.resolve(import.meta.dirname,'..'),args=process.argv.slice(2),normalize=p=>p.replaceAll('\\','/');
assert(args.length===2&&args[0]==='--package'&&path.isAbsolute(args[1])&&path.resolve(process.cwd())===root,'Run from the isolated Website with --package ABSOLUTE-F-PACKAGE');
assert(normalize(root).startsWith('F:/VisibleMedicine/staging/')&&path.basename(root)==='website','Never stage into the owner preview');
const source=path.resolve(args[1]);assert(normalize(source).startsWith('F:/VisibleMedicine/staging/'),'F staging only');
for(const dir of [root,source,source+'/objects'])assert(fs.lstatSync(dir).isDirectory()&&!fs.lstatSync(dir).isSymbolicLink(),'No redirected staging directory');
assert(!fs.existsSync(root+'/.wrangler'),'Use a fresh isolated emulator; never share active state');
const bytes=fs.readFileSync(source+'/registry.json'),registry=validatePrivateReferenceRegistry(JSON.parse(bytes));
assert.deepEqual(bytes,fs.readFileSync(root+'/lib/clinical-review-reference-assets.json'));
const sha=b=>createHash('sha256').update(b).digest('hex'),objects=[];
for(const r of registry.references)for(const f of r.files){
 const file=source+'/objects/'+f.sha256,stat=fs.lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink()&&stat.size===f.bytes);assert.equal(sha(fs.readFileSync(file)),f.sha256);objects.push({...f,key:privateReferenceObjectKey(f),file});
}
const mf=new Miniflare(localCandidateMiniflareOptions(root)),verified=[];
try{const bucket=await mf.getR2Bucket('FILES');for(const f of objects){
 const old=await bucket.head(f.key);assert.equal(old,null,'Fresh local emulator object must not already exist');
 const result=await bucket.put(f.key,fs.readFileSync(f.file),{sha256:f.sha256,onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:f.contentType},customMetadata:{purpose:'local-unitless-reference-review',clinicalApproval:'false'}});assert(result);
 const readback=await bucket.get(f.key);assert(readback);assert.equal(readback.key,f.key);assert.equal(readback.size,f.bytes);assert.equal(Buffer.from(readback.checksums.sha256).toString('hex'),f.sha256);assert.equal(sha(Buffer.from(await readback.arrayBuffer())),f.sha256);
 verified.push({key:f.key,sha256:f.sha256,bytes:f.bytes});
}}finally{await mf.dispose();}
const receipt={at:new Date().toISOString(),website:root,registrySha256:sha(bytes),persist:root+'/.wrangler/state/v3',verified,localOnly:true,remoteWrite:false,databaseTouched:false,decisionsIncluded:false,clinicalApproval:false,previewChanged:false};
fs.writeFileSync(source+'/LOCAL_STAGING.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:source+'/LOCAL_STAGING.json',objects:verified.length,remoteWrite:false,previewChanged:false}));
