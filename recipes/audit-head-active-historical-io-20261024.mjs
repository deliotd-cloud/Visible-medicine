// Test-process-only reader: exact saved viewer and receipt-bound evaluated IO.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {syncBuiltinESMExports} from 'node:module';
const hash=b=>createHash('sha256').update(b).digest('hex');
const sync=fs.readFileSync,asyncRead=fsp.readFile;
const config=JSON.parse(sync(process.env.VM_HEAD_ACTIVE_IO));
const receiptBytes=sync(config.receipt);assert.equal(hash(receiptBytes),config.receiptSha256);
const receipt=JSON.parse(receiptBytes),rows=new Map(receipt.sourceRows.map(r=>[r.path,r]));
const roots=[config.currentWebsite,receipt.website].map(r=>path.resolve(r));
const redirects=new Map(config.readRedirects.map(r=>[path.resolve(r.from),{...r,to:path.resolve(r.to)}]));
assert.equal(redirects.size,1,'Only the explicit exact historical viewer read may redirect');
const observed=new Map(),violations=[];
function resolved(value){if(value instanceof URL){assert.equal(value.protocol,'file:');return path.resolve(fileURLToPath(value));}if(typeof value==='string'||Buffer.isBuffer(value))return path.resolve(value.toString());return null;}
function expected(file){
 if(!file)return null;
 for(const root of roots){if(!file.startsWith(root+path.sep))continue;const relative=path.relative(root,file).replaceAll('\\','/');if(relative.startsWith('node_modules/'))return null;
  const row=rows.get(relative);if(!row){violations.push({file,reason:'unbound first-party read'});throw Error('Unbound saved-source read: '+relative);}return row;}
 return null;
}
function source(file){const r=redirects.get(file);if(!r)return file;
 assert.equal(hash(sync(file)),r.currentSha256,'Unchanged current viewer identity');const b=sync(r.to);assert.equal(hash(b),r.savedSha256);assert.equal(b.length,r.savedBytes);return r.to;}
function verify(file,readFrom,row){if(!row)return;const b=sync(readFrom);assert.equal(hash(b),row.sha256,'Saved source: '+file);assert.equal(b.length,row.bytes);observed.set(file,{file,readFrom,sourcePath:row.path,sha256:row.sha256,bytes:row.bytes,redirected:readFrom!==file});}
fs.readFileSync=function(value,...args){const file=resolved(value),row=expected(file),readFrom=file?source(file):null;const result=sync.call(fs,readFrom??value,...args);verify(file,readFrom,row);return result;};
fsp.readFile=async function(value,...args){const file=resolved(value),row=expected(file),readFrom=file?source(file):null;const result=await asyncRead.call(fsp,readFrom??value,...args);verify(file,readFrom,row);return result;};
syncBuiltinESMExports();
process.once('exit',()=>{const drift=[];for(const r of observed.values())try{if(hash(sync(r.readFrom))!==r.sha256)drift.push(r.readFrom);}catch(error){drift.push({file:r.readFrom,error:error.code});}for(const [file,r]of redirects)if(hash(sync(file))!==r.currentSha256)drift.push(file);
 fs.writeFileSync(config.output+'/io-'+process.pid+'.json',JSON.stringify({pid:process.pid,observed:[...observed.values()],violations,drift,scope:'Unmodified original five-case test, receipt-bound actual pure module/IO closure, one declared whole-viewer read redirect. Not the full historical viewer application.'},null,2)+'\n',{flag:'wx'});if(drift.length||violations.length)process.exitCode=1;});
