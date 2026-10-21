import assert from 'node:assert/strict';
import {test} from 'node:test';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const website=process.env.VM_WEBSITE_ROOT??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.ok(website&&path.isAbsolute(website),'VM_WEBSITE_ROOT must be the canonical website path');
const {build}=createRequire(path.join(website,'package.json'))('esbuild');
const stage=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../lib/atlas-body-learning-selection.ts');
const canonical=(name)=>path.join(website,name);
const result=await build({entryPoints:[stage],bundle:true,platform:'node',format:'esm',write:false,
  plugins:[{name:'canonical-website-imports',setup(plugin){
    plugin.onResolve({filter:/^\.\.\/public\/atlas-runtime\/head-neck\/manifest\.json$/},()=>({path:canonical('public/atlas-runtime/head-neck/manifest.json')}));
    plugin.onResolve({filter:/^\.\/lecture-body-reference$/},()=>({path:canonical('lib/lecture-body-reference.ts')}));
  }}]});
const receiver=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const lectureBuild=await build({entryPoints:[canonical('lib/lecture-body-reference.ts')],bundle:true,platform:'node',format:'esm',write:false});
const lecture=await import(`data:text/javascript;base64,${Buffer.from(lectureBuild.outputFiles[0].text).toString('base64')}`);
const manifest=JSON.parse(await readFile(canonical('public/atlas-runtime/head-neck/manifest.json'),'utf8'));
const catalog=JSON.parse(await readFile(canonical('lib/lecture-body-catalog.json'),'utf8'));
const nonce='freshSession1234567890';
const context=region=>receiver.atlasBodyLearningContext(`/atlas-runtime/head-neck/index.html?region=${region}&study=1`);
const message=(region,selection,extras={})=>({type:receiver.ATLAS_BODY_LEARNING_PROTOCOL,version:1,
  revision:manifest.sourceCommit,region,session:nonce,sequence:1,status:'selected',selection,...extras});
const laterality=id=>id.split(':').find(token=>['left','right','midline','unpaired','unspecified'].includes(token));
const select=(id,region)=>message(region,{kind:'root',id,source:lecture.createLectureBodyReference(id).sourceSha256,laterality:laterality(id)});

test('current first-party module and ready handshake only',()=>{
  for(const scope of manifest.regionalScopes){
    const current=context(scope.region);
    assert.deepEqual(current,{revision:manifest.sourceCommit,region:scope.region});
    assert.equal(receiver.matchesAtlasBodyLearningReady({type:'vm-atlas-learning-selection-ready',version:1,
      revision:manifest.sourceCommit,region:scope.region},current),true);
    assert.equal(receiver.matchesAtlasBodyLearningReady({type:'vm-atlas-learning-selection-ready',version:1,
      revision:'0'.repeat(40),region:scope.region},current),false);
  }
  for(const src of ['https://example.org/atlas-runtime/head-neck/index.html?region=hand',
    '/atlas-runtime/shoulder/index.html?region=hand','/atlas-runtime/head-neck/index.html?region=hand&part=x',
    '/atlas-runtime/head-neck/index.html?region=hand&focus=x',
    '/atlas-runtime/head-neck/index.html?region=hand&region=foot',
    '/atlas-runtime/head-neck/index.html?region=missing'])assert.equal(receiver.atlasBodyLearningContext(src),null);
});

test('every 1104 current public root resolves in whole-body; all regional memberships resolve',()=>{
  const ids=new Set(catalog.rows.map(row=>row[0]));
  assert.equal(ids.size,1104);
  const whole=manifest.regionalScopes.find(scope=>scope.region==='whole-body');
  assert.equal(whole.regionalIds.length,1104);
  for(const scope of manifest.regionalScopes){
    const current=context(scope.region);
    for(const id of scope.regionalIds){
      assert.ok(ids.has(id),id);
      const parsed=receiver.parseAtlasBodyLearningSelection(select(id,scope.region),current,nonce,0);
      assert.equal(parsed?.status,'selected',`${scope.region}: ${id}`);
      assert.equal(parsed.reference.structureId,id);
      assert.equal(parsed.reference.sourceSha256,lecture.createLectureBodyReference(id).sourceSha256);
      assert.equal(parsed.label,lecture.resolveLectureBodyReference(parsed.reference).label);
    }
  }
});

test('wrong identity, source, scope, replay, side and malformed selection fail closed',()=>{
  const region='hand',id=manifest.regionalScopes.find(scope=>scope.region===region).regionalIds[0];
  const good=select(id,region),current=context(region);
  assert.equal(receiver.parseAtlasBodyLearningSelection(good,current,nonce,0)?.status,'selected');
  for(const altered of [
    {...good,revision:'0'.repeat(40)}, {...good,region:'foot'}, {...good,session:'otherSession123456789'},
    {...good,sequence:0}, {...good,sequence:1.5}, {...good,sequence:Number.MAX_SAFE_INTEGER+1},
    {...good,selection:{...good.selection,source:'0'.repeat(64)}},
    {...good,selection:{...good.selection,laterality:good.selection.laterality==='left'?'right':'left'}},
    {...good,selection:{...good.selection,id:'vm:anatomy:body:unavailable:left:bone:x'}},
    {...good,selection:{...good.selection,kind:'nested'}},
    {...good,selection:{...good.selection,part:'extra'}},
    {...good,unexpected:true},Object.assign(Object.create({inherited:true}),good),
  ])assert.equal(receiver.parseAtlasBodyLearningSelection(altered,current,nonce,0),null);
  assert.equal(receiver.parseAtlasBodyLearningSelection(good,current,nonce,1),null);
  assert.equal(receiver.parseAtlasBodyLearningSelection(good,current,nonce,2),null);
  const other=manifest.regionalScopes.find(scope=>scope.region==='foot').regionalIds.find(x=>!manifest.regionalScopes.find(s=>s.region===region).regionalIds.includes(x));
  assert.equal(receiver.parseAtlasBodyLearningSelection(select(other,region),current,nonce,0),null);
  assert.equal(receiver.parseAtlasBodyLearningSelection(good,{...current,revision:'0'.repeat(40)},nonce,0),null);
  assert.equal(receiver.parseAtlasBodyLearningSelection(good,current,'short',0),null);
});

test('accessors, symbols, duplicate arrays and state surplus never execute or pass',()=>{
  const current=context('whole-body'),id=catalog.rows[0][0],good=select(id,'whole-body');
  let reads=0;
  const getter={...good};Object.defineProperty(getter,'selection',{get(){reads++;throw Error('unexpected getter');}});
  assert.equal(receiver.parseAtlasBodyLearningSelection(getter,current,nonce,0),null);
  const nested={...good,selection:{...good.selection}};
  Object.defineProperty(nested.selection,'id',{get(){reads++;throw Error('unexpected getter');}});
  assert.equal(receiver.parseAtlasBodyLearningSelection(nested,current,nonce,0),null);
  assert.equal(reads,0);
  const symbol={...good,[Symbol('x')]:true};
  assert.equal(receiver.parseAtlasBodyLearningSelection(symbol,current,nonce,0),null);
  const ready={type:'vm-atlas-learning-selection-ready',version:1,revision:manifest.sourceCommit,region:'whole-body'};
  Object.defineProperty(ready,'region',{get(){reads++;throw Error('unexpected getter');}});
  assert.equal(receiver.matchesAtlasBodyLearningReady(ready,current),false);
  assert.equal(reads,0);
  assert.equal(receiver.parseAtlasBodyLearningSelection({...good,status:'empty'},current,nonce,0),null);
  assert.deepEqual(receiver.parseAtlasBodyLearningSelection({type:good.type,version:1,revision:good.revision,
    region:good.region,session:nonce,sequence:2,status:'empty'},current,nonce,1),{sequence:2,status:'empty'});
  assert.deepEqual(receiver.parseAtlasBodyLearningSelection({type:good.type,version:1,revision:good.revision,
    region:good.region,session:nonce,sequence:3,status:'blocked',reason:'practice'},current,nonce,2),
    {sequence:3,status:'blocked',reason:'practice'});
});
