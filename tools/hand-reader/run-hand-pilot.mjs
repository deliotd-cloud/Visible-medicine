// Import hook for the unchanged baseline hand test. No test runs on import.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';

export const website='G:/VisibleMedicine-temp/staging/20261031-release16-final/website';
export const pilot='G:/VisibleMedicine-temp/proposals/20261031-hand-history-speed-pilot';
const source='G:/VisibleMedicine-temp/staging/20261031-release16-final/SOURCE.json';
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
export const testUrl=pathToFileURL(website+'/tests/atlas-hand-vessel-xray.test.mjs').href;
export const helperUrl=pathToFileURL(pilot+'/tests/atlas-hand-vessel-xray-history-api.mjs').href;

export function redirectPilotImport(specifier,parentURL){
  return specifier==='./atlas-hand-vessel-xray-history-api.mjs'&&parentURL===testUrl?helperUrl:null;
}

export function verifyPilotInputs(){
  assert.equal(realpathSync(process.cwd()),realpathSync(website),'Expected exact baseline website cwd');
  assert.equal(sha(source),'ec5e332400ad3744044342deb9f7c6d80de0d1ab432107f96c0a5d221faecc8b','Sealed baseline SOURCE');
  assert.equal(sha(pilot+'/MANIFEST.json'),'e9f4705d3308a5c86e0fe68c7f355dc79284a6ad31e818f5a25f982b7e635fb4','Sealed hand pilot');
  const manifest=JSON.parse(readFileSync(pilot+'/MANIFEST.json'));
  assert.equal(manifest.baseline.website,website);
  assert.equal(manifest.baseline.sourceSha256,sha(source));
  for(const row of manifest.files)assert.equal(sha(pilot+'/'+row.path),row.sha256,row.path);
  assert.equal(sha(website+'/tests/atlas-hand-vessel-xray.test.mjs'),'f0c3a3ab07860965154ad8557066da57b343a6d7e98bff1b8436363a223988db','Unchanged full hand test');
  assert.equal(sha(website+'/tests/atlas-hand-vessel-xray-history-api.mjs'),manifest.before.historyApiSha256,'Unchanged baseline helper');
  assert.equal(sha(website+'/tests/git-object-reader.mjs'),manifest.before.blobReaderSha256);
  assert.equal(sha(website+'/tests/git-snapshot-reader.mjs'),manifest.before.snapshotReaderSha256);
  assert.equal(sha(pilot+'/tests/atlas-hand-vessel-xray-history-api.mjs'),manifest.after.historyApiSha256);
  return true;
}

verifyPilotInputs();
registerHooks({resolve(specifier,context,nextResolve){
  const redirected=redirectPilotImport(specifier,context.parentURL);
  return redirected?{url:redirected,shortCircuit:true}:nextResolve(specifier,context);
}});
