import assert from 'node:assert/strict';
import {test} from 'node:test';
import {nativeAtlasEnvironment,nativeAtlasIdentityForSource} from './native-atlas-environment-20261022.mjs';
const pin={source:'389bd0ca846a42c7f21055f55904bcf5df81a09f',sourceTree:'25acdee40ee57e0253cdcca924aa64b4b38586c8'};
const source={atlas:'F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/atlas',atlasHead:pin.source,atlasTree:pin.sourceTree};
test('explicit isolated Atlas identity is preserved, not replaced by installed source',()=>{
 assert.deepEqual(nativeAtlasIdentityForSource(source,pin),{atlas:source.atlas,revision:pin.source,tree:pin.sourceTree});
 const env=nativeAtlasEnvironment({...nativeAtlasIdentityForSource(source,pin),environment:{...process.env,VM_ATLAS_SOURCE_REPO:source.atlas}});
 assert.equal(env.GOMAXPROCS,'2');assert.equal(env.RAYON_NUM_THREADS,'1');
});
test('older receipts without an explicit native source retain the exact canonical default',()=>{
 const old={source:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',sourceTree:'e9165d7122361f809a267af1414b337b69097fe2'};
 assert.deepEqual(nativeAtlasIdentityForSource({},old),{atlas:'F:/VisibleMedicine/atlas',revision:old.source,tree:old.sourceTree});
 assert.equal(nativeAtlasEnvironment({...nativeAtlasIdentityForSource({},old),environment:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas'}}).GOMAXPROCS,'2');
});
for(const[label,edit]of[
 ['missing root',s=>delete s.atlas],['missing revision',s=>delete s.atlasHead],['missing tree',s=>delete s.atlasTree],
 ['relative root',s=>s.atlas='atlas'],['wrong revision',s=>s.atlasHead='0'.repeat(40)],['wrong tree',s=>s.atlasTree='0'.repeat(40)],
])test(label+' is refused before native execution',()=>{const bad={...source};edit(bad);assert.throws(()=>nativeAtlasIdentityForSource(bad,pin));});
test('actual Git identity and existing configured-root conflict remain enforced',()=>{
 assert.throws(()=>nativeAtlasEnvironment({atlas:'F:/VisibleMedicine/atlas',revision:pin.source,tree:pin.sourceTree,environment:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas'}}));
 assert.throws(()=>nativeAtlasEnvironment({...nativeAtlasIdentityForSource(source,pin),environment:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas'}}));
});
