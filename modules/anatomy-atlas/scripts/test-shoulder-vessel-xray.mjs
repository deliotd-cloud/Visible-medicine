import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const working = process.argv.length === 3 && process.argv[2] === '--working-transition';
assert(working || process.argv.length === 2, 'Only --working-transition is accepted');
const baseline = 'd819cd556d990e4100534aa2ceab3c20cc181d8e';
const baselineTree = '7f895c706276c587a1c0f1e61ee357034dc7c1d6';
const introduced = ['lib/shoulder-vessel-xray.ts', 'content/shoulder-girdle-xray.ts', 'content/shoulder-venous-xray.ts'];
const pins = ['content/shoulder-girdle-artery-quiz-pins.json', 'content/systemic-venous-pins.json',
  'content/suprascapular-vessel-ultrasound-pins.json', 'content/upper-venous-clinical-pins.json'];
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const brachialCatalogPath = 'public/models/bodyparts3d/brachial-veins/catalog.json';
const git = args => execFileSync('git', args, {windowsHide: true, maxBuffer: 64e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const bytes = (revision, path) => git(['show', `${revision}:${path}`]);
const revision = args => git(['rev-parse', ...args]).toString().trim();
assert.equal(revision([`${baseline}^{commit}`]), baseline);
assert.equal(revision([`${baseline}^{tree}`]), baselineTree);
let introduction;
if (working) {
  assert.equal(revision(['HEAD']), baseline, 'Working transition requires exact baseline HEAD');
  for (const path of introduced)
    assert.equal(git(['ls-files', '--others', '--exclude-standard', '--', path]).toString().trim(), path,
      `${path}: working source must be untracked`);
} else {
  introduction = git(['log', '--diff-filter=A', '--format=%H', '--', introduced[0]])
    .toString().trim().split(/\r?\n/).filter(Boolean).at(-1);
  assert.match(introduction ?? '', /^[a-f0-9]{40}$/, 'Immutable helper introduction');
  assert.equal(git(['merge-base', baseline, introduction]).toString().trim(), baseline);
  assert.equal(git(['merge-base', introduction, 'HEAD']).toString().trim(), introduction);
  for (const path of introduced) assert(bytes(introduction, path).length > 0, `${path}: introduced source`);
}
for (const path of [...pins, catalogPath, brachialCatalogPath])
  assert.deepEqual(readFileSync(path), bytes(baseline, path), `${path}: retained baseline source`);
const [girdle, systemic, supra, upper] = pins.map(path => JSON.parse(bytes(baseline, path)));
const rawCatalog = JSON.parse(bytes(baseline, catalogPath));
const brachialCatalog = JSON.parse(bytes(baseline, brachialCatalogPath));
// Independent FMA, family, side, file and digest fixtures from the committed pins.
const fixtures = [
  ['FMA3992','thyrocervical','right','right-thyrocervical-trunk','FJ2307','b81b463eeedf5999f8cd9e072d445799e9c3dcd23a618cda3fb867af39cfe123',0],
  ['FMA4084','thyrocervical','left','left-thyrocervical-trunk','FJ2255','15a93e07812a3d1aeed4d8be392335496fb024ab0d8bb1d4e30e281c3d93c810',0],
  ['FMA5039','costocervical','right','right-costocervical-trunk','FJ2276','607905f3c66e08d10c3362c702d0ca13bebd55a71fd83667a61f6738d1a66210',0],
  ['FMA4086','costocervical','left','left-costocervical-trunk','FJ2224','32df22be6cdf4200ad69dc439e7b6be7cf6e9ebcc44579526819bbcdf75fc106',0],
  ['FMA4057','dorsalScapular','right','right-dorsal-scapular-artery','FJ2284','1790c89e2535c2831726f71c88ab9f918e113cf20fef742b56d928c108b337aa',0],
  ['FMA10552','dorsalScapular','left','left-dorsal-scapular-artery','FJ2232','729363384679145bcaf83868d792dd3dff3f42c56a809d3a3d6cc1e09261e5be',0],
  ['FMA10698','suprascapular','right','right-suprascapular-artery','FJ2303','7f065a02471a2664b8d258786de9eaa0a5923bdb3c346cc818908ba07faf243d',0],
  ['FMA10681','suprascapular','left','left-suprascapular-artery','FJ2251','89f37b85c44d82a11482e56365078b40d8a542c1ad0bcfb4ccd823574645173f',0],
  ['FMA13330','axillary','right','right-axillary-vein','FJ2269','24438422321aa6665de6394aa39e79fdeabdf2bc56427a3419da4dc630546464',1],
  ['FMA13331','axillary','left','left-axillary-vein','FJ2217','7b448d1f2a071e88d1a2ebe54e7e5d417719663a5b01d1226f492b71ebdc19cd',1],
  ['FMA50859','suprascapularVein','right','right-suprascapular-vein','FJ2302','05a1af2bdafa5d179753ce923971e3300a4451ce71788d9fc3bf115897dc92db',2],
  ['FMA50860','suprascapularVein','left','left-suprascapular-vein','FJ2250','50bcc347434326f06d5db0054036b90215f78f964c3d00c0c94cd0b981dd558b',2],
  ['FMA22935','medialBrachial','right','right-medial-brachial-vein','FJ2341','0468a157795c7346d964d1884627464d5cfe9c4c8bcc84661aefdb2bc2d18259',3],
  ['FMA22936','medialBrachial','left','left-medial-brachial-vein','FJ2313','3707bf67b5959e140fea0eca643bc31db00e97620e63afbe48ed10357af44ec8',3],
];
assert.equal(fixtures.length, 14);
const sources = [girdle.entries.map(e => ({identity:e.identity, group:e.group})),
  systemic.entries.map(identity => ({identity, group:'axillary'})),
  supra.entries.map(e => ({identity:e.identity, group:e.family === 'vein' ? 'suprascapularVein' : e.family})),
  upper.entries.map(e => ({identity:e.identity, group:e.family === 'brachial' ? 'medialBrachial' : e.family}))];
const identities = new Map();
for (const [fma, group, side, suffix, file, sha256, pinIndex] of fixtures) {
  const id = `vm:anatomy:body:shoulder-arm:${side}:vessel:${suffix}`;
  const rows = sources[pinIndex].filter(e => e.identity.fmaId === fma || e.identity.id === id);
  assert.equal(rows.length, 1, `${fma}: unique retained pin`);
  const {identity:i} = rows[0];
  assert.equal(rows[0].group, group);
  assert.equal(i.id, id);
  assert.equal(i.laterality, side);
  assert.equal(i.region, 'shoulder-arm');
  assert.equal(i.system, 'vessels');
  assert.equal(i.category, 'vessel');
  assert.equal(i.bundle, pinIndex === 3 ? 'brachial-veins' : 'shoulder-arm-vessels-inventory');
  assert.equal(i.nodeName, fma);
  assert.equal(i.sourceTree, 'isa');
  assert.deepEqual(i.sources, [{file, sha256}]);
  assert.equal(i.validation.status, 'unvalidated');
  assert.equal(i.validation.anatomicalReview, false);
  assert.deepEqual([rawCatalog,brachialCatalog].flatMap(source => source.structures.filter(row => row.fmaId === fma)),
    [i], `${fma}: baseline catalog`);
  assert(!identities.has(id)); identities.set(id, i);
}
assert.equal(identities.size, 14);
const glbs = git(['ls-tree','-r','--name-only',baseline]).toString().split(/\r?\n/).filter(p => p.endsWith('.glb'));
assert.equal(glbs.length, 146);
for (const path of glbs) assert.deepEqual(readFileSync(path), bytes(baseline,path), `${path}: GLB bytes`);
const specimenSources = ['lib/guided-playback.ts','lib/specimen-guided-dissection.ts',
  'lib/um-limb-studies.ts','lib/um-limb-guided-dissection.ts',
  'lib/abdominal-wall.ts','lib/abdominal-guided-dissection.ts',
  'lib/back-layers.ts','lib/back-guided-dissection.ts',
  'lib/hra-renal.ts','lib/hra-renal-guided-dissection.ts',
  'lib/hra-pelvis.ts','lib/hra-pelvic-guided-dissection.ts'];
for (const path of specimenSources)
  assert.deepEqual(readFileSync(path),bytes(baseline,path),`${path}: retained specimen guide source`);

const compiled = await build({stdin:{contents:
  "export * from './lib/shoulder-vessel-xray';export * from './content/shoulder-girdle-xray';export * from './content/shoulder-venous-xray';"+
  "export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';"+
  "export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';"+
  "export {dissectionProfiles} from './app/dissection-data';export * from './lib/regional-tours';"+
  "export {limbDefinitions} from './lib/um-limb-studies';"+
  "export {umLimbGuidedDissection} from './lib/um-limb-guided-dissection';"+
  "export {abdominalWallDefinition} from './lib/abdominal-wall';"+
  "export {abdominalGuidedDissection} from './lib/abdominal-guided-dissection';"+
  "export {backLayersDefinition} from './lib/back-layers';"+
  "export {backGuidedDissection} from './lib/back-guided-dissection';"+
  "export {hraRenalDefinition} from './lib/hra-renal';"+
  "export {hraRenalGuidedDissection} from './lib/hra-renal-guided-dissection';"+
  "export {hraPelvisDefinition} from './lib/hra-pelvis';"+
  "export {hraPelvicGuidedDissection} from './lib/hra-pelvic-guided-dissection';"+
  "export * from './lib/body-review-material';export * from './lib/body-review-context';"+
  "export * from './lib/body-review-response';export * from './lib/body-review-api';"+
  "export * from './lib/body-review-decisions';",
  resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const live = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const guides=[...Object.values(live.limbDefinitions).map(def=>live.umLimbGuidedDissection(def)),
  live.abdominalGuidedDissection(live.abdominalWallDefinition),
  live.backGuidedDissection(live.backLayersDefinition),
  live.hraRenalGuidedDissection(live.hraRenalDefinition),
  live.hraPelvicGuidedDissection(live.hraPelvisDefinition)];
assert.equal(guides.length,9);
assert(guides.every(guide=>guide && guide.steps.length>1));
assert.equal(guides.reduce((n,guide)=>n+guide.steps.length,0),73);
const old = await exactSourceHistoryApi(baseline, 'regional-tour-review');
const feature = working ? live : await exactSourceHistoryApi(introduction, 'shoulder-vessel-xray-epoch');
const wholeEpoch = working || revision(['HEAD']) === introduction;
const subject = wholeEpoch ? live : feature;
const catalog = feature.bodyDisplayCatalog(rawCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.structures.length * feature.contentTabs.length, 9936);
assert.deepEqual(catalog, old.bodyDisplayCatalog(rawCatalog), 'complete transformed baseline catalog');
for (const i of identities.values()) assert.deepEqual(catalog.structures.filter(row => row.id === i.id), [i]);
for (const key of ['contentTabs','structures','dissectionProfiles','regionalTours']) assert.deepEqual(feature[key],old[key],key);
assert.equal(feature.regionalTours.length,51);
assert.equal(feature.regionalTours.reduce((n,t) => n+t.steps.length,0),309);
if (wholeEpoch) assert.deepEqual(live.bodyDisplayCatalog(rawCatalog),catalog);

const pathsWhere = (value,predicate,path=[]) => [...(predicate(value)?[path]:[]),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key,child]) =>
    pathsWhere(child,predicate,[...path,key])) : [])];
const at = (value,path) => path.reduce((part,key) => part[key],value);
let refusedIdentities=0;
for (const i of identities.values()) {
  assert.equal(subject.shoulderVesselXrayLesson(i,'xray').readiness,'draft');
  for (const tab of feature.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(subject.shoulderVesselXrayLesson(i,tab),undefined);
  for (const path of pathsWhere(i,v => v === null || typeof v !== 'object')) {
    const bad=structuredClone(i),parent=at(bad,path.slice(0,-1)),key=path.at(-1),original=parent[key];
    parent[key]=typeof original==='string'?original+'-foreign':typeof original==='number'?original+0.01:
      original===null?'foreign':!original;
    assert.equal(subject.shoulderVesselXrayLesson(bad,'xray'),undefined,`${i.id}:${path.join('.')}`);refusedIdentities++;
  }
  for (const path of pathsWhere(i,Array.isArray)) {
    const bad=structuredClone(i);at(bad,path).push('foreign');
    assert.equal(subject.shoulderVesselXrayLesson(bad,'xray'),undefined,`${i.id}:${path.join('.')} extended`);refusedIdentities++;
  }
  for (const path of pathsWhere(i,v => v && typeof v==='object' && !Array.isArray(v))) {
    const bad=structuredClone(i);at(bad,path).unexpected=true;
    assert.equal(subject.shoulderVesselXrayLesson(bad,'xray'),undefined,`${i.id}:${path.join('.')} extra`);refusedIdentities++;
    for (const key of Object.keys(at(i,path))) {
      const omitted=structuredClone(i);delete at(omitted,path)[key];
      assert.equal(subject.shoulderVesselXrayLesson(omitted,'xray'),undefined,`${i.id}:${[...path,key].join('.')} omitted`);refusedIdentities++;
    }
  }
  for (const path of pathsWhere(i,v => Array.isArray(v) && v.length>1)) {
    const original=at(i,path),index=original.findIndex((v,n) => n>0 && JSON.stringify(v)!==JSON.stringify(original[0]));
    if(index<0)continue;const bad=structuredClone(i),array=at(bad,path);
    [array[0],array[index]]=[array[index],array[0]];
    assert.equal(subject.shoulderVesselXrayLesson(bad,'xray'),undefined,`${i.id}:${path.join('.')} reordered`);refusedIdentities++;
  }
  for (const altered of [
    {...i,id:i.id.replace(':right:',':left:')},
    {...i,name:i.name+' mirror'},
    {...i,sources:[{file:'foreign',sha256:i.sources[0].sha256}]},
  ]) if(JSON.stringify(altered)!==JSON.stringify(i)) {
    assert.equal(subject.shoulderVesselXrayLesson(altered,'xray'),undefined,`${i.id}: alias/mirror/source`);refusedIdentities++;
  }
}

const arterial=feature.shoulderGirdleXrayTopics,venous=feature.shoulderVenousXrayTopics;
assert.deepEqual(Object.keys(arterial).sort(),['costocervical','dorsalScapular','suprascapular','thyrocervical']);
assert.deepEqual(Object.keys(venous).sort(),['axillary','medialBrachial','suprascapularVein']);
assert.match(arterial.thyrocervical.study,/55.*82.*41.*15 to 82/i);
assert.match(arterial.dorsalScapular.study,/50.*93.*47/i);
assert.match(arterial.costocervical.study,/16.*occlusion/i);
assert.match(arterial.suprascapular.study,/single.*CTA.*selective arteriography/i);
assert.match(venous.axillary.study,/74.*69.*six/i);
assert.match(venous.suprascapularVein.study,/five fresh cadavers.*ultrasound/i);
assert.match(venous.medialBrachial.study,/74.*69/i);
for (const [topics,refs] of [[arterial,feature.shoulderGirdleXrayReferences],[venous,feature.shoulderVenousXrayReferences]])
  for (const topic of Object.values(topics)) {
    assert(topic.body.length>40 && topic.study.length>40);
    assert(topic.citations.length>0);
    for (const key of topic.citations) assert.match(refs[key]??'',/^https:\/\//);
    assert.doesNotMatch(topic.body+' '+topic.study,/approved for clinical use|registered to a patient|normal visibility rate is/i);
  }

let changed=0,preserved=0,changedPackets=0,preservedPackets=0,malformed=0,stale=0,forgedSave=0,forgedApproval=0,storageCalls=0;
const db={prepare(){storageCalls++;throw Error('Rejected shoulder vessel decision reached storage');}};
const request=value=>new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test',
  'content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_SHOULDER_VESSEL_XRAY'},body:JSON.stringify(value)});
for (const structure of catalog.structures) {
  for (const tab of feature.contentTabs) {
    const previous=old.bodyLesson(structure,tab),lesson=feature.bodyLesson(structure,tab);
    if(wholeEpoch) assert.deepEqual(subject.bodyLesson(structure,tab),lesson,`${structure.id}:${tab}: current epoch`);
    if(identities.has(structure.id) && tab==='xray') {
      assert.equal(previous.readiness,'pending');assert.equal(lesson.readiness,'draft');
      assert.deepEqual(lesson,feature.shoulderVesselXrayLesson(structure,tab));
      assert.deepEqual(subject.shoulderVesselXrayLesson(structure,tab),lesson);
      assert(lesson.citations.length>0 && lesson.citations.every(url => /^https:\/\//.test(url)));
      assert.equal(new Set(lesson.citations).size,lesson.citations.length);
      const prose=[lesson.body,...lesson.bullets,lesson.note].join(' ');
      assert.match(prose,/plain radiograph|plain film|plain radiography/i);
      assert.match(prose,/contrast|arteriograph|venograph/i);
      assert.match(prose,/not outline|cannot establish/i);
      assert.match(prose,/source-bound|source label|atlas label/i);
      assert.match(prose,/side|projection/i);
      assert.doesNotMatch(prose,/approved for clinical use|registered to a patient|normal arterial patency/i);
      const {readiness,...content}=lesson;assert.deepEqual(feature.bodyContent(structure,tab),content);
      const copy=structuredClone(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
      assert.deepEqual(subject.shoulderVesselXrayLesson(structure,tab),copy);changed++;
    } else {
      assert.deepEqual(lesson,previous,`${structure.id}:${tab}: untouched topic`);
      assert.equal(subject.shoulderVesselXrayLesson(structure,tab),undefined);preserved++;
    }
  }
  const before=await old.bodyReviewMaterial(structure.id),packet=await feature.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval,false);
  if(identities.has(structure.id)) {
    const current=await subject.bodyReviewMaterial(structure.id);
    for(const key of ['source','topics','reasoning','guidedTours','checklist','atlasLink','limits','fingerprints','materialHash'])
      assert.deepEqual(current[key],packet[key],`${structure.id}: current ${key}`);
    assert.deepEqual(packet.topics.filter(row=>row.tab!=='xray'),before.topics.filter(row=>row.tab!=='xray'));
    for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
      assert.deepEqual(packet[key],before[key],`${structure.id}: retained ${key}`);
    assert.equal(packet.fingerprints.source,before.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching,before.fingerprints.teaching);
    assert.notEqual(packet.materialHash,before.materialHash);
    assert.deepEqual(packet.topics.find(row=>row.tab==='xray'),{tab:'xray',...feature.bodyLesson(structure,'xray')});
    assert.deepEqual(await feature.parseBodyReviewResponse(packet,structure.id),packet);
    assert.deepEqual(await subject.parseBodyReviewResponse(current,structure.id),current);
    assert.equal(await subject.parseBodyReviewResponse(before,structure.id),null);
    for(const edit of [
      x=>{x.topics.find(row=>row.tab==='xray').body+=' foreign';},
      x=>{x.topics.find(row=>row.tab==='xray').citations=['https://foreign.example'];},
      x=>{x.topics.find(row=>row.tab==='xray').readiness='approved';},
      x=>{x.source.structure.sources=[];},
    ]) {const bad=structuredClone(current);edit(bad);assert.equal(await subject.parseBodyReviewResponse(bad,structure.id),null);malformed++;}
    const priorContext=await old.bodyReviewContext(structure.id),context=await subject.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash,priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
    const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
      materialHash:priorContext.materialHash,revisionHash:priorContext.revisions.teaching,
      checklistVersion:context.checklistVersion,draft:subject.blankBodyReview(context,'teaching')};
    assert.equal((await subject.postBodyDecision(request(decision),db)).status,409);stale++;
    decision.materialHash=context.materialHash;decision.revisionHash=context.revisions.teaching;
    const foreign=structuredClone(decision);foreign.draft.checks.foreign=true;
    assert.equal((await subject.postBodyDecision(request(foreign),db)).status,422);forgedSave++;
    decision.draft.status='approved';
    assert.equal((await subject.postBodyDecision(request(decision),db)).status,422);forgedApproval++;
    changedPackets++;
  } else {assert.deepEqual(packet,before,`${structure.id}: untouched Review packet`);preservedPackets++;}
}
assert.deepEqual([changed,preserved,changedPackets,preservedPackets],[14,9922,14,1090]);
assert.deepEqual([malformed,stale,forgedSave,forgedApproval,storageCalls],[56,14,14,14,0]);
console.log(JSON.stringify({verdict:'pass',baseline,introduction,working,wholeEpoch,changed,preserved,
  changedPackets,preservedPackets,refusedIdentities,malformed,stale,forgedSave,forgedApproval,
  storageCalls,regionalTours:51,regionalStops:309,specimenGuides:9,specimenStops:73,
  glbs:146,clinicalApproval:false}));
