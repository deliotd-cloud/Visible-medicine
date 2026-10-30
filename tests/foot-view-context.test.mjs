import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const producer=readFileSync(new URL('../scripts/prepare-foot-comparison-local.mjs',import.meta.url),'utf8');
const template=/const contextCode=(`[^`]*`);\r?\nconst contextAnchor=/.exec(producer)?.[1];
assert(template,'producer must emit the tested context code');
const revision='a'.repeat(64);
const emitted=Function('revision',`return ${template}`)(revision);
const base='/api/atlas-review/source-comparisons/foot/index.html?revision='+revision;
const links=[99,95].map(detail=>({href:base+'&detail='+detail,writes:0,addEventListener(){},setHref(value){this.writes++;this._href=value;},getHref(){return this._href??this.href;}}));
for(const link of links){Object.defineProperty(link,'href',{get:link.getHref,set:link.setHref});link._href=base+'&detail='+([99,95][links.indexOf(link)]);}
const inputs={bones:{checked:true},fade:{checked:false},wire:{checked:true}};
const location={hash:''};
const document={querySelectorAll:()=>links,querySelector:selector=>inputs[selector.slice(1)]};
const sandbox={location,document,side:'left',view:'x',selected:'FMA24508',
 camera:{position:{toArray:()=>[100,0,80]},up:{toArray:()=>[0,0,1]}},controls:{target:{toArray:()=>[0,0,0]}},
 encodeURIComponent,decodeURIComponent,JSON,Math,Number,Object,Array};
runInNewContext(emitted+';globalThis.context={readContext,writeContext};',sandbox);
const {readContext,writeContext}=sandbox.context;
const fragment=state=>'#vmfoot='+encodeURIComponent(JSON.stringify(state));
const validContext=()=>{writeContext();location.hash=links[0].href.slice(links[0].href.indexOf('#'));return readContext();};

test('emitted context roundtrips source view and keeps exact private link bases',()=>{
 writeContext();
 const first=links.map(link=>link.href);
 assert(first.every((href,i)=>href.startsWith(base+'&detail='+([99,95][i])+'#vmfoot=')));
 assert(first.every(href=>!href.slice(href.indexOf('#')+1).includes('&detail=')));
 location.hash=first[0].slice(first[0].indexOf('#'));
 const restored=readContext();
 assert.equal(restored.s,'left');assert.equal(restored.q,'x');assert.equal(restored.i,'FMA24508');
 assert.equal(restored.w,true);assert.equal(restored.c.p[0],100);
 writeContext();assert.deepEqual(links.map(link=>link.writes),[1,1]);
});

test('emitted parser rejects stale, extra, malformed and oversized fragments',()=>{
 const good=validContext();
 for(const state of [{...good,r:'b'.repeat(64)},{...good,extra:true},{...good,s:'bilateral'},{...good,q:'posterior'},{...good,b:'true'},{...good,i:12},{...good,c:{...good.c,p:[Infinity,0,80]}},{...good,c:{...good.c,p:[2001,0,80]}},{...good,c:{...good.c,p:[0,0,0]}},{...good,c:{...good.c,u:[0,0,0]}},{...good,c:{...good.c,extra:1}}]){
  location.hash=fragment(state);assert.equal(readContext(),null);
 }
 location.hash='#vmfoot=%7Bbad';assert.equal(readContext(),null);
 location.hash='#vmfoot='+ 'x'.repeat(1025);assert.equal(readContext(),null);
 location.hash='#other=1';assert.equal(readContext(),null);
});

const initLiteral=/const initAfter=("[^"\r\n]*");\r?\nassert\.equal\(viewer\.split\(initBefore\)/.exec(producer)?.[1];
assert(initLiteral,'producer must emit the tested initialization code');
const emittedInit=Function(`return ${initLiteral}`)();
function initializeViewer({width,height,restored=null}){
 const state={size:{width,height},fits:[],sizes:[],projectionUpdates:0,chosen:[],writes:0,presets:{},view:'x'};
 const camera={aspect:1,position:{value:[0,0,0],fromArray(value){this.value=[...value];}},up:{value:[0,0,1],fromArray(value){this.value=[...value];}},
  updateProjectionMatrix(){state.projectionUpdates++;},lookAt(){}};
 const controls={target:{value:[0,0,0],fromArray(value){this.value=[...value];}},update(){}};
 const inputs={side:{value:'left'},bones:{checked:false},fade:{checked:false},wire:{checked:false}};
 const sandbox={host:{getBoundingClientRect:()=>state.size},renderer:{setSize:(w,h)=>state.sizes.push([w,h])},camera,controls,meshes:[],side:'left',
  document:{querySelector:selector=>inputs[selector.slice(1)]},ResizeObserver:class{constructor(callback){state.resize=callback;}observe(){}},
  update(){},list(){},choose(mesh){state.chosen.push(mesh);},readContext:()=>restored,writeContext(){state.writes++;},
  fit(which=state.view){state.view=which;state.fits.push({which,aspect:camera.aspect});camera.position.value=['fit',camera.aspect];state.presets[which]=true;}};
 runInNewContext(emittedInit,sandbox);
 return {state,camera,controls,inputs,sandbox};
}

test('emitted initialization waits for first positive layout and never refits later resizes',()=>{
 const {state,camera}=initializeViewer({width:0,height:0});
 assert.equal(state.fits.length,0);
 state.size={width:800,height:400};state.resize();
 assert.deepEqual(state.fits,[{which:'x',aspect:2}]);
 camera.position.value=[7,8,9];
 state.size={width:400,height:400};state.resize();
 assert.deepEqual(camera.position.value,[7,8,9]);
 assert.equal(state.fits.length,1);
 assert.deepEqual(state.sizes,[[800,400],[400,400]]);
});

test('emitted initialization fits once at a positive initial layout',()=>{
 const {state,camera}=initializeViewer({width:600,height:300});
 assert.deepEqual(state.fits,[{which:'x',aspect:2}]);
 camera.position.value=[3,4,5];state.size={width:300,height:600};state.resize();
 assert.deepEqual(camera.position.value,[3,4,5]);
 assert.equal(state.fits.length,1);
});

test('emitted initialization preserves accepted camera through first positive layout',()=>{
 const restored={s:'right',q:'oblique',b:true,f:true,w:true,i:null,c:{p:[110,120,130],u:[0,0,1],t:[1,2,3]}};
 const {state,camera,controls,inputs,sandbox}=initializeViewer({width:0,height:0,restored});
 assert.deepEqual(camera.position.value,restored.c.p);
 assert.equal(state.presets.oblique,true);
 assert.equal(state.view,'oblique');
 assert.equal(sandbox.side,'right');
 assert.equal(inputs.side.value,'right');
 assert.equal(inputs.bones.checked,true);
 state.size={width:900,height:450};state.resize();
 state.size={width:450,height:900};state.resize();
 assert.deepEqual(camera.position.value,restored.c.p);
 assert.deepEqual(camera.up.value,restored.c.u);
 assert.deepEqual(controls.target.value,restored.c.t);
 assert.deepEqual(state.fits,[{which:'oblique',aspect:1}]);
});
