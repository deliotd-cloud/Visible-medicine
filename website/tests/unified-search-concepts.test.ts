import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import ts from 'typescript';
import * as concepts from '../lib/structure-learning-search.ts';
import {createLectureAnatomyReference} from '../lib/lecture-anatomy-reference.ts';
import {relatedLectureHref} from '../lib/lecture-related-links.ts';
import * as searchKind from '../lib/search-kind.ts';

function fixture(){
  const db=new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE cases(id TEXT,title TEXT,description TEXT,classification TEXT,status TEXT);
    CREATE TABLE courses(id TEXT,title TEXT);
    CREATE TABLE modules(id TEXT,course_id TEXT);
    CREATE TABLE workbooks(id TEXT,module_id TEXT,title TEXT,mode TEXT,status TEXT);
    CREATE TABLE atlas_publication_versions(id TEXT,slug TEXT,title TEXT,modality TEXT,status TEXT);
    CREATE TABLE atlas_annotations(structure_name TEXT,description TEXT,publication_version_id TEXT,synonyms_json TEXT,status TEXT);
    CREATE TABLE course_releases(slug TEXT,title TEXT,summary TEXT,level TEXT,duration_label TEXT,publisher_name TEXT,status TEXT,visibility TEXT);
    INSERT INTO cases VALUES('case-1','Pons case','Published reference','Education','published'),('case-2','Pons secret draft','Hidden','Education','draft');
    INSERT INTO courses VALUES('course-1','Pons teaching');
    INSERT INTO modules VALUES('module-1','course-1');
    INSERT INTO workbooks VALUES('book-1','module-1','Pons workbook','lecture','published'),('book-2','module-1','Pons secret workbook','lecture','draft');
    INSERT INTO atlas_publication_versions VALUES('edition-1','ct-head','Head CT','CT','published'),('edition-2','hidden-head','Private CT','CT','draft');
    INSERT INTO atlas_annotations VALUES('Pons annotation','Published label','edition-1','[]','published'),('Pons secret annotation','Hidden','edition-1','[]','draft'),('Pons hidden edition','Hidden','edition-2','[]','published');
    INSERT INTO course_releases VALUES('pons-course','Pons course','Published course','Core','10 min','Educator','published','public'),('pons-private','Pons secret course','Hidden','Core','10 min','Educator','published','private'),('pons-draft','Pons secret release','Hidden','Core','10 min','Educator','draft','public');
  `);
  const statements:Array<{sql:string;params:unknown[]}>=[];
  let schemas=0;
  const source=readFileSync(new URL('../lib/platform-governance.ts',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mocks:Record<string,unknown>={
    'cloudflare:workers':{env:{DB:{prepare:(sql:string)=>({bind:(...params:any[])=>({all:async()=>{
      statements.push({sql,params});return {results:db.prepare(sql).all(...params)};
    }})})}}},
    '@/db/bootstrap':{},
    '@/db/platform':{ensurePlatformSchema:async()=>{schemas++;}},
    '@/lib/catalog':{atlasModules:[]},
    '@/lib/domain':{},
    '@/lib/structure-learning-search':concepts,
    '@/lib/atlas-structure-search':{searchAtlasStructureLearning:concepts.searchStructureLearning},
    '@/lib/search-kind':searchKind,
  };
  const output:{searchEducation?:(q:unknown,kind?:unknown)=>Promise<Array<{kind:string;title:string;href:string;summary:string;meta:string;learningHref?:string}>>}={};
  new Function('exports','require',code)(output,(name:string)=>{assert(Object.hasOwn(mocks,name),name);return mocks[name];});
  assert(output.searchEducation);
  return {db,search:output.searchEducation,statements,schemas:()=>schemas};
}

test('unified search adds current exact concept navigation without changing published resource filters',async()=>{
  const f=fixture();
  try{
    const rows=await f.search('Ｐｏｎｓ');
    const reference=createLectureAnatomyReference('brainstem-pons');assert(reference);
    assert.deepEqual(rows[0],concepts.searchStructureLearning('Pons')[0]);
    assert(reference.kind==='head-concept-v1');
    assert.equal(rows[0].href,reference.atlasTarget);
    assert.equal(rows[0].learningHref,relatedLectureHref(reference.conceptId,reference.headRevision));
    assert.deepEqual(rows.map(r=>r.kind),['Anatomy concept','Course','Structure','Case','Workbook']);
    assert(!rows.some(r=>/secret|hidden|private/i.test(r.title+' '+r.summary)));
    assert.equal(f.statements.length,4);
    assert(f.statements.every(s=>s.params.every(p=>p==='%pons%')));
    assert(f.statements.every(s=>/status='published'/.test(s.sql)));
    assert.match(f.statements.find(s=>s.sql.includes('FROM course_releases'))!.sql,/visibility='public'/);
    // Published annotations keep their existing Atlas route; names are never guessed into concept IDs.
    assert.equal(rows.find(r=>r.kind==='Structure')?.href,'/atlas/ct-head');
    assert.equal(f.schemas(),1);
  }finally{f.db.close();}
});

test('kind is a strict URL allowlist and filtering precedes the shared cap',async()=>{
  assert.equal(searchKind.normalizeSearchQuery('  Ｐｏｎｓ  '),'Pons');
  for(const value of [undefined,null,[],['courses'],{},'Courses','unknown'])assert.equal(searchKind.parseSearchKind(value),'all');
  assert.equal(searchKind.parseSearchKind('courses'),'courses');
  assert.equal(searchKind.searchKindHref('Pons & brain', 'courses'),'/search?q=Pons+%26+brain&kind=courses');
  assert.equal(searchKind.searchKindHref('Pons', 'all'),'/search?q=Pons');
  const synthetic=[...Array.from({length:31},(_,i)=>({kind:'Atlas',title:`Atlas ${i}`})),{kind:'Course',title:'Later course'}];
  assert.deepEqual(searchKind.filterSearchKind(synthetic,'courses').slice(0,30),[{kind:'Course',title:'Later course'}]);
  assert.deepEqual(searchKind.filterSearchKind([{kind:'Anatomy concept'},{kind:'Structure'},{kind:'Atlas'}],'anatomy').map(row=>row.kind),['Anatomy concept','Structure']);
  const f=fixture();
  try{
    const anatomy=await f.search('pons','anatomy');
    assert.deepEqual(anatomy.map(row=>row.kind),['Anatomy concept','Structure']);
    assert.equal(anatomy[0].href,concepts.searchStructureLearning('Pons')[0].href);
    assert.equal(anatomy[1].href,'/atlas/ct-head');
    assert.deepEqual((await f.search('pons','courses')).map(row=>row.title),['Pons course']);
    assert.deepEqual((await f.search('pons','cases')).map(row=>row.title),['Pons case']);
    assert.deepEqual((await f.search('pons','workbooks')).map(row=>row.title),['Pons workbook']);
    assert.deepEqual(await f.search('pons',['courses']),await f.search('pons'));
    assert(f.statements.every(s=>/status='published'/.test(s.sql)));
    assert(f.statements.filter(s=>s.sql.includes('FROM course_releases')).every(s=>/visibility='public'/.test(s.sql)));
  }finally{f.db.close();}
});

test('a filtered workbook remains findable after a mixed all-result cap',async()=>{
  const f=fixture();
  try{
    for(let i=0;i<30;i++){
      f.db.prepare('INSERT INTO cases VALUES(?,?,?,?,?)').run(`case-${i+2}`,`Pons case ${i+2}`,'Reference','Education','published');
      f.db.prepare('INSERT INTO atlas_annotations VALUES(?,?,?,?,?)').run(`Pons label ${i}`,'Reference','edition-1','[]','published');
    }
    const all=await f.search('pons');
    assert.equal(all.length,30);
    assert(!all.some(row=>row.kind==='Workbook'));
    const workbooks=await f.search('pons','workbooks');
    assert.deepEqual(workbooks.map(row=>row.title),['Pons workbook']);
    assert.equal(workbooks[0].href,'/learn?workbook=book-1');
  }finally{f.db.close();}
});

test('unified search keeps the shared result cap and refuses short or non-string queries',async()=>{
  const f=fixture();
  try{
    for(const value of [undefined,null,{},[],1,'','p','%_','%p_'])assert.deepEqual(await f.search(value),[]);
    assert.equal(f.statements.length,0);
    for(let i=0;i<30;i++){
      f.db.prepare('INSERT INTO cases VALUES(?,?,?,?,?)').run('extra-'+i,'Pons case '+i,'Reference','Education','published');
      f.db.prepare('INSERT INTO workbooks VALUES(?,?,?,?,?)').run('extra-'+i,'module-1','Pons workbook '+i,'lecture','published');
      f.db.prepare('INSERT INTO atlas_annotations VALUES(?,?,?,?,?)').run('Pons label '+i,'Reference','edition-1','[]','published');
    }
    assert.equal((await f.search('pons')).length,30);
    assert.deepEqual(await f.search('x'.repeat(80)+'pons'),[]);
  }finally{f.db.close();}
});
