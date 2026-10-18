import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash, randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';

// Exercise the exported server function and every SQL statement it sends to D1.
// Only Cloudflare/auth/bootstrapping dependencies are synthetic.
const site=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const baseline=process.env.VM_RELEASE_DRAFT_BASELINE==='1';
const frozenRoot=resolve(site,'..','recovery','checkpoints','20261014-release-draft-atomic','before-owned');
const sourcePath=baseline?resolve(frozenRoot,'source','lib','education-platform.ts'):resolve(site,'lib','education-platform.ts');
const sourceBytes=readFileSync(sourcePath);
const sourceHash=createHash('sha256').update(sourceBytes).digest('hex');
if(baseline){
 const manifest=JSON.parse(readFileSync(resolve(frozenRoot,'manifest.json'),'utf8'));
 const entry=manifest.files.find(file=>file.path==='lib/education-platform.ts');
 assert.ok(entry,'frozen source entry is in before-owned manifest');
 assert.equal(sourceBytes.length,entry.size,'frozen source byte length matches manifest');
 assert.equal(sourceHash,entry.sha256,'frozen source SHA-256 matches manifest');
}
const source=sourceBytes.toString('utf8');
const imports={
 'cloudflare:workers':['env'],
 '@/lib/course-enrolment-policy':['INVITATION_SELF_ENROLMENT_ENABLED','INVITATION_SELF_ENROLMENT_HOLD_MESSAGE'],
 '@/db/bootstrap':['appendAudit','ensureDatabase','ensureEducationUser'],
 '@/db/platform':['ensurePlatformSchema','getPlatformSnapshot'],
 '@/lib/domain':['sha256'],
 '@/lib/studio-templates':['studioTemplate'],
 '@/lib/account-policy':['accountMayWrite','accountWriteBlockReason','CURRENT_PRIVACY_VERSION','CURRENT_TERMS_VERSION','learnerOnboardingStatus'],
 '@/lib/transactional-email':['courseEnrolmentEmail','getEmailProviderConfig','sendTransactionalEmail'],
};
let fixture;
const actor={userId:'synthetic-educator'};
const seams={
 env:{get DB(){return fixture.d1;}},
 async ensureEducationUser(){return {roles:fixture.roles,status:fixture.accountStatus};},
 async getPlatformSnapshot(){return {entitlement:{studioAccess:fixture.studioAccess},organization:{id:'org:owned',name:'Synthetic institution',kind:'institution'}};},
 accountMayWrite(status){return status==='active';},
 accountWriteBlockReason(){return 'Account writes are disabled.';},
 async sha256(value){return createHash('sha256').update(value).digest('hex');},
 async appendAudit(actorId,action,targetType,targetId,outcome,reason){
  // Legacy implementation's external audit call is deliberately recorded as a
  // real audit row so that atomicity assertions observe its durable effect.
  const head=fixture.db.prepare('SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1').get();
  const sequence=(head?.sequence??0)+1, occurredAt=new Date().toISOString();
  const integrityHash=await seams.sha256(`${head?.integrity_hash??'GENESIS'}|${sequence}|${actorId}|${action}|${targetType}|${targetId}|${outcome}|${reason}|${occurredAt}`);
  fixture.db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),sequence,actorId,action,targetType,targetId,outcome,reason,occurredAt,integrityHash);
 },
};
const built=await build({stdin:{contents:source,resolveDir:site,sourcefile:'lib/education-platform.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{
 name:'synthetic-education-dependencies',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path in imports||args.path==='@/lib/auth')return {path:args.path,namespace:'seam'};
   if(args.path==='test-seams')return {path:args.path,external:true};
   throw Error(`Unexpected import: ${args.path}`);
  });
  b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seam from 'test-seams';\n${(imports[args.path]??[]).map(name=>`export const ${name}=seam.${name};`).join('\n')}`,loader:'js'}));
 }
 }]});
const module={exports:{}};
new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
const {saveCourseReleaseDraft,EducationPlatformError}=module.exports;
assert.equal(typeof saveCourseReleaseDraft,'function');
console.log(JSON.stringify({actualSource:baseline?'before-owned/source/lib/education-platform.ts':'lib/education-platform.ts',sourceIdentity:baseline?'frozen-before':'current',sha256:sourceHash}));

const chosen={courseId:'course:owned',releaseId:'release:one',expectedVersion:4,title:'Updated release',slug:'updated-release',summary:'An updated synthetic teaching course summary with adequate detail.',visibility:'private',accessModel:'invitation',publisherKind:'institution',workbookIds:['workbook:two','workbook:one'],outcomes:['Find synthetic structures','Describe synthetic findings']};
const ddlFiles=[readFileSync(resolve(site,'db/bootstrap.ts'),'utf8'),readFileSync(resolve(site,'db/platform.ts'),'utf8')];
function createTable(db,name){
 const expression=new RegExp('`(CREATE TABLE IF NOT EXISTS '+name+' \\([^`]+\\))`');
 const ddl=ddlFiles.map(file=>file.match(expression)?.[1]).find(Boolean);
 assert.ok(ddl,`real DDL for ${name}`);db.exec(ddl);
}
function setup(){
 const db=new DatabaseSync(':memory:');
 for(const table of ['users','courses','modules','workbooks','account_security_profiles','audit_events','organizations','course_ownership','course_releases','course_release_workbooks','course_release_snapshots'])createTable(db,table);
 db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(actor.userId,'synthetic-subject','educator@example.invalid','Synthetic educator','["instructor"]','2026-01-01','2026-01-01');
 db.prepare('INSERT INTO organizations VALUES (?,?,?,?,?,?)').run('org:owned','owned','Synthetic institution','institution','active','2026-01-01');
 db.prepare('INSERT INTO courses VALUES (?,?,?,?,?)').run('course:owned','OWN','Owned course','Synthetic course','active');
 db.prepare('INSERT INTO courses VALUES (?,?,?,?,?)').run('course:other','OTHER','Other course','Synthetic course','active');
 db.prepare('INSERT INTO course_ownership VALUES (?,?,?,?)').run('course:owned','org:owned',actor.userId,'2026-01-01');
 db.prepare('INSERT INTO course_ownership VALUES (?,?,?,?)').run('course:other','org:owned',actor.userId,'2026-01-01');
 db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:owned','course:owned','Owned',1);
 db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:other','course:other','Other',1);
 for(const [id,moduleId] of [['workbook:one','module:owned'],['workbook:two','module:owned'],['workbook:other','module:other']])
  db.prepare('INSERT INTO workbooks (id,module_id,title,mode,version,status,duration_minutes) VALUES (?,?,?,?,?,?,?)').run(id,moduleId,id,'study',1,'published',20);
 // Real account table has more required fields; this fixture fills every required column.
 const accountDDL=db.prepare('PRAGMA table_info(account_security_profiles)').all();
 const accountColumns=accountDDL.filter(column=>column.notnull||column.pk).map(column=>column.name);
 const accountValues=accountColumns.map(column=>column==='user_id'?actor.userId:column==='status'?'active':column.endsWith('_at')?'2026-01-01T00:00:00Z':column.includes('version')?'v1':column==='identity_provider'?'synthetic':'');
 db.prepare(`INSERT INTO account_security_profiles (${accountColumns.join(',')}) VALUES (${accountColumns.map(()=>'?').join(',')})`).run(...accountValues);
 db.prepare(`INSERT INTO course_releases (id,course_id,organization_id,slug,title,summary,level,duration_label,outcomes_json,publisher_name,publisher_kind,visibility,access_model,price_minor,currency,status,enrolment_open,version,created_by,reviewed_by,review_notes,created_at,updated_at,published_at)
 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('release:one','course:owned','org:owned','original-release','Original release','Original synthetic summary with adequate detail.','All levels','Self-paced','["Original outcome one","Original outcome two"]','Synthetic institution','institution','private','invitation',0,'GBP','draft',0,4,actor.userId,null,'','2026-01-01','2026-01-01',null);
 db.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?,?)').run('release:one','workbook:one',1,1);
 fixture={db,roles:['instructor'],studioAccess:true,accountStatus:'active',beforeFirstMutation:null,beforeBatch:null,mutations:0,batches:0,failItemAt:0,itemInserts:0};
 fixture.d1={
  prepare(sql){return {sql,values:[],bind(...values){this.values=values;return this;},
   async first(){return db.prepare(this.sql).get(...this.values)??null;},
   async all(){return {results:db.prepare(this.sql).all(...this.values)};},
   async run(){
    if(fixture.beforeFirstMutation&&/^\s*(INSERT|UPDATE|DELETE)/i.test(this.sql)){const change=fixture.beforeFirstMutation;fixture.beforeFirstMutation=null;change(db);}
    fixture.mutations++;
    if(/INSERT INTO course_release_workbooks/i.test(this.sql)&&++fixture.itemInserts===fixture.failItemAt)throw Error('synthetic item failure');
    const result=db.prepare(this.sql).run(...this.values);return {success:true,meta:{changes:Number(result.changes)}};
   }};},
  async batch(statements){
   fixture.batches++;
   if(fixture.beforeBatch){const change=fixture.beforeBatch;fixture.beforeBatch=null;change(db);}
   if(fixture.beforeFirstMutation){const change=fixture.beforeFirstMutation;fixture.beforeFirstMutation=null;change(db);}
   db.exec('BEGIN');
   try{const results=[];for(const statement of statements){
    if(/INSERT INTO course_release_workbooks/i.test(statement.sql)&&++fixture.itemInserts===fixture.failItemAt)throw Error('synthetic item failure');
    const result=db.prepare(statement.sql).run(...statement.values);results.push({success:true,meta:{changes:Number(result.changes)}});
   }db.exec('COMMIT');return results;}catch(error){db.exec('ROLLBACK');throw error;}
  },
 };
 return db;
}
function snapshot(db){return {
 release:db.prepare('SELECT * FROM course_releases WHERE id=?').get('release:one'),
 items:db.prepare('SELECT workbook_id,position,required FROM course_release_workbooks WHERE release_id=? ORDER BY position').all('release:one').map(row=>({...row})),
 history:db.prepare('SELECT * FROM course_release_snapshots ORDER BY captured_at').all(),
 audits:db.prepare('SELECT * FROM audit_events ORDER BY sequence').all(),
};}
function injectRace(change){
 fixture.beforeFirstMutation=database=>{fixture.beforeBatch=null;change(database);};
 fixture.beforeBatch=database=>{fixture.beforeFirstMutation=null;change(database);};
}
async function conflict(payload=chosen,status=409){await assert.rejects(saveCourseReleaseDraft(actor,payload),error=>error instanceof EducationPlatformError&&error.status===status);}

test('stale save after another educator changes version preserves all competing state',async()=>{
 const db=setup();try{
  injectRace(database=>{database.prepare('UPDATE course_releases SET title=?,version=version+1 WHERE id=?').run('Competing title','release:one');database.prepare('DELETE FROM course_release_workbooks WHERE release_id=?').run('release:one');database.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?,?)').run('release:one','workbook:two',1,1);});
  await conflict();const after=snapshot(db);
  assert.equal(after.release.title,'Competing title');assert.equal(after.release.version,5);
  assert.deepEqual(after.items,[{workbook_id:'workbook:two',position:1,required:1}]);
  assert.equal(after.history.length,0);assert.equal(after.audits.length,0);
 }finally{db.close();}
});
test('status transition with same version rejects and preserves metadata and order',async()=>{
 for(const status of ['in-review','approved','published']){
  const db=setup();try{
   injectRace(database=>database.prepare('UPDATE course_releases SET status=? WHERE id=?').run(status,'release:one'));
   await conflict();const after=snapshot(db);assert.equal(after.release.status,status);assert.equal(after.release.title,'Original release');
   assert.deepEqual(after.items,[{workbook_id:'workbook:one',position:1,required:1}]);assert.equal(after.history.length,0);assert.equal(after.audits.length,0);
  }finally{db.close();}
 }
});
test('same organization cannot pair an owned course with a different release course',async()=>{
 const db=setup();try{await conflict({...chosen,courseId:'course:other',workbookIds:['workbook:other']});const after=snapshot(db);
  assert.equal(after.release.course_id,'course:owned');assert.equal(after.release.title,'Original release');assert.equal(after.history.length,0);assert.equal(after.audits.length,0);
 }finally{db.close();}
});
test('first or second item insertion failure rolls back metadata, ordering, snapshot and audit',async()=>{
 for(const failItemAt of [1,2]){const db=setup();try{const before=snapshot(db);fixture.failItemAt=failItemAt;await assert.rejects(saveCourseReleaseDraft(actor,chosen),/synthetic item failure/);assert.deepEqual(snapshot(db),before);}finally{db.close();}}
});
test('ordinary update keeps identity and status immutable, orders workbooks, captures exact prior row',async()=>{
 const db=setup();try{const before=snapshot(db);assert.equal(await saveCourseReleaseDraft(actor,chosen),'release:one');const after=snapshot(db);
  assert.equal(after.release.course_id,before.release.course_id);assert.equal(after.release.organization_id,before.release.organization_id);assert.equal(after.release.status,'draft');assert.equal(after.release.access_model,'invitation');assert.equal(after.release.version,5);assert.equal(after.release.title,chosen.title);
  assert.deepEqual(after.items.map(item=>item.workbook_id),chosen.workbookIds);assert.deepEqual(after.items.map(item=>item.position),[1,2]);
  assert.equal(after.history.length,1);assert.deepEqual(JSON.parse(after.history[0].snapshot_json),{...before.release});assert.equal(after.audits.length,1);
 }finally{db.close();}
});
test('create retains owned course, selected order, draft status and audit',async()=>{
 const db=setup();try{const id=await saveCourseReleaseDraft(actor,{...chosen,releaseId:undefined,expectedVersion:undefined,slug:'new-release'});
  const row=db.prepare('SELECT * FROM course_releases WHERE id=?').get(id);assert.equal(row.course_id,'course:owned');assert.equal(row.organization_id,'org:owned');assert.equal(row.status,'draft');assert.equal(row.version,1);
  assert.deepEqual(db.prepare('SELECT workbook_id FROM course_release_workbooks WHERE release_id=? ORDER BY position').all(id).map(row=>row.workbook_id),chosen.workbookIds);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_events').get().count,1);
 }finally{db.close();}
});
test('failed second item on create rolls back release, ordering and audit',async()=>{
 const db=setup();try{fixture.failItemAt=2;await assert.rejects(saveCourseReleaseDraft(actor,{...chosen,releaseId:undefined,expectedVersion:undefined,slug:'new-release'}),/synthetic item failure/);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM course_releases WHERE slug='new-release'").get().count,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM course_release_workbooks').get().count,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_events').get().count,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM course_release_snapshots').get().count,0);
 }finally{db.close();}
});
test('role and entitlement denial occurs before SQL writes',async()=>{
 for(const denial of [{roles:['learner']},{studioAccess:false}]){const db=setup();try{Object.assign(fixture,denial);await conflict(chosen,403);assert.equal(fixture.mutations,0);assert.equal(fixture.batches,0);}finally{db.close();}}
});
test('account, ownership and workbook-course revocation at commit fail closed',async()=>{
 for(const revoke of [
  database=>database.prepare("UPDATE account_security_profiles SET status='restricted' WHERE user_id=?").run(actor.userId),
  database=>database.prepare("DELETE FROM course_ownership WHERE course_id='course:owned'").run(),
  database=>database.prepare("UPDATE modules SET course_id='course:other' WHERE id='module:owned'").run(),
 ]){
  const db=setup();try{
   const before=snapshot(db);injectRace(revoke);
   await assert.rejects(saveCourseReleaseDraft(actor,chosen));
   assert.deepEqual(snapshot(db),before);
  }finally{db.close();}
 }
});
test('audit-head collision retries with exact chained hash and no partial first attempt',async()=>{
 const db=setup();try{
  const collide=database=>database.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),1,'competing-actor','other-action','course-release','release:one','success','external','2026-01-02','external-head');
  injectRace(collide);
  assert.equal(await saveCourseReleaseDraft(actor,chosen),'release:one');
  const after=snapshot(db);assert.equal(after.audits.length,2);assert.equal(after.audits[1].sequence,2);assert.equal(after.release.version,5);assert.deepEqual(after.items.map(item=>item.workbook_id),chosen.workbookIds);assert.equal(after.history.length,1);
  const audit=after.audits[1];assert.equal(audit.integrity_hash,await seams.sha256(`external-head|2|${actor.userId}|course-release.draft-saved|course-release|release:one|success|visibility=private;access=invitation;workbooks=2|${audit.occurred_at}`));
 }finally{db.close();}
});
