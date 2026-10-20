import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';import {build} from 'esbuild';
import {validateChecklist} from '../scripts/refresh-completion-checklist.mjs';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {validateCurrentAtlasDelivery as validateSiteCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {readRevision52,validateRevision52Delivery} from './historical-native-head-history-delivery-52.mjs';
import {readNative52,jsonNative52,verifyNative52AtlasGit} from './native-head-52-source.mjs';
const validateCurrentAtlasDelivery=validateRevision52Delivery;
import {revision51,readRevision51,validateRevision51Delivery} from './historical-radial-eus-delivery-51.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>readRevision52(p),json=p=>JSON.parse(read(p)),source='6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb',sourceTree='4ce7882a2748d2f190e4b4f8783af6416c7cf44b',review='d2ef89f23e700eebea3dce1d7507926ad7c5fdbccdfbf9941f06cd4739644d79';
function replace(text,a,b){assert.equal(text.split(a).length,2,a.slice(0,100));return text.replace(a,b);}

test('closed51 retains exact bytes and only declared current-test/history seams change',()=>{
 assert.equal(revision51.files.length,25);for(const row of revision51.files)assert.equal(sha(readRevision51(row.path)),row.sha256,row.path);
 const priorHelper=read('tests/fixtures/radial-eus-51/historical-lacrimal-delivery-50.mjs.raw');assert.equal(sha(priorHelper),'be3c76ef8ea35b65295572e5ca581f16a2260cb92d0e8ced3cd3392d34de565c');let bridge=priorHelper.toString();bridge=replace(bridge,"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';","import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {readRevision51} from './historical-radial-eus-delivery-51.mjs';");bridge=replace(bridge,' const row=records.get(path);'," const row=records.get(path);\n if(!row&&path==='atlas-review/content/regional-teaching/abdomen.json')return readRevision51(path);");assert.deepEqual(read('tests/historical-lacrimal-delivery-50.mjs'),Buffer.from(bridge));assert.equal(sha(readRevision51('atlas-review/content/regional-teaching/abdomen.json')),'1a247baa5ccefbb5c0c9772888d0fd486fdf28f05a080a4dbb59027752ba6b9f');
 let expected=readRevision51('tests/lacrimal-current-transition.test.mjs').toString();
 expected=replace(expected,"\nimport {build} from 'esbuild';\n","\nimport {readRevision51,validateRevision51Delivery} from './historical-radial-eus-delivery-51.mjs';\n");
 expected=replace(expected,"\nimport {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n","\nimport {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n");
 expected=replace(expected,"\nconst read=path=>readFileSync(new URL('../'+path,import.meta.url)),json=path=>JSON.parse(read(path));\n","\nconst read=path=>readRevision51(path),json=path=>JSON.parse(read(path));\nconst validateCurrentAtlasDelivery=validateRevision51Delivery;\n");
 const marker=expected.indexOf("test('actual Review resolver changes exactly four lacrimal US lessons"),start=expected.indexOf(' const compiled=await build({stdin:{contents:',marker),end=expected.indexOf('\n const catalog=',start);assert(marker>=0&&start>marker&&end>start);assert.equal(sha(expected.slice(start,end)),'42febd5d4d45bb73e4643c1504894d20c62db11e8fa2e2d84a61d58de2ee2b77');expected=expected.slice(0,start)+" const now=await exactSourceHistoryApi(source,'review-security');"+expected.slice(end);assert.deepEqual(read('tests/lacrimal-current-transition.test.mjs'),Buffer.from(expected),'Every historical assertion retained');
 let admission=readRevision51('tests/current-atlas-delivery.test.mjs').toString();for(const[a,b]of [[revision51.source,source],[revision51.sourceTree,sourceTree],[revision51.review,review],['assert.equal(sourceFiles,1526);','assert.equal(sourceFiles,1528);']])admission=replace(admission,a,b);assert.deepEqual(read('tests/current-atlas-delivery.test.mjs'),Buffer.from(admission));
 let cerebral=readRevision51('tests/atlas-cerebral-lobar-imaging.test.ts').toString();cerebral=replace(cerebral,'./fixtures/current-source-checkout-representations-lacrimal.json','./fixtures/current-source-checkout-representations-radial-eus.json');cerebral=replace(cerebral,'89246aed66c49d55226320e25afb106255db219c5e0afcc85423d5e81392f510','4bca2cf512ebdecfcc16c2ff287959fdad43cbd75c1b38c7e3900cc8b44c1900');assert.deepEqual(read('tests/atlas-cerebral-lobar-imaging.test.ts'),Buffer.from(cerebral));
 const old=readRevision51('.gitattributes'),policy=readFileSync(new URL('./fixtures/gitattributes-delivery52.raw',import.meta.url));assert.equal(sha(policy),'845dd13acf54b7e3b765b6ca1699273282c00ee376a1ce4a7f44a2569da8d95c');assert(policy.subarray(0,old.length).equals(old));assert.equal(policy.subarray(old.length).toString(),'# Exact closed pre-radial-EUS delivery51 evidence and checkout metadata.\r\n'+'tests/fixtures/radial-eus-51/** -text\r\n'+'tests/fixtures/current-source-checkout-representations-radial-eus.json -text\r\n');
 const paths=['tests/fixtures/current-source-checkout-representations-radial-eus.json','tests/fixtures/radial-eus-51/epoch.json','tests/fixtures/radial-eus-51/historical-lacrimal-delivery-50.mjs.raw',...revision51.files.map(row=>'tests/fixtures/radial-eus-51/'+row.storagePath)],attrs=execFileSync('git',['check-attr','-z','--stdin','text'],{input:Buffer.from(paths.join('\0')+'\0'),windowsHide:true}).toString().split('\0');for(let i=0;i<paths.length;i++)assert.deepEqual(attrs.slice(i*3,i*3+3),[paths[i],'text','unset']);
 assert.equal(validateRevision51Delivery().reviewIntegration,revision51.review);assert.throws(()=>validateCurrentAtlasDelivery({pin:validateRevision51Delivery()}));
});

test('current attributes derive exactly from independent old52 bytes plus declared later rules',()=>{
 const old=readFileSync(new URL('./fixtures/gitattributes-delivery52.raw',import.meta.url));
 assert.equal(sha(old),'845dd13acf54b7e3b765b6ca1699273282c00ee376a1ce4a7f44a2569da8d95c');
 const current=read('.gitattributes');
 const anchor='# Historical source and delivery snapshots are exact byte evidence.\n';
 const added='tests/fixtures/** -text\r\n';
 const inserted=replace(old.toString(),anchor,anchor+added);
 const suffix='# Exact source-only backup96c219 register63 transition evidence.\r\n'+
  'tests/fixtures/orbital-mri-delivery-transition-before-head-entry.mjs.raw -text\r\n'+
  'tests/fixtures/completion-checklist-register63-before-head-entry.json.raw -text\r\n'+
  'tests/fixtures/current-atlas-delivery-register63-before-head-entry.json.raw -text\r\n'+
  '\r\n# Exact closed59 raw metadata and the original executable proof survive all checkouts.\r\n'+
  'tests/fixtures/closed59-raw-metadata/** -text\r\n'+
  'tests/fixtures/atlas-cerebral-lobar-imaging.before-6036-checkout.test.ts.raw -text\r\n'+
  'tests/cerebral-checkout-epoch-preservation.test.mjs text eol=lf\r\n'+
  'scripts/website-test-history-preflight.mjs text eol=lf\r\n'+
  'tests/website-test-history-preflight.test.mjs text eol=lf\r\n';
 assert.equal(current.toString(),inserted+suffix,'current policy has no unreviewed bytes');
 assert.equal(replace(current.toString().slice(0,-suffix.length),anchor+added,anchor),old.toString(),'full inverse to actual archived old52');
 assert.notEqual(replace(current.toString().slice(0,-suffix.length),anchor+added,anchor+'tests/fixtures/** text eol=lf\r\n'),old.toString());
 assert.notEqual(current.subarray(0,current.length-1).toString(),inserted+suffix);
 const paths=['tests/fixtures/radial-eus-51/epoch.json','tests/fixtures/current-source-checkout-representations-radial-eus.json','tests/fixtures/future-epoch/raw.txt','vite.config.ts','.gitattributes'];
 const expected=['unset','unset','unset','set','unset'];
 const attrs=execFileSync('git',['check-attr','-z','--stdin','text'],{input:Buffer.from(paths.join('\0')+'\0'),windowsHide:true}).toString().split('\0');
 for(let i=0;i<paths.length;i++)assert.deepEqual(attrs.slice(i*3,i*3+3),[paths[i],'text',expected[i]]);
});

test('current52 preserves all71/eight scopes and exact source-bound import/model/checkout evidence',()=>{
 const before=validateChecklist(JSON.parse(readRevision51('docs/completion-checklist.json'))),now=validateChecklist(jsonNative52('docs/completion-checklist.json')),pin=validateSiteCurrentAtlasDelivery({pin:jsonNative52('tests/fixtures/current-atlas-delivery.json'),read:readNative52});assert.equal(before.revision,51);assert.equal(now.revision,52);assert.equal(now.items.length,71);assert.equal(now.items.filter(i=>i.scope==='optional').length,8);
 for(const key of ['items','statusDefinitions','rules','roots'])assert.deepEqual(now[key],before[key],key);assert.deepEqual(now.changeLog.slice(1),before.changeLog);
 const changed=new Set(['atlasCommit','atlasTree','reviewIntegration','reviewSourceFiles','rootDraftPlacements','rootPendingPlacements']);for(const[k,v]of Object.entries(before.baseline))if(!changed.has(k))assert.deepEqual(now.baseline[k],v,k);
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,sourceTree);assert.equal(pin.reviewIntegration,review);assert.equal(now.baseline.atlasCommit,source);assert.equal(now.baseline.reviewIntegration,review);assert.equal(now.baseline.reviewSourceFiles,1528);assert.deepEqual([now.baseline.rootDraftPlacements,now.baseline.rootPendingPlacements,now.baseline.rootGeneratedIdentificationPlacements],[9326,571,39]);assert.equal(now.baseline.privateClinicalDecisionCounts,null);assert.equal(now.baseline.publicReleaseApproval,null);
 const old=JSON.parse(readRevision51('atlas-review/integration-inputs.json')),inputs=jsonNative52('atlas-review/integration-inputs.json'),oldByPath=new Map(old.inputs.map(row=>[row.path,row.sha256]));assert.equal(inputs.inputs.length,1657);
 assert.deepEqual(inputs.inputs.filter(row=>!oldByPath.has(row.path)).map(row=>row.path),['atlas-review/content/abdominal-radial-eus.ts','atlas-review/lib/abdominal-radial-eus.ts']);
 assert.deepEqual(inputs.inputs.filter(row=>oldByPath.has(row.path)&&oldByPath.get(row.path)!==row.sha256).map(row=>row.path),revision51.changedPriorInputs);assert.equal(revision51.changedPriorInputs.length,6);assert(old.inputs.every(row=>inputs.inputs.some(next=>next.path===row.path)));for(const row of inputs.inputs)assert.equal(sha(readNative52(row.path)),row.sha256,row.path);
 assert.equal(sha(JSON.stringify(inputs.inputs)),review);assert.deepEqual(jsonNative52('lib/atlas-model-inventory.json').models,JSON.parse(readRevision51('lib/atlas-model-inventory.json')).models);
 const checkout=readNative52('tests/fixtures/current-source-checkout-representations-radial-eus.json');assert.equal(sha(checkout),'4bca2cf512ebdecfcc16c2ff287959fdad43cbd75c1b38c7e3900cc8b44c1900');const current=JSON.parse(checkout),previous=JSON.parse(readRevision51('tests/fixtures/current-source-checkout-representations-lacrimal.json'));assert.equal(current.source,source);assert.equal(current.sourceInputManifestSha256,sha(readNative52('public/atlas-runtime/head-neck/source-inputs.json')));assert.deepEqual(current.records,previous.records);assert.equal(current.records.length,9);
});

test('actual imported Review adds exactly four radial-EUS drafts and rejects old or forged teaching',async()=>{
 const atlas=currentAtlasDeliveryRoot(),{exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs')),before=await exactSourceHistoryApi(revision51.source,'review-security');
 verifyNative52AtlasGit(atlas);const now=await exactSourceHistoryApi(source,'review-security');
 const raw=jsonNative52('atlas-review/public/models/bodyparts3d/full-body/catalog.json'),display=now.bodyDisplayCatalog(raw);assert.deepEqual(display,before.bodyDisplayCatalog(raw));assert.equal(display.structures.length,1104);const fmas=new Set(['FMA15390','FMA15397','FMA15407','FMA15406']),targets=jsonNative52('atlas-review/content/abdominal-branch-imaging-pins.json').entries.filter(row=>fmas.has(row.identity.fmaId));assert.equal(targets.length,4);const ids=new Set(targets.map(row=>row.identity.id));let changed=0,preserved=0,stale=0,forged=0,storage=0;
 for(const structure of display.structures)for(const tab of now.contentTabs){const old=before.bodyLesson(structure,tab),lesson=now.bodyLesson(structure,tab);if(ids.has(structure.id)&&tab==='ultrasound'){assert.equal(old.readiness,'pending');assert.equal(lesson.readiness,'draft');assert.match(lesson.title,/radial endoscopic ultrasound/i);assert.match(lesson.note,/radiologist review pending/i);assert.deepEqual(lesson.citations,['https://pubmed.ncbi.nlm.nih.gov/24949345/']);changed++;}else{assert.deepEqual(lesson,old,structure.id+'|'+tab);preserved++;}}assert.equal(changed,4);assert.equal(preserved,9932);
 for(const{identity}of targets){assert.deepEqual(display.structures.find(row=>row.id===identity.id),identity);const previous=await before.bodyReviewMaterial(identity.id),packet=await now.bodyReviewMaterial(identity.id);assert.equal(packet.approval,false);assert.equal(packet.fingerprints.source,previous.fingerprints.source);assert.equal(packet.fingerprints.checklist,previous.fingerprints.checklist);assert.notEqual(packet.fingerprints.teaching,previous.fingerprints.teaching);assert.deepEqual(await now.parseBodyReviewResponse(packet,identity.id),packet);assert.equal(await now.parseBodyReviewResponse(previous,identity.id),null);
  for(const edit of [p=>{p.topics.find(row=>row.tab==='ultrasound').body+=' foreign';},p=>{p.topics.find(row=>row.tab==='ultrasound').readiness='approved';},p=>{p.topics.find(row=>row.tab==='ultrasound').citations=['https://foreign.example'];}]){const bad=structuredClone(packet);edit(bad);assert.equal(await now.parseBodyReviewResponse(bad,identity.id),null);forged++;}
  const context=await now.bodyReviewContext(identity.id),oldContext=await before.bodyReviewContext(identity.id);assert.equal(context.revisions.imaging,null);assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);const save={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:now.blankBodyReview(context,'teaching')};for(const staleHashes of [{materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},{materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching}]){const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_RADIAL_EUS_WEB'},body:JSON.stringify({...save,...staleHashes})}),{prepare(){storage++;throw Error('Stale review reached storage');}});assert.equal(response.status,409);stale++;}}
 assert.equal(forged,12);assert.equal(stale,12);assert.equal(storage,0);
});

test('current 87ed source retains radial teaching while later tongue quiz remains separate',async()=>{
 const atlas=currentAtlasDeliveryRoot(),pin=validateSiteCurrentAtlasDelivery();
 assert.equal(pin.source,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');
 assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs'));
 const current=await exactSourceHistoryApi(pin.source,'review-security');
 const raw=jsonNative52('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
 const display=current.bodyDisplayCatalog(raw);
 assert.equal(display.structures.length,1104);
 const fmas=new Set(['FMA15390','FMA15397','FMA15407','FMA15406']);
 const targets=jsonNative52('atlas-review/content/abdominal-branch-imaging-pins.json').entries.filter(row=>fmas.has(row.identity.fmaId));
 assert.equal(targets.length,4);
 for(const {identity} of targets){
  const structure=display.structures.find(row=>row.id===identity.id);
  assert.deepEqual(structure,identity);
  const lesson=current.bodyLesson(structure,'ultrasound');
  assert.equal(lesson.readiness,'draft');
  assert.match(lesson.title,/radial endoscopic ultrasound/i);
  assert.match(lesson.note,/radiologist review pending/i);
  assert.deepEqual(lesson.citations,['https://pubmed.ncbi.nlm.nih.gov/24949345/']);
 }
 const tongue=display.structures.find(row=>row.id==='vm:anatomy:body:head-neck:left:muscle:left-genioglossus');
 assert(tongue);
 const quiz=current.bodyLesson(tongue,'quiz');
 assert.equal(quiz.readiness,'draft');
 assert.match(quiz.title,/tongue and palate quick check/i);
 assert.match(quiz.note,/radiologist review pending/i);
});
