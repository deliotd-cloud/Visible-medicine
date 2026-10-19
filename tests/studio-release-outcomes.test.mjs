import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const site=resolve(import.meta.dirname,'..');
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
let state;
const seams={
 env:{get DB(){return state.db;}},
 async ensureEducationUser(){return {roles:state.roles,status:'active'};},
 async getPlatformSnapshot(){return {entitlement:{studioAccess:state.studioAccess},organization:{id:'org:owned',name:'Teaching institution',kind:'institution'}};},
 async appendAudit(...args){state.audits.push(args);},
 accountMayWrite(status){return status==='active';},
 accountWriteBlockReason(){return 'Account writes are disabled.';},
 async sha256(value){return createHash('sha256').update(value).digest('hex');},
};
const built=await build({stdin:{contents:source,resolveDir:site,sourcefile:'lib/education-platform.ts',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{
 name:'synthetic-education-dependencies',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path in names||args.path==='@/lib/auth')return {path:args.path,namespace:'seam'};
   if(args.path==='test-seams')return {path:args.path,external:true};
   if(['@/lib/workbook-eligibility','@/lib/workbook-access-policy'].includes(args.path))return {path:resolve(site,args.path.slice(2)+'.ts')};
   throw Error(`Unexpected import: ${args.path}`);
  });
  b.onLoad({filter:/.*/,namespace:'seam'},args=>({contents:`import seam from 'test-seams';\n${(names[args.path]??[]).map(name=>`export const ${name}=seam.${name};`).join('\n')}`,loader:'js'}));
 }
}]});
const module={exports:{}};
new Function('module','exports','require',built.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-seams');return seams;});
const {saveCourseReleaseDraft,EducationPlatformError}=module.exports;
const auth={userId:'synthetic-educator'};
const base={courseId:'course:owned',title:'A course',summary:'A sufficiently long summary for this course.',slug:'a-course',visibility:'private',accessModel:'invitation',publisherKind:'institution',workbookIds:[],outcomes:['First outcome','Second outcome']};

function reset(){
 state={roles:['instructor'],studioAccess:true,calls:[],audits:[],saved:null};
 state.db={prepare(sql){
  const statement={sql,values:[],bind(...values){this.values=values;return this;},
   async first(){state.calls.push({kind:'first',sql,values:this.values});if(sql.includes('FROM courses c JOIN course_ownership'))return this.values[0]===base.courseId&&this.values[1]==='org:owned'?{id:base.courseId,title:'A course'}:null;if(sql.includes('FROM audit_events'))return null;if(sql.includes('FROM account_security_profiles'))return {status:'active'};throw Error(`Unexpected first: ${sql}`);},
   async run(){state.calls.push({kind:'run',sql,values:this.values});if(sql.includes('INSERT INTO course_releases'))state.saved=JSON.parse(this.values[8]);if(sql.includes('INSERT INTO audit_events'))state.audits.push(this.values);return {meta:{changes:1}};}};
  return statement;
 },async batch(statements){const results=[];for(const statement of statements)results.push(await statement.run());return results;}};
}

test('server refuses overflow and malformed outcomes before any write or audit',async()=>{
 for(const outcomes of [
  Array.from({length:9},(_,i)=>`Outcome ${i+1}`),
  ['x'.repeat(181),'Second outcome'],
  ['First outcome',17,'Second outcome'],
 ]){
  reset();await assert.rejects(saveCourseReleaseDraft(auth,{...base,outcomes}),error=>error instanceof EducationPlatformError&&error.status===422);
  assert.equal(state.calls.some(call=>call.kind==='run'),false);
  assert.equal(state.audits.length,0);
 }
});

test('eight trimmed distinct outcomes retain full text and author order',async()=>{
 reset();const outcomes=Array.from({length:8},(_,i)=>i===3?'x'.repeat(180):`Outcome ${i+1}`);
 const submitted=[`  ${outcomes[0]}  `,...outcomes.slice(1),outcomes[0]];
 await saveCourseReleaseDraft(auth,{...base,outcomes:submitted});
 assert.deepEqual(state.saved,outcomes);
 assert.equal(state.audits.length,1);
});

test('existing role and entitlement gates still deny before database access',async()=>{
 for(const denied of [{roles:['learner']},{studioAccess:false}]){
  reset();Object.assign(state,denied);
  await assert.rejects(saveCourseReleaseDraft(auth,base),error=>error instanceof EducationPlatformError&&error.status===403);
  assert.equal(state.calls.length,0);
 }
});
