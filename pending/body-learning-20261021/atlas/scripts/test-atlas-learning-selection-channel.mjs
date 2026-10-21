import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';

const proposal=resolve(import.meta.dirname,'..');
const source=process.env.VM_ATLAS_SOURCE_REPO || proposal;
const require=createRequire(resolve(source,'package.json'));
const {build}=require('esbuild');
// The staging proposal has only owned paths; source-only imports resolve through
// the canonical checkout without copying or modifying its files.
async function loadWithCanonical(relative){
  const entry=resolve(proposal,relative);
  const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,
    external:['react','react/jsx-runtime'],plugins:[{name:'canonical-readonly-deps',setup(build){
      build.onResolve({filter:/^\./},args=>{
        const candidate=resolve(args.resolveDir,args.path);
        if(['','.ts','.tsx','.js','.json'].some(extension=>existsSync(candidate+extension)))return undefined;
        const rel=candidate.slice(proposal.length+1);
        if(!candidate.startsWith(proposal)||rel.startsWith('..'))return undefined;
        const fallback=resolve(source,rel);
        const extension=['','.ts','.tsx','.js','.json'].find(item=>existsSync(fallback+item));
        return extension===undefined?undefined:{path:fallback+extension};
      });
    }}]});
  const module={exports:{}};
  runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,
    queueMicrotask,console,process,globalThis,URL,Set,Map,Object,Array,JSON});
  return module.exports;
}
const channel=await loadWithCanonical('lib/atlas-learning-selection-channel.ts');
const app=await loadWithCanonical('app/atlas-learning-selection-channel.tsx');
const revision='a'.repeat(40),sourceHash='b'.repeat(64),nonce='session_123456789';
const request=(region='leg',session=nonce)=>({type:channel.ATLAS_LEARNING_SELECTION_PROTOCOL+'-request',version:1,revision,region,session});

function mockWindow(){
  const listeners=new Map(),sent=[];
  const parent={postMessage(message,origin){sent.push({message,origin});}};
  const win={parent,location:{origin:'https://example.test'},
    addEventListener(type,listener){listeners.set(type,listener);},
    removeEventListener(type,listener){if(listeners.get(type)===listener)listeners.delete(type);}};
  return {win,parent,sent,listeners,send(data,{origin=win.location.origin,source=parent}={}){
    listeners.get('message')?.({data,origin,source});
  }};
}
const tick=()=>new Promise(resolve=>queueMicrotask(resolve));

test('all twelve scopes and whole-body root from a raw regional record',()=>{
  const regions=['head-neck','thorax','abdomen','pelvis','spine','shoulder-arm','forearm','hand','thigh','leg','foot','whole-body'];
  for(const region of regions)assert.equal(channel.atlasLearningRegion(region),true);
  assert.equal(channel.atlasLearningRegion('specimen'),false);
  const root={id:'vm:anatomy:body:leg:right:bone:tibia',laterality:'right',regions:['leg'],bundle:'bundle-1'};
  const catalog={structures:[root],bundles:[{id:'bundle-1',sha256:sourceHash}]};
  assert.deepEqual(JSON.parse(JSON.stringify(app.atlasLearningRootSelection(catalog,root,'whole-body'))),
    {status:'selected',selection:{kind:'root',id:root.id,source:sourceHash,laterality:'right'}});
  assert.equal(app.atlasLearningRootSelection(catalog,root,'foot').status,'blocked');
  assert.equal(app.atlasLearningRootSelection(catalog,null,'leg').status,'empty');
  assert.equal(app.atlasLearningRootSelection({...catalog,structures:[root,root]},root,'leg').status,'blocked');
  assert.equal(app.atlasLearningRootSelection({...catalog,bundles:[...catalog.bundles,catalog.bundles[0]]},root,'leg').status,'blocked');
  assert.equal(app.atlasLearningRootSelection(catalog,{...root,laterality:'left'},'leg').status,'blocked');
  const shoulder={...root,id:'vm:anatomy:upper-limb:shoulder:right:bone:humerus',regions:['shoulder-arm']};
  assert.equal(app.atlasLearningRootSelection({structures:[shoulder],bundles:catalog.bundles},shoulder,'shoulder-arm').status,'selected');
});

test('current source catalog resolves exact IDs and bundle hashes across every scope',()=>{
  const catalog=JSON.parse(readFileSync(resolve(source,'public/models/bodyparts3d/full-body/catalog.json'),'utf8'));
  const regions=['head-neck','thorax','abdomen','pelvis','spine','shoulder-arm','forearm','hand','thigh','leg','foot','whole-body'];
  for(const region of regions){
    const roots=catalog.structures.filter(root=>region==='whole-body'||root.regions.includes(region));
    assert.ok(roots.length,region);
    for(const selected of roots){
    const result=app.atlasLearningRootSelection(catalog,selected,region);
    assert.equal(result.status,'selected',region);
    const bundle=catalog.bundles.find(entry=>entry.id===selected.bundle);
    assert.equal(result.selection.id,selected.id);
    assert.equal(result.selection.source,bundle.sha256);
    assert.equal(result.selection.laterality,selected.laterality);
    }
  }
  const root=catalog.structures.find(item=>item.id.startsWith('vm:anatomy:upper-limb:shoulder:'));
  assert.ok(root);
  assert.equal(app.atlasLearningRootSelection(catalog,root,'whole-body').status,'selected');
});

test('exact requests, origins, parent and monotonically sequenced replies',async()=>{
  const fixture=mockWindow();
  let state={status:'empty'};
  const connection=channel.connectAtlasLearningSelectionChannel(fixture.win,revision,'leg',()=>state);
  assert.deepEqual(JSON.parse(JSON.stringify(fixture.sent[0].message)),
    {type:channel.ATLAS_LEARNING_SELECTION_PROTOCOL+'-ready',version:1,revision,region:'leg'});
  fixture.send(request(),{origin:'https://elsewhere.test'});
  fixture.send(request(),{source:{}});
  fixture.send({...request(),extra:'unexpected'});
  fixture.send({...request(),session:'short'});
  const getter={...request()};Object.defineProperty(getter,'session',{get(){throw Error('getter invoked');},enumerable:true});
  fixture.send(getter);
  fixture.send(new Proxy({},{getPrototypeOf(){throw Error('malformed input');}}));
  await tick();assert.equal(fixture.sent.length,1);
  fixture.send(request());await tick();
  assert.deepEqual(JSON.parse(JSON.stringify(fixture.sent.at(-1).message)),
    {type:channel.ATLAS_LEARNING_SELECTION_PROTOCOL,version:1,revision,region:'leg',session:nonce,sequence:1,status:'empty'});
  state={status:'selected',selection:{kind:'root',id:'vm:anatomy:body:leg:right:bone:tibia',source:sourceHash,laterality:'right'}};
  connection.publish();await tick();assert.equal(fixture.sent.at(-1).message.sequence,2);
  fixture.send({type:'vm-body-semantic-focus',version:1,revision,region:'leg',session:nonce,command:1,target:state.selection});
  await tick();assert.equal(fixture.sent.at(-1).message.sequence,2);
  fixture.send(request('leg','another_session_1234'));await tick();
  assert.equal(fixture.sent.at(-1).message.sequence,1);
  assert.equal(fixture.sent.at(-1).message.session,'another_session_1234');
  connection.close();
  assert.equal(fixture.sent.at(-1).message.status,'blocked');
  assert.equal(fixture.sent.at(-1).message.reason,'unavailable');
  assert.equal(fixture.sent.at(-1).message.sequence,2);
  assert.equal(fixture.listeners.size,0);
  fixture.send(request());await tick();assert.equal(fixture.sent.at(-1).message.sequence,2);
});

test('blocked states, malformed selections and disabled top-level use',async()=>{
  const fixture=mockWindow();let state={status:'blocked',reason:'practice'};
  const connection=channel.connectAtlasLearningSelectionChannel(fixture.win,revision,'whole-body',()=>state);
  fixture.send(request('whole-body'));await tick();
  assert.equal(fixture.sent.at(-1).message.reason,'practice');
  state={status:'blocked',reason:'guided'};connection.publish();await tick();
  assert.equal(fixture.sent.at(-1).message.reason,'guided');
  state={status:'selected',selection:{kind:'root',id:'vm:anatomy:body:leg:right:bone:tibia',source:sourceHash,
    laterality:'right',patient:'forbidden'}};
  connection.publish();await tick();assert.equal(fixture.sent.at(-1).message.reason,'unavailable');
  state=new Proxy({},{getOwnPropertyDescriptor(){throw Error('malformed state');}});
  connection.publish();await tick();assert.equal(fixture.sent.at(-1).message.reason,'unavailable');
  connection.close();
  const top=mockWindow();top.win.parent=top.win;
  channel.connectAtlasLearningSelectionChannel(top.win,revision,'leg',()=>({status:'empty'}));
  assert.equal(top.sent.length,0);
  assert.equal(top.listeners.size,0);
});

test('unavailable recovery revokes old session and advertises a fresh ready state',async()=>{
  const fixture=mockWindow();let state={status:'blocked',reason:'unavailable'};
  const connection=channel.connectAtlasLearningSelectionChannel(fixture.win,revision,'leg',()=>state);
  fixture.send(request());await tick();
  assert.equal(fixture.sent.at(-1).message.reason,'unavailable');
  state={status:'empty'};connection.publish();await tick();
  assert.equal(fixture.sent.at(-1).message.type,channel.ATLAS_LEARNING_SELECTION_PROTOCOL+'-ready');
  connection.publish();await tick();
  assert.equal(fixture.sent.at(-1).message.type,channel.ATLAS_LEARNING_SELECTION_PROTOCOL+'-ready');
  fixture.send(request());await tick();
  assert.equal(fixture.sent.at(-1).message.sequence,1);
  assert.equal(fixture.sent.at(-1).message.status,'empty');
  connection.close();
});

test('copied entry files have an exact insertion-only inverse',()=>{
  const originalBody=readFileSync(resolve(proposal,'scripts/fixtures/learning-channel-original-body.tsx.raw'),'utf8');
  assert.equal(createHash('sha256').update(originalBody).digest('hex'),'4ee0172e8dcc73020a523bbb705d478f308c9c23c524c62b7783049516f5bcf4');
  let body=readFileSync(resolve(proposal,'app/body-explorer.tsx'),'utf8');
  body=body.replace("import {useAtlasLearningRootSelection,atlasLearningRootSelection} from './atlas-learning-selection-channel';\n",'');
  body=body.replace(`  useAtlasLearningRootSelection(\n    exam || workspace.mode === 'practice' ? {status:'blocked',reason:'practice'} :\n    guidedLearning ? {status:'blocked',reason:'guided'} :\n    inlineStudy || !catalog || !displayReady || (selected &&\n      (!regionStructures.some(s=>s.id===selected.id) || !loaded.includes(selected.bundle) || failed.includes(selected.bundle) ||\n       !resolved.visible.some(s=>s.id===selected.id) || !systems[selected.system]))\n      ? {status:'blocked',reason:'unavailable'} : atlasLearningRootSelection(catalog,selected,initialRegion)\n  );\n`,'');
  assert.equal(body,originalBody);
  const originalMain=readFileSync(resolve(proposal,'scripts/fixtures/learning-channel-original-main.tsx.raw'),'utf8');
  assert.equal(createHash('sha256').update(originalMain).digest('hex'),'443b12fc8acc500013abd3de16917ef3de864f0a758a0bafa865c54fa9509284');
  let main=readFileSync(resolve(proposal,'integration/head-neck/main.tsx'),'utf8');
  main=main.replace("import {AtlasLearningSelectionChannel} from '../../app/atlas-learning-selection-channel';\n",'');
  main=main.replace('      : <AtlasLearningSelectionChannel revision={__VM_HEAD_SOURCE_REVISION__} region={region}><HeadSelectionChannel',
    '      : <HeadSelectionChannel');
  main=main.replace('</BodySelectionChannel></HeadSelectionChannel></AtlasLearningSelectionChannel>',
    '</BodySelectionChannel></HeadSelectionChannel>');
  assert.equal(main,originalMain);
});
