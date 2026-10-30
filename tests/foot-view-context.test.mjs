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
