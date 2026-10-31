// Run after the visual-CT baseline's 13 checks and normal successor generation.
// This is a comparison, not a build runner or a clinical approval.
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { freemem } from 'node:os';
import { createReadStream, readFileSync } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

const options = Object.fromEntries(process.argv.slice(2).map((item) => {
  const match = /^--(before|after|overlay|rebase|rebase-sha|before-source|after-source|before-source-sha|after-source-sha|before-state|before-state-sha)=(.+)$/.exec(item);
  assert(match, `Unexpected argument: ${item}`);
  return [match[1], match[2]];
}));
for (const key of ['before','after','overlay','rebase','rebase-sha','before-source','after-source','before-source-sha','after-source-sha','before-state','before-state-sha']) assert(options[key], `Missing --${key}`);
assert.equal(process.argv.length, 13, 'Exactly eleven named arguments required');
const beforeRoot = await realpath(options.before), afterRoot = await realpath(options.after);
assert.notEqual(beforeRoot, afterRoot);
const overlay = JSON.parse(readFileSync(options.overlay, 'utf8'));
assert.equal(overlay.schema, 'vm-small-cardiac-imaging-overlay/1');
assert.equal(overlay.files.length, 7);
const expected = new Map(overlay.files.map((entry) => [entry.path, entry]));
assert.equal(expected.size, 7);
assert.equal(overlay.rejected.integrate, false);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(options.overlay)), 'fbd4ffa91abaa29999f439fc0410887544ea9a0b3a19c30788aaf1e6f50ccb9c', 'Accepted overlay receipt changed');
assert.equal(resolve(overlay.base), beforeRoot, 'Overlay baseline root changed');
assert(/^[a-f0-9]{64}$/.test(options['rebase-sha']));
assert.equal(sha(readFileSync(options.rebase)),options['rebase-sha'],'Explicit rebase receipt hash');
const rebase=JSON.parse(readFileSync(options.rebase,'utf8'));
assert.equal(rebase.schema,'vm-small-cardiac-current-baseline-rebase/1');
assert.equal(rebase.originalOverlaySha256,'fbd4ffa91abaa29999f439fc0410887544ea9a0b3a19c30788aaf1e6f50ccb9c');
assert.equal(rebase.baseline.commit,'b42ba40b7305cca26e30cbf8a252b7163de089e0');
assert.equal(rebase.baseline.sourceSha256,'e2b3245cd46ed61124dce3d3597875a39263fb63344d68810f1f18e48127bb53');
assert.equal(rebase.baseline.sourceSha256,options['before-source-sha']);
assert.equal(rebase.baseline.stateSha256,options['before-state-sha']);
assert.equal(resolve(rebase.baseline.root),beforeRoot);
for (const kind of ['before','after']) {
  const pin=options[`${kind}-source-sha`];
  assert(/^[a-f0-9]{64}$/.test(pin), `Invalid ${kind} source pin`);
  assert.equal(sha(readFileSync(options[`${kind}-source`])),pin,`${kind} source receipt hash`);
}
assert(/^[a-f0-9]{64}$/.test(options['before-state-sha']));
assert.equal(sha(readFileSync(options['before-state'])),options['before-state-sha'],'Baseline 13-step state pin');
const state=JSON.parse(readFileSync(options['before-state'],'utf8'));
assert(state.terminal && state.passed && state.state==='passed' && state.completed.length===13,'Visual-CT baseline is not verified');
for (const [index,row] of state.completed.entries()) {
  assert.equal(row.index,index,'Incomplete ordered baseline validation');
  assert.equal(row.status,0,'Failed baseline step');
  assert.equal(row.signal,null,'Interrupted baseline step');
  assert.equal(row.error,null,'Baseline execution error');
  assert(row.log && /^[a-f0-9]{64}$/.test(row.log.sha256),'Missing baseline evidence');
  assert.equal(sha(readFileSync(row.log.path)),row.log.sha256,'Changed baseline evidence');
}
const source = (path, root) => {
  const value=JSON.parse(readFileSync(path,'utf8'));
  assert.equal(resolve(value.site),root,'Source receipt site mismatch');
  assert(Array.isArray(value.sourceRows) && value.sourceRows.length>=6500,'Incomplete Atlas source inventory');
  const rows=new Map();
  for (const row of value.sourceRows) {
    assert(typeof row.path==='string' && /^[a-f0-9]{64}$/.test(row.sha256) && Number.isSafeInteger(row.bytes) && row.bytes>=0,'Malformed source row');
    assert(!rows.has(row.path),`Duplicate source row ${row.path}`);
    rows.set(row.path,row);
  }
  return {value,rows};
};
const bs=source(options['before-source'],beforeRoot), as=source(options['after-source'],afterRoot);
assert.equal(resolve(bs.value.verification.state.path),resolve(options['before-state']),'Baseline source receipt must bind completed state');
assert.equal(bs.value.verification.state.sha256,options['before-state-sha'],'Baseline source receipt state hash');
assert.equal(rebase.originalPrepared.sha256,overlay.baseReceipt.sha256,'Original accepted preparation changed');
assert.equal(sha(readFileSync(rebase.originalPrepared.path)),overlay.baseReceipt.sha256,'Changed original visual-CT preparation');
assert.equal(bs.value.verification.prepared.sha256,rebase.currentPrepared.sha256,'Unexpected verified visual-CT preparation');
assert.equal(resolve(bs.value.verification.prepared.path),resolve(rebase.currentPrepared.path));
assert.equal(sha(readFileSync(rebase.currentPrepared.path)),rebase.currentPrepared.sha256,'Changed verified visual-CT preparation');
assert.equal(as.rows.size,bs.rows.size+overlay.files.filter(row=>row.before===null).length,'Source inventory may add only overlay files');
const safe = (root, rel) => {
  assert(!isAbsolute(rel) && !rel.includes('\\') && !rel.split('/').some(s => !s || s === '.' || s === '..'), `Unsafe manifest path ${rel}`);
  const path = resolve(root, rel);
  assert(!relative(root, path).startsWith('..'));
  return path;
};
async function fileHash(root, rel) {
  const path = safe(root, rel), actual = await realpath(path);
  assert.equal(actual, path, `Symlinked source: ${rel}`);
  assert((await stat(actual)).isFile(), rel);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(actual)) hash.update(chunk);
  return hash.digest('hex');
}
const beforeFiles = Object.fromEntries([...bs.rows].map(([path,row])=>[path,row.sha256]));
const afterFiles = Object.fromEntries([...as.rows].map(([path,row])=>[path,row.sha256]));
for (const [rel, entry] of expected) {
  assert.equal(beforeFiles[rel] ?? null, entry.before, `${rel} before overlay pin`);
  assert.equal(afterFiles[rel], entry.after, `${rel} after overlay pin`);
}
assert.equal(rebase.files.length,7,'Seven accepted files must be explicitly rebased');
assert.equal(new Set(rebase.files.map(row=>row.path)).size,7,'Duplicate rebase file');
for (const row of rebase.files) {
  const entry=expected.get(row.path);
  assert(entry,`Unaccepted rebase file: ${row.path}`);
  assert.equal(row.before,entry.before,`${row.path} rebase before`);
  assert.equal(row.after,entry.after,`${row.path} rebase after`);
  assert.equal(row.before,beforeFiles[row.path]??null,`${row.path} current baseline before`);
  assert.equal(row.after,afterFiles[row.path],`${row.path} candidate after`);
}
const validator=rebase.additionalValidator;
assert.equal(validator.path,'scripts/validate-nested-teaching.mjs','Only the named historical validator is additional');
assert.equal(beforeFiles[validator.path],validator.before,'Historical validator baseline pin');
assert.equal(afterFiles[validator.path],validator.after,'Historical validator successor pin');
const rendererPath = 'content/body-renderer-revision.json';
const reportPath = 'docs/nested-review-validation.json';
const allowed = new Set([...expected.keys(), validator.path, rendererPath, reportPath]);
const paths = new Set([...Object.keys(beforeFiles), ...Object.keys(afterFiles)]);
for (const rel of paths) {
  const prior = beforeFiles[rel] ?? null, current = afterFiles[rel] ?? null;
  assert(/^[a-f0-9]{64}$/.test(current ?? prior), `Invalid hash for ${rel}`);
  if (!allowed.has(rel)) assert.equal(current, prior, `Unexpected source delta: ${rel}`);
  if (prior) {assert.equal(await fileHash(beforeRoot, rel), prior, `${rel} before bytes`);assert.equal((await stat(safe(beforeRoot,rel))).size,bs.rows.get(rel).bytes,`${rel} before size`);}
  if (current) {assert.equal(await fileHash(afterRoot, rel), current, `${rel} after bytes`);assert.equal((await stat(safe(afterRoot,rel))).size,as.rows.get(rel).bytes,`${rel} after size`);}
}
for (const rel of ['public/models/bodyparts3d/full-body/catalog.json','content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','lib/nested-review-material.ts','lib/nested-review-api.ts','scripts/test-nested-coronary-sinus-xray.mjs',rendererPath,reportPath]) assert(beforeFiles[rel] && afterFiles[rel], `Missing protected source: ${rel}`);
assert.equal(beforeFiles['scripts/test-nested-coronary-sinus-xray.mjs'], overlay.rejected.baselineSha256);
assert.equal(afterFiles['scripts/test-nested-coronary-sinus-xray.mjs'], overlay.rejected.baselineSha256);
assert.notEqual(beforeFiles[rendererPath], afterFiles[rendererPath], 'Renderer revision must be regenerated from successor teaching');
const renderer = root => JSON.parse(readFileSync(join(root, rendererPath), 'utf8')).sha256;
assert.notEqual(renderer(beforeRoot), renderer(afterRoot));
const beforeReport=JSON.parse(readFileSync(join(beforeRoot,reportPath),'utf8'));
const afterReport=JSON.parse(readFileSync(join(afterRoot,reportPath),'utf8'));
assert.equal(beforeReport.schemaVersion,1);assert.equal(beforeReport.scope,'nested-dissection-review-software-only');
assert.equal(afterReport.contexts,108);assert.equal(afterReport.sourceBundlesVerified,beforeReport.sourceBundlesVerified);
assert.equal(afterReport.pendingTopicStates,beforeReport.pendingTopicStates-2,'Only two pending topic states may become drafts');
const projectedReport={...afterReport,pendingTopicStates:beforeReport.pendingTopicStates};
assert.deepEqual(projectedReport,beforeReport,'Unexpected generated review validation delta');
const inverse = await import(pathToFileURL(join(afterRoot, 'scripts/small-cardiac-imaging-history.mjs')).href);
const plain = value => JSON.parse(JSON.stringify(value));
async function load(root) {
  const { build } = await import(pathToFileURL(join(root, 'scripts/workspace-test-build.mjs')).href);
  const result = await build({ stdin: {contents: "export * from './content/nested-teaching';export * from './lib/nested-teaching';export * from './lib/nested-anatomy';export * from './lib/nested-review-material';export * from './lib/nested-review-api';export * from './lib/nested-review';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';", resolveDir: root, loader:'ts'}, bundle:true, write:false, platform:'node', format:'esm'});
  const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
  const { build: componentBuild } = await import(pathToFileURL(join(root, 'scripts/workspace-component-test-build.mjs')).href);
  const component = await componentBuild({stdin:{contents:"export {NestedTeaching} from './app/nested-teaching';",resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
  const require = createRequire(join(root,'package.json'));
  const module = {exports:{}};
  runInNewContext(component.outputFiles[0].text,{URLSearchParams,module,exports:module.exports,require});
  return {api, React:require('react'), render:require('react-dom/server').renderToStaticMarkup, NestedTeaching:module.exports.NestedTeaching};
}
globalThis.crypto ??= webcrypto;
assert(freemem() >= 4096 * 1024 * 1024, 'Runtime comparison deferred: at least 4096 MiB free RAM required');
const before = await load(beforeRoot), after = await load(afterRoot);
const restored = inverse.beforeSmallCardiacImaging(after.api.nestedConcepts, after.api.nestedTeachingReferences);
assert.deepEqual(restored.concepts, plain(before.api.nestedConcepts), 'Exact complete authored concept inverse');
assert.deepEqual(restored.references, plain(before.api.nestedTeachingReferences), 'Exact complete reference inverse');
const raw = JSON.parse(readFileSync(join(beforeRoot,'public/models/bodyparts3d/full-body/catalog.json'),'utf8'));
const bc = before.api.bodyDisplayCatalog(raw), ac = after.api.bodyDisplayCatalog(raw);
assert.deepEqual(ac, bc, 'Catalog/model identity');
for (const bundle of bc.bundles) {
  const rel='public'+bundle.url.split('?')[0];
  assert.equal(beforeFiles[rel],bundle.sha256,`${rel} before model pin`);
  assert.equal(afterFiles[rel],bundle.sha256,`${rel} after model pin`);
}
assert.deepEqual(after.api.contentTabs, before.api.contentTabs);
assert.equal(after.api.contentTabs.length*108,972,'Complete nested lesson scope');
assert.deepEqual(after.api.nestedReviewRows, before.api.nestedReviewRows);
const bt = before.api.nestedStudyTargets(bc), at = after.api.nestedStudyTargets(ac);
assert.deepEqual(at, bt); assert.equal(at.length, 108);
const changed = [], revisionChanges = {geometry:0,teaching:0,material:0};
const storage = new Proxy({}, {get(){throw Error('Rejected review reached storage');}});
for (const target of at) {
  const id = `${target.study}/${target.structure.fmaId}/${target.structureId}`;
  const parent = ac.structures.find(s => s.id === target.parentId);
  const oldConcept = before.api.nestedTeachingFor(parent,target.study,target.structure);
  const concept = after.api.nestedTeachingFor(parent,target.study,target.structure);
  assert(concept && oldConcept,`Missing bound nested teaching: ${id}`);
  const selected = target.study === 'coronary-venous' && target.structure.fmaId === 'FMA4714';
  for (const tab of after.api.contentTabs) {
    const oldLesson = oldConcept && before.api.nestedTopicLesson(oldConcept,tab);
    const lesson = concept && after.api.nestedTopicLesson(concept,tab);
    if (selected && ['xray','ultrasound'].includes(tab)) {
      assert.equal(oldLesson.readiness,'pending'); assert.equal(lesson.readiness,'draft');
      assert.deepEqual(lesson.citations,[inverse.expectedSmallCardiac[tab].url]);
      assert.equal(lesson.body,concept.imaging[tab].body);
      assert.match(lesson.note,/specialist review pending/);
      const html = after.render(after.React.createElement(after.NestedTeaching,{parent,study:target.study,selected:target.structure,initialTopic:tab}));
      assert(html.includes(lesson.body) || html.includes(lesson.body.replaceAll('&','&amp;')), `Rendered lesson ${id}/${tab}`);
      assert(html.includes(lesson.citations[0]), `Rendered citation ${id}/${tab}`);
      changed.push(`${id}/${tab}`);
    } else assert.deepEqual(lesson,oldLesson,`Unexpected learner lesson: ${id}/${tab}`);
  }
  const row = after.api.nestedReviewRows.find(r=>r.parentId===target.parentId&&r.study===target.study);
  assert(row,id);
  const b = await before.api.nestedReviewMaterial(row.key,target.structureId);
  const a = await after.api.nestedReviewMaterial(row.key,target.structureId);
  assert(a && b,id);
  assert.deepEqual(a.source,b.source,`${id} source`); assert.deepEqual(a.atlasLink,b.atlasLink,`${id} link`);
  const c=a.context,p=b.context;
  for (const field of ['catalogScope','nestedKey','sourceFrame','structureId','sourceHash','checklistVersion']) assert.deepEqual(c[field],p[field],`${id} ${field}`);
  assert.deepEqual(c.checklists,p.checklists); assert.deepEqual(c.blockers,p.blockers);
  assert.deepEqual(c.revisions.imaging,null); assert.deepEqual(p.revisions.imaging,null);
  assert.equal(c.rendererHash,renderer(afterRoot)); assert.equal(p.rendererHash,renderer(beforeRoot));
  assert.deepEqual(c.teachingTabs.filter(t=>!selected||!['xray','ultrasound'].includes(t)),p.teachingTabs,`${id} existing tabs`);
  for (const kind of ['geometry','teaching']) if(c.revisions[kind]!==p.revisions[kind]) revisionChanges[kind]++;
  if(c.materialHash!==p.materialHash) revisionChanges.material++;
  if (selected) {
    assert.notDeepEqual(a.teaching,b.teaching);
    assert.notEqual(c.teachingHash,p.teachingHash);
    assert.notEqual(c.revisions.teaching,p.revisions.teaching);
    for (const tab of ['xray','ultrasound']) {
      const topic=a.teaching.topics.find(t=>t.tab===tab);
      assert.equal(topic.readiness,'draft'); assert.equal(topic.body,concept.imaging[tab].body);
      assert.deepEqual(topic.references,[inverse.expectedSmallCardiac[tab].url]);
      assert.equal(a.teaching.referenceTitles[inverse.expectedSmallCardiac[tab].url],after.api.nestedTeachingReferences[inverse.expectedSmallCardiac[tab].references[0]].title);
    }
    const projected=plain(a.teaching), old=plain(b.teaching);
    for(const tab of ['xray','ultrasound']) Object.assign(projected.topics.find(t=>t.tab===tab),old.topics.find(t=>t.tab===tab));
    for(const tab of ['xray','ultrasound']) delete projected.concept.imaging[tab];
    for(const tab of ['xray','ultrasound']) delete projected.referenceTitles[inverse.expectedSmallCardiac[tab].url];
    assert.deepEqual(projected,old,`${id} review teaching inverse`);
  } else {
    assert.deepEqual(a.teaching,b.teaching,`${id} unrelated teaching`);
    assert.equal(c.teachingHash,p.teachingHash); assert.equal(c.revisions.teaching,p.revisions.teaching);
  }
  for(const track of ['geometry','teaching']) {
    const response = await after.api.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_COMPARE'},body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:p.materialHash,revisionHash:p.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:after.api.blankNestedReview(c,track)})}),storage);
    assert.equal(response.status,409,`${id} old ${track} revision must fail before storage`);
  }
  const imaging = await after.api.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_COMPARE'},body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:'f'.repeat(64),checklistVersion:c.checklistVersion,track:'imaging',expectedVersion:0,draft:{}})}),storage);
  assert.equal(imaging.status,400,`${id} imaging review remains blocked`);
}
assert.deepEqual(changed.sort(),['coronary-venous/FMA4714/'+at.find(t=>t.study==='coronary-venous'&&t.structure.fmaId==='FMA4714').structureId+'/ultrasound','coronary-venous/FMA4714/'+at.find(t=>t.study==='coronary-venous'&&t.structure.fmaId==='FMA4714').structureId+'/xray'].sort());
assert.equal(revisionChanges.geometry,108,'Conservative renderer-driven geometry revisions across all selections');
assert.equal(revisionChanges.material,108,'Conservative material revisions across all selections');
assert.equal(revisionChanges.teaching,1,'Only FMA4714 teaching revision changes');
console.log(JSON.stringify({status:'passed',beforeSource:options['before-source-sha'],afterSource:options['after-source-sha'],beforeState:options['before-state-sha'],selections:at.length,changedLessons:changed,revisionChanges,clinicalApproval:false,geometryApproved:false}));
