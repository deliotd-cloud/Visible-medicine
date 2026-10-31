// Test-only bridge from the original admission commit to the pinned current Atlas.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=['app/anatomy-data.ts','app/dissection-data.ts','lib/regional-tours.ts'];
const liveBlobs={
  'app/anatomy-data.ts':'9bf87d0a040d909618fdc5b0de1cc85e15dd3292',
  'app/dissection-data.ts':'68b4356b0d2e4e29ef954249c8cde373430ae343',
  'lib/regional-tours.ts':'d7ba177194a8d8671c7e3c8f6336e169e4ca2be6',
};
const featureBlobs={
  colic:{
    'app/anatomy-data.ts':'be425af0b3a00dfe53403b1266408647754c7962',
    'app/dissection-data.ts':'68b4356b0d2e4e29ef954249c8cde373430ae343',
    'lib/regional-tours.ts':'e6136745f220db0e6536b91c4cbccde10570ce9c',
  },
  femoral:{
    'app/anatomy-data.ts':'5b4ec4ab55685e03eca52a07e0a274ce1a0f9b6c',
    'app/dissection-data.ts':'68b4356b0d2e4e29ef954249c8cde373430ae343',
    'lib/regional-tours.ts':'ce6c5c5fac960b06a02687269e232ba82146ca41',
  },
};

export function assertAdmissionCurrentGuideEpoch({kind,featureCommit,liveCommit,atlas,manifest,git,
  readImported=path=>readFileSync('atlas-review/'+path)}){
  assert(Object.hasOwn(featureBlobs,kind));
  assert.equal(manifest.revision,liveCommit,'Current Review revision');
  for(const path of paths){
    const featureBlob=git(['rev-parse',`${featureCommit}:${path}`]).toString().trim();
    const liveBlob=git(['rev-parse',`${liveCommit}:${path}`]).toString().trim();
    assert.equal(featureBlob,featureBlobs[kind][path],`${kind} admitted ${path} changed`);
    assert.equal(liveBlob,liveBlobs[path],`Unaccepted current ${path} change`);
    // Dissection stayed byte-identical. Anatomy gains shoulder citations/teaching;
    // tours gain source-bound guided lessons and continuous playback.
    assert.equal(featureBlob===liveBlob,path==='app/dissection-data.ts',`${path}: declared epoch transition`);
    const source=git(['show',`${liveCommit}:${path}`]);
    const imported=readImported(path);
    const row=manifest.files.find(file=>file.path===path);
    assert(row,`Review missing ${path}`);
    assert.equal(row.sourceSha256,sha(source),`${path}: committed source hash`);
    assert.equal(row.importedSha256,sha(imported),`${path}: imported source hash`);
    assert.deepEqual(imported,source,`${path}: exact current imported source`);
    assert.deepEqual(readFileSync(atlas+'/'+path),source,`${path}: exact current checkout source`);
  }
}
