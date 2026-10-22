import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {inspectMigrationLaterRole,restoreMigrationLaterRole} from '../CODE/tests/head-manual-migration-later-inverse.mjs';

const root=process.argv[2];
assert(root,'Pass the frozen website root');
const read=path=>readFileSync(join(root,path));
const epoch=JSON.parse(read('tests/fixtures/head-manual-recovery-53/epoch.json'));
const records=new Map(epoch.files.map(row=>[row.path,row]));
const frozen=path=>{const row=records.get(path);assert(row,path);return Buffer.from(row.text,'utf8');};
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
const expected=new Map();
let helper52=frozen('tests/historical-native-head-history-delivery-52.mjs').toString();
helper52=once(helper52,"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';","import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {readRevision53,revision53} from './historical-head-manual-recovery-delivery-53.mjs';");
helper52=once(helper52,'const row=records.get(path);if(!row)',"const row=records.get(path);if(!row&&revision53.changedPriorInputs.includes(path))return readRevision53(path);if(!row)");
helper52=once(helper52,"if(!row)return readFileSync(new URL(path,site));","if(!row&&path==='tests/atlas-cerebral-lobar-imaging.test.ts'){const b=readFileSync(new URL('./fixtures/closed-cerebral-current-52/test.ts.txt',import.meta.url));assert.equal(sha(b),'c474c475f57b487da4492852c14f8cf7462895ec5fabc71e4c528ec2bb1e5562');return b;}if(!row)return readFileSync(new URL(path,site));");
expected.set('historical-native-head-history-delivery-52.mjs',Buffer.from(helper52));
const oldList="'components/HeadAtlasViewer.tsx','scripts/bind-clinical-review.mjs'";
const newList=oldList+",'components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLinkedModel.tsx'";
for(const name of ['historical-radial-eus-delivery-51.mjs','historical-lacrimal-delivery-50.mjs'])
 expected.set(name,Buffer.from(once(frozen('tests/'+name).toString(),oldList,newList)));
for(const [name,prior] of expected){
 const current=read('tests/'+name),data=inspectMigrationLaterRole(name,current,prior);
 if(process.argv.includes('--inspect'))console.log(JSON.stringify({name,currentSha:data.currentSha,priorSha:data.priorSha,hunks:data.hunks.map((h,i)=>({oldStart:h.oldStart,newStart:h.newStart,removed:h.removed.length,added:h.added.length,digest:data.digests[i]}))}));
 else {
  assert.deepEqual(restoreMigrationLaterRole(name,current,prior),prior);
  assert.throws(()=>restoreMigrationLaterRole(name,Buffer.concat([current,Buffer.from(' ')]),prior));
  console.log(name,'complete-inverse-and-mutation-ok');
 }
}
