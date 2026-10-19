import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';

function fixture({connected=true,open=true,summaryConnected=true,nearest=true,summaryPresent=true}={}){
 const calls=[];
 const summary=summaryPresent?{isConnected:summaryConnected,focus:options=>calls.push(['focus',options])}:null;
 const details={isConnected:connected,open,querySelector(selector){calls.push(['query',selector]);return summary;}};
 const target={closest(selector){calls.push(['closest',selector]);return nearest?details:{open:true};}};
 const event={key:'Escape',defaultPrevented:false,nativeEvent:{isComposing:false,keyCode:27},currentTarget:details,target,
  preventDefault(){calls.push(['prevent']);this.defaultPrevented=true;},stopPropagation(){calls.push(['stop']);}};
 return {calls,details,summary,event};
}

test('real helper closes only a live, open, innermost disclosure and focuses its own summary',()=>{
 const f=fixture();
 assert.equal(headDisclosureKeyDown(f.event),true);
 assert.equal(f.details.open,false);
 assert.deepEqual(f.calls,[['closest','details'],['query',':scope > summary'],['prevent'],['stop'],['focus',{preventScroll:true}]]);
 assert.equal(headDisclosureKeyDown(f.event),false,'closed/repeated Escape does nothing');
});

test('other keys, handled Escape, IME and non-open or detached targets are inert',()=>{
 for(const edit of [
  f=>{f.event.key='Enter';},
  f=>{f.event.defaultPrevented=true;},
  f=>{f.event.nativeEvent.isComposing=true;},
  f=>{f.event.nativeEvent.keyCode=229;},
  f=>{f.details.open=false;},
  f=>{f.details.isConnected=false;},
  f=>{f.summary.isConnected=false;},
  f=>{f.event.target=null;},
 ]){
  const f=fixture();edit(f);
  assert.equal(headDisclosureKeyDown(f.event),false);
  assert.equal(f.calls.some(([name])=>['prevent','stop','focus'].includes(name)),false);
 }
 const noSummary=fixture({summaryPresent:false});
 assert.equal(headDisclosureKeyDown(noSummary.event),false);
 assert.equal(noSummary.details.open,true);
});

test('nested Escape is consumed by inner details only; parent and unrelated targets stay open',()=>{
 const inner=fixture(),outer=fixture();
 const event=inner.event;
 assert.equal(headDisclosureKeyDown(event),true);
 event.currentTarget=outer.details;
 assert.equal(headDisclosureKeyDown(event),false,'already handled event cannot close ancestor');
 assert.equal(inner.details.open,false);assert.equal(outer.details.open,true);
 assert.equal(outer.calls.length,0);
 const foreign=fixture({nearest:false});
 assert.equal(headDisclosureKeyDown(foreign.event),false);
 assert.equal(foreign.details.open,true);
 assert.equal(foreign.calls.some(([name])=>['prevent','stop','focus'].includes(name)),false);
});

test('whole QA component is preserved outside the one import and eight declared details-tag seams',()=>{
 const original=readFileSync(new URL('./fixtures/head-atlas-viewer-before-disclosure.txt',import.meta.url),'utf8');
 const candidate=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
 const imported="import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard';\n";
 assert.equal(candidate.split(imported).length-1,1);
 const tags=[
  '<details className="head-display-settings head-keyboard-settings"',
  '<details><summary>Manual folder help',
  '<details className="head-overlay-settings"><summary>More filters',
  '<details className="head-overlay-settings"><summary>Overlay groups',
  '<details><summary>Individual visibility &amp; opacity',
  '<details><summary>Comparison limits',
  '<details><summary>Representation limits',
  '<details className="head-display-settings"><summary>Display settings',
 ];
 for(const oldTag of tags){
  assert.equal(original.split(oldTag).length-1,1,`original tag: ${oldTag}`);
  const marker=' onKeyDown={headDisclosureKeyDown}';
  const newTag=oldTag.includes('className=')
    ?oldTag.includes('><summary')?oldTag.replace('><summary',marker+'><summary'):oldTag+marker
    :oldTag.replace('<details>','<details'+marker+'>');
  assert.equal(candidate.split(newTag).length-1,1,`candidate tag: ${oldTag}`);
 }
 assert.equal(candidate.split(' onKeyDown={headDisclosureKeyDown}').length-1,8);
 assert.equal(candidate.replace(imported,'').replaceAll(' onKeyDown={headDisclosureKeyDown}',''),original);
});
