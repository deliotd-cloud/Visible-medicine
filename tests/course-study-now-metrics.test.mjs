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
const sha=text=>createHash('sha256').update(text).digest('hex');
const source=readFileSync(resolve(stage,'lib/education-platform.ts'),'utf8');
const originalSource=readFileSync(resolve(stage,'tests/fixtures/course-study-now-before-20261018/education-platform.ts.raw'),'utf8');
assert.equal(sha(originalSource),'d4f8b902b7bbcbdae879fbc519efff63c61c538b747f1c37383f0c9295f30795','fixed pre-study-now resolver oracle');
const helperSource=readFileSync(resolve(stage,'lib/workbook-eligibility.ts'),'utf8');
const policySource=readFileSync(resolve(stage,'lib/workbook-access-policy.ts'),'utf8');
const uiSource=readFileSync(resolve(stage,'app/my-learning/page.tsx'),'utf8');
console.log(JSON.stringify({resolverSha256:sha(source),eligibilitySha256:sha(helperSource),uiSha256:sha(uiSource),mode:'actual resolver and eligibility SQL; synthetic SQLite'}));

let db;
const env={get DB(){return{prepare(sql){return{sql,values:[],bind(...values){this.values=values;return this;},
  async all(){return{results:db.prepare(this.sql).all(...this.values)};},
  async first(){return db.prepare(this.sql).get(...this.values)??null;}};}};}};
function compile(source,imports={}){
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('module','exports','require',code)(module,module.exports,id=>imports[id]??{});
  return module.exports;
}
const policy=compile(policySource);
const eligibility=compile(helperSource,{'@/lib/workbook-access-policy':policy});
const imports={
  'cloudflare:workers':{env},
  '@/db/bootstrap':{ensureEducationUser:async auth=>({roles:auth.userId==='staff:one'?['instructor']:['learner']})},
  '@/db/platform':{ensurePlatformSchema:async()=>{}},
  '@/lib/workbook-eligibility':eligibility,
};
const platform=compile(source,imports);
const originalPlatform=compile(originalSource,imports);
const {getLearnerEnrolments}=platform;
assert.equal(typeof getLearnerEnrolments,'function');
const learner={userId:'learner:one'},staff={userId:'staff:one'};

function setup({empty=false,asStaff=false}={}){
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
  db.prepare('INSERT INTO course_releases VALUES (?,?,?,?,?,?,?,?,?)').run('release:one','course:one','published','synthetic-course','Synthetic course','Education only','intro','1 hour','Synthetic publisher');
  db.prepare('INSERT INTO course_releases VALUES (?,?,?,?,?,?,?,?,?)').run('release:foreign','course:foreign','published','foreign-course','Foreign course','Education only','intro','1 hour','Foreign publisher');
  db.prepare('INSERT INTO modules VALUES (?,?)').run('module:one','course:one');
  db.prepare('INSERT INTO modules VALUES (?,?)').run('module:foreign','course:foreign');
  db.prepare('INSERT INTO workbooks VALUES (?,?,?)').run('workbook:one','module:one','published');
  db.prepare('INSERT INTO workbooks VALUES (?,?,?)').run('workbook:foreign','module:foreign','published');
  if(!empty)db.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?)').run('release:one','workbook:one',1);
  db.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?)').run('release:foreign','workbook:foreign',1);
  const user=asStaff?staff:learner;
  db.prepare('INSERT INTO enrolments VALUES (?,?,?,?)').run('enrol:one',user.userId,'course:one','active');
  db.prepare('INSERT INTO workbook_progress VALUES (?,?,?,?)').run('workbook:one',user.userId,75,'2026-10-18T12:00:00Z');
  db.prepare('INSERT INTO workbook_progress VALUES (?,?,?,?)').run('workbook:foreign',user.userId,90,'2026-10-18T13:00:00Z');
  db.prepare('INSERT INTO attempts VALUES (?,?)').run('attempt:submitted','receipt:fixed');
  db.prepare('INSERT INTO submissions VALUES (?,?,?)').run('submission:fixed','attempt:submitted','evidence:fixed');
  return db;
}
function direct(status='active'){
  db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?)').run('assignment:one','workbook:one',learner.userId,status);
}
function cohort(status='active'){
  db.prepare('INSERT INTO cohorts VALUES (?,?,?)').run('cohort:one','course:one','active');
  db.prepare('INSERT INTO cohort_members VALUES (?,?,?)').run('cohort:one',learner.userId,'active');
  db.prepare('INSERT INTO cohort_workbook_assignments VALUES (?,?,?,?,?,?,?,?)').run('cohort-assignment:one','cohort:one','workbook:one',status,null,null,null,0);
}
function evidence(){return JSON.stringify({
  progress:db.prepare('SELECT * FROM workbook_progress ORDER BY workbook_id').all(),
  attempts:db.prepare('SELECT * FROM attempts').all(),
  submissions:db.prepare('SELECT * FROM submissions').all(),
  releases:db.prepare('SELECT * FROM course_releases ORDER BY id').all(),
  bindings:db.prepare('SELECT * FROM course_release_workbooks ORDER BY release_id').all(),
});}
async function metricSnapshot(auth=learner){
  const rows=await getLearnerEnrolments(auth);
  const originalRows=await originalPlatform.getLearnerEnrolments(auth);
  assert.deepEqual(rows.map(({workbookCount,progress,firstWorkbookId,resumeWorkbookId,liveWorkbookId,liveStartedAt})=>({workbookCount,progress,firstWorkbookId,resumeWorkbookId,liveWorkbookId,liveStartedAt})),originalRows.map(({workbookCount,progress,firstWorkbookId,resumeWorkbookId,liveWorkbookId,liveStartedAt})=>({workbookCount,progress,firstWorkbookId,resumeWorkbookId,liveWorkbookId,liveStartedAt})), 'legacy fields and launch IDs remain unchanged');
  const row=rows.find(item=>item.id==='release:one');
  const scope=eligibility.publishedWorkbookEligibilityForRoles(auth.userId,auth.userId===staff.userId?['instructor']:['learner'],new Date().toISOString());
  const available=db.prepare(`WITH eligible AS (${scope.sql}) SELECT COUNT(DISTINCT crw.workbook_id) AS count FROM course_release_workbooks crw JOIN eligible e ON e.workbook_id=crw.workbook_id WHERE crw.release_id=?`).get(...scope.bindings,'release:one').count;
  const recorded=db.prepare('SELECT ROUND(AVG(wp.percent_complete)) AS percent FROM course_release_workbooks crw JOIN workbook_progress wp ON wp.workbook_id=crw.workbook_id WHERE crw.release_id=? AND wp.learner_id=?').get('release:one',auth.userId).percent;
  return{rows:rows.map(item=>item.id),available:Number(available),recorded:recorded===null?null:Number(recorded),card:{count:row?.workbookCount,progress:row?.progress,availableCount:row?.availableWorkbookCount,availableProgress:row?.availableProgress,first:row?.firstWorkbookId,resume:row?.resumeWorkbookId}};
}

test('My Learning labels available metrics as study-now progress',()=>{
  assert.match(uiSource,/course\.availableWorkbookCount/);
  assert.match(uiSource,/Progress on available workbooks/);
  assert.match(uiSource,/No workbooks available now/);
});

test('valid cohort-only content is available and resumable while legacy fields stay zero',async()=>{
  const local=setup();try{cohort();const before=evidence();
    assert.deepEqual(await metricSnapshot(),{rows:['release:one'],available:1,recorded:75,card:{count:0,progress:0,availableCount:1,availableProgress:75,first:'workbook:one',resume:'workbook:one'}});
    assert.equal(evidence(),before);
  }finally{local.close();}
});

test('dual direct and cohort grant counts one available workbook',async()=>{
  const local=setup();try{direct();cohort();const before=evidence();
    assert.deepEqual(await metricSnapshot(),{rows:['release:one'],available:1,recorded:75,card:{count:1,progress:75,availableCount:1,availableProgress:75,first:'workbook:one',resume:'workbook:one'}});
    assert.equal(evidence(),before);
  }finally{local.close();}
});

test('withdrawn content loses availability but retains recorded progress and attempt evidence',async()=>{
  const local=setup();try{direct('revoked');cohort('revoked');local.prepare("UPDATE workbooks SET status='withdrawn' WHERE id='workbook:one'").run();const before=evidence();
    assert.deepEqual(await metricSnapshot(),{rows:['release:one'],available:0,recorded:75,card:{count:0,progress:0,availableCount:0,availableProgress:0,first:null,resume:null}});
    assert.equal(evidence(),before);
  }finally{local.close();}
});

test('future direct grant remains in legacy fields but not current availability',async()=>{
  const local=setup();try{direct();local.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)').run('assignment:one','2099-01-01T00:00:00Z',null,null,0);const before=evidence();
    assert.deepEqual(await metricSnapshot(),{rows:['release:one'],available:0,recorded:75,card:{count:1,progress:75,availableCount:0,availableProgress:0,first:null,resume:null}});
    assert.equal(evidence(),before);
  }finally{local.close();}
});

test('foreign progress and publication do not enter an unenrolled learner course',async()=>{
  const local=setup();try{cohort();const before=evidence();const snapshot=await metricSnapshot();
    assert.deepEqual(snapshot.rows,['release:one']);assert.equal(snapshot.available,1);assert.equal(snapshot.recorded,75);assert.equal(snapshot.card.availableCount,1);assert.equal(snapshot.card.availableProgress,75);
    assert.equal(evidence(),before);
  }finally{local.close();}
});

test('empty published release has no available or recorded bound workbook',async()=>{
  const local=setup({empty:true});try{const before=evidence();
    assert.deepEqual(await metricSnapshot(),{rows:['release:one'],available:0,recorded:null,card:{count:0,progress:0,availableCount:0,availableProgress:0,first:null,resume:null}});
    assert.equal(evidence(),before);
  }finally{local.close();}
});

test('enrolled staff sees available content scoped to the release',async()=>{
  const local=setup({asStaff:true});try{const before=evidence();
    assert.deepEqual(await metricSnapshot(staff),{rows:['release:one'],available:1,recorded:75,card:{count:0,progress:0,availableCount:1,availableProgress:75,first:'workbook:one',resume:'workbook:one'}});
    assert.equal(evidence(),before);
  }finally{local.close();}
});

test('missing saved progress contributes zero to available average',async()=>{
  const local=setup();try{cohort();
    local.prepare('INSERT INTO workbooks VALUES (?,?,?)').run('workbook:two','module:one','published');
    local.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?)').run('release:one','workbook:two',2);
    local.prepare('INSERT INTO cohort_workbook_assignments VALUES (?,?,?,?,?,?,?,?)').run('cohort-assignment:two','cohort:one','workbook:two','active',null,null,null,0);
    const before=evidence();const snapshot=await metricSnapshot();
    assert.equal(snapshot.available,2);assert.equal(snapshot.card.availableCount,2);assert.equal(snapshot.card.availableProgress,38);
    assert.equal(snapshot.card.count,0);assert.equal(snapshot.card.progress,0);assert.equal(evidence(),before);
  }finally{local.close();}
});

test('prerequisite-blocked workbook retains legacy history but is unavailable now',async()=>{
  const local=setup();try{direct();
    local.prepare('INSERT INTO workbooks VALUES (?,?,?)').run('workbook:prereq','module:one','published');
    local.prepare('INSERT INTO workbook_progress VALUES (?,?,?,?)').run('workbook:prereq',learner.userId,20,'2026-10-18T12:00:00Z');
    local.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?)').run('assignment:one',null,null,'workbook:prereq',90);
    const before=evidence();const snapshot=await metricSnapshot();
    assert.equal(snapshot.available,0);assert.equal(snapshot.card.availableCount,0);assert.equal(snapshot.card.availableProgress,0);
    assert.equal(snapshot.card.count,1);assert.equal(snapshot.card.progress,75);assert.equal(snapshot.card.first,null);assert.equal(snapshot.card.resume,null);
    assert.equal(evidence(),before);
  }finally{local.close();}
});

test('a missing progress row leaves available content launchable at zero progress',async()=>{
  const local=setup();try{cohort();local.prepare('DELETE FROM workbook_progress WHERE workbook_id=?').run('workbook:one');
    const before=evidence();const snapshot=await metricSnapshot();
    assert.equal(snapshot.card.availableCount,1);assert.equal(snapshot.card.availableProgress,0);
    assert.equal(snapshot.card.first,'workbook:one');assert.equal(snapshot.card.resume,null);
    assert.equal(evidence(),before);
  }finally{local.close();}
});

test('live teaching authority and launch identifiers remain unchanged',async()=>{
  const local=setup();try{cohort();
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:one','live','2026-10-18T14:00:00Z');
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('workbook:foreign','live','2026-10-18T15:00:00Z');
    const before=evidence();const rows=await getLearnerEnrolments(learner);
    assert.equal(rows.length,1);assert.equal(rows[0].liveWorkbookId,'workbook:one');
    assert.equal(rows[0].liveStartedAt,'2026-10-18T14:00:00Z');
    assert.equal((await metricSnapshot()).card.availableCount,1);
    assert.equal(evidence(),before);
  }finally{local.close();}
});
