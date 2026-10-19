import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash, randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {workbookWorkflowMaterialSql} from '../lib/workbook-workflow-material.ts';

// Real exported repository actions, native SQLite, and production CREATE TABLE SQL.
// Only Cloudflare bindings, identity, bootstrap, and publication-manifest storage
// are seams. No clinical data or network/database service is touched.
const site=resolve(import.meta.dirname,'..');
const frozen=process.env.VM_WORKBOOK_WORKFLOW_BASELINE==='1';
const checkpoint=resolve(site,'..','recovery','checkpoints','20261014-workbook-workflow-binding','before-owned');
const sourcePath=frozen?resolve(checkpoint,'source','lib','repository.ts'):resolve(site,'lib','repository.ts');
const source=readFileSync(sourcePath);
const sourceHash=createHash('sha256').update(source).digest('hex');
if(frozen){
 const manifest=JSON.parse(readFileSync(resolve(checkpoint,'manifest.json'),'utf8'));
 const entry=manifest.files.find(item=>item.path==='lib/repository.ts');
 assert.ok(entry,'frozen repository listed in manifest');
 assert.equal(source.length,entry.size,'frozen source size');
 assert.equal(sourceHash,entry.sha256,'frozen source SHA-256');
}
console.log(JSON.stringify({source:frozen?'manifest-verified before-owned repository':'current repository',sha256:sourceHash}));

let fixture;
let realManifestApi;
const author={userId:'synthetic-author',email:'author@example.invalid',displayName:'Author'};
const reviewer={userId:'synthetic-reviewer',email:'reviewer@example.invalid',displayName:'Reviewer'};
const admin={userId:'synthetic-admin',email:'admin@example.invalid',displayName:'Admin'};
const outsider={userId:'synthetic-outsider',email:'outsider@example.invalid',displayName:'Outsider'};
const actors=[author,reviewer,admin,outsider];
const seams={
 env:{get DB(){return fixture.d1;}},
 hasRole:(roles,...required)=>required.some(role=>roles.includes(role)),
 async ensureEducationUser(auth){return {roles:fixture.db.prepare('SELECT roles FROM users WHERE id=?').get(auth.userId)?.roles.split(',').filter(Boolean)??[]};},
 async ensurePlatformSchema(){},
 async getPlatformSnapshot(auth){return {entitlement:{studioAccess:fixture.studioAccess},organization:{id:fixture.org[auth.userId]??'org:owned',name:'Synthetic institution',kind:'institution',role:'owner'}};},
 safeText:(value,length=20_000)=>typeof value==='string'?value.replace(/\0/g,'').slice(0,length):'',
 sha256:async value=>createHash('sha256').update(value).digest('hex'),
 allowedTools:()=>[],
 decideWorkbookAuthoringAccess:({roles,studioAccess,activeOrganizationId,ownerOrganizationId})=>({allowed:studioAccess&&roles.some(role=>['instructor','examiner','administrator'].includes(role))&&activeOrganizationId===ownerOrganizationId}),
 groupEducationCaseQuestions:rows=>rows.map(row=>({caseId:row.caseId,questions:[{id:row.questionId,prompt:row.prompt,maxMarks:row.maxMarks}],maxMarks:row.maxMarks})),
 educationMediaReadiness:()=>({mediaReady:true}),
 educationGeometryForCase:()=>[{studyInstanceUid:'1.2.3.1',seriesInstanceUid:'1.2.3.2',frameOfReferenceUid:'1.2.3.3',plane:'axial',frames:[{sopInstanceUid:'1.2.3.4'}]}],
 educationWsiIdentifiersForCase:()=>({studyInstanceUid:'1.2.3.5',seriesInstanceUid:'1.2.3.6',frameOfReferenceUid:'1.2.3.7',sopInstanceUid:'1.2.3.8'}),
 async appendAudit(actorId,action,targetType,targetId,outcome,reason){
  const prior=fixture.db.prepare('SELECT sequence,integrity_hash FROM audit_events ORDER BY sequence DESC LIMIT 1').get();
  const sequence=(prior?.sequence??0)+1,at=new Date().toISOString();
  const hash=await seams.sha256(`${prior?.integrity_hash??'GENESIS'}|${sequence}|${actorId}|${action}|${targetType}|${targetId}|${outcome}|${reason}|${at}`);
  fixture.db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),sequence,actorId,action,targetType,targetId,outcome,reason,at,hash);
 },
 // Publication transport only; binding and D1 writes are production code.
 async buildAssessmentManifestFromDatabase(id,core,content){
  if(fixture.realManifest)return realManifestApi.buildAssessmentManifestFromDatabase(id,core,content);
  const manifestJson=JSON.stringify({schema:1,id,core,epoch:fixture.manifestEpoch});return {integrityHash:createHash('sha256').update(manifestJson).digest('hex'),manifestJson,manifest:{schema:1,assessment:{displayPolicy:{dualDisplayAllowed:false}}}};
 },
 EDUCATION_VIEWER_CORE_VERSION:'synthetic-core',
};
const imports={
 'cloudflare:workers':['env'], '@/lib/auth':['hasRole'], '@/db/bootstrap':['appendAudit','ensureEducationUser'],
 '@/db/platform':['ensurePlatformSchema','getPlatformSnapshot'],
 '@/lib/domain':['canTransitionAttempt','classifyTeachingContent','outcomeFor','safeText','sha256'],
 '@/lib/education-viewer-adapter':['educationGeometryForCase','educationWsiIdentifiersForCase'],
 '@/lib/teaching-polls':['validatePollDraft'], '@/lib/teaching-content':['validateTeachingContentBlock'],
 '@/lib/workbook-access':['canAccessPublishedWorkbook'], '@/lib/assignment-policy':['validateAssignmentWindow'],
 '@/lib/attempt-policy':['decideAttemptWrite'], '@/lib/education-role-projections':['educationSnapshotPermissions'],
 '@/lib/workbook-authoring-policy':['decideWorkbookAuthoringAccess'],
 '@/lib/education-case-grouping':['groupEducationCaseQuestions'],
 '@/lib/education-media-readiness':['educationMediaReadiness','requiresEducationPreflight'],
 '@/lib/assessment-manifest-store':['AssessmentVersionIntegrityError','buildAssessmentManifestFromDatabase','EDUCATION_VIEWER_CORE_VERSION','getVerifiedAssessmentManifest','manifestQuestions'],
 '@/lib/assessment-recovery':['ASSESSMENT_RECOVERY_EXCLUSIONS','ASSESSMENT_RECOVERY_TARGET_SCHEMA','assessmentRecoveryDraftTitle'],
};
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const built=await build({stdin:{contents:source.toString('utf8'),resolveDir:site,sourcefile:'lib/repository.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{
 name:'repository-workflow-seams',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path==='test-seams')return {path:args.path,external:true};
   if(args.path==='@/lib/workbook-workflow-material'||args.path==='./workbook-workflow-material.ts')return {path:resolve(site,'lib','workbook-workflow-material.ts')};
   if(args.path in imports)return {path:args.path,namespace:'seam'};
   throw Error(`Unexpected repository import: ${args.path}`);
  });
  b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seam from 'test-seams';\n${imports[args.path].map(name=>`export const ${name}=seam.${name};`).join('\n')}`,loader:'js'}));
 }
}]});
const exported={exports:{}};
new Function('module','exports','require',built.outputFiles[0].text)(exported,exported.exports,id=>{assert.equal(id,'test-seams');return seams;});
// A second isolated bundle uses the production manifest builder and validator.
// Repository workflow tests select it per fixture; the race matrix retains its
// deterministic transport seam so race assertions stay focused on SQL binding.
const realManifestBuilt=await build({stdin:{contents:'export {buildAssessmentManifestFromDatabase} from "@/lib/assessment-manifest-store"; export {parseAndVerifyAssessmentManifest} from "@/lib/assessment-manifest";',resolveDir:site,sourcefile:'tests/real-workbook-manifest.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{
 name:'real-manifest-dependencies',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path==='test-seams')return {path:args.path,external:true};
   if(args.path==='@/lib/assessment-manifest-store')return {path:resolve(site,'lib','assessment-manifest-store.ts')};
   if(args.path==='@/lib/assessment-manifest')return {path:resolve(site,'lib','assessment-manifest.ts')};
   if(args.path==='cloudflare:workers'||args.path==='@/lib/domain'||args.path==='@/lib/education-viewer-adapter')return {path:args.path,namespace:'seam'};
   throw Error(`Unexpected manifest import: ${args.path}`);
  });
  b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seam from 'test-seams';\n${(args.path==='cloudflare:workers'?['env']:args.path==='@/lib/domain'?['allowedTools','sha256']:['educationGeometryForCase','educationWsiIdentifiersForCase']).map(name=>`export const ${name}=seam.${name};`).join('\n')}`,loader:'js'}));
 }
}]});
const realManifestModule={exports:{}};
new Function('module','exports','require',realManifestBuilt.outputFiles[0].text)(realManifestModule,realManifestModule.exports,id=>{assert.equal(id,'test-seams');return seams;});
realManifestApi=realManifestModule.exports;
const {DomainError,getAuthoringAppSnapshot}=exported.exports;
// Frozen API accepted ID and optional decision/comment only. Remove only new
// binding fields so baseline calls execute old writes rather than fail on shape.
function inputForOld(input){const {expectedVersion,expectedStatus,expectedReviewRevision,expectedMaterialRevision,...old}=input;return old;}
const submit=(actor,input)=>exported.exports.requestWorkbookReview(actor,frozen?inputForOld(input):input);
const review=(actor,input)=>exported.exports.reviewWorkbook(actor,frozen?inputForOld(input):input);
const publish=(actor,input)=>exported.exports.publishWorkbook(actor,frozen?inputForOld(input):input);
for(const [name,fn] of Object.entries({submit,review,publish,getAuthoringAppSnapshot}))assert.equal(typeof fn,'function',`${name} is exported`);

const ddlFiles=[readFileSync(resolve(site,'db','bootstrap.ts'),'utf8'),readFileSync(resolve(site,'db','platform.ts'),'utf8')];
function createTable(db,name){
 const expression=new RegExp('`(CREATE TABLE IF NOT EXISTS '+name+' \\([^`]+\\))`');
 const sql=ddlFiles.map(content=>content.match(expression)?.[1]).find(Boolean);
 assert.ok(sql,`real DDL for ${name}`);db.exec(sql);
}
const tables=['users','account_security_profiles','courses','modules','workbooks','cases','workbook_cases','questions','workbook_draft_question_edits','teaching_notes','teaching_polls','teaching_content_blocks','rubrics','assessment_versions','workbook_authorship','workbook_reviews','workbook_recoveries','audit_events','organizations','organization_memberships','organization_entitlements','course_ownership'];
function setup({status='draft',mode='teaching',caseIds=['case:one'],authorId=author.userId}={}){
 const db=new DatabaseSync(':memory:');
 for(const table of tables)createTable(db,table);
 for(const actor of actors){
  const roles=actor===admin?['administrator']:actor===reviewer?['examiner']:actor===outsider?['instructor']:['instructor'];
  db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(actor.userId,actor.userId,actor.email,actor.displayName,roles.join(','),'2026-01-01','2026-01-01');
  db.prepare('INSERT INTO account_security_profiles VALUES (?,?,?,?,?,?,?,?,?,?)').run(actor.userId,'active','synthetic','2026-01-01','2026-01-01','v1','v1','2026-01-01','2026-01-01','2026-01-01');
 }
 db.prepare('INSERT INTO organizations VALUES (?,?,?,?,?,?)').run('org:owned','owned','Synthetic institution','institution','active','2026-01-01');
 db.prepare('INSERT INTO organizations VALUES (?,?,?,?,?,?)').run('org:other','other','Other institution','institution','active','2026-01-01');
 for(const actor of actors)db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?,?)').run(actor===outsider?'org:other':'org:owned',actor.userId,'owner','active','2026-01-01');
 for(const org of ['org:owned','org:other'])db.prepare('INSERT INTO organization_entitlements (organization_id,plan,learner_limit,educator_limit,storage_bytes,atlas_access,studio_access,reporting_access,embeds_access,status,valid_until,version,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(org,'light',10,10,1000000,1,1,0,0,'active',null,1,'2026-01-01');
 db.prepare('INSERT INTO courses VALUES (?,?,?,?,?)').run('course:owned','OWN','Owned course','Synthetic teaching','active');
 db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:owned','course:owned','Owned module',1);
 db.prepare('INSERT INTO course_ownership VALUES (?,?,?,?)').run('course:owned','org:owned',authorId,'2026-01-01');
 db.prepare('INSERT INTO workbooks (id,module_id,title,mode,version,status,duration_minutes,dual_display_allowed) VALUES (?,?,?,?,?,?,?,?)').run('workbook:one','module:owned','Synthetic workbook',mode,4,status,30,0);
 db.prepare('INSERT INTO workbook_authorship VALUES (?,?,?)').run('workbook:one',authorId,'2026-01-01');
 for(const [index,caseId] of caseIds.entries()){
  db.prepare('INSERT INTO cases VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(caseId,caseId,'radiology','published',1,'Synthetic description','dicom','[]','synthetic-hash',1,1);
  db.prepare('INSERT INTO workbook_cases VALUES (?,?,?)').run('workbook:one',caseId,index+1);
  db.prepare('INSERT INTO questions (id,case_id,prompt,max_marks,version,response_type,options_json,position) VALUES (?,?,?,?,?,?,?,?)').run(`question:${index}`,caseId,'Describe the synthetic finding',5,1,'long-text','[]',1);
  db.prepare('INSERT INTO rubrics VALUES (?,?,?,?,?)').run(`rubric:${index}`,`question:${index}`,1,'[{"label":"Finding","maxMarks":5,"order":1}]','published');
  db.prepare('INSERT INTO teaching_notes VALUES (?,?,?,?,?,?,?)').run(`note:${index}`,caseId,'Teaching note','Synthetic note','[]','Reveal',1);
 }
 if(caseIds.length){
  db.prepare('INSERT INTO teaching_content_blocks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run('block:one','workbook:one',caseIds[0],'text','Block','Synthetic content','',1,1,'draft',authorId,'2026-01-01','2026-01-01');
  db.prepare('INSERT INTO teaching_polls VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('poll:one','workbook:one',caseIds[0],'What finding?','single','[{"id":"a","label":"A"}]','["a"]','Explanation',1,1,'draft',authorId,'2026-01-01','2026-01-01');
 }
 fixture={db,d1:null,org:{[outsider.userId]:'org:other'},studioAccess:true,beforeBatch:null,failStatement:null,batches:0,mutations:0,manifestEpoch:0,realManifest:false};
 fixture.d1={
  prepare(sql){return {sql,values:[],bind(...values){this.values=values;return this;},
   async first(){return db.prepare(this.sql).get(...this.values)??null;},
   async all(){return {results:db.prepare(this.sql).all(...this.values)};},
   async run(){if(fixture.beforeBatch&&/^\s*(INSERT|UPDATE|DELETE)/i.test(this.sql)){const change=fixture.beforeBatch;fixture.beforeBatch=null;change(db);}fixture.mutations++;if(fixture.failStatement?.test(this.sql))throw Error('synthetic persistence failure');const result=db.prepare(this.sql).run(...this.values);return {success:true,meta:{changes:Number(result.changes)}};}
  };},
  async batch(statements){
   fixture.batches++;
   if(fixture.beforeBatch){const change=fixture.beforeBatch;fixture.beforeBatch=null;change(db);}
   db.exec('BEGIN');try{const results=[];for(const statement of statements){
    if(fixture.failStatement?.test(statement.sql))throw Error('synthetic persistence failure');
    if(/^\s*(SELECT|WITH)\b/i.test(statement.sql)){results.push({success:true,results:db.prepare(statement.sql).all(...statement.values),meta:{changes:0}});continue;}
    const result=db.prepare(statement.sql).run(...statement.values);results.push({success:true,meta:{changes:Number(result.changes)}});
   }db.exec('COMMIT');return results;}catch(error){db.exec('ROLLBACK');throw error;}
  },
 };
 return db;
}
function state(db){return {
 workbook:db.prepare("SELECT * FROM workbooks WHERE id='workbook:one'").get(),
 reviews:db.prepare('SELECT * FROM workbook_reviews ORDER BY revision').all(),
 versions:db.prepare('SELECT * FROM assessment_versions ORDER BY version').all(),
 audits:db.prepare('SELECT * FROM audit_events ORDER BY sequence').all(),
 blocks:db.prepare('SELECT * FROM teaching_content_blocks ORDER BY id').all(),
 polls:db.prepare('SELECT * FROM teaching_polls ORDER BY id').all(),
};}
async function binding(actor=author){
 const snapshot=await getAuthoringAppSnapshot(actor,'workbook:one');
 const workbook=snapshot.workbooks.find(item=>item.id==='workbook:one');
 assert.ok(workbook,'selected workbook appears in actual authoring snapshot');
 if(!frozen){
  const sql=workbookWorkflowMaterialSql('w.id',seams.EDUCATION_VIEWER_CORE_VERSION);
  const raw=fixture.db.prepare(`SELECT (${sql}) AS material_json FROM workbooks w WHERE w.id=?`).get('workbook:one').material_json;
  assert.equal(workbook.workflow?.materialRevision,createHash('sha256').update(raw).digest('hex'),'snapshot is SHA-256 of exact production SQL material');
 }
 return workbook;
}
async function input(extra={}){
 const row=fixture.db.prepare("SELECT status,version FROM workbooks WHERE id='workbook:one'").get();
 const latest=fixture.db.prepare("SELECT MAX(revision) AS revision FROM workbook_reviews WHERE workbook_id='workbook:one'").get();
 const shown=frozen?{}:await binding();
 return {action:'request-review',id:'workbook:one',expectedVersion:row.version,expectedStatus:row.status,expectedReviewRevision:latest.revision??0,expectedMaterialRevision:shown.workflow?.materialRevision??'0'.repeat(64),...extra};
}
async function rejectsStatus(promise,status){await assert.rejects(promise,error=>error instanceof DomainError&&error.status===status);}
function race(change){fixture.beforeBatch=change;}

test('material SQL covers ordered source and both guarded SQL identities',()=>{
 const db=setup({caseIds:['case:one','case:two']});try{
  const raw=()=>db.prepare(`SELECT (${workbookWorkflowMaterialSql('w.id',seams.EDUCATION_VIEWER_CORE_VERSION)}) AS value FROM workbooks w WHERE w.id=?`).get('workbook:one').value;
  const original=raw();
  const guarded=db.prepare(`SELECT (${workbookWorkflowMaterialSql('workbooks.id',seams.EDUCATION_VIEWER_CORE_VERSION)}) AS value FROM workbooks WHERE id=?`).get('workbook:one').value;
  assert.equal(guarded,original,'snapshot and guarded write use identical serialized content');
  for(const sql of [
   "UPDATE workbooks SET title='Retitled' WHERE id='workbook:one'",
   "UPDATE workbook_cases SET position=9 WHERE case_id='case:one'",
   "UPDATE cases SET publication_cleared=0 WHERE id='case:one'",
   "UPDATE questions SET prompt='New prompt' WHERE id='question:0'",
   "UPDATE rubrics SET criteria_json='[1]' WHERE id='rubric:0'",
   "INSERT INTO workbook_draft_question_edits VALUES ('workbook:one','question:0','Edited',1,'synthetic-author','2026-01-02')",
   "UPDATE teaching_notes SET body='Updated note' WHERE id='note:0'",
   "UPDATE teaching_content_blocks SET body='Updated block' WHERE id='block:one'",
   "UPDATE teaching_polls SET prompt='Updated poll' WHERE id='poll:one'",
  ]){
   db.exec('SAVEPOINT material');db.exec(sql);
   assert.notEqual(raw(),original,`material changes for ${sql}`);
   db.exec('ROLLBACK TO material');db.exec('RELEASE material');
  }
 }finally{db.close();}
});

test('authoring snapshot reads displayed content and binding in one SELECT batch',async()=>{
 const db=setup();try{
  const before=fixture.batches;
  const shown=await binding();
  assert.equal(fixture.batches-before,1,'one consistent D1 read batch');
  assert.equal(shown.workflow.reviewRevision,0);
  assert.deepEqual(Object.keys(shown.workflow).sort(),['approvalCurrent','materialRevision','reviewContent','reviewRevision','submissionCurrent']);
  assert.equal(shown.workflow.reviewContent.cases[0].id,'case:one');
  assert.equal(shown.workflow.reviewContent.blocks[0].body,'Synthetic content');
 }finally{db.close();}
});

test('submission binds a current snapshot and commits status plus audit atomically',async()=>{
 const db=setup();try{
  const request=await input();
  if(!frozen)assert.match(request.expectedMaterialRevision,/^[a-f0-9]{64}$/);
  const batchesBefore=fixture.batches;
  await submit(author,request);
  const after=state(db);assert.equal(after.workbook.status,'in-review');assert.equal(after.reviews.length,0);assert.equal(after.audits.length,1);
  const proof=JSON.parse(after.audits[0].reason);
  const expectedManifestHash=createHash('sha256').update(JSON.stringify({schema:1,id:'workbook:one',core:seams.EDUCATION_VIEWER_CORE_VERSION,epoch:0})).digest('hex');
  assert.deepEqual(proof,{schema:'vm-workbook-workflow-1',operation:'request-review',workbookId:'workbook:one',workbookVersion:4,reviewRevision:0,materialRevision:request.expectedMaterialRevision,authorId:author.userId,organizationId:'org:owned',manifestHash:expectedManifestHash});
  assert.ok(fixture.batches>batchesBefore,'workflow commits through a D1 batch');
 }finally{db.close();}
});

test('submission rejects missing cases and stale version, status, cycle, or material',async()=>{
 for(const cases of [[],['case:one']]){
  const db=setup({caseIds:cases});try{
   const base=await input();const candidates=cases.length?[{expectedVersion:3},{expectedVersion:undefined},{expectedStatus:'changes-requested'},{expectedStatus:undefined},{expectedReviewRevision:9},{expectedReviewRevision:undefined},{expectedMaterialRevision:'0'.repeat(64)},{expectedMaterialRevision:undefined}]:[{}];
   for(const change of candidates){const before=state(db);await rejectsStatus(submit(author,{...base,...change}),409);assert.deepEqual(state(db),before);}
  }finally{db.close();}
 }
});

test('independent review records bounded comment, a revision, and bound approval',async()=>{
 const db=setup();try{
  await submit(author,await input());
  const request=await input({action:'review',decision:'approved',comment:'Reviewed synthetic teaching material.'});
  const before=state(db);
  await rejectsStatus(review(author,request),403);assert.deepEqual(state(db),before);
  await rejectsStatus(review(reviewer,{...request,comment:'x'.repeat(2001)}),422);assert.deepEqual(state(db),before);
  await review(reviewer,request);
  const after=state(db);assert.equal(after.workbook.status,'approved');assert.equal(after.reviews.length,1);assert.equal(after.reviews[0].comment,request.comment);assert.equal(after.reviews[0].revision,1);assert.equal(after.audits.length,2);
  const proof=JSON.parse(after.audits[1].reason);
  assert.equal(proof.schema,'vm-workbook-workflow-1');assert.equal(proof.operation,'review');
  assert.equal(proof.materialRevision,request.expectedMaterialRevision);
  assert.equal(proof.reviewRevision,1);assert.equal(proof.workbookVersion,4);
  assert.equal(proof.reviewId,after.reviews[0].id);
  assert.equal(proof.commentHash,createHash('sha256').update(request.comment).digest('hex'));
  assert.match(proof.manifestHash,/^[a-f0-9]{64}$/);
 }finally{db.close();}
});

test('a change request can be resubmitted; stale review cycle and duplicate review lose',async()=>{
 const db=setup();try{
  await submit(author,await input());
  const first=await input({action:'review',decision:'changes-requested',comment:'Please revise the material.'});
  await review(reviewer,first);assert.equal(state(db).workbook.status,'changes-requested');
  await submit(author,await input());
  const before=state(db);
  await rejectsStatus(review(reviewer,first),409);assert.deepEqual(state(db),before);
  await review(reviewer,await input({action:'review',decision:'approved',comment:'Revision accepted.'}));
  assert.equal(state(db).reviews.length,2);
 }finally{db.close();}
});

test('publish needs an exact current independent approval; legacy approved state must be re-reviewed',async()=>{
 const legacy=setup({status:'approved'});try{const before=state(legacy);await rejectsStatus(publish(admin,await input({action:'publish'})),409);assert.deepEqual(state(legacy),before);}finally{legacy.close();}
 const db=setup();try{
  await submit(author,await input());await review(reviewer,await input({action:'review',decision:'approved',comment:'Approved.'}));
  const current=await input({action:'publish'});
  const before=state(db);db.prepare("UPDATE questions SET prompt='Changed after approval' WHERE id='question:0'").run();
  await rejectsStatus(publish(admin,current),409);assert.deepEqual(state(db).audits,before.audits);
  await review(reviewer,await input({action:'review',decision:'approved',comment:'Explicit independent re-review.'}));
  const approvedBinding=await input({action:'publish'});
  await publish(admin,approvedBinding);
  const after=state(db);assert.equal(after.workbook.status,'published');assert.equal(after.versions.length,1);assert.equal(after.audits.length,4);
  const publicationProof=JSON.parse(after.audits.at(-1).reason);
  assert.equal(publicationProof.schema,'vm-workbook-workflow-1');assert.equal(publicationProof.operation,'publish');
  assert.equal(publicationProof.manifestHash,after.versions[0].integrity_hash);
  assert.equal(publicationProof.materialRevision,approvedBinding.expectedMaterialRevision);
 }finally{db.close();}
});

test('author may publish only after a current independent approval',async()=>{
 const db=setup();try{
  await submit(author,await input());
  await review(reviewer,await input({action:'review',decision:'approved',comment:'Independent approval.'}));
  await publish(author,await input({action:'publish'}));
  assert.equal(state(db).workbook.status,'published');
  assert.equal(state(db).reviews[0].reviewer_id,reviewer.userId);
 }finally{db.close();}
});

test('approval needs a current submission proof; legacy in-review can request changes',async()=>{
 const db=setup({status:'in-review'});try{
  const before=state(db);
  await rejectsStatus(review(reviewer,await input({action:'review',decision:'approved',comment:'Cannot infer prior submission.'})),409);
  assert.deepEqual(state(db),before);
  await review(reviewer,await input({action:'review',decision:'changes-requested',comment:'Please resubmit with current material.'}));
  assert.equal(state(db).workbook.status,'changes-requested');
 }finally{db.close();}
});

test('review and publication reject missing or stale displayed bindings',async()=>{
 for(const phase of ['review','publish']){
  const db=setup();try{
   await submit(author,await input());
   if(phase==='publish')await review(reviewer,await input({action:'review',decision:'approved',comment:'Approved.'}));
   const base=await input(phase==='review'?{action:'review',decision:'approved',comment:'Independent approval.'}:{action:'publish'});
   for(const stale of [{expectedVersion:undefined},{expectedStatus:undefined},{expectedReviewRevision:undefined},{expectedMaterialRevision:undefined},{expectedVersion:9},{expectedReviewRevision:9},{expectedMaterialRevision:'0'.repeat(64)}]){
    const before=state(db);
    await rejectsStatus(phase==='review'?review(reviewer,{...base,...stale}):publish(admin,{...base,...stale}),409);
    assert.deepEqual(state(db),before);
   }
  }finally{db.close();}
 }
});

test('an absent author cannot be independently reviewed or re-reviewed',async()=>{
 for(const status of ['in-review','approved']){
  const db=setup({status});try{
   db.prepare("DELETE FROM workbook_authorship WHERE workbook_id='workbook:one'").run();
   const request=await input({action:'review',decision:'approved',comment:'A review needs a known author.'});
   const before=state(db);
   await rejectsStatus(review(reviewer,request),403);
   assert.deepEqual(state(db),before);
  }finally{db.close();}
 }
});

test('approval and publication reject a tampered or missing exact audit proof',async()=>{
 for(const phase of ['submission','approval']){
  const db=setup();try{
   await submit(author,await input());
   if(phase==='approval')await review(reviewer,await input({action:'review',decision:'approved',comment:'Approved.'}));
   const action=phase==='submission'?'workbook.review-requested':'workbook.review-approved';
   db.prepare('UPDATE audit_events SET reason=? WHERE action=?').run(JSON.stringify({schema:'vm-workbook-workflow-1',operation:phase==='submission'?'request-review':'review',materialRevision:'0'.repeat(64)}),action);
   const before=state(db);
   await rejectsStatus(phase==='submission'?review(reviewer,await input({action:'review',decision:'approved',comment:'No valid submission.'})):publish(admin,await input({action:'publish'})),409);
   assert.deepEqual(state(db),before);
  }finally{db.close();}
 }
});

test('publication requires the manifest hash approved by the independent reviewer',async()=>{
 const db=setup();try{
  await submit(author,await input());
  await review(reviewer,await input({action:'review',decision:'approved',comment:'Approved this manifest.'}));
  const request=await input({action:'publish'}),before=state(db);
  fixture.manifestEpoch=1;
  await rejectsStatus(publish(admin,request),409);
  assert.deepEqual(state(db),before,'manifest mismatch cannot publish or append audit');
 }finally{db.close();}
});

test('review preview redacts uncleared case source while preserving an unavailable placeholder',async()=>{
 const db=setup();try{
  db.prepare("UPDATE cases SET publication_cleared=0 WHERE id='case:one'").run();
  const shown=await binding();
  const preview=shown.workflow.reviewContent;
  assert.equal(preview.cases.length,1);assert.equal(preview.cases[0].unavailable,true);
  assert.equal(preview.cases[0].title,'Source unavailable for review');
  assert.equal(preview.cases[0].questions.length,0);
  assert.deepEqual(preview.notes,[]);assert.deepEqual(preview.blocks,[]);assert.deepEqual(preview.polls,[]);
  assert.ok(!JSON.stringify(preview).includes('Synthetic note'));
 }finally{db.close();}
});

test('source changes before BEGIN are rejected and rival writes survive rollback',async()=>{
 for(const change of [
  db=>db.prepare("UPDATE cases SET publication_cleared=0 WHERE id='case:one'").run(),
  db=>db.prepare("UPDATE questions SET prompt='Rival prompt' WHERE id='question:0'").run(),
  db=>db.prepare("UPDATE rubrics SET criteria_json='[{\"criterion\":\"rival\"}]' WHERE id='rubric:0'").run(),
  db=>db.prepare("UPDATE teaching_notes SET body='Rival note' WHERE id='note:0'").run(),
  db=>db.prepare("UPDATE teaching_content_blocks SET body='Rival block' WHERE id='block:one'").run(),
  db=>db.prepare("UPDATE teaching_polls SET prompt='Rival poll' WHERE id='poll:one'").run(),
 ]){
  const db=setup();try{const request=await input();race(change);await rejectsStatus(submit(author,request),409);assert.equal(state(db).workbook.status,'draft');assert.equal(state(db).audits.length,0);assert.equal(fixture.beforeBatch,null);}finally{db.close();}
 }
});

test('commit checks persisted account, exact CSV role and ownership; no transition leaks',async()=>{
 for(const change of [
  db=>db.prepare("UPDATE users SET roles='learner' WHERE id='synthetic-author'").run(),
  db=>db.prepare("UPDATE users SET roles='xinstructor' WHERE id='synthetic-author'").run(),
  db=>db.prepare("UPDATE account_security_profiles SET status='suspended' WHERE user_id='synthetic-author'").run(),
  db=>db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id='synthetic-author'").run(),
  db=>db.prepare("UPDATE organization_entitlements SET studio_access=0 WHERE organization_id='org:owned'").run(),
  db=>db.prepare("UPDATE course_ownership SET organization_id='org:other' WHERE course_id='course:owned'").run(),
 ]){
  const db=setup();try{const request=await input();race(change);await rejectsStatus(submit(author,request),/course_ownership/.test(change.toString())?404:403);assert.equal(state(db).workbook.status,'draft');assert.equal(state(db).audits.length,0);}finally{db.close();}
 }
 const db=setup();try{await rejectsStatus(submit(outsider,await input()),404);assert.equal(state(db).audits.length,0);}finally{db.close();}
});

test('batch failure rolls back status, review, publication and audit',async()=>{
 for(const failed of [/INSERT INTO audit_events/i,/INSERT INTO workbook_reviews/i,/UPDATE workbooks/i]){
  const db=setup();try{
   await submit(author,await input());const request=await input({action:'review',decision:'approved',comment:'Reviewed.'});
   const before=state(db);fixture.failStatement=failed;await assert.rejects(review(reviewer,request));assert.deepEqual(state(db),before);
  }finally{db.close();}
 }
 const db=setup();try{
  await submit(author,await input());await review(reviewer,await input({action:'review',decision:'approved',comment:'Reviewed.'}));
  const before=state(db);fixture.failStatement=/INSERT INTO assessment_versions/i;await assert.rejects(publish(admin,await input({action:'publish'})));assert.deepEqual(state(db),before);
 }finally{db.close();}
});

test('review rejects a concurrent decision, content change, and reviewer revocation at commit',async()=>{
 for(const change of [
  db=>db.prepare("INSERT INTO workbook_reviews VALUES ('rival-review','workbook:one','synthetic-admin','changes-requested','Rival decision',1,'2026-01-02')").run(),
  db=>db.prepare("UPDATE workbooks SET status='changes-requested' WHERE id='workbook:one'").run(),
  db=>db.prepare("UPDATE questions SET prompt='Changed during review' WHERE id='question:0'").run(),
  db=>db.prepare("UPDATE users SET roles='learner' WHERE id='synthetic-reviewer'").run(),
  db=>db.prepare("UPDATE account_security_profiles SET status='suspended' WHERE user_id='synthetic-reviewer'").run(),
  db=>db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id='synthetic-reviewer'").run(),
  db=>db.prepare("UPDATE organization_entitlements SET studio_access=0 WHERE organization_id='org:owned'").run(),
 ]){
  const db=setup();try{
   await submit(author,await input());const request=await input({action:'review',decision:'approved',comment:'Independent decision.'});
   const audits=state(db).audits;race(change);await rejectsStatus(review(reviewer,request),/roles|security_profiles|organization_memberships|organization_entitlements/.test(change.toString())?403:409);
   assert.deepEqual(state(db).audits,audits,'rival commit has no false audit');
   assert.equal(fixture.beforeBatch,null,'rival write ran before workflow BEGIN');
  }finally{db.close();}
 }
});

test('submission cannot clear a rival resubmission or publish after a status race',async()=>{
 const db=setup({status:'changes-requested'});try{
  const request=await input();
  race(database=>database.prepare("UPDATE workbooks SET status='in-review' WHERE id='workbook:one'").run());
  await rejectsStatus(submit(author,request),409);
  assert.equal(state(db).workbook.status,'in-review');assert.equal(state(db).audits.length,0);
 }finally{db.close();}
});

test('publication rolls back when source, review cycle, or audit changes before BEGIN',async()=>{
 for(const change of [
  db=>db.prepare("UPDATE workbooks SET version=version+1 WHERE id='workbook:one'").run(),
  db=>db.prepare("UPDATE teaching_content_blocks SET body='Updated block' WHERE id='block:one'").run(),
  db=>db.prepare("INSERT INTO workbook_reviews VALUES ('rival-review','workbook:one','synthetic-admin','approved','Rival review',2,'2026-01-03')").run(),
 ]){
  const db=setup();try{
   await submit(author,await input());await review(reviewer,await input({action:'review',decision:'approved',comment:'Approved.'}));
   const request=await input({action:'publish'}),audits=state(db).audits;
   race(change);await rejectsStatus(publish(admin,request),409);
   const after=state(db);assert.equal(after.workbook.status,'approved');assert.equal(after.versions.length,0);assert.deepEqual(after.audits,audits);
  }finally{db.close();}
 }
});

test('audit-head race retries in a bound and preserves the competing event',async()=>{
 const db=setup();try{
  const request=await input();
  race(database=>database.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run('rival-audit',1,'synthetic-admin','rival.action','workbook','workbook:one','success','rival','2026-01-01','rival-hash'));
  await submit(author,request);
  const audits=state(db).audits;assert.equal(audits.length,2);assert.equal(audits[0].id,'rival-audit');assert.equal(audits[1].sequence,2);
  assert.ok(fixture.batches<=7,'audit-head retry is bounded');
 }finally{db.close();}
});

test('review and publication recheck ownership, account and exact persisted role at commit',async()=>{
 for(const phase of ['review','publish'])for(const change of [
  db=>db.prepare("UPDATE course_ownership SET organization_id='org:other' WHERE course_id='course:owned'").run(),
  db=>db.prepare("UPDATE account_security_profiles SET status='suspended' WHERE user_id='synthetic-admin'").run(),
  db=>db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id='synthetic-admin'").run(),
  db=>db.prepare("UPDATE organization_entitlements SET studio_access=0 WHERE organization_id='org:owned'").run(),
  db=>db.prepare("UPDATE users SET roles='xadministrator' WHERE id='synthetic-admin'").run(),
 ]){
  const db=setup();try{
   await submit(author,await input());
   if(phase==='publish')await review(reviewer,await input({action:'review',decision:'approved',comment:'Approved.'}));
   const before=state(db),request=phase==='review'?await input({action:'review',decision:'approved',comment:'Independent decision.'}):await input({action:'publish'});
   race(change);
   await rejectsStatus(phase==='review'?review(admin,request):publish(admin,request),/course_ownership/.test(change.toString())?404:403);
   const after=state(db);assert.equal(after.workbook.status,before.workbook.status);assert.deepEqual(after.audits,before.audits);assert.deepEqual(after.versions,before.versions);
  }finally{db.close();}
 }
});

test('real manifest builder freezes edited prompt, case order, blocks and polls through publication',async()=>{
 const db=setup({caseIds:['case:one','case:two']});try{
  fixture.realManifest=true;
  db.prepare("UPDATE workbook_cases SET position=2 WHERE case_id='case:one'").run();
  db.prepare("UPDATE workbook_cases SET position=1 WHERE case_id='case:two'").run();
  db.prepare('INSERT INTO workbook_draft_question_edits VALUES (?,?,?,?,?,?)').run('workbook:one','question:0','Edited synthetic teaching prompt',1,author.userId,'2026-01-02');
  const raw=db.prepare(`SELECT (${workbookWorkflowMaterialSql('w.id',seams.EDUCATION_VIEWER_CORE_VERSION)}) AS value FROM workbooks w WHERE w.id=?`).get('workbook:one').value;
  const material=JSON.parse(raw);
  const content=material.blocks.map(b=>({id:b.id,case_id:b.caseId,type:b.type,title:b.title,body:b.body,url:b.url,position:b.position,version:b.version}));
  const polls=material.polls.map(p=>({id:p.id,case_id:p.caseId,prompt:p.prompt,selection_mode:p.selectionMode,options_json:p.optionsJson,correct_option_ids_json:p.correctOptionIdsJson,explanation:p.explanation,position:p.position,version:p.version}));
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)])):value;
  const digest=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
  await submit(author,await input());
  const requestProof=JSON.parse(state(db).audits.at(-1).reason);
  await review(reviewer,await input({action:'review',decision:'approved',comment:'Validated real synthetic manifest.'}));
  const approvalProof=JSON.parse(state(db).audits.at(-1).reason);
  assert.equal(approvalProof.manifestHash,requestProof.manifestHash);
  await publish(admin,await input({action:'publish'}));
  const stored=state(db).versions[0];assert.ok(stored,'actual assessment_versions row persists');
  const verified=await realManifestApi.parseAndVerifyAssessmentManifest(stored.manifest_json,stored.integrity_hash);
  assert.equal(stored.integrity_hash,approvalProof.manifestHash);
  assert.deepEqual(verified.cases.map(item=>item.id),['case:two','case:one']);
  assert.equal(verified.cases[1].questions[0].prompt,'Edited synthetic teaching prompt');
  assert.equal(verified.cases[1].questions[0].version,2);
  assert.equal(verified.supplementalIntegrity.teachingContentHash,digest(content));
  assert.equal(verified.supplementalIntegrity.teachingPollsHash,digest(polls));
  assert.match(stored.manifest_json,/didanix-education-assessment-manifest-v2/);
  await assert.rejects(realManifestApi.parseAndVerifyAssessmentManifest(stored.manifest_json.replace('Edited synthetic teaching prompt','Tampered prompt'),stored.integrity_hash));
 }finally{db.close();}
});

test('real manifest validator rejects an invalid marking rubric before submission atomically',async()=>{
 const db=setup();try{
  fixture.realManifest=true;
  db.prepare("UPDATE rubrics SET criteria_json='[]' WHERE id='rubric:0'").run();
  const request=await input(),before=state(db),batches=fixture.batches;
  await rejectsStatus(submit(author,request),422);
  assert.deepEqual(state(db),before);
  assert.equal(fixture.batches,batches+1,'only the read batch ran; no workflow mutation committed');
 }finally{db.close();}
});

test('orphan blocks, polls and question edits cannot enter a source-bound submission',async()=>{
 for(const kind of ['block','poll','question-edit']){
  const db=setup();try{
   fixture.realManifest=true;
   db.prepare('INSERT INTO cases VALUES (?,?,?,?,?,?,?,?,?,?,?)').run('case:orphan','Orphan case','radiology','published',1,'Not selected','dicom','[]','synthetic-hash',1,1);
   db.prepare('INSERT INTO questions (id,case_id,prompt,max_marks,version,response_type,options_json,position) VALUES (?,?,?,?,?,?,?,?)').run('question:orphan','case:orphan','Orphan question',5,1,'long-text','[]',1);
   if(kind==='block')db.prepare('INSERT INTO teaching_content_blocks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run('block:orphan','workbook:one','case:orphan','text','Orphan block','Must reject','',2,1,'draft',author.userId,'2026-01-01','2026-01-01');
   if(kind==='poll')db.prepare('INSERT INTO teaching_polls VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('poll:orphan','workbook:one','case:orphan','Orphan poll','single','[{"id":"a","label":"A"}]','["a"]','Must reject',2,1,'draft',author.userId,'2026-01-01','2026-01-01');
   if(kind==='question-edit')db.prepare('INSERT INTO workbook_draft_question_edits VALUES (?,?,?,?,?,?)').run('workbook:one','question:orphan','Orphan edit',1,author.userId,'2026-01-01');
   const request=await input(),before=state(db);
   await rejectsStatus(submit(author,request),422);
   assert.deepEqual(state(db),before,`${kind} leaves workflow and audit untouched`);
  }finally{db.close();}
 }
});

test('published workbook retains exact approved lesson blocks and polls in review preview',async()=>{
 const db=setup();try{
  const draft=await binding();
  const source=draft.workflow.reviewContent;
  await submit(author,await input());
  await review(reviewer,await input({action:'review',decision:'approved',comment:'Approved lesson content.'}));
  const approved=await binding();
  await publish(admin,await input({action:'publish'}));
  const published=await binding();
  assert.equal(published.status,'published');
  assert.equal(published.workflow.materialRevision,approved.workflow.materialRevision);
  assert.deepEqual(published.workflow.reviewContent.blocks,source.blocks);
  assert.deepEqual(published.workflow.reviewContent.polls,source.polls);
  assert.equal(published.workflow.approvalCurrent,true);
 }finally{db.close();}
});
