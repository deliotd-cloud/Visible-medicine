import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-source190-website',prep=json(stage+'/PREPARATION.json'),site=prep.site;
const {build}=createRequire(site+'/package.json')('esbuild');
const result=await build({stdin:{contents:"export {bodyReviewSummaries,bodyReviewSnapshot} from './atlas-review/lib/body-review-material.ts';",resolveDir:site,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
const code=result.outputFiles[0].contents;
const {bodyReviewSummaries,bodyReviewSnapshot}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const byReadiness={draft:0,pending:0,'identity-only':0,'generated-identification':0};let topics=0;
for(const structure of bodyReviewSummaries){const material=bodyReviewSnapshot(structure.id);assert(material&&material.topics.length===9);for(const topic of material.topics){assert(Object.hasOwn(byReadiness,topic.readiness));byReadiness[topic.readiness]++;topics++;}}
assert.equal(bodyReviewSummaries.length,1104);assert.equal(topics,9936);
const output={source:prep.sourceCommit,review:json(site+'/atlas-review/manifest.json').websiteIntegrationSha256,rootRepresentations:bodyReviewSummaries.length,topicPlacements:topics,byReadiness,compiledResolverSha256:sha(code),privateStorageRead:false,clinicalApproval:false,acquiredImageCoverage:false,uniqueLessonCount:false};
fs.writeFileSync(stage+'/ROOT_TEACHING_COUNTS.json',JSON.stringify(output,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(output));
