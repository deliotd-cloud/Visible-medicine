import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, relative, extname } from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {beforeAbdominalAortaUltrasound,centralSourceBeforeAbdominalAortaUltrasound,targetId as aortaId,hash as lessonHash} from './abdominal-aorta-ultrasound-history.mjs';
import {beforeDescendingAortaUltrasound} from './descending-aorta-ultrasound-history.mjs';
import aortaRevision from '../content/abdominal-aorta-ultrasound-revision.transition.json' with {type:'json'};
process.on('uncaughtException',error=>{process.stderr.write(error.message+'\n');process.exit(1);});
import { fileURLToPath, pathToFileURL } from 'node:url';

// Actual current learner/Review and exact Git-baseline comparison; no reports or private records.
const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = '3ebfae0ac6443e4981098b011775e6fd26d3476b';
const git = path => execFileSync('git',['show',baseline+':'+path],{cwd:sourceRoot,encoding:'utf8',maxBuffer:16000000});
const sourcePath = resolve(sourceRoot, 'content/central-vessel-imaging.ts');
const original = git('content/central-vessel-imaging.ts');
const candidate = await readFile(sourcePath, 'utf8');
const normalized = text => text.replaceAll('\r\n', '\n').trimEnd();
const predecessorSource=centralSourceBeforeAbdominalAortaUltrasound(candidate);
const added = predecessorSource.split('\n').filter(line => line.includes("ultrasound:fact('Specialist transoesophageal"));
assert.equal(added.length, 1);
assert.equal(predecessorSource.replace('\n' + added[0], ''), normalized(original), 'Exact later aorta revision reversed; only one descending-aorta addition remains');
const { build } = await import(pathToFileURL(resolve(sourceRoot, 'scripts/workspace-test-build.mjs')));
const {createGitObjectReader} = await import(pathToFileURL(resolve(sourceRoot,'scripts/git-object-reader.mjs')));
const sourceBlobs=new Map(execFileSync('git',['ls-tree','-r',baseline],{cwd:sourceRoot,encoding:'utf8',maxBuffer:16000000}).trim().split('\n').map(line=>{const match=line.match(/^\d+ blob ([a-f0-9]{40})\t(.+)$/);return match?[match[2],match[1]]:[];}));
const entry = `export {bodyLesson,bodyContent} from './app/body-content.ts';
export {bodyDisplayCatalog} from './lib/body-display-catalog.ts';
export {contentTabs} from './lib/content-types.ts';
export {bodyReviewSnapshot,bodyReviewMaterial} from './lib/body-review-material.ts';
export {bodyReviewContext} from './lib/body-review-context.ts';
export {centralVesselImagingLesson} from './lib/central-vessel-imaging.ts';
export {centralVesselImagingGroups,centralVesselImagingReferences} from './content/central-vessel-imaging.ts';`;
async function load(staged) {
  const reader=createGitObjectReader({cwd:sourceRoot});
  try {
  const bundle = await build({stdin:{contents:entry,resolveDir:sourceRoot,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',
    plugins: [{name:'one-staged-topic-and-history',setup(api){
      api.onResolve({filter:/^node:/},args=>({path:args.path,external:true}));
      api.onLoad({filter:/.*/,namespace:'workspace-test'},async args => {
        if(staged&&resolve(args.path)===sourcePath)return {contents:candidate,loader:'ts',resolveDir:dirname(sourcePath)};
        const path=relative(sourceRoot,args.path).replaceAll('\\','/');
        if(!staged&&!path.startsWith('node_modules/')){
          assert(sourceBlobs.has(path),'Missing exact baseline module '+path);
          return {contents:(await reader.readBlob(sourceBlobs.get(path))).toString('utf8'),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
        }
      });
    }}]});
  return import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
  } finally {await reader.close();}
}
const before = {...await load(false),beforeDescendingAortaUltrasound}, live = await load(true);
const raw = JSON.parse(await readFile(resolve(sourceRoot, 'public/models/bodyparts3d/full-body/catalog.json'), 'utf8'));
assert.deepEqual(raw,JSON.parse(git('public/models/bodyparts3d/full-body/catalog.json')));
const baselineRenderer=JSON.parse(git('content/body-renderer-revision.json'));
const currentRenderer=JSON.parse(await readFile(resolve(sourceRoot,'content/body-renderer-revision.json'),'utf8'));
const catalog = live.bodyDisplayCatalog(raw);
const after={...beforeAbdominalAortaUltrasound(live,catalog),beforeDescendingAortaUltrasound};
assert.deepEqual(catalog, before.bodyDisplayCatalog(raw), 'Every geometry/source record preserved');
const pins = JSON.parse(await readFile(resolve(sourceRoot, 'content/central-vessel-imaging-pins.json'), 'utf8'));
assert.deepEqual(pins,JSON.parse(git('content/central-vessel-imaging-pins.json')));
const structure = catalog.structures.find(s => s.fmaId === 'FMA87217');
assert(structure);
assert.deepEqual(structure, pins.entries.find(e => e.identity.fmaId === 'FMA87217').identity, 'Exact independent existing source pin');
assert.equal(structure.id, 'vm:anatomy:body:thorax:unspecified:vessel:descending-thoracic-aorta');
assert.equal(before.bodyLesson(structure, 'ultrasound').readiness, 'pending');
let changed = 0, preserved = 0;
for (const s of catalog.structures) for (const tab of before.contentTabs) {
  const old = before.bodyLesson(s, tab), next = after.bodyLesson(s, tab);
  if (s.id === structure.id && tab === 'ultrasound') {
    changed++;
    assert.equal(next.readiness, 'draft');
    assert.deepEqual(next, after.centralVesselImagingLesson(s, tab));
    assert.match(next.body, /short-axis.*long-axis/);
    assert.match(next.body, /routine surface abdominal ultrasound is a different examination/);
    assert.match(next.bullets.join(' '), /screen orientation.*exact level/);
    assert.match(next.bullets.join(' '), /no patient echo plane, registered location, wall finding or Doppler measurement/);
    assert(next.citations.includes('https://www.asecho.org/wp-content/uploads/2014/05/2013_Performing-Comprehensive-TEE.pdf'));
    const review = after.bodyReviewSnapshot(s.id).topics.find(t => t.tab === tab);
    assert.deepEqual(review, {tab,...next}, 'Actual learner and actual Review topic agree');
  } else { assert.deepEqual(next, old, `${s.fmaId} ${tab} preserved`); preserved++; }
}
assert.equal(changed, 1);
assert.equal(preserved, 9935);
const originalCentralTopics = pins.entries.flatMap(e => e.topics.map(tab => ({identity:e.identity,tab})));
assert.equal(originalCentralTopics.length, 79, 'Immutable original central-vessel epoch');
for (const {identity,tab} of originalCentralTopics) {
  assert.equal(after.bodyLesson(identity,tab).readiness, 'draft');
  assert.deepEqual(after.bodyLesson(identity,tab),before.bodyLesson(identity,tab));
}
assert.equal(originalCentralTopics.length + changed, 80, 'Original 79 placements plus precisely one new descending-aorta US placement');
const replay = after.beforeDescendingAortaUltrasound(after,catalog);
const omittedPrior={...before};delete omittedPrior.centralVesselImagingGroups;delete omittedPrior.centralVesselImagingLesson;delete omittedPrior.centralVesselImagingReferences;
assert.equal(before.beforeDescendingAortaUltrasound(omittedPrior,catalog),omittedPrior,'Immutable display API omitted exports preserves exact prior');
const omittedCurrent={...after};delete omittedCurrent.centralVesselImagingGroups;delete omittedCurrent.centralVesselImagingLesson;delete omittedCurrent.centralVesselImagingReferences;
assert.throws(()=>after.beforeDescendingAortaUltrasound(omittedCurrent,catalog),/Unrecorded.*omitted-contract/);
assert.equal(after.beforeDescendingAortaUltrasound(replay,catalog),replay,'Idempotent one-topic reversal');
assert.equal(before.beforeDescendingAortaUltrasound(before,catalog),before,'Unchanged prior source returns same API');
for(const s of catalog.structures)for(const tab of before.contentTabs)assert.deepEqual(replay.bodyLesson(s,tab),before.bodyLesson(s,tab),'One-topic removal exactly recovers current baseline');
assert.deepEqual(replay.centralVesselImagingGroups,before.centralVesselImagingGroups);
assert.deepEqual(replay.centralVesselImagingReferences,before.centralVesselImagingReferences,'Shared TEE reference retained');
const badGroups=structuredClone(after.centralVesselImagingGroups);badGroups['descending-aorta'].focus.ultrasound.body+=' foreign';
assert.throws(()=>after.beforeDescendingAortaUltrasound({...after,centralVesselImagingGroups:badGroups},catalog),/Unrecorded/);
assert.throws(()=>after.beforeDescendingAortaUltrasound({...after,bodyLesson(s,t){const next=after.bodyLesson(s,t);return s.id===structure.id&&t==='ultrasound'?{...next,body:next.body+' foreign'}:next;}},catalog),/Unrecorded/);
const forged=structuredClone(structure);forged.sources[0].sha256='foreign';
assert.throws(()=>replay.bodyLesson(forged,'ultrasound'),/exact source/);
let adapterNegatives=0;
for(const key of ['body','pitfall','references']){
  const groups=structuredClone(after.centralVesselImagingGroups);
  groups['descending-aorta'].focus.ultrasound[key]=key==='references'?['aortaCT']:groups['descending-aorta'].focus.ultrasound[key]+' foreign';
  assert.throws(()=>after.beforeDescendingAortaUltrasound({...after,centralVesselImagingGroups:groups},catalog),/Unrecorded/);adapterNegatives++;
}
for(const key of ['body','note','citations','readiness']){
  assert.throws(()=>after.beforeDescendingAortaUltrasound({...after,bodyLesson(s,t){const lesson=after.bodyLesson(s,t);return s.id===structure.id&&t==='ultrasound'?{...lesson,[key]:key==='citations'?[]:'foreign'}:lesson;}},catalog),/Unrecorded/);adapterNegatives++;
}
assert.throws(()=>after.beforeDescendingAortaUltrasound({...after,centralVesselImagingLesson(){return undefined;}},catalog),/Unrecorded/);adapterNegatives++;
assert.throws(()=>after.beforeDescendingAortaUltrasound({...after,bodyContent(s,t){const content=after.bodyContent(s,t);return s.id===structure.id&&t==='ultrasound'?{...content,body:'foreign'}:content;}},catalog),/Unrecorded/);adapterNegatives++;
const foreignCatalog=structuredClone(catalog);foreignCatalog.structures.find(s=>s.id===structure.id).sources[0].sha256='foreign';
assert.throws(()=>after.beforeDescendingAortaUltrasound(after,foreignCatalog),/Unrecorded.*source/);adapterNegatives++;
const mixed={...after,centralVesselImagingGroups:before.centralVesselImagingGroups};
assert.throws(()=>after.beforeDescendingAortaUltrasound(mixed,catalog),/Unrecorded.*prior/);adapterNegatives++;
assert.throws(()=>before.beforeDescendingAortaUltrasound({...before,bodyLesson(s,t){const lesson=before.bodyLesson(s,t);return s.id===structure.id&&t==='ultrasound'?{...lesson,body:'foreign'}:lesson;}},catalog),/Unrecorded.*prior/);adapterNegatives++;
let teachingRevisionsChanged = 0;
let laterAortaRevisionsChanged = 0;
for (const s of catalog.structures) {
  const old = await before.bodyReviewMaterial(s.id), next = await after.bodyReviewMaterial(s.id);
  const oldContext=await before.bodyReviewContext(s.id),nextContext=await after.bodyReviewContext(s.id);
  assert.equal(oldContext.rendererHash,baselineRenderer.sha256);
  assert.equal(nextContext.rendererHash,currentRenderer.sha256);
  assert.equal(nextContext.sourceHash,oldContext.sourceHash);
  assert.deepEqual(nextContext.checklists,oldContext.checklists);
  const scope={catalogScope:nextContext.catalogScope,structureId:nextContext.structureId,checklistVersion:nextContext.checklistVersion};
  const expectedGeometry=createHash('sha256').update(JSON.stringify({...scope,source:nextContext.sourceHash,renderer:currentRenderer.sha256,checks:nextContext.checklists.geometry})).digest('hex');
  assert.equal(nextContext.revisions.geometry,expectedGeometry,'Geometry revision bound to current renderer without migrating approval');
  assert.equal(next.approval, false);
  assert.equal(next.status, 'worksheet-not-submitted');
  assert.equal(next.fingerprints.source, old.fingerprints.source);
  assert.equal(next.fingerprints.checklist, old.fingerprints.checklist);
  if (s.id === structure.id) {
    assert.notEqual(next.fingerprints.teaching, old.fingerprints.teaching);
    assert.notEqual(next.materialHash, old.materialHash);
    teachingRevisionsChanged++;
    assert.notEqual(nextContext.revisions.teaching,oldContext.revisions.teaching);
  } else if(s.id===aortaId){
    // Precisely the separately pinned later revision, not an arbitrary mismatch
    // exemption. Its strict adapter and own all-topic Review test are required.
    assert.equal(lessonHash(before.bodyLesson(s,'ultrasound')),aortaRevision.beforeLessonSha256);
    assert.equal(lessonHash(live.bodyLesson(s,'ultrasound')),aortaRevision.afterLessonSha256);
    for(const tab of before.contentTabs)assert.deepEqual(
      live.bodyReviewSnapshot(s.id).topics.find(t=>t.tab===tab),
      {tab,...(tab==='ultrasound'?live.bodyLesson(s,tab):before.bodyLesson(s,tab))});
    assert.notEqual(next.fingerprints.teaching,old.fingerprints.teaching);
    assert.notEqual(nextContext.revisions.teaching,oldContext.revisions.teaching);
    laterAortaRevisionsChanged++;
  } else {
    assert.deepEqual(next, old, 'All unrelated Review material preserved');
    assert.equal(nextContext.revisions.teaching,oldContext.revisions.teaching);
  }
}
assert.equal(teachingRevisionsChanged, 1);
assert.equal(laterAortaRevisionsChanged,1);
let refused = 0;
for (const mutate of [
  s => s.id += '-foreign', s => s.fmaId = 'FMA61970', s => s.name += '-foreign',
  s => s.sourceName += '-foreign', s => s.laterality = 'left', s => s.region = 'abdomen',
  s => s.regions.push('abdomen'), s => s.bundle += '-foreign', s => s.nodeName += '-foreign',
  s => s.sources[0].sha256 = 'changed', s => s.sources[0].file = 'changed',
  s => s.bounds.min[0] += .01, s => s.anchor[0] += .01,
]) {
  const bad = structuredClone(structure); mutate(bad);
  assert.equal(after.centralVesselImagingLesson(bad, 'ultrasound'), undefined, 'Altered source signature refused');
  assert.notEqual(after.bodyLesson(bad, 'ultrasound').body, after.bodyLesson(structure, 'ultrasound').body);
  refused++;
}
for (const id of ['FMA19728','FMA61970','FMA45097','FMA45098']) {
  const held = catalog.structures.find(s => s.fmaId === id);
  if (held) assert.equal(after.centralVesselImagingLesson(held, 'ultrasound'), undefined, 'Held identity cannot inherit this topic');
}
console.log(JSON.stringify({baseline,changed,preserved,refused,adapterNegatives,scopedCentralPlacements:80,teachingRevisionsChanged,laterAortaRevisionsChanged,geometryPreserved:true,reviewMatches:true,currentRenderer:currentRenderer.sha256,baselineRenderer:baselineRenderer.sha256,clinicalApproval:false}));
