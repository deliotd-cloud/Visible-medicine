// Test-only access to an exact local historical presentation. No fallback to live
// manifests, no source-root override, and no private asset is copied or exported.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {plexusHash} from '../scripts/plexus-review-fingerprints.mjs';
const root='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const bytes=readFileSync(root+'/lib/plexus-review-manifest.json');
assert.equal(plexusHash(bytes),'b09b4b8ad4adbe33efecbfe5c01b2778a05cc5abbe600e385d9da9be3d621fc2','Restore the exact local pre-navigation Plexus presentation');
const packet=JSON.parse(bytes);
const inputs=new Map([...packet.topologyInputs,...packet.presentationInputs].filter(row=>row.kind==='website').map(row=>[row.path,row.sha256]));
export function readPlexusPresentation18(relative,encoding){
 assert(typeof relative==='string'&&!relative.includes('\\')&&!relative.split('/').includes('..'));
 let value;
 if(relative==='lib/plexus-review-manifest.json')value=bytes;
 else{
  const expected=relative==='.local/plexus-review/assets.ts'?'c0e960bd831e9cb82659e0ecb903b3c5f47eb44ba03e8ca8f6752b7f4dfa4a75':inputs.get(relative);
  assert(expected,'Undeclared historical Plexus input: '+relative);
  value=readFileSync(root+'/'+relative);assert.equal(plexusHash(value),expected,'Historical Plexus input changed: '+relative);
 }
 assert(encoding===undefined||encoding==='utf8');return encoding==='utf8'?value.toString('utf8'):Buffer.from(value);
}
export function readPlexusBeforeHistory(relative){
 if(relative==='lib/clinical-review-navigation-guard.ts'){
  const value=readFileSync('F:/VisibleMedicine/staging/20261021-review-history-candidate/preimages/'+relative);
  assert.equal(plexusHash(value),'8c779ba3552af0423a5c724587e6fcb8f371572c0feb48aa1cc281b671725cbb');
  return value;
 }
 assert(inputs.has(relative),'Undeclared pre-history Plexus input');
 return readFileSync(new URL('../'+relative,import.meta.url));
}
