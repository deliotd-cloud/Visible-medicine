import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const stage=dirname(fileURLToPath(import.meta.url));
const candidate=process.argv[2];
assert(candidate,'Pass the unchanged V5 website path');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=['deep-plantar-current-transition.test.mjs','head-native-history-current-transition.test.mjs',
 'lacrimal-current-transition.test.mjs','head-history-role-preservation.test.mjs'];
const once=(s,from,to)=>{assert.equal(s.split(from).length,2,'Unique inverse seam: '+from.slice(0,75));return s.replace(from,to);};
const raw=name=>readFileSync(join(stage,'RAW','tests',name));
const code=name=>readFileSync(join(stage,'CODE','tests',name));
for(const name of names)assert.deepEqual(raw(name),readFileSync(join(candidate,'tests',name)),'V5 preimage '+name);

function inverse(name,s){
 if(name.startsWith('deep-plantar')||name.startsWith('lacrimal')){
  const which=name.startsWith('deep-plantar')?'50':'51';
  s=once(s,"import {readRevision53} from './historical-head-manual-recovery-delivery-53.mjs';\n",'');
  const start=s.indexOf("const historicalCssPath='app/atlas/head-neck-3d/head-learning.css';");
  const end=s.indexOf('const validateCurrentAtlasDelivery=',start);
  assert(start>0&&end>start);
  const block=s.slice(start,end);
  assert.match(block,new RegExp("readRevision"+which+"\\('atlas-review/integration-inputs.json'\\)"));
  assert.match(block,/readRevision53\(path\)/);
  assert.match(block,/assert\.deepEqual\(current\.subarray\(0,historical\.length\),historical/);
  s=once(s,block,`const read=path=>readRevision${which}(path),json=path=>JSON.parse(read(path));\n`);
 }else if(name.startsWith('head-native')){
  s=once(s,"test('actual current6d7 delivery retains independent 190a runtimes without treating closed53 as current'", "test('actual current190 delivery remains independently bound without treating closed53 as current'");
  s=once(s,"const live=validateLiveAtlasDelivery();assert.equal(live.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');assert.equal(live.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');assert.equal(live.reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');assert.equal(live.reviewSourceFiles,1558);",
   "const live=validateLiveAtlasDelivery();assert.equal(live.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(live.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');assert.equal(live.reviewIntegration,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');assert.equal(live.reviewSourceFiles,1553);");
  s=once(s," assert.equal(live.runtimeSources['head-neck'],live.source);for(const module of ['shoulder','lower-limb','female-pelvis'])assert.equal(live.runtimeSources[module],'190a63238eadcf906abe89dcbb6a67c88afe70b9',module+' retained runtime source');\n",'');
 }else{
  const from=s.indexOf(' currentLive:`');
  const to=s.indexOf('`,\n};',from);
  assert(from>0&&to>from);
  const block=s.slice(from,to+3);
  const target=code('head-native-history-current-transition.test.mjs').toString();
  const original=raw('head-native-history-current-transition.test.mjs').toString();
  const actual=block.slice(' currentLive:`'.length,-3);
  const liveStart=target.indexOf("test('actual current6d7 delivery");
  const liveEnd=target.indexOf('\n});',liveStart)+4;
  assert.equal(actual.replaceAll('\\\\','\\'),target.slice(liveStart,liveEnd)+'\n','Current role appendix matches complete new runtime test');
  assert.match(original,/actual current190 delivery remains independently bound/);
  s=once(s,block,'');
  s=once(s,'  text=once(text,appendix.currentLive,appendix.live);\n','');
 }
 return s;
}
for(const name of names){
 const original=raw(name).toString();
 assert.equal(inverse(name,code(name).toString()),original,'Whole CODE to V5 inverse: '+name);
 assert.notEqual(inverse(name,code(name).toString()+'\n// forged mutation'),original,'Mutation refusal: '+name);
 console.log('inverse',name,sha(raw(name)),sha(code(name)));
}
const tests=pathToFileURL(join(candidate,'tests')+'/').href;
const {readRevision50,validateRevision50Delivery}=await import(new URL('historical-lacrimal-delivery-50.mjs',tests));
const {readRevision51,validateRevision51Delivery}=await import(new URL('historical-radial-eus-delivery-51.mjs',tests));
const {readRevision53,validateRevision53Delivery}=await import(new URL('historical-head-manual-recovery-delivery-53.mjs',tests));
const {validateCurrentAtlasDelivery}=await import(new URL('current-atlas-delivery.mjs',tests));
for(const [revision,read] of [[50,readRevision50],[51,readRevision51]]){
 const inputs=JSON.parse(read('atlas-review/integration-inputs.json')).inputs;
 let fallback=0;
 for(const row of inputs){
  let bytes=read(row.path);
  if(sha(bytes)!==row.sha256){bytes=readRevision53(row.path);fallback++;}
  assert.equal(sha(bytes),row.sha256,`Frozen${revision} input: ${row.path}`);
 }
 console.log('frozen-inputs',revision,inputs.length,'exact-fallbacks',fallback);
}
const css=readFileSync(join(candidate,'app/atlas/head-neck-3d/head-learning.css'));
const priorCss=readRevision53('app/atlas/head-neck-3d/head-learning.css');
assert.equal(sha(css),'70eb06e2246820bf4b752aa857a4ddeb67f105bfe31361469bd9cb81afd5db83');
assert.equal(sha(priorCss),'3a3117cdcb03a50c1bb42992d036139e22366fefd76d00283c5c57c7e46f9767');
assert.deepEqual(css.subarray(0,priorCss.length),priorCss);
assert.throws(()=>readRevision53('../escape'));
assert.throws(()=>readRevision50('../escape'));
assert.throws(()=>readRevision51('../escape'));
const live=validateCurrentAtlasDelivery();
assert.equal(live.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(live.runtimeSources['head-neck'],live.source);
for(const module of ['shoulder','lower-limb','female-pelvis'])assert.equal(live.runtimeSources[module],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
for(const previous of [validateRevision50Delivery(),validateRevision51Delivery(),validateRevision53Delivery()])assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}));
console.log('current-family-and-stale-pin-refusals',live.source,live.reviewIntegration);
