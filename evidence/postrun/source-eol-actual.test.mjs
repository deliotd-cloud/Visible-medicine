// Actual staged admission functions and strict current-root validator, unchanged.
// Negative probes alter read results only; no source, Git or validator is stubbed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {admitCircleWillis,admitCoronaryXray} from './files/tests/next-five-special-admission.mjs';
const old='9fba9a1e24b6669aafd48e945d55fc0939d50ab2',current='87ed7e343260c7df48a40d53503f25bbfd34cfa5';
const atlas='F:/VisibleMedicine/staging/20261020-inferior-thyroid-mra-source';
const site='F:/VisibleMedicine/staging/20261020-shared-history-contexts/sourceEol/files';
const json='content/coronary-arterial-us-pins.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const rawRead=fs.readFileSync;
const norm=path=>(path instanceof URL?fileURLToPath(path):String(path)).replace(/\\/g,'/').replace(/\/+/g,'/').toLowerCase();
const actualWorking=rawRead(atlas+'/'+json);
const inverseSource=rawRead(new URL('./files/tests/next-five-special-admission.mjs',import.meta.url),'utf8');
function withReads(transform,action){
 const counts=new Map();
 fs.readFileSync=function(path,...args){
  const result=rawRead.call(this,path,...args),key=norm(path),count=(counts.get(key)??0)+1;
  counts.set(key,count);return transform(key,result,count);
 };
 syncBuiltinESMExports();
 try{return action();}finally{fs.readFileSync=rawRead;syncBuiltinESMExports();}
}
function injectWorking(path,bytes,{alignLearners=true}={}){
 return (key,result,count)=>{
  if(key===norm(atlas+'/'+path))return bytes;
  // Two strict validator reads precede the helper's extra learner input audit.
  if(alignLearners&&count===3&&['head-neck','shoulder'].some(name=>key===norm(site+'/public/atlas-runtime/'+name+'/source-inputs.json'))){
   const rows=JSON.parse(result),row=rows.find(row=>row.path===path);assert(row);
   row.sha256=sha(bytes);return Buffer.from(JSON.stringify(rows));
  }return result;
 };
}
test('actual Circle Willis admission retains exact historical and current delivery checks',()=>{
 assert.equal(process.env.VM_ATLAS_SOURCE_REPO?.replace(/\\/g,'/'),atlas);
 assert.equal(admitCircleWillis(old),current);
});
test('actual coronary admission checks real Git, Review and learner bytes',()=>{
 assert.equal(admitCoronaryXray(old),current);
});
test('literal historical epoch cannot be replaced by current',()=>{
 assert.throws(()=>admitCoronaryXray(current),/Literal historical feature epoch/);
});
test('actual strict root refuses the different canonical source HEAD',()=>{
 const previous=process.env.VM_ATLAS_SOURCE_REPO;
 try{process.env.VM_ATLAS_SOURCE_REPO='F:/VisibleMedicine/atlas';assert.throws(()=>admitCoronaryXray(old),/Atlas source revision changed/);}
 finally{if(previous===undefined)delete process.env.VM_ATLAS_SOURCE_REPO;else process.env.VM_ATLAS_SOURCE_REPO=previous;}
});
test('JSON LF or CRLF checkout bytes require matching exact learner digest',()=>{
 const lf=Buffer.from(actualWorking.toString('latin1').replace(/\r\n/g,'\n'),'latin1');
 const crlf=Buffer.from(lf.toString('latin1').replace(/\n/g,'\r\n'),'latin1');
 assert.equal(withReads(injectWorking(json,lf),()=>admitCoronaryXray(old)),current);
 assert.equal(withReads(injectWorking(json,crlf),()=>admitCoronaryXray(old)),current);
});
test('JSON whitespace changes are refused even with matching learner digest',()=>{
 assert.throws(()=>withReads(injectWorking(json,Buffer.concat([actualWorking,Buffer.from(' ')])),()=>admitCoronaryXray(old)),/active Atlas bytes differ beyond LF\/CRLF/);
});
test('JSON lone CR changes are refused even with matching learner digest',()=>{
 assert.throws(()=>withReads(injectWorking(json,Buffer.concat([actualWorking,Buffer.from('\r')])),()=>admitCoronaryXray(old)),/active Atlas bytes differ beyond LF\/CRLF/);
});
test('non-JSON source stays byte exact rather than newline normalized',()=>{
 const path='content/coronary-arterial-xray.ts',changed=Buffer.concat([rawRead(atlas+'/'+path),Buffer.from('\r\n')]);
 assert.throws(()=>withReads(injectWorking(path,changed),()=>admitCoronaryXray(old)),/exact active Atlas bytes/);
});
test('learner digest is not merely normalized or hardcoded',()=>{
 assert.throws(()=>withReads((key,result,count)=>{
  if(key===norm(site+'/public/atlas-runtime/head-neck/source-inputs.json')&&count===3){
   const rows=JSON.parse(result);rows.find(row=>row.path===json).sha256='0'.repeat(64);return Buffer.from(JSON.stringify(rows));
  }return result;
 },()=>admitCoronaryXray(old)),/head-neck: content\/coronary-arterial-us-pins.json/);
});
test('Review imported bytes remain exact',()=>{
 assert.throws(()=>withReads((key,result)=>key===norm(site+'/atlas-review/'+json)?Buffer.concat([result,Buffer.from(' ')]):result,
  ()=>admitCoronaryXray(old)),/Review bytes/);
});
test('full-file inverse preserves every prior admission assertion outside two seams',()=>{
 const extra="// Git can store LF while a clean Windows checkout contains CRLF. Preserve every\n// other byte, including lone CR, when comparing this one JSON source input.\nconst lf=bytes=>Buffer.from(bytes.toString('latin1').replace(/\\r\\n/g,'\\n'),'latin1');\n";
 const added="  const working=readFileSync(atlas+'/'+path);\n  if(path==='content/coronary-arterial-us-pins.json')\n   assert.deepEqual(lf(working),lf(now),path+': active Atlas bytes differ beyond LF/CRLF');\n  else assert.deepEqual(working,now,path+': exact active Atlas bytes');\n";
 const replacement="   assert.equal(inputs.find(row=>row.path===path)?.sha256,sha(working),name+': '+path);";
 const original="   // The original coronary US JSON learner audit uses CRLF checkout bytes.\n   const learnerDigest=path==='content/coronary-arterial-us-pins.json'\n    ?sha(Buffer.from(before.toString('utf8').replace(/\\n/g,'\\r\\n'))):digest;\n   assert.equal(inputs.find(row=>row.path===path)?.sha256,learnerDigest,name+': '+path);";
 for(const seam of [extra,added,replacement])assert.equal(inverseSource.split(seam).length,2);
 assert.equal(inverseSource.replace(extra,'').replace(added,'').replace(replacement,original),rawRead(new URL('./before/tests/next-five-special-admission.mjs',import.meta.url),'utf8'));
});
