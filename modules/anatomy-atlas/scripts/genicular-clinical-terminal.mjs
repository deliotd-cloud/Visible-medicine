// Offline validation: exact observed genicular Clinical predecessor junction.
// Never import this reconstruction into learner dispatch.
// Generic replay, original pins and author records remain unchanged.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import mriPins from '../content/genicular-mri-pins.json' with {type:'json'};
import clinicalPins from '../content/genicular-clinical-pins.json' with {type:'json'};
import clinicalTransition from '../content/genicular-clinical.transition.json' with {type:'json'};
import authorRecords from './late-teaching-author-records.json' with {type:'json'};

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const mriPinsHash='6f82e3f9a990a8c099c85b975691e9743a10036657a87945b365f63039dd64dc';
const clinicalPinsHash='fc4c3f1e0d6fe05502fc54f6e1b041c512187fb40e7c743edddfd6127906071a';
const clinicalTransitionHash='00c588678ac0103f4320a4ecadf93a49b08e51edc29ba90f07cf816ddd8f940d';
const authorRecordsHash='ab3291a9146d9c9dc47569fa62098b64366e2a4146158280e1068492983479c7';
const shown=lesson=>{const{readiness:_readiness,...content}=lesson;return content;};

function exactGenicularClinicalTerminal(api,config,catalog){
 assert.equal(hash(mriPins),mriPinsHash,'Genicular MRI pins changed');
 assert.equal(hash(clinicalPins),clinicalPinsHash,'Genicular clinical pins changed');
 assert.equal(hash(clinicalTransition),clinicalTransitionHash,'Genicular clinical transition changed');
 assert.equal(hash(authorRecords),authorRecordsHash,'Late teaching author records changed');
 assert.equal(config.name,'genicular-mri','Wrong genicular junction');
 assert.equal(config.pinsHash,mriPinsHash,'Foreign genicular MRI pin hash');
 assert.deepEqual(config.pins,mriPins,'Foreign genicular MRI pins');
 assert.equal(config.helper,'genicularMriLesson','Foreign genicular helper name');
 assert.equal(config.optionalHelper,true,'Foreign genicular helper policy');
 assert.equal(config.singleTab,'mri','Foreign genicular topic policy');
 const author=authorRecords.families.filter(f=>f.name==='genicular-mri');
 assert.equal(author.length,1,'One frozen genicular MRI author family');
 assert.equal(author[0].pinsHash,mriPinsHash,'Genicular author pin binding');
 assert.equal(author[0].baseline,mriPins.baseline,'Genicular author baseline');
 assert.equal(author[0].singleTab,'mri','Genicular author topic');
 assert.equal(author[0].currentHashes.length,8,'Eight authored genicular MRI hashes');
 assert.equal(mriPins.entries.length,8,'Exact eight genicular MRI pins');
 assert.equal(new Set(mriPins.entries.map(e=>e.identity.id)).size,8,'Distinct genicular MRI identities');
 const expectedTransition={
  baseline:author[0].baseline,sourcePinsHash:mriPinsHash,authorCommit:author[0].authorCommit,
  entries:mriPins.entries.map((e,i)=>({id:e.identity.id,fmaId:e.identity.fmaId,tab:'mri',
   previousHash:hash(e.previous),currentHash:author[0].currentHashes[i]})),
 };
 assert.equal(config.transitionHash,hash(expectedTransition),'Foreign genicular author transition hash');
 assert.deepEqual(config.transition,expectedTransition,'Foreign genicular author transition');
 assert.equal(clinicalPins.entries.length,10,'Exact ten clinical pin identities');
 assert.equal(clinicalTransition.entries.length,10,'Exact ten clinical transition identities');
 assert.equal(clinicalTransition.parentCommit,clinicalPins.sourceCommit,'Genicular clinical parent binding');
 const clinicalById=new Map(),clinicalRows=new Map();
 for(const e of clinicalPins.entries){
  assert(!clinicalById.has(e.identity.id),'Duplicate genicular clinical identity');
  clinicalById.set(e.identity.id,e);
 }
 for(const row of clinicalTransition.entries){
  assert(!clinicalRows.has(row.id),'Duplicate genicular clinical transition identity');
  clinicalRows.set(row.id,row);
 }
 assert.equal(clinicalById.size,10,'Complete genicular clinical pins');
 assert.equal(clinicalRows.size,10,'Complete genicular clinical transition');
 if(catalog!==undefined){
  const display=typeof api.bodyDisplayCatalog==='function'?api.bodyDisplayCatalog(catalog):catalog;
  assert(Array.isArray(display?.structures),'Genicular terminal requires source catalog');
  for(const e of mriPins.entries){
   const matches=display.structures.filter(s=>s.id===e.identity.id);
   assert.equal(matches.length,1,'Missing or duplicate genicular source identity');
   assert.deepEqual(matches[0],e.identity,'Foreign genicular source identity');
  }
 }
 assert.equal(typeof api.bodyLesson,'function','Genicular terminal requires body lesson');
 assert.equal(typeof api.bodyContent,'function','Genicular terminal requires learner content');
 // Actual terminal has no optional helper or catalog. Without a supplied
 // catalog, this proves frozen queried identities/lessons, not independent
 // source catalog membership.
 assert.equal(api.genicularMriLesson,undefined,'Unobserved genicular terminal helper');
 let older=0;
 for(const e of mriPins.entries){
  const clinical=clinicalById.get(e.identity.id),row=clinicalRows.get(e.identity.id);
  assert(clinical&&row,'Missing genicular clinical overlap');
  assert.deepEqual(clinical.identity,e.identity,'Genicular MRI/clinical identity mismatch');
  assert.equal(row.family,clinical.family,'Genicular clinical family mismatch');
  assert.equal(row.sections.mri,hash(e.previous),'Clinical current is MRI predecessor');
  assert(clinical.previous?.mri,'Missing genicular clinical MRI predecessor');
  assert(!isDeepStrictEqual(clinical.previous.mri,e.previous),'Clinical predecessor must be older');
  assert(isDeepStrictEqual(api.bodyLesson(e.identity,'mri'),clinical.previous.mri),
   'Foreign genicular terminal lesson');
  assert.deepEqual(api.bodyContent(e.identity,'mri'),shown(clinical.previous.mri),
   'Foreign genicular terminal learner content');
  older++;
 }
 assert.equal(older,8,'All eight clinical predecessors required');
 return api;
}

export function replayGenicularClinicalTerminal(api,config,catalog){
 if(config.name!=='genicular-mri')return replayPinnedTeaching(api,config,catalog);
 const first=mriPins.entries[0],clinical=clinicalPins.entries.find(e=>e.identity.id===first.identity.id);
 assert(clinical?.previous?.mri,'Frozen genicular clinical overlap missing');
 if(typeof api?.bodyLesson==='function'&&isDeepStrictEqual(api.bodyLesson(first.identity,'mri'),clinical.previous.mri))
  return exactGenicularClinicalTerminal(api,config,catalog);
 return replayPinnedTeaching(api,config,catalog);
}
