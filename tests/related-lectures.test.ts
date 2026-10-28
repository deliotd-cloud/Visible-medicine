/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {DatabaseSync, type SQLInputValue} from 'node:sqlite';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

import * as anatomy from '../lib/lecture-anatomy-reference.ts';
import * as collection from '../lib/lecture-anatomy-collection.ts';
import * as lectureBody from '../lib/lecture-body-reference.ts';
import * as atlasNavigation from '../lib/head-atlas-navigation.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as structureGuides from '../lib/head-structure-guides.ts';
import * as lectureContent from '../lib/lecture-content.ts';
import * as lectureManifest from '../lib/lecture-manifest.ts';
import * as workbookAccessPolicy from '../lib/workbook-access-policy.ts';
import * as relatedLinks from '../lib/lecture-related-links.ts';
import * as tour from '../lib/lecture-tour-context.ts';
import * as navigation from '../lib/lecture-slide-navigation.ts';
import * as searchKind from '../lib/search-kind.ts';

const requireNode=createRequire(import.meta.url);
const conceptId='brainstem-pons';
const pin=anatomy.createLectureAnatomyReference(conceptId);
assert(pin);
const request={conceptId,headRevision:pin.headRevision,offset:0};
const learner={userId:'learner-1',displayName:'Learner'};
const staff={userId:'staff-1',displayName:'Educator'};
const foreign={userId:'foreign-1',displayName:'Other educator'};
const identifier=(number:number)=>`workbook:related-${String(number).padStart(2,'0')}`;
const hash='a'.repeat(64);

function compile(path:string,mocks:Record<string,unknown>,jsx=false){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:jsx?ts.JsxEmit.ReactJSX:undefined}}).outputText;
  const module={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>name.endsWith('.css')?{}:name in mocks?mocks[name]:name==='@/lib/head-structure-guides'?structureGuides:requireNode(name),module,module.exports);
  return module.exports;
}

class D1Adapter{
  readonly statements:Array<{sql:string;params:SQLInputValue[]}>=[];
  readonly sqlite:DatabaseSync;
  constructor(sqlite:DatabaseSync){this.sqlite=sqlite;}
  prepare(sql:string){
    const statement=this.sqlite.prepare(sql);
    const execute=(params:SQLInputValue[])=>({
      first:async<T>()=>(statement.get(...params) as T|undefined)??null,
      all:async<T>()=>({results:statement.all(...params) as T[]}),
    });
    return {bind:(...params:SQLInputValue[])=>{
      this.statements.push({sql,params});
      return execute(params);
    },...execute([])};
  }
}

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`
    CREATE TABLE workbooks(id TEXT PRIMARY KEY,module_id TEXT,title TEXT,mode TEXT,version INTEGER,status TEXT);
    CREATE TABLE modules(id TEXT PRIMARY KEY,course_id TEXT);
    CREATE TABLE courses(id TEXT PRIMARY KEY,title TEXT);
    CREATE TABLE course_ownership(course_id TEXT,organization_id TEXT);
    CREATE TABLE workbook_authorship(workbook_id TEXT,author_id TEXT);
    CREATE TABLE lecture_versions(id TEXT PRIMARY KEY,workbook_id TEXT,version INTEGER,integrity_hash TEXT,manifest_json TEXT,published_at TEXT);
    CREATE TABLE workbook_assignments(id TEXT PRIMARY KEY,workbook_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE workbook_assignment_rules(assignment_id TEXT PRIMARY KEY,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER);
    CREATE TABLE workbook_progress(workbook_id TEXT,learner_id TEXT,percent_complete INTEGER);
    CREATE TABLE enrolments(course_id TEXT,user_id TEXT,status TEXT);
    CREATE TABLE cohorts(id TEXT PRIMARY KEY,course_id TEXT,status TEXT);
    CREATE TABLE cohort_members(cohort_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE cohort_workbook_assignments(id TEXT PRIMARY KEY,cohort_id TEXT,workbook_id TEXT,status TEXT,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER);
    INSERT INTO courses VALUES ('course-1','Teaching'),('course-foreign','Foreign');
    INSERT INTO modules VALUES ('module-1','course-1'),('module-foreign','course-foreign');
    INSERT INTO course_ownership VALUES ('course-1','org-1'),('course-foreign','org-foreign');
    INSERT INTO enrolments VALUES ('course-1','learner-1','active');
    INSERT INTO cohorts VALUES ('cohort-1','course-1','active');
    INSERT INTO cohort_members VALUES ('cohort-1','learner-1','active');
  `);
  const db=new D1Adapter(sqlite);
  function add(number:number,options:{assignment?:'direct'|'cohort'|'none';module?:string;manifest?:string;status?:string;version?:number}={}){
    const id=identifier(number),version=options.version??2;
    sqlite.prepare('INSERT INTO workbooks VALUES (?,?,?,?,?,?)').run(id,options.module??'module-1',`SECRET TITLE ${number}`,'lecture',version,options.status??'published');
    sqlite.prepare('INSERT INTO workbook_authorship VALUES (?,?)').run(id,'staff-1');
    const manifest=options.manifest??JSON.stringify({slides:[{id:'first',anatomyReference:pin}]});
    sqlite.prepare('INSERT INTO lecture_versions VALUES (?,?,?,?,?,?)').run(`version-${number}`,id,version,`SECRET HASH ${number}`,manifest,'2026-10-11T00:00:00Z');
    if(options.assignment==='direct')sqlite.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?)').run(`assignment-${number}`,id,learner.userId,'active');
    if(options.assignment==='cohort')sqlite.prepare('INSERT INTO cohort_workbook_assignments VALUES (?,?,?,?,?,?,?,?)').run(`cohort-assignment-${number}`,'cohort-1',id,'active',null,null,null,null);
    return id;
  }
  const calls:string[]=[];
  const errors=new Map<string,unknown>();
  const publications=new Map<string,any>();
  class LectureError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
  const getPublishedLecture=async(auth:{userId:string},id:string)=>{
    calls.push(`${auth.userId}:${id}`);
    if(errors.has(id))throw errors.get(id);
    if(auth.userId===learner.userId){
      const direct=sqlite.prepare("SELECT id FROM workbook_assignments WHERE workbook_id=? AND learner_id=? AND status='active'").get(id,auth.userId);
      const cohort=sqlite.prepare("SELECT id FROM cohort_workbook_assignments WHERE workbook_id=? AND status='active'").get(id);
      if(!direct&&!cohort)throw new LectureError('not assigned',403);
    }
    return publications.get(id)??{manifest:{workbook:{id,title:`Verified title ${id}`,version:2},slides:[
      {id:'first',title:'First',anatomyReference:pin},
      {id:'other',title:'Other'},
      {id:'second',title:'Second',anatomyReference:pin},
    ]},integrityHash:hash};
  };
  const repository=compile('../lib/lecture-related-repository.ts',{
    'cloudflare:workers':{env:{DB:db}},
    '@/db/bootstrap':{ensureEducationUser:async(auth:{userId:string})=>({roles:auth.userId===staff.userId||auth.userId===foreign.userId?['instructor']:['learner']})},
    '@/db/platform':{getPlatformSnapshot:async(auth:{userId:string})=>({organization:{id:auth.userId===foreign.userId?'org-foreign':'org-1'},entitlement:{studioAccess:true}})},
    '@/lib/lecture-repository':{getPublishedLecture,LectureError},
    './lecture-repository.ts':{getPublishedLecture,LectureError},
    './lecture-related-links.ts':relatedLinks,
    '@/lib/lecture-related-links':relatedLinks,
    '@/lib/lecture-tour-context':tour,
    '@/lib/head-atlas-navigation':atlasNavigation,
    '@/lib/head-atlas-learning':learning,
    './lecture-anatomy-reference.ts':anatomy,
    './lecture-anatomy-collection.ts':collection,
    './lecture-body-reference.ts':lectureBody,
    '@/lib/lecture-anatomy-reference':anatomy,
    './lecture-slide-navigation.ts':navigation,
    '@/lib/lecture-slide-navigation':navigation,
  });
  return {sqlite,db,add,calls,errors,publications,LectureError,repository};
}

function verifiedRepository(h:ReturnType<typeof fixture>,studioAccess=true){
  const workers={'cloudflare:workers':{env:{DB:h.db}}};
  const bootstrap={'@/db/bootstrap':{
    ensureEducationUser:async(auth:{userId:string})=>({roles:auth.userId===staff.userId||auth.userId===foreign.userId?['instructor']:['learner']}),
    appendAudit:async()=>{},
  }};
  const platform={'@/db/platform':{getPlatformSnapshot:async(auth:{userId:string})=>({
    organization:{id:auth.userId===foreign.userId?'org-foreign':'org-1'},
    entitlement:{studioAccess,atlasAccess:false},
  })}};
  const eligibility=compile('../lib/workbook-eligibility.ts',{'@/lib/workbook-access-policy':workbookAccessPolicy});
  const workbookAccess=compile('../lib/workbook-access.ts',{
    ...workers,'@/lib/workbook-access-policy':workbookAccessPolicy,'@/lib/workbook-eligibility':eligibility,
  });
  const publishedRepository=compile('../lib/lecture-repository.ts',{
    ...workers,...bootstrap,...platform,
    '@/lib/workbook-access':workbookAccess,
    '@/lib/lecture-content':lectureContent,
    '@/lib/lecture-manifest':lectureManifest,
    './lecture-anatomy-reference.ts':anatomy,
    './lecture-anatomy-collection.ts':collection,
    './lecture-body-reference.ts':lectureBody,
  });
  return compile('../lib/lecture-related-repository.ts',{
    ...workers,...bootstrap,...platform,
    '@/lib/lecture-repository':publishedRepository,
    '@/lib/lecture-anatomy-reference':anatomy,
    './lecture-anatomy-collection.ts':collection,
    '@/lib/lecture-slide-navigation':navigation,
    '@/lib/lecture-related-links':relatedLinks,
  });
}

async function saveVerifiedPublication(h:ReturnType<typeof fixture>,number:number,tamper=false){
  const id=identifier(number);
  const record=await lectureManifest.createLectureManifestRecord({
    schema:'visible-medicine-lecture-v1',product:'Visible Medicine',intendedPurpose:'education-only',
    workbook:{id,title:`Verified lecture ${number}`,mode:'lecture',version:2},
    slides:[{id:'linked',title:`Verified slide ${number}`,body:'Educational context.',referenceUrl:'https://example.edu/reference',anatomyReference:pin}],
  });
  h.sqlite.prepare('UPDATE lecture_versions SET integrity_hash=?,manifest_json=? WHERE workbook_id=?')
    .run(tamper?'0'.repeat(64):record.integrityHash,record.manifestJson,id);
  return record;
}

test('request parser requires one exact current source and bounded group offset',()=>{
  assert.deepEqual(relatedLinks.parseRelatedLectureRequest({concept:conceptId,headRevision:pin.headRevision}),request);
  assert.deepEqual(relatedLinks.parseRelatedLectureRequest({concept:conceptId,headRevision:pin.headRevision,offset:'16'}),{...request,offset:16});
  for(const params of [
    {concept:[conceptId,conceptId],headRevision:pin.headRevision},
    {concept:conceptId,headRevision:[pin.headRevision]},
    {concept:conceptId,headRevision:hash},
    {concept:conceptId,headRevision:pin.headRevision,offset:'01'},
    {concept:conceptId,headRevision:pin.headRevision,offset:'17'},
    {concept:conceptId,headRevision:pin.headRevision,offset:'1000016'},
    {concept:'foreign',headRevision:pin.headRevision},
  ])assert.equal(relatedLinks.parseRelatedLectureRequest(params),null);
});

test('discovery queries coarse IDs only and verifies every disclosed slide against current pin',async()=>{
  const h=fixture();
  h.add(1,{assignment:'direct'});
  h.add(2,{assignment:'cohort'});
  h.add(3,{assignment:'none'});
  h.add(4,{assignment:'direct',module:'module-foreign'});
  h.add(5,{assignment:'direct',manifest:'{ malformed json'});
  h.add(6,{assignment:'direct',manifest:JSON.stringify({slides:[{id:'x',anatomyReference:{...pin,headRevision:hash}}]})});
  h.add(7,{assignment:'direct',manifest:JSON.stringify({slides:['brainstem-pons',null,3,{anatomyReference:'brainstem-pons'}]})});
  h.add(8,{assignment:'direct',manifest:JSON.stringify({slides:'brainstem-pons'})});
  const result=await h.repository.getRelatedPublishedLectures(learner,request);
  assert.deepEqual(result.items.map((item:any)=>item.workbookId),[identifier(1),identifier(2)]);
  assert.deepEqual(result.items[0].slides.map((slide:any)=>[slide.id,slide.title,slide.href]),[
    ['first','First',`/learn/lectures/${encodeURIComponent(identifier(1))}?lectureSlide=first&lectureRevision=${hash}`],
    ['second','Second',`/learn/lectures/${encodeURIComponent(identifier(1))}?lectureSlide=second&lectureRevision=${hash}`],
  ]);
  assert.equal(result.nextOffset,null);
  assert(h.calls.includes(`${learner.userId}:${identifier(1)}`));
  assert(h.calls.includes(`${learner.userId}:${identifier(2)}`));
  assert(!h.calls.includes(`${learner.userId}:${identifier(4)}`));
  assert(!h.calls.includes(`${learner.userId}:${identifier(5)}`));
  assert(!h.calls.includes(`${learner.userId}:${identifier(6)}`));
  assert(!h.calls.includes(`${learner.userId}:${identifier(7)}`));
  assert(!h.calls.includes(`${learner.userId}:${identifier(8)}`));
  assert(h.db.statements.length>0);
  for(const {sql,params} of h.db.statements){
    assert.match(sql,/\?/);
    assert.doesNotMatch(sql,/SELECT\s+(?:\*|(?:[a-z]+\.)?(?:title|integrity_hash|manifest_json)\b)/i);
    assert(!sql.includes(learner.userId));
    assert(!sql.includes(conceptId));
    assert(params.includes(learner.userId)||params.includes(conceptId));
  }
  assert.doesNotMatch(JSON.stringify(result),/SECRET TITLE|SECRET HASH|malformed json/);
  h.sqlite.close();
});

test('publication refusal, changed pin and unexpected failures remain isolated',async()=>{
  const h=fixture();
  for(let n=1;n<=8;n++)h.add(n,{assignment:'direct'});
  for(const [number,status] of [[2,403],[3,404],[4,409],[5,422]] as const)h.errors.set(identifier(number),new h.LectureError('hidden',status));
  h.publications.set(identifier(6),{manifest:{workbook:{id:identifier(6),title:'Stale',version:2},slides:[{id:'stale',title:'Stale',anatomyReference:{...pin,headRevision:hash}}]},integrityHash:hash});
  h.publications.set(identifier(7),{manifest:{workbook:{id:identifier(7),title:'Other',version:2},slides:[{id:'other',title:'Other',anatomyReference:anatomy.createLectureAnatomyReference('brainstem-midbrain')}]},integrityHash:hash});
  const result=await h.repository.getRelatedPublishedLectures(learner,request);
  assert.deepEqual(result.items.map((item:any)=>item.workbookId),[identifier(1),identifier(8)]);
  assert.doesNotMatch(JSON.stringify(result),/hidden|Stale|Other/);
  h.errors.set(identifier(1),new Error('database failed'));
  await assert.rejects(()=>h.repository.getRelatedPublishedLectures(learner,request),/database failed/);
  h.sqlite.close();
});

test('groups use candidate offsets and disclose only current verified publications',async()=>{
  const h=fixture();
  for(let n=1;n<=18;n++)h.add(n,{assignment:'direct'});
  h.errors.set(identifier(2),new h.LectureError('denied',403));
  const first=await h.repository.getRelatedPublishedLectures(learner,request);
  assert.equal(first.items.length,15);
  assert.equal(first.nextOffset,16);
  const second=await h.repository.getRelatedPublishedLectures(learner,{...request,offset:16});
  assert.deepEqual(second.items.map((item:any)=>item.workbookId),[identifier(17),identifier(18)]);
  assert.equal(second.nextOffset,null);
  h.sqlite.close();
});

test('staff discovery stays inside its own studio organization',async()=>{
  const h=fixture();
  h.add(1,{assignment:'none'});
  h.add(2,{assignment:'none',module:'module-foreign'});
  const own=await h.repository.getRelatedPublishedLectures(staff,request);
  assert.deepEqual(own.items.map((item:any)=>item.workbookId),[identifier(1)]);
  const other=await h.repository.getRelatedPublishedLectures(foreign,request);
  assert.deepEqual(other.items.map((item:any)=>item.workbookId),[identifier(2)]);
  h.sqlite.close();
});

test('real publication guard composes allocation windows, prerequisites, ownership and canonical integrity',async()=>{
  const h=fixture();
  for(let n=1;n<=10;n++){
    h.add(n,{assignment:n===4||n===5||n===10?'cohort':n===7?'none':'direct',module:n===7?'module-foreign':undefined});
    await saveVerifiedPublication(h,n,n===8);
  }
  h.sqlite.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)')
    .run('assignment-2',null,'2020-01-01T00:00:00.000Z',null,null);
  h.sqlite.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)')
    .run('assignment-3',null,null,'unmet-prerequisite',80);
  h.sqlite.prepare('UPDATE cohort_workbook_assignments SET expires_at=? WHERE id=?')
    .run('2020-01-01T00:00:00.000Z','cohort-assignment-5');
  h.sqlite.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)')
    .run('assignment-9','2099-01-01T00:00:00.000Z',null,null,null);
  h.sqlite.prepare('UPDATE cohort_workbook_assignments SET available_from=? WHERE id=?')
    .run('2099-01-01T00:00:00.000Z','cohort-assignment-10');
  const repository=verifiedRepository(h);
  const visible=await repository.getRelatedPublishedLectures(learner,request);
  assert.deepEqual(visible.items.map((item:any)=>item.workbookId),[identifier(1),identifier(4),identifier(6)]);
  assert.equal(visible.items[0].title,'Verified lecture 1');
  assert.match(visible.items[0].slides[0].href,/lectureSlide=linked&lectureRevision=[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(visible),/Verified lecture [23578]|SECRET TITLE|SECRET HASH/);

  const own=await repository.getRelatedPublishedLectures(staff,request);
  assert(own.items.some((item:any)=>item.workbookId===identifier(1)));
  assert(!own.items.some((item:any)=>item.workbookId===identifier(7)));
  assert(!own.items.some((item:any)=>item.workbookId===identifier(8)));
  const foreignOwn=await repository.getRelatedPublishedLectures(foreign,request);
  assert.deepEqual(foreignOwn.items.map((item:any)=>item.workbookId),[identifier(7)]);
  assert.deepEqual(await verifiedRepository(h,false).getRelatedPublishedLectures(staff,request),{items:[],nextOffset:null});

  h.sqlite.prepare("UPDATE enrolments SET status='withdrawn' WHERE course_id='course-1' AND user_id=?").run(learner.userId);
  const withdrawn=await repository.getRelatedPublishedLectures(learner,request);
  assert.deepEqual(withdrawn,{items:[],nextOffset:null});
  h.sqlite.close();
});

test('invalid or stale direct service requests cause no database work',async()=>{
  const h=fixture();
  for(const invalid of [{...request,headRevision:hash},{...request,offset:1},{...request,conceptId:'foreign'}]){
    const result=await h.repository.getRelatedPublishedLectures(learner,invalid);
    assert.deepEqual(result,{items:[],nextOffset:null});
  }
  assert.equal(h.db.statements.length,0);
  assert.equal(h.calls.length,0);
  h.sqlite.close();
});

test('image-only anatomy retains exact slide discovery without inventing a 3D target',async()=>{
  const h=fixture();
  const imagePin=anatomy.createLectureAnatomyReference('cerebellum-left-hemisphere');
  assert(imagePin&&imagePin.kind==='head-image-concept-v1');
  const id=h.add(1,{assignment:'direct',manifest:JSON.stringify({slides:[{id:'image',anatomyReference:imagePin}]})});
  h.publications.set(id,{manifest:{workbook:{id,title:'Image-only teaching',version:2},slides:[{id:'image',title:'Left cerebellar hemisphere',anatomyReference:imagePin}]},integrityHash:hash});
  const source={conceptId:imagePin.conceptId,headRevision:imagePin.headRevision,offset:0};
  const result=await h.repository.getRelatedPublishedLectures(learner,source);
  assert.equal(result.items.length,1);
  assert.match(result.items[0].slides[0].href,/lectureSlide=image&lectureRevision=/);
  assert.equal(relatedLinks.relatedLectureConcept(source)?.atlasHref,undefined);
  h.sqlite.close();
});

test('related page authenticates first, keeps exact source and renders verified local lecture links',async()=>{
  const calls:string[]=[];
  const Link=({href,children}:any)=>React.createElement('a',{href},children);
  const page=compile('../app/learn/related-anatomy/page.tsx',{
    'next/link':Link,
    '@/components/SiteFrame':{WorkspaceContextBar:()=>React.createElement('div')},
    '../../chatgpt-auth':{requireChatGPTUser:async(path:string)=>{calls.push(`auth:${path}`);return learner;}},
    '@/lib/lecture-related-links':relatedLinks,
    '@/lib/lecture-tour-context':tour,
    '@/lib/head-atlas-navigation':atlasNavigation,
    '@/lib/head-atlas-learning':learning,
    '@/lib/lecture-related-repository':{getRelatedPublishedLectures:async()=>{calls.push('query');return {items:[{workbookId:identifier(1),title:'Verified',version:2,slides:[{id:'first',title:'First',href:`/learn/lectures/${encodeURIComponent(identifier(1))}?lectureSlide=first&lectureRevision=${hash}`}]}],nextOffset:null};}},
  },true).default;
  const html=renderToStaticMarkup(await page({searchParams:Promise.resolve({concept:conceptId,headRevision:pin.headRevision,offset:'0'})}));
  assert.match(calls[0],new RegExp(`^auth:/learn/related-anatomy\\?concept=${conceptId}&headRevision=${pin.headRevision}`));
  assert.deepEqual(calls.slice(1),['query']);
  assert.match(html,/Verified/);
  assert.match(html,/lectureSlide=first/);
  assert.doesNotMatch(html,/https?:\/\//);
});

test('related page refuses invalid source before database lookup, including duplicate and stale values',async()=>{
  const calls:string[]=[];
  const signIn=new Error('sign in');
  const dependencies={
    'next/link':({href,children}:any)=>React.createElement('a',{href},children),
    '@/components/SiteFrame':{WorkspaceContextBar:()=>React.createElement('div')},
    '@/lib/lecture-related-links':relatedLinks,
    '@/lib/lecture-tour-context':tour,
    '@/lib/head-atlas-navigation':atlasNavigation,
    '@/lib/head-atlas-learning':learning,
    '@/lib/lecture-related-repository':{getRelatedPublishedLectures:async()=>{calls.push('query');return {items:[],nextOffset:null};}},
  };
  const page=compile('../app/learn/related-anatomy/page.tsx',{
    ...dependencies,
    '../../chatgpt-auth':{requireChatGPTUser:async(path:string)=>{calls.push(`auth:${path}`);return learner;}},
  },true).default;
  for(const params of [
    {concept:[conceptId,conceptId],headRevision:pin.headRevision},
    {concept:conceptId,headRevision:hash},
    {concept:conceptId,headRevision:pin.headRevision,offset:'17'},
  ]){
    const before=calls.length;
    const html=renderToStaticMarkup(await page({searchParams:Promise.resolve(params)}));
    assert.match(html,/unavailable|invalid|current|return|CT|MRI|3D/i);
    assert(calls[before]?.startsWith('auth:/learn/related-anatomy'));
  }
  assert.equal(calls.filter(call=>call==='query').length,0);
  const denied=compile('../app/learn/related-anatomy/page.tsx',{
    ...dependencies,
    '../../chatgpt-auth':{requireChatGPTUser:async(path:string)=>{calls.push(`denied:${path}`);throw signIn;}},
  },true).default;
  await assert.rejects(()=>denied({searchParams:Promise.resolve({concept:conceptId,headRevision:pin.headRevision})}),(error:unknown)=>error===signIn);
  assert.equal(calls.filter(call=>call==='query').length,0);
  assert(calls.at(-1)?.startsWith(`denied:/learn/related-anatomy?concept=${conceptId}&headRevision=${pin.headRevision}`));
});

test('related page distinguishes an empty candidate group from a service failure without leaking metadata',async()=>{
  const Link=({href,children}:any)=>React.createElement('a',{href},children);
  const common={
    'next/link':Link,
    '../../chatgpt-auth':{requireChatGPTUser:async()=>learner},
    '@/lib/lecture-related-links':relatedLinks,
    '@/lib/lecture-tour-context':tour,
    '@/lib/head-atlas-navigation':atlasNavigation,
    '@/lib/head-atlas-learning':learning,
  };
  const props={searchParams:Promise.resolve({concept:conceptId,headRevision:pin.headRevision})};
  const empty=compile('../app/learn/related-anatomy/page.tsx',{
    ...common,
    '@/lib/lecture-related-repository':{getRelatedPublishedLectures:async()=>({items:[],nextOffset:null})},
  },true).default;
  const emptyHtml=renderToStaticMarkup(await empty(props));
  assert.match(emptyHtml,/No lecture slides to show/);
  assert.match(emptyHtml,/CT anatomy|MRI anatomy|3D anatomy/);
  const failed=compile('../app/learn/related-anatomy/page.tsx',{
    ...common,
    '@/lib/lecture-related-repository':{getRelatedPublishedLectures:async()=>{throw new Error('SECRET TITLE; FOREIGN HASH');}},
  },true).default;
  const failedHtml=renderToStaticMarkup(await failed(props));
  assert.match(failedHtml,/could not be loaded/);
  assert.match(failedHtml,/Try again/);
  assert.match(failedHtml,/CT anatomy|MRI anatomy|3D anatomy/);
  assert.doesNotMatch(failedHtml,/SECRET TITLE|FOREIGN HASH/);
});

function structurePage(result:unknown={items:[],nextOffset:null}){
  return compile('../app/learn/related-anatomy/page.tsx',{
    'next/link':({children,prefetch:_,...props}:any)=>React.createElement('a',props,children),
    '../../chatgpt-auth':{requireChatGPTUser:async()=>learner},
    '@/lib/lecture-related-links':relatedLinks,
    '@/lib/lecture-tour-context':tour,
    '@/lib/head-atlas-navigation':atlasNavigation,
    '@/lib/head-atlas-learning':learning,
    '@/lib/lecture-related-repository':{getRelatedPublishedLectures:async()=>result},
  },true).default;
}

test('structure learning presents the existing source-bound anatomy views before lectures and collapses provenance',async()=>{
  const html=renderToStaticMarkup(await structurePage()({searchParams:Promise.resolve({concept:conceptId,headRevision:pin.headRevision})}));
  assert(html.indexOf('Start with the structure')<html.indexOf('Learn this in context'));
  assert.match(html,/nav class="structure-view-list" aria-label="Anatomy reference views"/);
  assert.equal((html.match(/class="structure-view-link"/g)??[]).length,3);
  assert.equal((html.match(/data-primary="true"/g)??[]).length,1);
  const c=relatedLinks.relatedLectureConcept(request);assert(c?.atlasHref);
  for(const href of [c.atlasHref,atlasNavigation.headImageHref('CT',conceptId,null,pin.headRevision),atlasNavigation.headImageHref('MRI',conceptId,null,pin.headRevision)]){
    assert(href);assert(html.includes(href.replaceAll('&','&amp;')));
  }
  assert.match(html,/<details class="structure-learning-provenance"><summary>Source &amp; access/);
  assert.doesNotMatch(html,/<details[^>]*open|class="learning-aside"|data-state="(?:reviewed|locked)"/);
  assert.match(html,/A working link is not clinical approval/);
  assert.match(html,/No lecture slides to show/);
  assert.match(html,new RegExp(pin.headRevision));
});

test('an image-only structure gets only its mapped views, with its exact source limits',async()=>{
  const imagePin=anatomy.createLectureAnatomyReference('cerebellum-vermis');assert(imagePin);
  const html=renderToStaticMarkup(await structurePage()({searchParams:Promise.resolve({concept:imagePin.conceptId,headRevision:imagePin.headRevision})}));
  assert.equal((html.match(/class="structure-view-link"/g)??[]).length,2);
  assert.doesNotMatch(html,/href="\/atlas\/head-neck-3d/);
  assert.match(html,/partial coverage/);
  assert.match(html,/No exact matching 3D part/);
});

test('invalid anatomy links offer a neutral manual Atlas exit without substituting a current structure',async()=>{
  const html=renderToStaticMarkup(await structurePage()({searchParams:Promise.resolve({concept:conceptId,headRevision:hash})}));
  assert.match(html,/Structure link unavailable/);
  assert.match(html,/href="\/atlas">Choose a structure in the Atlas/);
  assert.doesNotMatch(html,/structure-view-link|headRevision=|lectureSlide=/);
});

test('related guided learning stays collapsed and renders only exact registered step links',async()=>{
  for(const id of [conceptId,'limbic-left-amygdala','bone-left-parietal','cerebellum-vermis']){
    const reference=anatomy.createLectureAnatomyReference(id);assert(reference);
    const guides=structureGuides.headStructureGuides(id,reference.headRevision);assert(guides.length);
    const html=renderToStaticMarkup(await structurePage()({searchParams:Promise.resolve({concept:id,headRevision:reference.headRevision})}));
    const section=html.match(/<details class="structure-learning-guides">([\s\S]*?)<\/details>/)?.[1];assert(section);
    assert(section.startsWith('<summary>Guided learning · Draft</summary>'));
    assert.doesNotMatch(html,/<details[^>]*open/);
    assert.equal((section.match(/<li>/g)??[]).length,guides.length);
    assert.equal((section.match(/<a /g)??[]).length,guides.reduce((sum,guide)=>sum+guide.views.length,0));
    for(const guide of guides){
      assert(section.includes(`<strong>${guide.label}</strong><span>Step ${guide.step} of ${guide.total}</span>`));
      for(const view of guide.views){
        assert(section.includes(`href="${view.href.replaceAll('&','&amp;')}"`));
        assert(section.includes(`aria-label="${view.label}: ${guide.label}, step ${guide.step} of ${guide.total}"`));
      }
    }
    assert.match(section,/availability and access separately/);
    assert.match(section,/do not record progress or align scans/);
    assert.doesNotMatch(section,/autoplay|target=|iframe|data-primary/);
    assert(html.indexOf('structure-learning-guides')<html.indexOf('Learn this in context'));
  }
});

test('invalid or repeated source values cannot reveal a guided-learning entry',async()=>{
  for(const params of [
    {concept:conceptId,headRevision:hash},
    {concept:[conceptId,conceptId],headRevision:pin.headRevision},
    {concept:conceptId,headRevision:[pin.headRevision,pin.headRevision]},
    {concept:'unknown',headRevision:pin.headRevision},
  ]){
    const html=renderToStaticMarkup(await structurePage()({searchParams:Promise.resolve(params)}));
    assert.match(html,/Structure link unavailable/);
    assert.doesNotMatch(html,/structure-learning-guides|headTour=|headStep=|headRevision=/);
  }
});

test('public search accepts a single bounded query and skips repository work for empty, short or duplicate parameters',async()=>{
  const calls:string[]=[];
  let secondary='/learn/related-anatomy?concept=brainstem-pons&headRevision='+pin.headRevision;
  let availability:'complete'|'partial'='complete',includeRow=true;
  const page=compile('../app/search/page.tsx',{
    '@/lib/search-kind':searchKind,
    'next/link':({children,...props}:any)=>React.createElement('a',props,children),
    '@/lib/public-education-search':{searchPublicEducation:async(q:string)=>{calls.push(q);return {availability,results:includeRow?[{kind:'Anatomy concept',title:'Pons',summary:'Reference anatomy',href:'/atlas/head-neck-3d?concept=brainstem-pons',learningHref:secondary,meta:'Source-bound concept'}]:[]};}},
  },true).default;
  for(const q of [undefined,'','p',['pons','pons']]){
    const html=renderToStaticMarkup(await page({searchParams:Promise.resolve({q})}));
    assert.match(html,/Choose your next learning step/);
  }
  assert.equal(calls.length,0);
  const html=renderToStaticMarkup(await page({searchParams:Promise.resolve({q:'  Ｐｏｎｓ  '})}));
  assert.deepEqual(calls,['Pons']);assert.match(html,/Explore structure/);assert.match(html,/<span>1 result<\/span>/);
  assert.match(html,/href="\/atlas\/head-neck-3d\?concept=brainstem-pons"/);
  assert.match(html,/class="search-related-link"[^>]+href="\/learn\/related-anatomy\?concept=brainstem-pons/);
  assert.match(html,/Related teaching →/);
  for(const refused of ['/learn/related-anatomy-other?concept=brainstem-pons','//foreign.invalid/learn/related-anatomy?x=1','https://foreign.invalid/learn/related-anatomy?x=1']){
    secondary=refused;
    const refusedHtml=renderToStaticMarkup(await page({searchParams:Promise.resolve({q:'Pons'})}));
    assert.doesNotMatch(refusedHtml,/class="search-related-link"/);
    assert.match(refusedHtml,/href="\/atlas\/head-neck-3d\?concept=brainstem-pons"/);
  }
  availability='partial';secondary='/learn/related-anatomy?concept=brainstem-pons&headRevision='+pin.headRevision;
  const partialRows=renderToStaticMarkup(await page({searchParams:Promise.resolve({q:'Pons'})}));
  assert.match(partialRows,/Some results are temporarily unavailable/);
  assert.match(partialRows,/Explore structure/);
  includeRow=false;
  const partialEmpty=renderToStaticMarkup(await page({searchParams:Promise.resolve({q:'Pons',kind:'courses'})}));
  assert.match(partialEmpty,/temporarily unavailable/);
  assert.doesNotMatch(partialEmpty,/No courses matched/);
  availability='complete';
  const completeEmpty=renderToStaticMarkup(await page({searchParams:Promise.resolve({q:'Pons',kind:'courses'})}));
  assert.match(completeEmpty,/No courses matched/);
  assert.match(html,/maxLength="80"/i);assert.doesNotMatch(html,/Searches reviewed Atlas structures/);
  assert.match(html,/Publication is not clinical approval/);
  await page({searchParams:Promise.resolve({q:'p'.repeat(100)})});assert.equal(calls.at(-1)?.length,80);
});
