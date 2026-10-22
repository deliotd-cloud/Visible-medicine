// Pure source-byte/Git-object proof. No website module, test, transpiler or validator is imported.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const stage=fileURLToPath(new URL('.',import.meta.url));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/';
const atlas='F:/VisibleMedicine/atlas';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(p);
const raw=n=>read(stage+'RAW/tests/'+n);
const code=n=>read(stage+'CODE/tests/'+n);
const inverse=(text,from,to,label)=>{
 assert.equal(text.split(from).length,2,'Unique inverse: '+label);
 return text.replace(from,to);
};
const removeBetween=(text,left,right,label)=>{
 assert.equal(text.split(left).length,2,'Unique left: '+label);
 const start=text.indexOf(left)+left.length;
 assert.equal(text.slice(start).split(right).length,2,'Unique right: '+label);
 const end=text.indexOf(right,start);
 assert.ok(end>start,'Nonempty added segment: '+label);
 return text.slice(0,start)+text.slice(end);
};
const originalHashes={
 'clinical-review-cervical-disc-tour.test.ts':'36b41c79a10d04fedc0bbb962accf58486ec2542f819e94aca3654d70a42f365',
 'clinical-review-continuous-guided-playback.test.ts':'26cabf16c9c2166c0415efcf23e29612586ca29dec039ea0985a62bfd3b1003c',
 'expanded-viewer-type-preservation.test.mjs':'13c74f1c9c5d37207163dce2c7edf19163caf4013e9623bae0d6008036def786',
 'cervical-current-history-context-contract.test.mjs':'942386357c90782e6d357d936f3d2b7646597e5313d0e126221448f0ee3af6b3',
};
for(const [name,hash] of Object.entries(originalHashes)){
 assert.deepEqual(raw(name),read(website+'tests/'+name),'Exact frozen RAW preimage: '+name);
 assert.equal(sha(raw(name)),hash,'Frozen SHA: '+name);
}
const priorQueue=read(stage+'PRIOR_QUEUE/tests/cervical-current-history-context-contract.test.mjs');
assert.equal(sha(priorQueue),'82d6299acf09abc68b9cccf7e38324dac7a4bd643b65441eb38011d55ec17cb1');
const helper=read(stage+'CODE/tests/cervical-family-source-adapter.mjs');
assert.equal(sha(helper),'bf8b51eb82123898b47f4e3dc8f973e89ad8aceaa8a1baea35136bb6ec6c425f');
const typed=read(stage+'CODE/tests/fixtures/cervical-disc-tour-typed-current-before-family.test.ts.raw');
assert.equal(sha(typed),originalHashes['clinical-review-cervical-disc-tour.test.ts']);
assert.deepEqual(typed,raw('clinical-review-cervical-disc-tour.test.ts'),'Full typed prior fixture');
const actualAdapter=await import(new URL('./CODE/tests/cervical-family-source-adapter.mjs',import.meta.url));
const initialBadDigest='8f39ef8f48cbb6c0970bd14c2e92ed75efcabe8a1db4c65d2b915bad1b8daff';
assert.equal(initialBadDigest.length,63,'V1 helper digest was incomplete and always rejected');
assert.notEqual(sha(code('clinical-review-cervical-disc-tour.test.ts')),initialBadDigest,
 'Main-observed V1 refusal reproduced as source-hash mismatch');
assert.equal(actualAdapter.cervicalFamilyCurrentSha,
 '8f39ef8f48cbb6c0970bd14c2e92ed75eefcabe8a1db4c65d2b915bad1b8daff');
assert.deepEqual(actualAdapter.restoreCervicalTypedPrior(code('clinical-review-cervical-disc-tour.test.ts')),
 typed,'Actual V2 helper accepts new current source and restores complete 36b bytes');
const familySeams=[
 ["import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
 [" const deliveryPin=validateCurrentAtlasDelivery();\n assert.equal(deliveryRevision,deliveryPin.source,'Review remains bound to current Atlas source');\n",''],
 ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);',
  'assert.equal(manifest.sourceCommit,deliveryRevision,name);'],
];
let cervical=code('clinical-review-cervical-disc-tour.test.ts').toString('utf8');
assert.equal(sha(Buffer.from(cervical)),'8f39ef8f48cbb6c0970bd14c2e92ed75eefcabe8a1db4c65d2b915bad1b8daff');
for(const [from,to] of familySeams)cervical=inverse(cervical,from,to,'cervical family');
assert.deepEqual(Buffer.from(cervical),typed,'New current→complete typed 36b inverse');
let continuous=code('clinical-review-continuous-guided-playback.test.ts').toString('utf8');
assert.equal(continuous.replaceAll('\r\n','').includes('\n'),false,'No broad CRLF normalization');
const cr=x=>x.replaceAll('\n','\r\n');
for(const [from,to,label] of [
 ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';",'continuous import'],
 ['const deliveryPin=validateCurrentAtlasDelivery();\n','','continuous pin'],
 ["  assert.equal(liveCommit,deliveryPin.source,'Review remains bound to current Atlas source');\n",'','continuous Review'],
 ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);','assert.equal(manifest.sourceCommit,liveCommit,name);','continuous manifest'],
 ["sha(committed(deliveryPin.runtimeSources[name],'lib/guided-playback.ts'))",
  "sha(committed(liveCommit,'lib/guided-playback.ts'))",'continuous family Git input'],
])continuous=inverse(continuous,cr(from),cr(to),label);
assert.deepEqual(Buffer.from(continuous),raw('clinical-review-continuous-guided-playback.test.ts'),
 'Complete continuous original byte inverse');
let types=code('expanded-viewer-type-preservation.test.mjs').toString('utf8');
types=inverse(types,"import {restoreCervicalTypedPrior} from './cervical-family-source-adapter.mjs';\n",'', 'type witness helper import');
types=inverse(types,
 " const original=read('fixtures/expanded-viewer-test-types/'+name+'.raw');\n const latest=read(name),current=name==='clinical-review-cervical-disc-tour.test.ts'\n  ?restoreCervicalTypedPrior(Buffer.from(latest)).toString('utf8'):latest;",
 " const original=read('fixtures/expanded-viewer-test-types/'+name+'.raw'),current=read(name);",
 'type witness original loop');
assert.deepEqual(Buffer.from(types),raw('expanded-viewer-type-preservation.test.mjs'),
 'Complete type witness original byte inverse');
let context=code('cervical-current-history-context-contract.test.mjs').toString('utf8');
context=inverse(context,
 "import {cervicalFamilySeams,restoreCervicalTypedPrior} from './cervical-family-source-adapter.mjs';\n",'',
 'context helper import');
context=inverse(context,
 ' const typed=definition===main?restoreCervicalTypedPrior(current):current;\n const bytes=definition===main?restoreReviewedMain(typed):typed,text=bytes.toString(\'utf8\');',
 ' const bytes=definition===main?restoreReviewedMain(current):current,text=bytes.toString(\'utf8\');',
 'context composed inverse');
context=inverse(context,
 " const current=restoreCervicalTypedPrior(read(main.name)).toString('utf8');",
 " const current=read(main.name).toString('utf8');",'context type-refusal source');
context=removeBetween(context,
 "  assert.throws(()=>restoreReviewedMain(Buffer.from(mutant)),'Unreviewed type-source mutation refused');\n }\n});\n",
 "test('original cervical theorem fixture remains byte exact'",'context new family-refusal test');
assert.deepEqual(Buffer.from(context),priorQueue,'Replacement→complete queued proposal inverse');
context=removeBetween(context,' return text;\n}\n','for(const definition of [main,helper])',
 'prior type adapter');
context=inverse(context,
 ' const current=read(definition.name);\n const bytes=definition===main?restoreReviewedMain(current):current,text=bytes.toString(\'utf8\');',
 ' const bytes=read(definition.name),text=bytes.toString(\'utf8\');',
 'prior current assignment');
context=removeBetween(context,
 "  'Source mutation must break the inverse');\n});\n",
 "test('original cervical theorem fixture remains byte exact'",'prior type-refusal test');
assert.deepEqual(Buffer.from(context),raw('cervical-current-history-context-contract.test.mjs'),
 'Queued proposal→complete frozen original inverse');
const oldReviewed=read(website+'tests/fixtures/expanded-viewer-test-types/clinical-review-cervical-disc-tour.test.ts.raw');
let reviewed=typed.toString('utf8');
for(const [from,to] of [['const actual:ReviewPacket=','const actual='],
 ['exact:ReviewPacket=source.bodyLesson','exact=source.bodyLesson']])
 reviewed=inverse(reviewed,from,to,'type-only prior');
assert.deepEqual(Buffer.from(reviewed),oldReviewed,'36b→14e complete type-only inverse');
assert.equal(sha(oldReviewed),'14e140f9979b17a168a70d92baa8e0eca3f8952db886aa3362f44d28577258cc');
let historical=reviewed;
for(const [from,to] of [
 ["import {pathToFileURL} from 'node:url';\n",''],
 [" const currentHistory=(await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)).exactSourceHistoryApi;\n",''],
 [" const source=await currentHistory(deliveryRevision,'regional-tour-review');",
  " const source=await exactSourceHistoryApi(deliveryRevision,'regional-tour-review');"],
 [" const sourceNested=await currentHistory(deliveryRevision,'nested-review-security');",
  " const sourceNested=await exactSourceHistoryApi(deliveryRevision,'nested-review-security');"],
 [" const sourceSpecimen=await exactCervicalHistory(deliveryRevision,'specimen',atlas);",
  " const sourceSpecimen=await exactCervicalHistory(deliveryRevision,'specimen');"],
])historical=inverse(historical,from,to,'pre-repair context seam');
assert.equal(sha(Buffer.from(historical)),'29685d95de9a1efbaa107b739aa2cb4ddb345ba780448c389afac602d29ea37f',
 'Complete new-current→36b→14e→29685 source reconstruction');
for(const [from,to] of familySeams){
 const current=code('clinical-review-cervical-disc-tour.test.ts').toString('utf8');
 for(const mutant of [current.replace(from,to),current+from,current.replace(from,from+' /* forged */')]){
  assert.notEqual(mutant,current,'Mutation actually applied');
  assert.notEqual(sha(Buffer.from(mutant)),sha(code('clinical-review-cervical-disc-tour.test.ts')),
   'Missing/duplicate/substituted source fails exact current hash gate');
  assert.throws(()=>actualAdapter.restoreCervicalTypedPrior(Buffer.from(mutant)),
   'Actual V2 helper refuses missing/duplicate/substituted source');
 }
}
assert.notEqual(sha(Buffer.concat([helper,Buffer.from(' ')])),sha(helper),'Helper mutation fails pinned hash');
assert.notEqual(sha(Buffer.concat([typed,Buffer.from(' ')])),sha(typed),'Fixture mutation fails pinned hash');
const pin=JSON.parse(read(website+'tests/fixtures/current-atlas-delivery.json'));
const review=JSON.parse(read(website+'atlas-review/manifest.json'));
assert.equal(pin.source,review.revision);
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
const git=(rev,path)=>execFileSync('git',['--no-replace-objects','-C',atlas,'show',`${rev}:${path}`],
 {windowsHide:true,maxBuffer:32e6});
for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const base=`public/atlas-runtime/${name}/`;
 for(const file of ['manifest.json','source-inputs.json'])
  assert.equal(sha(read(website+base+file)),pin.documents[base+file],`Pinned document: ${base+file}`);
 const manifest=JSON.parse(read(website+base+'manifest.json'));
 const inputs=JSON.parse(read(website+base+'source-inputs.json'));
 assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
 const playback=inputs.find(x=>x.path==='lib/guided-playback.ts');
 assert.equal(playback?.sha256,sha(git(pin.runtimeSources[name],'lib/guided-playback.ts')),
  `${name}: exact family playback input`);
 for(const path of ['lib/cervical-disc-tour.ts','content/cervical-disc-tour-pins.json','lib/regional-tours.ts']){
  const input=inputs.find(x=>x.path===path);
  if(name==='head-neck')assert.equal(input?.sha256,sha(git(pin.runtimeSources[name],path)),
   `${name}: exact cervical source`);
  else assert.equal(input,undefined,`${name}: no unrelated cervical source`);
 }
}
assert.equal(sha(read(website+'atlas-review/manifest.json')),pin.documents['atlas-review/manifest.json']);
assert.equal(sha(read(website+'public/atlas-review-viewer/manifest.json')),
 pin.documents['public/atlas-review-viewer/manifest.json']);
assert.equal(JSON.parse(read(website+'public/atlas-review-viewer/manifest.json')).sourceCommit,pin.source);
for(const name of ['clinical-review-cervical-disc-tour.test.ts','clinical-review-continuous-guided-playback.test.ts',
 'expanded-viewer-type-preservation.test.mjs','cervical-current-history-context-contract.test.mjs'])
 assert(!code(name).includes(13)||name==='clinical-review-continuous-guided-playback.test.ts',
  'Original LF-only source kept LF-only: '+name);
console.log(JSON.stringify({ok:true,currentCervical:sha(code('clinical-review-cervical-disc-tour.test.ts')),
 typedPrior:sha(typed),reviewedPrior:sha(oldReviewed),contextQueued:sha(priorQueue)}));
