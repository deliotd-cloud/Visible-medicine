import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { build } = createRequire(resolve(root, 'package.json'))('esbuild');
const identity = { 'oai-authenticated-user-id': 'verified-17', 'oai-authenticated-user-email': 'verified@synthetic.invalid' };
const actor = { userId: 'edu:verified-17', externalSubject: 'sites:verified-17', email: 'verified@synthetic.invalid', displayName: 'verified@synthetic.invalid' };
const expectedStudioContext = {actorId: actor.userId, organizationId: 'synthetic-organization'};
let requestHeaders = new Headers();
let calls = [];
let contextCalls = [];
let currentOrganization = expectedStudioContext.organizationId;
let contextUnavailable = false;
let denial = null;
let pilotActor;
class ServiceError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const services = new Proxy({
  // Only the D1 boundary is synthetic; both actual Studio comparison helpers
  // remain bundled. This fixture never opens a real database or grants a role.
  env: {DB: {withSession(mode) {
    assert.equal(mode, 'first-primary'); contextCalls.push(['session', mode]);
    return {prepare(sql) {
      assert.equal(sql, "SELECT o.id FROM organizations o JOIN organization_memberships m ON m.organization_id=o.id WHERE m.user_id=? AND m.status='active' ORDER BY o.created_at LIMIT 1");
      contextCalls.push(['query', sql]);
      return {bind(actorId) {
        contextCalls.push(['actor', actorId]);
        return {async first() {
          contextCalls.push(['read']);
          if (contextUnavailable) throw Error('SYNTHETIC_PRIVATE_DATABASE_FAILURE');
          return currentOrganization ? {id: currentOrganization} : null;
        }};
      }};
    }};
  }}},
  DomainError: ServiceError, EducationPlatformError: ServiceError,
  InstitutionOperationsError: ServiceError, PlatformGovernanceError: ServiceError,
  PresentationValidationError: ServiceError, SpatialLinkError: ServiceError,
  TeachingPollValidationError: ServiceError, TeachingSessionValidationError: ServiceError,
  TeachingContentValidationError: ServiceError, QuestionBankValidationError: ServiceError,
  IntegrationValidationError: ServiceError,
  async enforceRateLimit(...args) { calls.push(['rate', ...args]); },
  async submitPilotApplication(auth) { pilotActor = auth; calls.push(['pilot', auth]); return { accepted: true }; },
  async sha256() { return 'synthetic-hash'; },
}, { get(target, name) {
  if (name in target) return target[name];
  return async (...args) => {
    calls.push([name, ...args]);
    if (denial) throw new ServiceError('Synthetic role refusal.', denial);
    if (name === 'getAppSnapshot') return { snapshot: true };
    if (name === 'getStudioSnapshot') return { studio: true };
    if (name === 'getPeopleSnapshot') return { people: true };
    if (name === 'getReadinessSnapshot') return { readiness: true };
    if (name === 'getLearnerProfile') return { profile: true };
    if (name === 'getLearnerEnrolments') return [];
    if (name === 'exportLearnerData') return { export: true };
    return { synthetic: true };
  };
} });
const modules = {
  'cloudflare:workers': ['env'],
  '@/lib/repository': ['DomainError','getAppSnapshot','saveAnswer','addAnnotation','addKeyImage','setCaseFlag','submitAttempt','finalizeTimedAttempt','createIngestion','reviewIngestion','assignWorkbook','revokeWorkbookAssignment','createCohort','addCohortMember','removeCohortMember','assignCohortWorkbook','revokeCohortWorkbookAssignment','recordWorkbookProgress','requestAccommodation','approveAccommodation','revokeAccommodation','recordDisplayLaunch','recordExamPreflight','saveMark','moderateMark','releaseResult'],
  '@/lib/education-platform': ['EducationPlatformError','getStudioSnapshot','createCourseInvitation','assignStudioCohortWorkbook','createStudioCohort','createStudioCourse','createStudioCourseFromTemplate','createStudioWorkbook','duplicateStudioCourse','duplicateStudioWorkbook','publishCourseRelease','reviewCourseRelease','saveCourseReleaseDraft','submitCourseRelease','updateStudioCourse','enrolInCourse','getLearnerEnrolments','getLearnerProfile','saveLearnerProfile'],
  '@/lib/institution-operations': ['InstitutionOperationsError','enforceRateLimit','exportLearnerData','createAccountRequest','saveNotificationPreferences','createOrganizationInvitations','acceptOrganizationInvitation','getPeopleSnapshot','getReadinessSnapshot','saveReadinessCheck','submitPilotApplication'],
  '@/lib/platform-governance': ['PlatformGovernanceError','getControlCentreSnapshot','addAtlasAnnotation','createAtlasDraft','issueEmbedLaunch','publishAtlasPublication','reviewAtlasPublication','saveBillingIntent','saveIdentityDraft','saveOrganizationProfile','submitAtlasForReview','syncCourseCompletion'],
  '@/db/progress': ['listProgress','saveProgress'],
  '@/lib/domain': ['sha256'],
  '@/lib/education-presentations': ['PresentationValidationError'],
  '@/lib/education-viewer-adapter': ['SpatialLinkError'],
  '@/lib/teaching-polls': ['TeachingPollValidationError'],
  '@/lib/teaching-sessions': ['TeachingSessionValidationError'],
  '@/lib/teaching-content': ['TeachingContentValidationError'],
  '@/lib/question-bank': ['QuestionBankValidationError'],
  '@/lib/education-integrations': ['IntegrationValidationError'],
};
const actual = new Set(['@/lib/auth','@/app/chatgpt-auth','@/lib/education-api','@/lib/request-security','@/lib/mutation-json','@/lib/studio-mutation-context','@/lib/studio-mutation-context-server']);
const routePaths = {
  app: 'app/api/app/route.ts', studio: 'app/api/studio/route.ts',
  learnerAccount: 'app/api/learner/account/route.ts', learnerData: 'app/api/learner/data/route.ts',
  learnerPreferences: 'app/api/learner/preferences/route.ts',
  institutionAccept: 'app/api/platform/people/accept/route.ts',
  people: 'app/api/platform/people/route.ts', readiness: 'app/api/platform/readiness/route.ts',
  control: 'app/api/platform/control/route.ts', pilot: 'app/api/institutions/pilot/route.ts',
  progress: 'app/api/progress/route.ts',
  educationApi: 'lib/education-api.ts',
};
const routes = {};
for (const [name, path] of Object.entries(routePaths)) {
  const result = await build({
    entryPoints: [resolve(root, path)], bundle: true, platform: 'node', format: 'cjs', write: false,
    metafile: true, logLevel: 'silent', tsconfigRaw: {},
    plugins: [{ name: 'actual-auth-with-service-seams', setup(plugin) {
      plugin.onResolve({ filter: /.*/ }, args => {
        if (args.path === 'test-seams' && args.namespace === 'seam') return { path: args.path, external: true };
        if (args.path === 'next/headers' || args.path === 'next/navigation') return { path: args.path, namespace: 'next-seam' };
        if (actual.has(args.path)) return { path: resolve(root, args.path.slice(2) + '.ts') };
        if (args.path === './studio-mutation-context' && resolve(args.importer) === resolve(root, 'lib/studio-mutation-context-server.ts'))
          return { path: resolve(root, 'lib/studio-mutation-context.ts') };
        if (Object.hasOwn(modules, args.path)) return { path: args.path, namespace: 'seam' };
        if (args.kind === 'entry-point') return;
        throw Error(`Unexpected dependency in ${name}: ${args.path}`);
      });
      plugin.onLoad({ filter: /.*/, namespace: 'next-seam' }, args => ({
        contents: args.path === 'next/headers'
          ? 'export async function headers(){return globalThis.__apiAuthFixture.headers;}'
          : 'export function redirect(){throw Error("Unexpected redirect");}', loader: 'js',
      }));
      plugin.onLoad({ filter: /.*/, namespace: 'seam' }, args => ({
        contents: `import services from 'test-seams';\n${modules[args.path].map(key => `export const ${key}=services.${key};`).join('\n')}`,
        loader: 'js',
      }));
    } }],
  });
  const inputs = Object.keys(result.metafile.inputs).map(value => value.replaceAll('\\', '/'));
  for (const path of name === 'progress' ? ['app/chatgpt-auth.ts','lib/mutation-json.ts','lib/request-security.ts'] : ['lib/auth.ts','app/chatgpt-auth.ts'])
    assert.ok(inputs.some(value => value.endsWith(path)), `${name} must bundle actual ${path}`);
  if (name === 'studio') for (const path of ['lib/studio-mutation-context.ts','lib/studio-mutation-context-server.ts'])
    assert.ok(inputs.some(value => value.endsWith(path)), `studio must bundle actual ${path}, not an allow-all context seam`);
  const module = { exports: {} };
  new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,id => {
    assert.equal(id, 'test-seams'); return { __esModule: true, default: services };
  });
  routes[name] = module.exports;
}
globalThis.__apiAuthFixture = { get headers() { return requestHeaders; } };
function reset(headers = {}) { requestHeaders = new Headers(headers); calls = []; contextCalls = []; currentOrganization = expectedStudioContext.organizationId; contextUnavailable = false; denial = null; pilotActor = undefined; }
function post(name, body) { return new Request(`https://synthetic.invalid/api/${name}`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://synthetic.invalid' }, body: JSON.stringify({userId:'forged-body-user',externalSubject:'sites:forged-body-user',email:'forged@synthetic.invalid',roles:['administrator'],...body}) }); }
function serviceCalls() { return calls.filter(item => item[0] !== 'rate'); }
function firstActor() { return serviceCalls()[0]?.[1]; }

test('anonymous local requests cannot reach real learner, platform, Studio or app services', async () => {
  let refused = 0;
  for (const environment of ['production','development','test','staging',undefined]) {
    const previous = process.env.NODE_ENV;
    if (environment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = environment;
    try { for (const headers of [{},{'oai-authenticated-user-id':'incomplete'},{'oai-authenticated-user-email':'incomplete@synthetic.invalid'},{'x-user-id':'forged','x-user-email':'forged@synthetic.invalid',authorization:'Bearer synthetic',cookie:'user=forged'}]) {
      for (const name of ['app','studio','learnerAccount','learnerData','people','readiness','control','progress']) {
        reset(headers); const response = await routes[name].GET(new Request(`https://synthetic.invalid/api/${name}?userId=forged-query-user`));
        assert.equal(response.status, 401, `${environment ?? 'unset'} ${name}`);
        assert.deepEqual(calls, [], `${name} must refuse before service or bootstrap`);
        assert.deepEqual(contextCalls, [], `${name} must refuse before any Studio context database read`);
        refused++;
      }
      for (const [name, body] of [['app',{action:'save-answer'}],['studio',{action:'create-course'}],['learnerAccount',{action:'save-profile'}],['learnerData',{action:'request'}],['learnerPreferences',{courseUpdates:true}],['institutionAccept',{token:'synthetic-invitation-token'}],['people',{action:'invite'}],['readiness',{action:'save-check'}],['control',{action:'save-organization-profile'}],['progress',{resourceType:'atlas',resourceSlug:'ct-head',progress:25,lastPosition:10}]]) {
        reset(headers); const response = await routes[name].POST(post(name, body));
        assert.equal(response.status, 401, `${environment ?? 'unset'} ${name} POST`);
        assert.deepEqual(calls, [], `${name} mutation must refuse before service`);
        assert.deepEqual(contextCalls, [], `${name} mutation must refuse before any Studio context database read`);
        refused++;
      }
    }} finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
  }
  assert.equal(refused,360);
  console.log(JSON.stringify({anonymousReadWriteRefusals:refused,downstreamServiceCalls:0}));
});

test('verified server headers forward the exact mapped actor through reads and writes', async () => {
  for (const name of ['app','studio','learnerAccount','learnerData','people','readiness','control']) {
    reset(identity); assert.equal((await routes[name].GET(new Request(`https://synthetic.invalid/api/${name}`))).status, 200, name);
    assert.deepEqual(firstActor(), actor, `${name} read actor`);
  }
  for (const [name, body] of [['app',{action:'save-answer'}],['studio',{action:'create-course'}],['learnerAccount',{action:'save-profile'}],['learnerData',{action:'request'}],['learnerPreferences',{courseUpdates:true}],['institutionAccept',{token:'synthetic-invitation-token'}],['people',{action:'invite'}],['readiness',{action:'save-check'}],['control',{action:'save-organization-profile'}]]) {
    reset(identity); assert.equal((await routes[name].POST(post(name, name === 'studio' ? {...body, expectedStudioContext} : body))).status, 200, name);
    assert.deepEqual(firstActor(), actor, `${name} write actor`);
  }
});

test('progress retains raw server identity and maps only the course completion actor', async () => {
  reset(identity);
  assert.equal((await routes.progress.GET()).status, 200);
  assert.deepEqual(serviceCalls(), [['listProgress', 'verified-17']]);
  for (const input of [{resourceType:'atlas',progress:100},{resourceType:'course',progress:25},{resourceType:'course',progress:100}]) {
    reset(identity);
    const record = {...input,resourceSlug:'anatomy-1',lastPosition:2};
    assert.equal((await routes.progress.POST(post('progress', record))).status, 200);
    const expected = [['saveProgress','verified-17',record]];
    if (input.resourceType === 'course' && input.progress === 100)
      expected.push(['syncCourseCompletion',actor,'anatomy-1',100]);
    assert.deepEqual(serviceCalls(), expected);
  }
});

test('downstream authorization refusal remains authoritative for a signed-in actor', async () => {
  for (const name of ['studio','people','control']) {
    reset(identity); denial = 403;
    const response = await routes[name].GET(new Request(`https://synthetic.invalid/api/${name}`));
    assert.equal(response.status, 403, name);
    assert.deepEqual(firstActor(), actor);
  }
});

test('public pilot application retains its intentional null-auth path', async () => {
  reset(); const response = await routes.pilot.POST(post('pilot', { institution: 'Synthetic institution' }));
  assert.equal(response.status, 201);
  assert.equal(pilotActor, null);
  reset(identity); const signed = await routes.pilot.POST(post('pilot', { institution: 'Synthetic institution' }));
  assert.equal(signed.status, 201);
  assert.deepEqual(pilotActor, actor);
});

test('shared education API authentication uses the same genuine-identity boundary', async () => {
  reset(); await assert.rejects(routes.educationApi.authenticateEducationApi(), error => error.status === 401);
  assert.deepEqual(calls, []);
  reset(identity); assert.deepEqual(await routes.educationApi.authenticateEducationApi(), actor);
});

test('Studio context cannot replace authentication or authorize a different actor or organization', async () => {
  const invalid = [undefined, null, {}, [], {...expectedStudioContext, extra: 'forged'},
    {...expectedStudioContext, actorId: 'edu:forged-body-user'}, {...expectedStudioContext, organizationId: 'other-organization'}];
  for (const value of invalid) {
    reset(identity);
    const response = await routes.studio.POST(post('studio', {action: 'create-course', expectedStudioContext: value}));
    assert.equal(response.status, 409);
    const body = await response.json();
    assert.equal(body.code, 'STUDIO_CONTEXT_CHANGED');
    assert.deepEqual(calls, [], 'refusal precedes rate-limit and domain service calls');
    assert(!JSON.stringify(body).includes(expectedStudioContext.actorId));
    assert(!JSON.stringify(body).includes(expectedStudioContext.organizationId));
    if (value?.organizationId === 'other-organization')
      assert.deepEqual(contextCalls.filter(item => item[0] === 'actor'), [['actor', actor.userId]]);
    else assert.deepEqual(contextCalls, [], 'malformed or different actor is refused before D1');
  }
  reset();
  const anonymous = await routes.studio.POST(post('studio', {action: 'create-course', expectedStudioContext}));
  assert.equal(anonymous.status, 401); assert.deepEqual(calls, []); assert.deepEqual(contextCalls, []);
});

test('Studio context requires current active membership and refuses database failure without domain effects', async () => {
  for (const organization of ['other-organization', null]) {
    reset(identity); currentOrganization = organization;
    const response = await routes.studio.POST(post('studio', {action: 'create-course', expectedStudioContext}));
    assert.equal(response.status, 409); assert.equal((await response.json()).code, 'STUDIO_CONTEXT_CHANGED');
    assert.deepEqual(calls, []); assert.deepEqual(contextCalls.filter(item => item[0] === 'actor'), [['actor', actor.userId]]);
  }
  reset(identity); contextUnavailable = true;
  const response = await routes.studio.POST(post('studio', {action: 'create-course', expectedStudioContext}));
  assert.equal(response.status, 503);
  const body = await response.json(); assert.equal(body.code, 'STUDIO_CONTEXT_UNAVAILABLE');
  assert(!JSON.stringify(body).includes('SYNTHETIC_PRIVATE_DATABASE_FAILURE')); assert.deepEqual(calls, []);
});

test('Studio comparison probe stays read-only and does not disclose identity on refusal', async () => {
  const probe = value => new Request('https://synthetic.invalid/api/studio?mutationContext=1', {
    headers: value === undefined ? {} : {'X-Studio-Mutation-Context': typeof value === 'string' ? value : JSON.stringify(value)},
  });
  reset(); assert.equal((await routes.studio.GET(probe(expectedStudioContext))).status, 401);
  assert.deepEqual(calls, []); assert.deepEqual(contextCalls, []);
  for (const value of [undefined, 'invalid-json', 'x'.repeat(2200), {...expectedStudioContext, actorId: 'edu:other'}]) {
    reset(identity); const response = await routes.studio.GET(probe(value)); assert.equal(response.status, 409);
    const body = await response.json(); assert.equal(body.code, 'STUDIO_CONTEXT_CHANGED');
    assert(!JSON.stringify(body).includes(expectedStudioContext.actorId));
    assert(!JSON.stringify(body).includes(expectedStudioContext.organizationId));
    assert.deepEqual(calls, []); assert.deepEqual(contextCalls, []);
  }
  reset(identity); const response = await routes.studio.GET(probe(expectedStudioContext));
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual(await response.json(), {ok: true, action: 'verify-studio-mutation-context'});
  assert.deepEqual(calls, []); assert.deepEqual(contextCalls.filter(item => item[0] === 'actor'), [['actor', actor.userId]]);
});

test('matching Studio context is comparison only; downstream mutation authorization still refuses', async () => {
  reset(identity); denial = 403;
  const response = await routes.studio.POST(post('studio', {action: 'create-course', expectedStudioContext}));
  assert.equal(response.status, 403); assert.deepEqual(firstActor(), actor);
  assert.deepEqual(contextCalls.filter(item => item[0] === 'actor'), [['actor', actor.userId]]);
  assert.equal(calls.filter(item => item[0] === 'rate').length, 1);
  assert.deepEqual(serviceCalls().map(item => item[0]), ['createStudioCourse']);
});
