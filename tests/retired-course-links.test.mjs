import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// This executes the real catalogue and course-outline functions. Only the
// Cloudflare DB binding and schema bootstrap are replaced by a local fixture.
const site=fileURLToPath(new URL('../',import.meta.url));
const sourcePath=resolve(site,'lib/education-platform.ts');
const source=readFileSync(sourcePath,'utf8');
const require=createRequire(resolve(site,'package.json'));
const ts=require('typescript');
console.log(JSON.stringify({source:'actual lib/education-platform.ts',sha256:createHash('sha256').update(source).digest('hex'),mode:'actual resolver SQL; synthetic SQLite rows'}));

let db;
const env={get DB(){return{
  prepare(sql){return{sql,values:[],bind(...values){this.values=values;return this;},
    async first(){return db.prepare(this.sql).get(...this.values)??null;},
    async all(){return{results:db.prepare(this.sql).all(...this.values)};}};},
};}};
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
new Function('module','exports','require',compiled)(module,module.exports,id=>{
  if(id==='cloudflare:workers')return{env};
  if(id==='@/db/bootstrap')return{ensureDatabase:async()=>{}};
  if(id==='@/db/platform')return{ensurePlatformSchema:async()=>{}};
  return {};
});
const {listCatalogueCourses,getCatalogueCourse,getCatalogueCourseWorkbooks}=module.exports;
assert.equal(typeof listCatalogueCourses,'function');
assert.equal(typeof getCatalogueCourse,'function');
assert.equal(typeof getCatalogueCourseWorkbooks,'function');

function setup(){
  db=new DatabaseSync(':memory:');
  // Query-sized schema deliberately uses synthetic data and no production DB.
  db.exec(`CREATE TABLE courses(id TEXT PRIMARY KEY,code TEXT);
    CREATE TABLE course_releases(id TEXT PRIMARY KEY,course_id TEXT,slug TEXT,status TEXT,visibility TEXT,version INTEGER,title TEXT,summary TEXT,level TEXT,duration_label TEXT,outcomes_json TEXT,publisher_name TEXT,publisher_kind TEXT,access_model TEXT,price_minor INTEGER,currency TEXT,enrolment_open INTEGER,organization_id TEXT,created_by TEXT,reviewed_by TEXT,review_notes TEXT,updated_at TEXT,published_at TEXT);
    CREATE TABLE course_release_workbooks(release_id TEXT,workbook_id TEXT,position INTEGER,required INTEGER);
    CREATE TABLE workbooks(id TEXT PRIMARY KEY,title TEXT,mode TEXT,version INTEGER,status TEXT,duration_minutes INTEGER);
    CREATE TABLE enrolments(course_id TEXT,user_id TEXT,status TEXT);
    CREATE TABLE teaching_sessions(workbook_id TEXT,state TEXT,started_at TEXT);
    CREATE TABLE attempts(id TEXT,assessment_version_id TEXT,receipt_hash TEXT);
    CREATE TABLE submissions(id TEXT,attempt_id TEXT,evidence_hash TEXT);`);
  db.prepare('INSERT INTO courses VALUES (?,?)').run('course:synthetic','SYN');
  db.prepare(`INSERT INTO course_releases VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    'release:1','course:synthetic','synthetic-course','published','public',7,'Synthetic course','No patient content','intro','1 hour','[]','Synthetic publisher','institution','free',0,'GBP',1,'org:synthetic','author','reviewer','Approved independently','2026-10-01','2026-10-01');
  for(const [id,title,mode,version,status,position] of [
    ['lesson:old','Original lesson','teaching',4,'published',1],
    ['lecture:live','Independent lecture','lecture',3,'published',2],
  ]){
    db.prepare('INSERT INTO workbooks VALUES (?,?,?,?,?,?)').run(id,title,mode,version,status,30);
    db.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?,?)').run('release:1',id,position,1);
  }
  db.prepare('INSERT INTO attempts VALUES (?,?,?)').run('attempt:submitted','assessment:old','receipt:fixed');
  db.prepare('INSERT INTO submissions VALUES (?,?,?)').run('submission:fixed','attempt:submitted','evidence:fixed');
  db.prepare('INSERT INTO enrolments VALUES (?,?,?)').run('course:synthetic','synthetic-learner','active');
  return db;
}
function retained(){return JSON.parse(JSON.stringify({
  release:db.prepare('SELECT id,version,status,reviewed_by FROM course_releases').get(),
  bindings:db.prepare('SELECT * FROM course_release_workbooks ORDER BY position').all(),
  sessions:db.prepare('SELECT * FROM teaching_sessions ORDER BY started_at').all(),
  attempt:db.prepare('SELECT * FROM attempts').all(),
  submissions:db.prepare('SELECT * FROM submissions').all(),
}));}
async function links(){
  const auth={userId:'synthetic-learner'};
  const course=await getCatalogueCourse('synthetic-course',auth);
  const workbooks=await getCatalogueCourseWorkbooks('release:1');
  const listed=(await listCatalogueCourses(auth)).find(row=>row.id==='release:1');
  return{
    detail:{count:course?.workbookCount,first:course?.firstWorkbookId,version:course?.version,live:course?.liveWorkbookId,started:course?.liveStartedAt},
    list:{count:listed?.workbookCount,first:listed?.firstWorkbookId,version:listed?.version,live:listed?.liveWorkbookId,started:listed?.liveStartedAt},
    outline:workbooks.map(row=>({id:row.id,title:row.title,position:row.position})),
  };
}
const liveLecture={id:'lecture:live',title:'Independent lecture',position:2};
const original={id:'lesson:old',title:'Original lesson',position:1};
function expected(count,first,outline,live=null,started=null){return{
  detail:{count,first,version:7,live,started},list:{count,first,version:7,live,started},outline,
};}

test('published control resolves exact bound revision and live links',async()=>{
  const local=setup();try{
    assert.deepEqual(await links(),expected(2,'lesson:old',[original,liveLecture]));
    assert.deepEqual(retained().release,{id:'release:1',version:7,status:'published',reviewed_by:'reviewer'});
    assert.deepEqual(retained().attempt,[{id:'attempt:submitted',assessment_version_id:'assessment:old',receipt_hash:'receipt:fixed'}]);
    assert.deepEqual(retained().submissions,[{id:'submission:fixed',attempt_id:'attempt:submitted',evidence_hash:'evidence:fixed'}]);
  }finally{local.close();}
});

for(const disposition of ['withdrawn','archived'])test(`${disposition} original is absent from affected course links while unrelated lecture and evidence stay intact`,async()=>{
  const local=setup();try{
    const before=retained();
    local.prepare('UPDATE workbooks SET status=? WHERE id=?').run(disposition,'lesson:old');
    assert.deepEqual(await links(),expected(1,'lecture:live',[liveLecture]));
    assert.equal(local.prepare('SELECT version FROM workbooks WHERE id=?').get('lesson:old').version,4);
    assert.deepEqual(retained(),before);
  }finally{local.close();}
});

test('all retired retains the release while yielding a zero-count empty outline and no launch item',async()=>{
  const local=setup();try{
    const before=retained();
    local.prepare("UPDATE workbooks SET status='withdrawn'").run();
    assert.deepEqual(await links(),expected(0,null,[]));
    assert.deepEqual(retained(),before);
  }finally{local.close();}
});

test('live link and start time move together from retired session to published lecture session',async()=>{
  const local=setup();try{
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('lecture:live','live','2026-10-18T09:00:00Z');
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('lesson:old','live','2026-10-18T10:00:00Z');
    const before=retained();
    assert.deepEqual(await links(),expected(2,'lesson:old',[original,liveLecture],'lesson:old','2026-10-18T10:00:00Z'));
    local.prepare("UPDATE workbooks SET status='withdrawn' WHERE id='lesson:old'").run();
    assert.deepEqual(await links(),expected(1,'lecture:live',[liveLecture],'lecture:live','2026-10-18T09:00:00Z'));
    local.prepare("UPDATE workbooks SET status='archived' WHERE id='lecture:live'").run();
    assert.deepEqual(await links(),expected(0,null,[]));
    assert.deepEqual(retained(),before);
  }finally{local.close();}
});

test('missing bound workbook cannot supply a live link',async()=>{
  const local=setup();try{
    local.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?,?)').run('release:1','lesson:missing',3,0);
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('lesson:missing','live','2026-10-18T11:00:00Z');
    local.prepare('INSERT INTO teaching_sessions VALUES (?,?,?)').run('lecture:live','live','2026-10-18T09:00:00Z');
    assert.deepEqual(await links(),expected(2,'lesson:old',[original,liveLecture],'lecture:live','2026-10-18T09:00:00Z'));
    assert.equal((await getCatalogueCourse('synthetic-course'))?.liveWorkbookId,null,'anonymous catalogue remains without an enrolled live link');
  }finally{local.close();}
});

test('published survivors keep their original title, version, release binding and position order',async()=>{
  const local=setup();try{
    local.prepare('INSERT INTO workbooks VALUES (?,?,?,?,?,?)').run('lesson:last','Last lesson','teaching',9,'published',20);
    local.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?,?)').run('release:1','lesson:last',3,0);
    const before=retained();
    local.prepare("UPDATE workbooks SET status='archived' WHERE id='lesson:old'").run();
    assert.deepEqual(await links(),expected(2,'lecture:live',[liveLecture,{id:'lesson:last',title:'Last lesson',position:3}]));
    assert.deepEqual(JSON.parse(JSON.stringify(local.prepare("SELECT title,version FROM workbooks WHERE id='lesson:last'").get())),{title:'Last lesson',version:9});
    assert.deepEqual(retained(),before);
  }finally{local.close();}
});

test('published-release and visibility boundaries remain unchanged',async()=>{
  const local=setup();try{
    const before=retained();
    // A draft release never appears, including through the direct outline query.
    local.prepare("UPDATE course_releases SET status='draft' WHERE id='release:1'").run();
    assert.equal(await getCatalogueCourse('synthetic-course'),null);
    assert.deepEqual(await getCatalogueCourseWorkbooks('release:1'),[]);
    assert.deepEqual(await listCatalogueCourses(),[]);
    local.prepare("UPDATE course_releases SET status='published',visibility='unlisted' WHERE id='release:1'").run();
    assert.deepEqual(await listCatalogueCourses(),[]);
    assert.equal((await getCatalogueCourse('synthetic-course'))?.workbookCount,2);
    local.prepare("UPDATE course_releases SET visibility='private' WHERE id='release:1'").run();
    assert.equal(await getCatalogueCourse('synthetic-course'),null);
    assert.deepEqual(await listCatalogueCourses(),[]);
    // Restore the synthetic fixture before checking protected rows.
    local.prepare("UPDATE course_releases SET visibility='public' WHERE id='release:1'").run();
    assert.deepEqual(retained(),before);
  }finally{local.close();}
});
