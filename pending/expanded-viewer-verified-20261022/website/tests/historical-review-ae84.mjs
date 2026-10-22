import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const archive=new URL('./fixtures/ae84-review/',import.meta.url);
const frozen=new Map([
 ['tests/fixtures/current-atlas-delivery.json',['current-atlas-delivery.json.raw','3e69cdcae68524ad65a6b542fa7c7d51180c676a3f43b187dcb39d55de95ddeb']],
 ['atlas-review/manifest.json',['atlas-review-manifest.json.raw','59002c5539fae6b3a22669d4d7c3f2528b397636828d8a80c1ef16216a30c548']],
 ['atlas-review/integration-inputs.json',['integration-inputs.json.raw','325359cf86b75fd2d35661c9b3d051924a719c794f9f298b3174d77f8173fb76']],
 ['public/atlas-review-viewer/manifest.json',['viewer-manifest.json.raw','6d13490f5eb6b8c82c96e044137775616b08cca914359ca50f968e43139edf32']],
 ['components/AtlasRuntimeFrame.tsx',['AtlasRuntimeFrame.tsx.raw','335b8b70b2ff60c3a951efb9eb18d98de8d230411c00896ff4a4123eff051261']],
 ['scripts/bind-clinical-review.mjs',['bind-clinical-review.mjs.raw','d8ce02c58eba914cc3243714c59dd35cbc0c38f7ddab90df626b14fdf0c7ef8d']],
 ['atlas-review/content/body-renderer-revision.json',['body-renderer-revision.json.raw','2cc64d315bb4ab3cbc4ec0d9cf27d1e1e8ca4095f2b92b05a7e4cf60c0871f2a']],
 ['atlas-review/content/review-revisions.json',['review-revisions.json.raw','71dcbe9f122c990b3001eb564e5a1a621c1c3edf5cc4fb02c9e239ea9ee8352b']],
]);

export function historicalReviewAe84Read(path,readLive,readFrozen=name=>readFileSync(new URL(name,archive))){
 const record=frozen.get(path);
 if(!record)return readLive(path);
 const [name,digest]=record,bytes=readFrozen(name);
 assert.equal(sha(bytes),digest,'Authentic ae84 overlay: '+path);
 return bytes;
}

export function historicalReviewAe84Pin(readLive){
 const bytes=historicalReviewAe84Read('tests/fixtures/current-atlas-delivery.json',readLive);
 const pin=JSON.parse(bytes);
 assert.equal(pin.reviewIntegration,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
 for(const path of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'])
  assert.equal(sha(historicalReviewAe84Read(path,readLive)),pin.documents[path],path+' admitted ae84 bytes');
 const inputs=JSON.parse(historicalReviewAe84Read('atlas-review/integration-inputs.json',readLive));
 for(const path of ['components/AtlasRuntimeFrame.tsx','scripts/bind-clinical-review.mjs'])
  assert.equal(sha(historicalReviewAe84Read(path,readLive)),inputs.inputs.find(row=>row.path===path)?.sha256,path+' admitted ae84 source');
 const review=JSON.parse(historicalReviewAe84Read('atlas-review/manifest.json',readLive));
 for(const path of ['content/body-renderer-revision.json','content/review-revisions.json'])
  assert.equal(sha(historicalReviewAe84Read('atlas-review/'+path,readLive)),review.files.find(row=>row.path===path)?.importedSha256,path+' admitted ae84 import');
 return pin;
}
