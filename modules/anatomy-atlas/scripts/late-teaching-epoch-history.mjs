// Explicit frozen post-epoch teaching changes; test-only, never learner dispatch.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import {replayFootFollowupToeTerminal} from './foot-toe-terminal-history.mjs';
import {replayElbowClinicalTerminal} from './elbow-clinical-terminal.mjs';
import {replayGenicularClinicalTerminal} from './genicular-clinical-terminal.mjs';
import {beforeThoracoabdominalOrganQuiz} from './thoracoabdominal-organ-quiz-history.mjs';
import {beforeHyoidEpiglottisUltrasound} from './hyoid-epiglottis-ultrasound-history.mjs';
import {beforeDescendingAortaUltrasound} from './descending-aorta-ultrasound-history.mjs';
import records from './late-teaching-author-records.json' with {type:'json'};
import hyoidPins from '../content/hyoid-epiglottis-ultrasound-pins.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(hash(records),'ab3291a9146d9c9dc47569fa62098b64366e2a4146158280e1068492983479c7');
const fixed=[
  {"name":"shoulder-girdle-arterial-ultrasound","pinPath":"shoulder-girdle-arterial-ultrasound-pins.json","pinsHash":"2edc421ca9a85878625dc607e990d1136fbb4be63609c62ba565161ffa09e56d","transitionPath":"shoulder-girdle-arterial-ultrasound.transition.json","transitionHash":"f8718d1d4428a8301a83bc0332c7e007c646dc579ea98354969c987d5eafd20f"},
  {"name":"foot-ultrasound-followup","pinPath":"foot-ultrasound-followup-pins.json","pinsHash":"87df5b06e49b9f5fa28dcaf226fd582fa5e9f7eb8b80a40301190906a811a48d","transitionPath":"foot-ultrasound-followup.transition.json","transitionHash":"f0bf6ae655f55e959dd0a4ff38269232dccc7a6c32d0cbbc2369f9cdd88fe193"},
  {"name":"toe-bone-ultrasound","pinPath":"toe-bone-ultrasound-pins.json","pinsHash":"3821c623cf0e31b608ca2ac69f2b124a150beb27312675822e50dee1771f6f5e","transitionPath":"toe-bone-ultrasound.transition.json","transitionHash":"6907c1135c75364776c5bf18920de3b66d1f546b5bdc0a0e85aa253189fa449b"},
  {"name":"wrist-imaging-correction","pinPath":"wrist-imaging-correction-pins.json","pinsHash":"15dfbad1c4484cfb90962ee158c2f12fd113f73edbd2ddb6999f79708668f343","transitionPath":"wrist-imaging-correction.transition.json","transitionHash":"74b600dd3a73ac6258c026289fe629f41b16956295a8a73f2d2775867f51abd7"},
  {"name":"hand-bone-ultrasound","pinPath":"hand-bone-ultrasound-pins.json","pinsHash":"58673652a31c3a58f26c538901b52b883f544d6ef71be775ae703ed3e2ec96a9","transitionPath":"hand-bone-ultrasound.transition.json","transitionHash":"927670e57058bd96b35e0341bd9182e7774e070496aff0f5b89e082d41035c90"},
  {"name":"foot-surface-imaging","pinPath":"foot-surface-imaging-pins.json","pinsHash":"8dddeb76bd3578bc9c8494ffed9c0d580ebd1ff2c1e11ad6b76f77932f2fda85","transitionPath":"foot-surface-imaging.transition.json","transitionHash":"06521330390060e0b65b6a101ebf58b26183cc1b8d11db3751eacd27ac136bee"},
  {"name":"deep-brain-core-teaching","pinPath":"deep-brain-core-teaching-pins.json","pinsHash":"9a054a45f4fc1237c806bcaed6c8df54386d74a06dc78cddb5fcd25fa70ce0ef","transitionPath":"deep-brain-core-teaching.transition.json","transitionHash":"b44acdd2394354a6ded078668937a188309dc3d10e78eedd6a90818c01ee41c0"},
  {"name":"suprascapular-vessel-ultrasound","pinPath":"suprascapular-vessel-ultrasound-pins.json","pinsHash":"0ed9e6ba9dabbbad9079639a7ecc23cc203d6c25a78b3b8d11045804498c6389","transitionPath":"suprascapular-vessel-ultrasound.transition.json","transitionHash":"65fe8cb39b7482ae350114ee5ab09332edc6ddaa50f9d4a45d0fe1285ecd31e8"},
  {"name":"cranial-bone-xray","pinPath":"cranial-bone-xray-pins.json","pinsHash":"5497466123cc60d6542f4db556d118f00749ad8558f907d15b60e5861a420423","transitionPath":"cranial-bone-xray.transition.json","transitionHash":"4a20f41c45ad22b41a11410913bde6ed70196c2a7967b2418dd529b76faae9f9"},
  {"name":"spinal-bone-ultrasound","pinPath":"spinal-bone-ultrasound-pins.json","pinsHash":"a958dc03a405bed6325c570f922b585f1b59d2999aca44f6fb59cbbe20ac339a","transitionPath":"spinal-bone-ultrasound.transition.json","transitionHash":"8b071585a7958a0a64c7598d3ecd7207f788042334755bac22ff66255493cf2b"},
  {"name":"plantar-arterial-mri","pinPath":"plantar-arterial-mri-pins.json","pinsHash":"cfcaac115264ed6a503e172fe42c780334dd346990d90fe551bb916eadac182b"},
  {"name":"shoulder-arterial-imaging","pinPath":"shoulder-arterial-imaging-pins.json","pinsHash":"a9b1f3061a8da68441bf1a74de5fb71b3733717ec5aed69bde5e8e33fc099942"},
  {"name":"elbow-arterial-mri","pinPath":"elbow-arterial-mri-pins.json","pinsHash":"5d1326609a97ea455aad2a9991bb21ff095284e9ccd7f86bfd4b1b60801c7399"},
  {"name":"genicular-mri","pinPath":"genicular-mri-pins.json","pinsHash":"6f82e3f9a990a8c099c85b975691e9743a10036657a87945b365f63039dd64dc"},
  {"name":"hand-venous-imaging","pinPath":"hand-venous-imaging-pins.json","pinsHash":"df85b6c36c6109158ca1356c8e2c6202bbc9ff4203751f6a14ee111df3e37337"},
  {"name":"glottic-muscle-imaging","pinPath":"glottic-muscle-imaging-pins.json","pinsHash":"7ae6b72bf0513435b40d78820d7a408ce59835cee05f01ca09668cebf13ae5ff"},
  {"name":"hand-arterial-ultrasound","pinPath":"hand-arterial-ultrasound-pins.json","pinsHash":"db442edf449e00d45221ad819360b7ca6fbfe551df485bd4d0df0b7a561b170b","transitionPath":"hand-arterial-ultrasound-transition.json","transitionHash":"dfa9bb0056622b38883c27edde9c1ff37ef9293836fa5415482807749fdde517"},
  {"name":"hand-arterial-ct","pinPath":"hand-arterial-ct-pins.json","pinsHash":"002692ffff5f4289ca5f078ad7e18734e517a5cdf2bf891ac99e1fa4aa488223","transitionPath":"hand-arterial-ct-transition.json","transitionHash":"27f6c0e82aabd2854d41f9566593499f3a905e91f1dc7bc95c1b3024d8ae61ef"},
  {"name":"tarsal-bone-quiz","pinPath":"tarsal-bone-quiz-pins.json","pinsHash":"73a6cc4e9f002faa2ad14704e67a22b7912514eb13e1dac08d0b7dc599192ce4","transitionPath":"tarsal-bone-quiz-transition.json","transitionHash":"80c1b0b8d77ba9eb99e4eeeb2c873a8757b982b61c3b78952d4c0259f89b56c9"},
  {"name":"thoracoabdominal-orientation","pinPath":"thoracoabdominal-orientation-pins.json","pinsHash":"79d77062dcb4edc4b3f0633b569a7148657a04e8c10653bd0ffe734a359fcfa6","transitionPath":"thoracoabdominal-orientation-transition.json","transitionHash":"e28a43290bc57dc97d6acc05632200458b14d18e7444f231a6f5762900ad01dd"},
  {"name":"shoulder-girdle-imaging","pinPath":"shoulder-girdle-imaging-pins.json","pinsHash":"f93a2d2efebd7619547c54f177a6046d8580ca36795818f006ce2ecc1cf2faa6","transitionPath":"shoulder-girdle-imaging-transition.json","transitionHash":"2885a8033e40272188bc36f7418840b79485b6719ed7057e11d95af257d47d65"},
  {"name":"abdominal-vascular-mri","pinPath":"abdominal-vascular-mri-pins.json","pinsHash":"40b5d68a52b2e7b2bc7c61be943c626318838ac2655231fa3a43c16f4b072367","transitionPath":"abdominal-vascular-mri-transition.json","transitionHash":"54561201add95e72c2a5d3385c8a758e4f81d8923f2ea28670b7a5b154293916"},
  {"name":"colic-arterial-mri","pinPath":"colic-arterial-mri-pins.json","pinsHash":"4bb38246d0454cd6705dd953aa2fdfdb2a2a396b922ec5d20b176ca3e3d035ad","transitionPath":"colic-arterial-mri-transition.json","transitionHash":"26676260176d0b5f0761c8218194b2d4a981b18efc11bb61aefb962ed321a7be"},
  {"name":"interosseous-membrane-projection","pinPath":"interosseous-membrane-projection-pins.json","pinsHash":"28ac5dd4dfc7b7a47d67815bc3a893e9bfb2be25b82310b9b58e1c62c73d33b8","transitionPath":"interosseous-membrane-projection-transition.json","transitionHash":"c1b9315bd75943488eaf7764d6ecf123dbbf5627d573011779e4ef284cf9debf"},
];
const singleTabs=new Map([
 ['shoulder-girdle-arterial-ultrasound','ultrasound'],
 ['suprascapular-vessel-ultrasound','ultrasound'],['cranial-bone-xray','xray'],
 ['spinal-bone-ultrasound','ultrasound'],['plantar-arterial-mri','mri'],
 ['elbow-arterial-mri','mri'],['genicular-mri','mri'],
]);
const helperNames=[
 'shoulderGirdleArterialUltrasoundLesson','footUltrasoundFollowupLesson',
 'toeBoneUltrasoundLesson','wristImagingLesson','handBoneUltrasoundLesson',
 'footSurfaceImagingLesson','deepBrainCoreLesson','suprascapularVesselUltrasoundLesson',
 'cranialBoneXrayLesson','spinalBoneUltrasoundLesson','plantarArterialMriLesson',
 'shoulderArterialImagingLesson','elbowArterialMriLesson','genicularMriLesson',
 'handVenousImagingLesson','glotticMuscleImagingLesson','handArterialUltrasoundLesson',
 'handArterialCtLesson','tarsalBoneQuizLesson','thoracoabdominalOrientationLesson',
 'shoulderGirdleImagingLesson','abdominalVascularMriLesson','colicArterialMriLesson',
 'interosseousMembraneProjectionLesson',
];
assert.equal(helperNames.length,fixed.length);
const read=name=>JSON.parse(readFileSync(new URL('../content/'+name,import.meta.url),'utf8'));
export const lateTeachingConfigs=fixed.map((meta,familyIndex)=>{
 const pins=read(meta.pinPath);assert.equal(hash(pins),meta.pinsHash);
 let transition,transitionHash;
 if(meta.transitionPath){transition=read(meta.transitionPath);transitionHash=meta.transitionHash;}
 else{
  const family=records.families.find(f=>f.name===meta.name);assert(family);
  assert.equal(family.pinsHash,meta.pinsHash);assert.equal(family.baseline,pins.baseline||pins.parentCommit);
  assert.equal(family.singleTab,singleTabs.get(meta.name));
  let index=0;
  transition={baseline:family.baseline,sourcePinsHash:family.pinsHash,authorCommit:family.authorCommit,entries:pins.entries.flatMap(e=>{
   const previous=family.singleTab?{[family.singleTab]:e.previous}:e.previous;
   return Object.entries(previous).map(([tab,lesson])=>({id:e.identity.id,fmaId:e.identity.fmaId,tab,previousHash:hash(lesson),currentHash:family.currentHashes[index++]}));
  })};
  assert.equal(index,family.currentHashes.length);transitionHash=hash(transition);
 }
 return {name:meta.name,pins,transition,pinsHash:meta.pinsHash,transitionHash,
  helper:helperNames[familyIndex],optionalHelper:true,
  ...(singleTabs.has(meta.name)?{singleTab:singleTabs.get(meta.name)}:{})};
});
assert.equal(lateTeachingConfigs.length,24);
assert.equal(new Set(lateTeachingConfigs.map(c=>c.name)).size,24);
const replay=(input,configs,catalog)=>{
 if(typeof input.bodyLesson!=='function')return input;
 let api=beforeThoracoabdominalOrganQuiz(input);
 for(const config of configs)api=config.name==='foot-ultrasound-followup'
  ?replayFootFollowupToeTerminal(api,config,catalog):config.name==='elbow-arterial-mri'
  ?replayElbowClinicalTerminal(api,config,catalog):config.name==='genicular-mri'
  ?replayGenicularClinicalTerminal(api,config,catalog):replayPinnedTeaching(api,config,catalog);
 return api;
};
// A complete older sequence can precede a newer correction's immediate parent
// (the four hallux notes precede both the note correction and toe US authoring).
// Recognize only the entire frozen terminal footprint, never partial mixtures
// or an untrusted marker. The calling epoch keeps its immutable global hash.
function finalPrevious(api,configs,catalog,includeHyoid=false){
 const footprint=new Map();
 for(const config of configs){
  assert.equal(hash(config.pins),config.pinsHash);assert.equal(hash(config.transition),config.transitionHash);
  for(const e of config.pins.entries){
   const previous=config.singleTab?{[config.singleTab]:e.previous}:e.previous;
   for(const[tab,lesson]of Object.entries(previous))footprint.set(JSON.stringify([e.identity.id,tab]),{identity:e.identity,tab,lesson});
  }
 }
 if(includeHyoid){
  assert.equal(hash(hyoidPins),'ea6399502b197a1a7aec1646d0808d74b0e207dbf69134fb74371ac915a9443b');
  for(const e of hyoidPins.entries)footprint.set(JSON.stringify([e.identity.id,'ultrasound']),{identity:e.identity,tab:'ultrasound',lesson:e.previous});
 }
 if(catalog!==undefined){
  const display=api.bodyDisplayCatalog(catalog),identities=new Map();
  for(const s of display.structures){assert(!identities.has(s.id));identities.set(s.id,s);}
  for(const{identity}of footprint.values())assert.deepEqual(identities.get(identity.id),identity,'Unrecorded late epoch source identity');
 }
 for(const{identity,tab,lesson}of footprint.values()){
  if(!isDeepStrictEqual(api.bodyLesson(identity,tab),lesson))return false;
  if(typeof api.bodyContent==='function'){const{readiness,...shown}=lesson;assert.deepEqual(api.bodyContent(identity,tab),shown,'Unrecorded late epoch body content');}
 }
 // A terminal sequence must not conceal a malformed/forged exported draft
 // helper. Real Git display APIs omit these exports; absent is explicit.
 for(const config of configs){
  const helper=api[config.helper];
  assert(helper===undefined||typeof helper==='function',`${config.name}: invalid draft helper`);
  if(helper===undefined)continue;
  const identities=new Map(config.pins.entries.map(e=>[e.identity.id,e.identity]));
  for(const row of config.transition.entries){
   const pairs=row.sections===undefined?[[row.tab??config.singleTab,row]]:Object.entries(row.sections);
   for(const[tab,value]of pairs){
    const currentHash=typeof value==='string'?value:value.currentHash??value.draftHash;
    const lesson=helper(identities.get(row.id),tab);
    assert(lesson&&typeof lesson==='object',`${config.name}: foreign draft helper`);
    assert.equal(hash(lesson),currentHash,`${config.name}: foreign draft helper`);
   }
  }
 }
 return true;
}
/** The foot baseline already contains hyoid, cranial X-ray and deep-brain drafts. */
export function beforeFootSurfaceEpoch(input,catalog){
 input=beforeDescendingAortaUltrasound(input,catalog);
 assert.equal(lateTeachingConfigs[5].name,'foot-surface-imaging');
 if(typeof input.bodyLesson==='function'&&finalPrevious(input,lateTeachingConfigs.slice(0,5),catalog))return beforeThoracoabdominalOrganQuiz(input);
 return replay(input,lateTeachingConfigs.slice(0,5),catalog);
}
/** Later changes only: leave the 27 thoracic Quiz drafts for their own adapter. */
export function beforeThoracicBoneEpoch(input,catalog){
 input=beforeDescendingAortaUltrasound(input,catalog);
 if(typeof input.bodyLesson!=='function')return input;
 if(finalPrevious(input,lateTeachingConfigs,catalog,true))return beforeThoracoabdominalOrganQuiz(beforeHyoidEpiglottisUltrasound(input));
 const newest=replay(input,lateTeachingConfigs.slice(0,9),catalog);
 const preHyoid=beforeHyoidEpiglottisUltrasound(newest);
 return replay(preHyoid,lateTeachingConfigs.slice(9),catalog);
}
/** Independent Git readback of the six author epochs without old transitions. */
export async function verifyLateAuthorRecords(){
 const {exactSourceHistoryApi}=await import('./exact-source-history-api.mjs');
 let checked=0;
 for(const family of records.families){
  const config=lateTeachingConfigs.find(c=>c.name===family.name);assert(config);
  const authored=await exactSourceHistoryApi(family.authorCommit);
  const previous=await exactSourceHistoryApi(family.baseline);
  let index=0;
  for(const entry of config.pins.entries){
   const topics=family.singleTab?{[family.singleTab]:entry.previous}:entry.previous;
   for(const[tab,lesson]of Object.entries(topics)){
    assert(isDeepStrictEqual(previous.bodyLesson(entry.identity,tab),lesson));
    assert.equal(hash(authored.bodyLesson(entry.identity,tab)),family.currentHashes[index++]);checked++;
   }
  }
  assert.equal(index,family.currentHashes.length);
 }
 assert.equal(checked,86);return {authorEpochs:6,checkedPlacements:checked};
}
