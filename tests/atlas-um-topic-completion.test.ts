import assert from 'node:assert/strict';
import {withoutEyeCrossSectionalNotice} from './atlas-eye-notice-history.ts';
import test from 'node:test';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {build} from 'esbuild';

const source = 'f636891cdcee10aeca20ae684cb04c183fa7600e';
const featureWebsite = 'ebef136aa174d9b81329d917e4ef129430760ad2';
const sourceBefore = '33566ee21aa65ed1a370a5e7653337048656a13e';
const websiteBefore = '1512df5abcfe30c19b098904e678dadcab12239a';
const sourceRepo = currentAtlasDeliveryRoot();
const gitBytes = (repo: string, revision: string, path: string) => Buffer.from(execFileSync('git', ['-C', repo, 'show', `${revision}:${path}`], {maxBuffer: 32e6}));
const sourceBytes = (path: string) => gitBytes(sourceRepo, source, path);
const previousSourceBytes = (path: string) => gitBytes(sourceRepo, sourceBefore, path);
const previousWebsiteBytes = (path: string) => gitBytes(process.cwd(), websiteBefore, path);
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const featureBytes = (path: string) => gitBytes(process.cwd(), featureWebsite, path);
const featureJson = (path: string) => JSON.parse(featureBytes(path).toString('utf8'));
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

async function reviewApi(previous = false) {
  const result = await build({
    stdin: {contents: [
      "export {specimenReviewMaterial, specimenReviewRows} from './atlas-review/lib/specimen-review-material';",
      "export {blankSpecimenReview, specimenApprovalProblems} from './atlas-review/lib/specimen-review';",
      "export {postSpecimenReview} from './atlas-review/lib/specimen-review-api';",
      "export {specimenClinicalReferences} from './atlas-review/content/um-limb-clinical';",
    ].join('\n'), resolveDir: process.cwd(), loader: 'ts'},
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: [{name: 'exact-feature-um-review', setup(plugin) {
      plugin.onLoad({filter: /[\\/]atlas-review[\\/].*\.(?:ts|tsx|json)$/}, args => {
        const relative=args.path.replaceAll('\\','/').split('/atlas-review/')[1];
        const path='atlas-review/'+relative;
        const overrides=new Set(['content/um-limb-teaching-bindings.v1.json','content/body-renderer-revision.json','content/um-limb-clinical.ts','lib/um-limb-teaching.ts','lib/specimen-review-material.ts']);
        const bytes=previous&&overrides.has(relative)?previousWebsiteBytes(path):gitBytes(process.cwd(),featureWebsite,path);
        return {contents:bytes.toString('utf8'),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
      });
    }}],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('UM topic drafts are source pinned and reach every learner selection without changing models, access or licences', {timeout: 120000}, async () => {
  const review = featureJson('atlas-review/manifest.json');
  const learner = featureJson('public/atlas-runtime/head-neck/manifest.json');
  const inputs = featureJson('public/atlas-runtime/head-neck/source-inputs.json');
  const viewer = featureJson('public/atlas-review-viewer/manifest.json');
  const previousLearner = JSON.parse(previousWebsiteBytes('public/atlas-runtime/head-neck/manifest.json').toString('utf8'));
  assert.equal(review.revision, source);
  assert.equal(learner.sourceCommit, source);
  assert.equal(viewer.sourceCommit, source);
  assert.equal(learner.region, 'head-neck');
  assert.equal(viewer.mode, 'production');
  assert.equal(viewer.personalRecordsIncluded, false);
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
    assert.equal(learner[flag], false, flag);
  assert.deepEqual(learner.modelBundles, previousLearner.modelBundles);
  assert.deepEqual(learner.files.filter((entry: any) => entry.path.startsWith('models/')),
    previousLearner.files.filter((entry: any) => entry.path.startsWith('models/')));
  const models = json('lib/atlas-model-inventory.json');
  assert.equal(models.models.length, 137);
  assert.deepEqual(models.models, JSON.parse(previousWebsiteBytes('lib/atlas-model-inventory.json').toString('utf8')).models);

  for (const path of [
    'content/um-limb-clinical.ts',
    'content/um-proximal-topic-completion.ts',
    'content/um-distal-topic-completion.ts',
    'content/um-limb-modality-references.ts',
    'content/um-limb-teaching-bindings.v1.json',
    'content/body-renderer-revision.json',
  ]) {
    const entry = review.files.find((item: any) => item.path === path);
    assert(entry, `review import: ${path}`);
    assert.equal(entry.sourceSha256, sha256(sourceBytes(path)), path);
    assert.equal(entry.importedSha256, sha256(featureBytes('atlas-review/' + path)), path);
    if (path !== 'content/body-renderer-revision.json')
      assert.equal(inputs.find((item: any) => item.path === path)?.sha256, entry.sourceSha256, `learner input: ${path}`);
  }
  assert.notEqual(sha256(sourceBytes('content/um-limb-teaching-bindings.v1.json')),
    sha256(previousSourceBytes('content/um-limb-teaching-bindings.v1.json')));
  for (const module of ['head-neck', 'shoulder']) {
    const path = `public/atlas-runtime/${module}/LICENSES/THIRD_PARTY_NOTICES.md`;
    const before = previousWebsiteBytes(path).toString('utf8').replaceAll('\r', '');
    const nowRaw = featureBytes(path).toString('utf8');
    const now = withoutEyeCrossSectionalNotice(nowRaw);
    assert(now.startsWith(before), `complete previous notice retained: ${module}`);
    assert.match(now.slice(before.length), /\n## .*UM.*topic.*completion/i, `additive UM notice: ${module}`);
    assert.equal(nowRaw, featureBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8'));
  }

  const current = await reviewApi();
  const previous = await reviewApi(true);
  const bundle = learner.files.filter((entry: any) => entry.path.endsWith('.js')).map((entry: any) => {
    const bytes = featureBytes('public/atlas-runtime/head-neck/' + entry.path);
    assert.equal(sha256(bytes), entry.sha256, entry.path);
    return bytes.toString('utf8');
  }).join('\n');
  const added = {ct: 0, mri: 0, xray: 0, ultrasound: 0};
  let mapped = 0, held = 0, retained = 0;
  // Unique source coverage comes from Whole lower limb. The second test counts
  // all five overlapping regional review contexts separately.
  const whole = current.specimenReviewRows.find((item: any) => item.key === 'um-5t6tz7-v1-2:lower-limb:whole');
  assert(whole);
  for (const row of [whole])
    for (const surface of row.surfaces) {
      const before = await previous.specimenReviewMaterial(row.key, surface.id);
      const after = await current.specimenReviewMaterial(row.key, surface.id);
      assert(before && after, `${row.key}/${surface.id}`);
      if (!before.teaching.lesson.extended) {
        held++;
        assert.deepEqual(after.teaching.lesson, before.teaching.lesson, `${row.key}/${surface.id}: grouped hold`);
        continue;
      }
      mapped++;
      assert(bundle.includes(surface.id), `${row.key}/${surface.id}: learner selection`);
      for (const topic of after.teaching.topics) {
        const old = before.teaching.topics.find((item: any) => item.tab === topic.tab);
        assert(old, `${row.key}/${surface.id}/${topic.tab}`);
        if (old.body !== null) {
          if (!['anatomy', 'function'].includes(topic.tab)) retained++;
          assert.deepEqual(topic, old); continue;
        }
        if (!Object.hasOwn(added, topic.tab)) continue;
        assert.equal(after.teaching.lesson.extended.topics[topic.tab].readiness, 'draft');
        assert.equal(typeof topic.body, 'string');
        assert(topic.body.length > 100);
        assert(topic.references.length > 0);
        assert(bundle.includes(topic.body) || bundle.includes(JSON.stringify(topic.body).slice(1, -1)), `${row.key}/${surface.id}/${topic.tab}: complete learner teaching`);
        added[topic.tab as keyof typeof added]++;
      }
    }
  assert.equal(mapped, 65);
  assert.equal(held, 2);
  assert.equal(retained, 235);
  assert.deepEqual(added, {ct: 54, mri: 29, xray: 34, ultrasound: 38});
});

test('356 fixed source contexts, 154 UM teaching revisions and 462 stale requests keep draft review gates', {timeout: 120000}, async () => {
  const current = await reviewApi();
  const previous = await reviewApi(true);
  const unreachableStorage = new Proxy({}, {get() { throw Error('Stale UM request reached storage'); }});
  let contexts = 0, changed = 0, unchanged = 0, lessons = 0, metadataOnly = 0, pending = 0, unblocked = 0, rejected = 0;
  const additions = {ct: 0, mri: 0, xray: 0, ultrasound: 0};
  const titles = Object.fromEntries(Object.values(current.specimenClinicalReferences).map((item: any) => [item.url, item.title]));
  for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
    const label = `${row.key}/${surface.id}`;
    const before = await previous.specimenReviewMaterial(row.key, surface.id);
    const after = await current.specimenReviewMaterial(row.key, surface.id);
    assert(before && after, label);
    contexts++;
    assert.deepEqual(after.source, before.source, `${label}: source packet`);
    assert.equal(after.context.sourceHash, before.context.sourceHash, label);
    assert.equal(after.atlasLink, before.atlasLink, label);
    assert.equal(after.atlasPath, before.atlasPath, label);
    assert.deepEqual(after.context.checklists, before.context.checklists, label);
    for (const track of ['geometry', 'imaging', 'teaching'])
      assert.deepEqual(after.context.blockers[track], before.context.blockers[track], `${label}: ${track} blockers`);
    assert.equal(after.context.revisions.imaging, null, label);
    assert(after.context.blockers.imaging.length > 0, label);
    pending += after.teaching.topics.filter((topic: any) => topic.body === null).length;
    if (before.context.blockers.teaching.length && !after.context.blockers.teaching.length) unblocked++;
    if (!row.key.startsWith('um-5t6tz7-v1-2:')) {
      unchanged++;
      assert.deepEqual(after.teaching, before.teaching, `${label}: unrelated teaching`);
      assert.equal(after.context.teachingHash, before.context.teachingHash, label);
      assert.equal(after.context.revisions.teaching, before.context.revisions.teaching, label);
      continue;
    }
    changed++;
    assert.deepEqual(before.teaching.referenceTitles, {}, `${label}: previous UM titles`);
    assert.deepEqual(after.teaching.referenceTitles, titles, `${label}: new UM titles`);
    assert.notEqual(after.context.teachingHash, before.context.teachingHash, label);
    assert.notEqual(after.context.revisions.teaching, before.context.revisions.teaching, label);
    const missing = before.teaching.topics.filter((topic: any) => Object.hasOwn(additions, topic.tab) && topic.body === null);
    if (before.teaching.lesson.extended) { lessons++; assert(missing.length > 0, label); }
    else {
      metadataOnly++;
      assert.deepEqual(after.teaching.lesson, before.teaching.lesson, `${label}: grouped hold`);
    }
    const oldTeaching = structuredClone(before.teaching), newTeaching = structuredClone(after.teaching);
    delete oldTeaching.topics; delete newTeaching.topics;
    delete oldTeaching.referenceTitles; delete newTeaching.referenceTitles;
    if (oldTeaching.lesson?.extended) delete oldTeaching.lesson.extended.topics;
    if (newTeaching.lesson?.extended) delete newTeaching.lesson.extended.topics;
    assert.deepEqual(newTeaching, oldTeaching, `${label}: core, motor, model limits and self-check`);
    const oldTopics = structuredClone(before.teaching.lesson?.extended?.topics ?? {});
    const newTopics = structuredClone(after.teaching.lesson?.extended?.topics ?? {});
    for (const topic of missing) delete newTopics[topic.tab];
    assert.deepEqual(newTopics, oldTopics, `${label}: previous extended topics`);
    assert.equal(after.teaching.topics.length, before.teaching.topics.length, label);
    for (const topic of after.teaching.topics) {
      const old = before.teaching.topics.find((item: any) => item.tab === topic.tab);
      assert(old, `${label}/${topic.tab}`);
      if (before.teaching.lesson.extended && missing.some((item: any) => item.tab === topic.tab)) {
        assert.equal(topic.body, after.teaching.lesson.extended.topics[topic.tab].body);
        assert.equal(after.teaching.lesson.extended.topics[topic.tab].readiness, 'draft');
        assert(topic.body.length > 100 && topic.references.length > 0, `${label}/${topic.tab}`);
        assert(topic.references.every((url: string) => titles[url]), `${label}/${topic.tab}: named reading`);
        additions[topic.tab as keyof typeof additions]++;
      } else assert.deepEqual(topic, old, `${label}/${topic.tab}: existing or held topic`);
    }
    const draft = current.blankSpecimenReview(after.context, 'teaching');
    assert.equal(draft.status, 'draft', label);
    assert.equal(draft.attested, false, label);
    assert(Object.values(draft.checks).every(value => value === false), label);
    const unchecked = {...draft, reviewer: 'Synthetic reviewer', qualification: 'Synthetic qualification',
      scope: 'Synthetic scope', attested: true, evidence: ['https://example.test/review']};
    assert(current.specimenApprovalProblems(unchecked, after.context, 'teaching').includes('Complete every checklist item.'), label);
    for (const patch of [
      {revisionHash: before.context.revisions.teaching},
      {materialHash: before.context.materialHash},
      {sourceFrame: 'foreign-frame'},
    ]) {
      const response = await current.postSpecimenReview(new Request('https://review.test/api/atlas-review/specimen-review', {
        method: 'POST', headers: {origin: 'https://review.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'synthetic-um-reviewer'},
        body: JSON.stringify({catalogScope: after.context.catalogScope, specimenKey: row.key, structureId: surface.id,
          sourceFrame: after.context.sourceFrame, materialHash: after.context.materialHash, revisionHash: after.context.revisions.teaching,
          checklistVersion: after.context.checklistVersion, track: 'teaching', expectedVersion: 0, draft, ...patch}),
      }), unreachableStorage);
      assert.equal(response.status, 409, `${label}: ${JSON.stringify(patch)}`);
      assert.match((await response.json()).error, /Material changed/, label);
      rejected++;
    }
    const original = structuredClone(after);
    after.teaching.referenceTitles[Object.keys(titles)[0]] = 'mutated';
    if (after.teaching.lesson.extended) after.teaching.lesson.extended.topics.ct.body = 'mutated';
    assert.deepEqual(await current.specimenReviewMaterial(row.key, surface.id), original, `${label}: clone isolation`);
  }
  assert.equal(contexts, 356);
  assert.equal(changed, 154);
  assert.equal(lessons, 150);
  assert.equal(metadataOnly, 4);
  assert.equal(unchanged, 202);
  assert.equal(pending, 24);
  assert.equal(unblocked, 0);
  assert.equal(rejected, 462);
  assert.deepEqual(additions, {ct: 119, mri: 64, xray: 75, ultrasound: 86});
});

async function currentReviewApi() {
  const result=await build({stdin:{contents:[
    "export {specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';",
    "export {blankSpecimenReview} from './atlas-review/lib/specimen-review';",
    "export {postSpecimenReview} from './atlas-review/lib/specimen-review-api';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('closed current UM delivery retains exact source, draft calf depth and forged-review refusal',async()=>{
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,CURRENT_ATLAS_REVISION);
  const review=json('atlas-review/manifest.json');
  const learner=json('public/atlas-runtime/head-neck/manifest.json');
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  const viewer=json('public/atlas-review-viewer/manifest.json');
  assert.equal(review.revision,pin.source);
  assert.equal(learner.sourceCommit,pin.source);
  assert.equal(viewer.sourceCommit,pin.source);
  assert.equal(viewer.personalRecordsIncluded,false);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(learner[flag],false,flag);
  for(const path of ['content/um-limb-clinical.ts','content/um-proximal-topic-completion.ts','content/um-distal-topic-completion.ts','content/um-limb-modality-references.ts','content/um-limb-teaching-bindings.v1.json','content/um-calf-depth.ts']){
    const entry=review.files.find((f:any)=>f.path===path);assert(entry,path);
    const source=gitBytes(sourceRepo,pin.source,path);
    assert.equal(sha256(source),entry.sourceSha256,path);
    assert.equal(sha256(Buffer.from(readFileSync('atlas-review/'+path))),entry.importedSha256,path);
    const input=inputs.find((f:any)=>f.path===path);
    if(input)assert.equal(input.sha256,entry.sourceSha256,path);
  }
  const altered=structuredClone(review);
  altered.files.find((f:any)=>f.path==='content/um-limb-teaching-bindings.v1.json').sourceSha256='0'.repeat(64);
  assert.throws(()=>validateCurrentAtlasDelivery({pin,read:(path:string)=>path==='atlas-review/manifest.json'?Buffer.from(JSON.stringify(altered)):readFileSync(path)}),/Current delivery changed: atlas-review\/manifest.json/);
  const api=await currentReviewApi();
  const key='um-5t6tz7-v1-2:knee',id='vm:reference:um-5t6tz7-v1-2:knee:popliteus';
  const material=await api.specimenReviewMaterial(key,id);assert(material);
  const arterial='Inferior medial genicular, posterior tibial and sometimes anterior tibial branches contribute variably; no single source is universal.';
  assert.equal(material.teaching.lesson.depth.arterialSupply.body,arterial);
  assert.equal(material.context.revisions.imaging,null);
  const draft=api.blankSpecimenReview(material.context,'teaching');
  assert.equal(draft.status,'draft');assert.equal(draft.attested,false);
  assert(Object.values(draft.checks).every(value=>value===false));
  const c=material.context;
  const storage=new Proxy({},{get(){throw Error('Forged UM review reached storage');}});
  const response=await api.postSpecimenReview(new Request('https://review.test/api/atlas-review/specimen-review',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_UM_DEPTH_TEST'},
    body:JSON.stringify({catalogScope:c.catalogScope,specimenKey:key,structureId:id,sourceFrame:'foreign-frame',materialHash:c.materialHash,revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,track:'teaching',expectedVersion:0,draft})
  }),storage);
  assert.equal(response.status,409);
  const emitted=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync('public/atlas-runtime/head-neck/'+f.path,'utf8')).join('\n');
  assert(emitted.includes(arterial));
});