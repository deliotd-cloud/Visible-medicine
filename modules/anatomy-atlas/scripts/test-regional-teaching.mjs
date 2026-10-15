import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {createRegionalTeachingLoader} from '../lib/body-teaching-loader.ts';

const compiled=await build({stdin:{contents:[
  "export {bodyContent,bodyLesson} from './app/body-content';",
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';",
  "export {contentTabs} from './lib/content-types';",
  "export {sourceCanonical} from './lib/body-source-additions';",
  "export {decodeRegionalTeachingSnapshot} from './lib/regional-teaching-snapshot';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const catalog=api.bodyDisplayCatalog(json('public/models/bodyparts3d/full-body/catalog.json'));
const directory='content/regional-teaching';
const regions=[...new Set(catalog.structures.map(s=>s.region))].sort();
const snapshots=Object.fromEntries(regions.map(region=>[region,json(directory+'/'+region+'.json')]));
const modules=Object.fromEntries(regions.map(region=>[region,api.decodeRegionalTeachingSnapshot(snapshots[region],region)]));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const ownUndefined=(value,path=[])=>value&&typeof value==='object'
  ?Object.keys(value).flatMap(key=>value[key]===undefined?[[...path,key]]:ownUndefined(value[key],[...path,key])):[];
const introducingCommit='d2b41697231b40b1bcf10e49bf188f2373e71c27';
const precedingResolverCommit='4dee2178b4a3015e81fbdcf16a2f133193fac6af';
const gitBytes=(commit,path)=>execFileSync('git',['show',`${commit}:${path}`],
  {encoding:null,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const gitJson=(commit,path)=>JSON.parse(gitBytes(commit,path).toString('utf8'));

test('introducing commit retains its original resolver and exact 9,936 recorded lessons',async()=>{
  assert.deepEqual(gitBytes(introducingCommit,'app/body-content.ts'),
    gitBytes(precedingResolverCommit,'app/body-content.ts'),
    'Original synchronous resolver source unchanged at the regional-loader milestone');
  // The current reader and source canonicalizer match the introducing commit
  // modulo checkout line endings, so recorded Git snapshots replay that epoch.
  for(const path of ['lib/regional-teaching-snapshot.ts','lib/body-source-additions.ts'])
    assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),
      gitBytes(introducingCommit,path).toString('utf8').replaceAll('\r\n','\n'),
      `${path}: historical decoder unchanged`);
  const historical=await exactSourceHistoryApi(introducingCommit,'display-review');
  const recordedCatalog=historical.bodyDisplayCatalog(gitJson(introducingCommit,
    'public/models/bodyparts3d/full-body/catalog.json'));
  const recordedRegions=[...new Set(recordedCatalog.structures.map(s=>s.region))].sort();
  const recordedSnapshots=Object.fromEntries(recordedRegions.map(region=>
    [region,gitJson(introducingCommit,`${directory}/${region}.json`)]));
  const recordedModules=Object.fromEntries(recordedRegions.map(region=>
    [region,api.decodeRegionalTeachingSnapshot(recordedSnapshots[region],region)]));
  assert.equal(recordedCatalog.structures.length,1104);
  assert.equal(historical.contentTabs.length,9);
  assert.deepEqual(recordedRegions,regions);
  for(const region of recordedRegions)
    assert.deepEqual(recordedSnapshots[region].entries.map(entry=>entry.identity).sort(),
      recordedCatalog.structures.filter(s=>s.region===region).map(api.sourceCanonical).sort(),
      region+': recorded exact source closure');
  let placements=0,undefinedProperties=0;
  for(const structure of recordedCatalog.structures){
    const module=recordedModules[structure.region];
    assert.equal(module.accepts(structure),true,structure.id);
    for(const tab of historical.contentTabs){
      const expected=historical.bodyLesson(structure,tab),actual=module.bodyLesson(structure,tab);
      assert.deepEqual(actual,expected,structure.id+':'+tab+': recorded lesson');
      assert.deepEqual(module.bodyContent(structure,tab),historical.bodyContent(structure,tab),
        structure.id+':'+tab+': recorded display');
      assert.deepEqual(ownUndefined(actual),ownUndefined(expected),
        structure.id+':'+tab+': recorded own undefined fields');
      undefinedProperties+=ownUndefined(expected).length;placements++;
      const clean=structuredClone(actual);
      actual.bullets?.push('foreign');actual.citations?.push('https://foreign.example');actual.body='foreign';
      assert.deepEqual(module.bodyLesson(structure,tab),clean,
        structure.id+':'+tab+': recorded detached data');
    }
  }
  assert.equal(placements,9936);assert.equal(undefinedProperties,20);
  assert.equal(Object.values(recordedSnapshots).reduce((count,snapshot)=>count+snapshot.undefinedPaths.length,0),20);
});

test('all display-corrected selections and nine lessons preserve exact synchronous semantics',()=>{
  assert.equal(catalog.structures.length,1104);assert.equal(api.contentTabs.length,9);
  assert.deepEqual(readdirSync(directory).filter(name=>name.endsWith('.json')).sort(),regions.map(region=>region+'.json'));
  for(const region of regions){
    assert.deepEqual(snapshots[region].entries.map(entry=>entry.identity).sort(),
      catalog.structures.filter(s=>s.region===region).map(api.sourceCanonical).sort(),region+': exact source closure');
  }
  let placements=0,undefinedProperties=0,supplemental=0;
  const supplementalIds=[];
  for(const structure of catalog.structures){
    const module=modules[structure.region];
    assert.equal(module.accepts(structure),true,structure.id);
    for(const tab of api.contentTabs){
      const expected=api.bodyLesson(structure,tab),actual=module.bodyLesson(structure,tab);
      assert.deepEqual(actual,expected,structure.id+':'+tab+':lesson');
      assert.deepEqual(module.bodyContent(structure,tab),api.bodyContent(structure,tab),structure.id+':'+tab+':display');
      assert.deepEqual(ownUndefined(actual),ownUndefined(expected),structure.id+':'+tab+':own undefined fields');
      undefinedProperties+=ownUndefined(expected).length;placements++;
      const clean=structuredClone(actual);
      actual.bullets?.push('foreign');
      actual.citations?.push('https://foreign.example');
      if(actual.additionalChecks){
        supplemental++;
        supplementalIds.push(structure.id);
        for(const check of actual.additionalChecks){
          check.body='foreign';
          check.bullets.push('foreign');
          check.citations.push('https://foreign.example');
          check.note='foreign';
        }
        actual.additionalChecks.push(structuredClone(actual.additionalChecks[0]));
      }
      actual.body='foreign';
      assert.deepEqual(module.bodyLesson(structure,tab),clean,structure.id+':'+tab+':detached data');
    }
  }
  assert.equal(placements,9936);assert.equal(undefinedProperties,20);
  const limbPins=json('content/limb-nerve-quiz-pins.json');
  assert.equal(limbPins.entries.length,18);
  const shortCiliary='vm:anatomy:body:head-neck:unspecified:nerve:short-ciliary-nerve';
  assert.equal(supplemental,19,'18 retained limb checks plus one exact short-ciliary placement');
  assert.deepEqual(supplementalIds.sort(),[...limbPins.entries.map(entry=>entry.identity.id),shortCiliary].sort());
  assert.equal(api.bodyLesson(catalog.structures.find(s=>s.id===shortCiliary),'quiz').additionalChecks.length,3);
  assert.equal(Object.values(snapshots).reduce((count,snapshot)=>count+snapshot.undefinedPaths.length,0),20);
});

test('complete source identity rejects altered scalar, collection and object fields',()=>{
  const pathsWhere=(value,predicate,path=[])=>[
    ...(predicate(value)?[path]:[]),
    ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>pathsWhere(child,predicate,[...path,key])):[]),
  ];
  const at=(value,path)=>path.reduce((part,key)=>part[key],value);
  let rejected=0;
  for(const structure of catalog.structures){
    const module=modules[structure.region],refuse=bad=>{assert.equal(module.accepts(bad),false,structure.id);rejected++;};
    for(const path of pathsWhere(structure,value=>value===null||typeof value!=='object')){
      const bad=structuredClone(structure),parent=at(bad,path.slice(0,-1)),key=path.at(-1),original=parent[key];
      parent[key]=typeof original==='string'?original+'-foreign':typeof original==='number'?original+.01:original===null?'foreign':!original;
      refuse(bad);
    }
    for(const path of pathsWhere(structure,Array.isArray)){
      const bad=structuredClone(structure);at(bad,path).push('foreign');refuse(bad);
    }
    for(const path of pathsWhere(structure,value=>value&&typeof value==='object'&&!Array.isArray(value))){
      const bad=structuredClone(structure);at(bad,path).unexpected=true;refuse(bad);
      for(const key of Object.keys(at(structure,path))){
        const omitted=structuredClone(structure);delete at(omitted,path)[key];refuse(omitted);
      }
    }
  }
  assert(rejected>50000,'Complete catalogue identity mutation coverage');
});

test('selected primary region controls requests; pending/success caches share without full fallback',async()=>{
  const calls={},requests=Object.fromEntries(regions.map(region=>[region,deferred()]));
  let fullCalls=0;
  const loader=createRegionalTeachingLoader(Object.fromEntries(regions.map(region=>[region,()=>{
    calls[region]=(calls[region]??0)+1;return requests[region].promise;
  }])),async()=>{fullCalls++;return api;});
  const a=catalog.structures.find(s=>s.regions.length>1)??catalog.structures[0];
  assert.equal(loader.peek(a),undefined);assert.equal(fullCalls,0);
  const first=loader.load(a),second=loader.load(structuredClone(a));
  await tick();assert.deepEqual(calls,{[a.region]:1});
  requests[a.region].resolve({default:snapshots[a.region]});
  const [one,two]=await Promise.all([first,second]);assert.equal(one,two);
  assert.equal(loader.peek(a),one);
  assert.equal(await loader.load(a),one);assert.equal(calls[a.region],1);assert.equal(fullCalls,0);
  const b=catalog.structures.find(s=>s.region!==a.region);
  assert.equal(loader.peek(b),undefined);
  const next=loader.load(b);await tick();assert.equal(calls[b.region],1);
  requests[b.region].resolve({default:snapshots[b.region]});
  const other=await next;assert.equal(other.accepts(b),true);assert.equal(other.accepts(a),false);assert.equal(fullCalls,0);
});

test('altered and unknown source identities share original full fallback, never snapshot substitutes',async()=>{
  let imports=0,fullCalls=0;const full=deferred();
  const importers=Object.fromEntries(regions.map(region=>[region,async()=>{imports++;return {default:snapshots[region]};}]));
  const loader=createRegionalTeachingLoader(importers,()=>{fullCalls++;return full.promise;});
  const original=catalog.structures[0],altered=structuredClone(original);
  altered.sources[0].sha256='0'.repeat(64);
  const unknown={...structuredClone(original),id:'foreign',region:'unknown-region',regions:['unknown-region']};
  const a=loader.load(altered),b=loader.load(unknown);await tick();
  assert.equal(fullCalls,1);assert.equal(imports,1);full.resolve(api);
  const [one,two]=await Promise.all([a,b]);assert.equal(one,two);
  for(const structure of [altered,unknown]){
    assert.equal(one.accepts(structure),true);
    for(const tab of api.contentTabs){
      assert.deepEqual(one.bodyLesson(structure,tab),api.bodyLesson(structure,tab));
      assert.deepEqual(one.bodyContent(structure,tab),api.bodyContent(structure,tab));
    }
    assert.equal(await loader.load(structure),one);
  }
  assert.equal(fullCalls,1);
});

test('regional import failures require explicit retry and never trigger full resolver',async()=>{
  const structure=catalog.structures[0];let calls=0,fullCalls=0;
  const loader=createRegionalTeachingLoader({[structure.region]:async()=>{
    if(++calls===1)throw Error('offline');return {default:snapshots[structure.region]};
  }},async()=>{fullCalls++;return api;});
  const a=loader.load(structure),b=loader.load(structure);
  await assert.rejects(a,/offline/);await assert.rejects(b,/offline/);
  assert.equal(calls,1);assert.equal(fullCalls,0);assert.equal(loader.peek(structure),undefined);
  const [one,two]=await Promise.all([loader.load(structure),loader.load(structure)]);
  assert.equal(one,two);assert.equal(calls,2);assert.equal(fullCalls,0);assert.equal(one.accepts(structure),true);
});

test('decoder restores own undefined values without mutating encoded data and rejects wrong region',()=>{
  const region=regions[0],snapshot=snapshots[region],before=structuredClone(snapshot);
  const first=api.decodeRegionalTeachingSnapshot(snapshot,region);
  const second=api.decodeRegionalTeachingSnapshot(snapshot,region);
  assert.deepEqual(snapshot,before);
  assert.notEqual(first,second);
  assert.throws(()=>api.decodeRegionalTeachingSnapshot(snapshot,region+'-foreign'));
  for(const mutate of [
    bad=>{bad.schemaVersion=2;},
    bad=>{bad.entries.push(structuredClone(bad.entries[0]));},
    bad=>{delete bad.entries[0].lessons.xray;},
    bad=>{bad.entries[0].lessons.xray.readiness='approved';},
    bad=>{bad.undefinedPaths.push(['entries',0,'lessons','xray','missing']);},
    bad=>{bad.undefinedPaths.push(['entries',0,'__proto__','polluted']);},
    bad=>{bad.undefinedPaths.push(['entries',0,'lessons','xray','body']);},
  ]){
    const bad=structuredClone(snapshot);mutate(bad);
    assert.throws(()=>api.decodeRegionalTeachingSnapshot(bad,region));
  }
  assert.equal(Object.prototype.polluted,undefined);
});
