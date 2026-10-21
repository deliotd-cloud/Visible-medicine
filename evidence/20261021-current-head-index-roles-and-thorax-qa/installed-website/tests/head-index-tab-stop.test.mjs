import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {headIndexTabStop} from '../lib/head-index-keyboard.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const text=p=>read(p).toString();

test('empty results have no stop; default and selected results have one',()=>{
 assert.equal(headIndexTabStop([]),undefined);
 assert.equal(headIndexTabStop(['a','b']), 'a');
 assert.equal(headIndexTabStop(['a','b'],null,'b'),'b');
 assert.equal(headIndexTabStop(['a','b'],'missing','b'),'b');
 assert.equal(headIndexTabStop(['a','b'],'missing','missing'),'a');
});

test('focus wins without selecting; filtered-out focus uses the visible selection or first result',()=>{
 const ids=Object.freeze(['left:pons','right:pons','midbrain']);
 assert.equal(headIndexTabStop(ids,'right:pons','left:pons'),'right:pons');
 assert.equal(headIndexTabStop(ids.filter(id=>id!=='right:pons'),'right:pons','left:pons'),'left:pons');
 assert.equal(headIndexTabStop(['midbrain'],'right:pons','left:pons'),'midbrain');
 assert.deepEqual(ids,['left:pons','right:pons','midbrain']);
 assert.equal(headIndexTabStop(['Pons','pons'],'PONS','pons'),'pons','IDs are exact and case-sensitive');
});

test('117 MRI or 355 CT results each expose exactly one sequential Tab stop',()=>{
 for(const count of [1,117,355]){
  const ids=Array.from({length:count},(_,i)=>'structure:'+i);
  for(const focused of [undefined,ids.at(-1),'absent']){
   const stop=headIndexTabStop(ids,focused,ids[Math.floor(count/2)]);
   assert.equal(ids.filter(id=>id===stop).length,1);
   assert.equal(headIndexTabStop(ids,stop),stop,'Returning to the list retains the stop');
  }
 }
});

test('original arrow handler stays byte exact; only the pure Tab-stop helper is appended',()=>{
 const old=read('tests/fixtures/head-index-before-roving.ts.raw');
 assert.equal(sha(old),'1c92f41fbf1c23d1ba8a61c14105b5dc9d890c185eb9d4a1f9805f4de40039f4');
 const addition='\n/** One Tab stop in the current filtered results, without selecting anatomy.\n * The caller discards focused IDs from a different loaded study.\n */\nexport function headIndexTabStop(ids:readonly string[],focusedId?:string|null,selectedId?:string|null):string|undefined{\n  return ids.find(id=>id===focusedId)??ids.find(id=>id===selectedId)??ids[0];\n}\n';
 assert.equal(text('lib/head-index-keyboard.ts'),old.toString()+addition);
});

test('whole live viewer changes only focus state, result Tab stops and keyboard help',()=>{
 const old=read('tests/fixtures/head-viewer-before-roving.tsx.raw');
 assert.equal(sha(old),'25eeb4ecb80f16d801aaf32ee7923d571928b2bd6476a3eac1a916b17cfdc6c1');
 let inverse=text('tests/fixtures/head-viewer-before-filtered-layout.tsx.raw');
 const one=(from,to)=>{assert.equal(inverse.split(from).length,2,from);inverse=inverse.replace(from,to);};
 one("import {headIndexKey,headIndexTabStop}","import {headIndexKey}");
 one('  const [indexFocus,setIndexFocus]=useState<{study:LoadedStudy;id:string}|null>(null);\n','');
 one('  const indexTabStop=headIndexTabStop(entries.map(row=>row.entry.id),indexFocus&&indexFocus.study===study?indexFocus.id:undefined,activeId);\n','');
 one(' data-head-index-search aria-controls="head-index-list"',' data-head-index-search');
 one('The results use one Tab stop; Tab then continues to the image tools. From search, Down or Up enters the results. In results, arrow keys browse, Home and End reach the first and last result, Enter or Space selects, and Escape returns to search. Browsing alone does not select a structure.',
  'From search, Down or Up enters the results. In results, arrow keys browse, Home and End reach the first and last result, Enter or Space selects, and Escape returns to search. Tab moves normally. Browsing alone does not select a structure.');
 one('<div id="head-index-list" className="head-structure-list" role="group" aria-label="Structure results" data-head-index-list>',
  '<div className="head-structure-list" data-head-index-list>');
 one(' tabIndex={entry.id===indexTabStop?0:-1} onFocus={()=>{if(study)setIndexFocus({study,id:entry.id});}}','');
 assert.equal(inverse,old.toString(),'All masks, study selection, cursor, native buttons, quiz hiding and scoring remain exact');
});

test('historical disclosure proof keeps its complete executable body with one frozen-context seam',()=>{
 const old=read('tests/fixtures/head-disclosure-test-before-roving.mjs.raw');
 assert.equal(sha(old),'4ca6ed81c2696afeeea343bf735a78d2a73b9a61bb2b339f16d045224d26d460');
 const from="new URL('../components/HeadAtlasViewer.tsx',import.meta.url)";
 assert.equal(old.toString().split(from).length,2);
 assert.equal(text('tests/head-viewer-disclosure-keyboard.test.mjs'),old.toString().replace(from,"new URL('./fixtures/head-viewer-before-roving.tsx.raw',import.meta.url)"));
});

test('current delivery retains every prior assertion outside the one-input count and historical context seams',async()=>{
 const old=read('tests/fixtures/current-delivery-test-before-roving.mjs.raw');
 assert.equal(sha(old),'28c42d029791da37a1b4060ff3dfc533b5beba1a5f246887822a38671f9ce5ce');
 const from="const current=read('tests/current-atlas-delivery.test.mjs').toString();";
 assert.equal(old.toString().split(from).length,2);
 const expected=old.toString().replace('assert.equal(sourceFiles,1548);assert.equal(inputs,1695);assert(artifacts>100);','assert.equal(sourceFiles,1548);assert.equal(inputs,1696);assert(artifacts>100);')
  .replace(from,"const current=read('tests/fixtures/current-delivery-test-before-roving.mjs.raw').toString();");
 assert.equal(sha(Buffer.from(expected)),'e3eea7022e2154634b51f44d5d94a9dc9701ee9fb527f7c6f412f1aa7cdd169f','Exact post-roving historical test source');
 assert.notEqual(text('tests/current-atlas-delivery.test.mjs'),expected,'Current delivery is a later source epoch');
 const pinBytes=read('tests/fixtures/current-delivery-before-roving.json');
 assert.equal(sha(pinBytes),'012b360153883660e1e09634ec319ec67e2e27b951ce2da9ba864d75d8dfe9c1');
 const {validateCurrentAtlasDelivery}=await import('./current-atlas-delivery.mjs');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:JSON.parse(pinBytes)}),'Old Review binding cannot admit changed keyboard behavior');
});
