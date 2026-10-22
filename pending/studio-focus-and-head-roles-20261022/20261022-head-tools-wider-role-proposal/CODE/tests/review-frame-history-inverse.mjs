import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export const sha=value=>createHash('sha256').update(value).digest('hex');
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
export function once(value,from,to){assert.equal(value.split(from).length,2,`Exact source seam: ${from.slice(0,90)}`);return value.replace(from,to);}
function span(value,start,end){
 const at=value.indexOf(start),stop=value.indexOf(end,at+start.length);
 assert(at>=0&&stop>at&&value.indexOf(start,at+1)<0,`Exact bounded source span: ${start}`);
 return value.slice(at,stop);
}
function restore(current,prior,spans){
 for(const [currentStart,priorStart,end] of spans)current=once(current,span(current,currentStart,end),priorStart===null?'':span(prior,priorStart,end));
 return current;
}

export function beforeCompactBinder(current){
 assert.equal(sha(current),'0339eedafdc65e60fb35efd7f59c839a57afa274966c405e4b373f8722f95d06');
 const liveStart='  // Source-bound read-only live learning presentation. It cannot focus scans.\n';
 const liveEnd='  // Bind every native streamlined worksheet as well as the imported editors.';
 assert.equal(span(current,liveStart,liveEnd),`${liveStart}  'components/AtlasRuntimeFrame.tsx','components/AtlasBodyLearning.tsx','components/atlas-body-learning.css','lib/atlas-body-learning-selection.ts',\n  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',\n`);
 return once(current,span(current,liveStart,liveEnd),'');
}

export function beforeCompactDeliveryTest(current){
 current=once(current,'assert.equal(sourceFiles,1558);assert.equal(inputs,1724);assert(artifacts>100);',
  'assert.equal(sourceFiles,1558);assert.equal(inputs,1723);assert(artifacts>100);');
 assert.equal(sha(current),'b0f078527cdb040ce7afa105bc0db9ebb979be590757ce7e749583eaed0f0045');
 const prior=once(read('./fixtures/head-review-compact/current-atlas-delivery.test.mjs.raw'),
  'assert.equal(sourceFiles,1553);assert.equal(inputs,1711);assert(artifacts>100);',
  'assert.equal(sourceFiles,1553);assert.equal(inputs,1712);assert(artifacts>100);');
 current=restore(current,prior,[
  [" assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"," assert.equal(CURRENT_ATLAS_REVISION,'190a63238eadcf906abe89dcbb6a67c88afe70b9');",' assert.equal(pin.reviewIntegration,'],
  [' assert.equal(sourceFiles,1558);assert.equal(inputs,1723);',' assert.equal(sourceFiles,1553);assert.equal(inputs,1712);','});\n\nfor(const [label,edit]of ['],
  [" ['malformed tree',p=>{p.sourceTree='HEAD';}],"," ['malformed tree',p=>{p.sourceTree='HEAD';}],",'for(const [label,path,edit]of ['],
 ]);
 assert.equal(current,prior,'Complete compact-era delivery source, including every refusal, survives');
 return current;
}

export function beforeExpansionFrame(current){
 assert.equal(sha(current),'985e27e17c8b4cd3ae76f51b8c4fc0f731111b1afff5111cb701cbca40acedbc');
 const prior=read('./fixtures/review-frame-history/atlas-runtime-frame-body-learning.raw');
 assert.equal(sha(prior),'0d5edad796ce655f1f62da7ea06c08a3a541f110606d5b1cbb87d2b07d782e97');
 current=restore(current,prior,[
  ['  const body = {};\n  const doc =','  const body = {};\n  globalThis.document =','  globalThis.window = {'],
  ['    if (instanceToRetire?.frame)','    if (instanceToRetire?.frame)','  }\n  function flush'],
  ['      child = instance(childElement.type, childElement.key);','      child = instance(childElement.type, childElement.key);','    }\n    element = render'],
  ['    const learningTree=render(learning,learningElement.props);','    const learningTree=render(learning,learningElement.props);','    beforeEffects?.'],
  ['    commit(child);','    commit(child);','  }\n  return {'],
  ['    retry({focused = true, beforeCommit} = {}) {','    retry({focused = true, beforeCommit} = {}) {','      const button = actions.props.children[0];'],
  ["    assert.equal(view.help.props.children[0].type, 'summary');","    assert.equal(view.help.props.children[0].type, 'summary');",'    const actions = view.help.props.children[2];'],
  ["test('same-tab expansion preserves the mounted frame and its learning session through restore'",null,"test('the exact static index document may canonicalize"],
 ]);
 assert.equal(current,prior,'Complete pre-expansion live-learning source survives');
 return current;
}

export function beforeLoadingPin(currentBytes){
 assert.equal(sha(currentBytes),'a023587c2bfd645d92e809265b80c6fc24e4b17b6d973623eef110b7c25a340d','Exact current head-tools pin');
 const headTools=JSON.parse(currentBytes);
 const historicalBytes=read('./fixtures/current-delivery-before-head-tools-20261022.json');
 assert.equal(sha(historicalBytes),'422a105495609f03a1e20660716406c737e1a14337843ed61d084bf95c7c7bed','Exact prior head-tools pin');
 const current=JSON.parse(historicalBytes),inverse=structuredClone(headTools);
 assert.equal(headTools.reviewIntegration,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');
 assert.equal(current.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
 const changed=Object.keys(headTools.documents).filter(path=>headTools.documents[path]!==current.documents[path]).sort();
 assert.deepEqual(changed,['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
 inverse.reviewIntegration=current.reviewIntegration;
 for(const path of changed)inverse.documents[path]=current.documents[path];
 assert.deepEqual(inverse,current,'Only authenticated head-tools Review documents and binding change');
 const prior=structuredClone(current);
 assert.equal(current.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
 prior.reviewIntegration='4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99';
 for(const [path,currentHash,priorHash] of [
  ['atlas-review/integration-inputs.json','58b0fd76cdfd582e1485403d15723ea0171c4a362b4ee1b65d1a2e5e4140380e','c136508192af14abc18c612daf2d5881e7c42bf642a84ffaca1f75dc8b54e66e'],
  ['atlas-review/manifest.json','301cd268ee85faf63322242edb94ccc28348cca4e10fc18f9baebae19cb55566','c79636d7bef0eb7c85ee4b1a4c9eab9831e9e13ea7479747e9ecf1269f04114e'],
  ['public/atlas-review-viewer/manifest.json','de022aa71854818baf118b5826030d38e955a0ee54d317706340a560760113a2','d1b12779596d73c01ffeb5ed71078e13de51d8470b693021a8a73ab52bf9f7b0'],
 ]){
  assert.equal(current.documents[path],currentHash,`Exact loading-bound document: ${path}`);
  prior.documents[path]=priorHash;
 }
 assert.equal(sha(Buffer.from(JSON.stringify(prior,null,2)+'\n')),'db46c1722ed839a4c8a57bd9bad4028dd90f5cb765641172ab4cdc9581e0d80f');
 return prior;
}

export function beforeCompactPin(currentBytes){
 const current=beforeLoadingPin(currentBytes);
 const priorBytes=read('./fixtures/review-frame-history/current-atlas-delivery-1712.json.raw');
 assert.equal(sha(priorBytes),'a3cc2b4f72a2eae0d66cd25b1693c38e5c6cd49250f275dc18ef80d4283c9e21');
 const prior=JSON.parse(priorBytes),inverse=structuredClone(current);
 assert.deepEqual(Object.keys(current).filter(key=>key!=='documents'&&JSON.stringify(current[key])!==JSON.stringify(prior[key])).sort(),
  ['reviewIntegration','reviewSourceFiles','runtimeSources','schema','source','sourceTree']);
 const changed=Object.keys(current.documents).filter(path=>current.documents[path]!==prior.documents[path]).sort();
 assert.deepEqual(changed,['atlas-review/integration-inputs.json','atlas-review/manifest.json','lib/atlas-model-inventory.json','public/atlas-review-viewer/manifest.json','public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/head-neck/source-inputs.json'].sort());
 for(const key of ['schema','source','sourceTree','reviewIntegration','reviewSourceFiles'])inverse[key]=prior[key];
 delete inverse.runtimeSources;
 for(const path of changed)inverse.documents[path]=prior.documents[path];
 assert.deepEqual(inverse,prior,'Exact later pin fields invert to the complete compact-era receipt');
 return prior;
}

export function compactInputs(){
 const bytes=read('./fixtures/review-frame-history/integration-inputs-1712.json.raw');
 assert.equal(sha(bytes),'01432a5743392a32f79b9ace1b5ac64b49bd8f711cbae63c2443ea98e1c50641');
 const inputs=JSON.parse(bytes);assert.equal(inputs.inputs.length,1712);
 return inputs;
}

export function beforeProposedNavigation(current){
 assert.equal(sha(current),'326b425f1d529b590eaa345f94a9dd440ed2bcfe5fbbb19dcb918048a002b995');
 current=once(current,' assert.equal(currentBinding.inputs.length,1724);assert.equal(currentBinding.sourceCommit,current.source);',
  ' assert.equal(currentBinding.inputs.length,1723);assert.equal(currentBinding.sourceCommit,current.source);');
 assert.equal(sha(current),'e89390f4aa8ebf4c8c709f6d6b78e9400e79e0dca7a16e58eea4de371dd8b144');
 current=once(current,"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",'');
 current=once(current,"import {beforeCompactDeliveryTest,beforeCompactPin,compactInputs} from './review-frame-history-inverse.mjs';\n",'');
 current=once(current,"const actual=beforeCompactDeliveryTest(read('tests/current-atlas-delivery.test.mjs').toString()),seam=", "const actual=read('tests/current-atlas-delivery.test.mjs').toString(),seam=");
 current=once(current," const current=validateCurrentAtlasDelivery(),currentBinding=JSON.parse(read('atlas-review/integration-inputs.json'));\n assert.equal(currentBinding.inputs.length,1723);assert.equal(currentBinding.sourceCommit,current.source);\n",'');
 current=once(current,"now=beforeCompactPin(read('tests/fixtures/current-atlas-delivery.json'))", "now=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'))");
 current=once(current,' const binding=compactInputs();',' const binding=JSON.parse(read(\'atlas-review/integration-inputs.json\'));');
 const original=read('./fixtures/review-frame-history/review-navigation-delivery-v5.raw');
 assert.equal(sha(original),'aa78cc90a446a70f436ff161e7f2e506d257f7463442e63c9a470a0348d6aa9a');
 assert.equal(current,original,'Complete V5 navigation test source and old assertions survive');
 return current;
}
