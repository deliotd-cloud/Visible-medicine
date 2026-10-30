import assert from 'node:assert/strict';import test from 'node:test';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const site=path.resolve(fileURLToPath(new URL('../',import.meta.url))),file=new URL('./neonatal-inbox-contexts.mjs',import.meta.url),source=fs.readFileSync(file,'utf8');
const route='app/api/atlas-delivery/references/[...asset]/route.ts',addition="(path==='"+route+"'||",oldTail='.test(path))&&!path.includes',newTail='.test(path)&&!path.includes';
const relativeRule="!path.startsWith('/')&&path.split('/').every(part=>part&&part!=='.'&&part!=='..')&&",whitespaceRule="&&path.trim()===path";
assert.equal(source.split(relativeRule).length,2);assert.equal(source.split(whitespaceRule).length,2);
assert.equal(source.split(addition).length,2);let original=source.replace(relativeRule,'').replace(whitespaceRule,'').replace(addition,'');assert.equal(original.split(oldTail).length,2);original=original.replace(oldTail,newTail);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const historicalInputBytes=fs.readFileSync(new URL('./fixtures/coverage-path-historical-1816-inputs.json.raw',import.meta.url));
const historicalInputs=JSON.parse(historicalInputBytes).inputs;
function guard(text,overrides={}){
  const marker='const safePath=path=>{';assert.equal(text.split(marker).length,2);const start=text.indexOf(marker),end=text.indexOf('\n};',start);assert(end>start);
  const dependencies={assert,resolve:path.resolve,root:site,parentRoot:undefined,junctions:new Set(),existsSync:fs.existsSync,realpathSync:fs.realpathSync,statSync:fs.statSync,...overrides};
  return new Function(...Object.keys(dependencies),text.slice(start,end+3)+';return safePath;')(...Object.values(dependencies));
}
test('only the declared relative guards and exact route exception differ from the complete original helper',()=>{
  assert.equal(sha(original),'fe4dc1d2eb068c9be29507f7b5341d4bf189c1e27a8c5c273e2938a2d9f2c6f1');
  assert.equal(sha(source),'95a26c2dcb61bb16400e718e6b9a3a4e4e9a20d96a829a0111c6c05b373df3ad');
});
test('the exact hash-pinned catch-all route is a contained real source file',()=>{
  const inputs=JSON.parse(fs.readFileSync(path.resolve(site,'atlas-review/integration-inputs.json'),'utf8')).inputs;
  const row=inputs.find(item=>item.path===route);assert(row);assert.equal(row.sha256,'734f2e5cce9030b4601e8e52453dac9beab0a63b472fbc0d72e310bc4c948419');
  assert.throws(()=>guard(original)(route),/Unsafe Review integration path/);
  const target=guard(source)(route);assert.equal(target,fs.realpathSync(path.resolve(site,route)));assert.equal(sha(fs.readFileSync(target)),row.sha256);
});
test('every other current bound source retains exactly the original path result',()=>{
  assert.equal(sha(historicalInputBytes),'f21a4e1766b1156f0a2d1872a626581b978deb67426915b387aeae63d5733d65');
  const inputs=historicalInputs;
  const prior=guard(original),current=guard(source);let exceptions=0;
  for(const row of inputs){if(row.path===route){exceptions++;continue;}assert.equal(current(row.path),prior(row.path),row.path);}
  assert.equal(exceptions,1);assert.equal(inputs.length,1816);
});
test('the current binding retains the path guard for every current source',()=>{
  const inputs=JSON.parse(fs.readFileSync(path.resolve(site,'atlas-review/integration-inputs.json'),'utf8')).inputs;
  const prior=guard(original),current=guard(source);let exceptions=0;
  for(const row of inputs){if(row.path===route){exceptions++;assert.equal(row.sha256,'734f2e5cce9030b4601e8e52453dac9beab0a63b472fbc0d72e310bc4c948419');continue;}assert.equal(current(row.path),prior(row.path),row.path);}
  assert.equal(exceptions,1);assert.equal(inputs.length,1852);
});
test('other bracketed, traversal, drive, backslash and non-string values still refuse before filesystem access',()=>{
  const noRead=guard(source,{existsSync:()=>assert.fail('Rejected path touched filesystem'),realpathSync:()=>assert.fail('Rejected path resolved a file'),statSync:()=>assert.fail('Rejected path inspected a file')});
  for(const value of [null,undefined,1,{},[],'.env','lib//source.ts','lib/.','lib/..','lib/source.ts\n','../secret','app/../secret','/absolute','F:/absolute','app\\api\\route.ts','app/api/references/[other]/route.ts',route+'x',route.replace('[...asset]','%5B...asset%5D'),route+'\0'])assert.throws(()=>noRead(value),/Unsafe Review integration path/);
});
test('an out-of-root realpath refuses before the target is inspected',()=>{
  let stats=0;const current=guard(source,{existsSync:()=>true,realpathSync:()=>path.resolve(site,'../outside.ts'),statSync:()=>{stats++;assert.fail('Escaped target inspected');}});
  assert.throws(()=>current('lib/source.ts'),/escaped the bound website/);assert.equal(stats,0);
});
test('a staged parent junction still refuses unless explicitly declared',()=>{
  const parent=path.resolve(site,'../synthetic-parent'),current=guard(source,{parentRoot:parent,existsSync:()=>true,realpathSync:()=>path.resolve(parent,'lib/source.ts'),statSync:()=>assert.fail('Undeclared parent inspected')});
  assert.throws(()=>current('lib/source.ts'),/escaped the bound website/);
});
test('the existing verified parent-junction rule retains its exact behavior',()=>{
  const parent=path.resolve(site,'../synthetic-parent'),target=path.resolve(parent,'lib/source.ts'),overrides={parentRoot:parent,junctions:new Set(['lib']),existsSync:()=>true,realpathSync:()=>target,statSync:()=>({isFile:()=>true})};
  assert.equal(guard(source,overrides)('lib/source.ts'),target);assert.equal(guard(original,overrides)('lib/source.ts'),target);
});
test('a missing source cannot invent a parent fallback',()=>{
  const current=guard(source,{existsSync:()=>false,realpathSync:()=>assert.fail('Missing source resolved a fallback'),statSync:()=>assert.fail('Missing source inspected')});
  assert.throws(()=>current('lib/source.ts'),/Missing bound input; no verified parent fallback/);
});

test('the pre-existing rooted-path acceptance is refused by the actual new guard',()=>{
  const rooted='/synthetic.ts',target=path.resolve(site,rooted);assert(path.relative(site,target).startsWith('..'));
  const filesystem={existsSync:()=>true,realpathSync:value=>{assert.equal(value,target);return target;},statSync:()=>({isFile:()=>true})};
  assert.equal(guard(original,filesystem)(rooted),target,'Exact original helper accepted this synthetic out-of-root file');
  assert.throws(()=>guard(source,filesystem)(rooted),/Unsafe Review integration path/);
});
