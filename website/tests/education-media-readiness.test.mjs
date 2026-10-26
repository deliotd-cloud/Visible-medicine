import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {educationMediaReadiness,requiresEducationPreflight} from '../lib/education-media-readiness.ts';

const site=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(resolve(site,'package.json'));
const {build}=require('esbuild'),ts=require('typescript');
const source=readFileSync(resolve(site,'lib/repository.ts'),'utf8');
const syntax=ts.createSourceFile('repository.ts',source,ts.ScriptTarget.Latest,true);
const storeText=readFileSync(resolve(site,'lib/assessment-manifest-store.ts'),'utf8');
const storeSyntax=ts.createSourceFile('assessment-manifest-store.ts',storeText,ts.ScriptTarget.Latest,true);
const viewerVersion=storeSyntax.statements.filter(ts.isVariableStatement)
  .flatMap(statement=>statement.declarationList.declarations)
  .find(declaration=>declaration.name.getText(storeSyntax)==='EDUCATION_VIEWER_CORE_VERSION')?.initializer;
assert(viewerVersion&&ts.isStringLiteral(viewerVersion),'viewer version must be a source literal');
const imports=new Map();
for(const statement of syntax.statements){
  if(!ts.isImportDeclaration(statement)||statement.importClause?.isTypeOnly)continue;
  const bindings=statement.importClause?.namedBindings;
  if(!bindings||!ts.isNamedImports(bindings))continue;
  imports.set(statement.moduleSpecifier.text,bindings.elements.filter(item=>!item.isTypeOnly).map(item=>(item.propertyName??item.name).text));
}
async function compileRepository(text){
  const result=await build({stdin:{contents:text,resolveDir:site,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',tsconfigRaw:{},plugins:[{name:'synthetic-education-boundary',setup(b){
    b.onResolve({filter:/.*/},args=>{
      if(args.path==='@/lib/education-media-readiness')return{path:resolve(site,'lib/education-media-readiness.ts')};
      // This pure, code-owned SQL helper is evaluated while repository loads.
      // Bind its real implementation; synthetic fixture state is installed later.
      if(args.path==='./workbook-workflow-material.ts')return{path:resolve(site,'lib/workbook-workflow-material.ts')};
      if(imports.has(args.path))return{path:args.path,namespace:'synthetic'};
    });
    b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({loader:'js',contents:imports.get(args.path).map(name=>name==='env'
      ? 'export const env=new Proxy({},{get:(_,key)=>globalThis.__educationMedia.env[key]});'
      : name==='EDUCATION_VIEWER_CORE_VERSION'&&args.path==='@/lib/assessment-manifest-store'
      ? `export const EDUCATION_VIEWER_CORE_VERSION=${JSON.stringify(viewerVersion.text)};`
      : `export const ${name}=(...args)=>{const value=globalThis.__educationMedia.dependencies[${JSON.stringify(args.path)}]?.[${JSON.stringify(name)}];if(typeof value==='function')return value(...args);throw Error('Unexpected dependency: ${name}');};`).join('\n')}));
  }}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
globalThis.__educationMedia={};
const api=await compileRepository(source);
const auth={userId:'synthetic-learner',email:'learner@example.invalid',displayName:'Synthetic learner'};
const validPayload={selectedWorkbookId:'synthetic-workbook',passed:true,checkCount:5};
function fixture(options={}){
  const state={reads:[],writes:[],audits:[],authorized:options.authorized!==false};
  const manifest={assessment:{durationMinutes:30,displayPolicy:{dualDisplayAllowed:false}},cases:[{id:'synthetic-case',media:{kind:'dicom',series:[{frameCount:2,sopInstanceUids:['synthetic-a','synthetic-b']}],...options.media}}]};
  const statement=sql=>({bind(){return statement(sql);},async all(){state.reads.push(sql);if(/user_roles/.test(sql))return{results:[{role:'learner'}]};throw Error('Unexpected read');},async first(){
    state.reads.push(sql);
    if(/SELECT roles FROM users/.test(sql))return{roles:'learner'};
    if(/FROM workbooks w JOIN assessment_versions/.test(sql))return{id:'synthetic-workbook',mode:options.teaching?'teaching':'assessment',duration_minutes:30,assessment_version_id:'synthetic-version',dual_display_allowed:0};
    if(/SELECT id FROM attempts/.test(sql))return options.existing===false?null:{id:'synthetic-attempt'};
    if(/FROM learner_accommodations/.test(sql))return null;
    if(/SELECT state, deadline_at, preflight_passed_at/.test(sql))return{state:'in-progress',deadline_at:'2099-01-01T00:00:00Z',preflight_passed_at:'2026-01-01T00:00:00Z'};
    if(/SELECT case_id FROM workbook_cases/.test(sql))return{case_id:'synthetic-case'};
    throw Error('Unexpected read: '+sql);
  },async run(){state.writes.push(sql);throw Error('ASSESSMENT_WRITE_REACHED');}});
  state.env={DB:{prepare(sql){assert.match(sql,/^(SELECT|INSERT|UPDATE)/);return statement(sql);}}};
  state.dependencies={
    '@/db/bootstrap':{ensureEducationUser:async()=>{},appendAudit:async(...args)=>{state.audits.push(args);}},
    '@/lib/workbook-access':{canAccessPublishedWorkbook:async()=>state.authorized},
    '@/lib/domain':{safeText:value=>typeof value==='string'?value:''},
    '@/lib/assessment-manifest-store':{getVerifiedAssessmentManifest:async()=>{if(options.corrupt)throw Error('Synthetic corrupt manifest');return{manifest};}},
  };
  globalThis.__educationMedia=state;return state;
}
test('media availability stays closed without an actual protected delivery adapter',()=>{
  const readiness=educationMediaReadiness();assert.equal(readiness.mediaReady,false);
  assert.match(readiness.mediaUnavailableReason,/assessment images are not available/i);
  assert.match(readiness.mediaUnavailableReason,/cannot start until its images are ready/i);
});
for(const state of ['submitted','accepted-for-marking','marked','moderated','approved','released','expired','voided'])test(state+' preserves historical read-only review context even without media',()=>{
  assert.equal(requiresEducationPreflight(state,null,false),false);
  assert.equal(requiresEducationPreflight(state,'2026-01-01T00:00:00Z',false),false);
});
test('assigned attempts cannot skip entry preflight',()=>{
  for(const passed of [null,'2026-01-01T00:00:00Z'])for(const ready of [false,true])assert.equal(requiresEducationPreflight('assigned',passed,ready),true);
});
for(const state of ['in-progress','reopened'])test(state+' requires both a passed check and available media',()=>{
  assert.equal(requiresEducationPreflight(state,null,false),true);
  assert.equal(requiresEducationPreflight(state,'2026-01-01T00:00:00Z',false),true);
  assert.equal(requiresEducationPreflight(state,null,true),true);
  assert.equal(requiresEducationPreflight(state,'2026-01-01T00:00:00Z',true),false);
});
test('unknown attempt states cannot bypass preflight',()=>{
  for(const state of [undefined,null,'','SUBMITTED','unrecognized'])assert.equal(requiresEducationPreflight(state,'2026-01-01T00:00:00Z',true),true);
});
for(const [name,media] of [
  ['identifiers only',{}],['quarantine intake',{state:'quarantine',objectKey:'synthetic-quarantine'}],
  ['stale revision claim',{state:'cleared',revision:'old',objectKey:'synthetic-object'}],
  ['self-declared ready',{mediaReady:true,approved:true,objectKey:'synthetic-object'}],
])for(const existing of [false,true])test(`${name}: forged preflight cannot start or renew ${existing?'existing':'new'} exam`,{concurrency:false},async()=>{
  const state=fixture({media,existing});await assert.rejects(api.recordExamPreflight(auth,validPayload),error=>error.status===409&&/assessment images are not available/i.test(error.message));
  assert.equal(state.writes.length,0);assert.equal(state.audits.length,0);
  assert(!state.reads.some(sql=>/FROM attempts/.test(sql)),'refuses before attempt creation or renewal');
});
for(const [name,payload,status] of [
  ['false passed',{...validPayload,passed:false},422],['forged readiness field',{...validPayload,mediaReady:true},422],
  ['unallocated account',validPayload,403],['corrupt version',validPayload,503],
])test(name+' preserves the existing input/access/integrity gate',{concurrency:false},async()=>{
  const state=fixture({authorized:name!=='unallocated account',corrupt:name==='corrupt version'});
  await assert.rejects(api.recordExamPreflight(auth,payload),error=>error.status===status);
  assert.equal(state.writes.length,0);assert.equal(state.audits.length,0);
});
for(const [name,method,payload] of [
  ['answer','saveAnswer',{questionId:'synthetic-question',response:'Synthetic',expectedRevision:0}],
  ['annotation','addAnnotation',{caseId:'synthetic-case',kind:'marker',label:'Synthetic',geometry:'{}'}],
  ['key image','addKeyImage',{caseId:'synthetic-case',frameIndex:0,viewport:'{}'}],
  ['case flag','setCaseFlag',{caseId:'synthetic-case',flagged:true,expectedRevision:0}],
  ['submission','submitAttempt',{}],
])test('old passed-preflight cannot add scored '+name+' without media',{concurrency:false},async()=>{
  const state=fixture();await assert.rejects(api[method](auth,{selectedWorkbookId:'synthetic-workbook',...payload}),error=>error.status===409&&/assessment images are not available/i.test(error.message));
  assert.equal(state.writes.length,0);assert.equal(state.audits.length,0);
});
test('teaching editing still passes the media gate and reaches its original write boundary',{concurrency:false},async()=>{
  const state=fixture({teaching:true});await assert.rejects(api.addAnnotation(auth,{selectedWorkbookId:'synthetic-workbook',caseId:'synthetic-case',kind:'marker',label:'Synthetic',geometry:'{}'}),/ASSESSMENT_WRITE_REACHED/);
  assert.equal(state.writes.length,1);assert.match(state.writes[0],/INSERT INTO annotations/);
});
test('a guard-removal mutant reproduces the unsafe new attempt write',{concurrency:false},async()=>{
  const needle='if (startAssessment) requireAssessmentMedia();';assert.equal(source.split(needle).length,2);
  const mutant=await compileRepository(source.replace(needle,''));const state=fixture({existing:false});
  await assert.rejects(mutant.recordExamPreflight(auth,validPayload),/ASSESSMENT_WRITE_REACHED/);
  assert.equal(state.writes.length,1);assert.match(state.writes[0],/INSERT OR IGNORE INTO attempts/);
});
test('learner and author snapshots use truthful readiness, never series IDs as availability',()=>{
  assert.equal((source.match(/const mediaReadiness = educationMediaReadiness\(\);/g)||[]).length,2);
  assert(source.includes('requiresEducationPreflight(attempt.state, attempt.preflight_passed_at, mediaReadiness.mediaReady)'));
  assert(source.includes('assessmentPreflight: { required: false, caseCount: fullCases.length, ...mediaReadiness }'));
  assert(!source.includes('series.frameCount > 0 && series.sopInstanceUids.length > 0'));
  const runtime=readFileSync(resolve(site,'components/EducationRuntime.tsx'),'utf8');
  assert(runtime.includes('Historical exam context remains available for read-only review.'));
  assert(runtime.includes('!data.assessmentPreflight.required && !data.assessmentPreflight.mediaReady'));
});
test('the actual preflight panel explains unavailable delivery and disables exam entry',async()=>{
  const runtime=readFileSync(resolve(site,'components/EducationRuntime.tsx'),'utf8');
  const syntax=ts.createSourceFile('runtime.tsx',runtime,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const node=syntax.statements.find(item=>ts.isFunctionDeclaration(item)&&item.name?.text==='ExamPreflightPanel');assert(node);
  const result=await build({stdin:{contents:`const useState=initial=>[initial,()=>{}];const shortHash=value=>value.slice(0,8);${node.getText(syntax)};export {ExamPreflightPanel};`,resolveDir:site,loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',tsconfigRaw:{}});
  const {ExamPreflightPanel}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  const {renderToStaticMarkup}=require('react-dom/server');
  const html=renderToStaticMarkup(ExamPreflightPanel({data:{assessmentPreflight:{required:true,caseCount:1,...educationMediaReadiness()},course:{dualDisplayAllowed:false,workbookVersion:1,assessmentHash:'synthetic-hash'}},online:true,onComplete:async()=>true}));
  assert(html.includes('Assessment image availability'));assert(html.includes(educationMediaReadiness().mediaUnavailableReason));
  assert.match(html,/<button[^>]*disabled[^>]*>Enter exam workspace<\/button>/);
});
