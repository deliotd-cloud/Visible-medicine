import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Also runs after copying this file into <site>/tests. The E: draft needs the
// site root as its single CLI argument: node <file> -- <site-root>.
const here = dirname(fileURLToPath(import.meta.url));
const separator = process.argv.indexOf('--');
const root = separator >= 0 && process.argv[separator + 1]
  ? resolve(process.argv[separator + 1])
  : resolve(here, '..');
const require = createRequire(resolve(root, 'package.json'));
const { build } = require('esbuild');

const fixture = {
  auth: null,
  authCalls: 0,
  calls: [],
  rateLimits: [],
  enrolment: { id: 'synthetic-enrolment' },
  denial: null,
  rateDenial: null,
  rateFailure: null,
};
globalThis.__learnerAccountRouteFixture = fixture;

const stubs = {
  '@/lib/auth': `export async function getAuthContext(){const fixture=globalThis.__learnerAccountRouteFixture;fixture.authCalls++;return fixture.auth;}`,
  '@/lib/education-platform': `
    export class EducationPlatformError extends Error {
      constructor(message,status=400){super(message);this.status=status;}
    }
    export async function enrolInCourse(...args){
      const fixture=globalThis.__learnerAccountRouteFixture;
      fixture.calls.push(args);
      if(fixture.denial) throw new EducationPlatformError(fixture.denial.message,fixture.denial.status);
      return fixture.enrolment;
    }
    export async function getLearnerEnrolments(){throw Error('Unexpected GET service call');}
    export async function getLearnerProfile(){throw Error('Unexpected GET service call');}
    export async function saveLearnerProfile(){throw Error('Unexpected profile write');}
  `,
  '@/lib/institution-operations': `
    export class InstitutionOperationsError extends Error {
      constructor(message,status=422){super(message);this.status=status;}
    }
    export async function enforceRateLimit(...args){
      const fixture=globalThis.__learnerAccountRouteFixture;
      fixture.rateLimits.push(args);
      if(fixture.rateDenial)throw new InstitutionOperationsError(fixture.rateDenial.message,fixture.rateDenial.status);
      if(fixture.rateFailure)throw fixture.rateFailure;
    }`,
};

// Bundle the actual route, streamed JSON parser and request-security helpers. Only the three
// server seams above are replaced; unexpected imports must fail the build.
const bundle = await build({
  entryPoints: [resolve(root, 'app/api/learner/account/route.ts')],
  bundle: true,
  write: false,
  metafile: true,
  platform: 'node',
  format: 'esm',
  tsconfigRaw: {},
  plugins: [{ name: 'learner-route-server-seams', setup(plugin) {
    plugin.onResolve({ filter: /^@\/lib\// }, args => {
      if (Object.hasOwn(stubs, args.path)) return { path: args.path, namespace: 'server-seam' };
      if (args.path === '@/lib/request-security')
        return { path: resolve(root, 'lib/request-security.ts') };
      if (args.path === '@/lib/mutation-json')
        return { path: resolve(root, 'lib/mutation-json.ts') };
      throw Error(`Unexpected route dependency: ${args.path}`);
    });
    plugin.onLoad({ filter: /.*/, namespace: 'server-seam' }, args => ({
      contents: stubs[args.path], loader: 'js',
    }));
  } }],
});
const compiledInputs = Object.keys(bundle.metafile.inputs).map(path => path.replaceAll('\\', '/'));
assert.ok(compiledInputs.some(path => /(?:^|\/)app\/api\/learner\/account\/route\.ts$/.test(path)));
assert.ok(compiledInputs.some(path => /(?:^|\/)lib\/request-security\.ts$/.test(path)));
assert.ok(compiledInputs.some(path => /(?:^|\/)lib\/mutation-json\.ts$/.test(path)));
const { POST } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

const serverAuth = Object.freeze({
  userId: 'edu:server-learner',
  email: 'server-learner@example.invalid',
  externalSubject: 'sites:server-learner',
  roles: ['learner'],
  organizationId: 'server-organization',
});
const adversarialBody = {
  action: 'enrol', releaseId: 'synthetic-release', invitationCode: 'ELV-ABCDEF123456',
  userId: 'edu:victim', email: 'victim@example.invalid',
  roles: ['administrator'], role: 'administrator', organizationId: 'victim-organization',
  externalSubject: 'sites:victim', auth: { userId: 'edu:victim', authenticated: true },
  'oai-authenticated-user-id': 'victim',
};
const url = 'https://site.example.invalid/api/learner/account';

function request(body = adversarialBody, headers = {}) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function reset(auth = serverAuth) {
  fixture.auth = auth;
  fixture.authCalls = 0;
  fixture.calls.length = 0;
  fixture.rateLimits.length = 0;
  fixture.denial = null;
  fixture.rateDenial = null;
  fixture.rateFailure = null;
}

async function assertRefusal(response, status, pattern, { rateLimit = false, authenticate = false } = {}) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.match((await response.json()).error, pattern);
  assert.equal(fixture.calls.length, 0, 'refused request must not reach enrolment service');
  assert.equal(fixture.rateLimits.length, rateLimit ? 1 : 0);
  assert.equal(fixture.authCalls, authenticate ? 1 : 0);
}

test('body identity, role, organization and auth-looking keys cannot select the enrolment identity', async () => {
  reset();
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { enrolment: fixture.enrolment });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(fixture.calls.length, 1);
  assert.equal(fixture.authCalls, 1);
  assert.equal(fixture.calls[0].length, 3);
  assert.strictEqual(fixture.calls[0][0], serverAuth);
  assert.deepEqual(fixture.calls[0].slice(1), ['synthetic-release', 'ELV-ABCDEF123456']);
  assert.deepEqual(fixture.rateLimits, [['edu:server-learner', 'learner-account', 20, 60]]);
});

test('cross-origin Origin is refused before authentication or service call', async () => {
  reset();
  await assertRefusal(await POST(request(adversarialBody, { origin: 'https://other.example.invalid' })), 403, /Cross-origin/);
});

test('cross-site Fetch Metadata is refused even with same Origin', async () => {
  reset();
  await assertRefusal(await POST(request(adversarialBody, {
    origin: 'https://site.example.invalid', 'sec-fetch-site': 'cross-site',
  })), 403, /Cross-origin/);
});

test('non-JSON content type is refused', async () => {
  reset();
  await assertRefusal(await POST(request(adversarialBody, { 'content-type': 'text/plain' })), 415, /JSON/);
});

test('declared Content-Length above 24,000 is refused', async () => {
  reset();
  await assertRefusal(await POST(request(adversarialBody, { 'content-length': '24001' })), 413, /too large/);
});

test('unauthenticated request is refused', async () => {
  reset(null);
  await assertRefusal(await POST(request()), 401, /sign-in/, { authenticate: true });
});

test('unknown action is refused after authentication and rate limit', async () => {
  reset();
  await assertRefusal(await POST(request({ action: 'unknown' })), 404, /Unknown learner account action/, { rateLimit: true, authenticate: true });
});

test('service denial is returned without a successful enrolment payload', async () => {
  reset();
  fixture.denial = { message: 'Synthetic admission refusal.', status: 409 };
  const response = await POST(request());
  assert.equal(response.status, 409);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), { error: 'Synthetic admission refusal.' });
  assert.equal(fixture.calls.length, 1);
  assert.strictEqual(fixture.calls[0][0], serverAuth);
  assert.equal(fixture.rateLimits.length, 1);
  assert.equal(fixture.authCalls, 1);
});

test('rate-limit 429 is returned privately before enrolment', async () => {
  reset();
  fixture.rateDenial={message:'Too many requests. Please wait and try again.',status:429};
  await assertRefusal(await POST(request()),429,/Too many requests/,{rateLimit:true,authenticate:true});
});

test('known limiter failure returns its 500 without invoking enrolment', async () => {
  reset();
  fixture.rateDenial={message:'The request limit could not be checked.',status:500};
  await assertRefusal(await POST(request()),500,/request limit could not be checked/,{rateLimit:true,authenticate:true});
});

test('unexpected limiter failure hides its message in response and log', async () => {
  reset(); fixture.rateFailure=new Error('synthetic private database detail');
  const realError=console.error,logs=[];console.error=(...args)=>logs.push(args);
  try {
    await assertRefusal(await POST(request()),500,/learner account service/,{rateLimit:true,authenticate:true});
  }finally{console.error=realError;}
  assert.deepEqual(logs,[['Visible Medicine learner account error',{type:'Error'}]]);
});
