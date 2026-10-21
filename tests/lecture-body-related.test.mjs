import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const candidate=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const website=process.env.VM_WEBSITE_ROOT??(existsSync(resolve(candidate,'package.json'))?candidate:undefined);
if(!website||!existsSync(resolve(website,'package.json')))
  throw new Error('Install under website/tests or set VM_WEBSITE_ROOT');
const requireWebsite=createRequire(resolve(website,'package.json'));
const esbuild=requireWebsite('esbuild');
const slash=value=>value.replaceAll('\\','/');
const entry=`export * from '${slash(resolve(candidate,'lib/lecture-body-related-links.ts'))}';
export {getRelatedPublishedBodyLectures} from '${slash(resolve(candidate,'lib/lecture-body-related-repository.ts'))}';
export {createLectureBodyReference} from '${slash(resolve(candidate,'lib/lecture-body-reference.ts'))}';
export {createLectureManifestRecord,parseAndVerifyLectureManifest} from '${slash(resolve(website,'lib/lecture-manifest.ts'))}';`;
const bundle=await esbuild.build({stdin:{contents:entry,resolveDir:website,sourcefile:'lecture-body-related-overlay.ts'},
  absWorkingDir:website,alias:{'@':website},bundle:true,platform:'node',format:'cjs',write:false,
  plugins:[{name:'body-related-overlay',setup(build){
    build.onResolve({filter:/^(?:cloudflare:workers|@\/db\/bootstrap|@\/db\/platform|@\/lib\/lecture-repository)$/},
      args=>({path:args.path,external:true}));
    build.onResolve({filter:/^\.\/lecture-content\.ts$/},args=>args.importer.endsWith('lecture-manifest.ts')
      ?{path:resolve(candidate,'lib/lecture-content.ts')}:undefined);
    build.onResolve({filter:/^\.\/lecture-anatomy-(?:reference|collection)\.ts$/},args=>
      args.importer.includes(candidate)&&!args.importer.includes(website)
        ?{path:resolve(website,'lib',args.path.slice(2))}:undefined);
    build.onResolve({filter:/^\.\.\/public\/atlas-runtime\/head-neck\/manifest\.json$/},()=>({
      path:resolve(website,'public/atlas-runtime/head-neck/manifest.json'),
    }));
  }}]});
const compiled=bundle.outputFiles[0].text;
const user={userId:'learner-1',displayName:'Learner'};
const staff={userId:'staff-1',displayName:'Educator'};
const foreign={userId:'foreign-1',displayName:'Other educator'};
const checksum='a'.repeat(64);
class LectureError extends Error{constructor(message,status=400){super(message);this.status=status;}}
class D1Adapter{
  statements=[];
  constructor(sqlite){this.sqlite=sqlite;}
  prepare(sql){
    const prepared=this.sqlite.prepare(sql);
    return {bind:(...params)=>{
      this.statements.push({sql,params});
      return {all:async()=>({results:prepared.all(...params)}),first:async()=>prepared.get(...params)??null};
    }};
  }
}
function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(`
    CREATE TABLE workbooks(id TEXT PRIMARY KEY,module_id TEXT,title TEXT,mode TEXT,version INTEGER,status TEXT);
    CREATE TABLE modules(id TEXT PRIMARY KEY,course_id TEXT);
    CREATE TABLE course_ownership(course_id TEXT,organization_id TEXT);
    CREATE TABLE lecture_versions(id TEXT PRIMARY KEY,workbook_id TEXT,version INTEGER,integrity_hash TEXT,manifest_json TEXT,published_at TEXT);
    CREATE TABLE workbook_assignments(id TEXT PRIMARY KEY,workbook_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE enrolments(course_id TEXT,user_id TEXT,status TEXT);
    CREATE TABLE cohorts(id TEXT PRIMARY KEY,course_id TEXT,status TEXT);
    CREATE TABLE cohort_members(cohort_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE cohort_workbook_assignments(id TEXT PRIMARY KEY,cohort_id TEXT,workbook_id TEXT,status TEXT);
    INSERT INTO modules VALUES ('module-1','course-1'),('module-foreign','course-foreign');
    INSERT INTO course_ownership VALUES ('course-1','org-1'),('course-foreign','org-foreign');
    INSERT INTO enrolments VALUES ('course-1','learner-1','active');
    INSERT INTO cohorts VALUES ('cohort-1','course-1','active');
    INSERT INTO cohort_members VALUES ('cohort-1','learner-1','active');
  `);
  const db=new D1Adapter(sqlite),calls=[],denied=new Set(),errors=new Map();
  let api;
  const getPublishedLecture=async(auth,id)=>{
    calls.push(`${auth.userId}:${id}`);
    if(errors.has(id))throw errors.get(id);
    const row=sqlite.prepare(`SELECT w.id,w.module_id,w.version,w.status,lv.manifest_json,lv.integrity_hash
      FROM workbooks w JOIN lecture_versions lv ON lv.workbook_id=w.id AND lv.version=w.version WHERE w.id=?`).get(id);
    if(!row||row.status!=='published')throw new LectureError('unpublished',404);
    const course=sqlite.prepare('SELECT course_id FROM modules WHERE id=?').get(row.module_id)?.course_id;
    const owns=auth.userId===staff.userId&&course==='course-1'||auth.userId===foreign.userId&&course==='course-foreign';
    const enrolled=sqlite.prepare("SELECT 1 FROM enrolments WHERE course_id=? AND user_id=? AND status='active'").get(course,auth.userId);
    const direct=sqlite.prepare("SELECT 1 FROM workbook_assignments WHERE workbook_id=? AND learner_id=? AND status='active'").get(id,auth.userId);
    const cohort=sqlite.prepare(`SELECT 1 FROM cohort_workbook_assignments ca JOIN cohorts c ON c.id=ca.cohort_id
      JOIN cohort_members cm ON cm.cohort_id=c.id WHERE ca.workbook_id=? AND ca.status='active'
      AND c.status='active' AND cm.learner_id=? AND cm.status='active' AND c.course_id=?`).get(id,auth.userId,course);
    if(denied.has(id)||!(owns||(enrolled&&(direct||cohort))))throw new LectureError('final access denied',403);
    let manifest;
    try{manifest=await api.parseAndVerifyLectureManifest(row.manifest_json,row.integrity_hash);}
    catch{throw new LectureError('publication invalid',409);}
    if(manifest.workbook.id!==id||manifest.workbook.version!==row.version)
      throw new LectureError('edition mismatch',409);
    return {manifest,integrityHash:row.integrity_hash};
  };
  const mocks={
    'cloudflare:workers':{env:{DB:db}},
    '@/db/bootstrap':{ensureEducationUser:async(auth)=>({roles:auth.userId===staff.userId||auth.userId===foreign.userId?['instructor']:['learner']})},
    '@/db/platform':{getPlatformSnapshot:async(auth)=>({organization:{id:auth.userId===foreign.userId?'org-foreign':'org-1'},entitlement:{studioAccess:true}})},
    '@/lib/lecture-repository':{getPublishedLecture,LectureError},
  };
  const module={exports:{}};
  new Function('require','module','exports',compiled)(name=>mocks[name]??requireWebsite(name),module,module.exports);
  api=module.exports;
  const pin=api.createLectureBodyReference('vm:anatomy:body:leg:right:tendon:right-calcaneal-tendon');
  assert(pin);
  async function add(number,{assignment='direct',moduleId='module-1',status='published',version=2,
    pinValue=pin,rawManifest=null,hashOverride=null,slideTitle=null}={}){
    const id=`workbook:body-${String(number).padStart(2,'0')}`;
    const record=await api.createLectureManifestRecord({schema:'visible-medicine-lecture-v1',product:'Visible Medicine',
      intendedPurpose:'education-only',workbook:{id,title:`VERIFIED title ${number}`,mode:'lecture',version},
      slides:[{id:'linked',title:slideTitle??`VERIFIED slide ${number}`,body:'Education only.',referenceUrl:'',bodyAnatomyReferences:[pinValue]}]});
    sqlite.prepare('INSERT INTO workbooks VALUES (?,?,?,?,?,?)').run(id,moduleId,`SECRET DB TITLE ${number}`,'lecture',version,status);
    sqlite.prepare('INSERT INTO lecture_versions VALUES (?,?,?,?,?,?)').run(`version-${number}`,id,version,
      hashOverride??record.integrityHash,rawManifest??record.manifestJson,'2026-10-21T00:00:00Z');
    if(assignment==='direct')sqlite.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?)').run(`direct-${number}`,id,user.userId,'active');
    if(assignment==='cohort')sqlite.prepare('INSERT INTO cohort_workbook_assignments VALUES (?,?,?,?)').run(`cohort-${number}`,'cohort-1',id,'active');
    return id;
  }
  return {api,sqlite,db,calls,denied,errors,pin,add};
}

test('body request parser requires every current source field and bounded aligned offset',()=>{
  const h=fixture(),{api,pin}=h;
  const params=Object.fromEntries(new URL(api.bodyRelatedLectureHref(pin),'https://invalid.example').searchParams);
  assert.deepEqual(api.parseBodyRelatedLectureRequest(params),{reference:pin,offset:0});
  assert.deepEqual(api.parseBodyRelatedLectureRequest({...params,offset:'16'}),{reference:pin,offset:16});
  for(const bad of [
    {...params,structure:[pin.structureId,pin.structureId]},
    {...params,region:[pin.region]}, {...params,side:[pin.side]},
    {...params,source:[pin.sourceSha256]}, {...params,atlasRevision:[pin.atlasRevision]},
    {...params,source:'0'.repeat(64)}, {...params,atlasRevision:'0'.repeat(40)},
    {...params,region:'thorax'}, {...params,side:pin.side==='right'?'left':'right'},
    {...params,offset:['16']},{...params,offset:'01'},{...params,offset:'1'},
    {...params,offset:'1000008'}, {...params,offset:'-16'},
  ])assert.equal(api.parseBodyRelatedLectureRequest(bad),null,JSON.stringify(bad));
  assert.equal(api.bodyRelatedLectureHref({...pin,atlasTarget:'https://evil.invalid'}),null);
  assert.equal(api.bodyRelatedLectureHref(pin,17),null);
  h.sqlite.close();
});
test('body SQL retains the existing coarse allocation scope exactly',()=>{
  const old=readFileSync(resolve(website,'lib/lecture-related-repository.ts'),'utf8');
  const body=readFileSync(resolve(candidate,'lib/lecture-body-related-repository.ts'),'utf8');
  const scope=source=>source.match(/AND \(\s*EXISTS\(SELECT 1 FROM workbook_assignments[\s\S]*?\n\s*\)\s*AND EXISTS\(SELECT 1 FROM json_each/)
    ?.[0].replace(/\s+/g,' ').replace(/ AND EXISTS\(SELECT 1 FROM json_each$/,'');
  assert(scope(old));assert.equal(scope(body),scope(old));
});
test('coarse SQLite candidates are IDs; final gate controls direct, cohort and owner disclosure',async()=>{
  const h=fixture(),{api,pin}=h,request={reference:pin,offset:0};
  const direct=await h.add(1),cohort=await h.add(2,{assignment:'cohort'});
  const noAccess=await h.add(3,{assignment:'none'});
  const denied=await h.add(4);h.denied.add(denied);
  const foreignOwned=await h.add(5,{assignment:'none',moduleId:'module-foreign'});
  const learner=await api.getRelatedPublishedBodyLectures(user,request);
  assert.deepEqual(learner.items.map(item=>item.workbookId),[direct,cohort]);
  assert(learner.items.every(item=>item.title.startsWith('VERIFIED title')));
  assert(learner.items.every(item=>item.slides[0].href.includes('lectureRevision=')));
  assert(!JSON.stringify(learner).includes('SECRET DB TITLE'));
  assert(!h.calls.some(call=>call.endsWith(noAccess)||call.endsWith(foreignOwned)));
  assert(h.calls.some(call=>call.endsWith(denied)));
  const own=await api.getRelatedPublishedBodyLectures(staff,request);
  assert(own.items.some(item=>item.workbookId===noAccess));
  assert(!own.items.some(item=>item.workbookId===foreignOwned));
  const other=await api.getRelatedPublishedBodyLectures(foreign,request);
  assert.deepEqual(other.items.map(item=>item.workbookId),[foreignOwned]);
  h.sqlite.close();
});
test('stale, malformed and forged body pins or outdated editions never become linked slides',async()=>{
  const h=fixture(),{api,pin}=h,request={reference:pin,offset:0};
  const good=await h.add(1);
  await h.add(2,{pinValue:{...pin,atlasTarget:'/atlas/3d?forged=1'}});
  await h.add(3,{pinValue:{...pin,atlasRevision:'0'.repeat(40)}});
  await h.add(4,{pinValue:{...pin,sourceSha256:'0'.repeat(64)}});
  const corrupt=await h.add(5);
  h.sqlite.prepare('UPDATE lecture_versions SET manifest_json=? WHERE workbook_id=?').run('{not-json',corrupt);
  const wrongHash=await h.add(6,{hashOverride:'0'.repeat(64)});
  const oldEdition=await h.add(7);
  h.sqlite.prepare('UPDATE workbooks SET version=version+1 WHERE id=?').run(oldEdition);
  const unpublished=await h.add(8,{status:'approved'});
  const malformedPin=await h.add(9);
  const stored=h.sqlite.prepare('SELECT manifest_json FROM lecture_versions WHERE workbook_id=?').get(malformedPin);
  const malformed=JSON.parse(stored.manifest_json);
  delete malformed.slides[0].bodyAnatomyReferences[0].atlasTarget;
  h.sqlite.prepare('UPDATE lecture_versions SET manifest_json=? WHERE workbook_id=?').run(JSON.stringify(malformed),malformedPin);
  const result=await api.getRelatedPublishedBodyLectures(user,request);
  assert.deepEqual(result.items.map(item=>item.workbookId),[good]);
  assert(!JSON.stringify(result).includes('SECRET'));
  assert(h.calls.some(call=>call.endsWith(wrongHash)));
  assert(h.calls.some(call=>call.endsWith(malformedPin)));
  assert(!h.calls.some(call=>call.endsWith(oldEdition)||call.endsWith(unpublished)));
  h.sqlite.close();
});
test('offset 16 pages candidate IDs, and invalid direct service request avoids DB work',async()=>{
  const h=fixture(),{api,pin}=h;
  for(let i=1;i<=18;i++)await h.add(i);
  const first=await api.getRelatedPublishedBodyLectures(user,{reference:pin,offset:0});
  const second=await api.getRelatedPublishedBodyLectures(user,{reference:pin,offset:16});
  assert.equal(first.items.length,16);assert.equal(first.nextOffset,16);
  assert.equal(second.items.length,2);assert.equal(second.nextOffset,null);
  assert.notEqual(first.items[0].workbookId,second.items[0].workbookId);
  const count=h.db.statements.length;
  assert.deepEqual(await api.getRelatedPublishedBodyLectures(user,{reference:{...pin,atlasRevision:'0'.repeat(40)},offset:0}),{items:[],nextOffset:null});
  assert.equal(h.db.statements.length,count);
  h.sqlite.close();
});
test('expected access refusals are omitted while unexpected final-gate failures propagate',async()=>{
  const h=fixture(),{api,pin}=h;
  const hidden=await h.add(1),good=await h.add(2);
  h.errors.set(hidden,new LectureError('window expired',403));
  let result=await api.getRelatedPublishedBodyLectures(user,{reference:pin,offset:0});
  assert.deepEqual(result.items.map(item=>item.workbookId),[good]);
  h.errors.set(hidden,new Error('database unavailable'));
  await assert.rejects(()=>api.getRelatedPublishedBodyLectures(user,{reference:pin,offset:0}),/database unavailable/);
  h.sqlite.close();
});
