import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';

// Source-only evidence. Run with: node --experimental-vm-modules PROVE_SOURCE.mjs
// No website module is loaded and no candidate file is written.
const stage='F:/VisibleMedicine/staging/20261022-closed-epoch-preservation';
const candidate='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests';
const receipt='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V6.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const once=(text,before,after)=>{
 assert.equal(text.split(before).length,2,`Unique inverse seam: ${before.slice(0,85)}`);
 return text.replace(before,after);
};
const cases=[
 {name:'closed54-55-provider-preservation.test.mjs',raw:'707db26812327fb29ed63642c65b5ca6f0e7fc55d12995421ff718223b18ef0c',code:'52c9d8ef7fab7f79bda259238e6b5469b91441fd94bc60accb71e41a65675c06',callbacks:['all original historical reader bodies retain exact enumerated forward seams','undeclared mutation cannot satisfy any complete reader transition','five bounded historical witnesses retain exact full bytes'],mutate:'head-manual-recovery-54-to-55-closed.test.mjs'},
 {name:'closed56-femoral-epoch.test.mjs',raw:'1e2111111f5c9798a778710e65057680928c18ae79f954fc40796c4ca01fde4a',code:'bdfa9e209e13b814b7453155ffa0f6c432ca55c35f66b60356eee652cfd8a740',callbacks:['closed56 femoral guards have complete byte-exact inverses to their verified originals'],mutate:'clinical-review-femoral-arterial-admission-56-closed.test.mjs'},
];
assert.equal(sha(readFileSync(receipt)),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c','V6 source receipt');

function inverseProvider(code){
 const start=code.indexOf('const laterCurrentEdits=[\n');
 const end=code.indexOf('const viewerProof=',start);
 assert(start>0&&end>start,'Later current-source block is bounded');
 let raw=once(code,code.slice(start,end),'');
 const current='composeLater(name,forward(name,original.toString()))';
 assert.equal(raw.split(current).length,3,'Both original proof callbacks use the current composition');
 raw=raw.replaceAll(current,'forward(name,original.toString())');
 return raw;
}

function inverseFemoral(code){
 const start=code.indexOf('  const familyTitle=');
 const end=code.indexOf('  let expected=text;',start);
 assert(start>0&&end>start,'Later family block is bounded');
 let raw=once(code,code.slice(start,end),'');
 raw=once(raw,[
  '  const prior=expected;',
  '  for(const [before,after] of laterEdits)expected=replaceExact(expected,before,after,1);',
  "  assert.equal(expected.endsWith('});'+eol),true,stem+': prior guard ending');",
  '  expected+=familyRefusal;',
  '',
 ].join('\n'),'');
 raw=once(raw,"  assert.equal(expected.endsWith(familyRefusal),true,stem+': exact family refusal retained');\n  expected=expected.slice(0,-familyRefusal.length);\n  for(const [before,after] of laterEdits.toReversed())expected=replaceExact(expected,after,before,1);\n  assert.equal(expected,prior,stem+': complete current-to-prior inverse');\n",'');
 return raw;
}

async function callbacks(item,mutated=false){
 const source=readFileSync(path.join(stage,'CODE/tests',item.name),'utf8');
 const bindings=new Map();
 for(const match of source.matchAll(/^import (.*) from '([^']+)';$/gm)){
  const names=match[1].startsWith('{')?match[1].slice(1,-1).split(',').map(value=>value.trim().split(' as ')[0]):['default'];
  bindings.set(match[2],[...new Set([...(bindings.get(match[2])||[]),...names])]);
 }
 const titles=[];
 const context=vm.createContext({Buffer,URL,process,console});
 const module=new vm.SourceTextModule(source,{context,identifier:item.name,initializeImportMeta(meta){meta.url=pathToFileURL(path.join(candidate,item.name)).href;}});
 await module.link(async specifier=>{
  const names=bindings.get(specifier);
  const value=specifier.startsWith('node:')?await import(specifier):{};
  const exports={...value,default:value.default??value};
  if(specifier==='node:fs'&&mutated){
   exports.readFileSync=(file,...args)=>{
    const original=readFileSync(file,...args);
    if(String(file).replaceAll('\\','/').endsWith('/'+item.mutate))return Buffer.from(original.toString()+'\n// forged');
    return original;
   };
  }
  if(specifier==='node:test')exports.default=(title,fn)=>{
   if(item.callbacks.includes(title)){
    if(mutated){
     if(title===item.callbacks[0])assert.throws(fn,/AssertionError|Expected values|no unaccounted guard changes/);
    }else{fn();titles.push(title);}
   }
  };
  return new vm.SyntheticModule(names,function(){for(const name of names)this.setExport(name,exports[name]??(()=>{throw Error(`Unused local import ${specifier}:${name}`)}));},{context});
 });
 await module.evaluate({timeout:10000});
 if(!mutated)assert.deepEqual(titles,item.callbacks,'All selected real source callbacks executed');
 return mutated?'mutation refused':titles;
}

for(const item of cases){
 const raw=readFileSync(path.join(stage,'RAW/tests',item.name));
 const code=readFileSync(path.join(stage,'CODE/tests',item.name));
 const live=readFileSync(path.join(candidate,item.name));
 assert.equal(sha(raw),item.raw,item.name+' exact RAW');
 assert.deepEqual(raw,live,item.name+' V6 candidate byte equality');
 assert.equal(sha(code),item.code,item.name+' exact CODE');
 const inverse=item.name.startsWith('closed54')?inverseProvider(code.toString('utf8')):inverseFemoral(code.toString('utf8'));
 assert.deepEqual(Buffer.from(inverse),raw,item.name+' complete CODE-to-V6 inverse');
 assert.notDeepEqual(Buffer.from(inverse+'\n// forged'),raw,item.name+' inverse mutation refusal');
 assert.notEqual(sha(Buffer.from(code.toString('utf8')+'\n// forged')),item.code,item.name+' CODE mutation refusal');
 console.log(item.name,'inverse and hash mutation refusals passed');
 console.log(item.name,'actual callbacks:',JSON.stringify(await callbacks(item)));
 console.log(item.name,await callbacks(item,true));
}
console.log('source-only proof passed; no native, build, validator, or clinical acceptance');
