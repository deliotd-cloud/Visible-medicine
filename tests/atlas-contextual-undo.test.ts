import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional export includes tested contextual Undo and panel-only reveal',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'0d2d5dd5a0530f9c726e46e49d0367a1730336bd');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/body-selection-notice.tsx':'a0b5d8d77eb6c4124877e19e279f3b5b3067586e673138cbfb78c85c3c2fcb46',
    'lib/contextual-dissection-undo.ts':'628154c5b1ef24e0a1a8f69544fbfeefbd84ab5b950955515a0ca6886d4e93ef',
    'app/body-explorer.tsx':'cad7a3f51095947efe350ce80d08e6e5e57faf7de8e9519f9aeedc3b4ada66bd',
    'app/body-explorer.css':'d2bd732a4275471f962f696b2cd4d5901c54f86f95d8f2a4135d31f56237c24b',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const bytes=readFileSync(base+file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    return bytes.toString();
  }).join('\n');
  for(const marker of ['body-selection-undo','Undo hiding','Undo removal of','preventScroll','aria-atomic'])assert.ok(runtime.includes(marker),marker);
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
});
