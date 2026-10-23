import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {revision56,readRevision56,historicalAtlasGitRoot,validateCurrentAtlasDelivery as validateClosed56} from './historical-current-atlas-delivery-56.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=new URL('./fixtures/',import.meta.url);
const sources={
 arterial:'17dd42ff6588d9d5b5535076ccef162ef9f66e84f6ae559c2d050609d0388b36',
 venous:'4aeaa847abaaa8031678034e24b2efe28a6b17dffe14ca84d0e6064c3fa32180',
};

test('closed56 femoral guards have complete byte-exact inverses to their verified originals',()=>{
 for(const [stem,digest] of Object.entries(sources)){
  const original=readFileSync(new URL(`closed56-guard-${stem}.mjs.txt`,fixture));
  assert.equal(sha(original),digest);
  const text=original.toString('utf8');
  const eol=text.includes('\r\n')?'\r\n':'\n';
  const title=stem==='arterial'?'all original arterial assertions survive only the current admission seam':'every original venous assertion survives only the current admission seam';
  const newTitle=stem==='arterial'?'all original arterial assertions survive the exact current pin and source-root seams':'every original venous assertion survives the exact current pin and source-root seams';
  const refusal=stem==='arterial'?'tampered historical assertions or an added read cannot masquerade as the two-seam migration':'mutated historical assertions or an extra read cannot pass the two-seam check';
  const newRefusal=stem==='arterial'?'tampered historical assertions or an added read cannot masquerade as the exact current migration':'mutated historical assertions or an extra read cannot pass the exact current migration';
  const edits=[
   ['currentAtlasDeliveryRoot()','historicalAtlasGitRoot()',2],
   ["import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';","import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,historicalAtlasGitRoot} from './historical-current-atlas-delivery-56.mjs';",1],
   ["const newImport=oldImport+\"\\nimport {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\";","const newImport=oldImport+\"\\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\";",1],
   ['const exact=original.replace(oldImport,newImport).replace(oldPin,newPin);',"const oldRoot=\"const atlas='F:/VisibleMedicine/atlas';\";"+eol+"const newRoot='const atlas=currentAtlasDeliveryRoot();';"+eol+'const exact=original.replace(oldImport,newImport).replace(oldPin,newPin).replace(oldRoot,newRoot);',1],
   [title,newTitle,1],
   [' assert.equal(original.split(oldPin).length,2);',' assert.equal(original.split(oldPin).length,2);'+eol+' assert.equal(original.split(oldRoot).length,2);',1],
   [refusal,newRefusal,1],
   ['candidate.replace(newPin,oldPin),candidate.replace(newImport','candidate.replace(newPin,oldPin),candidate.replace(newRoot,oldRoot),candidate.replace(newImport',1],
  ];
  const replaceExact=(input,before,after,count)=>{
   assert.equal(input.split(before).length-1,count,stem+': expected unique seam '+before);
   return input.replaceAll(before,after);
  };
  const familyTitle=stem==='arterial'?'arterial family admission refuses changed runtime scope or disabled source':'venous family admission refuses changed runtime scope or disabled source';
  const familyRefusal=`test('${familyTitle}',()=>{${eol} const text=admittedBytes.toString('utf8');${eol} for(const [from,to] of [${eol}  ['manifest.sourceCommit,admission.runtimeSources[name]','manifest.sourceCommit,revision'],${eol}  ['assert.equal(entries.length,6)','assert.equal(entries.length,5)'],${eol} ]){${eol}  assert.equal(text.split(from).length,2);${eol}  assert.throws(()=>reconstructFamilyPrior('${stem}',Buffer.from(text.replace(from,to)),priorBytes));${eol} }${eol} assert.throws(()=>reconstructFamilyPrior('${stem}',Buffer.from('if(false){\\n'+text+'\\n}'),priorBytes));${eol}});${eol}`;
  const laterEdits=[
   ["import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,historicalAtlasGitRoot} from './historical-current-atlas-delivery-56.mjs';","import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,historicalAtlasGitRoot} from './historical-current-atlas-delivery-56.mjs';"+eol+"import {reconstructFamilyPrior} from './clinical-family-prior-current-inverse.mjs';"],
   [`const candidate=readFileSync(new URL('./clinical-review-femoral-${stem}-xray.test.ts',import.meta.url),'utf8');`,`const admittedBytes=readFileSync(new URL('./clinical-review-femoral-${stem}-xray.test.ts',import.meta.url));`+eol+`const priorBytes=readFileSync(new URL('./fixtures/clinical-review-femoral-${stem}-xray.test.ts.prior-current.raw',import.meta.url));`+eol+`const candidate=reconstructFamilyPrior('${stem}',admittedBytes,priorBytes).toString('utf8');`],
  ];
  let expected=text;
  for(const [before,after,count] of edits)expected=replaceExact(expected,before,after,count);
  const prior=expected;
  for(const [before,after] of laterEdits)expected=replaceExact(expected,before,after,1);
  assert.equal(expected.endsWith('});'+eol),true,stem+': prior guard ending');
  expected+=familyRefusal;
  const actual=readFileSync(new URL(`./clinical-review-femoral-${stem}-admission-56-closed.test.mjs`,import.meta.url),'utf8');
  assert.equal(actual,expected,stem+': no unaccounted guard changes');
  assert.equal(expected.endsWith(familyRefusal),true,stem+': exact family refusal retained');
  expected=expected.slice(0,-familyRefusal.length);
  for(const [before,after] of laterEdits.toReversed())expected=replaceExact(expected,after,before,1);
  assert.equal(expected,prior,stem+': complete current-to-prior inverse');
  for(const [before,after,count] of edits.toReversed())expected=replaceExact(expected,after,before,count);
  assert.equal(expected,text,stem+': complete inverse restores the raw guard');
 }
});

test('closed56 documents and declared inputs refuse tampering and undeclared reads',()=>{
 assert.deepEqual(validateClosed56(),revision56);
 assert(historicalAtlasGitRoot());
 assert.throws(()=>validateClosed56({pin:{...revision56,reviewIntegration:'0'.repeat(64)}}));
 assert.throws(()=>validateClosed56({pin:{...revision56,documents:{...revision56.documents,'atlas-review/manifest.json':'0'.repeat(64)}}}));
 assert.throws(()=>readRevision56('../.env.local'));
 assert.throws(()=>readRevision56('tests/not-declared.mjs'));
 const path='components/HeadAtlasComparisonNavigation.tsx';
 assert.throws(()=>readRevision56(path,{readLive:()=>Buffer.from('tampered')}));
 assert.throws(()=>readRevision56(path,{readLive:()=>new Uint8Array(4)}));
 // An unchanged declared input is admitted only if the raw bytes still match.
 const original=readFileSync(new URL(`closed56-inputs/${path}.txt`,fixture));
 assert.equal(sha(readRevision56(path,{readLive:()=>original})),sha(original));
});

test('closed56 shape is independent of live/default documents and rejects changed validator bytes',async t=>{
 const isolated=()=>{
  const root=mkdtempSync(join(tmpdir(),'vm-closed56-proof-'));
  t.after(()=>{
   assert(realpathSync(root).startsWith(resolve(tmpdir())+sep));
   rmSync(root,{recursive:true,force:true});
  });
  const tests=join(root,'tests'),fixtures=join(tests,'fixtures');
  mkdirSync(fixtures,{recursive:true});
  cpSync(new URL('./historical-current-atlas-delivery-56.mjs',import.meta.url),join(tests,'historical-current-atlas-delivery-56.mjs'));
  cpSync(new URL('./historical-website-root.mjs',import.meta.url),join(tests,'historical-website-root.mjs'));
  for(const name of ['current-atlas-delivery-56.json','closed56-documents','closed56-validator','closed56-inputs'])cpSync(new URL(name,fixture),join(fixtures,name),{recursive:true});
  writeFileSync(join(tests,'current-atlas-delivery.mjs'),"throw Error('live validator must not load');\n");
  writeFileSync(join(fixtures,'current-atlas-delivery.json'),'{"corrupt":true}\n');
  mkdirSync(join(root,'atlas-review'),{recursive:true});
  writeFileSync(join(root,'atlas-review','manifest.json'),'{"corrupt":true}\n');
  return {root,entry:pathToFileURL(join(tests,'historical-current-atlas-delivery-56.mjs')).href};
 };
 const independent=isolated();
 const closed=await import(independent.entry);
 assert.deepEqual(closed.validateCurrentAtlasDelivery(),revision56);
 assert.equal(sha(closed.readRevision56('components/HeadAtlasViewer.tsx',{readLive:()=>{throw Error('isolated reader reached live viewer');}})),'06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');
 const tampered=isolated();
 const frozen=join(tampered.root,'tests','fixtures','closed56-validator','tests','current-atlas-delivery.mjs');
 writeFileSync(frozen,readFileSync(frozen,'utf8')+'\n// tampered\n');
 await assert.rejects(import(tampered.entry),/Closed56 fixture changed: closed56-validator\/tests\/current-atlas-delivery.mjs/);
});

test('live femoral admission follows the independently validated current delivery',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,pin.source);
 assert.equal(pin.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
 assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
 assert.deepEqual(pin.runtimeSources,{'head-neck':pin.source,shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9','lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9','female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9'});
 assert.notEqual(pin.source,revision56.source);
 assert.notEqual(pin.source,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
 const inputs=JSON.parse(readFileSync(new URL('../atlas-review/integration-inputs.json',import.meta.url)));
 assert.equal(pin.reviewIntegration,sha(JSON.stringify(inputs.inputs)));
 const review=JSON.parse(readFileSync(new URL('../atlas-review/manifest.json',import.meta.url)));
 assert.equal(pin.reviewSourceFiles,review.files.length);
 assert.equal(review.files.length,1562);
 assert.equal(inputs.inputs.length,1729);
 const inventory=JSON.parse(readFileSync(new URL('../lib/atlas-model-inventory.json',import.meta.url)));
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap(model=>model.paths).length,144);
 assert(currentAtlasDeliveryRoot());
 assert.throws(()=>validateCurrentAtlasDelivery({pin:revision56}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}));
});
