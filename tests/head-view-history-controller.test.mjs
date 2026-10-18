import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {AppBrowserHistoryController} from '../node_modules/vinext/dist/server/app-browser-history-controller.js';
import {createExternalHistoryStatePreservingMetadata,isAppOwnedHistoryState,readHistoryStateTraversalIndex} from '../node_modules/vinext/dist/server/app-history-state.js';
import {createHeadViewHistory,HEAD_VIEW_ENTRY_KEY,HEAD_VIEW_EXTERNAL_HISTORY_KEY} from '../lib/head-view-history.ts';

const navigationSource=readFileSync(new URL('../node_modules/vinext/dist/shims/navigation.js',import.meta.url),'utf8');

function installedControllerBrowser(){
  const origin='https://example.test',stack=[{href:'/atlas/ct-head',state:{__NA:true,__vinext_historyIndex:4,tree:{slot:'head'}}}];let index=0;
  const current=()=>stack[index].state;
  const rawPush=(state,href)=>{stack.splice(++index);stack.push({href,state:structuredClone(state)});};
  const rawReplace=(state,href)=>{stack[index]={href:href??stack[index].href,state:structuredClone(state)};};
  const controller=new AppBrowserHistoryController({
    initialHistoryState:current(),maxHistoryStateSnapshots:8,
    readHistoryState:current,readCurrentHref:()=>new URL(stack[index].href,origin).href,
    pushHistoryState:(state,href)=>rawPush(state,href),replaceHistoryState:(state,href)=>rawReplace(state,href),
    readVisibleNavigationMetadata:()=>null,
  });
  controller.rememberHistoryStateSnapshot({navigationSnapshot:{params:{}}});
  function pushState(data,href){
    // Exact installed patchedPushState branch from shims/navigation.js.
    if(isAppOwnedHistoryState(data)){
      const prior=current();rawPush(data,href);controller.commitAppOwnedHistoryStateWrite('push',prior);
      return 'app-owned';
    }
    const prior=current();rawPush(createExternalHistoryStatePreservingMetadata(data,current()),href);
    controller.claimCurrentHistoryTreeSnapshot('push',prior);return 'external';
  }
  return {stack,controller,pushState,current,get index(){return index;},back(){if(index>0){index--;controller.commitTraversalIndexFromHistoryState(current());}},forward(){if(index<stack.length-1){index++;controller.commitTraversalIndexFromHistoryState(current());}}};
}

test('installed Vinext app-owned copy aliases traversal index; marked head push allocates a fresh index',()=>{
  assert.match(navigationSource,/if \(isAppOwnedHistoryState\(data\)\)/);
  assert.match(navigationSource,/claimCurrentHistoryTreeSnapshot\?\.\("push", previousHistoryState\)/);
  const bad=installedControllerBrowser(),copied={...bad.current()};
  assert.equal(isAppOwnedHistoryState(copied),true);
  assert.equal(bad.pushState(copied,'/atlas/ct-head?concept=brainstem-pons'),'app-owned');
  assert.equal(readHistoryStateTraversalIndex(bad.current()),4,'reproduces stale copied index');

  const browser=installedControllerBrowser(),history=createHeadViewHistory(8,()=>`opaque-${Math.random().toString(36).slice(2)}`);
  const old=history.ensure(browser.current(),'/atlas/ct-head');assert(old?.changed);
  assert.equal(old.state.__vinext_historyIndex,4);assert.deepEqual(old.state.tree,{slot:'head'});
  const outbound=history.freshExternalState(old.state);
  assert.equal(outbound[HEAD_VIEW_ENTRY_KEY],undefined);
  assert.equal(outbound[HEAD_VIEW_EXTERNAL_HISTORY_KEY],true);
  assert.equal(outbound.__vinext_historyIndex,4,'caller metadata is preserved for the controller');
  assert.equal(isAppOwnedHistoryState(outbound),false);
  assert.equal(browser.pushState(outbound,'/atlas/ct-head?concept=brainstem-pons'),'external');
  assert.equal(readHistoryStateTraversalIndex(browser.current()),5);
  assert.equal(browser.controller.currentHistoryTraversalIndex,5);
  assert.deepEqual(browser.current().tree,{slot:'head'});
  assert.equal(browser.current()[HEAD_VIEW_EXTERNAL_HISTORY_KEY],true);
  const second=history.freshExternalState(browser.current());
  assert.equal(browser.pushState(second,'/atlas/ct-head?concept=brainstem-midbrain'),'external');
  assert.deepEqual(browser.stack.map(entry=>readHistoryStateTraversalIndex(entry.state)),[4,5,6]);
  browser.back();assert.equal(browser.controller.currentHistoryTraversalIndex,5);
  browser.forward();assert.equal(browser.controller.currentHistoryTraversalIndex,6);
});
