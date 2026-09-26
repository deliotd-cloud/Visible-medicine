import raw from '../public/models/bodyparts3d/full-body/catalog.json';
import type { BodyCatalog } from '../app/body-types';
import { bodyDisplayCatalog } from './body-display-catalog';
import { nestedStudyTargets, resolveNestedTarget } from './nested-anatomy';
import { nestedTeachingFor, nestedTopicLesson, nestedTeachingReferences } from './nested-teaching';
import { contentTabs } from './content-types';
import { makeStudyLink } from './study-links';
import { canonicalSpecimenValue } from './specimen-links';
import { nestedReviewKey, parseNestedReviewKey } from './nested-review-key';
import { nestedChecklists, nestedChecklistVersion, nestedReviewScope, type NestedReviewContext } from './nested-review';
import renderer from '../content/body-renderer-revision.json';

const catalog = bodyDisplayCatalog(raw as unknown as BodyCatalog);
const targets = nestedStudyTargets(catalog);
export const nestedReviewRows = Array.from(new Set(targets.map(t => nestedReviewKey(t.parentId,t.study)))).map(key => {
  const {parentId,study} = parseNestedReviewKey(key);
  const parent = catalog.structures.find(s => s.id === parentId)!;
  const group = targets.filter(t => t.parentId === parentId && t.study === study);
  return {key, parentId, study, name:parent.name+' · '+group[0].title,
    surfaces:group.map(t=>({id:t.structureId,name:t.structure.name,laterality:t.structure.laterality}))};
});
async function digest(value: unknown) {
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalSpecimenValue(JSON.parse(JSON.stringify(value)))));
  return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
}
/** Only admitted source children become review contexts. No root decisions or
 * private records are read here. A context is not an approval. */
export async function nestedReviewMaterial(key:string,structureId:string) {
  let identity;
  try { identity=parseNestedReviewKey(key); } catch { return null; }
  const matches=targets.filter(t=>t.parentId===identity.parentId&&t.study===identity.study&&t.structureId===structureId);
  if(matches.length!==1)return null;
  const target=resolveNestedTarget(catalog,identity.parentId,matches[0],'both');
  if(!target)return null;
  const parent=catalog.structures.find(s=>s.id===target.parentId)!;
  const parentBundle=catalog.bundles.find(b=>b.id===parent.bundle)!;
  if(parentBundle.sha256!==target.parentHash)return null;
  const concept=nestedTeachingFor(parent,target.study,target.structure);
  const topics=contentTabs.filter(t=>t!=='quiz').map(tab=>{
    const lesson=concept?nestedTopicLesson(concept,tab):null;
    return {tab,readiness:lesson?.readiness??'pending',body:lesson?.body??null,
      note:lesson?.note??null,bullets:lesson?.bullets??[],references:lesson?.citations??[]};
  });
  const usedUrls=new Set([...topics.flatMap(t=>t.references),...(concept?.quiz.references.map(r=>nestedTeachingReferences[r].url)??[])]);
  const referenceTitles=Object.fromEntries(Object.values(nestedTeachingReferences).filter(r=>usedUrls.has(r.url)).map(r=>[r.url,r.title]));
  const lesson=concept?{extended:{modelLimit:concept.modelLimit,selfCheck:{
    question:concept.quiz.question,answer:concept.quiz.answer,basis:concept.quiz.basis,
    references:concept.quiz.references.map(r=>nestedTeachingReferences[r].url)}}}:null;
  const sourceFrame='bodyparts3d:'+catalog.sourceVersion+':'+await digest(catalog.coordinateSystem);
  const source={parent,structure:target.structure,parentBundle,
    childBundleHash:target.sourceHash,study:target.study,studyTitle:target.title,
    sourceFrame,sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,
    credit:catalog.credit,license:catalog.license,
    limitations:'This is one source-defined child in its exact parent/study scope. It does not validate the whole organ, complete internal anatomy, independent specimens, patient imaging or paid lectures.'};
  const teaching={topics,lesson,concept,referenceTitles};
  const atlasLink=makeStudyLink(catalog,parent.region,parent.id,'both',null,target);
  const sourceHash=await digest(source),teachingHash=await digest(teaching);
  const bound={catalogScope:nestedReviewScope,nestedKey:key,sourceFrame,structureId,checklistVersion:nestedChecklistVersion};
  const teachingTabs=[...topics.filter(t=>t.readiness==='draft').map(t=>t.tab),...(concept?['self-check']:[])];
  const context:NestedReviewContext={...bound,structureName:target.structure.name,
    sourceHash,teachingHash,rendererHash:renderer.sha256,teachingTabs,
    materialHash:await digest({identity:bound,sourceHash,teachingHash,renderer:renderer.sha256,checklist:nestedChecklists}),
    checklists:structuredClone(nestedChecklists),
    blockers:{geometry:atlasLink?[]:['The exact parent/child study link is unavailable.'],
      teaching:['anatomy','function','clinical','pathology'].filter(t=>!teachingTabs.includes(t)).map(t=>'The '+t+' topic is pending; complete it before teaching sign-off.'),
      imaging:['No validated acquired-image series or spatial registration is connected. Imaging review is unavailable.']},
    revisions:{geometry:await digest({identity:bound,sourceHash,renderer:renderer.sha256,checklist:nestedChecklists.geometry}),
      teaching:await digest({identity:bound,sourceHash,teachingHash,checklist:nestedChecklists.teaching}),imaging:null}};
  return structuredClone({context,source,teaching,atlasLink});
}
export type NestedReviewMaterial=NonNullable<Awaited<ReturnType<typeof nestedReviewMaterial>>>;

/** Selected worksheet links must retain their source identity, not silently
 * upgrade to today's parent/child geometry. Unselected queue is separate. */
export async function nestedReviewSelection(key:string,structureId:string,token:unknown) {
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;
  const packet=await nestedReviewMaterial(key,structureId);
  return packet?.context.sourceHash===token?packet:null;
}
