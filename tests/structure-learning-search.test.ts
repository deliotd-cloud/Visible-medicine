import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createLectureAnatomyReference,lectureAnatomyOptions} from '../lib/lecture-anatomy-reference.ts';
import {relatedLectureHref} from '../lib/lecture-related-links.ts';
import {searchStructureLearning,STRUCTURE_LEARNING_SEARCH_LIMIT} from '../lib/structure-learning-search.ts';

test('Pons uses the current constructor revision and canonical related-learning URL',()=>{
 const reference=createLectureAnatomyReference('brainstem-pons');assert(reference);
 const rows=searchStructureLearning('Ｐｏｎｓ');
 assert.equal(rows[0]?.title,'Pons');
 assert.equal(rows[0]?.kind,'Anatomy concept');
 assert.equal(rows[0]?.href,relatedLectureHref(reference.conceptId,reference.headRevision));
 assert.match(rows[0]?.summary??'',/reference concept/i);
 assert(!/approved|entitled|registered|loaded/i.test(rows[0]?.summary+' '+rows[0]?.meta));
});

test('bilateral real options remain separate, and image-only concepts do not claim 3D',()=>{
 const left=createLectureAnatomyReference('cerebellum-left-hemisphere');
 const right=createLectureAnatomyReference('cerebellum-right-hemisphere');
 assert(left?.kind==='head-image-concept-v1'&&right?.kind==='head-image-concept-v1');
 const rows=searchStructureLearning('cerebellar hemisphere');
 assert.deepEqual(rows.map(row=>row.title),['Left cerebellar hemisphere','Right cerebellar hemisphere']);
 assert.deepEqual(rows.map(row=>row.href),[
  relatedLectureHref(left.conceptId,left.headRevision),relatedLectureHref(right.conceptId,right.headRevision),
 ]);
 assert.notEqual(rows[0].href,rows[1].href);
 for(const row of rows){assert.match(row.meta,/CT\/MRI/);assert.doesNotMatch(row.meta+' '+row.summary,/3D/);}
});

test('input boundaries and literal term matching reject wildcard, code and role queries',()=>{
 for(const value of [null,undefined,0,{},[],true,'',' ','%','_','%_','a','%a_'])
  assert.deepEqual(searchStructureLearning(value),[]);
 for(const value of ['GRANT ROLE', 'SELECT * FROM anatomy'])
  assert.deepEqual(searchStructureLearning(value),[]);
 assert.deepEqual(searchStructureLearning('brainstem%_'),searchStructureLearning('brainstem'));
 assert.deepEqual(searchStructureLearning('ons'),[],'substring fragments are not concept terms');
 const long='x'.repeat(80)+'pons';
 assert.deepEqual(searchStructureLearning(long),[],'query is capped before matching');
 assert(lectureAnatomyOptions().some(option=>option.conceptId==='brainstem-pons'));
});

test('isolated constructor refusals, ranking, deduplication and cap',()=>{
 const source=readFileSync(new URL('../lib/structure-learning-search.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const options=[
  {conceptId:'refused',label:'Concept refused'},
  {conceptId:'stale',label:'Concept stale'},
  ...Array.from({length:20},(_,i)=>({conceptId:`concept-${String(i).padStart(2,'0')}`,label:`Concept ${String(i).padStart(2,'0')}`})),
  {conceptId:'concept-00',label:'Duplicate'},
 ];
 const modules:Record<string,unknown>={
  './lecture-anatomy-reference.ts':{
   lectureAnatomyOptions:()=>options,
   createLectureAnatomyReference:(id:string)=>id==='refused'?null:{kind:'head-concept-v1',conceptId:id,headRevision:'a'.repeat(64),atlasTarget:'/atlas/head-neck-3d?concept='+id},
  },
  './lecture-related-links.ts':{relatedLectureHref:(id:string)=>id==='stale'?null:'/learn/related-anatomy?concept='+id},
 };
 const output:{searchStructureLearning?:typeof searchStructureLearning}={};
 new Function('exports','require',compiled)(output,(name:string)=>{
  assert(Object.hasOwn(modules,name),name);return modules[name];
 });
 const search=output.searchStructureLearning;assert(search);
 const rows=search('concept');
 assert.equal(rows.length,STRUCTURE_LEARNING_SEARCH_LIMIT);
 assert.deepEqual(rows.map(row=>row.title),Array.from({length:12},(_,i)=>`Concept ${String(i).padStart(2,'0')}`));
 assert(rows.every(row=>row.kind==='Anatomy concept'&&row.href.startsWith('/learn/related-anatomy?')));
 assert.equal(search('concept 03')[0]?.title,'Concept 03','exact label ranks first');
 assert.deepEqual(search('refused'),[]);
 assert.deepEqual(search('stale'),[]);
});
