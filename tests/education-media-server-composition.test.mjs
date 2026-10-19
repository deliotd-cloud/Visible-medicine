import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';

// Actual bootstrap tables, proposed inert metadata schema and candidate SQL.
// Identity and Cloudflare environment alone are synthetic boundaries. The real
// immutable manifest parser, hash verifier, eligibility and metadata SQL execute.
const website = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const ts = require(`${website}/node_modules/typescript`);
const bootstrap = readFileSync(`${website}/db/bootstrap.ts`, 'utf8');
const tree = ts.createSourceFile('bootstrap.ts', bootstrap, ts.ScriptTarget.Latest, true);
const declaration = tree.statements.filter(ts.isVariableStatement)
  .flatMap(row => row.declarationList.declarations)
  .find(row => row.name.getText(tree) === 'SCHEMA');
assert(declaration && ts.isArrayLiteralExpression(declaration.initializer));
const tables = new Set(['users', 'account_security_profiles', 'courses', 'modules',
  'workbooks', 'cases', 'workbook_cases', 'assessment_versions', 'enrolments',
  'workbook_assignments', 'workbook_assignment_rules', 'workbook_progress',
  'cohorts', 'cohort_members', 'cohort_workbook_assignments']);
const schema = declaration.initializer.elements.filter(ts.isNoSubstitutionTemplateLiteral)
  .map(row => row.text).filter(sql => tables.has(/^CREATE TABLE IF NOT EXISTS ([a-z_]+)/.exec(sql)?.[1]));
assert.equal(schema.length, tables.size);
const proposed = readFileSync(`${website}/scripts/education-media-records.proposed.sql`, 'utf8');

const bundled = await build({
  stdin: { contents: "export {createEducationMediaServerDependencies} from './lib/education-media-server-composition'; export {createAssessmentManifestRecord} from './lib/assessment-manifest';", resolveDir: website, loader:'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
  absWorkingDir: website, tsconfig: `${website}/tsconfig.json`,
  plugins: [{ name: 'synthetic-cloudflare-environment-only', setup(builder) {
    builder.onResolve({ filter: /^cloudflare:workers$/ }, () =>
      ({ path:'cloudflare:workers', namespace:'synthetic' }));
    builder.onLoad({ filter: /.*/, namespace:'synthetic' }, () => ({ loader:'js',
      contents: 'export const env = new Proxy({}, {get(){throw Error("No live environment in synthetic composition test");}});' }));
  } }],
});
const api = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const { readEducationMediaObject } = await import(pathToFileURL(`${website}/lib/education-media-delivery.ts`).href);
const digest = value => createHash('sha256').update(value).digest('hex');
const publicationHash = 'b'.repeat(64);
const bytes = new TextEncoder().encode('opaque synthetic education object');
const objectHash = digest(bytes);
const actorId = 'edu:learner-1';
const record = await api.createAssessmentManifestRecord({
  schema:'didanix-education-assessment-manifest-v2', product:'Visible Medicine', intendedPurpose:'education-only',
  workbook:{id:'workbook-1',title:'Synthetic workbook',mode:'assessment',version:1},
  assessment:{durationMinutes:30,displayPolicy:{dualDisplayAllowed:false}},
  viewer:{coreVersion:'synthetic'},
  supplementalIntegrity:{teachingContentHash:'0'.repeat(64),teachingPollsHash:'0'.repeat(64)},
  cases:[{id:'case-1',title:'Synthetic case',description:'No patient or scan',classification:'radiology',
    version:1,visualKind:'ct',tools:[],publicationHash,order:1,
    media:{kind:'dicom',overview:false,series:[{order:1,plane:'axial',frameCount:1,
      studyInstanceUid:'2.25.1',seriesInstanceUid:'2.25.2',frameOfReferenceUid:'2.25.3',sopInstanceUids:['2.25.4']}]},
    questions:[{id:'q-synthetic',prompt:'Synthetic question',responseType:'long-text',options:[],maxMarks:1,order:1,version:1,
      rubric:{version:1,maxMarks:1,criteria:[{label:'Synthetic criterion',maxMarks:1,order:1}]}}]}],
});
const versionHash=record.integrityHash;
const manifest=record.manifest;
const request = {actorId,assessmentVersionId:'assessment-v1',assessmentIntegrityHash:versionHash,caseId:'case-1',objectId:'object-1'};

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  for (const sql of schema) sqlite.exec(sql);
  sqlite.exec(proposed);
  const at = '2026-01-01T00:00:00Z';
  function insert(table, row) {
    const cols = Object.keys(row);
    sqlite.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
      .run(...Object.values(row));
  }
  insert('users', { id: actorId, external_subject: 'sites:learner-1', email: 'learner@example.invalid',
    display_name: 'Synthetic learner', roles: 'learner', created_at: at, last_seen_at: at });
  insert('account_security_profiles', { user_id: actorId, status: 'active', identity_provider: 'openai-sites',
    registered_at: at, last_authenticated_at: at, terms_version: '', privacy_version: '', updated_at: at });
  insert('cases', { id: 'case-1', title: 'Synthetic case', classification: 'radiology', status: 'published',
    version: 1, description: 'No patient or scan', visual_kind: 'ct', tools_json: '[]',
    publication_hash: publicationHash, deidentified: 1, publication_cleared: 1 });
  for (const suffix of ['1', '2']) {
    insert('courses', { id: `course-${suffix}`, code: `SYN-${suffix}`, title: 'Synthetic',
      description: 'Synthetic only', status: 'published' });
    insert('modules', { id: `module-${suffix}`, course_id: `course-${suffix}`, title: 'Synthetic', position: 1 });
    insert('workbooks', { id: `workbook-${suffix}`, module_id: `module-${suffix}`, title: 'Synthetic',
      mode: 'assessment', version: 1, status: 'published', duration_minutes: 30 });
    insert('workbook_cases', { workbook_id: `workbook-${suffix}`, case_id: 'case-1', position: 1 });
    insert('enrolments', { id: `enrolment-${suffix}`, user_id: actorId, course_id: `course-${suffix}`,
      status: 'active', enrolled_at: at });
    insert('workbook_assignments', { id: `assignment-${suffix}`, workbook_id: `workbook-${suffix}`,
      learner_id: actorId, status: 'active', assigned_by: actorId, assigned_at: at, version: 1 });
  }
  insert('assessment_versions', { id: 'assessment-v1', workbook_id: 'workbook-1', version: 1,
    integrity_hash: versionHash, manifest_json: JSON.stringify(manifest), viewer_core_version: 'synthetic',
    published_at: at, status: 'published', dual_display_allowed: 0 });
  insert('education_media_clearance_records', { source_id: 'source-1', source_revision: 'source-r1',
    clearance_revision: 'clearance-r1', state: 'cleared', privacy_cleared: 1, commercial_use_cleared: 1,
    object_sha256s_json: JSON.stringify([objectHash]), authority_record_id: 'authority-clearance-1', recorded_at: at });
  insert('education_media_clearance_activations', { source_id: 'source-1', source_revision: 'source-r1',
    clearance_revision: 'clearance-r1', authority_record_id: 'authority-activation-1', recorded_at: at });
  insert('education_media_bindings', { assessment_version_id: 'assessment-v1', assessment_integrity_hash: versionHash,
    case_id: 'case-1', case_version: 1, case_publication_hash: publicationHash,
    source_id: 'source-1', source_revision: 'source-r1', clearance_revision: 'clearance-r1',
    object_id: 'object-1', representation: 'dicom-instance', study_instance_uid: '2.25.1',
    series_instance_uid: '2.25.2', frame_of_reference_uid: '2.25.3', sop_instance_uid: '2.25.4',
    object_key: 'education-media/synthetic/object-1', sha256: objectHash, byte_length: bytes.byteLength,
    content_type: 'application/dicom', authority_record_id: 'authority-binding-1', recorded_at: at });

  const f = { sqlite, events: [], nextSession: 0, identity: { userId: actorId, externalSubject: 'sites:learner-1' },
    onGet: null, onQuery: null, databaseError: false, bucketError: false };
  const database = { withSession(hint) {
    assert.equal(hint, 'first-primary');
    const id = ++f.nextSession; f.events.push(['session', id]);
    return { prepare(sql) { return { bind(...values) { return { async first() {
      f.events.push(['query', id, sql, values]);
      if (f.databaseError) throw Error('private D1 provider details');
      const row=sqlite.prepare(sql).get(...values) ?? null;
      f.onQuery?.(sql,values);
      return row;
    } }; } }; } };
  } };
  const bucket = { async get(key) {
    f.events.push(['get', key]);
    if (f.bucketError) throw Error('private R2 provider details');
    return { key, size: bytes.byteLength, bodyUsed: false,
      body: new ReadableStream({ pull(controller) {
        if (f.onGet) f.onGet();
        controller.enqueue(bytes); controller.close();
      } }) };
  } };
  const deps = api.createEducationMediaServerDependencies('assessment-v1', versionHash,
    { database, bucket, async getSignedInEducationIdentity() { f.events.push(['identity']); return f.identity; } });
  assert(Object.isFrozen(deps));
  return Object.assign(f, { deps, read: () => readEducationMediaObject(request, deps), close: () => sqlite.close() });
}
async function denied(f, code) {
  await assert.rejects(f.read(), error => error.code === code &&
    !error.message.includes('education-media/') && !error.message.includes('provider'));
}

test('full server composition delivers only verified synthetic bytes and rechecks primary metadata', async () => {
  const f = fixture(); try {
    const result = await f.read();
    assert.deepEqual(result.bytes, bytes); assert.notEqual(result.bytes, bytes);
    assert.equal(result.headers['Cache-Control'], 'private, no-store');
    assert.equal(f.events.filter(e => e[0] === 'get').length, 1);
    const binding = f.events.filter(e => e[0] === 'query' && e[2].includes('FROM education_media_bindings'));
    const clearance = f.events.filter(e => e[0] === 'query' && e[2].includes('FROM education_media_clearance_current c'));
    assert.equal(binding.length, 2); assert.equal(clearance.length, 2);
    assert.equal(new Set([...binding, ...clearance].map(e => e[1])).size, 4,
      'Each metadata read/recheck starts on its own primary session');
    assert(f.events.filter(e => e[0] === 'query').every(e => /^\s*SELECT/.test(e[2])));
    assert(f.events.indexOf(binding[1]) > f.events.findIndex(e => e[0] === 'get'));
  } finally { f.close(); }
});

test('other-workbook access cannot grant requested workbook after its assignment is revoked', async () => {
  const f = fixture(); try {
    f.sqlite.prepare("UPDATE workbook_assignments SET status='revoked' WHERE workbook_id='workbook-1'").run();
    await denied(f, 'access-denied');
    assert.equal(f.events.filter(e => e[0] === 'get').length, 0);
  } finally { f.close(); }
});

test('withdrawn case or assessment denies before object access', async () => {
  for (const sql of ["UPDATE cases SET status='draft' WHERE id='case-1'",
    "UPDATE assessment_versions SET status='draft' WHERE id='assessment-v1'"]) {
    const f = fixture(); try {
      f.sqlite.prepare(sql).run(); await denied(f, sql.includes('assessment_versions') ? 'delivery-unavailable' : 'access-denied');
      assert.equal(f.events.filter(e => e[0] === 'get').length, 0);
    } finally { f.close(); }
  }
});

test('role or learner assignment revocation during object streaming releases no bytes', async () => {
  for (const sql of ["UPDATE users SET roles='atlas-subscriber' WHERE id='edu:learner-1'",
    "UPDATE workbook_assignments SET status='revoked' WHERE workbook_id='workbook-1'"]) {
    const f = fixture(); try { f.onGet = () => f.sqlite.prepare(sql).run();
      await denied(f, 'access-denied'); assert.equal(f.events.filter(e => e[0] === 'get').length, 1);
    } finally { f.close(); }
  }
});

test('source revocation or new quarantine activation during object streaming releases no bytes', async () => {
  for (const mutation of [
    f => f.sqlite.prepare(`INSERT INTO education_media_revocations VALUES
      ('source-1','source-r1','authority-revoke-1','2026-01-02T00:00:00Z','synthetic')`).run(),
    f => {
      f.sqlite.prepare(`INSERT INTO education_media_clearance_records VALUES
        ('source-1','source-r1','clearance-r2','quarantine',0,0,'[]','authority-clearance-2','2026-01-02T00:00:00Z')`).run();
      f.sqlite.prepare(`INSERT INTO education_media_clearance_activations
        (source_id,source_revision,clearance_revision,authority_record_id,recorded_at) VALUES
        ('source-1','source-r1','clearance-r2','authority-activation-2','2026-01-02T00:00:00Z')`).run();
    },
  ]) {
    const f = fixture(); try { f.onGet = () => mutation(f);
      await denied(f, 'source-unavailable'); assert.equal(f.events.filter(e => e[0] === 'get').length, 1);
    } finally { f.close(); }
  }
});

test('missing metadata tables and private provider errors are sanitized', async () => {
  for (const [mutate, code] of [
    [f => f.sqlite.exec('DROP TABLE education_media_bindings'), 'delivery-unavailable'],
    [f => { f.databaseError = true; }, 'delivery-unavailable'],
    [f => { f.bucketError = true; }, 'object-unavailable'],
  ]) { const f = fixture(); try { mutate(f); await denied(f, code); }
    finally { f.close(); } }
});

test('bound version/digest cannot be overridden through dependency calls', async () => {
  const f = fixture(); try {
    assert.equal(await f.deps.loadVerifiedAssessment('assessment-other'), null);
    assert.equal(await f.deps.loadBinding('assessment-other','case-1','object-1'),null);
    assert.equal(f.events.length,0,'A foreign bound version does not query metadata');
    assert.equal(await f.deps.authorizeCase(actorId, 'workbook-2', 'case-1'), false);
    assert.equal(f.events.filter(e => e[0] === 'get').length, 0);
  } finally { f.close(); }
});


test('real immutable manifest parser and digest reject tampering before object access', async () => {
  for(const mutate of [
    f=>f.sqlite.prepare("UPDATE assessment_versions SET manifest_json = ?").run(JSON.stringify({...manifest,intendedPurpose:'clinical'})),
    f=>f.sqlite.prepare("UPDATE assessment_versions SET integrity_hash = ?").run('f'.repeat(64)),
    f=>f.sqlite.prepare("UPDATE assessment_versions SET viewer_core_version = 'wrong'").run(),
    f=>f.sqlite.prepare("UPDATE assessment_versions SET manifest_json = 'not-json'").run(),
  ]){ const f=fixture();try{mutate(f);await denied(f,'delivery-unavailable');
    assert.equal(f.events.filter(e=>e[0]==='get').length,0);}finally{f.close();} }
});

test('assessment or case withdrawal during streaming still releases no bytes', async () => {
  for(const sql of ["UPDATE assessment_versions SET status='withdrawn'","UPDATE cases SET status='withdrawn'"]){
    const f=fixture();try{f.onGet=()=>f.sqlite.prepare(sql).run();await denied(f,'access-denied');}
    finally{f.close();}
  }
});

test('mutable identity-provider object cannot swap the authenticated actor across a DB await',async()=>{
  const f=fixture();try{
    f.onQuery=sql=>{if(sql.includes('SELECT u.roles'))f.identity.userId='edu:someone-else';};
    assert.equal(await f.deps.authorizeCase(actorId,'workbook-1','case-1'),true,'Retains actor checked by SQL');
    assert.equal(await f.deps.authorizeCase('edu:someone-else','workbook-1','case-1'),false);
  }finally{f.close();}
});
