import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

type Row={kind:string;title:string;href:string;summary:string;meta:string;learningHref?:string};
const source=readFileSync(new URL('../lib/public-education-search.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const head:Row={kind:'Anatomy concept',title:'Pons',href:'/atlas/head-neck-3d?study=1&source=current',
  learningHref:'/learn/related-anatomy?concept=brainstem-pons&headRevision=current',summary:'Draft reference',meta:'3D Atlas concept reference'};
const body:Row={kind:'Anatomy concept',title:'Achilles',href:'/atlas/3d?region=lower-limb&atlasRevision=current',
  summary:'Source-based 3D reference',meta:'3D Atlas'};
const modules=Array.from({length:35},(_,i)=>({slug:`module-${i}`,title:`Pons Atlas ${i}`,region:'head-neck',modality:'3D',description:'Pons anatomy',systems:['neuro']}));

function load(repository:(query:string,kind:string)=>Promise<Row[]>,sourceSearch:(query:string)=>Row[],catalog=modules){
  const calls:Array<[string,string]>=[];
  const output:{searchPublicEducation?:(query:string,kind:string)=>Promise<{results:Row[];availability:string}>}={};
  const mocks:Record<string,unknown>={
    './catalog':{atlasModules:catalog},
    './atlas-structure-search':{searchAtlasStructureLearning:sourceSearch},
    './platform-governance':{searchEducation:(query:string,kind:string)=>{calls.push([query,kind]);return repository(query,kind);}},
    './search-kind':{
      normalizeSearchQuery:(value:string)=>value.normalize('NFKC').trim().slice(0,80),
      filterSearchKind:(rows:Row[],kind:string)=>kind==='all'?rows:rows.filter(row=>
        ({anatomy:['Anatomy concept','Structure'],atlas:['Atlas'],courses:['Course'],cases:['Case'],workbooks:['Workbook']} as Record<string,string[]>)[kind]?.includes(row.kind)),
    },
  };
  new Function('exports','require',compiled)(output,(name:string)=>{assert(Object.hasOwn(mocks,name),name);return mocks[name];});
  assert(output.searchPublicEducation);
  return {search:output.searchPublicEducation,calls};
}

test('available repository result is returned exactly, including published rows and order',async()=>{
  const published:Row={kind:'Case',title:'Published case',href:'/learn?case=one',summary:'Approved publication',meta:'Case'};
  const expected=[published,head];
  const fixture=load(async()=>expected,()=>{throw Error('static fallback must not run');});
  const result=await fixture.search('  Ｐｏｎｓ  ','all');
  assert.equal(result.availability,'complete');assert.strictEqual(result.results,expected);
  assert.deepEqual(fixture.calls,[['Pons','all']]);
});

test('repository failure shows only current static source rows and bounded catalogue metadata',async()=>{
  const fixture=load(async()=>{throw Error('database unavailable');},()=>[head,body]);
  const all=await fixture.search('Pons','all');
  assert.equal(all.availability,'partial');assert.equal(all.results.length,30);
  assert.deepEqual(all.results.slice(0,2),[head,body]);
  assert(all.results.slice(2).every(row=>row.kind==='Atlas'&&row.href.startsWith('/atlas/module-')));
  assert(!all.results.some(row=>['Case','Course','Workbook','Structure'].includes(row.kind)));
  assert.deepEqual((await fixture.search('Pons','anatomy')).results,[head,body]);
  assert.equal((await fixture.search('Pons','atlas')).results.length,30);
  for(const kind of ['cases','courses','workbooks']){
    const result=await fixture.search('Pons',kind);
    assert.equal(result.availability,'partial');assert.deepEqual(result.results,[],kind);
  }
});

test('source-constructor failure surfaces and never receives a guessed or stale anatomy destination',async()=>{
  const fixture=load(async()=>{throw Error('database unavailable');},()=>{throw Error('source revision mismatch');},[]);
  await assert.rejects(()=>fixture.search('Pons','anatomy'),/source revision mismatch/);
  assert.deepEqual(await fixture.search('Pons','cases'),{results:[],availability:'partial'});
  assert.deepEqual(await fixture.search(' %_ ','all'),{results:[],availability:'partial'});
  assert.deepEqual(await fixture.search('p','all'),{results:[],availability:'complete'});
});
