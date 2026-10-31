import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas',baseline=json(root+'/BASELINE.json');
const input='export {nestedStudyTargets} from "./lib/nested-anatomy.ts"; export {nestedTeachingFor,nestedTopicLesson} from "./lib/nested-teaching.ts"; export {bodyDisplayCatalog} from "./lib/body-display-catalog.ts"; export {contentTabs} from "./lib/content-types.ts"; export {nestedReviewRows,nestedReviewMaterial} from "./lib/nested-review-material.ts";';
async function load(site){const {build}=await import(pathToFileURL(site+'/scripts/workspace-test-build.mjs').href);const result=await build({stdin:{contents:input,resolveDir:site,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));}
const before=await load(baseline.source),after=await load(baseline.atlas);
const catalog=before.bodyDisplayCatalog(json(baseline.source+'/public/models/bodyparts3d/full-body/catalog.json')),targets=before.nestedStudyTargets(catalog);
const expected=new Set(['FMA72970','FMA72969','FMA72974','FMA72973']);
const changes={lessons:[],teachingRevisions:[],geometryRevisions:[],materialRevisions:[]};let identicalLessons=0;
for(const t of targets){
 const parent=catalog.structures.find(x=>x.id===t.parentId),b=before.nestedTeachingFor(parent,t.study,t.structure),a=after.nestedTeachingFor(parent,t.study,t.structure);assert(b&&a);
 const changed=expected.has(t.structure.fmaId)&&t.study==='cerebral';
 for(const tab of before.contentTabs){const old=before.nestedTopicLesson(b,tab),current=after.nestedTopicLesson(a,tab);if(changed&&tab==='ultrasound'){assert.equal(old.readiness,'pending');assert.equal(current.readiness,'draft');changes.lessons.push({id:t.structure.id,tab});}else{assert.deepEqual(current,old,t.structure.id+'/'+tab);identicalLessons++;}}
 const key=before.nestedReviewRows.find(row=>row.parentId===t.parentId&&row.study===t.study).key;
 const old=(await before.nestedReviewMaterial(key,t.structure.id)).context,current=(await after.nestedReviewMaterial(key,t.structure.id)).context;
 assert.equal(current.sourceHash,old.sourceHash,'Source identity unchanged');
 assert.equal(current.revisions.imaging,null);assert(current.blockers.imaging.length>0);
 assert.equal(current.revisions.teaching!==old.revisions.teaching,changed,'Only authored teaching decisions require new teaching revision');
 for(const [field,oldValue,newValue]of [['teachingRevisions',old.revisions.teaching,current.revisions.teaching],['geometryRevisions',old.revisions.geometry,current.revisions.geometry],['materialRevisions',old.materialHash,current.materialHash]])if(oldValue!==newValue)changes[field].push(t.structure.id);
}
assert.equal(targets.length,108);assert.equal(changes.lessons.length,4);assert.equal(identicalLessons,968);assert.equal(changes.teachingRevisions.length,4);
assert.equal(changes.geometryRevisions.length,108,'Existing renderer-bound geometry review remains conservative');assert.equal(changes.materialRevisions.length,108);
for(const row of baseline.sourceRows)assert.equal(hash(baseline.source+'/'+row.path),row.sha256,row.path);
const result={at:new Date().toISOString(),passed:true,targets:108,identicalLessons,changes,baselineHead:baseline.sourceHead,
 baselineRenderer:json(baseline.source+'/content/body-renderer-revision.json').sha256,candidateRenderer:json(baseline.atlas+'/content/body-renderer-revision.json').sha256,
 existingReviewPolicy:'Renderer dependencies include teaching content. New generated renderer revision changes all108nested geometry-review revisions even though mesh/source identities are unchanged. This preserves existing conservative review scope; no decisions are migrated.',
 clinicalApproval:false,patientSpaceSynchronization:false,canonicalUnchanged:true,installed:false};
fs.writeFileSync(root+'/REVIEW_IMPACT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,targets:108,changedLessons:4,identicalLessons,teachingRevisions:4,geometryRevisions:108,materialRevisions:108,sourceIdentitiesUnchanged:true}));
