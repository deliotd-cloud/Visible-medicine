import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,sep} from 'node:path';
import ts from 'typescript';
import test from 'node:test';
import {
  historicalNonregionalAtlasSources, currentNonregionalAtlasSources,
  currentNonregionalSources, assertCurrentNonregionalSources, assertCurrentAtlasInput, assertHistoricalAtlasInputs,
} from './atlas-nonregional-release-fixture.ts';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root));
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pin=json('tests/fixtures/current-atlas-delivery.json');
const inventory=json('lib/atlas-model-inventory.json');
const nonregional=inventory.sources.filter(source=>source.module!=='head-neck');
const modelCounts=[['shoulder',1],['female-pelvis',2],['lower-limb',5]];

 test('frozen originals retain their recorded byte identities and historical source expectations',()=>{
  const frozen=json('tests/fixtures/nonregional-release-before-20261016/manifest.json');
  assert.equal(frozen.files.length,17);
  assert.equal(new Set(frozen.files.map(file=>file.path)).size,17);
  for(const file of frozen.files){
    assert.ok(file.saved.endsWith('.ts.txt'),file.path+': non-compilable frozen archive');
    assert.equal(sha(read(file.saved)),file.sha256,file.path);
  }
  const archived=read('tests/fixtures/nonregional-release-before-20261016/atlas-nonregional-release-fixture.ts.txt').toString();
  const frozenHistoricalSources=[...archived.matchAll(/\{module:'([^']+)',sourceCommit:'([a-f0-9]{40})',manifestSha256:'([a-f0-9]{64})',modelPaths:(\d+)\}/g)]
    .map(([,module,sourceCommit,manifestSha256,modelPaths])=>({module,sourceCommit,manifestSha256,modelPaths:Number(modelPaths)}));
  assert.equal(frozenHistoricalSources.length,3);
  assert.deepEqual(historicalNonregionalAtlasSources,frozenHistoricalSources);
  assert.deepEqual(historicalNonregionalAtlasSources.map(({module,modelPaths})=>[module,modelPaths]),modelCounts);
  assert.notDeepEqual(historicalNonregionalAtlasSources,currentNonregionalAtlasSources);
});

test('current nonregional sources bind only the closed delivery pin and unchanged module counts',()=>{
  assert.deepEqual(currentNonregionalSources(),currentNonregionalAtlasSources);
  assertCurrentNonregionalSources(nonregional);
  assert.deepEqual(nonregional.map(({module,modelPaths})=>[module,modelPaths]),modelCounts);
  for(const source of nonregional){
    assert.equal(source.sourceCommit,pin.source);
    assert.equal(source.manifestSha256,pin.documents[`public/atlas-runtime/${source.module}/manifest.json`]);
  }
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap(model=>model.paths).length,144);
  assert.equal(inventory.models.reduce((total,model)=>total+model.bytes,0),199072480);
});

test('nonregional manifests, source inputs, model bytes and existing clinical holds remain exact',()=>{
  for(const source of nonregional){
    const base=`public/atlas-runtime/${source.module}/`;
    const manifest=json(base+'manifest.json');
    assert.equal(sha(read(base+'manifest.json')),source.manifestSha256);
    assert.equal(sha(read(base+'source-inputs.json')),pin.documents[base+'source-inputs.json']);
    assert.equal(manifest.sourceCommit,pin.source);
    for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false,source.module+':'+flag);
    assert.equal(manifest.imagingConnection,source.module==='shoulder'?undefined:false);
    const models=inventory.models.flatMap(model=>model.paths.filter(path=>path.replace(/^\//,'').startsWith(base.replace(/^public\//,''))).map(path=>({path,model})));
    assert.equal(models.length,source.modelPaths,source.module);
    for(const {path,model} of models){
      const bytes=read('public/'+path.replace(/^\//,''));
      assert.equal(bytes.length,model.bytes,path);
      assert.equal(sha(bytes),model.sha256,path);
    }
  }
});

for(const module of ['shoulder','female-pelvis','lower-limb']){
  test(`${module}: altered source, manifest pin and model count cannot enter current expectations`,()=>{
    for(const [key,value] of [['sourceCommit','0'.repeat(40)],['manifestSha256','0'.repeat(64)],['modelPaths',99]]){
      const altered=structuredClone(nonregional);
      altered.find(source=>source.module===module)[key]=value;
      assert.throws(()=>assertCurrentNonregionalSources(altered),{code:'ERR_ASSERTION'},key);
    }
  });
  test(`${module}: altered or missing delivered manifest/source-input bytes fail closed`,()=>{
    for(const file of ['manifest.json','source-inputs.json']){
      const path=`public/atlas-runtime/${module}/${file}`;
      assert.throws(()=>validateCurrentAtlasDelivery({read:p=>p===path?Buffer.concat([read(p),Buffer.from(' ')]):read(p)}),{code:'ERR_ASSERTION'});
      assert.throws(()=>validateCurrentAtlasDelivery({read:p=>{if(p===path)throw new Error('Missing delivery document: '+p);return read(p);}}),{message:'Missing delivery document: '+path});
    }
  });
}

test('stale historical sources, missing modules and extra modules are rejected for current delivery',()=>{
  assert.throws(()=>assertCurrentNonregionalSources(historicalNonregionalAtlasSources),{code:'ERR_ASSERTION'});
  assert.throws(()=>assertCurrentNonregionalSources(nonregional.slice(1)),{code:'ERR_ASSERTION'});
  assert.throws(()=>assertCurrentNonregionalSources([...nonregional,nonregional[0]]),{code:'ERR_ASSERTION'});
});

test('altered, stale and missing closed pin fields are rejected without changing the saved pin',()=>{
  const altered=structuredClone(pin);
  altered.documents['public/atlas-runtime/shoulder/manifest.json']='0'.repeat(64);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:altered}),{code:'ERR_ASSERTION'});
  const stale=structuredClone(pin);
  stale.source=historicalNonregionalAtlasSources[0].sourceCommit;
  assert.throws(()=>validateCurrentAtlasDelivery({pin:stale}),{code:'ERR_ASSERTION'});
  const missing=structuredClone(pin);
  delete missing.documents['public/atlas-runtime/shoulder/source-inputs.json'];
  assert.throws(()=>validateCurrentAtlasDelivery({pin:missing}),{code:'ERR_ASSERTION'});
  assert.throws(()=>validateCurrentAtlasDelivery({pin:{}}),{code:'ERR_ASSERTION'});
  assert.deepEqual(json('tests/fixtures/current-atlas-delivery.json'),pin);
});


test('consumer mutation cannot rewrite historical proofs or the admitted current source/counts',()=>{
  const historical=structuredClone(historicalNonregionalAtlasSources);
  const current=structuredClone(currentNonregionalAtlasSources);
  for(const sources of [historicalNonregionalAtlasSources,currentNonregionalAtlasSources]){
    assert(Object.isFrozen(sources));
    for(const source of sources){
      assert(Object.isFrozen(source));
      for(const [key,value] of [['sourceCommit','0'.repeat(40)],['manifestSha256','0'.repeat(64)],['modelPaths',99]]){
        assert.throws(()=>{source[key]=value;},TypeError,key);
      }
    }
    assert.throws(()=>sources.pop(),TypeError);
  }
  assert.deepEqual(historicalNonregionalAtlasSources,historical);
  assert.deepEqual(currentNonregionalAtlasSources,current);
  assert.deepEqual(currentNonregionalSources(),current);
  assertCurrentNonregionalSources(nonregional);
});

test('mutating a returned expectation copy cannot change later current admission',()=>{
  const altered=currentNonregionalSources();
  altered[0].sourceCommit=historicalNonregionalAtlasSources[0].sourceCommit;
  altered[0].modelPaths+=1;
  altered[1].modelPaths-=1;
  assert.throws(()=>assertCurrentNonregionalSources(altered),{code:'ERR_ASSERTION'});
  assert.deepEqual(currentNonregionalSources(),currentNonregionalAtlasSources);
  assertCurrentNonregionalSources(nonregional);
});


test('current source-input admission binds exact committed Atlas and imported Review bytes',()=>{
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  for(const path of ['app/atlas-workspace.tsx','content/main-bronchus-xray.ts','lib/nested-practice.ts'])assertCurrentAtlasInput(inputs,path);
});

test('current source-input admission rejects missing, duplicate, altered and stale bindings',()=>{
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  const path='app/atlas-workspace.tsx';
  const row=inputs.find(input=>input.path===path);
  assert.throws(()=>assertCurrentAtlasInput(inputs.filter(input=>input.path!==path),path),{code:'ERR_ASSERTION'});
  assert.throws(()=>assertCurrentAtlasInput([...inputs,row],path),{code:'ERR_ASSERTION'});
  for(const sha256 of ['0'.repeat(64),'fb0b89748213755782a9eeb4522193425e912da976020249eaa80ecb56ef653d']){
    const altered=inputs.map(input=>input.path===path?{...input,sha256}:input);
    assert.throws(()=>assertCurrentAtlasInput(altered,path),{code:'ERR_ASSERTION'});
  }
  for(const path of ['.env.local','../app/atlas-workspace.tsx','app/../atlas-workspace.tsx','app//atlas-workspace.tsx','C:/secrets.json'])assert.throws(()=>assertCurrentAtlasInput(inputs,path),{code:'ERR_ASSERTION'});
});

test('all original feature-era source-input hashes remain in explicit historical replay tables',()=>{
  const consumers=[
    'atlas-main-bronchus-xray','atlas-nested-practice','atlas-orbital-ultrasound','atlas-pelvic-update',
    'atlas-pes-anserine-study','atlas-posterior-mediastinal','atlas-practice-navigation',
    'atlas-projection-ultrasound','atlas-proper-digital-teaching','atlas-pulmonary-hilar',
    'atlas-pulmonary-vein-ultrasound','atlas-search-study-handoff',
  ];
  for(const name of consumers){
    const old=read('tests/fixtures/nonregional-release-before-20261016/'+name+'.test.ts.txt').toString();
    const now=read('tests/'+name+'.test.ts').toString();
    const expected={};
    for(const match of old.matchAll(/['"]((?:app|content|lib)\/[^'"]+)['"]\s*[:,]\s*['"]([a-f0-9]{64})['"]/g))expected[match[1]]=match[2];
    for(const match of old.matchAll(/path:'((?:app|content|lib)\/[^']+)',sha256:'([a-f0-9]{64})'/g))expected[match[1]]=match[2];
    const saved=JSON.parse(now.match(/const historicalSourceBindings=(\{[\s\S]*?\});/)[1]);
    assert.deepEqual(saved,expected,name);
    const calls=name==='atlas-nested-practice'
      ? ["assertHistoricalAtlasInputs(routedInputs);","assertHistoricalAtlasInputs({'app/atlas-workspace.tsx':workspace},'navigation');"]
      : name==='atlas-orbital-ultrasound'||name==='atlas-search-study-handoff'
        ? ["assertHistoricalAtlasInputs(historicalSourceBindings,'navigation');"]
        : ['assertHistoricalAtlasInputs(historicalSourceBindings);'];
    for(const call of calls)assert.ok(now.includes(call),name+': exact historical replay remains an executable test');
    assert.ok(now.includes('assertCurrentAtlasInput(inputs,'),name+': current Git/Review checks');
  }
});

test('the preserved mixed nested-practice table is refused as a single historical export',()=>{
  const source=read('tests/atlas-nested-practice.test.ts').toString();
  const mixed=JSON.parse(source.match(/const historicalSourceBindings=(\{[\s\S]*?\});/)[1]);
  // The original failed association remains explicit: workspace fb0 is later
  // than the routed controls and ventricles. Neither export admits the mixture.
  assert.throws(()=>assertHistoricalAtlasInputs(mixed),{code:'ERR_ASSERTION'});
  assert.throws(()=>assertHistoricalAtlasInputs(mixed,'navigation'),{code:'ERR_ASSERTION'});
  const {'app/atlas-workspace.tsx':workspace,...routedInputs}=mixed;
  assertHistoricalAtlasInputs(routedInputs);
  assertHistoricalAtlasInputs({'app/atlas-workspace.tsx':workspace},'navigation');
});

test('a real later workspace export cannot be misbound to routed history or current delivery',()=>{
  const workspace={'app/atlas-workspace.tsx':'fb0b89748213755782a9eeb4522193425e912da976020249eaa80ecb56ef653d'};
  assert.throws(()=>assertHistoricalAtlasInputs(workspace),{code:'ERR_ASSERTION'});
  assertHistoricalAtlasInputs(workspace,'navigation');
  assert.throws(()=>assertHistoricalAtlasInputs(workspace,'HEAD'),{code:'ERR_ASSERTION'});
  assert.throws(()=>assertHistoricalAtlasInputs({'app/../atlas-workspace.tsx':workspace['app/atlas-workspace.tsx']},'navigation'),{code:'ERR_ASSERTION'});
  assert.throws(()=>assertHistoricalAtlasInputs({'app/atlas-workspace.tsx':'0'.repeat(64)},'navigation'),{code:'ERR_ASSERTION'});
  assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:'8b809ca6d8c70afc824acd41dbbf4d10df138fcd'}}),{code:'ERR_ASSERTION'});
});

test('both historical associations bind real delivered runtime bytes and their Atlas source',()=>{
  const epochs=[
    {website:'f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6',source:'88cea927d48729769b96ad8fe680b0872b7e6687',manifest:'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381'},
    {website:'440bfade45f4a330665eea2539f3a7b7dff82e1b',source:'8b809ca6d8c70afc824acd41dbbf4d10df138fcd',manifest:'19c415a794ef852357d8b5f1be5951e2f553354b7e073b9e5bfea8313398498b'},
  ];
  for(const epoch of epochs){
    const saved=path=>execFileSync('git',['show',`${epoch.website}:${path}`],{cwd:root,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    const base='public/atlas-runtime/head-neck/';
    const bytes=saved(base+'manifest.json'),manifest=JSON.parse(bytes);
    assert.equal(sha(bytes),epoch.manifest);
    assert.equal(manifest.sourceCommit,epoch.source);
    const runtime=manifest.files.filter(file=>/\.(?:js|css|html)$/.test(file.path));
    assert(runtime.length>0);
    for(const file of runtime){
      const data=saved(base+file.path);
      assert.equal(data.length,file.bytes,file.path);
      assert.equal(sha(data),file.sha256,file.path);
    }
  }
});

test('TypeScript discovers every active original entry and excludes all frozen text archives',()=>{
  const configPath=fileURLToPath(new URL('tsconfig.json',root));
  const loaded=ts.readConfigFile(configPath,ts.sys.readFile);
  assert.equal(loaded.error,undefined);
  const config=ts.parseJsonConfigFileContent(loaded.config,ts.sys,fileURLToPath(root));
  assert.deepEqual(config.errors,[]);
  const files=new Set(config.fileNames.map(path=>resolve(path)));
  const archives=resolve(fileURLToPath(new URL('tests/fixtures/nonregional-release-before-20261016/',root)))+sep;
  assert.deepEqual([...files].filter(path=>path.startsWith(archives)),[]);
  const frozen=json('tests/fixtures/nonregional-release-before-20261016/manifest.json');
  for(const file of frozen.files){
    assert.ok(files.has(resolve(fileURLToPath(new URL(file.path,root)))),file.path+': active source remains in TypeScript');
    assert.equal(files.has(resolve(fileURLToPath(new URL(file.saved,root)))),false,file.saved+': archive is text evidence');
  }
});
