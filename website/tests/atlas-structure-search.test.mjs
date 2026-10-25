import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import path from 'node:path';

const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));
const candidate=path.resolve(fileURLToPath(new URL('../lib/atlas-structure-search.ts',import.meta.url))).replaceAll('\\','/');
const body=path.resolve(fileURLToPath(new URL('../lib/body-structure-search.ts',import.meta.url))).replaceAll('\\','/');
const requireWebsite=createRequire(path.join(root,'package.json'));
const esbuild=requireWebsite('esbuild');
const ts=requireWebsite('typescript');
async function load(mocks={}){
  const result=await esbuild.build({entryPoints:[candidate],absWorkingDir:root,alias:{'@':root},bundle:true,platform:'node',format:'cjs',write:false,
    plugins:[{name:'candidate-and-test-inputs',setup(build){
      build.onResolve({filter:/^\.\//},args=>{
        if(args.importer.replaceAll('\\','/').toLowerCase()===candidate.toLowerCase()){
          if(mocks[args.path])return {path:args.path,namespace:'mock'};
          return {path:args.path==='./body-structure-search.ts'?body:path.resolve(root,'lib',args.path)};
        }
      });
      build.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],loader:'js'}));
    }}]});
  const module={exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(requireWebsite,module,module.exports);
  return module.exports;
}
const api=await load();
test('full-body aliases enter source-bound regional 3D, while head search opens the exact Atlas target',()=>{
  for(const term of ['Achilles','supraspinatus','collarbone','left Achilles']){
    const rows=api.searchAtlasStructureLearning(term);
    assert(rows.length>0,term);assert(rows.length<=12);
    assert(rows.every(row=>row.kind==='Anatomy concept'));
    assert(rows.some(row=>row.href.startsWith('/atlas/3d?')));
    for(const row of rows.filter(row=>row.href.startsWith('/atlas/3d?'))){
      const p=new URL(row.href,'https://atlas.invalid').searchParams;
      assert.match(p.get('atlasRevision'),/^[a-f0-9]{40}$/);
      assert.match(p.get('source'),/^[a-f0-9]{64}$/);
      assert(p.get('structure')?.startsWith('vm:anatomy:'));
      assert.doesNotMatch(row.summary,/CT|MRI|clinically approved/);
    }
  }
  const pons=api.searchAtlasStructureLearning('Pons');
  assert.equal(pons[0].title,'Pons');
  assert(pons[0].href.startsWith('/atlas/head-neck-3d?'));
  assert(pons[0].learningHref?.startsWith('/learn/related-anatomy?concept=brainstem-pons&headRevision='));
  const hemispheres=api.searchAtlasStructureLearning('cerebellar hemisphere');
  const imageOnly=hemispheres.filter(row=>row.meta==='CT/MRI concept reference');
  assert.equal(imageOnly.length,2);
  assert(imageOnly.every(row=>row.href.startsWith('/atlas/ct-head?')&&row.learningHref?.startsWith('/learn/related-anatomy?')));
  assert.notEqual(imageOnly[0].href,imageOnly[1].href);
});

test('only a current exact root identity coalesces, never a nested part, stale link or other side',async()=>{
  const source='b'.repeat(64),id='vm:anatomy:body:head-neck:both:organ:brain';
  const bodyRows=['both','left'].map(side=>({identity:{structureId:id,fmaId:'FMA1',sourceRevision:'c'.repeat(40)},row:{kind:'Anatomy concept',title:side,href:`/atlas/3d?structure=${id}&source=${source}&side=${side}`,meta:'3D',summary:'draft'}}));
  const canonicalTarget=`/atlas/head-neck-3d?study=1&structure=${id}&source=${source}&side=both`;
  const canonicalLearning='/learn/related-anatomy?concept=brain';
  for(const [name,target,learning,expected] of [
    ['exact',canonicalTarget,canonicalLearning,2],
    ['nested',canonicalTarget+'&detail=brainstem&part=pons',canonicalLearning,3],
    ['forged primary',canonicalTarget+'&focus=other',canonicalLearning,3],
    ['stale secondary',canonicalTarget,'/learn/related-anatomy?concept=other',3],
    ['missing secondary',canonicalTarget,null,3],
  ]){
    const mocked=await load({
      './structure-learning-search.ts':`export const STRUCTURE_LEARNING_SEARCH_LIMIT=12;export const searchStructureLearning=()=>[{kind:'Anatomy concept',title:'Head',href:${JSON.stringify(target)},learningHref:${JSON.stringify(learning)},meta:'3D',summary:'draft'}];`,
      './body-structure-search.ts':`export const searchBodyStructuresWithIdentity=()=>${JSON.stringify(bodyRows)};`,
      './lecture-anatomy-reference.ts':`export const createLectureAnatomyReference=()=>({kind:'head-concept-v1',headRevision:'${'d'.repeat(64)}',atlasTarget:${JSON.stringify(name==='nested'?target:canonicalTarget)}});`,
      './lecture-related-links.ts':`export const relatedLectureHref=()=>${JSON.stringify(canonicalLearning)};`,
    });
    const rows=mocked.searchAtlasStructureLearning('brain');assert.equal(rows.length,expected,name);
    assert(rows.some(row=>row.title==='left'));
  }
});

test('original publication queries and every other platform function survive an exact source inverse',()=>{
  const current=readFileSync(new URL('../lib/platform-governance.ts',import.meta.url),'utf8');
  const before=readFileSync(new URL('./fixtures/global-body-search/platform-governance.before.txt',import.meta.url),'utf8');
  const inverse=current.replace('import { searchAtlasStructureLearning } from "@/lib/atlas-structure-search";',
    'import { searchStructureLearning } from "@/lib/structure-learning-search";')
    .replace('...searchAtlasStructureLearning(normalizedQuery)','...searchStructureLearning(normalizedQuery)');
  assert.equal(inverse.replaceAll('\r\n','\n'),before.replaceAll('\r\n','\n'));
  assert.match(current,/\.\.\.searchAtlasStructureLearning\(normalizedQuery\)/);
  assert.doesNotMatch(current,/\.\.\.searchStructureLearning\(normalizedQuery\)/);
  assert.equal((current.slice(current.indexOf('export async function searchEducation'),current.indexOf('function containsPatientIdentifier')).match(/status='published'/g)??[]).length,5);
  assert.match(current,/course_releases WHERE status='published' AND visibility='public'/);
  assert.match(current,/filterSearchKind\([\s\S]*parseSearchKind\(kindValue\)\)\.slice\(0, 30\)/);
});

test('the actual global search merges body results and keeps independent kind filters and the shared cap',async()=>{
  const kind={};
  new Function('exports',ts.transpileModule(readFileSync(path.join(root,'lib/search-kind.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(kind);
  const statements=[];
  const source=readFileSync(new URL('../lib/platform-governance.ts',import.meta.url),'utf8');
  const mocks={
    'cloudflare:workers':{env:{DB:{prepare:sql=>({bind:(...params)=>({all:async()=>{statements.push({sql,params});return {results:[]};}})})}}},
    '@/db/bootstrap':{},'@/db/platform':{ensurePlatformSchema:async()=>{}},
    '@/lib/catalog':{atlasModules:[]},'@/lib/domain':{},
    '@/lib/atlas-structure-search':api,'@/lib/search-kind':kind,
  };
  const output={};
  new Function('exports','require',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(output,name=>{assert(Object.hasOwn(mocks,name),name);return mocks[name];});
  const rows=await output.searchEducation('Ａｃｈｉｌｌｅｓ','anatomy');
  assert(rows.length>0);assert.deepEqual(rows,api.searchAtlasStructureLearning('achilles'));
  assert.equal(statements.length,4);assert(statements.every(s=>s.params.every(p=>p==='%achilles%')));
  assert(statements.every(s=>/status='published'/.test(s.sql)));
  assert.deepEqual(await output.searchEducation('Achilles','courses'),[]);
  for(const invalid of [null,[],{},'a','%_'])assert.deepEqual(await output.searchEducation(invalid),[]);
  assert((await output.searchEducation('right')).length<=30);
});
