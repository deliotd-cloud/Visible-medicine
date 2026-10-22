import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';

// Run with node --experimental-vm-modules PROVE_SOURCE.mjs.
// Only staged test source is substituted; fixtures still resolve at frozen V6.
const stage='F:/VisibleMedicine/staging/20261022-closed56-followup-consumers';
const v6='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests';
const reviewed='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website/tests';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=['closed56-whole-role-transition-20261021.test.mjs','closed57-original-tests.test.mjs'];
const helper='closed56-family-source-inverse.mjs';
const family='closed56-femoral-epoch.test.mjs';
const expectedRaw={
 'closed56-whole-role-transition-20261021.test.mjs':'1e416bf0b40fbfd09be0389cc7341325307b9a84684594db449f60094394657c',
 'closed57-original-tests.test.mjs':'ac08121a7e58bf747880bd1a0c24c9479ee51ffdb8cfa0c7a2b2ef7f4ed10966',
};
const expectedCode={
 'closed56-whole-role-transition-20261021.test.mjs':'528d9617d057dce76e8992800a3a75a0c2fed6d51b2d40f20494882b299d88ed',
 'closed57-original-tests.test.mjs':'8cc464c8c3db16107c0a1d283650c35c6ed087ebdb4270ae11d0712217c3c2df',
};
const once=(source,before,after)=>{
 assert.equal(source.split(before).length,2,'Unique exact consumer seam: '+before.slice(0,70));
 return source.replace(before,after);
};
const span=(source,start,end)=>{
 assert.equal(source.split(start).length,2,'Unique source span start: '+start);
 assert.equal(source.split(end).length,2,'Unique source span end: '+end);
 const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
 assert(to>from,'Ordered source span');
 return source.slice(from,to);
};
function inverseConsumer(name,code,raw){
 let result=code;
 const importLine="import {closed56LaterEdits,reconstructClosed56BeforeFamily} from './closed56-family-source-inverse.mjs';\n";
 result=once(result,importLine,'');
 if(name.startsWith('closed56-whole')){
  result=once(result," const later=name==='closed56-femoral-epoch.test.mjs'?closed56LaterEdits.slice(3).map(([before,after])=>seam(before,after)):[];\n",'');
  result=once(result,
   span(code," for(const [i,step] of later.entries())"," for(const [i,step] of steps.toReversed()"),
   span(raw,' assert.equal(newText,expected',' for(const [i,step] of steps.toReversed()'));
  result=once(result,
   " assert.throws(()=>later.length?reconstructClosed56BeforeFamily(removed,expected):assert.equal(removed,expected),name+': removing an original negative is refused');",
   " assert.throws(()=>assert.equal(removed,expected),name+': removing an original negative is refused');");
  result=once(result,
   " assert.throws(()=>later.length?reconstructClosed56BeforeFamily(newText+'\\nconst unknown=true;\\n',expected):assert.equal(newText+'\\nconst unknown=true;\\n',expected),name+': unknown append is refused');",
   " assert.throws(()=>assert.equal(newText+'\\nconst unknown=true;\\n',expected),name+': unknown append is refused');");
 }else{
  const array=span(raw,'const closed56LaterEdits=[','const viewerProof=');
  result=once(result,'const viewerProof=',array+'const viewerProof=');
  result=once(result,span(code," const current=readFileSync(new URL('./'+candidate",' const difference='),span(raw," const actual=readFileSync(new URL('./'+candidate",' const difference='));
 }
 return result;
}
for(const name of names){
 const raw=readFileSync(path.join(stage,'RAW/tests',name));
 const code=readFileSync(path.join(stage,'CODE/tests',name));
 assert.equal(sha(raw),expectedRaw[name],name+' frozen whole raw');
 assert.equal(sha(code),expectedCode[name],name+' proposed whole code');
 assert.deepEqual(raw,readFileSync(path.join(v6,name)),name+' V6 identity');
 assert.deepEqual(Buffer.from(inverseConsumer(name,code.toString('utf8'),raw.toString('utf8'))),raw,name+' complete CODE-to-RAW inverse');
 assert.notDeepEqual(Buffer.from(inverseConsumer(name,code.toString('utf8')+'\n// forged',raw.toString('utf8'))),raw,name+' append mutation refused');
}
assert.equal(sha(readFileSync(path.join(stage,'CODE/tests',helper))),'a7a21ced5b6e8661de3a26937b73c451bb27cbb2b8056a97a6e5ccf830661398','Exact inverse helper');
assert.equal(sha(readFileSync('F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V6.json')),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c','Frozen V6 receipt');
const reviewedFemoral=readFileSync(path.join(reviewed,family));
assert.equal(sha(reviewedFemoral),'9b666215eb5f12c2ab7564cf6ffe6e560682efb46d033a4bd13d88ecaf389f4e','Reviewed new family source');

async function run(name,mutation){
 const context=vm.createContext({Buffer,URL,process,console});
 const titles=[];
 const source=readFileSync(path.join(stage,'CODE/tests',name),'utf8');
 const helperSource=readFileSync(path.join(stage,'CODE/tests',helper),'utf8');
 const entry=new vm.SourceTextModule(source,{context,identifier:pathToFileURL(path.join(v6,name)).href,initializeImportMeta(meta,module){meta.url=module.identifier;}});
 const local=new vm.SourceTextModule(helperSource,{context,identifier:pathToFileURL(path.join(v6,helper)).href,initializeImportMeta(meta,module){meta.url=module.identifier;}});
 const native=new Map();
 const loadNative=async specifier=>{
  if(native.has(specifier))return native.get(specifier);
  const imports=await import(specifier);
  const keys=Object.keys(imports);
  if(!keys.includes('default'))keys.push('default');
  const module=new vm.SyntheticModule(keys,function(){
   for(const key of keys){
    let value=imports[key]??imports;
    if(specifier==='node:test'&&key==='default')value=(title,fn)=>{
     if(mutation&&(title.includes('femoral current role')||title.startsWith('closed56-femoral-epoch.test.mjs'))){
      assert.throws(()=>fn(),/Complete pre-family source restored|Exact reviewed family span|Unique family start|Unique current 1724 input count/);
     }else{fn();titles.push(title);}
    };
    if(specifier==='node:fs'&&key==='readFileSync')value=(file,...args)=>{
     const target=String(file).replaceAll('\\','/');
     if(target.endsWith('/'+family)){
      const text=reviewedFemoral.toString('utf8');
      const changed=mutation==='append'?text+'\n// forged':mutation==='span'?text.replace('  const familyTitle=','  const familyTitle ='):mutation==='count'?text.replace(' assert.equal(inputs.inputs.length,1724);',' assert.equal(inputs.inputs.length,1725);'):text;
      const bytes=Buffer.from(changed);
      return args[0]==='utf8'?bytes.toString('utf8'):bytes;
     }
     return readFileSync(file,...args);
    };
    this.setExport(key,value);
   }
  },{context});
  native.set(specifier,module);
  return module;
 };
 await entry.link(specifier=>specifier==='./'+helper?local:loadNative(specifier));
 await entry.evaluate({timeout:10000});
 assert.equal(titles.length,mutation?3:4,name+' actual source callbacks');
 return titles;
}
for(const name of names){
 console.log(name,JSON.stringify(await run(name,false)));
 for(const mutation of ['append','span','count']){
  await run(name,mutation);
  console.log(name,mutation,'refused');
 }
}
console.log('source callback proof passed; no native suite, build, or clinical acceptance');
