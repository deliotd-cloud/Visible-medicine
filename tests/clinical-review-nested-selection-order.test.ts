import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');

test('nested selected-card order reaches learner and protected Review at the same source revision',()=>{
 const base='public/atlas-runtime/head-neck/';
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 const path='app/ventricles.tsx',source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
 assert(source&&imported);assert.equal(imported.sourceSha256,source.sha256);
 const code=readFileSync('atlas-review/'+path,'utf8');
 assert.equal(sha(code),imported.importedSha256);
 // Review namespaces local aliases; compare original bytes only after that known transform.
 assert.equal(sha(code.replaceAll('@/atlas-review/','@/')),source.sha256);
 const preset=code.indexOf('<label htmlFor="ventricular-preset">');
 const card=code.indexOf('<section className="eye-layer-teaching"');
 const checklist=code.indexOf('<CerebralLayers');
 assert(preset>=0&&preset<card&&card<checklist,'actual source order: preset, selected card, checklist');
 assert.equal(code.split('<section className="eye-layer-teaching"').length-1,1);
 const cardEnd=code.indexOf('</section>',card),body=code.slice(card,cardEnd);
 for(const action of ['Fade others','Frame selected','<NestedTeaching'])assert(body.includes(action));
 const renderer=JSON.parse(readFileSync('atlas-review/content/body-renderer-revision.json','utf8'));
 assert.equal(renderer.dependencies.find((f:{path:string})=>f.path===path).sha256,source.sha256);
 assert.equal(learner.clinicalApproved,false);assert.equal(learner.patientDataIncluded,false);
});
