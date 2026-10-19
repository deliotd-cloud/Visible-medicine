import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash,randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const source=readFileSync(resolve(site,'lib/education-platform.ts'),'utf8');
const names={
 'cloudflare:workers':['env'],
 '@/lib/course-enrolment-policy':['INVITATION_SELF_ENROLMENT_ENABLED','INVITATION_SELF_ENROLMENT_HOLD_MESSAGE'],
 '@/db/bootstrap':['appendAudit','ensureDatabase','ensureEducationUser'],
 '@/db/platform':['ensurePlatformSchema','getPlatformSnapshot'],
 '@/lib/domain':['sha256'],
 '@/lib/studio-templates':['studioTemplate'],
 '@/lib/account-policy':['accountMayWrite','accountWriteBlockReason','CURRENT_PRIVACY_VERSION','CURRENT_TERMS_VERSION','learnerOnboardingStatus'],
 '@/lib/transactional-email':['courseEnrolmentEmail','getEmailProviderConfig','sendTransactionalEmail'],
};
const built=await build({stdin:{contents:source,resolveDir:site,sourcefile:'lib/education-platform.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{
 name:'synthetic-education-dependencies',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path in names)return{path:args.path,namespace:'seam'};
   if(args.path==='test-seams')return{path:args.path,external:true};
   if(args.path==='@/lib/auth')return{path:args.path,namespace:'seam'};
   if(['@/lib/workbook-eligibility','@/lib/workbook-access-policy'].includes(args.path))return {path:resolve(site,args.path.slice(2)+'.ts')};
   throw Error(`Unexpected import: ${args.path}`);
  });
  b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seam from 'test-seams';\n${(names[args.path]??[]).map(name=>`export const ${name}=seam.${name};`).join('\n')}`,loader:'js'}));
 }
}]});
let state;
const auth={userId:'synthetic-educator'};
const initial={id:'course:owned',code:'IMMUTABLE-CODE',title:'Original title',description:'Original description with enough detail.',status:'active',version:7};
const payload={courseId:initial.id,title:'Revised course title',description:'Revised description with enough detail.',expectedTitle:initial.title,expectedDescription:initial.description};
const seams={
 env:{get DB(){return state.db;}},
 async ensureEducationUser(){return{roles:state.roles,status:state.accountStatus};},
 async getPlatformSnapshot(){return{entitlement:{studioAccess:state.studioAccess},organization:{id:'org:owned'}};},
 accountMayWrite(status){return status==='active';},
 accountWriteBlockReason(){return'Account writes are disabled.';},
 async sha256(value){return createHash('sha256').update(value).digest('hex');},
};
const module={exports:{}};
new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
const {updateStudioCourse,EducationPlatformError}=module.exports;
assert.equal(typeof updateStudioCourse,'function');
console.log(JSON.stringify({actualSource:'lib/education-platform.ts',sha256:createHash('sha256').update(source).digest('hex'),syntheticDependencies:Object.keys(names)}));

function reset(){
 state={course:{...initial},releases:[{id:'release:one',title:'Published release',version:3}],ownership:'org:owned',roles:['instructor'],accountStatus:'active',studioAccess:true,audits:[],calls:[],failAudit:false,beforeBatch:null};
 state.db={
  prepare(sql){const statement={sql,values:[],bind(...values){this.values=values;return this;},
   async first(){state.calls.push({kind:'first',sql,values:this.values});
    if(sql.includes('FROM courses c JOIN course_ownership'))return state.course&&state.ownership===this.values[1]&&state.course.id===this.values[0]?{...state.course}:null;
    if(sql.includes('FROM audit_events ORDER BY sequence DESC')){const last=state.audits.at(-1);return last?{sequence:last.sequence,integrity_hash:last.integrityHash}:null;}
    if(sql.includes('FROM account_security_profiles WHERE user_id='))return{status:state.accountStatus};
    throw Error(`Unexpected first: ${sql}`);
   }};return statement;},
  async batch(statements){
   assert.equal(statements.length,2);
   const [update,audit]=statements;
   assert.match(update.sql,/UPDATE courses SET title=\?, description=\?/);
   assert.match(update.sql,/title=\? AND description=\? AND EXISTS/);
   assert.match(update.sql,/course_ownership WHERE course_id=\? AND organization_id=\?/);
   assert.match(update.sql,/account_security_profiles WHERE user_id=\? AND status='active'/);
   assert.match(audit.sql,/CASE WHEN changes\(\)=1/);
   assert.match(audit.sql,/ELSE NULL END/);
   state.calls.push({kind:'batch',statements:statements.map(({sql,values})=>({sql,values}))});
   if(state.beforeBatch){const effect=state.beforeBatch;state.beforeBatch=null;effect();}
   const [title,description,id,expectedTitle,expectedDescription,ownerId,organizationId,userId]=update.values;
   const matched=state.course?.id===id&&state.course.title===expectedTitle&&state.course.description===expectedDescription&&ownerId===id&&state.ownership===organizationId&&userId===auth.userId&&state.accountStatus==='active';
   const [auditId,sequence,actorId,action,targetId,prevSequence,prevHash,prevCount,reason,occurredAt,integrityHash]=audit.values;
   const targetType='course',outcome='success';
   const head=state.audits.at(-1);
   const headMatches=prevSequence===(head?.sequence??0)&&prevHash===(head?.integrityHash??'GENESIS')&&prevCount===(head?1:0);
   if(!matched||!headMatches||state.failAudit)throw Error(state.failAudit?'Synthetic audit insert failure':'Synthetic transaction guard failure');
   assert.equal(actorId,auth.userId);assert.equal(action,'studio.course-updated');assert.equal(targetType,'course');assert.equal(targetId,id);assert.equal(outcome,'success');assert.equal(reason,'organization=org:owned');
   assert.equal(sequence,(head?.sequence??0)+1);
   assert.equal(integrityHash,await seams.sha256(`${head?.integrityHash??'GENESIS'}|${sequence}|${actorId}|${action}|${targetType}|${targetId}|${outcome}|${reason}|${occurredAt}`));
   state.course={...state.course,title,description};
   state.audits.push({id:auditId,sequence,integrityHash});
   return[{meta:{changes:1}},{meta:{changes:1}}];
  }
 };
}
async function reject(input,status){await assert.rejects(updateStudioCourse(auth,input),error=>error instanceof EducationPlatformError&&error.status===status);}

test('updates only course text and appends one chain-compatible audit',async()=>{
 reset();assert.equal(await updateStudioCourse(auth,payload),initial.id);
 assert.equal(state.course.title,payload.title);assert.equal(state.course.description,payload.description);
 assert.equal(state.course.code,initial.code);assert.equal(state.course.status,initial.status);assert.equal(state.course.version,initial.version);
 assert.deepEqual(state.releases,[{id:'release:one',title:'Published release',version:3}]);
 assert.equal(state.audits.length,1);
});
test('trims new text without truncation; rejects invalid and missing fields',async()=>{
 reset();assert.equal(await updateStudioCourse(auth,{...payload,title:`  ${payload.title}  `,description:`  ${payload.description}  `}),initial.id);
 assert.equal(state.course.title,payload.title);assert.equal(state.course.description,payload.description);
 for(const change of [{title:'abc'},{title:'x'.repeat(161)},{description:'short'},{description:'x'.repeat(1201)},{title:33},{description:null},{expectedTitle:undefined},{expectedDescription:null},{courseId:null}]){
  reset();await reject({...payload,...change},422);assert.equal(state.audits.length,0);assert.deepEqual(state.course,initial);
 }
});
test('role, entitlement and account write gates deny before mutation',async()=>{
 for(const change of [{roles:['learner']},{studioAccess:false},{accountStatus:'suspended'}]){
  reset();Object.assign(state,change);await reject(payload,403);assert.equal(state.calls.some(call=>call.kind==='batch'),false);
 }
});
test('foreign course is 404 and cannot be changed',async()=>{
 reset();state.ownership='org:foreign';await reject(payload,404);assert.equal(state.audits.length,0);
});
test('stale baseline and concurrent edit are 409, preserving server version',async()=>{
 reset();state.course.title='Other educator title';await reject(payload,409);assert.equal(state.course.title,'Other educator title');
 reset();state.beforeBatch=()=>{state.course.title='Concurrent educator title';};await reject(payload,409);assert.equal(state.course.title,'Concurrent educator title');assert.equal(state.audits.length,0);
});
test('no-op is unaudited and replay after success conflicts',async()=>{
 reset();assert.equal(await updateStudioCourse(auth,{...payload,title:initial.title,description:initial.description}),initial.id);assert.equal(state.audits.length,0);
 assert.equal(await updateStudioCourse(auth,payload),initial.id);await reject(payload,409);assert.equal(state.audits.length,1);
});
test('audit failure rolls back update',async()=>{
 reset();state.failAudit=true;await assert.rejects(updateStudioCourse(auth,payload),/Synthetic audit insert failure/);
 assert.deepEqual(state.course,initial);assert.equal(state.audits.length,0);
});
test('account revocation at write time rolls back the batch',async()=>{
 reset();state.beforeBatch=()=>{state.accountStatus='restricted';};await reject(payload,403);
 assert.deepEqual(state.course,initial);assert.equal(state.audits.length,0);
});
test('SQL-shaped title remains ordinary bound course text',async()=>{
 reset();const title="Safe title'); UPDATE course_releases SET status='published'; --";
 assert.equal(await updateStudioCourse(auth,{...payload,title}),initial.id);
 assert.equal(state.course.title,title);assert.deepEqual(state.releases,[{id:'release:one',title:'Published release',version:3}]);
});
test('concurrent audit head retries without breaking chain',async()=>{
 reset();state.beforeBatch=()=>state.audits.push({id:randomUUID(),sequence:1,integrityHash:'external-head'});
 assert.equal(await updateStudioCourse(auth,payload),initial.id);assert.equal(state.audits.length,2);assert.equal(state.audits[1].sequence,2);
});

function sqlFixture(){
 reset();
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE courses (id TEXT PRIMARY KEY, code TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL);
 CREATE TABLE course_ownership (course_id TEXT NOT NULL, organization_id TEXT NOT NULL);
 CREATE TABLE account_security_profiles (user_id TEXT PRIMARY KEY, status TEXT NOT NULL);
 CREATE TABLE audit_events (id TEXT PRIMARY KEY, sequence INTEGER NOT NULL UNIQUE, actor_id TEXT NOT NULL, action TEXT NOT NULL,
   target_type TEXT NOT NULL, target_id TEXT NOT NULL, outcome TEXT NOT NULL, reason TEXT NOT NULL,
   occurred_at TEXT NOT NULL, integrity_hash TEXT NOT NULL);`);
 db.prepare('INSERT INTO courses VALUES (?, ?, ?, ?, ?, ?)').run(initial.id,initial.code,initial.title,initial.description,initial.status,initial.version);
 db.prepare('INSERT INTO course_ownership VALUES (?, ?)').run(initial.id,'org:owned');
 db.prepare('INSERT INTO account_security_profiles VALUES (?, ?)').run(auth.userId,'active');
 const sqlDb={
  prepare(sql){return{sql,values:[],bind(...values){this.values=values;return this;},
   async first(){return db.prepare(this.sql).get(...this.values)??null;}};},
  async batch(statements){
   if(state.sqlBeforeBatch){const effect=state.sqlBeforeBatch;state.sqlBeforeBatch=null;effect(db);}
   db.exec('BEGIN');
   try{
    const results=statements.map(statement=>{
     const result=db.prepare(statement.sql).run(...statement.values);
     return{success:true,meta:{changes:Number(result.changes)}};
    });
    db.exec('COMMIT');return results;
   }catch(error){state.sqlFailures??=[];state.sqlFailures.push(error.message);db.exec('ROLLBACK');throw error;}
  }
 };
 state.db=sqlDb;
 return db;
}
function sqlCourse(db){return db.prepare('SELECT * FROM courses WHERE id=?').get(initial.id);}
function sqlAudits(db){return db.prepare('SELECT * FROM audit_events ORDER BY sequence').all();}

test('native SQLite: exact UPDATE and audit SQL commit with valid integrity hash',async()=>{
 const db=sqlFixture();
 try{
  assert.equal(await updateStudioCourse(auth,payload),initial.id);
  const course=sqlCourse(db);assert.equal(course.title,payload.title);assert.equal(course.description,payload.description);
  assert.equal(course.code,initial.code);assert.equal(course.status,initial.status);assert.equal(course.version,initial.version);
  const [audit]=sqlAudits(db);assert.equal(sqlAudits(db).length,1);assert.equal(audit.sequence,1);assert.equal(audit.action,'studio.course-updated');
  assert.equal(audit.integrity_hash,await seams.sha256(`GENESIS|1|${auth.userId}|studio.course-updated|course|${initial.id}|success|organization=org:owned|${audit.occurred_at}`));
 }finally{db.close();}
});
test('native SQLite: stale edit between read and batch rolls back audit and update',async()=>{
 const db=sqlFixture();
 try{
  state.sqlBeforeBatch=database=>database.prepare('UPDATE courses SET title=? WHERE id=?').run('Concurrent title',initial.id);
  await reject(payload,409);assert.equal(sqlCourse(db).title,'Concurrent title');assert.equal(sqlAudits(db).length,0);
  assert.match(state.sqlFailures[0],/NOT NULL constraint failed: audit_events.reason/);
 }finally{db.close();}
});
test('native SQLite: failed audit constraint rolls back the prior course UPDATE',async()=>{
 const db=sqlFixture();
 try{
  db.exec(`CREATE TRIGGER reject_course_audit BEFORE INSERT ON audit_events
    WHEN NEW.action='studio.course-updated' BEGIN SELECT RAISE(ABORT, 'synthetic audit rejection'); END;`);
  await assert.rejects(updateStudioCourse(auth,payload),/synthetic audit rejection/);
  assert.deepEqual({...sqlCourse(db)},initial);assert.equal(sqlAudits(db).length,0);
 }finally{db.close();}
});
test('native SQLite: account restriction between preflight and batch prevents commit',async()=>{
 const db=sqlFixture();
 try{
  state.sqlBeforeBatch=database=>database.prepare('UPDATE account_security_profiles SET status=? WHERE user_id=?').run('restricted',auth.userId);
  await reject(payload,403);assert.deepEqual({...sqlCourse(db)},initial);assert.equal(sqlAudits(db).length,0);
  assert.match(state.sqlFailures[0],/NOT NULL constraint failed: audit_events.reason/);
 }finally{db.close();}
});
test('native SQLite: audit sequence collision rolls back first attempt and retries from new head',async()=>{
 const db=sqlFixture();
 try{
  state.sqlBeforeBatch=database=>database.prepare(`INSERT INTO audit_events
    (id,sequence,actor_id,action,target_type,target_id,outcome,reason,occurred_at,integrity_hash)
    VALUES (?,1,?,'other-action','course',?,'success','external','2026-10-10T00:00:00.000Z',?)`)
    .run(randomUUID(),'other-actor',initial.id,'external-head');
  assert.equal(await updateStudioCourse(auth,payload),initial.id);
  const audits=sqlAudits(db);assert.equal(audits.length,2);assert.equal(audits[0].sequence,1);assert.equal(audits[1].sequence,2);
  assert.equal(audits[1].integrity_hash,await seams.sha256(`external-head|2|${auth.userId}|studio.course-updated|course|${initial.id}|success|organization=org:owned|${audits[1].occurred_at}`));
  assert.equal(sqlCourse(db).title,payload.title);
 }finally{db.close();}
});
