import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../components/UltrasoundLocalAtlas.tsx',import.meta.url),'utf8');
const tree=ts.createSourceFile('UltrasoundLocalAtlas.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const component=tree.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='UltrasoundLocalAtlas');
assert(component?.body,'UltrasoundLocalAtlas component exists');
const statements=component.body.statements;
const functions=['endDrag','resetTransient','openFolder','cancelLoading'];
const handlers=functions.map(name=>{
 const node=statements.find(item=>ts.isFunctionDeclaration(item)&&item.name?.text===name);
 assert(node,`${name} handler exists`);return node.getText(tree);
}).join('\n');
const effects=statements.filter(item=>ts.isExpressionStatement(item)&&ts.isCallExpression(item.expression)&&item.expression.expression.getText(tree)==='useEffect');
const mountEffect=effects.find(item=>item.getText(tree).includes('mounted.current=true'));
const regionEffect=effects.find(item=>item.getText(tree).includes('regionRef.current===selectedRegion.id'));
assert(mountEffect&&regionEffect,'mount and region lifecycle effects exist');
const callback=statements.find(item=>ts.isVariableStatement(item)&&item.declarationList.declarations.some(declaration=>declaration.name.getText(tree)==='loadingRequest'));
assert(callback,'cancel button captures the displayed request');
const cancelButton=statements.flatMap(item=>{
 const found=[];function visit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(tree)==='button'&&node.getText(tree).includes('Cancel loading'))found.push(node);ts.forEachChild(node,visit);}visit(item);return found;
})[0];
assert(cancelButton,'loading control exists');
const click=cancelButton.openingElement.attributes.properties.find(property=>property.name?.text==='onClick');
assert(click?.initializer&&ts.isJsxExpression(click.initializer),'loading control has a click handler');
const clickExpression=click.initializer.expression;
assert(ts.isArrowFunction(clickExpression)&&ts.isCallExpression(clickExpression.body));
assert.equal(clickExpression.body.expression.getText(tree),'cancelLoading');
assert.equal(clickExpression.body.arguments[0].getText(tree),'loadingRequest');
const code=ts.transpileModule(`${handlers}\nconst installMount=${mountEffect.expression.arguments[0].getText(tree)};\nconst applyRegion=${regionEffect.expression.arguments[0].getText(tree)};\nconst displayedRequest=()=>generation.current;`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;

function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
function study(name,region='abdomen'){
 let disposed=0;return{study:{region,frames:[{id:name}]},dispose(){disposed++;},get disposed(){return disposed;}};
}
function fixture(){
 const state={loaded:null,loading:false,error:'',status:'',mode:'explore',frameIndex:0,selectedId:null,search:'',questionIndex:0,feedback:'',zoomIndex:0,pan:[.5,.5]};
 const set=(key)=>(value)=>{state[key]=typeof value==='function'?value(state[key]):value;};
 const requests=[];const loadUltrasoundStudy=(files,options)=>{const deferredLoad=deferred();requests.push({files,options,...deferredLoad});return deferredLoad.promise;};
 const selectedRegion={id:'abdomen'},generation={current:0},viewEpoch={current:0},mounted={current:false},pending={current:null},active={current:null},retired={current:[]},regionRef={current:'abdomen'};
 const drag={current:null},suppressPointerClick={current:false},fileInput={current:{focusCalls:0,focus(){this.focusCalls++;},setAttribute(){}}};
 const scope={selectedRegion,generation,viewEpoch,mounted,pending,active,retired,regionRef,drag,suppressPointerClick,fileInput,loadUltrasoundStudy,
  setLoaded:set('loaded'),setLoading:set('loading'),setError:set('error'),setStatus:set('status'),setMode:set('mode'),setFrameIndex:set('frameIndex'),setSelectedId:set('selectedId'),setSearch:set('search'),setQuestionIndex:set('questionIndex'),setFeedback:set('feedback'),setZoomIndex:set('zoomIndex'),setPan:set('pan')};
 const names=Object.keys(scope),values=Object.values(scope);
 const actions=new Function(...names,`${code}\nreturn{openFolder,cancelLoading,displayedRequest,installMount,applyRegion};`)(...values);
 const unmount=actions.installMount();
 const pick=label=>actions.openFolder([label]);
 return{state,requests,scope,actions,pick,unmount,cancelShown:()=>actions.cancelLoading(actions.displayedRequest())};
}
test('cancelling the first pending folder aborts it, leaves no study, and returns focus',async()=>{
 const f=fixture(),work=f.pick('first');assert.equal(f.state.loading,true);assert.equal(f.requests.length,1);
 f.cancelShown();assert.equal(f.requests[0].options.signal.aborted,true);assert.equal(f.state.loading,false);assert.equal(f.state.loaded,null);assert.equal(f.scope.active.current,null);assert.match(f.state.status,/No study was opened/);assert.equal(f.scope.fileInput.current.focusCalls,1);
 f.requests[0].reject(new Error('late abort'));await work;assert.equal(f.state.error,'');
});
test('cancelling a replacement keeps the active study usable',async()=>{
 const f=fixture(),first=f.pick('first'),prior=study('prior');f.requests[0].resolve(prior);await first;
 assert.equal(f.state.loaded,prior);assert.equal(f.state.loading,false);
 const second=f.pick('replacement');assert.equal(f.state.loading,true);f.cancelShown();assert.equal(f.requests[1].options.signal.aborted,true);
 assert.equal(f.state.loaded,prior);assert.equal(f.scope.active.current,prior);assert.equal(prior.disposed,0);assert.match(f.state.status,/previous study is still open/);assert.equal(f.scope.fileInput.current.focusCalls,1);
 f.requests[1].reject(Error('ignored'));await second;assert.equal(f.state.error,'');
});
test('a late successful result after cancellation is disposed without committing',async()=>{
 const f=fixture(),work=f.pick('first'),late=study('late');f.cancelShown();f.requests[0].resolve(late);await work;
 assert.equal(late.disposed,1);assert.equal(f.state.loaded,null);assert.equal(f.scope.active.current,null);assert.equal(f.state.loading,false);
});
test('late rejection and old finally cannot change a newer pending request',async()=>{
 const f=fixture(),old=f.pick('old');f.cancelShown();const newer=f.pick('new');f.requests[0].reject(Error('obsolete'));await old;
 assert.equal(f.state.loading,true);assert.equal(f.state.error,'');assert.equal(f.scope.pending.current?.signal,f.requests[1].options.signal);
 const current=study('current');f.requests[1].resolve(current);await newer;assert.equal(f.state.loaded,current);assert.equal(f.state.loading,false);
});
test('the callback from an older render cannot abort a newer selection',async()=>{
 const f=fixture(),old=f.pick('old'),oldRequest=f.actions.displayedRequest();const newer=f.pick('new');
 f.actions.cancelLoading(oldRequest);assert.equal(f.requests[1].options.signal.aborted,false);assert.equal(f.state.loading,true);
 f.requests[0].reject(Error('replaced'));await old;assert.equal(f.state.loading,true);
 f.cancelShown();assert.equal(f.requests[1].options.signal.aborted,true);f.requests[1].reject(Error('cancelled'));await newer;
});
test('a completed load has no pending request to cancel',async()=>{
 const f=fixture(),work=f.pick('first'),opened=study('opened');f.requests[0].resolve(opened);await work;
 const before=f.state.status,focus=f.scope.fileInput.current.focusCalls;f.cancelShown();
 assert.equal(f.state.loaded,opened);assert.equal(opened.disposed,0);assert.equal(f.state.status,before);assert.equal(f.scope.fileInput.current.focusCalls,focus);
});
test('unmount aborts pending work and disposes any late resolution',async()=>{
 const f=fixture(),work=f.pick('first'),late=study('late');f.unmount();assert.equal(f.requests[0].options.signal.aborted,true);
 f.requests[0].resolve(late);await work;assert.equal(late.disposed,1);assert.equal(f.state.loaded,null);
});
test('region change clears active and pending studies and refuses a late old-region result',async()=>{
 const f=fixture(),first=f.pick('first'),prior=study('prior');f.requests[0].resolve(prior);await first;
 const work=f.pick('replacement'),late=study('late');f.scope.selectedRegion.id='thorax';f.actions.applyRegion();
 assert.equal(f.requests[1].options.signal.aborted,true);assert.equal(prior.disposed,1);assert.equal(f.state.loaded,null);assert.equal(f.state.loading,false);
 f.requests[1].resolve(late);await work;assert.equal(late.disposed,1);assert.equal(f.state.loaded,null);assert.equal(f.scope.active.current,null);
});
