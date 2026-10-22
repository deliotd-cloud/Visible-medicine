import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {closed56LaterEdits,reconstructClosed56BeforeFamily} from './closed56-family-source-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=[
 ['current-atlas-delivery.test.mjs','7955fd210cb57b94667ae03b025987d196583e49cfbece5f056b44f80089c91c','current-atlas-delivery-57-closed.test.mjs',[
  ["from './current-atlas-delivery.mjs';","from './historical-current-atlas-delivery-57.mjs';\nimport {readRevision57,revision57,oldWebsiteRoot} from './historical-current-atlas-delivery-57.mjs';"],
  ["const root=fileURLToPath(new URL('../',import.meta.url));","const root=oldWebsiteRoot;"],
  ["const pin=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery.json',import.meta.url)));","const pin=revision57;"],
  ["const read=path=>readFileSync(root+'/'+path);","const read=path=>readRevision57(path);"],
 ]],
 ['current-atlas-delivery-56-to-57.test.mjs','ffa7568dab4fb717729e5f3628f7ff7e9ff8f4da694e0b2d4908eaafd644bacc','current-atlas-delivery-56-to-57-closed.test.mjs',[
  ["import {readRevision56,revision56,validateCurrentAtlasDelivery as validateClosed56} from './historical-current-atlas-delivery-56.mjs';","import {readRevision56,revision56,validateCurrentAtlasDelivery as validateClosed56} from './historical-current-atlas-delivery-56.mjs';\nimport {readRevision57} from './historical-current-atlas-delivery-57.mjs';"],
  ["const read=path=>readFileSync(join(root,path));","const read=path=>readRevision57(path);"],
  ["const delivery=await import(pathToFileURL(join(root,'tests/current-atlas-delivery.mjs')).href);","const delivery=await import('./historical-current-atlas-delivery-57.mjs');"],
 ]],
 ['historical-head-toolbar-css-preservation.test.mjs','41882e45c433974ebe10ac4dc489ad84f65e787a0b56500add2e49bab203cb26','historical-head-toolbar-css-preservation-57-closed.test.mjs',[
  ["new URL(`./historical-current-atlas-delivery-${number}.mjs`,import.meta.url)","new URL(`./fixtures/closed57-reader-originals/historical-current-atlas-delivery-${number}.mjs.raw`,import.meta.url)"],
  ["new URL('../components/head-atlas.css',import.meta.url)","new URL('./fixtures/closed57-overrides/components/head-atlas.css',import.meta.url)"],
 ]],
 ['closed56-femoral-epoch.test.mjs','09cc0dc099c4973e401c7672006ac3966a812f12cdcbedc5735f3b9e66a22463','closed56-femoral-epoch.test.mjs',[
  ["for(const name of ['current-atlas-delivery-56.json','closed56-documents','closed56-validator'])","for(const name of ['current-atlas-delivery-56.json','closed56-documents','closed56-validator','closed56-inputs'])"],
  [" assert.deepEqual(closed.validateCurrentAtlasDelivery(),revision56);"," assert.deepEqual(closed.validateCurrentAtlasDelivery(),revision56);\n assert.equal(sha(closed.readRevision56('components/HeadAtlasViewer.tsx',{readLive:()=>{throw Error('isolated reader reached live viewer');}})),'06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');"],
  ["  cpSync(new URL('./historical-current-atlas-delivery-56.mjs',import.meta.url),join(tests,'historical-current-atlas-delivery-56.mjs'));","  cpSync(new URL('./historical-current-atlas-delivery-56.mjs',import.meta.url),join(tests,'historical-current-atlas-delivery-56.mjs'));\n  cpSync(new URL('./historical-website-root.mjs',import.meta.url),join(tests,'historical-website-root.mjs'));"],
 ]],
];

// Explicit later current-source seams; original closed57 fixtures stay immutable.
const closed56CurrentEdits=[
 [
  "import {revision56,readRevision56,validateCurrentAtlasDelivery as validateClosed56}",
  "import {revision56,readRevision56,historicalAtlasGitRoot,validateCurrentAtlasDelivery as validateClosed56}"
 ],
 [
  "test('closed56 femoral guards retain exact verified source with only their delivery import redirected',()=>{\n const before=\"import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\";\n const after=\"import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './historical-current-atlas-delivery-56.mjs';\";\n for(const [stem,digest] of Object.entries(sources)){\n  const original=readFileSync(new URL(`closed56-guard-${stem}.mjs.txt`,fixture));\n  assert.equal(sha(original),digest);\n  const text=original.toString('utf8');\n  assert.equal(text.split(before).length,2);\n  assert.equal(readFileSync(new URL(`./clinical-review-femoral-${stem}-admission-56-closed.test.mjs`,import.meta.url),'utf8'),text.replace(before,after));\n }\n});\n\n",
  "test('closed56 femoral guards have complete byte-exact inverses to their verified originals',()=>{\n for(const [stem,digest] of Object.entries(sources)){\n  const original=readFileSync(new URL(`closed56-guard-${stem}.mjs.txt`,fixture));\n  assert.equal(sha(original),digest);\n  const text=original.toString('utf8');\n  const eol=text.includes('\\r\\n')?'\\r\\n':'\\n';\n  const title=stem==='arterial'?'all original arterial assertions survive only the current admission seam':'every original venous assertion survives only the current admission seam';\n  const newTitle=stem==='arterial'?'all original arterial assertions survive the exact current pin and source-root seams':'every original venous assertion survives the exact current pin and source-root seams';\n  const refusal=stem==='arterial'?'tampered historical assertions or an added read cannot masquerade as the two-seam migration':'mutated historical assertions or an extra read cannot pass the two-seam check';\n  const newRefusal=stem==='arterial'?'tampered historical assertions or an added read cannot masquerade as the exact current migration':'mutated historical assertions or an extra read cannot pass the exact current migration';\n  const edits=[\n   ['currentAtlasDeliveryRoot()','historicalAtlasGitRoot()',2],\n   [\"import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\",\"import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,historicalAtlasGitRoot} from './historical-current-atlas-delivery-56.mjs';\",1],\n   [\"const newImport=oldImport+\\\"\\\\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\\\";\",\"const newImport=oldImport+\\\"\\\\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\\\";\",1],\n   ['const exact=original.replace(oldImport,newImport).replace(oldPin,newPin);',\"const oldRoot=\\\"const atlas='F:/VisibleMedicine/atlas';\\\";\"+eol+\"const newRoot='const atlas=currentAtlasDeliveryRoot();';\"+eol+'const exact=original.replace(oldImport,newImport).replace(oldPin,newPin).replace(oldRoot,newRoot);',1],\n   [title,newTitle,1],\n   [' assert.equal(original.split(oldPin).length,2);',' assert.equal(original.split(oldPin).length,2);'+eol+' assert.equal(original.split(oldRoot).length,2);',1],\n   [refusal,newRefusal,1],\n   ['candidate.replace(newPin,oldPin),candidate.replace(newImport','candidate.replace(newPin,oldPin),candidate.replace(newRoot,oldRoot),candidate.replace(newImport',1],\n  ];\n  const replaceExact=(input,before,after,count)=>{\n   assert.equal(input.split(before).length-1,count,stem+': expected unique seam '+before);\n   return input.replaceAll(before,after);\n  };\n  let expected=text;\n  for(const [before,after,count] of edits)expected=replaceExact(expected,before,after,count);\n  const actual=readFileSync(new URL(`./clinical-review-femoral-${stem}-admission-56-closed.test.mjs`,import.meta.url),'utf8');\n  assert.equal(actual,expected,stem+': no unaccounted guard changes');\n  for(const [before,after,count] of edits.toReversed())expected=replaceExact(expected,after,before,count);\n  assert.equal(expected,text,stem+': complete inverse restores the raw guard');\n }\n});\n\n"
 ],
 [
  " assert.deepEqual(validateClosed56(),revision56);",
  " assert.deepEqual(validateClosed56(),revision56);\n assert(historicalAtlasGitRoot());"
 ],
 [
  " assert.equal(pin.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');",
  " assert.equal(pin.source,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');"
 ],
 [
  " assert.equal(pin.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');",
  " assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');\n assert.notEqual(pin.source,revision56.source);"
 ],
 [
  " assert(currentAtlasDeliveryRoot());",
  " assert(currentAtlasDeliveryRoot());\n assert.throws(()=>validateCurrentAtlasDelivery({pin:revision56}));"
 ]
];

// Later admission seams are reversible only after the complete closed57 epoch fixture.
const viewerProof=`  const preEdit=fs.readFileSync(new URL(\`./fixtures/closed54-55-provider/historical-current-atlas-delivery-\${number}.mjs.raw\`,import.meta.url));
  assert.equal(sha(preEdit),number===54?'983baa628d7f4ffa3d94b524365009f63622dce6dbe8bb2cfefd656f2f81300f':'ac8ce7399f77d360d8cc90e1cc3eccb6af5267f10e42babaf56c0017aeaecf7a');
`;
const viewerLater=`  const viewer54="if(['app/workspace/atlas-review/model/page.tsx','app/workspace/atlas-review/model/embedded/page.tsx','components/head-atlas.css','components/HeadAtlasViewer.tsx'].includes(path))";
  const viewer55=" if(path==='components/HeadAtlasViewer.tsx'){\\n  const bytes=fixed('closed56-inputs/components/HeadAtlasViewer.raw','06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');\\n  assert.equal(sha(bytes),oldInputs.get(path),path+' closed55 binding');\\n  return bytes;\\n }\\n";
  const later=number===54?expected.replace(new54,viewer54):expected.replace(" if(frozenSpecial.has(path))",viewer55+" if(frozenSpecial.has(path))");
  assert.notEqual(later,expected);assert.equal(preEdit.toString('utf8'),later);
`;
const viewerProviderEdits=[
 ["  assert.equal(fs.readFileSync(new URL(\`./fixtures/closed57-reader-originals/historical-current-atlas-delivery-\${number}.mjs.raw\`,import.meta.url),'utf8'),expected);\n",viewerProof+"  assert.equal(fs.readFileSync(new URL(\`./fixtures/closed57-reader-originals/historical-current-atlas-delivery-\${number}.mjs.raw\`,import.meta.url),'utf8'),expected);\n"+viewerLater],
];

for(const [name,digest,candidate,edits] of cases)test(name+' preserves every old assertion and expected literal',()=>{
 const original=readFileSync(new URL('./fixtures/closed57-original-tests/'+name+'.raw',import.meta.url));
 assert.equal(sha(original),digest);
 let exact=original.toString('utf8');
 for(const [before,after] of edits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}
 if(name==='closed56-femoral-epoch.test.mjs'){
  const previous=exact;
  for(const [before,after] of closed56CurrentEdits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}
  let inverse=exact;
  for(const [before,after] of closed56CurrentEdits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}
  assert.equal(inverse,previous,'Complete epoch migration inverse');
  for(const [before,after] of closed56LaterEdits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}
 }
 if(name==='historical-head-toolbar-css-preservation.test.mjs')for(const [before,after] of viewerProviderEdits){assert.equal(exact.split(before).length,2,before);exact=exact.replace(before,after);}
 const current=readFileSync(new URL('./'+candidate,import.meta.url),'utf8');
 const actual=name==='closed56-femoral-epoch.test.mjs'?reconstructClosed56BeforeFamily(current,exact):current;
 if(name==='closed56-femoral-epoch.test.mjs'){
  assert.notEqual(current,actual,'The reviewed family addition is present');
  assert.throws(()=>reconstructClosed56BeforeFamily(current+'\n// forged',exact),/Complete pre-family source restored/);
 }
 const difference=[...actual].findIndex((value,index)=>value!==exact[index]);
 assert.equal(actual===exact,true,`${name} first difference ${difference}; lengths ${actual.length}/${exact.length}; actual=${JSON.stringify(actual.slice(difference,difference+80))}; expected=${JSON.stringify(exact.slice(difference,difference+80))}`);
 let inverse=exact;
 if(name==='historical-head-toolbar-css-preservation.test.mjs')for(const [before,after] of viewerProviderEdits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}
 if(name==='closed56-femoral-epoch.test.mjs')for(const [before,after] of closed56LaterEdits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}
 if(name==='closed56-femoral-epoch.test.mjs')for(const [before,after] of closed56CurrentEdits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}
 for(const [before,after] of edits.toReversed()){assert.equal(inverse.split(after).length,2,after);inverse=inverse.replace(after,before);}
 assert.equal(inverse,original.toString('utf8'),'Complete closed57 original inverse');
 assert.notEqual(exact+'\n',exact);
});
