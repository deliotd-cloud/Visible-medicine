import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';
import { build } from 'esbuild';

test('seven ankle drafts reach both learner modules and exact specimen review', async () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  assert.equal(review.revision, '190a63238eadcf906abe89dcbb6a67c88afe70b9');
  const sourceRoot=currentAtlasDeliveryRoot();
  const committed=(revision:string,path:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],
    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const pins = {
    'content/um-calf-foot-clinical.ts': '557ae3859bea0db95f70303474d9afa053a8dec0380a6ffc325c070f281c9fd1',
    'content/um-limb-teaching-bindings.v1.json': 'f35686e97f962343b3d1d58b5bb6eaf4dba89f09ec202bdc4dd7b0fac753ea36',
  };
  for (const module of ['head-neck', 'lower-limb']) {
    const base = 'public/atlas-runtime/' + module + '/';
    const manifest = JSON.parse(readFileSync(base + 'manifest.json', 'utf8'));
    const inputs = JSON.parse(readFileSync(base + 'source-inputs.json', 'utf8'));
    // Both learner runtimes now use the same current teaching bindings.
    // The original ankle module remains byte-identical despite additive drafts.
    assert.equal(manifest.sourceCommit, '190a63238eadcf906abe89dcbb6a67c88afe70b9');
    for (const key of ['patientDataIncluded', 'clinicalApproved', 'imagingConnection', 'standaloneReviewConnection']) assert.equal(manifest[key], false);
    for (const [path, expected] of Object.entries(pins)) {
      assert.equal(inputs.find((f: any) => f.path === path)?.sha256, expected);
      const imported = review.files.find((f: any) => f.path === path);
      assert.equal(imported.sourceSha256, expected);
      assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), imported.importedSha256);
      const current=committed(review.revision,path);
      assert.deepEqual(current,committed('9fba9a1e24b6669aafd48e945d55fc0939d50ab2',path),path+' exact 9f teaching source');
      assert.equal(createHash('sha256').update(current).digest('hex'),expected,path+' committed source');
    }
  }
  const result = await build({ stdin: { contents: `
    export {specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';
    export {limbDefinitions} from './atlas-review/lib/um-limb-studies';
    export {specimenTeachingFor} from './atlas-review/lib/um-limb-teaching';
  `, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
  const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
  const additions = new Map([
    ['tibialis-anterior', ['ultrasound', 'mri']], ['tibialis-posterior', ['ultrasound']],
    ['extensor-hallucis-longus', ['ultrasound']], ['extensor-digitorum-longus', ['ultrasound']],
    ['flexor-hallucis-longus', ['ultrasound']], ['flexor-digitorum-longus', ['ultrasound']],
  ]);
  let placements = 0;
  for (const definition of Object.values(api.limbDefinitions) as any[]) for (const selected of definition.surfaces) {
    const topics = additions.get(selected.slug); if (!topics) continue;
    const packet = await api.specimenReviewMaterial(definition.key, selected.id);
    assert.equal(packet.context.revisions.imaging, null);
    const lesson = api.specimenTeachingFor(definition, selected);
    for (const topic of topics) {
      const entry = packet.teaching.topics.find((t: any) => t.tab === topic);
      assert.equal(entry.body, lesson.extended.topics[topic].body);
      assert.deepEqual(entry.references, lesson.extended.topics[topic].references);
      assert.equal(lesson.extended.topics[topic].readiness, 'draft'); placements++;
    }
  }
  assert.equal(placements, 21);
});
