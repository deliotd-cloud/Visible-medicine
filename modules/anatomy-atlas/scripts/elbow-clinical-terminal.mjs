// Offline junction helper for the elbow-arterial-mri late-teaching
// config only. Generic replay and all frozen manifests remain unchanged.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import elbowPins from '../content/elbow-arterial-mri-pins.json' with {type:'json'};
import clinicalPins from '../content/elbow-clinical-pins.json' with {type:'json'};
import clinicalTransition from '../content/elbow-clinical.transition.json' with {type:'json'};
import authorRecords from './late-teaching-author-records.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const elbowPinsHash='5d1326609a97ea455aad2a9991bb21ff095284e9ccd7f86bfd4b1b60801c7399';
const clinicalPinsHash='971f7b3563a6042e54b36a17087ad5a0f40ea7f1a00612f03a081a8c3827f602';
const clinicalTransitionHash='da7862c118ee6e00ad290177f56b5162b4d343a9d825272374eefbe5b74e5cbe';
const authorRecordsHash='ab3291a9146d9c9dc47569fa62098b64366e2a4146158280e1068492983479c7';
const shown=lesson=>{const{readiness:_readiness,...content}=lesson;return content;};

function exactElbowClinicalTerminal(api,config,catalog){
 assert.equal(hash(elbowPins),elbowPinsHash,'Elbow MRI pins changed');
 assert.equal(hash(clinicalPins),clinicalPinsHash,'Elbow clinical pins changed');
 assert.equal(hash(clinicalTransition),clinicalTransitionHash,'Elbow clinical transition changed');
 assert.equal(hash(authorRecords),authorRecordsHash,'Late teaching author records changed');
 assert.equal(config.name,'elbow-arterial-mri','Wrong elbow junction');
 assert.equal(config.pinsHash,elbowPinsHash,'Foreign elbow MRI pin hash');
 assert.deepEqual(config.pins,elbowPins,'Foreign elbow MRI pins');
 assert.equal(config.helper,'elbowArterialMriLesson','Foreign elbow helper name');
 assert.equal(config.optionalHelper,true,'Foreign elbow helper policy');
 assert.equal(config.singleTab,'mri','Foreign elbow topic policy');
 const author=authorRecords.families.filter(f=>f.name==='elbow-arterial-mri');
 assert.equal(author.length,1,'One frozen elbow MRI author family');
 assert.equal(author[0].pinsHash,elbowPinsHash,'Elbow author pin binding');
 assert.equal(author[0].baseline,elbowPins.baseline,'Elbow author baseline');
 assert.equal(author[0].singleTab,'mri','Elbow author topic');
 assert.equal(author[0].currentHashes.length,20,'Twenty authored elbow MRI hashes');
 let index=0;
 const expectedTransition={baseline:author[0].baseline,sourcePinsHash:elbowPinsHash,authorCommit:author[0].authorCommit,
  entries:elbowPins.entries.map(e=>({id:e.identity.id,fmaId:e.identity.fmaId,tab:'mri',previousHash:hash(e.previous),currentHash:author[0].currentHashes[index++]}))};
 assert.equal(index,20,'Complete elbow MRI author order');
 assert.equal(config.transitionHash,hash(expectedTransition),'Foreign elbow author transition hash');
 assert.deepEqual(config.transition,expectedTransition,'Foreign elbow author transition');
 assert.equal(clinicalTransition.parentCommit,clinicalPins.sourceCommit,'Elbow clinical parent binding');
 const clinicalById=new Map();
 for(const e of clinicalPins.entries){
  assert(!clinicalById.has(e.identity.id),'Duplicate clinical identity');
  clinicalById.set(e.identity.id,e);
 }
 const clinicalRows=new Map();
 for(const row of clinicalTransition.entries){
  assert(!clinicalRows.has(row.id),'Duplicate clinical transition identity');
  clinicalRows.set(row.id,row);
 }
 assert.equal(elbowPins.entries.length,20,'Exact twenty elbow MRI pins');
 assert.equal(new Set(elbowPins.entries.map(e=>e.identity.id)).size,20,'Distinct elbow MRI identities');
 if(catalog!==undefined){
  const display=typeof api.bodyDisplayCatalog==='function'?api.bodyDisplayCatalog(catalog):catalog;
  assert(Array.isArray(display?.structures),'Elbow terminal requires source catalog');
  for(const e of elbowPins.entries){
   const matches=display.structures.filter(s=>s.id===e.identity.id);
   assert.equal(matches.length,1,'Missing or duplicate elbow source identity');
   assert.deepEqual(matches[0],e.identity,'Foreign elbow source identity');
  }
 }
 assert.equal(typeof api.bodyLesson,'function','Elbow terminal requires body lesson');
 assert.equal(typeof api.bodyContent,'function','Elbow terminal requires learner content');
 // The actual terminal call has no catalog. With no catalog, this verifies
 // frozen queried identities and lesson values, not independent source identity.
 // The actual terminal call has no optional helper. A newly supplied helper
 // is an unobserved contract, and generic replay retains its own validation.
 assert.equal(api.elbowArterialMriLesson,undefined,'Unobserved elbow terminal helper');
 let older=0,prior=0;
 for(let i=0;i<elbowPins.entries.length;i++){
  const e=elbowPins.entries[i],clinical=clinicalById.get(e.identity.id);
  let expected=e.previous;
  if(clinical?.previous?.mri){
   const row=clinicalRows.get(e.identity.id);
   assert(row,'Missing clinical overlap transition');
   assert.deepEqual(clinical.identity,e.identity,'Elbow MRI/clinical identity mismatch');
   assert.equal(row.sections.mri,hash(e.previous),'Elbow clinical current is MRI predecessor');
   expected=clinical.previous.mri;older++;
  }else prior++;
  assert(isDeepStrictEqual(api.bodyLesson(e.identity,'mri'),expected),'Foreign elbow terminal lesson');
  assert.deepEqual(api.bodyContent(e.identity,'mri'),shown(expected),'Foreign elbow terminal learner content');
 }
 assert.equal(older,14,'All fourteen frozen clinical overlaps');
 assert.equal(prior,6,'All six elbow MRI predecessors');
 return api;
}

export function replayElbowClinicalTerminal(api,config,catalog){
 if(config.name!=='elbow-arterial-mri')return replayPinnedTeaching(api,config,catalog);
 const first=elbowPins.entries.find(e=>clinicalPins.entries.some(c=>c.identity.id===e.identity.id));
 assert(first,'Frozen elbow clinical overlap missing');
 const older=clinicalPins.entries.find(e=>e.identity.id===first.identity.id).previous.mri;
 if(typeof api?.bodyLesson==='function'&&isDeepStrictEqual(api.bodyLesson(first.identity,'mri'),older))
  return exactElbowClinicalTerminal(api,config,catalog);
 return replayPinnedTeaching(api,config,catalog);
}
