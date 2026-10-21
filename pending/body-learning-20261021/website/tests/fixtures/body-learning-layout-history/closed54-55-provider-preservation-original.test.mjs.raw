import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {createHash} from 'node:crypto';
import {readClosed54Or55BoundSource} from './closed54-55-bound-source.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=name=>readFileSync(new URL(name,import.meta.url));
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
const rows=[
 ['historical-current-atlas-delivery-54.mjs','983baa628d7f4ffa3d94b524365009f63622dce6dbe8bb2cfefd656f2f81300f'],
 ['historical-current-atlas-delivery-55.mjs','ac8ce7399f77d360d8cc90e1cc3eccb6af5267f10e42babaf56c0017aeaecf7a'],
 ['head-manual-recovery-53-to-54-closed.test.mjs','44447da331496d3685c360eda3199cc18fa7a194cb556384167f33ccbf979dae'],
 ['head-manual-recovery-54-to-55-closed.test.mjs','980b9e962fae18655eeeaab9fdebbcb4113895468d750ea9de4bdb4b8554ea1c'],
 ['historical-head-toolbar-css-preservation-57-closed.test.mjs','baefc07556aeff7188fa891c52001497b92c6a0db19d60c26132233053351119'],
];
const providerImport="import {readClosed54Or55BoundSource} from './closed54-55-bound-source.mjs';\n";
const currentImport="import {validateCurrentAtlasDelivery as validateActualCurrentDelivery} from './current-atlas-delivery.mjs';\n";
const currentTest=`test('actual current190 remains independently bound beyond the closed54/55 transitions',()=>{
 const current=validateActualCurrentDelivery();
 assert.equal(current.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert.equal(current.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');
 assert.equal(current.reviewIntegration,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');
 assert.equal(current.reviewSourceFiles,1553);
 assert.throws(()=>validateActualCurrentDelivery({pin:revision54}));
 assert.throws(()=>validateActualCurrentDelivery({pin:validateRevision55Delivery()}));
});

`;
const viewerProof=`  const preEdit=fs.readFileSync(new URL(\`./fixtures/closed54-55-provider/historical-current-atlas-delivery-\${number}.mjs.raw\`,import.meta.url));
  assert.equal(sha(preEdit),number===54?'983baa628d7f4ffa3d94b524365009f63622dce6dbe8bb2cfefd656f2f81300f':'ac8ce7399f77d360d8cc90e1cc3eccb6af5267f10e42babaf56c0017aeaecf7a');
`;
const viewerLater=`  const viewer54="if(['app/workspace/atlas-review/model/page.tsx','app/workspace/atlas-review/model/embedded/page.tsx','components/head-atlas.css','components/HeadAtlasViewer.tsx'].includes(path))";
  const viewer55=" if(path==='components/HeadAtlasViewer.tsx'){\\n  const bytes=fixed('closed56-inputs/components/HeadAtlasViewer.raw','06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');\\n  assert.equal(sha(bytes),oldInputs.get(path),path+' closed55 binding');\\n  return bytes;\\n }\\n";
  const later=number===54?expected.replace(new54,viewer54):expected.replace(" if(frozenSpecial.has(path))",viewer55+" if(frozenSpecial.has(path))");
  assert.notEqual(later,expected);assert.equal(preEdit.toString('utf8'),later);
`;
function forward(name,source){
 if(name===rows[0][0]){
  source=once(source,"import {readRevision55} from './historical-current-atlas-delivery-55.mjs';\n","import {readRevision55} from './historical-current-atlas-delivery-55.mjs';\n"+providerImport);
  source=once(source,"readLive=p=>readFileSync(new URL(p,site))","readLive=p=>readClosed54Or55BoundSource(54,p)");
  return once(source,"if(['app/workspace/atlas-review/model/page.tsx','app/workspace/atlas-review/model/embedded/page.tsx','components/head-atlas.css','components/HeadAtlasViewer.tsx'].includes(path))","if(['components/head-atlas.css','components/HeadAtlasViewer.tsx'].includes(path))");
 }
 if(name===rows[1][0]){
  source=once(source,"import {validateCurrentAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';\n","import {validateCurrentAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';\n"+providerImport);
  return once(source,"readLive=p=>readFileSync(new URL(p,site))","readLive=p=>readClosed54Or55BoundSource(55,p)");
 }
 if(name===rows[2][0])return source;
 if(name===rows[3][0]){
  source=once(source,"import {revision54,readRevision54,readRevision54Register,validateRevision54Delivery} from './historical-current-atlas-delivery-54.mjs';\n","import {revision54,readRevision54,readRevision54Register,validateRevision54Delivery} from './historical-current-atlas-delivery-54.mjs';\n"+currentImport);
  return once(source,"const modules=['head-neck','shoulder','lower-limb','female-pelvis'];\n\n","const modules=['head-neck','shoulder','lower-limb','female-pelvis'];\n\n"+currentTest);
 }
 source=once(source,"  assert.equal(fs.readFileSync(new URL(\`./fixtures/closed57-reader-originals/historical-current-atlas-delivery-\${number}.mjs.raw\`,import.meta.url),'utf8'),expected);\n",viewerProof+"  assert.equal(fs.readFileSync(new URL(\`./fixtures/closed57-reader-originals/historical-current-atlas-delivery-\${number}.mjs.raw\`,import.meta.url),'utf8'),expected);\n"+viewerLater);
 return source;
}
test('all original historical reader bodies retain exact enumerated forward seams',()=>{
 for(const[name,digest]of rows){const original=read(`./fixtures/closed54-55-provider/${name}.raw`),current=read(`./${name}`);assert.equal(sha(original),digest,name);assert.deepEqual(Buffer.from(forward(name,original.toString())),current,name);}
});
test('undeclared mutation cannot satisfy any complete reader transition',()=>{
 for(const[name]of rows){const original=read(`./fixtures/closed54-55-provider/${name}.raw`);assert.notDeepEqual(Buffer.from(forward(name,original.toString())),Buffer.from(read(`./${name}`).toString()+'\n// forged'),name);}
});
test('five bounded historical witnesses retain exact full bytes',()=>{
 for(const[file,digest]of[
  ['HeadAtlasComparisonNavigation-54.tsx.raw','05d32d7e3fc96e56af9bab7c76ed622d2e6063cd8378ecc4d1f50d0a6f9432d4'],
  ['HeadAtlasLinkedModel-54.tsx.raw','c90fd4b9a51a4fa67ef390fb6b79515825fd662160f83cabd127b7283b8d2fab'],
  ['anatomy-coverage-index-55.json.raw','5a7d458d8010c66c76a2be7817bd72cdcfbfa932ff5b1dcc2d0b835be6102f8a'],
  ['anatomy-coverage-view-55.ts.raw','4918e25d38bff5e11480b3a0ec857bd6c615aebdc2c5c0fc37500f92ba61b8f5'],
  ['import-clinical-review-55.mjs.raw','9ab934dcc6f349000ff20f10311416f32c21bf07a29b98daad53abdc10602a7a'],
 ]){const bytes=read('./fixtures/closed54-55-provider/'+file);assert(bytes.length>0&&bytes.length<250_000);assert.equal(sha(bytes),digest,file);}
});
test('actual witness reader refuses missing, forged and oversized historical bytes',()=>{
 const original=fs.readFileSync,path='components/HeadAtlasComparisonNavigation.tsx',suffix='HeadAtlasComparisonNavigation-54.tsx.raw';
 try{
  for(const mode of ['missing','forged','oversized']){
   let hits=0;
   fs.readFileSync=(file,...args)=>{if(String(file).replaceAll('\\','/').endsWith('/'+suffix)){
    hits++;if(mode==='missing')throw Error('Missing closed54 witness');
    if(mode==='forged')return Buffer.from('forged');
    return Buffer.alloc(250_000);
   }return original(file,...args);};syncBuiltinESMExports();
   assert.throws(()=>readClosed54Or55BoundSource(54,path));assert.equal(hits,1,mode);
  }
 }finally{fs.readFileSync=original;syncBuiltinESMExports();}
 assert.equal(sha(readClosed54Or55BoundSource(54,path)),'05d32d7e3fc96e56af9bab7c76ed622d2e6063cd8378ecc4d1f50d0a6f9432d4');
});
