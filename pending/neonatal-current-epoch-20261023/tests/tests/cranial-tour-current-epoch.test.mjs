import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {restoreOriginalCranialTourSource,assertCurrentCranialTourEpoch,assertCurrentCranialTourCatalog} from './cranial-tour-current-epoch.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(new URL(p,import.meta.url));
const norm=b=>b.toString().replaceAll('\r\n','\n');
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'One declared neonatal test role');return s.replace(a,b);};

test('complete current tour source admits only the exact renal and hamstring composition',()=>{
  assert.equal(assertCurrentCranialTourEpoch(),'3c5647f29383ba5699b6d387ff528f6b0f8f57b9');
  const root=currentAtlasDeliveryRoot(),source=readFileSync(root+'/lib/regional-tours.ts');
  const old=execFileSync('git',['show','9fba9a1e24b6669aafd48e945d55fc0939d50ab2:lib/regional-tours.ts'],{cwd:root,windowsHide:true});
  assert.deepEqual(restoreOriginalCranialTourSource(source),old);
  for(const changed of [Buffer.concat([source,Buffer.from('\n// unreviewed')]),
    Buffer.from(source.toString().replace("The renal guided tour does not match","Changed renal guard")),
    Buffer.from(source.toString().replace("The hamstring guided tour does not match","Changed hamstring guard"))])
    assert.throws(()=>restoreOriginalCranialTourSource(changed));
  assert.throws(()=>restoreOriginalCranialTourSource(old));
});

test('all historical tours and stops survive; only the renal revision and two exact source tours are added',async()=>{
  const built=await build({stdin:{contents:"export {regionalTours} from './atlas-review/lib/regional-tours';export {hamstringTours} from './atlas-review/lib/hamstring-tours';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  const {regionalTours,hamstringTours}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
  const historical=structuredClone(regionalTours.slice(0,51));historical[19].revision='renal-organs-arteries-orientation-v1';
  // The independently pinned historical whole-array digest is checked inside.
  assertCurrentCranialTourCatalog(historical,regionalTours,hamstringTours);
  for(const changed of [regionalTours.slice(0,-1),
    regionalTours.map((t,i)=>i===0?{...t,title:t.title+' forged'}:t),
    regionalTours.map((t,i)=>i===51?{...t,revision:'unreviewed'}:t)])
    assert.throws(()=>assertCurrentCranialTourCatalog(historical,changed,hamstringTours));
});

test('every original neonatal assertion survives the complete declared test-source inverse',()=>{
  const old=read('./fixtures/neonatal-current-before/clinical-review-neonatal-cranial-us.test.ts.raw');
  assert.equal(sha(old),'94b81cb4b06e64a1781a5bbea45d349d1524dc3e346cdcce0fc54c31a8f3ab5c');
  let source=norm(read('./clinical-review-neonatal-cranial-us.test.ts'));
  const seams=[
    ["import {assertCurrentCranialTourEpoch,assertCurrentCranialTourCatalog} from './cranial-tour-current-epoch.mjs';\n",''],
    ["import {readNeonatalInboxContexts} from './neonatal-inbox-contexts.mjs';\n",''],
    ["import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';\n",''],
    ["    \"export {hamstringTours} from './atlas-review/lib/hamstring-tours';\",\n",''],
    ["assert.equal(git(['rev-parse',revision+':lib/regional-tours.ts']).toString().trim(),assertCurrentCranialTourEpoch());",
      "assert.equal(git(['rev-parse',revision+':lib/regional-tours.ts']).toString().trim(),currentTourBlob);"],
    ["  const liveApi=await imported(),rawCatalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');\n",
      "  const liveApi=await imported(),rawCatalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');\n  assert.equal(liveApi.regionalTours.length,51);assert.equal(liveApi.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),309);\n"],
    ["  assertCurrentCranialTourCatalog(firstDelivery.regionalTours,liveApi.regionalTours,liveApi.hamstringTours);\n",''],
    ["  const learnerJs=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder').map(({name,base,manifest})=>{\n    for(const f of manifest.files.filter((f:File)=>f.path.endsWith('.js')))\n      assert.equal(sha(readFileSync(base+f.path)),f.sha256,`${name}: ${f.path}`);\n    return {name,text:emittedTeachingSearch(base,manifest.files)};\n  });",
      "  const learnerJs=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder').map(({name,base,manifest})=>({name,\n    text:manifest.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{\n      const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256,`${name}: ${f.path}`);\n      return bytes.toString();}).join('\\n')}));"],
    ["  const {currentContexts,priorContexts}=readNeonatalInboxContexts();\n  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox();",
      "  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox(),api=await imported();"],
    ["  for(const {entry} of selected){",
      "  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);\n  const before=await prior.exactSourceHistoryApi(parent,'review-security');\n  for(const {entry} of selected){"],
    ["    const previous=priorContexts[entry.id],now=currentContexts[entry.id];",
      "    const previous=await before.bodyReviewContext(entry.id),now=await api.bodyReviewContext(entry.id);"],
  ];
  for(const[a,b]of seams)source=once(source,a,b);
  assert.equal(source,norm(old),'Only the declared current-source, streaming and isolated-context roles differ; CRLF normalization only');
});
