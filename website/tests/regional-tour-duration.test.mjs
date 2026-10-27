import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';

const require=createRequire(import.meta.url);
const React=require('react');
const shim={...React,useState(initial){return [typeof initial==='function'?initial():initial,()=>{}];},useRef(){return {current:null};}};
const catalogueBundle=await build({stdin:{contents:`
  export {regionalLearningCatalogue} from './lib/regional-learning-catalogue';
  export {regionalTours} from './atlas-review/lib/regional-tours';
  export {guidedPlaybackDuration} from './atlas-review/lib/guided-playback';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(catalogueBundle.outputFiles[0].text).toString('base64'));
const componentBundle=await build({stdin:{contents:"export {RegionalLearningCatalogue} from './components/RegionalLearningCatalogue';",resolveDir:process.cwd(),loader:'tsx'},
  bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'}});
const scope={exports:{}};
runInNewContext(componentBundle.outputFiles[0].text,{URL,URLSearchParams,module:scope,exports:scope.exports,require:name=>name==='react'?shim:require(name)});
const {RegionalLearningCatalogue}=scope.exports;
const walk=(node,predicate,out=[])=>{if(React.isValidElement(node)){if(predicate(node))out.push(node);React.Children.forEach(node.props.children,child=>walk(child,predicate,out));}return out;};
const words=node=>typeof node==='string'||typeof node==='number'?String(node):!node?'':Array.isArray(node)?node.map(words).join(''):words(node.props?.children);
const rowText=tree=>walk(tree,node=>node.type==='div'&&node.props.className==='regional-learning-catalogue-rowhead').map(words);
const render=catalogue=>RegionalLearningCatalogue({catalogue});

test('all admitted regional tours use the native continuous playback policy and project only duration',()=>{
  const catalogue=api.regionalLearningCatalogue();
  assert.equal(catalogue.available,true);
  assert.equal(catalogue.unavailableTours,0);
  assert.equal(catalogue.tours.length,54);
  assert.deepEqual(catalogue.tours.map(t=>t.id),api.regionalTours.map(t=>t.id));
  for(const [index,tour] of catalogue.tours.entries()){
    const source=api.regionalTours[index];
    const expected=source.steps.reduce((sum,step)=>sum+api.guidedPlaybackDuration(step.caption,step.durationMs,1),0);
    assert.equal(tour.continuousPlaybackMs,expected,tour.id);
    assert.deepEqual(Object.keys(tour).sort(),['id','title','description','revision','regionId','regionLabel','href','limitations','steps','continuousPlaybackMs'].sort());
    assert(tour.steps.every(step=>Object.keys(step).sort().join(',')==='structureName,title'));
  }
  assert.equal(api.guidedPlaybackDuration('short',14000,1),24000);
  assert(api.guidedPlaybackDuration('long '.repeat(100),14000,1)>24000);
  assert.equal(api.guidedPlaybackDuration('short',90000,1),90000);
  const serialized=JSON.stringify(catalogue);
  for(const field of ['caption','durationMs','selectedId','view','frameIds','positions_file','bounds','anchor','mask'])
    assert(!serialized.includes('"'+field+'":'),field);
});

test('component rounds valid durations and leaves legacy or malformed tour rows and links usable',()=>{
  const base=api.regionalLearningCatalogue();
  const first=base.tours[0];
  const durations=[60001,60000,1,0,-1,NaN,Infinity,86400001,undefined,1.5,Number.MAX_SAFE_INTEGER];
  for(const duration of durations){
    const tour={...first};
    if(duration===undefined)delete tour.continuousPlaybackMs;else tour.continuousPlaybackMs=duration;
    const tree=render({...base,tours:[tour]});
    const row=rowText(tree)[0];
    const expected=duration===60001?'About 2 min at 1×':duration===60000||duration===1?'About 1 min at 1×':null;
    assert.equal(row.includes('About'),expected!==null,String(duration));
    if(expected)assert(row.includes(expected));
    assert.equal(walk(tree,node=>node.type==='a').length>0,true);
    assert(words(tree).includes('1 matching tour'));
  }
  const tree=render({...base,tours:[{...first,continuousPlaybackMs:86400000}]});
  assert(rowText(tree)[0].includes('About 1440 min at 1×'));
  assert(words(tree).includes('Loading, pauses and extra reading are not included.'));
});
