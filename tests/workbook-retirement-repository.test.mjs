import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';

// Production repository SQL runs in native SQLite using production table DDL.
// Only identity, Cloudflare binding and the platform snapshot are substituted.
const site=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild');
const sourcePath=resolve(site,'lib/workbook-retirement-repository.ts');
const source=readFileSync(sourcePath,'utf8');
console.log(JSON.stringify({source:'lib/workbook-retirement-repository.ts',sha256:createHash('sha256').update(source).digest('hex'),mode:'actual exported repository SQL, production DDL, native SQLite transaction adapter'}));

let fixture;
const author={userId:'synthetic-author'};
const outsider={userId:'synthetic-outsider'};
const seams={
  env:{get DB(){return fixture.d1;}},
  async ensureEducationUser(auth){const row=fixture.db.prepare('SELECT roles FROM users WHERE id=?').get(auth.userId);return{roles:row?row.roles.split(','):[],status:fixture.accountStatus[auth.userId]??'active'};},
  async getPlatformSnapshot(auth){return{organization:{id:fixture.snapshotOrg[auth.userId]??'org:owned',kind:'institution',role:'owner'},entitlement:{studioAccess:fixture.snapshotStudioAccess}};},
};
const seamImports={'cloudflare:workers':['env'],'@/db/bootstrap':['ensureEducationUser'],'@/db/platform':['getPlatformSnapshot']};
const built=await build({stdin:{contents:source,resolveDir:site,sourcefile:'lib/workbook-retirement-repository.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'retirement-repository-seams',setup(builder){
  builder.onResolve({filter:/.*/},args=>{
    if(args.path==='test-seams'&&args.namespace==='seam')return{path:args.path,external:true};
    if(seamImports[args.path])return{path:args.path,namespace:'seam'};
    if(args.path==='@/lib/workbook-retirement-contract')return{path:resolve(site,'lib/workbook-retirement-contract.ts')};
    throw Error(`Unexpected repository import: ${args.path}`);
  });
  builder.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seams from 'test-seams';\n${seamImports[args.path].map(name=>`export const ${name}=seams.${name};`).join('\n')}`,loader:'js'}));
}}]});
const module={exports:{}};
new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
const {retireStudioWorkbook,WorkbookRetirementError}=module.exports;
assert.equal(typeof retireStudioWorkbook,'function');
console.log(JSON.stringify({bundleSha256:createHash('sha256').update(built.outputFiles[0].contents).digest('hex')}));

const ddlFiles=[readFileSync(resolve(site,'db/bootstrap.ts'),'utf8'),readFileSync(resolve(site,'db/platform.ts'),'utf8')];
function createTable(db,name){const pattern=new RegExp('`(CREATE TABLE IF NOT EXISTS '+name+' \\([^`]+\\))`');const sql=ddlFiles.map(source=>source.match(pattern)?.[1]).find(Boolean);assert.ok(sql,`real DDL for ${name}`);db.exec(sql);}
const tables=['users','account_security_profiles','courses','modules','workbooks','cases','workbook_cases','teaching_polls','teaching_poll_runs','teaching_sessions','workbook_assignments','workbook_assignment_rules','cohorts','cohort_workbook_assignments','workbook_progress','assessment_versions','attempts','submissions','marks','results','audit_events','organizations','organization_memberships','organization_entitlements','course_ownership','course_releases','course_release_workbooks'];
function setup({mode='teaching'}={}){
  const db=new DatabaseSync(':memory:');for(const table of tables)createTable(db,table);
  for(const actor of [author,outsider,{userId:'synthetic-learner'}]){
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?,?)').run(actor.userId,actor.userId,`${actor.userId}@example.invalid`,actor.userId,actor===author?'instructor':actor===outsider?'instructor':'learner','2026-01-01','2026-01-01');
    db.prepare('INSERT INTO account_security_profiles VALUES (?,?,?,?,?,?,?,?,?,?)').run(actor.userId,'active','synthetic','2026-01-01','2026-01-01','v1','v1','2026-01-01','2026-01-01','2026-01-01');
  }
  for(const org of ['org:owned','org:other']){
    db.prepare('INSERT INTO organizations VALUES (?,?,?,?,?,?)').run(org,org,org,'institution','active','2026-01-01');
    db.prepare('INSERT INTO organization_entitlements (organization_id,plan,learner_limit,educator_limit,storage_bytes,atlas_access,studio_access,reporting_access,embeds_access,status,valid_until,version,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(org,'light',10,10,1000000,1,1,0,0,'active',null,1,'2026-01-01');
  }
  for(const [userId,org] of [[author.userId,'org:owned'],[outsider.userId,'org:other']])db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?,?)').run(org,userId,'owner','active','2026-01-01');
  db.prepare('INSERT INTO courses VALUES (?,?,?,?,?)').run('course:one','ONE','Synthetic course','Synthetic description','active');
  db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:one','course:one','Synthetic module',1);
  db.prepare('INSERT INTO course_ownership VALUES (?,?,?,?)').run('course:one','org:owned',author.userId,'2026-01-01');
  db.prepare('INSERT INTO workbooks (id,module_id,title,mode,version,status,duration_minutes) VALUES (?,?,?,?,?,?,?)').run('workbook:one','module:one','Synthetic workbook',mode,4,'published',30);
  db.prepare('INSERT INTO cases VALUES (?,?,?,?,?,?,?,?,?,?,?)').run('case:one','Synthetic case','radiology','published',1,'Synthetic description','dicom','[]','synthetic-hash',1,1);
  db.prepare('INSERT INTO workbook_cases VALUES (?,?,?)').run('workbook:one','case:one',1);
  db.prepare('INSERT INTO assessment_versions (id,workbook_id,version,integrity_hash,manifest_json,viewer_core_version,published_at,status,dual_display_allowed) VALUES (?,?,?,?,?,?,?,?,?)').run('assessment:one','workbook:one',4,'b'.repeat(64),'{}','synthetic-core','2026-01-01','published',0);
  fixture={db,d1:null,beforeBatch:null,failStatement:null,batches:0,snapshotOrg:{[outsider.userId]:'org:other'},snapshotStudioAccess:true,accountStatus:{}};
  fixture.d1={
    prepare(sql){return{sql,values:[],bind(...values){this.values=values;return this;},async first(){return db.prepare(this.sql).get(...this.values)??null;},async all(){return{results:db.prepare(this.sql).all(...this.values)};},async run(){if(fixture.failStatement?.test(this.sql))throw Error('SYNTHETIC_SQL_FAILURE');const result=db.prepare(this.sql).run(...this.values);return{success:true,meta:{changes:Number(result.changes)}};}};},
    async batch(statements){fixture.batches++;if(fixture.beforeBatch){const inject=fixture.beforeBatch;fixture.beforeBatch=null;inject(db);}db.exec('BEGIN');try{const results=[];for(const statement of statements){if(fixture.failStatement?.test(statement.sql))throw Error('SYNTHETIC_SQL_FAILURE');const result=db.prepare(statement.sql).run(...statement.values);results.push({success:true,meta:{changes:Number(result.changes)}});}db.exec('COMMIT');return results;}catch(error){db.exec('ROLLBACK');throw error;}}
  };
  return db;
}
function input(extra={}){return{action:'retire-published-workbook',id:'workbook:one',expectedVersion:4,expectedStatus:'published',disposition:'archived',reason:'Synthetic educator retirement',confirmed:true,...extra};}
function snapshot(db){return Object.fromEntries(['workbooks','workbook_assignments','cohort_workbook_assignments','teaching_sessions','teaching_poll_runs','attempts','assessment_versions','workbook_cases','workbook_progress','submissions','marks','results','audit_events'].map(table=>[table,db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));}
async function rejects(status,actor=author,request=input()){await assert.rejects(retireStudioWorkbook(actor,'workbook:one',request),error=>error instanceof WorkbookRetirementError&&error.status===status);}

for(const mode of ['teaching','assessment','lecture'])test(`${mode}: routine archive produces a verifiable receipt and preserves source records`,async()=>{
  const db=setup({mode});try{const before=snapshot(db);const receipt=await retireStudioWorkbook(author,'workbook:one',input());assert.equal(receipt.ok,true);assert.equal(receipt.workbookId,'workbook:one');assert.equal(receipt.workbookVersion,4);assert.equal(receipt.disposition,'archived');assert.match(receipt.auditHash,/^[a-f0-9]{64}$/);assert.equal(db.prepare('SELECT status FROM workbooks WHERE id=?').get('workbook:one').status,'archived');
    const after=snapshot(db);for(const table of ['assessment_versions','workbook_cases','workbook_progress','submissions','marks','results'])assert.deepEqual(after[table],before[table],`${table} remains immutable`);
    assert.equal(after.audit_events.length,1);const audit=after.audit_events[0];assert.equal(audit.id,receipt.auditId);assert.equal(audit.sequence,1);assert.equal(audit.integrity_hash,receipt.auditHash);assert.equal(audit.integrity_hash,createHash('sha256').update(`GENESIS|${audit.sequence}|${audit.actor_id}|${audit.action}|${audit.target_type}|${audit.target_id}|${audit.outcome}|${audit.reason}|${audit.occurred_at}`).digest('hex'));
    await rejects(409);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n,1);
  }finally{db.close();}
});
test('cross institution, disabled Studio, revoked membership, expired entitlement and suspended account refuse without writes',async()=>{
  const cases=[
    ()=>fixture.snapshotOrg[author.userId]='org:other',
    ()=>fixture.snapshotStudioAccess=false,
    ()=>fixture.db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id=?").run(author.userId),
    ()=>fixture.db.prepare("UPDATE organization_entitlements SET valid_until='2020-01-01' WHERE organization_id='org:owned'").run(),
    ()=>fixture.db.prepare("UPDATE account_security_profiles SET status='suspended' WHERE user_id=?").run(author.userId),
    ()=>fixture.db.prepare("UPDATE users SET roles='learner' WHERE id=?").run(author.userId),
  ];
  for(const change of cases){const db=setup();try{change();const before=snapshot(db);await assert.rejects(retireStudioWorkbook(author,'workbook:one',input()),error=>error instanceof WorkbookRetirementError&&[403,409].includes(error.status));assert.deepEqual(snapshot(db),before);assert.equal(fixture.batches,0);}finally{db.close();}}
});
test('stale version refuses before batch and does not append an audit',async()=>{const db=setup();try{await rejects(409,author,input({expectedVersion:3}));assert.equal(fixture.batches,0);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n,0);}finally{db.close();}});
test('SQL failure at every batch stage rolls back audit and status together',async()=>{
  for(const pattern of [/INSERT INTO audit_events/i,/UPDATE workbooks/i,/UPDATE workbook_assignments/i,/UPDATE cohort_workbook_assignments/i,/UPDATE teaching_poll_runs/i,/UPDATE teaching_sessions/i,/UPDATE attempts/i]){
    const db=setup();try{const before=snapshot(db);fixture.failStatement=pattern;await assert.rejects(retireStudioWorkbook(author,'workbook:one',input({disposition:'withdrawn'})),/SYNTHETIC_SQL_FAILURE/);assert.deepEqual(snapshot(db),before,`rollback at ${pattern}`);}finally{db.close();}
  }
});

function addActivity(db){
  db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?,?,?,?,?,?)').run('assignment:one','workbook:one','synthetic-learner','active',author.userId,'2026-01-01',null,null,1);
  db.prepare('INSERT INTO cohorts VALUES (?,?,?,?,?,?,?,?)').run('cohort:one','course:one','Synthetic cohort','COHORT','active',author.userId,'2026-01-01',1);
  db.prepare('INSERT INTO cohort_workbook_assignments (id,cohort_id,workbook_id,status,assigned_by,assigned_at,prerequisite_min_percent,version) VALUES (?,?,?,?,?,?,?,?)').run('cohort-assignment:one','cohort:one','workbook:one','active',author.userId,'2026-01-01',100,1);
  db.prepare('INSERT INTO teaching_sessions (id,workbook_id,instructor_id,state,active_case_id,viewer_state_json,version,started_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run('session:one','workbook:one',author.userId,'live','case:one','{}',1,'2026-01-01','2026-01-01');
  db.prepare('INSERT INTO teaching_polls VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('poll:one','workbook:one','case:one','Synthetic poll','single','[]','[]','Synthetic explanation',1,1,'published',author.userId,'2026-01-01','2026-01-01');
  db.prepare('INSERT INTO teaching_poll_runs (id,poll_id,instructor_id,state,version,opened_at) VALUES (?,?,?,?,?,?)').run('pollrun:one','poll:one',author.userId,'open',1,'2026-01-01');
  db.prepare('INSERT INTO attempts (id,user_id,assessment_version_id,state,started_at,deadline_at) VALUES (?,?,?,?,?,?)').run('attempt:one','synthetic-learner','assessment:one','in-progress','2026-01-01','2027-01-01');
  db.prepare('INSERT INTO attempts (id,user_id,assessment_version_id,state,started_at,deadline_at,submitted_at,receipt_hash) VALUES (?,?,?,?,?,?,?,?)').run('attempt:submitted','synthetic-learner','assessment:one','in-progress','2026-01-01','2027-01-01','2026-01-02','submitted-hash');
  db.prepare('INSERT INTO submissions VALUES (?,?,?,?,?)').run('submission:one','attempt:submitted','evidence-hash','2026-01-02','submitted');
}
test('routine archive refuses live teaching/assessment activity; urgent withdrawal closes only mutable activity',async()=>{
  const db=setup();try{addActivity(db);const before=snapshot(db);await assert.rejects(retireStudioWorkbook(author,'workbook:one',input()),error=>error instanceof WorkbookRetirementError&&error.status===409);assert.deepEqual(snapshot(db),before);
    const receipt=await retireStudioWorkbook(author,'workbook:one',input({disposition:'withdrawn',reason:'Urgent synthetic withdrawal'}));assert.equal(receipt.disposition,'withdrawn');assert.equal(db.prepare("SELECT status FROM workbooks WHERE id='workbook:one'").get().status,'withdrawn');
    assert.notEqual(db.prepare("SELECT status FROM workbook_assignments WHERE id='assignment:one'").get().status,'active');
    assert.notEqual(db.prepare("SELECT status FROM cohort_workbook_assignments WHERE id='cohort-assignment:one'").get().status,'active');
    assert.notEqual(db.prepare("SELECT state FROM teaching_sessions WHERE id='session:one'").get().state,'live');
    assert.notEqual(db.prepare("SELECT state FROM teaching_poll_runs WHERE id='pollrun:one'").get().state,'open');
    assert.notEqual(db.prepare("SELECT state FROM attempts WHERE id='attempt:one'").get().state,'in-progress');
    assert.equal(db.prepare("SELECT state FROM attempts WHERE id='attempt:submitted'").get().state,'in-progress','submitted evidence prevents void even when state appears open');
    assert.deepEqual(snapshot(db).assessment_versions,before.assessment_versions);
    assert.deepEqual(snapshot(db).submissions,before.submissions);
  }finally{db.close();}
});
test('active learner and cohort prerequisites refuse both dispositions',async()=>{
  for(const disposition of ['archived','withdrawn'])for(const kind of ['learner','cohort']){const db=setup();try{
    if(kind==='learner'){
      db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?,?,?,?,?,?)').run('assignment:other','workbook:one','synthetic-learner','active',author.userId,'2026-01-01',null,null,1);
      db.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?,?)').run('assignment:other',null,null,'workbook:one',100,'2026-01-01');
    }else{
      db.prepare('INSERT INTO cohorts VALUES (?,?,?,?,?,?,?,?)').run('cohort:prereq','course:one','Prerequisite cohort','PREREQ','active',author.userId,'2026-01-01',1);
      db.prepare('INSERT INTO cohort_workbook_assignments (id,cohort_id,workbook_id,status,assigned_by,assigned_at,prerequisite_workbook_id,prerequisite_min_percent,version) VALUES (?,?,?,?,?,?,?,?,?)').run('cohort-assignment:prereq','cohort:prereq','workbook:one','active',author.userId,'2026-01-01','workbook:one',100,1);
    }
    const before=snapshot(db);await assert.rejects(retireStudioWorkbook(author,'workbook:one',input({disposition})),error=>error instanceof WorkbookRetirementError&&error.status===409);assert.deepEqual(snapshot(db),before);
  }finally{db.close();}}
});
test('audit receipt extends the exact existing hash chain',async()=>{
  const db=setup();try{
    db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run('prior-audit',1,author.userId,'synthetic.prior','workbook','workbook:one','success','prior reason','2026-01-01T00:00:00.000Z','a'.repeat(64));
    const receipt=await retireStudioWorkbook(author,'workbook:one',input());
    const audit=db.prepare('SELECT * FROM audit_events WHERE id=?').get(receipt.auditId);
    assert.equal(audit.sequence,2);
    assert.equal(audit.integrity_hash,createHash('sha256').update(`${'a'.repeat(64)}|2|${audit.actor_id}|${audit.action}|${audit.target_type}|${audit.target_id}|${audit.outcome}|${audit.reason}|${audit.occurred_at}`).digest('hex'));
    assert.equal(receipt.auditHash,audit.integrity_hash);
  }finally{db.close();}
});
test('before-batch version, activity and audit-head races refuse atomically',async()=>{
  const injections=[
    db=>db.prepare("UPDATE workbooks SET version=5 WHERE id='workbook:one'").run(),
    db=>db.prepare('INSERT INTO attempts (id,user_id,assessment_version_id,state,started_at,deadline_at) VALUES (?,?,?,?,?,?)').run('rival-attempt','synthetic-learner','assessment:one','in-progress','2026-01-01','2027-01-01'),
    db=>db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?,?,?)').run('rival-audit',1,'rival','other','workbook','workbook:one','success','rival','2026-01-01','rival-hash'),
  ];
  for(const inject of injections){const db=setup();try{fixture.beforeBatch=inject;await assert.rejects(retireStudioWorkbook(author,'workbook:one',input()),error=>error instanceof WorkbookRetirementError);assert.equal(db.prepare("SELECT status FROM workbooks WHERE id='workbook:one'").get().status,'published');assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE action LIKE '%retire%'").get().n,0);}finally{db.close();}}
});

test('entitlement status, strict expiry and organization status refuse before mutation',async()=>{
  const changes=[
    db=>db.prepare("UPDATE organization_entitlements SET status='revoked' WHERE organization_id='org:owned'").run(),
    db=>db.prepare("UPDATE organization_entitlements SET studio_access=0 WHERE organization_id='org:owned'").run(),
    db=>db.prepare("UPDATE organization_entitlements SET valid_until='2020-01-01T00:00:00.000Z' WHERE organization_id='org:owned'").run(),
    db=>db.prepare("UPDATE organization_entitlements SET valid_until='tomorrow' WHERE organization_id='org:owned'").run(),
    db=>db.prepare("UPDATE organizations SET status='suspended' WHERE id='org:owned'").run(),
  ];
  for(const change of changes){const db=setup();try{change(db);const before=snapshot(db);await rejects(403);assert.deepEqual(snapshot(db),before);assert.equal(fixture.batches,0);}finally{db.close();}}
});
test('authority, workbook identity and new prerequisite races reject the entire batch',async()=>{
  const changes=[
    db=>db.prepare("UPDATE users SET roles='learner' WHERE id=?").run(author.userId),
    db=>db.prepare("UPDATE account_security_profiles SET status='suspended' WHERE user_id=?").run(author.userId),
    db=>db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id=?").run(author.userId),
    db=>db.prepare("UPDATE organization_entitlements SET studio_access=0 WHERE organization_id='org:owned'").run(),
    db=>db.prepare("UPDATE organization_entitlements SET valid_until='2020-01-01T00:00:00.000Z' WHERE organization_id='org:owned'").run(),
    db=>db.prepare("UPDATE workbooks SET title='Competing title' WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE workbooks SET mode='assessment' WHERE id='workbook:one'").run(),
    db=>db.prepare("UPDATE course_ownership SET organization_id='org:other' WHERE course_id='course:one'").run(),
    db=>{db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?,?,?,?,?,?)').run('rival-assignment','workbook:one','synthetic-learner','active',author.userId,'2026-01-01',null,null,1);db.prepare('INSERT INTO workbook_assignment_rules VALUES (?,?,?,?,?,?)').run('rival-assignment',null,null,'workbook:one',100,'2026-01-01');},
  ];
  for(const change of changes){const db=setup();try{fixture.beforeBatch=change;await assert.rejects(retireStudioWorkbook(author,'workbook:one',input()),error=>error instanceof WorkbookRetirementError&&error.status===409);assert.equal(db.prepare("SELECT status FROM workbooks WHERE id='workbook:one'").get().status,'published');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n,0);}finally{db.close();}}
});
test('successful institution retirement leaves another institution workbook and access untouched',async()=>{
  const db=setup();try{
    db.prepare('INSERT INTO courses VALUES (?,?,?,?,?)').run('course:other','OTHER','Other course','Synthetic description','active');
    db.prepare('INSERT INTO modules VALUES (?,?,?,?)').run('module:other','course:other','Other module',1);
    db.prepare('INSERT INTO course_ownership VALUES (?,?,?,?)').run('course:other','org:other',outsider.userId,'2026-01-01');
    db.prepare('INSERT INTO workbooks (id,module_id,title,mode,version,status,duration_minutes) VALUES (?,?,?,?,?,?,?)').run('workbook:other','module:other','Other workbook','teaching',4,'published',30);
    db.prepare('INSERT INTO workbook_assignments VALUES (?,?,?,?,?,?,?,?,?)').run('assignment:other','workbook:other','synthetic-learner','active',outsider.userId,'2026-01-01',null,null,1);
    const otherBefore=db.prepare("SELECT * FROM workbooks WHERE id='workbook:other'").get();const accessBefore=db.prepare("SELECT * FROM workbook_assignments WHERE id='assignment:other'").get();
    await retireStudioWorkbook(author,'workbook:one',input({disposition:'withdrawn'}));
    assert.deepEqual(db.prepare("SELECT * FROM workbooks WHERE id='workbook:other'").get(),otherBefore);
    assert.deepEqual(db.prepare("SELECT * FROM workbook_assignments WHERE id='assignment:other'").get(),accessBefore);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n,1);
  }finally{db.close();}
});
