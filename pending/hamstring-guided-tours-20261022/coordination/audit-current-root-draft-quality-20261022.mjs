// Read-only editorial triage. Repeated prose and missing explicit citation fields
// are review hints, not clinical accuracy verdicts or completion measurements.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {read,sha,runGit} from './source-only-backup-20261019.mjs';
const atlas='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas';
const stage='F:/VisibleMedicine/staging/20261022-root-draft-quality';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const git=(...args)=>runGit(['-C',atlas,...args]).toString().trim();
assert.equal(git('rev-parse','HEAD'),'2381efe43b75f8a7fb768a069eecd7268c508dac');assert.equal(git('status','--porcelain'),'');
process.env.GOMAXPROCS='2';process.env.RAYON_NUM_THREADS='1';
const {build}=await import(pathToFileURL(atlas+'/scripts/workspace-test-build.mjs').href);
const started=Date.now(),compiled=await build({stdin:{contents:"export {bodyLesson} from './app/body-content.ts'; export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'; export {contentTabs} from './lib/content-types.ts';",resolveDir:atlas,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const resolver=compiled.outputFiles[0].text,api=await import('data:text/javascript;base64,'+Buffer.from(resolver).toString('base64'));
const catalogueFile=atlas+'/public/models/bodyparts3d/full-body/catalog.json';
const catalog=api.bodyDisplayCatalog(JSON.parse(read(catalogueFile))),groups=new Map(),byTopic={},withoutCitations=[];
let draft=0;
for(const s of catalog.structures)for(const topic of api.contentTabs){
  const lesson=api.bodyLesson(s,topic);if(lesson.readiness!=='draft')continue;
  draft++;byTopic[topic]=(byTopic[topic]??0)+1;
  const citations=Array.isArray(lesson.citations)?lesson.citations:[];
  assert(citations.every(url=>typeof url==='string'));
  const row={id:s.id,name:s.name,region:s.region,system:s.system,topic};
  if(citations.length===0)withoutCitations.push(row);
  const key=sha(Buffer.from(JSON.stringify({body:lesson.body,bullets:lesson.bullets,note:lesson.note??null})));
  if(!groups.has(key))groups.set(key,{proseSha256:key,bodyPreview:String(lesson.body??'').slice(0,180),placements:[],citationVariants:new Map()});
  const g=groups.get(key);g.placements.push(row);g.citationVariants.set(JSON.stringify(citations),citations);
}
assert.equal(catalog.structures.length,1104);assert.equal(draft,9380);
const ordered=[...groups.values()].map(g=>({...g,placementCount:g.placements.length,distinctSourceSelections:new Set(g.placements.map(p=>p.id)).size,citationVariants:[...g.citationVariants.values()]})).sort((a,b)=>b.placementCount-a.placementCount||a.proseSha256.localeCompare(b.proseSha256));
const repeated=ordered.filter(g=>g.placementCount>1),broad=repeated.filter(g=>g.distinctSourceSelections>=10);
assert.equal(git('status','--porcelain'),'');
const result={schema:'visible-medicine.root-draft-editorial-triage/1',at:new Date().toISOString(),sourceRevision:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),workingTreeClean:true,resolverSha256:sha(Buffer.from(resolver)),catalogSha256:sha(read(catalogueFile)),displayedStructuresSha256:sha(Buffer.from(JSON.stringify(catalog.structures))),elapsedMs:Date.now()-started,nodeVersion:process.version,scope:'Source-composed candidate root-body editorial drafts only; not nested/independent specimens, website clinical review or installed source.',counts:{sourceSelections:1104,topicPlacements:9936,draftPlacements:draft,distinctExactProseGroups:ordered.length,repeatedExactProseGroups:repeated.length,placementsInRepeatedExactProseGroups:repeated.reduce((n,g)=>n+g.placementCount,0),groupsSharedByAtLeast10SourceSelections:broad.length,draftPlacementsWithoutExplicitCitations:withoutCitations.length},byTopic,withoutExplicitCitations:withoutCitations,broadRepeatedGroups:broad,
  method:'Compare exact body/bullets/note bytes after the real bodyLesson resolver. Exclude title, readiness and citation arrays from grouping; retain each citation-array variant separately. No side/name normalization or semantic deduplication. Matching prose is not proof of identical meaning, poor teaching, a unique authored lesson or clinical approval.',
  limits:['A citation may appear elsewhere in a renderer; zero explicit lesson.citations is a triage signal, not proof no evidence exists.','Shared regional concepts and bilateral teaching may legitimately repeat. Triage quality/specificity/variants/clinical context manually in coherent groups, never delete or downgrade solely on these counts.','Distinct exact-prose groups are not a count of unique authored lessons, clinically accepted content or completeness.','No private decisions, scans, masks, external source assets, patient correspondence or spatial registration inspected.'],productChanged:false,previewChanged:false,clinicalApproval:false};
fs.writeFileSync(stage+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});fs.copyFileSync(new URL(import.meta.url),stage+'/audit-current-root-draft-quality-20261022.mjs',fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({result:stage+'/RESULT.json',sha256:sha(read(stage+'/RESULT.json')),counts:result.counts,withoutCitationSample:withoutCitations.slice(0,10),broadGroups:result.broadRepeatedGroups.slice(0,5).map(g=>({bodyPreview:g.bodyPreview,placements:g.placementCount,selections:g.distinctSourceSelections,topics:[...new Set(g.placements.map(p=>p.topic))]}))}));
