// Offline editorial replay across saved epochs. No learner or clinical approval path.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeAbdominalOrganQuiz} from './abdominal-organ-quiz-history.mjs';
import {beforeLumbarDiscMri} from './lumbar-disc-mri-history.mjs';
import {preCoronaryArterialStudyProfiles} from './coronary-arterial-study-history.mjs';
import {beforeThoracicBoneQuiz} from './thoracic-bone-quiz-history.mjs';
import {beforeCranialBoneQuiz} from './cranial-bone-quiz-history.mjs';
import {beforeCerebellarMcaImaging} from './cerebellar-mca-imaging-history.mjs';
import {authoringBeforeFootSurfaceImaging} from './foot-surface-imaging-history.mjs';
import {lateTeachingConfigs,verifyLateAuthorRecords} from './late-teaching-epoch-history.mjs';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import {cubitalConfig,beforeCubitalVenousUltrasound} from './cubital-venous-ultrasound-history.mjs';
import cubitalEpoch from './cubital-venous-ultrasound-epoch.json' with {type:'json'};
import {hash as thoracicHash, snapshot as thoracicSnapshot} from './thoracic-bone-quiz-transition.mjs';
import {hash as cranialHash, snapshot as cranialSnapshot} from './cranial-bone-quiz-transition.mjs';
import abdominalPins from '../content/abdominal-organ-quiz-pins.json' with {type:'json'};
import thoracicPins from '../content/thoracic-bone-quiz-pins.json' with {type:'json'};
import thoracicTransition from '../content/thoracic-bone-quiz-transition.json' with {type:'json'};
import cranialPins from '../content/cranial-bone-quiz-pins.json' with {type:'json'};
import footPins from '../content/foot-surface-imaging-pins.json' with {type:'json'};
import hyoidPins from '../content/hyoid-epiglottis-ultrasound-pins.json' with {type:'json'};
import organPins from '../content/thoracoabdominal-organ-quiz-pins.json' with {type:'json'};
import cerebellarPins from '../content/cerebellar-mca-imaging-pins.json' with {type:'json'};

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {api,catalog} = await contentContext();
const display = api.bodyDisplayCatalog(catalog);
assert.equal(display.structures.length,1104);
assert.equal(api.contentTabs.length,9);
const original = {
  lessons: hash(display.structures.map(s => api.contentTabs.map(tab => api.bodyLesson(s,tab)))),
  structures: hash(api.structures), recipes: hash(api.dissectionProfiles), catalog: hash(display),
};
const byId = new Map(display.structures.map(s => [s.id,s]));
assert.equal(byId.size,1104);
for(const [name,pins] of Object.entries({abdominal:pinsOr(abdominalPins),thoracic:pinsOr(thoracicPins),cranial:pinsOr(cranialPins),foot:pinsOr(footPins),hyoid:pinsOr(hyoidPins),organs:pinsOr(organPins),cerebellar:pinsOr(cerebellarPins)})){
  for(const entry of pins.entries) assert.deepEqual(byId.get(entry.identity.id),entry.identity,`${name}:${entry.identity.id}:catalog identity`);
}
for(const config of [cubitalConfig,...lateTeachingConfigs])for(const entry of config.pins.entries)
  assert.deepEqual(byId.get(entry.identity.id),entry.identity,`${config.name}:${entry.identity.id}:catalog identity`);
function pinsOr(pins){assert(Array.isArray(pins.entries));return pins;}
const abdominalSnapshot = value => ({body:display.structures.map(s => ({id:s.id,sections:Object.fromEntries(value.contentTabs.map(tab => [tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
const footSnapshot = value => ({catalog:display,body:display.structures.map(s => ({id:s.id,topics:Object.fromEntries(value.contentTabs.map(tab => [tab,value.bodyLesson(s,tab)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});

// Verify the newly recovered four-topic cubital author epoch independently of
// the present source tree and of the later reversal chain.
assert.equal(cubitalEpoch.transition.authorCommit,'fa7dcf45efbad1dc908b02e6c699dcb02e6b3c06');
assert.equal(cubitalEpoch.pins.baseline,'5f1a0c86d76089a35c711caa951ade1a162a1dbf');
assert.equal(cubitalEpoch.transition.baseline,cubitalEpoch.pins.baseline);
assert.equal(cubitalEpoch.transition.sourcePinsHash,cubitalEpoch.pinsHash);
assert.equal(hash(cubitalEpoch.pins),cubitalEpoch.pinsHash);
assert.equal(hash(cubitalEpoch.transition),cubitalEpoch.transitionHash);
assert.deepEqual(cubitalConfig.pins,cubitalEpoch.pins);
assert.deepEqual(cubitalConfig.transition,cubitalEpoch.transition);
const cubitalParent=await exactSourceHistoryApi(cubitalEpoch.pins.baseline);
const cubitalAuthor=await exactSourceHistoryApi(cubitalEpoch.transition.authorCommit);
assert.deepEqual(cubitalParent.bodyDisplayCatalog(catalog),display);
assert.deepEqual(cubitalAuthor.bodyDisplayCatalog(catalog),display);
assert.deepEqual(cubitalAuthor.structures,cubitalParent.structures);
assert.deepEqual(cubitalAuthor.dissectionProfiles,cubitalParent.dissectionProfiles);
let cubitalChanged=0,cubitalPreserved=0;
const cubitalRecords=new Map(cubitalEpoch.transition.entries.map(record=>[`${record.id}|ultrasound`,record]));
const cubitalPins=new Map(cubitalEpoch.pins.entries.map(entry=>[entry.identity.id,entry]));
assert.equal(cubitalRecords.size,4);
assert.equal(cubitalPins.size,4);
for(const structure of display.structures)for(const tab of api.contentTabs){
  const previous=cubitalParent.bodyLesson(structure,tab),authored=cubitalAuthor.bodyLesson(structure,tab);
  const recorded=cubitalRecords.get(`${structure.id}|${tab}`);
  if(recorded){
    const pin=cubitalPins.get(structure.id);assert(pin);
    assert.deepEqual(structure,pin.identity);
    assert.deepEqual(previous,pin.previous);
    assert.equal(recorded.fmaId,structure.fmaId);
    assert.equal(hash(authored),recorded.draftHash);
    assert.notDeepEqual(authored,previous);
    cubitalChanged++;
  }else{assert.deepEqual(authored,previous,`${structure.id}:${tab}:cubital prior`);cubitalPreserved++;}
}
assert.equal(cubitalChanged,4);
assert.equal(cubitalPreserved,9932);
assert.equal(cubitalEpoch.verifiedChanged,cubitalChanged);
assert.equal(cubitalEpoch.verifiedUnchanged,cubitalPreserved);
const cubitalReplayed=beforeCubitalVenousUltrasound(cubitalAuthor,catalog);
assert.deepEqual(abdominalSnapshot(cubitalReplayed),abdominalSnapshot(cubitalParent));

if(process.argv.includes('--analyze-counts') || process.argv.includes('--analyze-full')){
  const epochs=[['abdominal',abdominalPins.parentCommit],['thoracic',thoracicPins.parentCommit],['foot',footPins.baseline]];
  const results=[];
  for(const [name,commit] of epochs){
    const parent=await exactSourceHistoryApi(commit);
    const changes=[];
    for(const structure of display.structures)for(const tab of api.contentTabs){
      const current=api.bodyLesson(structure,tab),previous=parent.bodyLesson(structure,tab);
      if(hash(current)!==hash(previous))changes.push({id:structure.id,tab,currentHash:hash(current),previousHash:hash(previous)});
    }
    results.push({epoch:name,commit,catalogHash:hash(parent.bodyDisplayCatalog(catalog)),structuresHash:hash(parent.structures),recipesHash:hash(parent.dissectionProfiles),changedPlacements:changes.length,countsByTab:Object.fromEntries(api.contentTabs.map(tab=>[tab,changes.filter(row=>row.tab===tab).length])),changesSha256:hash(changes),...(process.argv.includes('--analyze-full')?{changedIdentityTabs:changes.map(row=>[row.id,row.tab])}:{})});
  }
  console.log(JSON.stringify({currentCatalogHash:original.catalog,currentStructuresHash:original.structures,currentRecipesHash:original.recipes,results},null,2));
  process.exit(0);
}

// The actual current API is the input to every reversal; historical Git is an
// independently loaded expected epoch, never the substitute for a reversal.
const abdominalParent = await exactSourceHistoryApi(abdominalPins.parentCommit);
const beforeLateLumbarAndCoronary = value => {
  const noLumbar=beforeLumbarDiscMri(value,catalog);
  return {...noLumbar,dissectionProfiles:preCoronaryArterialStudyProfiles(noLumbar.dissectionProfiles)};
};
const beforeLateStudies=beforeLateLumbarAndCoronary(api);
const abdominal = beforeAbdominalOrganQuiz(beforeLateStudies);
assert.deepEqual(display,abdominalParent.bodyDisplayCatalog(catalog));
assert.equal(hash(abdominalSnapshot(abdominal)),abdominalPins.previousAllLessonsAndRecipesHash);
assert.deepEqual(abdominalSnapshot(abdominal),abdominalSnapshot(abdominalParent));
assert.equal(beforeAbdominalOrganQuiz(abdominal),abdominal);

const thoracic = beforeThoracicBoneQuiz(beforeLateStudies,display);
assert.equal(thoracicHash(thoracicSnapshot(thoracic,display)),thoracicPins.previousAllLessonsAndRecipesHash);
assert.equal(thoracicPins.previousAllLessonsAndRecipesHash,thoracicTransition.previousAllLessonsAndRecipesHash);
assert.equal(thoracicTransition.pinsHash,thoracicHash(thoracicPins));
const thoracicTargets = new Map(thoracicPins.entries.map(entry => [entry.identity.id,entry]));
assert.equal(thoracicTargets.size,27);
const actualThoracicEpoch = {...thoracic,bodyLesson(s,tab){
  const entry = tab==='quiz' && thoracicTargets.get(s.id);
  if(!entry) return thoracic.bodyLesson(s,tab);
  assert.deepEqual(s,entry.identity);
  return api.bodyLesson(s,tab);
}};
assert.equal(thoracicHash(thoracicSnapshot(actualThoracicEpoch,display)),thoracicTransition.currentAllLessonsAndRecipesHash);
assert.equal(beforeThoracicBoneQuiz(thoracic,display),thoracic);

const cranialParent=await exactSourceHistoryApi(cranialPins.parentCommit);
const cranial=beforeCranialBoneQuiz(beforeLateStudies,display);
assert.deepEqual(display,cranialParent.bodyDisplayCatalog(catalog));
assert.equal(cranialHash(cranialSnapshot(cranial,display)),cranialPins.previousAllLessonsAndRecipesHash);
assert.deepEqual(cranialSnapshot(cranial,display),cranialSnapshot(cranialParent,display));
assert.equal(beforeCranialBoneQuiz(cranial,display),cranial);

const foot = authoringBeforeFootSurfaceImaging({api:beforeLateStudies,catalog});
assert.equal(hash(footSnapshot(foot)),footPins.beforeAllTeachingSnapshotHash);
assert.equal(authoringBeforeFootSurfaceImaging({api:foot,catalog}),foot);
for(const entry of hyoidPins.entries)assert.deepEqual(foot.bodyLesson(entry.identity,'ultrasound'),api.bodyLesson(entry.identity,'ultrasound'),'Foot epoch retains the prior hyoid Ultrasound drafts');
for(const entry of footPins.entries)for(const [tab,prior] of Object.entries(entry.previous)){
  assert.deepEqual(foot.bodyLesson(entry.identity,tab),prior);
  assert.notDeepEqual(api.bodyLesson(entry.identity,tab),prior);
}

// Each replay chain must reject a partially reversed or foreign hyoid epoch.
const [first,second] = hyoidPins.entries;
assert(first && second && first.identity.id !== second.identity.id);
const altered = mode => {
  const changed = {...api,bodyLesson(s,tab){
    const lesson = api.bodyLesson(s,tab);
    if(s.id !== first.identity.id || tab !== 'ultrasound') return lesson;
    return mode==='mixed' ? structuredClone(first.previous) : {...lesson,body:'Foreign hyoid teaching'};
  }};
  changed.bodyContent = (s,tab) => {const {readiness,...shown}=changed.bodyLesson(s,tab);return shown;};
  assert.deepEqual(changed.bodyLesson(second.identity,'ultrasound'),api.bodyLesson(second.identity,'ultrasound'));
  return changed;
};
const chains = {
  abdominal: value => beforeAbdominalOrganQuiz(beforeLateLumbarAndCoronary(value)),
  thoracic: value => beforeThoracicBoneQuiz(beforeLateLumbarAndCoronary(value),display),
  cerebellar: value => beforeCerebellarMcaImaging(beforeLateLumbarAndCoronary(value),display),
};
let refused=0;
for(const [name,chain] of Object.entries(chains))for(const mode of ['mixed','foreign']){
  assert.throws(() => chain(altered(mode)),/Mixed|Unrecorded|foreign/i,`${name}:${mode}:hyoid refusal`);
  refused++;
}
const unrelated = display.structures.find(s => ![...abdominalPins.entries,...thoracicPins.entries,...cranialPins.entries,...footPins.entries,...hyoidPins.entries,...organPins.entries,...cerebellarPins.entries].some(e => e.identity.id===s.id));
assert(unrelated);
const withForeignAnatomy = base => {
  const foreign={...base,bodyLesson(s,tab){
    const lesson=base.bodyLesson(s,tab);
    return s.id===unrelated.id&&tab==='anatomy'?{...lesson,body:'Foreign unrelated anatomy'}:lesson;
  }};
  foreign.bodyContent=(s,tab)=>{const {readiness,...shown}=foreign.bodyLesson(s,tab);return shown;};
  return foreign;
};
const foreignAnatomy=withForeignAnatomy(api);
assert.throws(() => beforeThoracicBoneQuiz(beforeLateLumbarAndCoronary(foreignAnatomy),display),/Unrecorded|snapshot|baseline/i);
assert.throws(() => beforeThoracicBoneQuiz(beforeLateLumbarAndCoronary(withForeignAnatomy(thoracic)),display),/Unrecorded|snapshot|baseline|foreign/i,'All-prior thoracic state cannot hide unrelated anatomy');
assert.throws(() => beforeCranialBoneQuiz(beforeLateLumbarAndCoronary(withForeignAnatomy(cranial)),display),/Unrecorded|snapshot|baseline|foreign/i,'All-prior cranial state cannot hide unrelated anatomy');
assert.throws(() => authoringBeforeFootSurfaceImaging({api:beforeLateLumbarAndCoronary(withForeignAnatomy(foot)),catalog}),/Unrecorded|snapshot|baseline|foreign/i,'All-prior foot state cannot hide unrelated anatomy');
assert.throws(() => {const replay=beforeAbdominalOrganQuiz(beforeLateLumbarAndCoronary(foreignAnatomy));assert.equal(hash(abdominalSnapshot(replay)),abdominalPins.previousAllLessonsAndRecipesHash);},/AssertionError/);
assert.throws(() => {const replay=authoringBeforeFootSurfaceImaging({api:beforeLateLumbarAndCoronary(foreignAnatomy),catalog});assert.equal(hash(footSnapshot(replay)),footPins.beforeAllTeachingSnapshotHash);},/AssertionError/);
for(const mode of ['mixed','foreign'])assert.throws(() => {const replay=authoringBeforeFootSurfaceImaging({api:beforeLateLumbarAndCoronary(altered(mode)),catalog});assert.equal(hash(footSnapshot(replay)),footPins.beforeAllTeachingSnapshotHash);},/AssertionError|Mixed|Unrecorded/i,`foot:${mode}:whole epoch`);

// A named draft helper must be checked even when the current compiled API does
// not export it: adding a malformed or forged property cannot bypass the pin.
const named=lateTeachingConfigs.filter(config=>config.helper!==undefined);
const exported=named.filter(config=>typeof api[config.helper]==='function');
const absent=named.filter(config=>api[config.helper]===undefined);
assert(named.length>0 && exported.length>0 && absent.length>0,'Named and optional draft-helper cases required');
let helperRefusals=0;
for(const config of named){
  const pinned=new Map();
  for(const entry of config.pins.entries){
    const previous=config.singleTab?{[config.singleTab]:entry.previous}:entry.previous;
    for(const [tab,lesson] of Object.entries(previous))pinned.set(`${entry.identity.id}|${tab}`,{identity:entry.identity,lesson});
  }
  const priorApi={...api,bodyLesson(s,tab){
    const entry=pinned.get(`${s.id}|${tab}`);
    if(!entry)return api.bodyLesson(s,tab);
    assert.deepEqual(s,entry.identity);
    return structuredClone(entry.lesson);
  }};
  priorApi.bodyContent=(s,tab)=>{const {readiness,...shown}=priorApi.bodyLesson(s,tab);return shown;};
  assert.throws(()=>replayPinnedTeaching({...priorApi,[config.helper]:'malformed'},config,catalog),/invalid draft helper/i,`${config.name}:malformed named helper`);
  assert.throws(()=>replayPinnedTeaching({...priorApi,[config.helper](){return {readiness:'draft',body:'Forged helper'};}},config,catalog),/foreign draft helper/i,`${config.name}:forged named helper`);
  helperRefusals+=2;
}
for(const [name,chain] of Object.entries({foot:value=>authoringBeforeFootSurfaceImaging({api:beforeLateLumbarAndCoronary(value),catalog}),thoracic:value=>beforeThoracicBoneQuiz(beforeLateLumbarAndCoronary(value),display)})){
  const config=lateTeachingConfigs.slice(0,5).find(item=>typeof api[item.helper]==='function');
  assert(config,`${name}:exported helper in active replay chain`);
  assert.throws(()=>chain({...api,[config.helper](){return {readiness:'draft',body:'Forged chain helper'};}}),/foreign draft helper/i,`${name}:exported helper chain refusal`);
}
for(const [name,{state,chain}] of Object.entries({foot:{state:foot,chain:value=>authoringBeforeFootSurfaceImaging({api:beforeLateLumbarAndCoronary(value),catalog})},thoracic:{state:thoracic,chain:value=>beforeThoracicBoneQuiz(beforeLateLumbarAndCoronary(value),display)}})){
  const config=lateTeachingConfigs.slice(0,5).find(item=>typeof state[item.helper]==='function');
  assert(config,`${name}:terminal exported helper`);
  assert.throws(()=>chain({...state,[config.helper]:'malformed'}),/invalid draft helper/i,`${name}:all-prior malformed helper refusal`);
  assert.throws(()=>chain({...state,[config.helper](){return {readiness:'draft',body:'Forged terminal helper'};}}),/foreign draft helper/i,`${name}:all-prior forged helper refusal`);
}
const authorRecords=await verifyLateAuthorRecords();
assert.deepEqual(authorRecords,{authorEpochs:6,checkedPlacements:86});
assert.deepEqual({lessons:hash(display.structures.map(s => api.contentTabs.map(tab => api.bodyLesson(s,tab)))),structures:hash(api.structures),recipes:hash(api.dissectionProfiles),catalog:hash(api.bodyDisplayCatalog(catalog))},original);
console.log(JSON.stringify({abdominalParent:abdominalPins.parentCommit,thoracicParent:thoracicPins.parentCommit,cranialParent:cranialPins.parentCommit,footBaseline:footPins.baseline,cubitalAuthor:cubitalEpoch.transition.authorCommit,catalogIdentitiesBound:true,abdominalPreviousSnapshotExact:true,thoracicCurrentAndPreviousSnapshotsExact:true,cranialPreviousSnapshotExact:true,footWholeBaselineExact:true,cubitalChanged,cubitalPreserved,hyoidMixedAndForeignRefused:refused,helperRefusals,authorRecords,rawCurrentUnchanged:true,clinicalApproval:false}));
