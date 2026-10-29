import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {assertCurrentRenalSourceBinding,assertRenalTourEpoch,
 assertRenalPortalPrefixEpoch} from './renal-tour-epoch-admission.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const source='9cef8900417bf592d3130f6ff92bf3e748cb55fc';

test('9cef native successor retains complete renal history and exact later tours',
 {timeout:60000},async()=>{
  const atlas=process.env.VM_ATLAS_SOURCE_REPO;
  assert(atlas,'Explicit staged Atlas source required');
  const pin=JSON.parse(readFileSync(site+'tests/fixtures/current-atlas-delivery.json'));
  assert.equal(pin.source,source);
  assert.equal(execFileSync('git',['-C',atlas,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),source);
  const bound=assertCurrentRenalSourceBinding();
  assert.equal(bound.sha256,'3b46596734c29891b803db7f0448eff4a8cc803d615fd197f77591efe95cfd5c');
  assert.equal(bound.gitBlob,'d7ba177194a8d8671c7e3c8f6336e169e4ca2be6');
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const historical=await exactSourceHistoryApi('389bd0ca846a42c7f21055f55904bcf5df81a09f','review-security');
  const portal=await exactSourceHistoryApi('6b6d9bba99985dfc5ca8deb52ca9e2632b837d25','review-security');
  const output=await build({stdin:{contents:"export {regionalTours} from './atlas-review/lib/regional-tours';",
   resolveDir:site,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
  const {regionalTours}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
  assertRenalTourEpoch(historical.regionalTours,regionalTours);
  assertRenalPortalPrefixEpoch(portal.regionalTours,regionalTours);
  const changed=structuredClone(regionalTours);
  changed[18].title+=' altered';
  assert.throws(()=>assertRenalTourEpoch(historical.regionalTours,changed));
  assert.throws(()=>assertRenalPortalPrefixEpoch(portal.regionalTours,changed));
  const removed=regionalTours.slice(0,-1);
  assert.throws(()=>assertRenalTourEpoch(historical.regionalTours,removed));
});
