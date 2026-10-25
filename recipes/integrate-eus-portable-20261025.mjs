import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {hash,json} from './seal-simple-website-successor.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';
memoryGate(2048);
const stage='F:/VisibleMedicine/staging/20261025-learning-delivery-website',site=stage+'/website',proposal='F:/VisibleMedicine/staging/20261025-eus-portable-digest-proposal',previous=stage+'/head-teaching-application/SOURCE_HEAD.json';assert.equal(hash(previous),'0999d8d8c74bdae31a060a32b12c2268dd54debc1f2b40db102a97f7ac1d2a78');const source=json(previous),report=json(proposal+'/REPORT.json');assert.equal(report.sourceEpochs.currentCandidateSha256,source.parentSha256);assert.equal(report.candidateFiles.length,12);
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
assert(!report.candidateFiles.some(r=>r.path.includes('source-index')||r.path.startsWith('LOCAL/')));
const dir=stage+'/eus-application';assert(!fs.existsSync(dir));fs.mkdirSync(dir);assert.equal(hash(site+'/tests/clinical-review-abdominal-eus.test.ts'),'c2951cffd8922fd873c4a63ff347adf760b6b54df1c95cf0f8fb038042449366');fs.copyFileSync(site+'/tests/clinical-review-abdominal-eus.test.ts',dir+'/ORIGINAL_TEST_BEFORE.ts',fs.constants.COPYFILE_EXCL);
const rows=new Map(source.sourceRows.map(r=>[r.path,r]));for(const r of report.candidateFiles){assert(r.path.startsWith('tests/')&&!r.path.split('/').includes('..'));const from=proposal+'/candidate/'+r.path,to=site+'/'+r.path;assert.equal(hash(from),r.sha256);assert.equal(fs.statSync(from).size,r.bytes);if(fs.existsSync(to))assert.equal(r.path,'tests/clinical-review-abdominal-eus.test.ts');fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);assert.equal(hash(to),r.sha256);rows.set(r.path,r);}
assert.equal(rows.size,6761);const file=dir+'/SOURCE_EUS.json';fs.writeFileSync(file,JSON.stringify({at:new Date().toISOString(),website:site,parent:previous,parentSha256:hash(previous),sourceRows:[...rows.values()].sort((a,b)=>a.path<b.path?-1:1),proposalReportSha256:hash(proposal+'/REPORT.json'),sourceIndexCopied:false,productOrReviewChanged:false,installed:false,previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({applied:true,sourcePaths:rows.size,sha256:hash(file)}));
