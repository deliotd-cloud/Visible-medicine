/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {DatabaseSync,type SQLInputValue,type StatementSync} from 'node:sqlite';
import test from 'node:test';
import ts from 'typescript';

import {LECTURE_SCHEMA} from '../db/lecture.ts';
import * as anatomy from '../lib/lecture-anatomy-reference.ts';
import * as collection from '../lib/lecture-anatomy-collection.ts';
import * as lectureBody from '../lib/lecture-body-reference.ts';
import * as content from '../lib/lecture-content.ts';
import * as manifest from '../lib/lecture-manifest.ts';
import * as links from '../lib/lecture-related-links.ts';
import * as navigation from '../lib/lecture-slide-navigation.ts';
import * as accessPolicy from '../lib/workbook-access-policy.ts';

const requireNode=createRequire(import.meta.url);
const author={userId:'author-1',displayName:'Author'};
const reviewer={userId:'reviewer-1',displayName:'Reviewer'};
const learner={userId:'learner-1',displayName:'Learner'};
const foreign={userId:'foreign-1',displayName:'Foreign educator'};
const workbookId=(number:number)=>`workbook:plural-${String(number).padStart(2,'0')}`;
const slide={id:'slide-1',title:'Synthetic teaching',body:'Educational description.',referenceUrl:'https://example.edu/reference'};
const first=anatomy.createLectureAnatomyReference('brainstem-pons');
const second=anatomy.createLectureAnatomyReference('cerebellum-vermis');
assert(first&&second);
const staleSecond={...second,headRevision:'a'.repeat(64)};

function compile(path:string,mocks:Record<string,unknown>){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const module={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>name in mocks?mocks[name]:requireNode(name),module,module.exports);
  return module.exports;
}

type Bound={statement:StatementSync;parameters:SQLInputValue[]};
class D1Adapter{
  readonly statements:Array<{sql:string;parameters:SQLInputValue[]}>=[];
  batchCount=0;
  readonly sqlite:DatabaseSync;
  constructor(sqlite:DatabaseSync){this.sqlite=sqlite;}
  prepare(sql:string){
    const statement=this.sqlite.prepare(sql);
    const bound=(parameters:SQLInputValue[])=>({
      statement,parameters,
      first:async<T>()=>(statement.get(...parameters) as T|undefined)??null,
      all:async<T>()=>({results:statement.all(...parameters) as T[]}),
      run:async()=>({meta:{changes:Number(statement.run(...parameters).changes)}}),
    });
    return {
      bind:(...parameters:SQLInputValue[])=>{this.statements.push({sql,parameters});return bound(parameters);},
      ...bound([]),
    };
  }
  async batch(statements:Bound[]){
    this.batchCount++;
    this.sqlite.exec('BEGIN IMMEDIATE');
    try{
      const results=statements.map(({statement,parameters})=>({meta:{changes:Number(statement.run(...parameters).changes)}}));
      this.sqlite.exec('COMMIT');
      return results;
    }catch(error){this.sqlite.exec('ROLLBACK');throw error;}
  }
}

function harness(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT);
    CREATE TABLE courses(id TEXT PRIMARY KEY,title TEXT);
    CREATE TABLE modules(id TEXT PRIMARY KEY,course_id TEXT);
    CREATE TABLE workbooks(id TEXT PRIMARY KEY,module_id TEXT,title TEXT,mode TEXT,version INTEGER,status TEXT);
    CREATE TABLE course_ownership(course_id TEXT,organization_id TEXT);
    CREATE TABLE workbook_authorship(workbook_id TEXT,author_id TEXT);
    CREATE TABLE enrolments(course_id TEXT,user_id TEXT,status TEXT);
    CREATE TABLE workbook_assignments(id TEXT PRIMARY KEY,workbook_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE workbook_assignment_rules(assignment_id TEXT PRIMARY KEY,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER);
    CREATE TABLE workbook_progress(workbook_id TEXT,learner_id TEXT,percent_complete INTEGER);
    CREATE TABLE cohorts(id TEXT PRIMARY KEY,course_id TEXT,status TEXT);
    CREATE TABLE cohort_members(cohort_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE cohort_workbook_assignments(id TEXT PRIMARY KEY,cohort_id TEXT,workbook_id TEXT,status TEXT,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER);
    CREATE TABLE course_releases(id TEXT PRIMARY KEY,slug TEXT,status TEXT);
    CREATE TABLE course_release_workbooks(release_id TEXT,workbook_id TEXT);
    INSERT INTO courses VALUES ('course-1','Teaching'),('course-foreign','Foreign');
    INSERT INTO modules VALUES ('module-1','course-1'),('module-foreign','course-foreign');
    INSERT INTO course_ownership VALUES ('course-1','org-1'),('course-foreign','org-foreign');
    INSERT INTO enrolments VALUES ('course-1','learner-1','active');
  `);
  for(const statement of LECTURE_SCHEMA)sqlite.exec(statement);
  for(const user of [author,reviewer,learner,foreign])sqlite.prepare('INSERT INTO users VALUES (?,?)').run(user.userId,user.displayName);
  const DB=new D1Adapter(sqlite);
  const worker={'cloudflare:workers':{env:{DB}}};
  const bootstrap={'@/db/bootstrap':{
    ensureEducationUser:async(auth:{userId:string})=>({roles:auth.userId===learner.userId?['learner']:auth.userId===reviewer.userId?['examiner']:['instructor']}),
    appendAudit:async()=>{},
  }};
  const platform={'@/db/platform':{getPlatformSnapshot:async(auth:{userId:string})=>({
    organization:{id:auth.userId===foreign.userId?'org-foreign':'org-1'},
    entitlement:{studioAccess:true,atlasAccess:false},
  })}};
  const eligibility=compile('../lib/workbook-eligibility.ts',{'@/lib/workbook-access-policy':accessPolicy});
  const workbookAccess=compile('../lib/workbook-access.ts',{...worker,'@/lib/workbook-access-policy':accessPolicy,'@/lib/workbook-eligibility':eligibility});
  const repository=compile('../lib/lecture-repository.ts',{
    ...worker,...bootstrap,...platform,'@/lib/workbook-access':workbookAccess,
    '@/lib/lecture-content':content,'@/lib/lecture-manifest':manifest,
    './lecture-anatomy-reference.ts':anatomy,
    './lecture-anatomy-collection.ts':collection,
    './lecture-body-reference.ts':lectureBody,
    '@/lib/lecture-anatomy-collection':collection,
  });
  const related=compile('../lib/lecture-related-repository.ts',{
    ...worker,...bootstrap,...platform,'@/lib/lecture-repository':repository,
    '@/lib/lecture-anatomy-reference':anatomy,
    '@/lib/lecture-anatomy-collection':collection,
    './lecture-anatomy-collection.ts':collection,
    '@/lib/lecture-slide-navigation':navigation,
    '@/lib/lecture-related-links':links,
  });
  return {sqlite,DB,repository,related};
}

function addWorkbook(h:ReturnType<typeof harness>,number:number,options:{module?:string;assignment?:boolean;status?:string;slides?:unknown;rawManifest?:string}={}){
  const id=workbookId(number),module=options.module??'module-1';
  h.sqlite.prepare('INSERT INTO workbooks VALUES (?,?,?,?,?,?)').run(id,module,`Private title ${number}`,'lecture',2,options.status??'published');
  h.sqlite.prepare('INSERT INTO workbook_authorship VALUES (?,?)').run(id,author.userId);
  if(options.assignment!==false)h.sqlite.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?)').run(`assignment-${number}`,id,learner.userId,'active');
  return id;
}

async function addPublication(h:ReturnType<typeof harness>,number:number,slides:unknown,rawManifest?:string){
  const id=addWorkbook(h,number);
  const record=rawManifest===undefined?await manifest.createLectureManifestRecord({
    schema:'visible-medicine-lecture-v1',product:'Visible Medicine',intendedPurpose:'education-only',
    workbook:{id,title:`Verified lecture ${number}`,mode:'lecture',version:2},slides,
  }):null;
  const json=rawManifest??record!.manifestJson;
  const hash=record?.integrityHash??createHash('sha256').update(json).digest('hex');
  h.sqlite.prepare('INSERT INTO lecture_versions VALUES (?,?,?,?,?,?)').run(`version-${number}`,id,2,hash,json,'2026-10-16T00:00:00Z');
  return id;
}

function request(reference:NonNullable<typeof first>){return {conceptId:reference.conceptId,headRevision:reference.headRevision,offset:0};}

test('secondary plural pin discovers one slide once through real publication authority',async(t)=>{
  const h=harness();t.after(()=>h.sqlite.close());
  const id=await addPublication(h,1,[{...slide,anatomyReferences:[first,second]}]);
  const result=await h.related.getRelatedPublishedLectures(learner,request(second));
  assert.deepEqual(result.items.map((item:any)=>item.workbookId),[id]);
  assert.deepEqual(result.items[0].slides.map((item:any)=>item.id),[slide.id]);
  assert.equal(result.items[0].title,'Verified lecture 1');
  assert.match(result.items[0].slides[0].href,/lectureSlide=slide-1&lectureRevision=[a-f0-9]{64}$/);
  assert.deepEqual((await h.related.getRelatedPublishedLectures(learner,request(first))).items[0].slides.map((item:any)=>item.id),[slide.id]);
  for(const {sql,parameters} of h.DB.statements){
    if(!/SELECT w\.id\s+FROM workbooks w/.test(sql))continue;
    assert.doesNotMatch(sql,/SELECT\s+(?:\*|(?:[a-z]+\.)?(?:title|manifest_json|integrity_hash)\b)/i);
    assert(!sql.includes(second.conceptId));
    assert(parameters.includes(second.conceptId)||parameters.includes(first.conceptId));
  }
});

test('mixed fresh and stale saved pins match only exact current concepts',async(t)=>{
  const h=harness();t.after(()=>h.sqlite.close());
  const id=await addPublication(h,1,[{...slide,anatomyReferences:[first,staleSecond]}]);
  assert.deepEqual((await h.related.getRelatedPublishedLectures(learner,request(first))).items.map((item:any)=>item.workbookId),[id]);
  assert.deepEqual(await h.related.getRelatedPublishedLectures(learner,request(second)),{items:[],nextOffset:null});
  const before=h.DB.statements.length;
  assert.deepEqual(await h.related.getRelatedPublishedLectures(learner,{...request(second),headRevision:staleSecond.headRevision}),{items:[],nextOffset:null});
  assert.equal(h.DB.statements.length,before);
});

test('malformed saved plural variants are refused by actual manifest verification',async(t)=>{
  const h=harness();t.after(()=>h.sqlite.close());
  const invalidSlides:unknown[]=[
    [{...slide,anatomyReferences:'scalar'}],
    [{...slide,anatomyReferences:null}],
    [{...slide,anatomyReferences:Array(7).fill(first)}],
    [{...slide,anatomyReferences:[first,first]}],
    [{...slide,anatomyReference:first,anatomyReferences:[second]}],
  ];
  const ids:string[]=[];
  for(let index=0;index<invalidSlides.length;index++){
    const number=index+1,id=workbookId(number);
    const raw=JSON.stringify({schema:'visible-medicine-lecture-v1',product:'Visible Medicine',intendedPurpose:'education-only',
      workbook:{id,title:'Invalid synthetic lecture',mode:'lecture',version:2},slides:invalidSlides[index]});
    ids.push(await addPublication(h,number,[],raw));
  }
  ids.push(await addPublication(h,6,[],'{ malformed json'));
  for(const id of ids)await assert.rejects(()=>h.repository.getPublishedLecture(learner,id),(error:any)=>error.status===409);
  assert.deepEqual(await h.related.getRelatedPublishedLectures(learner,request(first)),{items:[],nextOffset:null});
});

test('plural discovery retains allocation, organization, expiry and prerequisite gates',async(t)=>{
  const h=harness();t.after(()=>h.sqlite.close());
  for(let number=1;number<=6;number++)await addPublication(h,number,[{...slide,anatomyReferences:[first,second]}]);
  h.sqlite.prepare('DELETE FROM workbook_assignments WHERE workbook_id=?').run(workbookId(2));
  h.sqlite.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)').run('assignment-3',null,'2020-01-01T00:00:00Z',null,null);
  h.sqlite.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)').run('assignment-4',null,null,'missing-prerequisite',80);
  h.sqlite.prepare('UPDATE workbooks SET module_id=? WHERE id=?').run('module-foreign',workbookId(5));
  h.sqlite.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)').run('assignment-6','2099-01-01T00:00:00Z',null,null,null);
  assert.deepEqual((await h.related.getRelatedPublishedLectures(learner,request(second))).items.map((item:any)=>item.workbookId),[workbookId(1)]);
  assert.deepEqual((await h.related.getRelatedPublishedLectures(author,request(second))).items.map((item:any)=>item.workbookId),
    [workbookId(1),workbookId(2),workbookId(3),workbookId(4),workbookId(6)]);
  assert.deepEqual((await h.related.getRelatedPublishedLectures(foreign,request(second))).items.map((item:any)=>item.workbookId),[workbookId(5)]);
});

test('stale second pin blocks submission, review and publication; authorized owner may reopen',async(t)=>{
  const h=harness();t.after(()=>h.sqlite.close());
  const id=addWorkbook(h,1,{status:'draft'});
  h.sqlite.prepare('INSERT INTO lecture_drafts VALUES (?,?,?,?)').run(id,'[]',null,'2026-10-16T00:00:00Z');
  const save=()=>h.repository.mutateLecture(author,id,{action:'save',id,expectedVersion:2,title:'Plural draft',slides:[{...slide,anatomyReferences:[first,second]}]});
  await save();
  const changeSecond=(reference:typeof second)=>{
    const saved=JSON.parse(String(h.sqlite.prepare('SELECT slides_json FROM lecture_drafts WHERE workbook_id=?').get(id)?.slides_json));
    saved[0].anatomyReferences[1]=reference;
    h.sqlite.prepare('UPDATE lecture_drafts SET slides_json=? WHERE workbook_id=?').run(JSON.stringify(saved),id);
  };
  changeSecond(staleSecond);
  let before=h.DB.batchCount;
  await assert.rejects(()=>h.repository.mutateLecture(author,id,{action:'request-review',id,expectedVersion:3}),(error:any)=>error.status===422);
  assert.equal(h.DB.batchCount,before);
  changeSecond(second);
  await h.repository.mutateLecture(author,id,{action:'request-review',id,expectedVersion:3});
  changeSecond(staleSecond);
  assert.equal((await h.repository.getLectureStudio(author,id)).canReopenAnatomy,true);
  assert.equal((await h.repository.getLectureStudio(reviewer,id)).canReopenAnatomy,false);
  before=h.DB.batchCount;
  await assert.rejects(()=>h.repository.mutateLecture(reviewer,id,{action:'review',id,expectedVersion:3,decision:'approved',comment:'Reviewed.'}),(error:any)=>error.status===422);
  assert.equal(h.DB.batchCount,before);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM lecture_reviews WHERE workbook_id=?').get(id)?.n,0);
  changeSecond(second);
  await h.repository.mutateLecture(reviewer,id,{action:'review',id,expectedVersion:3,decision:'approved',comment:'Reviewed.'});
  changeSecond(staleSecond);
  before=h.DB.batchCount;
  await assert.rejects(()=>h.repository.mutateLecture(author,id,{action:'publish',id,expectedVersion:3}),(error:any)=>error.status===422);
  assert.equal(h.DB.batchCount,before);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM lecture_versions WHERE workbook_id=?').get(id)?.n,0);
  await assert.rejects(()=>h.repository.mutateLecture(foreign,id,{action:'reopen-anatomy',id,expectedVersion:3}),(error:any)=>error.status===404);
  const reopened=await h.repository.mutateLecture(author,id,{action:'reopen-anatomy',id,expectedVersion:3});
  assert.equal(reopened.status,'draft');
  assert.equal(reopened.version,4);
  assert.equal(h.sqlite.prepare('SELECT review_hash FROM lecture_drafts WHERE workbook_id=?').get(id)?.review_hash,null);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM lecture_reviews WHERE workbook_id=?').get(id)?.n,1);
  await h.repository.mutateLecture(author,id,{action:'save',id,expectedVersion:4,title:'Corrected plural draft',slides:[{...slide,anatomyReferences:[first,second]}]});
  await h.repository.mutateLecture(author,id,{action:'request-review',id,expectedVersion:5});
  await h.repository.mutateLecture(reviewer,id,{action:'review',id,expectedVersion:5,decision:'approved',comment:'Fresh independent review of both exact source pins.'});
  const published=await h.repository.mutateLecture(author,id,{action:'publish',id,expectedVersion:5});
  assert.equal(published.status,'published');
  const readback=await h.repository.getPublishedLecture(learner,id);
  assert.equal(readback.manifest.workbook.version,5);
  assert.deepEqual(readback.manifest.slides[0].anatomyReferences,[first,second]);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM lecture_reviews WHERE workbook_id=?').get(id)?.n,2);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM lecture_versions WHERE workbook_id=?').get(id)?.n,1);
  assert.equal(readback.integrityHash,createHash('sha256').update(JSON.stringify(readback.manifest)).digest('hex'));
  await assert.rejects(()=>h.repository.mutateLecture(author,id,{action:'save',id,expectedVersion:5,title:'Tamper',slides:[slide]}),(error:any)=>error.status===409);
});
