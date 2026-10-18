import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(resolve(site,'lib/education-platform.ts'),'utf8');
const ts=createRequire(resolve(site,'package.json'))('typescript');
const hash=value=>createHash('sha256').update(value).digest('hex');
console.log(JSON.stringify({source:'actual lib/education-platform.ts',sha256:hash(source),mode:'actual read resolvers, synthetic SQLite withdrawal post-state'}));

let db;
const env={get DB(){return{prepare(sql){return{sql,values:[],bind(...values){this.values=values;return this;},
  async first(){return db.prepare(this.sql).get(...this.values)??null;},
  async all(){return{results:db.prepare(this.sql).all(...this.values)};}};}};}};
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
new Function('module','exports','require',compiled)(module,module.exports,id=>{
  if(id==='cloudflare:workers')return{env};
  if(id==='@/db/bootstrap')return{ensureDatabase:async()=>{},ensureEducationUser:async()=>({roles:['learner'],status:'active'})};
  if(id==='@/db/platform')return{ensurePlatformSchema:async()=>{}};
  if(id==='@/lib/domain')return{sha256:async value=>hash(value)};
  return{};
});
const {getLearnerEnrolments,getInvitationCourse}=module.exports;
assert.equal(typeof getLearnerEnrolments,'function');
assert.equal(typeof getInvitationCourse,'function');
const accessSource=readFileSync(resolve(site,'lib/workbook-access.ts'),'utf8');
const accessCompiled=ts.transpileModule(accessSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const accessModule={exports:{}};
new Function('module','exports','require',accessCompiled)(accessModule,accessModule.exports,id=>{
  if(id==='cloudflare:workers')return{env};
  if(id==='@/lib/workbook-access-policy')return{hasWorkbookStaffAccess:roles=>roles.some(role=>['administrator','instructor','examiner'].includes(role))};
  throw Error(`Unexpected access dependency: ${id}`);
});
const {canAccessPublishedWorkbook}=accessModule.exports;
const code='ELV-ABCDEF123456';
const learner={userId:'learner:one'},other={userId:'learner:other'};
const plain=value=>JSON.parse(JSON.stringify(value));

function setup(){
  db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE courses(id TEXT PRIMARY KEY,code TEXT);
    CREATE TABLE course_releases(id TEXT PRIMARY KEY,course_id TEXT,organization_id TEXT,slug TEXT,title TEXT,summary TEXT,level TEXT,duration_label TEXT,outcomes_json TEXT,publisher_name TEXT,publisher_kind TEXT,visibility TEXT,access_model TEXT,price_minor INTEGER,currency TEXT,status TEXT,enrolment_open INTEGER,version INTEGER,created_by TEXT,reviewed_by TEXT,review_notes TEXT,created_at TEXT,updated_at TEXT,published_at TEXT);
    CREATE TABLE course_invitations(id TEXT PRIMARY KEY,release_id TEXT,code_hash TEXT,status TEXT,uses INTEGER,max_uses INTEGER,expires_at TEXT);
    CREATE TABLE course_release_workbooks(release_id TEXT,workbook_id TEXT,position INTEGER,required INTEGER);
    CREATE TABLE modules(id TEXT PRIMARY KEY,course_id TEXT);
    CREATE TABLE workbooks(id TEXT PRIMARY KEY,module_id TEXT,version INTEGER,status TEXT);
    CREATE TABLE enrolments(id TEXT PRIMARY KEY,user_id TEXT,course_id TEXT,status TEXT);
    CREATE TABLE workbook_assignments(id TEXT PRIMARY KEY,workbook_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE workbook_assignment_rules(assignment_id TEXT,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER);
    CREATE TABLE cohorts(id TEXT PRIMARY KEY,course_id TEXT,status TEXT);
    CREATE TABLE cohort_members(cohort_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE cohort_workbook_assignments(id TEXT PRIMARY KEY,cohort_id TEXT,workbook_id TEXT,status TEXT,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER);
    CREATE TABLE workbook_progress(workbook_id TEXT,learner_id TEXT,percent_complete INTEGER,last_activity_at TEXT);
    CREATE TABLE teaching_sessions(workbook_id TEXT,state TEXT,started_at TEXT);
    CREATE TABLE attempts(id TEXT PRIMARY KEY,assessment_version_id TEXT,state TEXT,receipt_hash TEXT);
    CREATE TABLE submissions(id TEXT PRIMARY KEY,attempt_id TEXT,evidence_hash TEXT);`);
  db.prepare('INSERT INTO courses VALUES (?,?)').run('course:one','ONE');
  db.prepare('INSERT INTO courses VALUES (?,?)').run('course:other','OTHER');
  db.prepare('INSERT INTO modules VALUES (?,?)').run('module:one','course:one');
  db.prepare('INSERT INTO modules VALUES (?,?)').run('module:other','course:other');
  const release=(id,course,org,slug)=>db.prepare('INSERT INTO course_releases VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    id,course,org,slug,`Synthetic ${slug}`,'Education-only','intro','1 hour','[]','Synthetic publisher','institution','private','invitation',0,'GBP','published',1,7,'author','reviewer','independent review','2026-10-01','2026-10-01','2026-10-01');
  release('release:one','course:one','org:one','first-course');
  release('release:other','course:other','org:other','other-course');
  db.prepare('INSERT INTO course_invitations VALUES (?,?,?,?,?,?,?)').run('invitation:one','release:one',hash(code),'active',0,1,'2099-01-01T00:00:00Z');
  for(const [id,position] of [['workbook:old',1],['workbook:next',2]]){
    db.prepare('INSERT INTO workbooks VALUES (?,?,?,?)').run(id,'module:one',4,'published');
    db.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?,?)').run('release:one',id,position,1);
    db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?)').run(`assign:${id}`,id,learner.userId,'active');
  }
  db.prepare('INSERT INTO workbooks VALUES (?,?,?,?)').run('workbook:other','module:other',2,'published');
  db.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?,?)').run('release:other','workbook:other',1,1);
  db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?)').run('assign:other','workbook:other',other.userId,'active');
  db.prepare('INSERT INTO enrolments VALUES (?,?,?,?)').run('enrol:one',learner.userId,'course:one','active');
  db.prepare('INSERT INTO enrolments VALUES (?,?,?,?)').run('enrol:other',other.userId,'course:other','active');
  db.prepare('INSERT INTO workbook_progress VALUES (?,?,?,?)').run('workbook:old',learner.userId,75,'2026-10-18T12:00:00Z');
  db.prepare('INSERT INTO workbook_progress VALUES (?,?,?,?)').run('workbook:next',learner.userId,25,'2026-10-18T10:00:00Z');
  db.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:old','live','2026-10-18T12:00:00Z');
  db.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:next','live','2026-10-18T10:00:00Z');
  db.prepare('INSERT INTO attempts VALUES (?,?,?,?)').run('attempt:submitted','assessment:old','in-progress','receipt:fixed');
  db.prepare('INSERT INTO attempts VALUES (?,?,?,?)').run('attempt:open','assessment:old','in-progress',null);
  db.prepare('INSERT INTO submissions VALUES (?,?,?)').run('submission:fixed','attempt:submitted','evidence:fixed');
  return db;
}
function protectedRows(){return plain({
  release:db.prepare("SELECT id,version,status,reviewed_by FROM course_releases WHERE id='release:one'").get(),
  bindings:db.prepare("SELECT * FROM course_release_workbooks WHERE release_id='release:one' ORDER BY position").all(),
  submissions:db.prepare('SELECT * FROM submissions').all(),
  submitted:db.prepare("SELECT * FROM attempts WHERE id='attempt:submitted'").get(),
  progress:db.prepare("SELECT * FROM workbook_progress ORDER BY workbook_id").all(),
});}
// Durable state produced by the actual repository's urgent withdrawal SQL:
// status withdrawn, active allocations revoked, live session ended; submitted
// attempt evidence retained. The repository's audit/authority batch is covered
// by its own tests and is intentionally not reconstructed in this read fixture.
function withdrawn(id){
  db.prepare("UPDATE workbooks SET status='withdrawn' WHERE id=?").run(id);
  db.prepare("UPDATE workbook_assignments SET status='revoked' WHERE workbook_id=? AND status='active'").run(id);
  db.prepare("UPDATE teaching_sessions SET state='ended' WHERE workbook_id=? AND state='live'").run(id);
  if(id==='workbook:old')db.prepare("UPDATE attempts SET state='voided' WHERE id='attempt:open'").run();
}
async function entry(){return (await getLearnerEnrolments(learner)).find(row=>row.id==='release:one');}
async function invitation(auth=learner){return getInvitationCourse(code,auth);}
function selection(row){return{first:row?.firstWorkbookId,resume:row?.resumeWorkbookId,live:row?.liveWorkbookId,started:row?.liveStartedAt,count:row?.workbookCount};}

test('published baseline selects current assigned first/resume/live workbooks and counts',async()=>{
  const local=setup();try{
    assert.deepEqual(selection(await entry()),{first:'workbook:old',resume:'workbook:old',live:'workbook:old',started:'2026-10-18T12:00:00Z',count:2});
    const invited=await invitation();
    assert.equal(invited.workbookCount,2);assert.equal(invited.firstWorkbookId,'workbook:old');assert.equal(invited.liveWorkbookId,'workbook:old');
  }finally{local.close();}
});

test('withdrawal preserves submitted evidence and independent other-institution enrolment',async()=>{
  const local=setup();try{
    const before=protectedRows();withdrawn('workbook:old');
    assert.deepEqual(protectedRows(),before);
    assert.equal(local.prepare("SELECT state FROM attempts WHERE id='attempt:open'").get().state,'voided');
    assert.equal(local.prepare("SELECT status FROM workbook_assignments WHERE id='assign:workbook:old'").get().status,'revoked');
    assert.equal(local.prepare("SELECT state FROM teaching_sessions WHERE workbook_id='workbook:old'").get().state,'ended');
    assert.deepEqual((await getLearnerEnrolments(other)).map(row=>row.id),['release:other']);
    assert.equal((await getLearnerEnrolments(learner)).some(row=>row.id==='release:other'),false);
  }finally{local.close();}
});

test('after withdrawal newer retired progress yields older published progress',async()=>{
  const local=setup();try{
    withdrawn('workbook:old');
    assert.deepEqual(selection(await entry()),{first:'workbook:next',resume:'workbook:next',live:'workbook:next',started:'2026-10-18T10:00:00Z',count:1});
  }finally{local.close();}
});

test('invitation description counts only published workbooks after withdrawal',async()=>{
  const local=setup();try{
    withdrawn('workbook:old');
    const invited=await invitation();
    assert.equal(invited.firstWorkbookId,'workbook:next');
    assert.equal(invited.liveWorkbookId,'workbook:next');
    assert.equal(invited.workbookCount,1);
  }finally{local.close();}
});

test('all withdrawn leaves no My Learning launch target',async()=>{
  const local=setup();try{
    withdrawn('workbook:old');withdrawn('workbook:next');
    assert.deepEqual(selection(await entry()),{first:null,resume:null,live:null,started:null,count:0});
  }finally{local.close();}
});

test('all withdrawn invitation describes zero published workbooks',async()=>{
  const local=setup();try{
    withdrawn('workbook:old');withdrawn('workbook:next');
    const invited=await invitation();
    assert.equal(invited.firstWorkbookId,null);
    assert.equal(invited.workbookCount,0);
  }finally{local.close();}
});

test('published cohort-only progress remains a resume candidate without a direct assignment',async()=>{
  const local=setup();try{
    withdrawn('workbook:old');
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE workbook_id='workbook:next'").run();
    local.prepare('INSERT INTO cohorts VALUES (?,?,?)').run('cohort:one','course:one','active');
    local.prepare('INSERT INTO cohort_members VALUES (?,?,?)').run('cohort:one',learner.userId,'active');
    local.prepare('INSERT INTO cohort_workbook_assignments VALUES (?,?,?,?,?,?,?,?)').run('cohort-allocation:next','cohort:one','workbook:next','active',null,null,null,0);
    assert.equal(await canAccessPublishedWorkbook(learner.userId,['learner'],'workbook:next'),true);
    assert.equal((await entry()).resumeWorkbookId,'workbook:next');
    assert.equal((await entry()).firstWorkbookId,null,'direct-assignment first-item semantics remain unchanged');
  }finally{local.close();}
});

test('invitation possession, release status and enrolled-user boundaries remain distinct',async()=>{
  const local=setup();try{
    assert.equal(await getInvitationCourse('ELV-000000000000',learner),null);
    assert.equal((await invitation(other)).enrolled,false);
    assert.equal((await invitation(learner)).enrolled,true);
    local.prepare("UPDATE course_invitations SET uses=max_uses WHERE id='invitation:one'").run();
    assert.equal(await invitation(),null);
    local.prepare("UPDATE course_invitations SET uses=0 WHERE id='invitation:one'").run();
    local.prepare("UPDATE course_releases SET status='draft' WHERE id='release:one'").run();
    assert.equal(await invitation(),null);
    assert.equal((await getLearnerEnrolments(learner)).length,0);
  }finally{local.close();}
});

test('invitation self-enrolment hold remains a separate closed policy',()=>{
  const policy=readFileSync(resolve(site,'lib/course-enrolment-policy.ts'),'utf8');
  const compiledPolicy=ts.transpileModule(policy,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const scope={exports:{}};new Function('module','exports',compiledPolicy)(scope,scope.exports);
  assert.equal(scope.exports.INVITATION_SELF_ENROLMENT_ENABLED,false);
});
