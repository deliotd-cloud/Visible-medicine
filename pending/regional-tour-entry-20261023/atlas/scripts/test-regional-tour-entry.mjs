import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {test} from 'node:test';
import {build} from './workspace-test-build.mjs';
const require=createRequire(import.meta.url),ts=require('typescript');
const bundle=await build({stdin:{contents:"export * from './lib/regional-tour-entry';export {regionalTours} from './lib/regional-tours';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {parseBodyCatalog} from './lib/body-catalog-input';export {bodyLinkEntries} from './lib/anatomy-link-registry';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(fs.readFileSync('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const catalog=api.bodyDisplayCatalog(api.parseBodyCatalog(raw)),before=JSON.stringify(catalog);
const revision='a'.repeat(40),tour=api.regionalTours.find(t=>t.id==='thoracic-airways-vessels');assert(tour);
const params=(t=tour)=>({regionalTour:t.id,tourRevision:t.revision,tourSource:revision});
const requested=(t=tour)=>api.parseRegionalTourEntry(params(t));

test('Every current regional tour can be selected exactly in its own region and Whole body, without playback state',()=>{
  for(const t of api.regionalTours)for(const region of new Set([t.region,'whole-body'])){
    const result=api.resolveRegionalTourEntry(catalog,region,revision,requested(t));
    assert.equal(result.status,'ready',`${t.id}/${region}`);assert.equal(result.tour,t);
    assert.deepEqual(Object.keys(result).sort(),['status','tour']);
  }
  assert.equal(JSON.stringify(catalog),before);
});
test('Strict bounded parser rejects duplicate, partial, malformed and oversized requests',()=>{
  assert.deepEqual(api.parseRegionalTourEntry({}),{status:'none'});
  const bad=[null,[],false,...Object.keys(params()).flatMap(key=>[
    {...params(),[key]:undefined},{...params(),[key]:''},{...params(),[key]:[params()[key]]},
    {...params(),[key]:[params()[key],params()[key]]},{...params(),[key]:4},
    {...params(),[key]:'x'.repeat(200)},{...params(),[key]:'https://private.example/value'},
    {...params(),[key]:'bad\nvalue'},{[key]:params()[key]},
  ]),{...params(),tourSource:'A'.repeat(40)},{...params(),tourSource:'a'.repeat(64)}];
  for(const value of bad){assert.equal(api.parseRegionalTourEntry(value).status,'invalid');assert.equal(api.regionalTourEntrySuffix(value),null);}
  assert.equal(api.regionalTourEntrySuffix({unrelated:'never forwarded'}),'');
});
test('Transport round trips only admitted public fields, not unknown/private query values',()=>{
  const input={...params(),privateStudy:'never-forward',url:'https://private.invalid',autoplay:'1'};
  const suffix=api.regionalTourEntrySuffix(input),q=new URLSearchParams(suffix.slice(1));
  assert.deepEqual([...q.keys()],['regionalTour','tourRevision','tourSource']);
  assert.deepEqual(api.parseRegionalTourEntry(Object.fromEntries(q)),requested());
  assert(!suffix.includes('never-forward'));assert(!suffix.includes('autoplay'));
});
test('No fallback for stale source/tour, wrong region, unknown identity, absent or damaged geometry',()=>{
  const check=(c,r,s,e,reason)=>assert.deepEqual(api.resolveRegionalTourEntry(c,r,s,e),{status:'rejected',reason});
  for(const source of ['',undefined,'b'.repeat(40),'a'.repeat(64)])check(catalog,'thorax',source,requested(),'source-changed');
  check(catalog,'abdomen',revision,requested(),'unavailable');
  check(catalog,'missing-region',revision,requested(),'unavailable');
  check(catalog,'thorax',revision,{...requested(),id:'unknown-tour'},'unavailable');
  check(catalog,'thorax',revision,{...requested(),revision:'stale-revision'},'unavailable');
  check(catalog,'thorax',revision,{status:'invalid'},'invalid');
  check(catalog,'thorax',revision,{...requested(),autoplay:true},'invalid');
  check({...catalog,structures:[]},'thorax',revision,requested(),'unavailable');
  const damaged=structuredClone(catalog),target=damaged.structures.find(s=>s.id===tour.steps[0].selectedId);assert(target);
  target.bounds=null;check(damaged,'thorax',revision,requested(),'unavailable');
  assert.deepEqual(api.resolveRegionalTourEntry(catalog,'thorax',revision,{status:'none'}),{status:'none'});
});
test('Busy study, practice or existing guided activity refuses fresh-load selection',()=>{
  assert.deepEqual(api.resolveRegionalTourEntry(catalog,'thorax',revision,requested(),true),{status:'rejected',reason:'busy'});
});

// Execute the COMPLETE actual catalogue-commit callback, not a hand-copied
// facsimile. Network/React setters are observable boundaries; catalogue parsing,
// display/source admission and entry resolver are real. This is not GPU/browser QA.
const bodyText=fs.readFileSync('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('body-explorer.tsx',bodyText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const callbacks=[];
function visit(node){if(ts.isArrowFunction(node)&&node.parameters.length===1&&node.parameters[0].name.getText(ast)==='data'&&node.body.getText(ast).includes('appliedTourEntry.current'))callbacks.push(node.getText(ast));ts.forEachChild(node,visit);}visit(ast);
assert.equal(callbacks.length,1,'One actual catalogue-commit callback');
const callback=ts.transpileModule('('+callbacks[0]+')',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
function commitHarness({entry=requested(),sourceRevision=revision,region='thorax',study='none',practice='idle',guided=false,active=true}={}){
  const calls=[],state={appliedStudyLink:{current:true},appliedTourEntry:{current:entry.status==='none'},initialTourEntry:{current:{entry,sourceRevision}}};
  const context={...api,...state,active,initialRegion:region,studyLink:{status:study},practice:{status:practice},guidedLearning:guided,
    setEntryTour:t=>calls.push(['tour',t.id]),setGuidedLearning:value=>calls.push(['guided',value]),
    setLinkIssue:value=>calls.push(['issue',value]),setCatalog:value=>calls.push(['catalog',value]),
    // Never invoked in these cases: an already-applied study cannot be replaced.
    resolveStudyLink:()=>{throw Error('Existing study reinitialized');},setLinkedStudyReady:()=>{throw Error('Existing study changed');}};
  const commit=runInNewContext(callback,context);return{state,calls,context,commit:()=>commit(raw)};
}
test('Actual BodyExplorer commit chooses exact tour BEFORE first catalogue render; ref consumes intent once',()=>{
  const h=commitHarness();h.commit();
  assert.deepEqual(h.calls.slice(0,2),[['tour',tour.id],['guided',true]]);assert.equal(h.calls[2][0],'catalog');
  assert.equal(h.state.appliedTourEntry.current,true);
  h.calls.length=0;h.context.guidedLearning=true;h.commit();assert.deepEqual(h.calls.map(c=>c[0]),['catalog']);
  assert(!bodyText.includes('onAutoStart'));assert(!bodyText.includes('autoplay='));
});
test('Actual commit rejects damaged/stale intent without choosing another tour or changing existing activity',()=>{
  for(const options of [{sourceRevision:'b'.repeat(40)},{entry:{status:'invalid'}},{region:'abdomen'},
    {study:'requested'},{study:'invalid'},{practice:'active'},{guided:true}]){
    const h=commitHarness(options);h.commit();
    assert.deepEqual(h.calls.map(c=>c[0]),['issue','catalog']);assert.equal(h.state.appliedTourEntry.current,true);
    assert.match(h.calls[0][1],/No tour was (selected|substituted)/);
    h.calls.length=0;h.commit();assert.deepEqual(h.calls.map(c=>c[0]),['catalog']);
  }
});
test('Actual cancelled load and ordinary entry do not initialize a tour',()=>{
  const cancelled=commitHarness({active:false});cancelled.commit();assert.deepEqual(cancelled.calls,[]);assert.equal(cancelled.state.appliedTourEntry.current,false);
  const ordinary=commitHarness({entry:{status:'none'}});ordinary.commit();assert.deepEqual(ordinary.calls.map(c=>c[0]),['catalog']);
});
test('Embedded entry retains duplicate query fields and the exact build revision, with no new message listener',()=>{
  const entry=fs.readFileSync('integration/head-neck/main.tsx','utf8');
  assert(entry.includes('values.length===1?values[0]:values'));
  assert(entry.includes('tourEntry={parseRegionalTourEntry(params)} sourceRevision={__VM_HEAD_SOURCE_REVISION__}'));
  assert(!fs.readFileSync('lib/regional-tour-entry.ts','utf8').includes('postMessage'));
  assert(bodyText.includes('const initialTourEntry = useRef({entry:tourEntry,sourceRevision});'));
  assert(bodyText.includes('initialTourEntry.current.sourceRevision,initialTourEntry.current.entry'));
});
