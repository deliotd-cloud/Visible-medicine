import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=fileURLToPath(new URL('../',import.meta.url));
const stage=site;
const require=createRequire(resolve(site,'package.json'));
const ts=require('typescript');
const source=readFileSync(resolve(stage,'lib/education-platform.ts'),'utf8');
const accessSource=readFileSync(resolve(stage,'lib/workbook-access.ts'),'utf8');
const helperSource=readFileSync(resolve(stage,'lib/workbook-eligibility.ts'),'utf8');
const oracleSource=readFileSync(resolve(stage,'tests/fixtures/course-resume-before-20261018/workbook-access.ts.raw'),'utf8');
const oraclePlatformSource=readFileSync(resolve(stage,'tests/fixtures/course-resume-before-20261018/education-platform.ts.raw'),'utf8');
const policySource=readFileSync(resolve(site,'lib/workbook-access-policy.ts'),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
assert.equal(sha(oracleSource),'c00dabb4f7abce38ad68bc9934d092eb2f76594000abc0f2b92d020776906162','frozen pre-change access oracle');
assert.equal(sha(oraclePlatformSource),'cf830daca1d2671368d1cf07770964fae493c9625d1ad36f546d0230de21e1ef','frozen pre-change enrolment oracle');
console.log(JSON.stringify({resolverSha256:sha(source),accessSha256:sha(accessSource),helperSha256:sha(helperSource),oracleSha256:sha(oracleSource),oracleResolverSha256:sha(oraclePlatformSource),mode:'actual exported SQL; shared synthetic SQLite fixture'}));

let db,queries=0,observed=[];
const env={get DB(){return{prepare(sql){queries++;const call={sql,values:[]};observed.push(call);return{sql,values:[],bind(...values){this.values=values;call.values=values;return this;},
  async first(){return db.prepare(this.sql).get(...this.values)??null;},
  async all(){return{results:db.prepare(this.sql).all(...this.values)};}};}};}};
function compile(source,imports){
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('module','exports','require',code)(module,module.exports,id=>{
    if(Object.hasOwn(imports,id))return imports[id];
    return{};
  });
  return module.exports;
}
const policy=compile(policySource,{});
const eligibility=compile(helperSource,{'@/lib/workbook-access-policy':policy});
const access=compile(accessSource,{'cloudflare:workers':{env},'@/lib/workbook-access-policy':policy,'@/lib/workbook-eligibility':eligibility});
const oracle=compile(oracleSource,{'cloudflare:workers':{env},'@/lib/workbook-access-policy':policy});
const staffUsers=new Set();
const bootstrap={'@/db/bootstrap':{ensureEducationUser:async auth=>({roles:staffUsers.has(auth.userId)?['instructor']:['learner']})},'@/db/platform':{ensurePlatformSchema:async()=>{}}};
const platform=compile(source,{'cloudflare:workers':{env},...bootstrap,'@/lib/workbook-eligibility':eligibility});
const oraclePlatform=compile(oraclePlatformSource,{'cloudflare:workers':{env},...bootstrap});
const {canAccessPublishedWorkbook}=access;
const {getLearnerEnrolments}=platform;
assert.equal(typeof canAccessPublishedWorkbook,'function');
assert.equal(typeof getLearnerEnrolments,'function');
assert.equal(accessSource.slice(accessSource.indexOf('export async function canAccessPublishedCase')),oracleSource.slice(oracleSource.indexOf('export async function canAccessPublishedCase')),'case access remains byte-exact');
const learner={userId:'learner:one'},other={userId:'learner:other'};

function setup(){
  staffUsers.clear();
  db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE course_releases(id TEXT PRIMARY KEY,course_id TEXT,status TEXT,slug TEXT,title TEXT,summary TEXT,level TEXT,duration_label TEXT,publisher_name TEXT);
    CREATE TABLE modules(id TEXT PRIMARY KEY,course_id TEXT);
    CREATE TABLE workbooks(id TEXT PRIMARY KEY,module_id TEXT,status TEXT);
    CREATE TABLE course_release_workbooks(release_id TEXT,workbook_id TEXT,position INTEGER);
    CREATE TABLE enrolments(id TEXT PRIMARY KEY,user_id TEXT,course_id TEXT,status TEXT);
    CREATE TABLE workbook_assignments(id TEXT PRIMARY KEY,workbook_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE workbook_assignment_rules(assignment_id TEXT,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER);
    CREATE TABLE workbook_progress(workbook_id TEXT,learner_id TEXT,percent_complete INTEGER,last_activity_at TEXT);
    CREATE TABLE cohorts(id TEXT PRIMARY KEY,course_id TEXT,status TEXT);
    CREATE TABLE cohort_members(cohort_id TEXT,learner_id TEXT,status TEXT);
    CREATE TABLE cohort_workbook_assignments(id TEXT PRIMARY KEY,cohort_id TEXT,workbook_id TEXT,status TEXT,available_from TEXT,expires_at TEXT,prerequisite_workbook_id TEXT,prerequisite_min_percent INTEGER);
    CREATE TABLE teaching_sessions(workbook_id TEXT,state TEXT,started_at TEXT);
    CREATE TABLE attempts(id TEXT PRIMARY KEY,receipt_hash TEXT);
    CREATE TABLE submissions(id TEXT PRIMARY KEY,attempt_id TEXT,evidence_hash TEXT);`);
  db.prepare('INSERT INTO course_releases VALUES (?,?,?,?,?,?,?,?,?)').run('release:one','course:one','published','course-one','Synthetic course','Education only','intro','1 hour','Synthetic publisher');
  db.prepare('INSERT INTO course_releases VALUES (?,?,?,?,?,?,?,?,?)').run('release:other','course:other','published','course-other','Other synthetic course','Education only','intro','1 hour','Other publisher');
  for(const [id,course] of [['module:one','course:one'],['module:other','course:other']])db.prepare('INSERT INTO modules VALUES (?,?)').run(id,course);
  for(const [id,module] of [['workbook:newer','module:one'],['workbook:older','module:one'],['workbook:prereq','module:one'],['workbook:other','module:other']])db.prepare('INSERT INTO workbooks VALUES (?,?,?)').run(id,module,'published');
  for(const [release,id,position] of [['release:one','workbook:newer',1],['release:one','workbook:older',2],['release:other','workbook:other',1]])db.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?)').run(release,id,position);
  for(const [id,user,course] of [['enrol:one',learner.userId,'course:one'],['enrol:other',other.userId,'course:other']])db.prepare('INSERT INTO enrolments VALUES (?,?,?,?)').run(id,user,course,'active');
  for(const [id,workbook,user] of [['assign:newer','workbook:newer',learner.userId],['assign:older','workbook:older',learner.userId],['assign:other','workbook:other',other.userId]])db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?)').run(id,workbook,user,'active');
  for(const [workbook,user,percent,at] of [
    ['workbook:newer',learner.userId,85,'2026-10-18T12:00:00Z'],
    ['workbook:older',learner.userId,45,'2026-10-18T10:00:00Z'],
    ['workbook:prereq',learner.userId,20,'2026-10-18T09:00:00Z'],
    ['workbook:newer',other.userId,100,'2026-10-18T15:00:00Z'],
    ['workbook:other',other.userId,10,'2026-10-18T14:00:00Z'],
  ])db.prepare('INSERT INTO workbook_progress VALUES (?,?,?,?)').run(workbook,user,percent,at);
  db.prepare('INSERT INTO attempts VALUES (?,?)').run('attempt:submitted','receipt:fixed');
  db.prepare('INSERT INTO submissions VALUES (?,?,?)').run('submission:fixed','attempt:submitted','evidence:fixed');
  return db;
}
function evidence(){return JSON.parse(JSON.stringify({
  progress:db.prepare('SELECT * FROM workbook_progress ORDER BY workbook_id,learner_id').all(),
  attempts:db.prepare('SELECT * FROM attempts').all(),
  submissions:db.prepare('SELECT * FROM submissions').all(),
  release:db.prepare('SELECT * FROM course_releases ORDER BY id').all(),
  bindings:db.prepare('SELECT * FROM course_release_workbooks ORDER BY release_id,position').all(),
}));}
async function entry(auth=learner){return(await getLearnerEnrolments(auth)).find(row=>row.id==='release:one');}
async function allowed(workbook,auth=learner,roles=['learner']){
  const previous=await oracle.canAccessPublishedWorkbook(auth.userId,roles,workbook);
  const current=await canAccessPublishedWorkbook(auth.userId,roles,workbook);
  assert.equal(current,previous,`oracle access decision for ${auth.userId}/${workbook}/${roles.join(',')}`);
  return current;
}
function selection(row){return{first:row?.firstWorkbookId,resume:row?.resumeWorkbookId};}
function cohort(status='active'){
  db.prepare('INSERT INTO cohorts VALUES (?,?,?)').run('cohort:one','course:one','active');
  db.prepare('INSERT INTO cohort_members VALUES (?,?,?)').run('cohort:one',learner.userId,'active');
  db.prepare('INSERT INTO cohort_workbook_assignments VALUES (?,?,?,?,?,?,?,?)').run('cohort-allocation:newer','cohort:one','workbook:newer',status,null,null,null,0);
}

test('baseline published direct allocations choose the latest accessible progress without evidence writes',async()=>{
  const local=setup();try{
    const before=evidence();
    assert.equal(await allowed('workbook:newer'),true);assert.equal(await allowed('workbook:older'),true);
    assert.deepEqual(selection(await entry()),{first:'workbook:newer',resume:'workbook:newer'});
    assert.deepEqual(evidence(),before);
  }finally{local.close();}
});

for(const [name,change] of [
  ['revoked',db=>db.prepare("UPDATE workbook_assignments SET status='revoked' WHERE id='assign:newer'").run()],
  ['expired',db=>db.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)').run('assign:newer',null,'2020-01-01T00:00:00Z',null,0)],
  ['not yet available',db=>db.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)').run('assign:newer','2099-01-01T00:00:00Z',null,null,0)],
  ['prerequisite unmet',db=>db.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)').run('assign:newer',null,null,'workbook:prereq',90)],
])test(`${name} newer progress must not override older currently accessible workbook`,async()=>{
  const local=setup();try{
    change(local);const before=evidence();
    assert.equal(await allowed('workbook:newer'),false);
    assert.equal(await allowed('workbook:older'),true);
    const result=await entry();
    assert.deepEqual(evidence(),before);
    assert.deepEqual(selection(result),{first:'workbook:older',resume:'workbook:older'});
  }finally{local.close();}
});

test('valid cohort-only grant keeps newer published progress accessible',async()=>{
  const local=setup();try{
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE id='assign:newer'").run();cohort();
    const before=evidence();
    assert.equal(await allowed('workbook:newer'),true);
    const result=await entry();
    assert.deepEqual(selection(result),{first:'workbook:newer',resume:'workbook:newer'});
    assert.equal(result.workbookCount,1,'descriptive direct-allocation count remains unchanged');
    assert.equal(result.progress,45,'descriptive direct-allocation progress remains unchanged');
    assert.deepEqual(evidence(),before);
  }finally{local.close();}
});

test('revoked cohort-only grant cannot make newer progress a launch target',async()=>{
  const local=setup();try{
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE id='assign:newer'").run();cohort('revoked');
    const before=evidence();
    assert.equal(await allowed('workbook:newer'),false);
    assert.equal(await allowed('workbook:older'),true);
    const result=await entry();
    assert.deepEqual(evidence(),before);
    assert.deepEqual(selection(result),{first:'workbook:older',resume:'workbook:older'});
  }finally{local.close();}
});

test('same user and course boundaries exclude unrelated later progress and grant',async()=>{
  const local=setup();try{
    const before=evidence();
    assert.deepEqual((await getLearnerEnrolments(learner)).map(row=>row.id),['release:one']);
    assert.deepEqual((await getLearnerEnrolments(other)).map(row=>row.id),['release:other']);
    assert.equal(await allowed('workbook:other'),false);
    assert.equal(await allowed('workbook:other',other),true);
    assert.equal((await entry()).resumeWorkbookId,'workbook:newer');
    assert.deepEqual(evidence(),before);
  }finally{local.close();}
});

test('a valid cohort-only workbook is the first launch item even without saved progress',async()=>{
  const local=setup();try{
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE id='assign:newer'").run();cohort();
    local.prepare('DELETE FROM workbook_progress WHERE learner_id=?').run(learner.userId);
    const before=evidence();
    assert.equal(await allowed('workbook:newer'),true);
    const result=await entry();
    assert.deepEqual(selection(result),{first:'workbook:newer',resume:null});
    assert.deepEqual(evidence(),before);
  }finally{local.close();}
});

test('live workbook and start time pair on the same eligible older session',async()=>{
  const local=setup();try{
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:newer','live','2026-10-18T12:00:00Z');
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:older','live','2026-10-18T10:00:00Z');
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE id='assign:newer'").run();
    const before=evidence();
    const result=await entry();
    assert.equal(result.liveWorkbookId,'workbook:older');
    assert.equal(result.liveStartedAt,'2026-10-18T10:00:00Z');
    assert.deepEqual(evidence(),before);
  }finally{local.close();}
});

for(const [name,change,expected] of [
  ['cohort active',()=>{},true],
  ['cohort member revoked',db=>db.prepare("UPDATE cohort_members SET status='revoked'").run(),false],
  ['cohort suspended',db=>db.prepare("UPDATE cohorts SET status='suspended'").run(),false],
  ['cohort future',db=>db.prepare("UPDATE cohort_workbook_assignments SET available_from='2099-01-01T00:00:00Z'").run(),false],
  ['cohort expired',db=>db.prepare("UPDATE cohort_workbook_assignments SET expires_at='2020-01-01T00:00:00Z'").run(),false],
  ['cohort prerequisite unmet',db=>db.prepare("UPDATE cohort_workbook_assignments SET prerequisite_workbook_id='workbook:prereq',prerequisite_min_percent=21").run(),false],
  ['cohort prerequisite threshold met',db=>db.prepare("UPDATE cohort_workbook_assignments SET prerequisite_workbook_id='workbook:prereq',prerequisite_min_percent=20").run(),true],
])test(`fixed-hash access oracle agrees: ${name}`,async()=>{
  const local=setup();try{
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE id='assign:newer'").run();cohort();change(local);
    assert.equal(await allowed('workbook:newer'),expected);
  }finally{local.close();}
});

test('staff publication decision remains oracle-exact',async()=>{
  const local=setup();try{
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE id='assign:newer'").run();
    assert.equal(await allowed('workbook:newer',learner,['instructor']),true);
    local.prepare("UPDATE workbooks SET status='archived' WHERE id='workbook:newer'").run();
    assert.equal(await allowed('workbook:newer',learner,['instructor']),false);
    assert.equal(await allowed('workbook:newer',learner,['learner']),false);
  }finally{local.close();}
});

test('eligibility branch follows the unchanged staff-role policy exactly',()=>{
  for(const role of ['administrator','instructor','examiner']){
    assert.equal(policy.hasWorkbookStaffAccess([role]),true);
    const selection=eligibility.publishedWorkbookEligibilityForRoles(learner.userId,[role],'2026-10-18T12:00:00Z');
    assert.match(selection.sql,/SELECT id AS workbook_id FROM workbooks WHERE status='published'/);
    assert.deepEqual(selection.bindings,[]);
  }
  for(const role of ['learner','observer']){
    assert.equal(policy.hasWorkbookStaffAccess([role]),false);
    const selection=eligibility.publishedWorkbookEligibilityForRoles(learner.userId,[role],'2026-10-18T12:00:00Z');
    assert.equal(selection.sql,eligibility.learnerEligiblePublishedWorkbooksSql);
    assert.equal(selection.bindings.length,6);
  }
});

test('inactive course enrolment denies direct and cohort access in both implementations',async()=>{
  const local=setup();try{
    cohort();
    local.prepare("UPDATE enrolments SET status='suspended' WHERE id='enrol:one'").run();
    assert.equal(await allowed('workbook:newer'),false);
    assert.equal(await allowed('workbook:older'),false);
    assert.deepEqual(await getLearnerEnrolments(learner),[]);
  }finally{local.close();}
});

test('authenticated enrolled staff retain first, saved resume and live launch without allocations',async()=>{
  const local=setup();try{
    staffUsers.add(learner.userId);
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE learner_id=?").run(learner.userId);
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:newer','live','2026-10-18T12:00:00Z');
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:older','live','2026-10-18T10:00:00Z');
    const before=evidence();
    assert.equal(await allowed('workbook:newer',learner,['instructor']),true);
    const previous=(await oraclePlatform.getLearnerEnrolments(learner))[0];
    assert.deepEqual({resume:previous.resumeWorkbookId,live:previous.liveWorkbookId,started:previous.liveStartedAt},{resume:'workbook:newer',live:'workbook:newer',started:'2026-10-18T12:00:00Z'});
    queries=0;observed=[];
    const current=await entry();
    assert.equal(queries,1);
    assert.deepEqual({first:current.firstWorkbookId,resume:current.resumeWorkbookId,live:current.liveWorkbookId,started:current.liveStartedAt},{first:'workbook:newer',resume:'workbook:newer',live:'workbook:newer',started:'2026-10-18T12:00:00Z'});
    assert.equal(observed[0].values.length,1,'staff eligibility has no learner-allocation parameters');
    assert.equal(current.workbookCount,0,'descriptive direct-allocation count stays unchanged');
    assert.deepEqual(evidence(),before);
  }finally{local.close();}
});

test('staff branch never launches an unpublished workbook despite saved progress or live state',async()=>{
  const local=setup();try{
    staffUsers.add(learner.userId);
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE learner_id=?").run(learner.userId);
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:newer','live','2026-10-18T12:00:00Z');
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:older','live','2026-10-18T10:00:00Z');
    local.prepare("UPDATE workbooks SET status='withdrawn' WHERE id='workbook:newer'").run();
    const before=evidence();
    assert.equal(await allowed('workbook:newer',learner,['instructor']),false);
    assert.equal(await allowed('workbook:older',learner,['instructor']),true);
    const current=await entry();
    assert.deepEqual({first:current.firstWorkbookId,resume:current.resumeWorkbookId,live:current.liveWorkbookId,started:current.liveStartedAt},{first:'workbook:older',resume:'workbook:older',live:'workbook:older',started:'2026-10-18T10:00:00Z'});
    assert.deepEqual(evidence(),before);
  }finally{local.close();}
});

test('learner roles cannot inherit staff launch eligibility',async()=>{
  const local=setup();try{
    staffUsers.add(other.userId);
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE learner_id=?").run(learner.userId);
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:newer','live','2026-10-18T12:00:00Z');
    const before=evidence();
    assert.equal(await allowed('workbook:newer'),false);
    const current=await entry();
    assert.deepEqual({first:current.firstWorkbookId,resume:current.resumeWorkbookId,live:current.liveWorkbookId},{first:null,resume:null,live:null});
    assert.deepEqual(evidence(),before);
  }finally{local.close();}
});

test('staff launch stays bound to an active enrolment and its own release',async()=>{
  const local=setup();try{
    staffUsers.add(learner.userId);
    local.prepare('INSERT INTO workbook_progress VALUES (?,?,?,?)').run('workbook:other',learner.userId,99,'2099-01-01T00:00:00Z');
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:other','live','2099-01-01T00:00:00Z');
    assert.equal(await allowed('workbook:other',learner,['instructor']),true,'point staff access is global to published workbooks');
    assert.deepEqual((await getLearnerEnrolments(learner)).map(row=>row.id),['release:one']);
    assert.equal((await entry()).resumeWorkbookId,'workbook:newer');
    local.prepare("UPDATE enrolments SET status='suspended' WHERE id='enrol:one'").run();
    assert.deepEqual(await getLearnerEnrolments(learner),[]);
  }finally{local.close();}
});

test('one bound read selects an older eligible candidate beyond 120 newer denied progress rows',async()=>{
  const local=setup();try{
    local.prepare("UPDATE workbook_assignments SET status='revoked' WHERE id='assign:newer'").run();
    for(let i=0;i<120;i++){
      const id=`workbook:denied:${i}`;
      local.prepare('INSERT INTO workbooks VALUES (?,?,?)').run(id,'module:one','published');
      local.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?)').run('release:one',id,i+3);
      local.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?)').run(`assign:denied:${i}`,id,learner.userId,'revoked');
      local.prepare('INSERT INTO workbook_progress VALUES (?,?,?,?)').run(id,learner.userId,99,`2099-01-01T00:${String(i%60).padStart(2,'0')}:00Z`);
    }
    const before=evidence();queries=0;observed=[];
    const result=await entry();
    assert.equal(queries,1,'selection is one set-based read, independent of candidate count');
    assert.deepEqual(selection(result),{first:'workbook:older',resume:'workbook:older'});
    assert.deepEqual(evidence(),before);
    assert.match(observed[0].sql,/WITH eligible_workbooks AS/);
    assert.equal(observed[0].values.length,7);
    assert.deepEqual([observed[0].values[0],observed[0].values[3],observed[0].values[6]],[learner.userId,learner.userId,learner.userId]);
    assert.equal(observed[0].sql.includes(learner.userId),false,'identity remains bound, not interpolated into SQL');
  }finally{local.close();}
});
