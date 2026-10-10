// Offline exact predecessor only. Never runtime dispatch or approval authority.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import original from '../content/central-vessel-imaging.transition.json' with {type:'json'};
import revision from '../content/abdominal-aorta-ultrasound-revision.transition.json' with {type:'json'};

export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const targetId='vm:anatomy:body:abdomen:midline:vessel:abdominal-aorta';
export const oldFocus={body:'Survey the aorta longitudinally and transversely, retaining a consistent measurement convention and identifying the bifurcation where visible.',pitfall:'Gas or obliquity can hide or distort segments; document incomplete coverage.',references:['aortaEcho']};
export const newFocus={body:'On an acquired abdominal aortic ultrasound, identify proximal, mid and distal segments in longitudinal and transverse planes where visible. Diagnostic AIUM/ACR/SRU measurements use the greatest outer-wall-to-outer-wall diameter; the NHS England AAA screening programme records maximal anteroposterior inner-to-inner diameters in longitudinal and transverse views. State which protocol and caliper convention produced a measurement.',pitfall:'Tortuosity or an oblique plane can exaggerate apparent calibre, and bowel gas or depth may leave a segment unseen. Do not compare outer-to-outer and inner-to-inner values as interchangeable serial measurements. This donor mesh supplies no wall thickness, calibrated diameter, acoustic window, patient correspondence or screening result.',references:['aortaAiumUS','aortaNhsScreen']};
const oldReference='https://pmc.ncbi.nlm.nih.gov/articles/PMC9876736/';
const newReferences={aortaAiumUS:'https://onlinelibrary.wiley.com/doi/10.1002/jum.70167',aortaNhsScreen:'https://www.gov.uk/government/publications/aaa-screening-standard-operating-procedures/aaa-screening-programme-guidance'};
const note='Anatomy/radiology review pending. Return separation to zero before comparing relationships. No scan or spatial registration is connected. Confirm patient, vessel, side, orientation and series in the separate Education viewer. These notes are not a diagnosis, acquisition protocol, management guideline or procedural route. Paid-lecture access remains independent.';

// Textual history comparisons must reverse exactly the recorded addition, not
// remove arbitrary lines merely containing a new reference or structure name.
export function centralSourceBeforeAbdominalAortaUltrasound(source){
  let result=source.replaceAll('\r\n','\n').trimEnd();
  const refLines=Object.entries(newReferences).map(([key,url])=>`  ${key}:'${url}',\n`);
  const line=focus=>`    ultrasound:fact('${focus.body}','${focus.pitfall}',${focus.references.map(key=>`'${key}'`).join(',')}),`;
  for(const text of [...refLines,line(newFocus)])assert.equal(result.split(text).length-1,1,'Exactly one recorded aorta source replacement');
  for(const text of refLines)result=result.replace(text,'');
  return result.replace(line(newFocus),line(oldFocus));
}

export function assertAortaRevision(value){
  assert.equal(hash(value),'621cc49e2c1999a393f2c10e14fc97fa97adc1170f5754f5ad9733f8053587aa','Unrecorded aorta revision manifest');
}

export function beforeAbdominalAortaUltrasound(api,catalog){
  assert.equal(hash(pins),'a857867b80d31d01ab55c688264010759dce0a0a802a6a7cd76b9f7d68b467c4');
  assert.equal(hash(original),'fdfb91c066f5286eb46aaa992e796fec8aa586f9b307ae2e647f54a02f143ebb');
  assertAortaRevision(revision);
  const entry=pins.entries.find(e=>e.identity.id===targetId);
  assert.equal(entry.group,'abdominal-aorta');assert.equal(entry.identity.fmaId,'FMA3789');
  assert.equal(revision.id,targetId);assert.equal(revision.baselineCommit,'aa4a92a958408d665eafceacbd9850dd5712cb41');
  assert.deepEqual(entry.identity.sources,[revision.sourceComponent]);
  assert.equal(original.entries.find(e=>e.id===targetId).sections.ultrasound,revision.beforeLessonSha256);
  if(catalog!==undefined){
    assert(catalog&&Array.isArray(catalog.structures),'Aorta history requires source catalog');
    assert.equal(catalog.structures.filter(s=>s.id===targetId).length,1,'Exact aorta catalog identity count');
    assert.deepEqual(catalog.structures.find(s=>s.id===targetId),entry.identity,'Unrecorded aorta source');
  }
  const names=['centralVesselImagingGroups','centralVesselImagingReferences','centralVesselImagingLesson'];
  const omitted=names.every(name=>api[name]===undefined);
  if(typeof api.bodyLesson!=='function'){
    // Presence refusals must not construct a diff of the full real catalogue or
    // bundled API. That can exhaust memory merely while formatting a negative.
    assert(catalog===undefined,'Aorta history requires body lesson');assert(omitted,'Missing aorta body lesson');
    assert(api.bodyDisplayCatalog===undefined,'Aorta display requires body lesson');
    assert(api.bodyContent===undefined,'Aorta content requires body lesson');return api;
  }
  const current=api.bodyLesson(entry.identity,'ultrasound');
  const shown=lesson=>{const{readiness,...content}=lesson;return content;};
  const checkContent=lesson=>{if(api.bodyContent!==undefined){assert.equal(typeof api.bodyContent,'function','Invalid aorta learner content');assert.deepEqual(api.bodyContent(entry.identity,'ultrasound'),shown(lesson),'Unrecorded aorta learner content');}};
  if(omitted){
    // Early synthetic APIs expose no root display/lesson for this exact target.
    // Actual old Git APIs must instead supply one of the two frozen epochs.
    if(catalog===undefined&&api.bodyDisplayCatalog===undefined&&current===undefined){
      if(api.bodyContent!==undefined){assert.equal(typeof api.bodyContent,'function');assert.equal(api.bodyContent(entry.identity,'ultrasound'),undefined);}
      return api;
    }
    assert(current&&typeof current==='object','Missing aorta omitted-contract prior');
    assert(hash(current)===revision.beforeLessonSha256||hash(current)===hash(entry.previous.ultrasound),'Unrecorded aorta omitted-contract prior');
    checkContent(current);return api;
  }
  assert(names.every(name=>api[name]!==undefined),'Partial aorta historical contract');
  assert.equal(typeof api.centralVesselImagingLesson,'function','Invalid aorta draft helper');
  const group=api.centralVesselImagingGroups?.['abdominal-aorta'];
  assert.equal(group?.fmaId,'FMA3789','Missing aorta group');
  assert.equal(api.centralVesselImagingReferences?.aortaEcho,oldReference,'Unrecorded prior aorta reference');
  const lessonFor=(focus,refs)=>{
    const limitation=entry.anatomy.bullets.find(b=>!b.startsWith('Source identity:'));
    return {readiness:'draft',title:'Abdominal aorta · Ultrasound orientation · draft',body:focus.body,bullets:[entry.anatomy.body,focus.pitfall,...(limitation?[limitation]:[])],citations:[...new Set([...entry.anatomy.citations,...focus.references.map(key=>refs[key])])],note};
  };
  const prior=lessonFor(oldFocus,api.centralVesselImagingReferences);
  assert.equal(hash(prior),revision.beforeLessonSha256,'Original aorta draft fingerprint');
  // The older central-vessel adapter restores this exact pending lesson while
  // retaining its old draft helper/focus. Re-entry must accept that recorded
  // composite epoch, but still refuse mixed new metadata or a forged helper.
  if(hash(current)===revision.beforeLessonSha256||hash(current)===hash(entry.previous.ultrasound)){
    assert.deepEqual(group.focus.ultrasound,oldFocus,'Unrecorded prior aorta focus');
    for(const key of Object.keys(newReferences))assert.equal(api.centralVesselImagingReferences[key],undefined,'Unrecorded prior aorta reference table');
    assert.deepEqual(api.centralVesselImagingLesson(entry.identity,'ultrasound'),prior,'Unrecorded prior aorta helper');
    checkContent(current);return api;
  }
  assert.deepEqual(group.focus.ultrasound,newFocus,'Unrecorded aorta revised focus');
  for(const[key,url]of Object.entries(newReferences))assert.equal(api.centralVesselImagingReferences[key],url,'Unrecorded aorta revised reference');
  const expected=lessonFor(newFocus,api.centralVesselImagingReferences);
  assert.equal(hash(expected),revision.afterLessonSha256,'Revised aorta draft fingerprint');
  assert.deepEqual(current,expected,'Unrecorded aorta revised lesson');
  assert.deepEqual(api.centralVesselImagingLesson(entry.identity,'ultrasound'),expected,'Unrecorded aorta revised helper');
  checkContent(expected);
  const isTarget=(s,t)=>s?.id===targetId&&t==='ultrasound';
  const requireSource=s=>assert.deepEqual(s,entry.identity,'Aorta history requires exact source');
  const groups=structuredClone(api.centralVesselImagingGroups);groups['abdominal-aorta'].focus.ultrasound=structuredClone(oldFocus);
  const references={...api.centralVesselImagingReferences};for(const key of Object.keys(newReferences))delete references[key];
  const bodyLesson=(s,t)=>{if(!isTarget(s,t))return api.bodyLesson(s,t);requireSource(s);return structuredClone(prior);};
  const restored={...api,centralVesselImagingGroups:groups,centralVesselImagingReferences:references,bodyLesson,
    centralVesselImagingLesson(s,t){if(!isTarget(s,t))return api.centralVesselImagingLesson(s,t);requireSource(s);return structuredClone(prior);}};
  if(typeof api.bodyContent==='function')restored.bodyContent=(s,t)=>{if(!isTarget(s,t))return api.bodyContent(s,t);requireSource(s);return structuredClone(shown(prior));};
  return restored;
}
