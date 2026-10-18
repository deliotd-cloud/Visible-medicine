import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash, randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';

// Run the exported workflow functions against native SQLite and the production
// table DDL. Only Cloudflare bindings, identity and bootstrap are substituted.
const site=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const baseline=process.env.VM_RELEASE_WORKFLOW_BASELINE==='1';
const roleBaseline=process.env.VM_RELEASE_ROLE_BASELINE==='1';
assert.ok(!(baseline&&roleBaseline),'select only one frozen source');
const frozenRoot=resolve(site,'..','recovery','checkpoints',roleBaseline?'20261014-studio-role-storage':'20261014-release-workflow-identity','before-owned');
const sourcePath=baseline||roleBaseline?resolve(frozenRoot,'source','lib','education-platform.ts'):resolve(site,'lib','education-platform.ts');
const sourceBytes=readFileSync(sourcePath);
const sourceHash=createHash('sha256').update(sourceBytes).digest('hex');
if(baseline||roleBaseline){
 const manifest=JSON.parse(readFileSync(resolve(frozenRoot,'manifest.json'),'utf8'));
 const entry=manifest.files.find(file=>file.path==='lib/education-platform.ts');
 assert.ok(entry,'frozen source appears in before-owned manifest');
 assert.equal(sourceBytes.length,entry.size,'frozen source size matches manifest');
 assert.equal(sourceHash,entry.sha256,'frozen source SHA-256 matches manifest');
}
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
const author={userId:'synthetic-author',email:'author@example.invalid'};
const reviewer={userId:'synthetic-reviewer',email:'reviewer@example.invalid'};
const admin={userId:'synthetic-admin',email:'admin@example.invalid'};
const seams={
 env:{get DB(){return fixture.d1;}},
 async ensureDatabase(){},
 async ensurePlatformSchema(){},
 async ensureEducationUser(auth){const user=fixture.db.prepare('SELECT roles FROM users WHERE id=?').get(auth.userId);return {roles:user?user.roles.split(',').filter(Boolean):[],status:fixture.accountStatus[auth.userId]??'active'};},
 async getPlatformSnapshot(){return {entitlement:{studioAccess:fixture.studioAccess},organization:{id:'org:owned',name:'Synthetic institution',kind:'institution',role:'owner'}};},
 accountMayWrite(status){return status==='active';},
 accountWriteBlockReason(){return 'Account writes are disabled.';},
 async sha256(value){return createHash('sha256').update(value).digest('hex');},
 async appendAudit(actorId,action,targetType,targetId,outcome,reason){
  const head=fixture.db.prepare('SELECT sequence, integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1').get();
  const sequence=(head?.sequence??0)+1,occurredAt=new Date().toISOString();
  const integrityHash=await seams.sha256(`${head?.integrity_hash??'GENESIS'}|${sequence}|${actorId}|${action}|${targetType}|${targetId}|${outcome}|${reason}|${occurredAt}`);
  fixture.db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),sequence,actorId,action,targetType,targetId,outcome,reason,occurredAt,integrityHash);
 },
};
const built=await build({stdin:{contents:sourceBytes.toString('utf8'),resolveDir:site,sourcefile:'lib/education-platform.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{
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
const {reviewCourseRelease,getStudioSnapshot,EducationPlatformError}=module.exports;
// The frozen API accepted a release ID, not an object. Adapt only that call
// shape so the negative replay exercises its real writes rather than failing
// trivially on the new transport contract; assertions remain identical.
const submitCourseRelease=(actor,input)=>module.exports.submitCourseRelease(actor,baseline?input.releaseId:input);
const publishCourseRelease=(actor,input)=>module.exports.publishCourseRelease(actor,baseline?input.releaseId:input);
for(const [name,fn] of Object.entries({submitCourseRelease,reviewCourseRelease,publishCourseRelease,getStudioSnapshot}))assert.equal(typeof fn,'function',`${name} is exported`);
console.log(JSON.stringify({actualSource:baseline||roleBaseline?'before-owned/source/lib/education-platform.ts':'lib/education-platform.ts',sourceIdentity:roleBaseline?'frozen-before-role':baseline?'frozen-before-workflow':'current',sha256:sourceHash}));

const ddlFiles=[readFileSync(resolve(site,'db/bootstrap.ts'),'utf8'),readFileSync(resolve(site,'db/platform.ts'),'utf8')];
function createTable(db,name){
 const expression=new RegExp('`(CREATE TABLE IF NOT EXISTS '+name+' \\([^`]+\\))`');
 const ddl=ddlFiles.map(file=>file.match(expression)?.[1]).find(Boolean);
 assert.ok(ddl,`real DDL for ${name}`);db.exec(ddl);
}
const tables=['users','courses','modules','workbooks','account_security_profiles','audit_events','organizations','course_ownership','course_releases','course_release_workbooks','course_release_reviews','course_release_snapshots','education_publications','enrolments','workbook_cases','cohorts','cohort_members','cohort_workbook_assignments','workbook_progress'];
function setup({status='draft',items=['workbook:one'],version=4}={}){
 const db=new DatabaseSync(':memory:');
 for(const table of tables)createTable(db,table);
 for(const actor of [author,reviewer,admin]){
  const roles=actor===admin?['administrator']:actor===reviewer?['examiner']:['instructor'];
  db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(actor.userId,actor.userId,actor.email,actor.userId,roles.join(','),'2026-01-01','2026-01-01');
  db.prepare('INSERT INTO account_security_profiles VALUES (?,?,?,?,?,?,?,?,?,?)').run(actor.userId,'active','synthetic','2026-01-01','2026-01-01','v1','v1','2026-01-01','2026-01-01','2026-01-01');
 }
 db.prepare('INSERT INTO organizations VALUES (?,?,?,?,?,?)').run('org:owned','owned','Synthetic institution','institution','active','2026-01-01');
 for(const [id,code] of [['course:owned','OWN'],['course:other','OTHER']])db.prepare('INSERT INTO courses VALUES (?,?,?,?,?)').run(id,code,id,'Synthetic course','active');
 db.prepare('INSERT INTO course_ownership VALUES (?,?,?,?)').run('course:owned','org:owned',author.userId,'2026-01-01');
 db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:owned','course:owned','Owned module',1);
 db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:other','course:other','Other module',1);
 for(const [id,moduleId] of [['workbook:one','module:owned'],['workbook:two','module:owned'],['workbook:other','module:other']])
  db.prepare('INSERT INTO workbooks (id,module_id,title,mode,version,status,duration_minutes) VALUES (?,?,?,?,?,?,?)').run(id,moduleId,id,'study',1,'published',20);
 db.prepare('INSERT INTO course_releases (id,course_id,organization_id,slug,title,summary,level,duration_label,outcomes_json,publisher_name,publisher_kind,visibility,access_model,price_minor,currency,status,enrolment_open,version,created_by,reviewed_by,review_notes,created_at,updated_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
  .run('release:one','course:owned','org:owned','release-one','Synthetic release','A synthetic teaching course summary with adequate detail.','All levels','Self-paced','["Find structures","Describe findings"]','Synthetic institution','institution','private','invitation',0,'GBP',status,0,version,author.userId,status==='approved'?reviewer.userId:null,status==='approved'?'Accepted synthetic review':'','2026-01-01','2026-01-01',null);
 items.forEach((id,index)=>db.prepare('INSERT INTO course_release_workbooks VALUES (?,?,?,?)').run('release:one',id,index+1,1));
 fixture={db,d1:null,accountStatus:{},studioAccess:true,beforeBatch:null,failStatement:null,batches:0,mutations:0};
 fixture.d1={
  prepare(sql){return {sql,values:[],bind(...values){this.values=values;return this;},
   async first(){return db.prepare(this.sql).get(...this.values)??null;},
   async all(){return {results:db.prepare(this.sql).all(...this.values)};},
   async run(){if(fixture.beforeBatch&&/^\s*(INSERT|UPDATE|DELETE)/i.test(this.sql)){const change=fixture.beforeBatch;fixture.beforeBatch=null;change(db);}fixture.mutations++;if(fixture.failStatement?.test(this.sql))throw Error('synthetic persistence failure');const result=db.prepare(this.sql).run(...this.values);return {success:true,meta:{changes:Number(result.changes)}};}
  };},
  async batch(statements){
   fixture.batches++;
   if(fixture.beforeBatch){const change=fixture.beforeBatch;fixture.beforeBatch=null;change(db);}
   db.exec('BEGIN');
   try{const results=[];for(const statement of statements){
    if(fixture.failStatement?.test(statement.sql))throw Error('synthetic persistence failure');
    const result=db.prepare(statement.sql).run(...statement.values);results.push({success:true,meta:{changes:Number(result.changes)}});
   }db.exec('COMMIT');return results;}catch(error){db.exec('ROLLBACK');throw error;}
  },
 };
 return db;
}
function state(db){return {
 release:db.prepare('SELECT * FROM course_releases WHERE id=?').get('release:one'),
 items:db.prepare('SELECT * FROM course_release_workbooks ORDER BY position').all(),
 reviews:db.prepare('SELECT * FROM course_release_reviews ORDER BY created_at').all(),
 snapshots:db.prepare('SELECT * FROM course_release_snapshots ORDER BY captured_at').all(),
 publications:db.prepare('SELECT * FROM education_publications ORDER BY updated_at').all(),
 audits:db.prepare('SELECT * FROM audit_events ORDER BY sequence').all(),
};}
const materialColumns=['id','course_id','organization_id','version','slug','title','summary','level','duration_label','outcomes_json','publisher_name','publisher_kind','visibility','access_model','price_minor','currency','enrolment_open','created_by'];
function expectedRevision(db){
 const row=db.prepare('SELECT * FROM course_releases WHERE id=?').get('release:one');
 const workbooks=db.prepare(`SELECT crw.workbook_id,crw.position,crw.required,w.version,w.status,m.course_id
   FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id
   JOIN modules m ON m.id=w.module_id WHERE crw.release_id=? ORDER BY crw.position,crw.workbook_id`).all('release:one')
  .map(item=>({id:String(item.workbook_id),version:Number(item.version),status:String(item.status),position:Number(item.position),required:Number(item.required),courseId:String(item.course_id)}));
 const material={schemaVersion:1,release:Object.fromEntries(materialColumns.map(key=>[key,row[key]])),workbooks};
 return createHash('sha256').update(JSON.stringify(material)).digest('hex');
}
async function revision(){
 const snapshot=await getStudioSnapshot(author);
 const release=snapshot.releases.find(item=>item.id==='release:one');
 assert.ok(release,'release is visible in real Studio snapshot');
 const expected=expectedRevision(fixture.db);
 if(!baseline){assert.match(release.materialRevision,/^[a-f0-9]{64}$/,'snapshot exposes a material revision');assert.equal(release.materialRevision,expected,'snapshot uses the explicit ordered material hash contract');}
 return expected;
}
async function input(extra={}){const row=fixture.db.prepare('SELECT status,version FROM course_releases WHERE id=?').get('release:one');return {releaseId:'release:one',expectedVersion:row.version,expectedStatus:row.status,expectedMaterialRevision:await revision(),...extra};}
async function rejectsStatus(promise,status){await assert.rejects(promise,error=>error instanceof EducationPlatformError&&error.status===status);}
function race(change){fixture.beforeBatch=change;}

test('submit requires a published workbook on the same course and records one atomic transition',async()=>{
 for(const items of [[],['workbook:other']]){const db=setup({items});try{
  const before=state(db);
  const studio=(await getStudioSnapshot(author)).releases.find(item=>item.id==='release:one');
  if(!baseline&&items.length)assert.equal(studio.materialRevision,null,'cross-course workbook has no material revision');
  await rejectsStatus(submitCourseRelease(author,{releaseId:'release:one',expectedVersion:4,expectedStatus:'draft',expectedMaterialRevision:'0'.repeat(64)}),409);
  assert.deepEqual(state(db),before);
 }finally{db.close();}}
 const db=setup();try{const expected=await input();await submitCourseRelease(author,expected);const after=state(db);
  assert.equal(after.release.status,'in-review');assert.equal(after.release.version,expected.expectedVersion);
  assert.equal(after.snapshots.length,1);assert.equal(after.audits.length,1);assert.equal(after.reviews.length,0);
 }finally{db.close();}
});

test('submit rejects stale version, status and material revision without side effects',async()=>{
 for(const stale of [{expectedVersion:3},{expectedStatus:'changes-requested'},{expectedMaterialRevision:'0'.repeat(64)},{expectedMaterialRevision:undefined}]){
  const db=setup();try{const before=state(db);await rejectsStatus(submitCourseRelease(author,await input(stale)),409);assert.deepEqual(state(db),before);}finally{db.close();}
 }
 const db=setup({status:'published'});try{const before=state(db);await rejectsStatus(submitCourseRelease(author,await input()),409);assert.deepEqual(state(db),before);}finally{db.close();}
});

test('review separates author and reviewer, validates notes length, and binds approval to ordered workbooks',async()=>{
 const db=setup({status:'in-review',items:['workbook:one','workbook:two']});try{
  const request=await input({decision:'approved',notes:'Looks ready for teaching.'});
  await rejectsStatus(reviewCourseRelease(author,request),403);
  await rejectsStatus(reviewCourseRelease(reviewer,{...request,notes:'x'.repeat(2001)}),422);
  assert.equal(state(db).reviews.length,0);
  await reviewCourseRelease(reviewer,request);
  const after=state(db);assert.equal(after.release.status,'approved');assert.equal(after.release.reviewed_by,reviewer.userId);
  assert.equal(after.release.version,request.expectedVersion);assert.equal(after.reviews.length,1);
  assert.equal(after.reviews[0].notes,request.notes);assert.equal(after.snapshots.length,2);
  const approval=after.snapshots.find(row=>row.reason.startsWith('approval:'));
  assert.ok(approval,'approval snapshot is revision bound');
  assert.match(approval.reason,/^approval:[a-f0-9]{64}:[a-f0-9-]{36}$/);
  const bound=JSON.parse(approval.snapshot_json);
  assert.equal(bound.schemaVersion,1);assert.equal(bound.materialRevision,approval.reason.split(':')[1]);
  assert.equal(bound.reviewId,approval.reason.split(':')[2]);
  assert.equal(bound.release.id,'release:one');
  assert.deepEqual(bound.workbooks.map(item=>item.id),['workbook:one','workbook:two']);
  assert.equal(after.audits.length,1);
  const studio=(await getStudioSnapshot(author)).releases.find(item=>item.id==='release:one');
  assert.equal(studio.approvalCurrent,true);
 }finally{db.close();}
});

test('requested changes can be submitted again; stale or unbound approval cannot publish',async()=>{
 const db=setup({status:'in-review'});try{
  await reviewCourseRelease(reviewer,await input({decision:'changes-requested',notes:'Please improve the teaching notes.'}));
  assert.equal(state(db).release.status,'changes-requested');
  await submitCourseRelease(author,await input());
  await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Approved after revision.'}));
  assert.equal(state(db).release.status,'approved');
  const approved=await input();
  db.prepare("UPDATE workbooks SET version=version+1 WHERE id='workbook:one'").run();
  const studio=(await getStudioSnapshot(author)).releases.find(item=>item.id==='release:one');
  assert.equal(studio.approvalCurrent,false);
  const before=state(db);
  await rejectsStatus(publishCourseRelease(admin,approved),409);
  assert.deepEqual(state(db),before);
 }finally{db.close();}
 const legacy=setup({status:'approved'});try{
  legacy.prepare('INSERT INTO course_release_reviews VALUES (?,?,?,?,?,?)').run(randomUUID(),'release:one',reviewer.userId,'approved','Legacy review','2026-01-01');
  const before=state(legacy);await rejectsStatus(publishCourseRelease(admin,await input()),409);assert.deepEqual(state(legacy),before);
 }finally{legacy.close();}
});

test('approved release can be explicitly re-reviewed and then published by an administrator',async()=>{
 const db=setup({status:'in-review'});try{
  await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Reviewed all teaching material.'}));
  await rejectsStatus(publishCourseRelease(reviewer,await input()),403);
  const before=state(db);
  await publishCourseRelease(admin,await input());
  const after=state(db);assert.equal(after.release.status,'published');assert.equal(after.publications.length,1);
  assert.equal(after.publications[0].status,'published');assert.equal(after.audits.length,2);
  const prior=after.snapshots.filter(row=>/^before-publish:[a-f0-9-]{36}$/.test(row.reason));
  assert.equal(prior.length,1);assert.deepEqual(JSON.parse(prior[0].snapshot_json),{...before.release});
 }finally{db.close();}
});

test('changed approved material requires a new independent approval before publication',async()=>{
 const db=setup({status:'in-review'});try{
  await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Initial independent approval.'}));
  const first=state(db).snapshots.find(row=>row.reason.startsWith('approval:'));
  db.prepare("UPDATE workbooks SET version=version+1 WHERE id='workbook:one'").run();
  await rejectsStatus(publishCourseRelease(admin,await input()),409);
  await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Re-reviewed the changed workbook.'}));
  const approvals=state(db).snapshots.filter(row=>row.reason.startsWith('approval:'));
  assert.equal(approvals.length,2);assert.notEqual(approvals[0].reason,approvals[1].reason);
  assert.equal(approvals[0].id,first.id,'old approval remains as immutable history');
  await publishCourseRelease(admin,await input());
  assert.equal(state(db).release.status,'published');
 }finally{db.close();}
});

test('legacy approved release becomes publishable only after an explicit independent re-review',async()=>{
 const db=setup({status:'approved'});try{
  db.prepare('INSERT INTO course_release_reviews VALUES (?,?,?,?,?,?)').run(randomUUID(),'release:one',reviewer.userId,'approved','Accepted synthetic review','2026-01-01');
  await rejectsStatus(publishCourseRelease(admin,await input()),409);
  await rejectsStatus(reviewCourseRelease(author,await input({decision:'approved',notes:'Author must not sign off.'})),403);
  await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Explicit independent re-review.'}));
  assert.equal(state(db).snapshots.filter(row=>row.reason.startsWith('approval:')).length,1);
  await publishCourseRelease(admin,await input());
  assert.equal(state(db).release.status,'published');
 }finally{db.close();}
});

test('removed or tampered approval proof blocks publication without partial writes',async()=>{
 const alterations=[
  db=>db.prepare("DELETE FROM course_release_reviews WHERE decision='approved'").run(),
  db=>db.prepare("UPDATE course_release_reviews SET notes='Tampered decision' WHERE decision='approved'").run(),
  db=>db.prepare("DELETE FROM course_release_snapshots WHERE reason LIKE 'approval:%'").run(),
  db=>db.prepare("UPDATE course_release_snapshots SET snapshot_json='{}' WHERE reason LIKE 'approval:%'").run(),
  db=>db.prepare("UPDATE course_release_snapshots SET captured_by='synthetic-author' WHERE reason LIKE 'approval:%'").run(),
 ];
 for(const alter of alterations){const db=setup({status:'in-review'});try{
  await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Approved after full review.'}));
  alter(db);const before=state(db);
  const studio=(await getStudioSnapshot(author)).releases.find(item=>item.id==='release:one');
  assert.equal(studio.approvalCurrent,false);
  await rejectsStatus(publishCourseRelease(admin,await input()),409);
  assert.deepEqual(state(db),before);
 }finally{db.close();}}
});

test('competing explicit re-review wins before BEGIN and cannot be double committed',async()=>{
 const db=setup({status:'approved'});try{
  const request=await input({decision:'approved',notes:'Our new review decision.'});let rivalState;
  race(database=>{
   const reviewId=randomUUID(),now='2026-02-02T00:00:00.000Z',notes='Rival independent decision.';
   database.prepare('UPDATE course_releases SET reviewed_by=?,review_notes=?,updated_at=? WHERE id=?').run(reviewer.userId,notes,now,'release:one');
   const release=database.prepare('SELECT * FROM course_releases WHERE id=?').get('release:one');
   const workbooks=database.prepare(`SELECT crw.workbook_id,crw.position,crw.required,w.version,w.status,m.course_id FROM course_release_workbooks crw JOIN workbooks w ON w.id=crw.workbook_id JOIN modules m ON m.id=w.module_id WHERE crw.release_id=? ORDER BY crw.position,crw.workbook_id`).all('release:one').map(item=>({id:String(item.workbook_id),version:Number(item.version),status:String(item.status),position:Number(item.position),required:Number(item.required),courseId:String(item.course_id)}));
   database.prepare('INSERT INTO course_release_reviews VALUES (?,?,?,?,?,?)').run(reviewId,'release:one',reviewer.userId,'approved',notes,now);
   database.prepare('INSERT INTO course_release_snapshots VALUES (?,?,?,?,?,?,?,?)').run(randomUUID(),'release:one',release.version,'approved',JSON.stringify({schemaVersion:1,materialRevision:request.expectedMaterialRevision,reviewId,release,workbooks}),`approval:${request.expectedMaterialRevision}:${reviewId}`,reviewer.userId,now);
   rivalState=state(database);
  });
  await rejectsStatus(reviewCourseRelease(reviewer,request),409);
  assert.ok(rivalState,'competing review was committed before BEGIN');
  assert.deepEqual(state(db),rivalState);
 }finally{db.close();}
});

test('pre-BEGIN competitors persist while stale workflow writes roll back',async()=>{
 const changes=[
  db=>db.prepare("UPDATE course_releases SET version=version+1 WHERE id='release:one'").run(),
  db=>db.prepare("UPDATE course_releases SET status='approved' WHERE id='release:one'").run(),
  db=>db.prepare("UPDATE workbooks SET version=version+1 WHERE id='workbook:one'").run(),
  db=>db.prepare("UPDATE workbooks SET status='draft' WHERE id='workbook:one'").run(),
  db=>db.prepare("UPDATE course_release_workbooks SET position=2 WHERE workbook_id='workbook:one'").run(),
  db=>db.prepare("UPDATE modules SET course_id='course:other' WHERE id='module:owned'").run(),
  db=>db.prepare("DELETE FROM course_ownership WHERE course_id='course:owned'").run(),
  db=>db.prepare("UPDATE account_security_profiles SET status='restricted' WHERE user_id='synthetic-author'").run(),
 ];
 for(const change of changes){const db=setup();try{const request=await input();let rivalState;race(database=>{change(database);rivalState=state(database);});await assert.rejects(submitCourseRelease(author,request));
  assert.ok(rivalState,'rival write was injected before BEGIN');
  const after=state(db);assert.deepEqual(after,rivalState,'workflow rollback retains only the rival write');
 }finally{db.close();}}
});

test('review and publish reject commit-time changes with no partial release effects',async()=>{
 const reviewChanges=[
  db=>db.prepare("UPDATE course_releases SET version=version+1 WHERE id='release:one'").run(),
  db=>db.prepare("UPDATE course_releases SET status='draft' WHERE id='release:one'").run(),
  db=>db.prepare("UPDATE workbooks SET version=version+1 WHERE id='workbook:one'").run(),
  db=>db.prepare("UPDATE users SET roles='learner' WHERE id='synthetic-reviewer'").run(),
 ];
 for(const change of reviewChanges){const db=setup({status:'in-review'});try{
  const request=await input({decision:'approved',notes:'Independent synthetic approval.'});let rivalState;
  race(database=>{change(database);rivalState=state(database);});
  await assert.rejects(reviewCourseRelease(reviewer,request));assert.ok(rivalState,'review race was injected');
  assert.deepEqual(state(db),rivalState);
 }finally{db.close();}}
 const publishChanges=[
  db=>db.prepare("UPDATE workbooks SET version=version+1 WHERE id='workbook:one'").run(),
  db=>db.prepare("UPDATE course_release_workbooks SET required=0 WHERE workbook_id='workbook:one'").run(),
  db=>db.prepare("UPDATE course_releases SET title='Rival title' WHERE id='release:one'").run(),
  db=>db.prepare("DELETE FROM course_ownership WHERE course_id='course:owned'").run(),
  db=>db.prepare("UPDATE account_security_profiles SET status='restricted' WHERE user_id='synthetic-admin'").run(),
  db=>db.prepare("UPDATE users SET roles='instructor' WHERE id='synthetic-admin'").run(),
 ];
 for(const change of publishChanges){const db=setup({status:'in-review'});try{
  await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Independent synthetic approval.'}));
  const request=await input();let rivalState;
  race(database=>{change(database);rivalState=state(database);});
  await assert.rejects(publishCourseRelease(admin,request));assert.ok(rivalState,'publish race was injected');
  assert.deepEqual(state(db),rivalState);
 }finally{db.close();}}
});

test('review and publication persistence failures roll back release, snapshot and audit together',async()=>{
 for(const [status,actor,run] of [
  ['draft',author,submitCourseRelease],
  ['in-review',reviewer,(auth,data)=>reviewCourseRelease(auth,{...data,decision:'approved',notes:'Approved teaching material.'})],
 ]){
  for(const pattern of [/INSERT INTO course_release_snapshots/i,/INSERT INTO course_release_reviews/i,/INSERT INTO audit_events/i]){
   if(status==='draft'&&/course_release_reviews/.test(pattern.source))continue;
   const db=setup({status});try{const before=state(db);fixture.failStatement=pattern;await assert.rejects(run(actor,await input()),/synthetic persistence failure/);assert.deepEqual(state(db),before);}finally{db.close();}
  }
 }
 for(const pattern of [/INSERT INTO course_release_snapshots/i,/INSERT INTO education_publications/i,/INSERT INTO audit_events/i]){
  const db=setup({status:'in-review'});try{
   await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Approved teaching material.'}));
   const before=state(db);fixture.failStatement=pattern;
   await assert.rejects(publishCourseRelease(admin,await input()),/synthetic persistence failure/);
   assert.deepEqual(state(db),before);
  }finally{db.close();}
 }
});

test('audit-head collision retries a single complete transition with a linked hash',async()=>{
 const db=setup();try{const request=await input();
  race(database=>database.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),1,'rival','rival-action','course-release','release:one','success','external','2026-01-02','external-head'));
  await submitCourseRelease(author,request);const after=state(db);
  assert.equal(after.release.status,'in-review');assert.equal(after.snapshots.length,1);assert.equal(after.audits.length,2);
  assert.equal(after.audits[1].sequence,2);
  const audit=after.audits[1];
  assert.equal(audit.integrity_hash,await seams.sha256(`external-head|2|${author.userId}|${audit.action}|course-release|release:one|success|${audit.reason}|${audit.occurred_at}`));
  assert.ok(fixture.batches<=5,'audit retry stays bounded');
 }finally{db.close();}
});

test('persisted CSV staff roles permit submit and independent review with exact role membership',async()=>{
 for(const roles of ['instructor','examiner','administrator','learner,instructor','instructor,examiner','learner,administrator']){
  const db=setup();try{
   db.prepare('UPDATE users SET roles=? WHERE id=?').run(roles,author.userId);
   await submitCourseRelease(author,await input());
   assert.equal(state(db).release.status,'in-review',`submit with ${roles}`);
   assert.equal(state(db).snapshots.length,1);
  }finally{db.close();}
  const reviewed=setup({status:'in-review'});try{
   reviewed.prepare('UPDATE users SET roles=? WHERE id=?').run(roles,reviewer.userId);
   await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Independent review of CSV role fixture.'}));
   assert.equal(state(reviewed).release.status,'approved',`review with ${roles}`);
   assert.equal(state(reviewed).reviews.length,1);
  }finally{reviewed.close();}
 }
});

test('only an exact CSV administrator role can publish an approved release',async()=>{
 for(const roles of ['administrator','instructor,administrator','learner,administrator']){
  const db=setup({status:'in-review'});try{
   await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Independent review before CSV role publication.'}));
   db.prepare('UPDATE users SET roles=? WHERE id=?').run(roles,admin.userId);
   await publishCourseRelease(admin,await input());
   assert.equal(state(db).release.status,'published',`publish with ${roles}`);
   assert.equal(state(db).publications.length,1);
  }finally{db.close();}
 }
 for(const roles of ['learner','instructor','examiner','administratorish','', 'learner,instructor']){
  const db=setup({status:'in-review'});try{
   await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Independent review before denied publication.'}));
   db.prepare('UPDATE users SET roles=? WHERE id=?').run(roles,admin.userId);
   const before=state(db);
   await rejectsStatus(publishCourseRelease(admin,await input()),403);
   assert.deepEqual(state(db),before,`denied publication with ${roles}`);
  }finally{db.close();}
 }
});

test('partial, unknown and empty CSV roles deny submit and review without writes',async()=>{
 for(const roles of ['learner','instruct','examiner2','administratorish','']){
  const db=setup();try{
   const request=await input();
   db.prepare('UPDATE users SET roles=? WHERE id=?').run(roles,author.userId);
   const before=state(db);
   await rejectsStatus(submitCourseRelease(author,request),403);
   assert.deepEqual(state(db),before,`denied submit with ${roles}`);
  }finally{db.close();}
  const dbReview=setup({status:'in-review'});try{
   dbReview.prepare('UPDATE users SET roles=? WHERE id=?').run(roles,reviewer.userId);
   const before=state(dbReview);
   await rejectsStatus(reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Must be denied.'})),403);
   assert.deepEqual(state(dbReview),before,`denied review with ${roles}`);
  }finally{dbReview.close();}
 }
});

test('CSV role revocation immediately before commit rejects each transition with no partial writes',async()=>{
 for(const [status,actor,run,roles] of [
  ['draft',author,submitCourseRelease,'learner'],
  ['draft',author,submitCourseRelease,'instructorish'],
  ['in-review',reviewer,(auth,data)=>reviewCourseRelease(auth,{...data,decision:'approved',notes:'Commit-time role check.'}),'learner'],
  ['in-review',reviewer,(auth,data)=>reviewCourseRelease(auth,{...data,decision:'approved',notes:'Commit-time role check.'}),'instruct,examinerish,administratorish'],
  ['approved',admin,publishCourseRelease,'instructor'],
  ['approved',admin,publishCourseRelease,'superadministrator'],
 ]){
  const db=setup({status:status==='approved'?'in-review':status});try{
   if(status==='approved')await reviewCourseRelease(reviewer,await input({decision:'approved',notes:'Independent approval before role revocation.'}));
   const request=await input();let rivalState;
   race(database=>{database.prepare('UPDATE users SET roles=? WHERE id=?').run(roles,actor.userId);rivalState=state(database);});
   await rejectsStatus(run(actor,request),403);
   assert.deepEqual(state(db),rivalState,`${status} revocation preserves only rival role change`);
   assert.equal(db.prepare('SELECT roles FROM users WHERE id=?').get(actor.userId).roles,roles,'competing role revocation remains persisted');
  }finally{db.close();}
 }
});
