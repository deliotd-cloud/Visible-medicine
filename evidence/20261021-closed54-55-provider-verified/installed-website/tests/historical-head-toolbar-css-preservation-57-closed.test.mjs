import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {syncBuiltinESMExports} from 'node:module';
import {readRevision54} from './historical-current-atlas-delivery-54.mjs';
import {readRevision55} from './historical-current-atlas-delivery-55.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const cssPath='components/head-atlas.css',oldCss='214fbad37e04a7ecd371c073ffb13c36cbcb5eccb208201a314bc6f0d0fdfb15';

test('historical54/55 source retains all statements except declared immutable-reader seams',()=>{
 const originalImport="import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";
 const frozenImport="import {validateCurrentAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';";
 const old54="if(['app/workspace/atlas-review/model/page.tsx','app/workspace/atlas-review/model/embedded/page.tsx'].includes(path))";
 const new54="if(['app/workspace/atlas-review/model/page.tsx','app/workspace/atlas-review/model/embedded/page.tsx','components/head-atlas.css'].includes(path))";
 const old55=" if(documents.has(path))return fixed('closed55-documents/'+path,revision55.documents[path]);\n";
 const new55=old55+" if(path==='components/head-atlas.css'){\n  const bytes=fixed('closed56-overrides/components/head-atlas.css','"+oldCss+"');\n  assert.equal(sha(bytes),oldInputs.get(path),path+' unchanged across closed55/56');\n  return bytes;\n }\n";
 for(const [number,digest,from,to]of [[54,'d40df7c070568f870d6a7c3a1bcabd63811362eeae713173523e4799e7102d6d',old54,new54],[55,'9c6a4d8208046b43180256fa009bc1b73538793b4fc3e85ea8d657bf0bee1a78',old55,new55]]){
  const bytes=fs.readFileSync(new URL(`./fixtures/head-toolbar-reader${number}-original.mjs.txt`,import.meta.url));assert.equal(sha(bytes),digest);
  const old=bytes.toString('utf8');assert.equal(old.split(originalImport).length,2);assert.equal(old.split(from).length,2);
  const expected=old.replace(originalImport,frozenImport).replace(from,to);
  const preEdit=fs.readFileSync(new URL(`./fixtures/closed54-55-provider/historical-current-atlas-delivery-${number}.mjs.raw`,import.meta.url));
  assert.equal(sha(preEdit),number===54?'983baa628d7f4ffa3d94b524365009f63622dce6dbe8bb2cfefd656f2f81300f':'ac8ce7399f77d360d8cc90e1cc3eccb6af5267f10e42babaf56c0017aeaecf7a');
  assert.equal(fs.readFileSync(new URL(`./fixtures/closed57-reader-originals/historical-current-atlas-delivery-${number}.mjs.raw`,import.meta.url),'utf8'),expected);
  const viewer54="if(['app/workspace/atlas-review/model/page.tsx','app/workspace/atlas-review/model/embedded/page.tsx','components/head-atlas.css','components/HeadAtlasViewer.tsx'].includes(path))";
  const viewer55=" if(path==='components/HeadAtlasViewer.tsx'){\n  const bytes=fixed('closed56-inputs/components/HeadAtlasViewer.raw','06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');\n  assert.equal(sha(bytes),oldInputs.get(path),path+' closed55 binding');\n  return bytes;\n }\n";
  const later=number===54?expected.replace(new54,viewer54):expected.replace(" if(frozenSpecial.has(path))",viewer55+" if(frozenSpecial.has(path))");
  assert.notEqual(later,expected);assert.equal(preEdit.toString('utf8'),later);
 }
});

test('old CSS is independently bound by both historical manifests and never read from the current sheet',()=>{
 for(const read of [readRevision54,readRevision55])assert.equal(sha(read(cssPath,{readLive:()=>{throw Error('Unexpected live CSS read');}})),oldCss);
 assert.notEqual(sha(fs.readFileSync(new URL('./fixtures/closed57-overrides/components/head-atlas.css',import.meta.url))),oldCss);
});

test('changing archived CSS bytes is rejected by the actual54 and55 readers',()=>{
 const original=fs.readFileSync;let mutations=0;
 fs.readFileSync=(file,...args)=>{const bytes=original(file,...args);if(String(file).replaceAll('\\','/').endsWith('/closed56-overrides/components/head-atlas.css')){mutations++;return Buffer.concat([bytes,Buffer.from('\n')]);}return bytes;};
 syncBuiltinESMExports();
 try{for(const read of [readRevision54,readRevision55])assert.throws(()=>read(cssPath),/closed55 fixture/);assert.equal(mutations,2);}
 finally{fs.readFileSync=original;syncBuiltinESMExports();}
 for(const read of [readRevision54,readRevision55])assert.equal(sha(read(cssPath)),oldCss);
});
