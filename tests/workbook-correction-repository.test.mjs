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
  assessmentMediaForCase(){return media;},
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
const built=await build({stdin:{contents:source,resolveDir:site,sourcefile:'lib/workbook-correction-repository.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'seams',setup(builder){
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
const {getWorkbookCorrectionSource,createStudioWorkbookCorrection,lookupStudioWorkbookCorrection}=module.exports;
const lectureBuilt=await build({entryPoints:[resolve(site,'lib/lecture-repository.ts')],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'lecture-seams',setup(builder){
  builder.onResolve({filter:/.*/},args=>{
    if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
    if(args.path==='./lecture-anatomy-reference.ts'||args.path==='./lecture-anatomy-collection.ts')return null;
    if(seamImports[args.path])return{path:args.path,namespace:'seam'};
    if(args.path.startsWith('@/'))return{path:resolve(site,args.path.slice(2))+'.ts'};
    return null;
  });
  builder.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${seamImports[args.path].map(name=>`export const ${name}=seams.${name};`).join('\n')}`,loader:'js'}));
}}]});
const lectureModule={exports:{}};
new Function('module','exports','require',lectureBuilt.outputFiles[0].text)(lectureModule,lectureModule.exports,id=>{assert.equal(id,'test-seams');return seams;});
const {mutateLecture}=lectureModule.exports;
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
  prepare(sql){return{sql,values:[],bind(...values){this.values=values;return this;},async first(){
    if(sql.includes('a.id AS event_id') && fixture.beforeLookup){const f=fixture.beforeLookup;fixture.beforeLookup=null;f(db);}
    return db.prepare(sql).get(...this.values)??null;
  },async all(){return{results:db.prepare(sql).all(...this.values)};}};},
  async batch(statements){fixture.batches++;if(fixture.beforeBatch){const f=fixture.beforeBatch;fixture.beforeBatch=null;f(db);}db.exec('BEGIN');try{const result=[];for(const [i,s] of statements.entries()){if(fixture.failStage===i)throw Error('SYNTHETIC_BATCH_FAILURE');const changed=db.prepare(s.sql).run(...s.values);result.push({meta:{changes:Number(changed.changes)}});}db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}
};}
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

for(const mode of ['teaching','assessment','lecture'])test(`${mode}: exact manifest creates isolated authored draft and strict receipt`,async()=>{
  const {db,hash}=await setup(mode);try{
    const source=await getWorkbookCorrectionSource(author,'workbook:one');assert.deepEqual(source,{ok:true,action:'workbook-correction-source',workbookId:'workbook:one',workbookVersion:4,mode,sourceHash:hash});
    const request=input(mode,hash),before=counts(db),sourceBefore=sourceRows(db),receipt=await createStudioWorkbookCorrection(author,'workbook:one',request);
    assert.deepEqual(parseWorkbookCorrectionReceipt(receipt,request),receipt);
    assert.equal(receipt.auditId,request.requestId);assert.equal(receipt.sourceHash,hash);
    assert.equal(db.prepare('SELECT status FROM workbooks WHERE id=?').get('workbook:one').status,'published');
    assert.deepEqual({...db.prepare('SELECT mode,status,version FROM workbooks WHERE id=?').get(receipt.draftWorkbookId)},{mode,status:'draft',version:1});
    assert.equal(db.prepare('SELECT author_id FROM workbook_authorship WHERE workbook_id=?').get(receipt.draftWorkbookId).author_id,author.userId);
    const audit=db.prepare('SELECT * FROM audit_events WHERE id=?').get(request.requestId);
    assert.equal(audit.target_id,receipt.draftWorkbookId);assert.equal(audit.integrity_hash,receipt.auditHash);
    assert.equal(audit.integrity_hash,digest(`GENESIS|${audit.sequence}|${audit.actor_id}|${audit.action}|${audit.target_type}|${audit.target_id}|${audit.outcome}|${audit.reason}|${audit.occurred_at}`));
    if(mode==='lecture'){
      const draft=db.prepare('SELECT * FROM lecture_drafts WHERE workbook_id=?').get(receipt.draftWorkbookId);assert.equal(draft.review_hash,null);assert.equal(JSON.parse(draft.slides_json)[0].title,'Synthetic slide');
    }else{
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workbook_cases WHERE workbook_id=?').get(receipt.draftWorkbookId).n,1);
      assert.equal(db.prepare('SELECT prompt FROM workbook_draft_question_edits WHERE workbook_id=?').get(receipt.draftWorkbookId).prompt,'Immutable published prompt');
      if(mode==='teaching'){
        const block=db.prepare('SELECT * FROM teaching_content_blocks WHERE workbook_id=?').get(receipt.draftWorkbookId);assert.equal(block.status,'draft');assert.notEqual(block.id,'block:one');
        const poll=db.prepare('SELECT * FROM teaching_polls WHERE workbook_id=?').get(receipt.draftWorkbookId);assert.equal(poll.status,'draft');assert.notEqual(poll.id,'poll:one');
      }
    }
    const after=counts(db);for(const name of ['workbook_assignments','attempts','submissions','marks','results','workbook_progress'])assert.equal(after[name],before[name]);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workbook_assignments WHERE workbook_id=?').get(receipt.draftWorkbookId).n,0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workbook_progress WHERE workbook_id=?').get(receipt.draftWorkbookId).n,0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM assessment_versions WHERE workbook_id=?').get(receipt.draftWorkbookId).n,0);
    const sourceAfter=sourceRows(db);
    for(const name of ['assessment_versions','lecture_versions','workbook_assignments','attempts','submissions','marks','workbook_progress'])
      assert.deepEqual(sourceAfter[name],sourceBefore[name],`${name} source evidence remains unchanged`);
    for(const name of ['workbooks','workbook_cases','workbook_draft_question_edits','teaching_content_blocks','teaching_polls','lecture_drafts'])
      assert.deepEqual(sourceAfter[name].filter(x=>x.id==='workbook:one'||x.workbook_id==='workbook:one'),sourceBefore[name].filter(x=>x.id==='workbook:one'||x.workbook_id==='workbook:one'),`${name} source rows remain unchanged`);
    await refusal(409,request);assert.deepEqual(counts(db),after,'request UUID replay has no writes');
  }finally{db.close();}
});
test('stale but valid lecture anatomy pin is retained in editable correction; review waits for author repair',async()=>{
  const {db,hash}=await setup('lecture',{stalePin:true});try{
    const originalManifest=db.prepare("SELECT manifest_json FROM lecture_versions WHERE workbook_id='workbook:one'").get().manifest_json;
    const receipt=await createStudioWorkbookCorrection(author,'workbook:one',input('lecture',hash));
    const draft=db.prepare('SELECT slides_json,review_hash FROM lecture_drafts WHERE workbook_id=?').get(receipt.draftWorkbookId);
    assert.deepEqual(JSON.parse(draft.slides_json)[0].anatomyReference,oldPin,'saved historical pin copied exactly');
    assert.equal(draft.review_hash,null);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM lecture_reviews WHERE workbook_id=?').get(receipt.draftWorkbookId).n,0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM lecture_versions WHERE workbook_id=?').get(receipt.draftWorkbookId).n,0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM workbook_assignments WHERE workbook_id=?').get(receipt.draftWorkbookId).n,0);
    assert.equal(db.prepare("SELECT manifest_json FROM lecture_versions WHERE workbook_id='workbook:one'").get().manifest_json,originalManifest);
    const review={action:'request-review',id:receipt.draftWorkbookId,expectedVersion:1};
    await assert.rejects(mutateLecture(author,receipt.draftWorkbookId,review),e=>e?.message?.includes('An anatomy link has changed'));
    assert.equal(db.prepare('SELECT status FROM workbooks WHERE id=?').get(receipt.draftWorkbookId).status,'draft');
    assert.equal(db.prepare('SELECT review_hash FROM lecture_drafts WHERE workbook_id=?').get(receipt.draftWorkbookId).review_hash,null);
    const fixedSlides=[{id:'slide-one',title:'Synthetic slide',body:'Teaching text',referenceUrl:''}];
    await mutateLecture(author,receipt.draftWorkbookId,{action:'save',id:receipt.draftWorkbookId,expectedVersion:1,title:'Synthetic workbook',slides:fixedSlides});
    await mutateLecture(author,receipt.draftWorkbookId,{...review,expectedVersion:2});
    assert.equal(db.prepare('SELECT status FROM workbooks WHERE id=?').get(receipt.draftWorkbookId).status,'in-review');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM lecture_reviews WHERE workbook_id=?').get(receipt.draftWorkbookId).n,0);
  }finally{db.close();}
});
test('source version/hash/status, invalid contract and cross institution refuse',async()=>{
  const {db,hash}=await setup();try{await refusal(422,input('assessment',hash,{confirmed:false}));await refusal(409,input('assessment',hash,{expectedVersion:3}));await refusal(409,input('assessment','0'.repeat(64)));await refusal(404,input('assessment',hash),outsider);assert.equal(counts(db).audit_events,0);}finally{db.close();}
});
test('account, role, organization, membership, entitlement, expiry and ownership gates refuse before and at commit',async()=>{
  const authorityChanges=[
    ['inactive account',db=>db.prepare("UPDATE account_security_profiles SET status='suspended' WHERE user_id=?").run(author.userId),403],
    ['revoked educator role',db=>db.prepare("UPDATE users SET roles='learner' WHERE id=?").run(author.userId),403],
    ['inactive organization',db=>db.prepare("UPDATE organizations SET status='inactive' WHERE id='org:owned'").run(),403],
    ['revoked membership',db=>db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id=?").run(author.userId),403],
    ['disabled Studio entitlement',db=>db.prepare("UPDATE organization_entitlements SET studio_access=0 WHERE organization_id='org:owned'").run(),403],
    ['inactive entitlement',db=>db.prepare("UPDATE organization_entitlements SET status='inactive' WHERE organization_id='org:owned'").run(),403],
    ['expired canonical entitlement',db=>db.prepare("UPDATE organization_entitlements SET valid_until='2020-01-01T00:00:00.000Z' WHERE organization_id='org:owned'").run(),403],
    ['malformed entitlement expiry',db=>db.prepare("UPDATE organization_entitlements SET valid_until='2099-01-01' WHERE organization_id='org:owned'").run(),403],
    ['course ownership moved',db=>db.prepare("UPDATE course_ownership SET organization_id='org:other' WHERE course_id='course:one'").run(),404],
  ];
  for(const [label,mutate,status] of authorityChanges){
    const pre=await setup('assessment');try{mutate(pre.db);const before=counts(pre.db);
      await refusal(status,input('assessment',pre.hash));
      assert.deepEqual(counts(pre.db),before,`${label} preflight leaves all rows alone`);
      assert.equal(fixture.batches,0);
    }finally{pre.db.close();}
    const raced=await setup('assessment');try{const before=counts(raced.db);fixture.beforeBatch=mutate;
      await refusal(409,input('assessment',raced.hash));
      assert.deepEqual(counts(raced.db),before,`${label} commit race creates no draft, audit or learner copy`);
      assert.equal(raced.db.prepare("SELECT status FROM workbooks WHERE id='workbook:one'").get().status,'published');
      assert.equal(fixture.batches,1);
    }finally{raced.db.close();}
  }
});
test('published duration and display flags must agree with immutable manifest before GET and POST',async()=>{
  const mutations=[
    db=>db.prepare("UPDATE workbooks SET duration_minutes=duration_minutes+1 WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE workbooks SET dual_display_allowed=1 WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE assessment_versions SET dual_display_allowed=1 WHERE id='assessment:one'").run(),
    db=>{db.prepare("UPDATE workbooks SET dual_display_allowed=1 WHERE id='workbook:one'").run();db.prepare("UPDATE assessment_versions SET dual_display_allowed=1 WHERE id='assessment:one'").run();},
  ];
  for(const mode of ['teaching','assessment'])for(const mutate of mutations){const {db,hash}=await setup(mode);try{
    mutate(db);const before=counts(db);
    await assert.rejects(getWorkbookCorrectionSource(author,'workbook:one'),e=>e?.name==='WorkbookCorrectionError'&&e.status===409);
    await refusal(409,input(mode,hash));assert.deepEqual(counts(db),before);assert.equal(fixture.batches,0);
  }finally{db.close();}}
  for(const mutate of mutations.slice(0,2)){const {db,hash}=await setup('lecture');try{
    mutate(db);await refusal(409,input('lecture',hash));assert.equal(fixture.batches,0);
  }finally{db.close();}}
});
test('manifest load is bounded by published schema and D1 string limits',async()=>{
  const {db,hash}=await setup('assessment');try{
    db.prepare('UPDATE assessment_versions SET manifest_json=? WHERE id=?').run('x'.repeat(2_000_001),'assessment:one');
    const before=counts(db);await refusal(409,input('assessment',hash));assert.deepEqual(counts(db),before);assert.equal(fixture.batches,0);
  }finally{db.close();}
});
test('revoked authority, source components, manifest, audit head and replay races have no draft writes',async()=>{
  const changes=[
    db=>db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id=?").run(author.userId),
    db=>db.prepare("UPDATE cases SET title='Changed case' WHERE id='case:one'").run(),
    db=>db.prepare("UPDATE cases SET publication_hash='changed-publication' WHERE id='case:one'").run(),
    db=>db.prepare("UPDATE questions SET options_json='[\"changed\"]' WHERE id='question:one'").run(),
    db=>db.prepare("UPDATE rubrics SET criteria_json='[]' WHERE id='rubric:one'").run(),
    db=>db.prepare("UPDATE workbook_cases SET position=2 WHERE workbook_id='workbook:one'").run(),
    db=>db.prepare("UPDATE assessment_versions SET integrity_hash=? WHERE id='assessment:one'").run('f'.repeat(64)),
    db=>db.prepare("UPDATE workbooks SET duration_minutes=duration_minutes+1 WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE workbooks SET dual_display_allowed=1 WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE assessment_versions SET dual_display_allowed=1 WHERE id='assessment:one'").run(),
    db=>db.prepare("UPDATE workbooks SET status='withdrawn' WHERE id='workbook:one'").run(),
    db=>db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),1,author.userId,'synthetic-race','workbook','other','success','{}','2026-01-01',digest('race')),
  ];
  for(const change of changes){const {db,hash}=await setup();try{const request=input('assessment',hash),before=counts(db);fixture.beforeBatch=change;await refusal(409,request);const after=counts(db);assert.equal(after.workbooks,before.workbooks);assert.equal(after.workbook_authorship,before.workbook_authorship);assert.equal(after.workbook_cases,before.workbook_cases);assert.equal(after.audit_events,before.audit_events+(change===changes.at(-1)?1:0));}finally{db.close();}}
});
test('teaching supplemental block and poll mutations at atomic commit refuse without draft or audit',async()=>{
  for(const mutation of [
    db=>db.prepare("UPDATE teaching_content_blocks SET body='Changed body' WHERE id='block:one'").run(),
    db=>db.prepare("UPDATE teaching_polls SET explanation='Changed explanation' WHERE id='poll:one'").run(),
  ]){
    const {db,hash}=await setup('teaching');try{const before=counts(db);fixture.beforeBatch=mutation;await refusal(409,input('teaching',hash));const after=counts(db);assert.equal(after.workbooks,before.workbooks);assert.equal(after.audit_events,before.audit_events);assert.equal(after.workbook_authorship,before.workbook_authorship);}finally{db.close();}
  }
});
test('supplemental published content drift refuses; source draft prompt drift cannot replace manifest',async()=>{
  const {db,hash}=await setup('teaching');try{db.prepare("UPDATE teaching_polls SET prompt='Changed poll' WHERE id='poll:one'").run();await refusal(409,input('teaching',hash));}finally{db.close();}
  const second=await setup('assessment');try{second.db.prepare("UPDATE workbook_draft_question_edits SET prompt='Malicious transient prompt' WHERE workbook_id='workbook:one'").run();const receipt=await createStudioWorkbookCorrection(author,'workbook:one',input('assessment',second.hash));assert.equal(second.db.prepare('SELECT prompt FROM workbook_draft_question_edits WHERE workbook_id=?').get(receipt.draftWorkbookId).prompt,'Immutable published prompt');}finally{second.db.close();}
});
test('every batch statement failure rolls back all draft, author and audit rows',async()=>{
  for(const mode of ['teaching','assessment','lecture']){
    const probe=await setup(mode);let stages;try{const request=input(mode,probe.hash);await createStudioWorkbookCorrection(author,'workbook:one',request);stages=mode==='teaching'?7:mode==='assessment'?5:4;}finally{probe.db.close();}
    for(let stage=0;stage<stages;stage++){
      const {db,hash}=await setup(mode);try{const before=counts(db);fixture.failStage=stage;await assert.rejects(createStudioWorkbookCorrection(author,'workbook:one',input(mode,hash)),/SYNTHETIC_BATCH_FAILURE/);assert.deepEqual(counts(db),before,`${mode} stage ${stage}`);}finally{db.close();}
    }
  }
});

const lookupInput=request=>({action:'lookup-workbook-correction',id:request.id,expectedVersion:request.expectedVersion,
  expectedMode:request.expectedMode,expectedSourceHash:request.expectedSourceHash,requestId:request.requestId});
function allRows(db){return Object.fromEntries(names.map(name=>[name,db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all().map(x=>({...x}))]));}
async function lookup(request,actor=author){return lookupStudioWorkbookCorrection(actor,'workbook:one',lookupInput(request));}
async function lookupRefused(request,status,actor=author){return assert.rejects(lookup(request,actor),e=>e?.name==='WorkbookCorrectionError'&&e.status===status);}

for(const mode of ['teaching','assessment','lecture'])test(`${mode}: manual lookup recovers exact creation without any database write or learner change`,async()=>{
  const {db,hash}=await setup(mode);try{
    const request=input(mode,hash),emptyBefore=allRows(db),unconfirmed=await lookup(request);
    assert.equal(unconfirmed.outcome,'unconfirmed');assert.equal(unconfirmed.receipt,null);
    assert.deepEqual(allRows(db),emptyBefore);
    const receipt=await createStudioWorkbookCorrection(author,'workbook:one',request),before=allRows(db);
    const writes=db.prepare('SELECT total_changes() AS n').get().n,batches=fixture.batches;
    const confirmed=await lookup(request);
    assert.equal(confirmed.outcome,'confirmed');assert.deepEqual(confirmed.receipt,receipt);
    assert.deepEqual(await lookup(request),confirmed,'repeat lookup is read-only and deterministic');
    assert.equal(db.prepare('SELECT total_changes() AS n').get().n,writes);
    assert.equal(fixture.batches,batches);assert.deepEqual(allRows(db),before);
    const sameOrgOther={userId:'synthetic-outsider'};
    db.prepare("UPDATE organization_memberships SET organization_id='org:owned' WHERE user_id=?").run(sameOrgOther.userId);
    fixture.orgs[sameOrgOther.userId]='org:owned';
    const other=await lookup(request,sameOrgOther);assert.equal(other.outcome,'unconfirmed');assert.equal(other.receipt,null,'another authorized educator does not see someone else’s result');
    for(const status of ['draft','in-review','changes-requested','approved','published','archived','withdrawn']){
      db.prepare('UPDATE workbooks SET version=8,status=? WHERE id=?').run(status,receipt.draftWorkbookId);
      assert.deepEqual((await lookup(request)).receipt,receipt,'receipt is the creation fact, not a current version/status assertion: '+status);
    }
  }finally{db.close();}
});

test('lookup authenticates the event against the exact preceding audit hash',async()=>{
  const {db,hash}=await setup('lecture');try{
    db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),1,author.userId,'synthetic.previous','workbook','old','success','{}','2026-01-01T00:00:00.000Z',digest('previous'));
    const request=input('lecture',hash),receipt=await createStudioWorkbookCorrection(author,'workbook:one',request);
    assert.deepEqual((await lookup(request)).receipt,receipt);
    db.prepare('UPDATE audit_events SET integrity_hash=? WHERE sequence=1').run(digest('altered previous'));
    await lookupRefused(request,409);
    db.prepare('DELETE FROM audit_events WHERE sequence=1').run();await lookupRefused(request,409);
  }finally{db.close();}
});

test('lookup strict audit and target verification refuses altered or incomplete creation records',async()=>{
  const changes=[
    ['audit hash',(db,r)=>db.prepare('UPDATE audit_events SET integrity_hash=? WHERE id=?').run('f'.repeat(64),r.auditId)],
    ['audit payload',(db,r)=>db.prepare('UPDATE audit_events SET reason=? WHERE id=?').run('{}',r.auditId)],
    ['oversized audit',(db,r)=>db.prepare('UPDATE audit_events SET reason=? WHERE id=?').run('x'.repeat(8001),r.auditId)],
    ['audit time',(db,r)=>db.prepare('UPDATE audit_events SET occurred_at=? WHERE id=?').run('2026-99-99',r.auditId)],
    // Deliberately corrupt only the synthetic fixture: valid production foreign
    // keys prevent this deletion, but lookup must also fail closed on bad storage.
    ['missing target',(db,r)=>{db.exec('PRAGMA foreign_keys=OFF');db.prepare('DELETE FROM workbooks WHERE id=?').run(r.draftWorkbookId);db.exec('PRAGMA foreign_keys=ON');}],
    ['changed target mode',(db,r)=>db.prepare("UPDATE workbooks SET mode='teaching' WHERE id=?").run(r.draftWorkbookId)],
    ['changed target module',(db,r)=>{db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:outside','course:one','Other module',2);db.prepare("UPDATE workbooks SET module_id='module:outside' WHERE id=?").run(r.draftWorkbookId);}],
    ['missing authorship',(db,r)=>db.prepare('DELETE FROM workbook_authorship WHERE workbook_id=?').run(r.draftWorkbookId)],
    ['invalid target version',(db,r)=>db.prepare('UPDATE workbooks SET version=0 WHERE id=?').run(r.draftWorkbookId)],
  ];
  for(const [label,mutate] of changes){const {db,hash}=await setup();try{
    const request=input('assessment',hash),receipt=await createStudioWorkbookCorrection(author,'workbook:one',request);
    mutate(db,receipt);const before=allRows(db);await lookupRefused(request,409);assert.deepEqual(allRows(db),before,label);
  }finally{db.close();}}
  const payloadChanges=[{schema:'other'},{sourceWorkbookId:'other'},{sourceVersion:3},{sourceHash:'f'.repeat(64)},
    {mode:'lecture'},{organizationId:'org:other'},{draftWorkbookId:randomUUID()},{reason:''},{reason:' leading'},
    {reason:'x'.repeat(1001)},{reason:'bad\u0000reason'},{excludedEvidence:false},{independentReviewRequired:false},{extra:'forged'}];
  for(const patch of payloadChanges){const {db,hash}=await setup();try{
    const request=input('assessment',hash),receipt=await createStudioWorkbookCorrection(author,'workbook:one',request);
    const event=db.prepare('SELECT * FROM audit_events WHERE id=?').get(receipt.auditId),reason=JSON.stringify({...JSON.parse(event.reason),...patch});
    const forgedHash=digest(`GENESIS|${event.sequence}|${event.actor_id}|${event.action}|${event.target_type}|${event.target_id}|${event.outcome}|${reason}|${event.occurred_at}`);
    db.prepare('UPDATE audit_events SET reason=?,integrity_hash=? WHERE id=?').run(reason,forgedHash,receipt.auditId);
    await lookupRefused(request,409);
  }finally{db.close();}}
});

test('lookup rechecks current authority and immutable source in the final primary read snapshot',async()=>{
  const changes=[
    db=>db.prepare("UPDATE account_security_profiles SET status='suspended' WHERE user_id=?").run(author.userId),
    db=>db.prepare("UPDATE users SET roles='learner' WHERE id=?").run(author.userId),
    db=>db.prepare("UPDATE organizations SET status='inactive' WHERE id='org:owned'").run(),
    db=>db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id=?").run(author.userId),
    db=>db.prepare("UPDATE organization_entitlements SET studio_access=0 WHERE organization_id='org:owned'").run(),
    db=>db.prepare("UPDATE organization_entitlements SET valid_until='2099-01-01' WHERE organization_id='org:owned'").run(),
    db=>db.prepare("UPDATE course_ownership SET organization_id='org:other' WHERE course_id='course:one'").run(),
    db=>db.prepare("UPDATE workbooks SET version=5 WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE workbooks SET status='withdrawn' WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE workbooks SET title='Changed title' WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE workbooks SET duration_minutes=1 WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE workbooks SET dual_display_allowed=1 WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE assessment_versions SET integrity_hash=? WHERE id='assessment:one'").run('f'.repeat(64)),
    db=>db.prepare("UPDATE assessment_versions SET manifest_json='{}' WHERE id='assessment:one'").run(),
    db=>db.prepare("UPDATE assessment_versions SET status='withdrawn' WHERE id='assessment:one'").run(),
    db=>db.prepare("UPDATE assessment_versions SET viewer_core_version='changed' WHERE id='assessment:one'").run(),
    db=>db.prepare("UPDATE assessment_versions SET dual_display_allowed=1 WHERE id='assessment:one'").run(),
  ];
  for(const mutate of changes){const {db,hash}=await setup();try{
    const request=input('assessment',hash);await createStudioWorkbookCorrection(author,'workbook:one',request);
    const batches=fixture.batches;fixture.beforeLookup=mutate;await lookupRefused(request,409);assert.equal(fixture.batches,batches);
  }finally{db.close();}}
  const {db,hash}=await setup('lecture');try{
    const request=input('lecture',hash);await createStudioWorkbookCorrection(author,'workbook:one',request);
    await lookupRefused(request,404,outsider);
    await lookupRefused({...request,expectedVersion:5},409);await lookupRefused({...request,expectedSourceHash:'f'.repeat(64)},409);
    await assert.rejects(lookupStudioWorkbookCorrection(author,'workbook:one',{...lookupInput(request),reason:'forged intent'}),e=>e.status===422);
    fixture.beforeLookup=db=>db.prepare("UPDATE lecture_versions SET manifest_json='{}' WHERE id='lecture:one'").run();
    await lookupRefused(request,409);
  }finally{db.close();}
});
