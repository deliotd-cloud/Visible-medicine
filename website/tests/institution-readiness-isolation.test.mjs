import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const entry = fileURLToPath(new URL('../lib/institution-operations.ts', import.meta.url));
const stubs = {
  'cloudflare:workers': 'export const env = {DB:{prepare:(...args) => globalThis.__institutionFixture.env.DB.prepare(...args)}};',
  '@/db/bootstrap': 'export const ensureDatabase = async () => {}; export const ensureEducationUser = auth => globalThis.__institutionFixture.educationUser(auth); export const appendAudit = (...args) => globalThis.__institutionFixture.audit.push(args);',
  '@/db/platform': 'export const ensurePlatformSchema = async () => {}; export const getPlatformSnapshot = auth => globalThis.__institutionFixture.platformSnapshot(auth);',
  '@/lib/domain': 'export const sha256 = async value => value;',
  '@/lib/pilot-readiness': `export const PILOT_READINESS_GATES = [{key:'identity',owner:'Operations',title:'Identity'}]; export const READINESS_STATUSES = ['not-started','in-progress','ready']; export const normaliseEmail = value => String(value); export const normaliseInvitationRole = value => String(value); export const parseRosterInput = value => value;`,
  '@/lib/transactional-email': `export const emailProviderReadiness = () => ({ready:false,reason:'DISABLED'}); export const getEmailProviderConfig = () => ({}); export const organizationInvitationEmail = () => ({}); export const sendTransactionalEmail = async () => ({status:'held',reason:'DISABLED',sentAt:null});`,
};
const built = await build({ entryPoints:[entry], bundle:true, write:false, platform:'node', format:'esm', tsconfigRaw:{}, plugins:[{name:'synthetic-boundaries',setup(bundle){
  bundle.onResolve({filter:/.*/}, request => Object.hasOwn(stubs, request.path) ? {path:request.path,namespace:'fixture'} : undefined);
  bundle.onLoad({filter:/.*/,namespace:'fixture'}, request => ({contents:stubs[request.path],loader:'js'}));
}}] });
const operations = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));

function fixture() {
  const accounts = new Map([
    ['alpha-owner',{roles:['administrator'],status:'active',memberships:[{id:'alpha',role:'owner'}]}],
    ['alpha-admin',{roles:['administrator'],status:'active',memberships:[{id:'alpha',role:'administrator'}]}],
    ['cross-learner',{roles:['administrator'],status:'active',memberships:[{id:'beta',role:'administrator'},{id:'alpha',role:'learner'}]}],
    ['cross-educator',{roles:['administrator'],status:'active',memberships:[{id:'beta',role:'owner'},{id:'alpha',role:'educator'}]}],
    ['inactive-owner',{roles:['administrator'],status:'restricted',memberships:[{id:'alpha',role:'owner'}]}],
    ['ordinary-owner',{roles:['learner'],status:'active',memberships:[{id:'alpha',role:'owner'}]}],
  ]);
  const checks = [{organization_id:'alpha',gate_key:'identity',status:'in-progress',evidence:'Alpha evidence',owner:'Alpha owner',reviewed_at:null},
    {organization_id:'beta',gate_key:'identity',status:'ready',evidence:'Beta private evidence',owner:'Beta owner',reviewed_at:'2026-01-01T00:00:00.000Z'}];
  const applications = [{id:'beta-pilot',organization_name:'Beta',contact_name:'Private Person',contact_email:'private@example.invalid',goals:'Private free text',submitted_by:null}];
  const originalApplications = structuredClone(applications);
  const queries = [], audit = [];
  const DB = {prepare(sql){
    queries.push({sql,bindings:null}); const query=queries.at(-1);
    const statement={bind(...values){query.bindings=values;return statement;},async all(){
      if(sql.includes('FROM operational_readiness_checks')) return {results:checks.filter(row=>row.organization_id===query.bindings?.[0]).map(row=>({...row}))};
      if(sql.includes('FROM pilot_applications')) return {results:applications.map(row=>({...row}))};
      throw Error('Unexpected SELECT: '+sql);
    },async run(){
      if(!sql.includes('INSERT INTO operational_readiness_checks')) throw Error('Unexpected write: '+sql);
      const [organization_id,gate_key,status,evidence,owner,,reviewed_at]=query.bindings;
      const prior=checks.find(row=>row.organization_id===organization_id&&row.gate_key===gate_key);
      if(prior)Object.assign(prior,{status,evidence,owner,reviewed_at});
      else checks.push({organization_id,gate_key,status,evidence,owner,reviewed_at});
      return {success:true};
    }}; return statement;
  }};
  const state={env:{DB},audit,educationUser(auth){return accounts.get(auth.userId);},platformSnapshot(auth){
    const membership=accounts.get(auth.userId)?.memberships.find(item=>item.id===auth.organizationId);
    if(!membership)throw Error('No selected active organisation membership');
    return {organization:{id:membership.id,name:membership.id,role:membership.role},entitlement:{status:'evaluation'}};
  }};
  globalThis.__institutionFixture=state;
  return {queries,checks,applications,originalApplications,audit,auth:(userId,organizationId='alpha')=>({userId,organizationId,email:userId+'@example.invalid'})};
}
const scopedReads = fixture => fixture.queries.filter(query=>/FROM operational_readiness_checks|FROM pilot_applications/.test(query.sql));

test('global administrator cannot read or write selected learner or educator organisation',async()=>{
  const f=fixture();
  for(const actor of ['cross-learner','cross-educator']){
    const auth=f.auth(actor);
    await assert.rejects(operations.getReadinessSnapshot(auth),error=>error.status===403);
    await assert.rejects(operations.saveReadinessCheck(auth,{gateKey:'identity',status:'ready',evidence:'Unapproved cross-organisation evidence'}),error=>error.status===403);
  }
  assert.deepEqual(scopedReads(f),[]);
  assert.deepEqual(f.checks[0].evidence,'Alpha evidence');
  assert.deepEqual(f.checks[1].evidence,'Beta private evidence');
  assert.deepEqual(f.audit,[]);
});

test('inactive account and missing global administrator role refuse scoped reads and writes',async()=>{
  const f=fixture();
  for(const actor of ['inactive-owner','ordinary-owner']){
    const auth=f.auth(actor);
    await assert.rejects(operations.getReadinessSnapshot(auth),error=>error.status===403);
    await assert.rejects(operations.saveReadinessCheck(auth,{gateKey:'identity',status:'in-progress'}),error=>error.status===403);
  }
  assert.deepEqual(scopedReads(f),[]);
  assert.deepEqual(f.audit,[]);
});

test('the same organisation guard protects people, invitations and learning reports',async()=>{
  const f=fixture();
  for(const actor of ['cross-learner','cross-educator','inactive-owner','ordinary-owner']){
    const auth=f.auth(actor);
    await assert.rejects(operations.getPeopleSnapshot(auth),error=>error.status===403);
    await assert.rejects(operations.createOrganizationInvitations(auth,{roster:'synthetic@example.invalid'}),error=>error.status===403);
    await assert.rejects(operations.institutionProgressCsv(auth),error=>error.status===403);
  }
  assert.deepEqual(f.queries,[]);
  assert.deepEqual(f.audit,[]);
});

test('active selected owner and administrator retain scoped readiness save and read without pilot access',async()=>{
  const f=fixture();
  for(const actor of ['alpha-owner','alpha-admin']){
    const auth=f.auth(actor);
    const before=await operations.getReadinessSnapshot(auth);
    assert.equal(before.organization.id,'alpha');
    assert.equal(before.gates[0].recordedEvidence,actor==='alpha-owner'?'Alpha evidence':'Alpha approved evidence recorded for this gate');
    assert.equal(before.activationAllowed,false);
    assert.equal(before.activationReason,'NON_LIVE_PILOT_CONFIGURATION');
    assert.equal(Object.hasOwn(before,'applications'),false);
    await operations.saveReadinessCheck(auth,{gateKey:'identity',status:'ready',evidence:'Alpha approved evidence recorded for this gate'});
    const after=await operations.getReadinessSnapshot(auth);
    assert.equal(after.gates[0].status,'ready');
    assert.equal(after.readyCount,1);
    assert.equal(after.gates[0].recordedEvidence,'Alpha approved evidence recorded for this gate');
    assert.equal(Object.hasOwn(after,'applications'),false);
  }
  const beta = await operations.getReadinessSnapshot(f.auth('cross-learner','beta'));
  assert.equal(beta.organization.id,'beta');
  assert.equal(beta.gates[0].recordedEvidence,'Beta private evidence');
  assert.equal(Object.hasOwn(beta,'applications'),false);
  assert(scopedReads(f).every(query=>query.sql.includes('FROM operational_readiness_checks')&&['alpha','beta'].includes(query.bindings?.[0])));
  assert.deepEqual(scopedReads(f).map(query=>query.bindings?.[0]),['alpha','alpha','alpha','alpha','beta']);
  assert.equal(f.queries.some(query=>query.sql.includes('FROM pilot_applications')),false);
  assert.deepEqual(f.applications,f.originalApplications);
  assert.equal(f.checks[1].evidence,'Beta private evidence');
  assert.equal(f.audit.length,2);
});
