import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import regionalManifest from '../public/atlas-runtime/head-neck/manifest.json' with {type:'json'};
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';
import {HEAD_FOCUS_PROTOCOL,headFocusResult} from '../lib/head-guided-focus.ts';
import {headInlineDestination,headInlineMatches,headInlineReverseConcept} from '../lib/head-inline-comparison.ts';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';

type InlineHarness={
  flush:()=>any;frame:()=>any;status:()=>string;button:(label:string)=>any;link:(href:string)=>any;session:()=>string;command:()=>any;playback:()=>any[];
  selected:(conceptId:string,sequence:number,sessionId?:string)=>any;
  deliver:(data:unknown,from?:string,source?:any)=>void;
  ack:(number:number,status?:'accepted'|'refused',sessionId?:string)=>any;
  update:(next:Record<string,unknown>)=>void;reload:()=>void;focusCount:()=>number;expire:()=>void;
  sourceRevision:string;
};

function withInlineFrame(run?:(h:InlineHarness)=>void){
  const require=createRequire(import.meta.url),origin='https://atlas.example.test',sourceRevision=regionalManifest.sourceCommit;
  const source=readFileSync(new URL('../components/HeadAtlasInlineComparison.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const listeners=new Set<(event:any)=>void>(),timers=new Map<number,()=>void>(),sent:any[]=[];
  const playback:any[]=[];
  let timerId=0,uuid=0,cursor=0,dirty=true,tree:any,props:any={conceptId:'brainstem-pons',revision:HEAD_LINK_REVISION,modality:'CT',onSelectConcept:()=>{},onClose:()=>{},onPlaybackStatus:(value:any)=>playback.push(value)};
  const mockWindow={location:{origin},setTimeout(callback:()=>void){timers.set(++timerId,callback);return timerId;},clearTimeout(id:number){timers.delete(id);},
    addEventListener(_name:string,listener:(event:any)=>void){listeners.add(listener);},removeEventListener(_name:string,listener:(event:any)=>void){listeners.delete(listener);}};
  const oldWindow=(globalThis as any).window,oldCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'window',{configurable:true,value:mockWindow});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`inline-session-${++uuid}-abcd`}});
  const slots:any[]=[],effects=new Map<number,{deps:unknown[];cleanup?:()=>void}>(),pending:Array<()=>void>=[];
  const same=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const effect=(create:()=>void|(()=>void),deps?:unknown[])=>{const i=cursor++,old=effects.get(i);if(!deps||!same(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps:deps??[],cleanup:typeof cleanup==='function'?cleanup:undefined});});};
  const hooks={useRef(initial:unknown){const i=cursor++;return slots[i]??(slots[i]={current:initial});},
    useState(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],(next:any)=>{const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];},
    useEffect:effect,useLayoutEffect:effect};
  const imports:Record<string,unknown>={react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),
    '../lib/head-live-selection.ts':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},
    '../lib/head-guided-focus.ts':{HEAD_FOCUS_PROTOCOL,headFocusResult},
    '../lib/head-inline-comparison.ts':{headInlineDestination,headInlineMatches,headInlineReverseConcept},
    '../lib/head-disclosure-keyboard.ts':{headDisclosureKeyDown}};
  const mod={exports:{} as {HeadAtlasInlineComparison:(props:any)=>any}};
  new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
  const frameWindow={postMessage(packet:unknown,target:string){assert.equal(target,origin);sent.push(packet);}};
  function walk(node:any,predicate:(value:any)=>boolean):any{if(Array.isArray(node))return node.map(value=>walk(value,predicate)).find(Boolean);if(!node||typeof node!=='object'||!('props'in node))return;return predicate(node)?node:walk(node.props.children,predicate);}
  function flush(){let count=0,outer:any;do{assert(++count<20);dirty=false;cursor=0;pending.length=0;outer=mod.exports.HeadAtlasInlineComparison(props);tree=outer.type(outer.props);
    const frame=walk(tree,value=>value.type==='iframe');assert(frame);frame.props.ref.current={contentWindow:frameWindow};for(const effect of pending)effect();}while(dirty);return outer;}
  function frame(){return walk(tree,value=>value.type==='iframe');}
  function status(){return String(walk(tree,value=>value.props.role==='status')?.props.children);}
  function button(label:string){return walk(tree,value=>value.type==='button'&&[value.props.children].flat(Infinity).join('').includes(label));}
  function link(href:string){return walk(tree,value=>value.type==='a'&&value.props.href===href);}
  function session(){return String(sent.filter(value=>value.type===HEAD_SELECTION_PROTOCOL+'-request').at(-1)?.session);}
  function command(){return sent.filter(value=>value.type===HEAD_FOCUS_PROTOCOL).at(-1);}
  function selected(conceptId:string,sequence:number,sessionId=session()){
    const q=new URL(headConceptById(conceptId)!.atlasHref,'https://atlas.invalid').searchParams,nested=q.get('study')==='2',id=q.get(nested?'part':'structure')!;
    return {type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session:sessionId,sequence,status:'selected',selection:{kind:nested?'nested':'root',id,
      source:q.get(nested?'partSource':'source'),laterality:id.split(':')[4],...(nested?{parentId:q.get('structure'),parentSource:q.get('source'),study:q.get('detail')}:{})}};
  }
  function deliver(data:unknown,from=origin,source:any=frameWindow){for(const listener of [...listeners])listener({data,origin:from,source});flush();}
  function ack(number:number,status:'accepted'|'refused'='accepted',sessionId=session()){return {type:HEAD_FOCUS_PROTOCOL+'-result',version:1,revision:sourceRevision,session:sessionId,command:number,status};}
  try{
    if(run){
      run({flush,frame,status,button,link,playback:()=>playback,session,command,selected,deliver,ack,sourceRevision,
        update(next){props={...props,...next};flush();},
        reload(){const current=frame();current.props.onLoad({currentTarget:current.props.ref.current});flush();},
        focusCount:()=>sent.filter(value=>value.type===HEAD_FOCUS_PROTOCOL).length,
        expire(){const callback=[...timers.values()].at(-1);assert(callback);callback();flush();}});
      return;
    }
    const first=flush(),initialSrc=frame().props.src;
    assert.equal(first.key,headInlineDestination('brainstem-pons',HEAD_LINK_REVISION,'CT')!.scope);
    frame().props.onLoad({currentTarget:frame().props.ref.current});flush();
    deliver(selected('brainstem-pons',1));assert.match(status(),/Pons is selected/);
    props={...props,conceptId:'brainstem-midbrain'};const second=flush();
    assert.equal(second.key,first.key);assert.equal(frame().props.src,initialSrc);assert.equal(command()?.command,1);
    assert.equal(command()?.target.id,headInlineDestination('brainstem-midbrain',HEAD_LINK_REVISION,'CT')!.target.id);
    assert.match(status(),/waiting to confirm/);
    deliver(selected('brainstem-midbrain',2));assert.match(status(),/waiting to confirm/,'matching snapshot before ACK is insufficient');
    props={...props,conceptId:'brainstem-medulla'};flush();assert.equal(command()?.command,2);
    deliver(ack(1));assert.match(status(),/waiting to confirm/,'old ACK is ignored');
    deliver(ack(2));assert.match(status(),/waiting to confirm/,'ACK alone is insufficient');
    deliver(selected('brainstem-midbrain',3));assert.match(status(),/waiting to confirm/);
    deliver(selected('brainstem-medulla',4));assert.match(status(),/Medulla oblongata is selected/);
    deliver(selected('brainstem-pons',5));assert.match(status(),/differs from Medulla oblongata/);
    assert.equal(sent.filter(value=>value.type===HEAD_FOCUS_PROTOCOL).length,2,'manual model selection is not overwritten');
    const oldReverse=button('Show Pons on CT');assert(oldReverse);
    props={...props,conceptId:'brainstem-midbrain',selectionReady:false};flush();oldReverse.props.onClick();
    assert.equal(frame().props.src,initialSrc);assert.match(status(),/selected scan annotation is not ready/);
    assert.equal(sent.filter(value=>value.type===HEAD_FOCUS_PROTOCOL).length,2,'unready scan sends no command');
    deliver(selected('brainstem-pons',6));assert.match(status(),/selected scan annotation is not ready/,'old model snapshot cannot confirm an unready scan');
    props={...props,selectionReady:true};flush();assert.equal(command()?.command,3);
    assert.match(status(),/waiting to confirm/);
    const currentCommand=command()!.command;
    deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session:session(),sequence:7,status:'blocked',reason:'practice'});
    assert.match(status(),/practice is active/);
    deliver(ack(currentCommand));assert.match(status(),/practice is active/);
    deliver(selected('brainstem-pons',8));assert.equal(sent.filter(value=>value.type===HEAD_FOCUS_PROTOCOL).length,3,'resuming practice does not override model selection');
    const oldShow=button('Show Midbrain in model');assert(oldShow);oldShow.props.onClick();assert.equal(command()?.command,4);
    deliver(ack(4,'refused'));assert.match(status(),/cannot select that structure/);
    assert(button('Reload model for this structure'),'hidden or unavailable scope has an explicit fresh-model fallback');
    deliver(selected('brainstem-midbrain',9));assert.match(status(),/cannot select that structure/,'matching snapshot after refusal must not confirm');
    button('Show Midbrain in model').props.onClick();assert.equal(command()?.command,5,'explicit retry starts a new command');
    const expired=[...timers.values()].at(-1)!;expired();flush();assert.match(status(),/unavailable/);
    const oldRetry=button('Retry model comparison');assert(oldRetry);
    props={...props,conceptId:'brainstem-medulla'};flush();oldShow.props.onClick();oldRetry.props.onClick();flush();
    assert.equal(command()?.command,5,'retired controls cannot send a command');
    assert.match(status(),/unavailable/,'retired retry cannot reload the new concept');
    button('Retry model comparison').props.onClick();flush();
    assert.equal(frame().props.src,headInlineDestination('brainstem-medulla',HEAD_LINK_REVISION,'CT')!.src,'retry uses current concept URL');
    assert.equal(frame().key,'1');
    expired();flush();assert.match(status(),/Loading/,'retired timeout cannot end retry');
    props={...props,conceptId:'brainstem-midbrain'};flush();
    frame().props.onLoad({currentTarget:frame().props.ref.current});flush();
    deliver(selected('brainstem-medulla',1));
    assert.equal(command()?.target.id,headInlineDestination('brainstem-midbrain',HEAD_LINK_REVISION,'CT')!.target.id,'late iframe load focuses latest desired target');
    for(const effect of effects.values())effect.cleanup?.();
    const before=sent.length;for(const listener of [...listeners])listener({data:selected('brainstem-medulla',8),origin,source:frameWindow});
    assert.equal(sent.length,before,'unmounted frame cannot send a command');
  }finally{for(const effect of effects.values())effect.cleanup?.();Object.defineProperty(globalThis,'window',{configurable:true,value:oldWindow});if(oldCrypto)Object.defineProperty(globalThis,'crypto',oldCrypto);}
}

test('inline comparison retains a compatible frame and confirms only the latest acknowledged focus',()=>withInlineFrame());

test('reconnecting a pending focus requires a fresh session command, ACK and newer matching snapshot',()=>withInlineFrame(h=>{
  h.flush();h.reload();h.deliver(h.selected('brainstem-pons',1));
  const originalSrc=h.frame().props.src,originalKey=h.frame().key;
  h.update({conceptId:'brainstem-midbrain'});
  assert.equal(h.focusCount(),1);const oldSession=h.session(),oldCommand=h.command().command;
  h.reload();assert.notEqual(h.session(),oldSession);
  assert.equal(h.frame().props.src,originalSrc,'reconnect retains the existing model URL beside the scan');
  assert.equal(h.frame().key,originalKey,'reconnect does not remount the compatible frame');
  assert.equal(h.focusCount(),1,'reconnect waits for a fresh validated snapshot');
  h.deliver(h.ack(oldCommand,'accepted',oldSession));
  h.deliver(h.selected('brainstem-midbrain',99,oldSession));
  assert.equal(h.focusCount(),1);assert.match(h.status(),/waiting to confirm/);
  h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:h.sourceRevision,session:h.session(),sequence:1,status:'empty'});
  assert.equal(h.focusCount(),2,'fresh empty snapshot reissues the pending current-concept focus');
  assert.equal(h.command().session,h.session());
  assert.equal(h.command().target.id,headInlineDestination('brainstem-midbrain',HEAD_LINK_REVISION,'CT')!.target.id);
  h.deliver(h.ack(oldCommand,'accepted',oldSession));
  h.deliver(h.selected('brainstem-midbrain',2));
  assert.match(h.status(),/waiting to confirm/,'old-session ACK cannot authorize a fresh matching snapshot');
  h.deliver(h.ack(h.command().command));
  assert.match(h.status(),/waiting to confirm/,'new ACK needs a newer matching snapshot');
  h.deliver(h.selected('brainstem-midbrain',3));assert.match(h.status(),/Midbrain is selected/);
  h.deliver(h.selected('brainstem-pons',4));
  const count=h.focusCount();h.reload();h.deliver(h.selected('brainstem-pons',1));
  assert.equal(h.focusCount(),count,'reconnect never overrides a manual selection after confirmed focus');
  assert.match(h.status(),/differs from Midbrain/);
  h.button('Show Midbrain in model').props.onClick();h.flush();
  assert.equal(h.focusCount(),count+1,'explicit recovery remains available');
  h.deliver(h.ack(h.command().command));h.deliver(h.selected('brainstem-midbrain',2));
  assert.match(h.status(),/Midbrain is selected/);
}));

test('reconnect preserves wanted focus before the initial selected snapshot',()=>withInlineFrame(h=>{
  h.flush();h.reload();h.update({conceptId:'brainstem-midbrain'});h.reload();
  assert.equal(h.focusCount(),0);
  h.deliver(h.selected('brainstem-pons',1));assert.equal(h.focusCount(),1);
  assert.equal(h.command().target.id,headInlineDestination('brainstem-midbrain',HEAD_LINK_REVISION,'CT')!.target.id);
  h.deliver(h.ack(h.command().command));h.deliver(h.selected('brainstem-midbrain',2));
  assert.match(h.status(),/Midbrain is selected/);
}));

for(const reason of ['practice','guided'] as const){
  test(`fresh ${reason} snapshot cancels pending reconnect focus without later override`,()=>withInlineFrame(h=>{
    h.flush();h.reload();h.deliver(h.selected('brainstem-pons',1));h.update({conceptId:'brainstem-midbrain'});
    const count=h.focusCount();h.reload();
    h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:h.sourceRevision,session:h.session(),sequence:1,status:'blocked',reason});
    h.deliver(h.selected('brainstem-pons',2));
    assert.equal(h.focusCount(),count,'leaving the model activity does not restore canceled focus');
    assert.match(h.status(),/differs from Midbrain/);
    h.button('Show Midbrain in model').props.onClick();h.flush();assert.equal(h.focusCount(),count+1);
  }));
}

test('unready scan annotations suppress reconnect focus until readiness explicitly changes',()=>withInlineFrame(h=>{
  h.flush();h.reload();h.deliver(h.selected('brainstem-pons',1));h.update({conceptId:'brainstem-midbrain'});
  const count=h.focusCount();h.update({selectionReady:false});h.reload();
  h.deliver(h.selected('brainstem-pons',1));assert.equal(h.focusCount(),count);
  assert.match(h.status(),/annotation is not ready/);
  h.update({selectionReady:true});assert.equal(h.focusCount(),count+1);
  h.deliver(h.ack(h.command().command));h.deliver(h.selected('brainstem-midbrain',2));
  assert.match(h.status(),/Midbrain is selected/);
}));

for(const canceled of ['refused','timeout'] as const){
  test(`reconnect does not restore focus canceled by ${canceled}`,()=>withInlineFrame(h=>{
    h.flush();h.reload();h.deliver(h.selected('brainstem-pons',1));h.update({conceptId:'brainstem-midbrain'});
    if(canceled==='refused')h.deliver(h.ack(h.command().command,'refused'));else h.expire();
    const count=h.focusCount();h.reload();h.deliver(h.selected('brainstem-pons',1));
    assert.equal(h.focusCount(),count,'needsFocus alone never recreates canceled user intent');
    assert.match(h.status(),/differs from Midbrain/);
    h.button('Show Midbrain in model').props.onClick();h.flush();assert.equal(h.focusCount(),count+1);
    h.deliver(h.ack(h.command().command));h.deliver(h.selected('brainstem-midbrain',2));
    assert.match(h.status(),/Midbrain is selected/);
  }));
}

function assertFullAtlasLink(h:InlineHarness,conceptId:string){
  const href=headConceptById(conceptId)!.atlasHref,link=h.link(href);
  assert(link,`native full-Atlas link uses the exact authored URL for ${conceptId}`);
  assert.equal(link.props.target,'_blank');
  assert.deepEqual(new Set(String(link.props.rel).split(/\s+/)),new Set(['noopener','noreferrer']));
  assert.equal(link.props.prefetch,undefined,'fallback does not prefetch a separate Atlas route');
  assert.equal(link.props.onClick,undefined,'native navigation has no router or focus callback');
}

for(const modality of ['CT','MRI'] as const)for(const reason of ['sign-in','access-denied'] as const){
 test(`${modality} ${reason} explains independent model access and retires all old acknowledgements`,()=>withInlineFrame(h=>{
  h.flush();h.update({modality});h.reload();h.deliver(h.selected('brainstem-pons',1));
  h.update({conceptId:'brainstem-midbrain'});
  const retired=h.session(),oldCommand=h.command().command,count=h.focusCount();
  h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:h.sourceRevision,session:retired,sequence:2,status:'blocked',reason});
  const expected=reason==='sign-in'?/Sign in to Visible Medicine/:/website refused access/;
  assert.match(h.status(),expected);assert.match(h.status(),/scan remains open.*access are checked separately/);
  assert.equal(h.playback().at(-1)?.status,'blocked');assert(h.button('Check model access again'));
  assertFullAtlasLink(h,'brainstem-midbrain');
  h.deliver(h.ack(oldCommand,'accepted',retired));h.deliver(h.selected('brainstem-midbrain',3,retired));
  assert.match(h.status(),expected,'a retired authenticated-looking snapshot is not recovery');
  assert.equal(h.focusCount(),count);
  h.deliver({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision:'0'.repeat(40)});
  assert.equal(h.session(),retired,'wrong source cannot restart the resource session');
  h.deliver({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision:h.sourceRevision});
  assert.notEqual(h.session(),retired,'recovery requires a fresh source/session request');
  h.deliver(h.selected('brainstem-pons',1));
  assert.match(h.status(),/differs from Midbrain/);assert.equal(h.focusCount(),count,'cancelled focus is not automatically resumed');
  h.button('Show Midbrain in model').props.onClick();h.flush();
  const fresh=h.command().command;assert.equal(h.focusCount(),count+1);
  h.deliver(h.ack(fresh,'accepted',retired));h.deliver(h.selected('brainstem-midbrain',2));
  assert.match(h.status(),/waiting to confirm/,'old ACK cannot authorize the new session');
  h.deliver(h.ack(fresh));h.deliver(h.selected('brainstem-midbrain',3));
  assert.match(h.status(),/Midbrain is selected/);
 }));
 test(`${modality} ${reason} stays scoped across compatible target changes and unready annotations`,()=>withInlineFrame(h=>{
  h.flush();h.update({modality});h.reload();
  h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:h.sourceRevision,session:h.session(),sequence:1,status:'blocked',reason});
  const expected=reason==='sign-in'?/Sign in to Visible Medicine/:/website refused access/;
  h.update({conceptId:'brainstem-midbrain'});assert.match(h.status(),expected);
  assertFullAtlasLink(h,'brainstem-midbrain');
  h.update({selectionReady:false});assert.match(h.status(),/annotation is not ready/);
  assert.equal(h.link(headConceptById('brainstem-midbrain')!.atlasHref),undefined,'unready scan hides resource recovery');
  assert.equal(h.button('Check model access again'),undefined);
 }));
}

for(const modality of ['CT','MRI'] as const){
  test(`${modality} iframe load waits for a valid response and offers exact full-Atlas recovery after timeout`,()=>withInlineFrame(h=>{
    const href=headConceptById('brainstem-pons')!.atlasHref;
    h.flush();h.update({modality});
    assert.match(h.status(),/Loading/i);
    assert.equal(h.link(href),undefined);
    assert.equal(h.playback().at(-1)?.status,'waiting');
    h.reload();
    assert.match(h.status(),/connecting|loading/i);
    assert.doesNotMatch(h.status(),/Model loaded/i);
    assert.equal(h.link(href),undefined);
    assert.equal(h.playback().at(-1)?.status,'waiting');
    h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:h.sourceRevision,session:h.session(),sequence:1,status:'selected'});
    h.deliver(h.selected('brainstem-pons',1),'https://wrong.example.test');
    h.deliver(h.selected('brainstem-pons',1),undefined,{});
    h.deliver(h.selected('brainstem-pons',1,'retired-session'));
    assert.match(h.status(),/connecting|loading/i,'unvalidated responses cannot report a loaded model');
    assert.equal(h.link(href),undefined);
    h.expire();
    assert.match(h.status(),/unavailable/i);
    assert.equal(h.playback().at(-1)?.status,'blocked');
    assert(h.button('Retry model comparison'));
    assertFullAtlasLink(h,'brainstem-pons');
  }));

  test(`${modality} full-Atlas recovery stays hidden for matched, practice, guided and annotation states`,()=>withInlineFrame(h=>{
    const href=headConceptById('brainstem-pons')!.atlasHref;
    h.flush();h.update({modality});h.reload();h.deliver(h.selected('brainstem-pons',1));
    assert.match(h.status(),/Pons is selected/);
    assert.equal(h.playback().at(-1)?.status,'matched');
    assert.equal(h.link(href),undefined);
    for(const reason of ['practice','guided'] as const){
      h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:h.sourceRevision,session:h.session(),sequence:reason==='practice'?2:3,status:'blocked',reason});
      assert.match(h.status(),reason==='practice'?/practice is active/:/guide is active/);
      assert.equal(h.link(href),undefined);
    }
    h.update({selectionReady:false});
    assert.match(h.status(),/annotation is not ready/);
    assert.equal(h.link(href),undefined);
  }));

  test(`${modality} refused focus exposes full-Atlas recovery without relaxing ACK guards`,()=>withInlineFrame(h=>{
    h.flush();h.update({modality});h.reload();h.deliver(h.selected('brainstem-pons',1));
    h.update({conceptId:'brainstem-midbrain'});
    assert.equal(h.link(headConceptById('brainstem-midbrain')!.atlasHref),undefined);
    const current=h.command().command;
    h.deliver(h.ack(current,'refused','retired-session'));
    assert.match(h.status(),/waiting to confirm/);
    h.deliver(h.ack(current,'refused'));
    assert.match(h.status(),/cannot select that structure/);
    assert(h.button('Reload model for this structure'));
    assertFullAtlasLink(h,'brainstem-midbrain');
  }));
}
