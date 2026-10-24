// Test process only: exact virtual source overrides, no on-disk application edit.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {registerHooks,stripTypeScriptTypes} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const config=JSON.parse(fs.readFileSync(process.env.VM_TEST_SOURCE_OVERLAY,'utf8'));
const receipt=fs.readFileSync(config.sourceReceipt);assert.equal(sha(receipt),config.sourceReceiptSha256);
const rows=new Map(JSON.parse(receipt).sourceRows.map(row=>[row.path,row]));
const website=config.website.replaceAll('\\','/'),loaded=new Map();
const virtual=new Map(config.overrides.map(row=>[pathToFileURL(website+'/'+row.relative).href,row]));
const entries=new Map(config.overrides.map(row=>[pathToFileURL(row.proposal).href,pathToFileURL(website+'/'+row.relative).href]));
registerHooks({
 resolve(specifier,context,next){
  const candidate=specifier.startsWith('file:')?specifier:(specifier.startsWith('.')&&context.parentURL?new URL(specifier,context.parentURL).href:null);
  if(entries.has(candidate))return {url:entries.get(candidate),shortCircuit:true};
  if(virtual.has(candidate))return {url:candidate,shortCircuit:true};
  return next(specifier,context);
 },
 load(url,context,next){
  if(!url.startsWith('file:'))return next(url,context);
  const filename=fileURLToPath(url).replaceAll('\\','/');
  if(virtual.has(url)){
   const row=virtual.get(url),bytes=fs.readFileSync(row.proposal);assert.equal(sha(bytes),row.sha256,'exact proposal: '+row.relative);
   const original=rows.get(row.relative);
   if(row.originalSha256){assert.equal(original?.sha256,row.originalSha256);assert.equal(sha(fs.readFileSync(filename)),row.originalSha256);}
   else assert.equal(original,undefined,'only an explicitly new helper/case may lack an original source row');
   loaded.set(filename,{path:filename,from:row.proposal,sha256:sha(bytes),override:true});
   return {format:'module',source:filename.endsWith('.ts')?stripTypeScriptTypes(bytes.toString(),{mode:'strip',sourceUrl:url}):bytes.toString(),shortCircuit:true};
  }
  if(filename.startsWith(website+'/')&&!filename.includes('/node_modules/')){
   const relative=filename.slice(website.length+1),row=rows.get(relative);assert.ok(row,'unbound application module: '+relative);
   const bytes=fs.readFileSync(filename);assert.equal(sha(bytes),row.sha256,'current module source: '+relative);assert.equal(bytes.length,row.bytes);
   loaded.set(filename,{path:filename,sha256:sha(bytes),bytes:bytes.length,override:false});
  }
  return next(url,context);
 },
});
process.once('exit',()=>{
 const sourceDrift=[];
 for(const row of loaded.values())if(sha(fs.readFileSync(row.from??row.path))!==row.sha256)sourceDrift.push(row.path);
 fs.writeFileSync(config.evidenceDirectory+'/loaded-'+process.pid+'.json',JSON.stringify({pid:process.pid,sourceDrift,modules:[...loaded.values()]},null,2)+'\n',{flag:'wx'});
 if(sourceDrift.length)process.exitCode=1;
});
