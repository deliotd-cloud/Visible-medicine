import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';

const site=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const source=readFileSync(resolve(site,'lib/workbook-correction-repository.ts'),'utf8');
console.log(JSON.stringify({source:'lib/workbook-correction-repository.ts',sha256:createHash('sha256').update(source).digest('hex'),mode:'production SQL and DDL in native SQLite'}));
const digest=value=>createHash('sha256').update(value).digest('hex');
const media={kind:'dicom',overview:false,series:[{order:1,studyInstanceUid:'1.2.3',seriesInstanceUid:'1.2.3.4',frameOfReferenceUid:'1.2.3.5',plane:'axial',frameCount:1,sopInstanceUids:['1.2.3.6']}]};
let fixture;
const seams={
  env:{get DB(){return fixture.d1;}},
  async ensureEducationUser(auth){const row=fixture.db.prepare('SELECT roles FROM users WHERE id=?').get(auth.userId);return{roles:row?.roles.split(',')??[],status:fixture.db.prepare('SELECT status FROM account_security_profiles WHERE user_id=?').get(auth.userId)?.status??'absent'};},
  async appendAudit(){},
  async getPlatformSnapshot(auth){return{organization:{id:fixture.orgs[auth.userId]??'org:owned'},entitlement:{studioAccess:fixture.studio}};},
  assessmentMediaForCase(){return fixture?.media??media;},
  sha256:async value=>digest(value),
  lectureSlideAnatomyReferences:slide=>slide.anatomyReference?[slide.anatomyReference]:slide.anatomyReferences??[],
  resolveLectureAnatomyReference:()=>null,
  async canAccessPublishedWorkbook(){return false;},
};
const seamImports={
  'cloudflare:workers':['env'],'@/db/bootstrap':['ensureEducationUser','appendAudit'],'@/db/platform':['getPlatformSnapshot'],
  '@/lib/assessment-manifest-store':['assessmentMediaForCase'],'@/lib/domain':['sha256'],
  '@/lib/workbook-access':['canAccessPublishedWorkbook'],
  './domain.ts':['sha256'],'./domain':['sha256'],
};
const built=await build({stdin:{contents:"export * from './lib/workbook-correction-repository.ts'; export * from './lib/workbook-correction-lineage-repository.ts';",resolveDir:site,sourcefile:'lineage-test-entry.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'seams',setup(builder){
  builder.onResolve({filter:/.*/},args=>{
    if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
    if(seamImports[args.path])return{path:args.path,namespace:'seam'};
    if(args.path.startsWith('@/'))return{path:resolve(site,args.path.slice(2))+'.ts'};
    return null;
  });
  builder.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${seamImports[args.path].map(name=>`export const ${name}=seams.${name};`).join('\n')}`,loader:'js'}));
}}]});
const module={exports:{}};
new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
const {getWorkbookCorrectionSource,createStudioWorkbookCorrection,lookupStudioWorkbookCorrection,getStudioWorkbookCorrectionLineage}=module.exports;
const manifestBuild=await build({entryPoints:[resolve(site,'lib/assessment-manifest.ts'),resolve(site,'lib/lecture-manifest.ts'),resolve(site,'lib/workbook-correction-contract.ts')],bundle:true,platform:'node',format:'cjs',outdir:'x',write:false,logLevel:'silent',plugins:[{name:'manifest-seams',setup(builder){
  builder.onResolve({filter:/^(?:@\/lib\/domain|\.\/domain\.ts)$/},args=>({path:'domain',namespace:'seam'}));
  builder.onResolve({filter:/.*/},args=>{if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};return null;});
  builder.onLoad({filter:/.*/,namespace:'seam'},()=>({contents:"import seams from 'test-seams'; export const sha256=seams.sha256;",loader:'js'}));
}}]});
const manifests=manifestBuild.outputFiles.map(file=>{const m={exports:{}};new Function('module','exports','require',file.text)(m,m.exports,id=>{assert.equal(id,'test-seams');return seams;});return m.exports;});
const assessment=manifests.find(x=>x.createAssessmentManifestRecord),lecture=manifests.find(x=>x.createLectureManifestRecord);
const {parseWorkbookCorrectionReceipt}=manifests.find(x=>x.parseWorkbookCorrectionReceipt);
const ddl=[readFileSync(resolve(site,'db/bootstrap.ts'),'utf8'),readFileSync(resolve(site,'db/platform.ts'),'utf8'),readFileSync(resolve(site,'db/lecture.ts'),'utf8')];
function table(db,name){const pattern=new RegExp('`(CREATE TABLE IF NOT EXISTS '+name+' \\([^`]+\\))`');const sql=ddl.map(s=>s.match(pattern)?.[1]).find(Boolean);assert.ok(sql,`production DDL ${name}`);db.exec(sql);}
const names=['users','account_security_profiles','organizations','organization_memberships','organization_entitlements','courses','modules','course_ownership','workbooks','workbook_authorship','cases','workbook_cases','questions','rubrics','workbook_draft_question_edits','teaching_content_blocks','teaching_polls','lecture_drafts','lecture_reviews','assessment_versions','lecture_versions','audit_events','workbook_assignments','cohorts','cohort_workbook_assignments','attempts','submissions','marks','results','workbook_progress'];
const author={userId:'synthetic-author'}, outsider={userId:'synthetic-outsider'};
function adapter(db){return{
  prepare(sql){return{sql,values:[],bind(...values){if(fixture?.enforceD1ValueLimit){assert(Buffer.byteLength(sql)<=100_000);assert(values.length<=100);for(const value of values)checkD1Value(value,'bound');}this.values=values;return this;},async first(){
    if(sql.startsWith('SELECT w.id,w.module_id,w.title') && fixture.beforeVerifierSource){const f=fixture.beforeVerifierSource;fixture.beforeVerifierSource=null;f(db);}
    if(sql.startsWith('SELECT 1 AS allowed FROM workbooks d') && fixture.beforeFinal){const f=fixture.beforeFinal;fixture.beforeFinal=null;f(db);}
    if(fixture.readOnly) assert.match(sql.trim(),/^SELECT/i);
    if(sql.includes('a.id AS event_id') && fixture.beforeLookup){const f=fixture.beforeLookup;fixture.beforeLookup=null;f(db);}
    const row=db.prepare(sql).get(...this.values)??null;if(row&&fixture.enforceD1ValueLimit)checkD1Row(row);return row;
  },async all(){if(fixture.readOnly) assert.match(sql.trim(),/^SELECT/i);const results=db.prepare(sql).all(...this.values);if(fixture.enforceD1ValueLimit)for(const row of results)checkD1Row(row);return{results};}};},
  async batch(statements){assert.ok(!fixture.readOnly);fixture.batches++;if(fixture.beforeBatch){const f=fixture.beforeBatch;fixture.beforeBatch=null;f(db);}db.exec('BEGIN');try{const result=[];for(const [i,s] of statements.entries()){if(fixture.failStage===i)throw Error('SYNTHETIC_BATCH_FAILURE');const changed=db.prepare(s.sql).run(...s.values);result.push({meta:{changes:Number(changed.changes)}});}db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}
};}
function checkD1Value(value,kind){
  const bytes=typeof value==='string'?Buffer.byteLength(value):value instanceof Uint8Array?value.byteLength:0;
  const key=kind==='bound'?'maxBoundValueBytes':'maxResultValueBytes';fixture[key]=Math.max(fixture[key]??0,bytes);
  if(bytes>2_000_000)throw new RangeError('SYNTHETIC_D1_VALUE_LIMIT');
}
// Synthetic byte-content guard, not a hosted-D1 or exact SQLite record-size proof.
// Strings, BLOBs and rows are separately limited in the current D1 docs.
function checkD1Row(row){
  let bytes=0;
  for(const value of Object.values(row)){
    checkD1Value(value,'result');
    bytes+=typeof value==='string'?Buffer.byteLength(value):value instanceof Uint8Array?value.byteLength:typeof value==='number'||typeof value==='bigint'?8:0;
  }
  fixture.maxResultRowContentBytes=Math.max(fixture.maxResultRowContentBytes??0,bytes);
  assert(bytes<2_000_000,'synthetic row content must leave room for SQLite record overhead');
}
const oldPin={kind:'head-concept-v1',conceptId:'old-educational-pin',headRevision:'a'.repeat(64),atlasTarget:'/atlas/head-neck-3d?concept=old-educational-pin'};
async function setup(mode='assessment',{stalePin=false}={}){
  const db=new DatabaseSync(':memory:');for(const name of names)table(db,name);
  for(const actor of [author,outsider,{userId:'synthetic-learner'}]){
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(actor.userId,actor.userId,`${actor.userId}@example.invalid`,actor.userId,actor.userId==='synthetic-learner'?'learner':'instructor','2026-01-01','2026-01-01');
    db.prepare('INSERT INTO account_security_profiles VALUES (?,?,?,?,?,?,?,?,?,?)').run(actor.userId,'active','synthetic','2026-01-01','2026-01-01','v1','v1','2026-01-01','2026-01-01','2026-01-01');
  }
  for(const org of ['org:owned','org:other']){
    db.prepare('INSERT INTO organizations VALUES (?,?,?,?,?,?)').run(org,org,org,'institution','active','2026-01-01');
    db.prepare('INSERT INTO organization_entitlements (organization_id,plan,learner_limit,educator_limit,storage_bytes,atlas_access,studio_access,reporting_access,embeds_access,status,valid_until,version,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(org,'light',10,10,1000000,1,1,0,0,'active',null,1,'2026-01-01');
  }
  for(const [user,org] of [[author.userId,'org:owned'],[outsider.userId,'org:other']])db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?,?)').run(org,user,'owner','active','2026-01-01');
  db.prepare('INSERT INTO courses VALUES (?,?,?,?,?)').run('course:one','ONE','Synthetic course','Description','active');
  db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:one','course:one','Synthetic module',1);
  db.prepare('INSERT INTO course_ownership VALUES (?,?,?,?)').run('course:one','org:owned',author.userId,'2026-01-01');
  db.prepare('INSERT INTO workbooks (id,module_id,title,mode,version,status,duration_minutes,dual_display_allowed) VALUES (?,?,?,?,?,?,?,?)').run('workbook:one','module:one','Synthetic workbook',mode,4,'published',mode==='assessment'?30:0,0);
  db.prepare('INSERT INTO workbook_authorship VALUES (?,?,?)').run('workbook:one',outsider.userId,'2026-01-01');
  fixture={db,d1:adapter(db),beforeBatch:null,failStage:null,batches:0,orgs:{[outsider.userId]:'org:other'},studio:true};
  let hash;
  if(mode==='lecture'){
    const record=await lecture.createLectureManifestRecord({schema:'visible-medicine-lecture-v1',product:'Visible Medicine',intendedPurpose:'education-only',workbook:{id:'workbook:one',title:'Synthetic workbook',mode,version:4},slides:[{id:'slide-one',title:'Synthetic slide',body:'Teaching text',referenceUrl:'',...(stalePin?{anatomyReference:oldPin}:{})}]});
    hash=record.integrityHash;
    db.prepare('INSERT INTO lecture_versions VALUES (?,?,?,?,?,?)').run('lecture:one','workbook:one',4,hash,record.manifestJson,'2026-01-01');
    db.prepare('INSERT INTO lecture_drafts VALUES (?,?,?,?)').run('workbook:one','[]',hash,'2026-01-01');
  }else{
    db.prepare('INSERT INTO cases VALUES (?,?,?,?,?,?,?,?,?,?,?)').run('case:one','Synthetic case','radiology','published',1,'Case description','dicom','[]','case-publication-hash',1,1);
    db.prepare('INSERT INTO workbook_cases VALUES (?,?,?)').run('workbook:one','case:one',1);
    db.prepare('INSERT INTO questions (id,case_id,prompt,max_marks,version,response_type,options_json,position) VALUES (?,?,?,?,?,?,?,?)').run('question:one','case:one','Current mutable prompt',10,1,'long-text','[]',1);
    db.prepare('INSERT INTO rubrics VALUES (?,?,?,?,?)').run('rubric:one','question:one',1,JSON.stringify([{label:'Clarity',maxMarks:10,order:1}]),'published');
    db.prepare('INSERT INTO workbook_draft_question_edits VALUES (?,?,?,?,?,?)').run('workbook:one','question:one','Stale mutable draft prompt',3,outsider.userId,'2026-01-01');
    let content=[],polls=[];
    if(mode==='teaching'){
      db.prepare('INSERT INTO teaching_content_blocks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run('block:one','workbook:one','case:one','text','Teaching heading','Teaching body','',1,4,'published',outsider.userId,'2026-01-01','2026-01-01');
      db.prepare('INSERT INTO teaching_polls VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('poll:one','workbook:one','case:one','Synthetic poll','single','[]','[]','Explanation',1,4,'published',outsider.userId,'2026-01-01','2026-01-01');
      content=[{id:'block:one',case_id:'case:one',type:'text',title:'Teaching heading',body:'Teaching body',url:'',position:1,version:4}];
      polls=[{id:'poll:one',case_id:'case:one',prompt:'Synthetic poll',selection_mode:'single',options_json:'[]',correct_option_ids_json:'[]',explanation:'Explanation',position:1,version:4}];
    }
    const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,canonical(x)])):v;
    const record=await assessment.createAssessmentManifestRecord({schema:'didanix-education-assessment-manifest-v2',product:'Visible Medicine',intendedPurpose:'education-only',workbook:{id:'workbook:one',title:'Synthetic workbook',mode,version:4},assessment:{durationMinutes:mode==='assessment'?30:0,displayPolicy:{dualDisplayAllowed:false}},viewer:{coreVersion:'synthetic-viewer'},supplementalIntegrity:{teachingContentHash:digest(JSON.stringify(canonical(content))),teachingPollsHash:digest(JSON.stringify(canonical(polls)))},cases:[{id:'case:one',title:'Synthetic case',description:'Case description',classification:'radiology',version:1,visualKind:'dicom',tools:[],publicationHash:'case-publication-hash',order:1,media,questions:[{id:'question:one',prompt:'Immutable published prompt',responseType:'long-text',options:[],maxMarks:10,order:1,version:4,rubric:{version:1,maxMarks:10,criteria:[{label:'Clarity',maxMarks:10,order:1}]}}]}]});
    hash=record.integrityHash;
    db.prepare('INSERT INTO assessment_versions (id,workbook_id,version,integrity_hash,manifest_json,viewer_core_version,published_at,status,dual_display_allowed) VALUES (?,?,?,?,?,?,?,?,?)').run('assessment:one','workbook:one',4,hash,record.manifestJson,'synthetic-viewer','2026-01-01','published',0);
    db.prepare('INSERT INTO attempts (id,user_id,assessment_version_id,state,started_at,deadline_at) VALUES (?,?,?,?,?,?)').run('attempt:one','synthetic-learner','assessment:one','in-progress','2026-01-01','2027-01-01');
    db.prepare('INSERT INTO submissions VALUES (?,?,?,?,?)').run('submission:one','attempt:one','evidence-hash','2026-01-02','submitted');
    db.prepare('INSERT INTO marks VALUES (?,?,?,?,?,?,?,?)').run('mark:one','attempt:one',outsider.userId,8,10,'Synthetic feedback',1,'2026-01-02');
  }
  db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?,?,?,?,?,?)').run('allocation:one','workbook:one','synthetic-learner','active',outsider.userId,'2026-01-01',null,null,1);
  db.prepare('INSERT INTO workbook_progress VALUES (?,?,?,?,?,?,?,?,?,?)').run('workbook:one','synthetic-learner','in-progress',1,1,50,'2026-01-01','2026-01-02',null,1);
  return {db,hash};
}
function input(mode,hash,more={}){return{action:'create-workbook-correction',id:'workbook:one',expectedVersion:4,expectedStatus:'published',expectedMode:mode,expectedSourceHash:hash,reason:'Synthetic correction rationale',confirmed:true,requestId:randomUUID(),...more};}
async function refusal(status,request,actor=author){await assert.rejects(createStudioWorkbookCorrection(actor,'workbook:one',request),e=>e?.name==='WorkbookCorrectionError'&&e.status===status);}
function counts(db){return Object.fromEntries(['workbooks','workbook_cases','workbook_draft_question_edits','teaching_content_blocks','teaching_polls','lecture_drafts','audit_events','workbook_authorship','workbook_assignments','attempts','submissions','marks','results','workbook_progress'].map(t=>[t,db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n]));}
function sourceRows(db){return Object.fromEntries(['workbooks','workbook_cases','workbook_draft_question_edits','teaching_content_blocks','teaching_polls','lecture_drafts','assessment_versions','lecture_versions','workbook_assignments','attempts','submissions','marks','workbook_progress'].map(t=>[t,db.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all().map(x=>({...x}))]));}

const allRows=db=>Object.fromEntries(names.map(name=>[name,db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all().map(x=>({...x}))]));
const lineageInput=(id,mode='assessment',expectedVersion=1)=>({action:'workbook-correction-lineage',id,expectedVersion,expectedMode:mode,expectedStatus:'draft'});
async function created(mode='assessment'){
  const {db,hash}=await setup(mode);
  const receipt=await createStudioWorkbookCorrection(author,'workbook:one',input(mode,hash));
  fixture.readOnly=true;
  return{db,hash,receipt,id:receipt.draftWorkbookId};
}
const read=(id,mode='assessment',actor=author)=>getStudioWorkbookCorrectionLineage(actor,id,lineageInput(id,mode));

test('authority predicate matches the existing creation and recovery contract',()=>{
  const existing=source.match(/const authority = `([\s\S]*?)`;/)[1];
  const current=readFileSync(resolve(site,'lib/workbook-correction-lineage-repository.ts'),'utf8').match(/const authority = `([\s\S]*?)`;/)[1];
  assert.equal(current,existing);
});
for(const mode of ['teaching','assessment','lecture'])test(mode+': verified lineage is minimal, source-bound and read-only with populated learner evidence',async()=>{
  const {db,hash,id}=await created(mode);try{
    const before=allRows(db),batches=fixture.batches;
    assert.deepEqual(await read(id,mode),{ok:true,action:'workbook-correction-lineage',workbookId:id,
      workbookVersion:1,mode,status:'draft',outcome:'verified',source:{workbookId:'workbook:one',version:4,hash}});
    assert.deepEqual(allRows(db),before);assert.equal(fixture.batches,batches);
  }finally{db.close();}
});
test('ordinary authored draft yields no lineage or source link',async()=>{
  const {db,id,receipt}=await created();try{
    db.prepare('DELETE FROM audit_events WHERE id=?').run(receipt.auditId);
    const before=allRows(db),result=await read(id);
    assert.equal(result.outcome,'unavailable');assert.equal(result.source,null);assert.deepEqual(allRows(db),before);
  }finally{db.close();}
});
test('other institutions and same-institution educators cannot inspect the author lineage',async()=>{
  const {db,id}=await created();try{
    await assert.rejects(read(id,'assessment',outsider));
    db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?,?)').run('org:owned',outsider.userId,'owner','active','2026-01-01');
    fixture.orgs[outsider.userId]='org:owned';
    const before=allRows(db);await assert.rejects(read(id,'assessment',outsider));assert.deepEqual(allRows(db),before);
  }finally{db.close();}
});

const corruptions=[
 ['account',db=>db.prepare("UPDATE account_security_profiles SET status='suspended' WHERE user_id=?").run(author.userId)],
 ['role',db=>db.prepare("UPDATE users SET roles='learner' WHERE id=?").run(author.userId)],
 ['organization',db=>db.prepare("UPDATE organizations SET status='inactive' WHERE id='org:owned'").run()],
 ['membership',db=>db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id=?").run(author.userId)],
 ['entitlement',db=>db.prepare("UPDATE organization_entitlements SET studio_access=0 WHERE organization_id='org:owned'").run()],
 ['expired',db=>db.prepare("UPDATE organization_entitlements SET valid_until='2000-01-01T00:00:00.000Z' WHERE organization_id='org:owned'").run()],
 ['malformed expiry',db=>db.prepare("UPDATE organization_entitlements SET valid_until='2099-01-01' WHERE organization_id='org:owned'").run()],
 ['ownership',db=>db.prepare("UPDATE course_ownership SET organization_id='org:other' WHERE course_id='course:one'").run()],
 ['source version',db=>db.prepare("UPDATE workbooks SET version=5 WHERE id='workbook:one'").run()],
 ['source status',db=>db.prepare("UPDATE workbooks SET status='withdrawn' WHERE id='workbook:one'").run()],
 ['source title',db=>db.prepare("UPDATE workbooks SET title='Changed' WHERE id='workbook:one'").run()],
 ['source duration',db=>db.prepare("UPDATE workbooks SET duration_minutes=1 WHERE id='workbook:one'").run()],
 ['source hash',db=>db.prepare("UPDATE assessment_versions SET integrity_hash=? WHERE id='assessment:one'").run('f'.repeat(64))],
 ['source manifest',db=>db.prepare("UPDATE assessment_versions SET manifest_json='{}' WHERE id='assessment:one'").run()],
 ['source manifest status',db=>db.prepare("UPDATE assessment_versions SET status='withdrawn' WHERE id='assessment:one'").run()],
 ['source viewer',db=>db.prepare("UPDATE assessment_versions SET viewer_core_version='changed' WHERE id='assessment:one'").run()],
 ['source display',db=>db.prepare("UPDATE assessment_versions SET dual_display_allowed=1 WHERE id='assessment:one'").run()],
 ['audit hash',db=>db.prepare("UPDATE audit_events SET integrity_hash=?").run('f'.repeat(64))],
 ['audit payload',db=>db.prepare("UPDATE audit_events SET reason='{}'").run()],
 ['audit oversized',db=>db.prepare("UPDATE audit_events SET reason=?").run('x'.repeat(8001))],
 ['audit time',db=>db.prepare("UPDATE audit_events SET occurred_at='2026-99-99'").run()],
 ['target mode',(db,id)=>db.prepare("UPDATE workbooks SET mode='teaching' WHERE id=?").run(id)],
 ['target version',(db,id)=>db.prepare("UPDATE workbooks SET version=2 WHERE id=?").run(id)],
 ['target state',(db,id)=>db.prepare("UPDATE workbooks SET status='published' WHERE id=?").run(id)],
 ['target authorship',(db,id)=>db.prepare('DELETE FROM workbook_authorship WHERE workbook_id=?').run(id)],
 ['target module',(db,id)=>{db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:other','course:one','Other',2);db.prepare("UPDATE workbooks SET module_id='module:other' WHERE id=?").run(id);}],
];
for(const [label,change] of corruptions)for(const timing of ['before','final'])test(timing+': refuses '+label,async()=>{
  const {db,id}=await created();try{
    let before;
    if(timing==='before'){change(db,id);before=allRows(db);}else fixture.beforeFinal=()=>{change(db,id);before=allRows(db);};
    await assert.rejects(read(id),e=>e.name==='WorkbookCorrectionError');
    assert.ok(before,'race hook executed');assert.deepEqual(allRows(db),before);
  }finally{db.close();}
});
test('strict payload verifier refuses rehashed forged source and institution claims',async()=>{
  for(const patch of [{organizationId:'org:other'},{excludedEvidence:false},{independentReviewRequired:false},{extra:'private'},{draftWorkbookId:randomUUID()},{reason:' leading'}]){
    const {db,id,receipt}=await created();try{
      const event=db.prepare('SELECT * FROM audit_events WHERE id=?').get(receipt.auditId);
      const reason=JSON.stringify({...JSON.parse(event.reason),...patch});
      const hash=digest(`GENESIS|${event.sequence}|${event.actor_id}|${event.action}|${event.target_type}|${event.target_id}|${event.outcome}|${reason}|${event.occurred_at}`);
      db.prepare('UPDATE audit_events SET reason=?,integrity_hash=? WHERE id=?').run(reason,hash,event.id);
      const before=allRows(db);await assert.rejects(read(id));assert.deepEqual(allRows(db),before);
    }finally{db.close();}
  }
});
test('lecture manifest changed at the final primary read refuses',async()=>{
  const {db,id}=await created('lecture');try{
    fixture.beforeFinal=db=>db.prepare("UPDATE lecture_versions SET manifest_json='{}'").run();
    await assert.rejects(read(id,'lecture'));
  }finally{db.close();}
});

for(const timing of ['before','final'])test(timing+': ambiguous audit lineage refuses',async()=>{
  const {db,id}=await created();try{
    const duplicate=()=>db.prepare(`INSERT INTO audit_events SELECT ?,sequence+1,actor_id,action,target_type,target_id,outcome,reason,occurred_at,integrity_hash FROM audit_events LIMIT 1`).run(randomUUID());
    if(timing==='before')duplicate();else fixture.beforeFinal=duplicate;
    await assert.rejects(read(id));
  }finally{db.close();}
});
test('predecessor hash is verified, and later predecessor changes refuse in the final snapshot',async()=>{
  const {db,hash}=await setup();try{
    await createStudioWorkbookCorrection(author,'workbook:one',input('assessment',hash));
    const receipt=await createStudioWorkbookCorrection(author,'workbook:one',input('assessment',hash));
    fixture.readOnly=true;
    assert.equal((await read(receipt.draftWorkbookId)).outcome,'verified');
    fixture.beforeFinal=db=>db.prepare("UPDATE audit_events SET integrity_hash=? WHERE sequence=1").run('f'.repeat(64));
    await assert.rejects(read(receipt.draftWorkbookId));
    await assert.rejects(read(receipt.draftWorkbookId));
  }finally{db.close();}
});
test('audit authored by a different educator never supplies a source',async()=>{
  const {db,id}=await created();try{
    db.prepare('UPDATE audit_events SET actor_id=?').run(outsider.userId);
    const before=allRows(db);assert.equal((await read(id)).outcome,'unavailable');assert.deepEqual(allRows(db),before);
  }finally{db.close();}
});
test('direct repository callers also require exact draft identity',async()=>{
  const {db,id}=await created();try{
    for(const patch of [{id:'other'},{expectedVersion:2},{expectedMode:'lecture'},{expectedStatus:'published'},{reason:'PRIVATE'}]){
      const before=allRows(db);await assert.rejects(getStudioWorkbookCorrectionLineage(author,id,{...lineageInput(id),...patch}));assert.deepEqual(allRows(db),before);
    }
  }finally{db.close();}
});

test('temporarily repairing corrupt initial source or audit during lookup cannot validate the corrupt snapshot',async()=>{
  for(const kind of ['source','audit']){
    const {db,id}=await created();try{
      let corrupt,repair;
      if(kind==='source'){
        const original=db.prepare("SELECT manifest_json FROM assessment_versions WHERE id='assessment:one'").get().manifest_json;
        corrupt=()=>db.prepare("UPDATE assessment_versions SET manifest_json='{}' WHERE id='assessment:one'").run();
        repair=()=>db.prepare("UPDATE assessment_versions SET manifest_json=? WHERE id='assessment:one'").run(original);
      }else{
        const original=db.prepare('SELECT reason FROM audit_events').get().reason;
        corrupt=()=>db.prepare('UPDATE audit_events SET reason=?').run(JSON.stringify({...JSON.parse(original),reason:'Corrupt initial reason'}));
        repair=()=>db.prepare('UPDATE audit_events SET reason=?').run(original);
      }
      corrupt();fixture.beforeVerifierSource=repair;fixture.beforeFinal=corrupt;
      await assert.rejects(read(id),e=>e.name==='WorkbookCorrectionError');
      assert.equal(fixture.beforeVerifierSource,null,'production lookup read the temporarily repaired snapshot');
      assert.equal(fixture.beforeFinal,corrupt,'corrupt initial evidence refused before final authority query');
    }finally{db.close();}
  }
});

test('large valid publication stays within D1 value limits without amplifying frozen media identifiers',async()=>{
  const {db}=await setup();try{
    const frozen=JSON.parse(db.prepare("SELECT manifest_json FROM assessment_versions WHERE id='assessment:one'").get().manifest_json);
    const count=31_000;
    const largeMedia={...media,series:[{...media.series[0],frameCount:count,
      sopInstanceUids:Array.from({length:count},(_,index)=>`1.2.${'1'.repeat(50)}.${index+1}`)}]};
    frozen.cases[0].media=largeMedia;
    const record=await assessment.createAssessmentManifestRecord(frozen);
    const manifestBytes=Buffer.byteLength(record.manifestJson),wrappedBytes=Buffer.byteLength(JSON.stringify({json:record.manifestJson}));
    assert(manifestBytes<2_000_000);assert(wrappedBytes>2_000_000,'regression fixture must exercise JSON escaping amplification');
    db.prepare("UPDATE assessment_versions SET integrity_hash=?,manifest_json=? WHERE id='assessment:one'").run(record.integrityHash,record.manifestJson);
    fixture.media=largeMedia;fixture.enforceD1ValueLimit=true;
    const receipt=await createStudioWorkbookCorrection(author,'workbook:one',input('assessment',record.integrityHash));
    fixture.readOnly=true;const before=allRows(db),batches=fixture.batches;
    const result=await read(receipt.draftWorkbookId);
    assert.equal(result.outcome,'verified');assert.equal(result.source.hash,record.integrityHash);
    assert.deepEqual(allRows(db),before);assert.equal(fixture.batches,batches);
    assert(fixture.maxBoundValueBytes<=2_000_000);assert(fixture.maxResultValueBytes<=2_000_000);
    assert(fixture.maxResultRowContentBytes+1_024<2_000_000,'regression fixture has explicit row-header margin');
    // Same parsed source and canonical hash, but different captured bytes: the
    // final primary read must still refuse rather than accepting metadata alone.
    fixture.beforeFinal=db=>db.prepare("UPDATE assessment_versions SET manifest_json=manifest_json||char(10) WHERE id='assessment:one'").run();
    await assert.rejects(read(receipt.draftWorkbookId),e=>e.name==='WorkbookCorrectionError'&&e.status===409);
    assert.equal(fixture.beforeFinal,null,'raw-byte change reached the final authority/source SELECT');
    // A later, separate check can capture those consistent bytes afresh: the
    // manifest verifier intentionally hashes canonical content, not whitespace.
    const changed=allRows(db);assert.equal((await read(receipt.draftWorkbookId)).outcome,'verified');assert.deepEqual(allRows(db),changed);assert.equal(fixture.batches,batches);
    console.log(JSON.stringify({syntheticLargePublication:{manifestBytes,wrappedBytes,frames:count,maxBoundValueBytes:fixture.maxBoundValueBytes,maxResultValueBytes:fixture.maxResultValueBytes,maxResultRowContentBytes:fixture.maxResultRowContentBytes,finalRawByteChangeRefused:true}}));
  }finally{db.close();}
});

