import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const series = {
  revisions: ['regional', 'renderer', 'display', 'regionalCheck', 'rendererCheck', 'displayCheck'],
  final: ['cohortV2', 'typesV2', 'unitV2'],
}[process.argv[2]];
assert(series, 'Expected revisions or final');
for (const phase of series) {
  const child = spawn(process.execPath, ['--max-old-space-size=96', 'check-pancreatic-venous-us-20261024.mjs', phase], {cwd: process.cwd(), windowsHide: true, stdio: 'inherit'});
  const result = await new Promise(resolve => { child.once('error', e => resolve({error: e.message})); child.once('close', (code, signal) => resolve({code, signal})); });
  assert.equal(result.code, 0, phase + ':' + JSON.stringify(result));
}
