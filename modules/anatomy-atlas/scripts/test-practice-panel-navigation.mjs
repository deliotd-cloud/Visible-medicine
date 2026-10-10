// Exercise the actual panel effect and practice reducer with controlled hooks.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
let slots=[],cursor=0,effects=[],observer,frames=[];
const shim={...React,
 useRef(value){const i=cursor++;return slots[i]??(slots[i]={current:value});},
 useLayoutEffect(effect){effects.push(effect);},
};
class MutationObserverMock{
 constructor(callback){this.callback=callback;observer=this;}
 observe(node,options){this.node=node;this.options=options;}
 disconnect(){this.disconnected=true;}
}
const built=await build({
 stdin:{contents:"export {PracticePanelNavigation,revealPracticePanelTarget} from './app/practice-panel-navigation'; export {practiceReducer,initialPractice} from './lib/atlas-practice';",resolveDir:process.cwd(),loader:'tsx'},
 bundle:true,platform:'node',format:'cjs',write:false,external:['react','react/*'],
});
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{
 module:scope,exports:scope.exports,
 require:id=>id==='react'?shim:require(id),
 MutationObserver:MutationObserverMock,
 requestAnimationFrame:callback=>(frames.push(callback),frames.length),
 cancelAnimationFrame:id=>{frames[id-1]=null;},
 window:{scrollTo(){throw Error('Outer page scroll requested');}},
});
const {PracticePanelNavigation,revealPracticePanelTarget,practiceReducer,initialPractice}=scope.exports;
const desktop={scrollTop:90,getBoundingClientRect:()=>({top:0,bottom:500}),querySelector:selector=>selector==='[data-practice-question]'?heading:selector==='[data-practice-feedback]'?feedback:selector==='[data-practice-results]'?results:null};
const popup={scrollTop:75,closed:true,hasAttribute:name=>name==='data-closed'&&popup.closed,getBoundingClientRect:()=>({top:0,bottom:500})};
const mobile={scrollTop:0,querySelector:selector=>selector==='[data-practice-question]'?mobileHeading:selector==='[data-practice-feedback]'?mobileFeedback:selector==='[data-practice-results]'?mobileResults:null};
function target(name,info,{mobilePanel=false,top=40,bottom=80}={}){
 return {name,isConnected:true,focusCalls:[],
  closest(selector){return selector==='.body-info'?info:selector==='.anatomy-controls-popup'&&mobilePanel?popup:null;},
  getBoundingClientRect:()=>({top,bottom}),
  focus(options){this.focusCalls.push(options);},
  scrollIntoView(){throw Error('Outer page scroll requested');},
 };
}
const heading=target('question',desktop),feedback=target('feedback',desktop,{top:600,bottom:640});
const results=target('results',desktop,{top:40,bottom:80});
const mobileHeading=target('mobile question',mobile,{mobilePanel:true,top:80,bottom:120});
const mobileFeedback=target('mobile feedback',mobile,{mobilePanel:true,top:600,bottom:640});
const mobileResults=target('mobile results',mobile,{mobilePanel:true,top:80,bottom:120});
function render(props,info=desktop){
 cursor=0;effects=[];
 const element=PracticePanelNavigation(props);
 assert.equal(element.type,'span','Effect marker stays nonvisual');
 element.props.ref.current={closest:selector=>selector==='.body-info'?info:null};
 for(const effect of effects)effect();
}
render({sessionId:1,index:0,answered:false});
assert.equal(desktop.scrollTop,0,'Session start resets only the panel scroller');
assert.equal(heading.focusCalls[0]?.preventScroll,true);
desktop.scrollTop=42;
render({sessionId:1,index:0,answered:false});
assert.equal(desktop.scrollTop,42,'Unrelated rerender retains user scroll');
assert.equal(heading.focusCalls.length,1,'Unrelated rerender does not steal model focus');
const questions=[{target:'a',choices:['a','b']},{target:'b',choices:['a','b']}];
for(const [label,chosen,id] of [['correct','a',2],['incorrect','b',3],['skip',null,4]]){
 let session=practiceReducer(initialPractice,{type:'start',session:{...initialPractice,id,status:'active',mode:'name',questions,renderedIds:['a','b'],index:0,responses:[]}});
 session=practiceReducer(session,{type:'answer',sessionId:id,index:0,chosen});
 assert.equal(session.responses.length,1,label+' action records a response');
 desktop.scrollTop=100;
 render({sessionId:id,index:0,answered:!!session.responses[0]});
 assert.equal(feedback.focusCalls.at(-1)?.preventScroll,true,label+' focuses feedback');
 assert(desktop.scrollTop>100,label+' reveals feedback in panel viewport');
 session=practiceReducer(session,{type:'next',sessionId:id,index:0});
 desktop.scrollTop=90;
 render({sessionId:id,index:session.index,answered:false});
 assert.equal(desktop.scrollTop,0,label+' next prompt clears retained offset');
}
popup.closed=true;popup.scrollTop=75;
render({sessionId:5,index:0,answered:false},mobile);
assert.equal(mobileHeading.focusCalls.length,0,'Closed mobile sheet keeps focus with its launcher');
assert.deepEqual(Array.from(observer.options.attributeFilter),['data-closed']);
popup.closed=false;
observer.callback();
assert.equal(mobileHeading.focusCalls.length,0,'BaseUI may set initial sheet focus first');
frames.shift()?.();
assert.equal(popup.scrollTop,0,'Opening the sheet reveals its prompt');
assert.equal(mobileHeading.focusCalls[0]?.preventScroll,true);
assert.equal(desktop.scrollTop,0,'Mobile transition does not move desktop scroller');
// A desktop/sheet parent switch remounts this child. The same question still
// receives its new panel's own focus and scroll adjustment.
slots=[];popup.closed=false;popup.scrollTop=88;
render({sessionId:5,index:0,answered:false},mobile);
assert.equal(popup.scrollTop,0,'Layout remount reveals the same prompt');
assert.equal(mobileHeading.focusCalls.length,2,'Layout remount focuses the new panel');
// Finishing the last answer replaces the question branch with results. A
// completed session must focus the results heading once, in its own scroller.
let finished=practiceReducer(initialPractice,{type:'start',session:{...initialPractice,id:10,status:'active',mode:'name',questions:questions.slice(0,1),renderedIds:['a','b'],index:0,responses:[]}});
finished=practiceReducer(finished,{type:'answer',sessionId:10,index:0,chosen:'a'});
finished=practiceReducer(finished,{type:'next',sessionId:10,index:0});
assert.equal(finished.status,'complete','Finishing the last answer completes the session');
assert.equal(finished.responses.length,1,'Normal finish retains its scored response');
slots=[];desktop.scrollTop=175;
render({sessionId:finished.id,index:finished.index,answered:true,phase:'results'});
assert.equal(results.focusCalls.at(-1)?.preventScroll,true,'Normal finish focuses results without scrolling the outer page');
assert.equal(desktop.scrollTop,0,'Normal finish resets the results panel scroll');
const desktopResultsFocus=results.focusCalls.length;
desktop.scrollTop=42;
render({sessionId:10,index:0,answered:true,phase:'results'});
assert.equal(results.focusCalls.length,desktopResultsFocus,'Unrelated results rerender does not steal focus');
assert.equal(desktop.scrollTop,42,'Unrelated results rerender preserves reading position');
// An early exit has fewer responses than questions but reaches the same results
// heading. The reducer's completion state is the source of that phase.
let early=practiceReducer(initialPractice,{type:'start',session:{...initialPractice,id:11,status:'active',mode:'name',questions,renderedIds:['a','b'],index:0,responses:[]}});
early=practiceReducer(early,{type:'answer',sessionId:11,index:0,chosen:null});
early=practiceReducer(early,{type:'exit'});
assert.equal(early.status,'complete','Early exit produces completed results');
assert(early.responses.length<early.questions.length,'Early results retain partial score');
desktop.scrollTop=98;
render({sessionId:early.id,index:early.index,answered:true,phase:'results'});
assert.equal(results.focusCalls.length,desktopResultsFocus+1,'Early exit focuses results');
assert.equal(desktop.scrollTop,0,'Early exit resets panel scroll');
const focusBeforeNull=results.focusCalls.length;
const questionBeforeNull=heading.focusCalls.length;
render({sessionId:12,index:0,answered:false,phase:null});
assert.equal(results.focusCalls.length,focusBeforeNull,'Null phase has no focus target');
assert.equal(heading.focusCalls.length,questionBeforeNull,'Null phase does not fall back to question');
const detached=target('detached',desktop);detached.isConnected=false;
assert.equal(revealPracticePanelTarget(detached,'results'),false,'Disconnected heading is ignored');
const outside=target('outside',desktop);outside.closest=()=>null;
assert.equal(revealPracticePanelTarget(outside,'results'),false,'Heading outside info panel is ignored');
for(const ancestor of ['hidden','inert']){
 const concealed=target(ancestor,desktop);
 concealed.closest=selector=>selector==='[hidden], [inert]'?{ancestor}:selector==='.body-info'?desktop:null;
 assert.equal(revealPracticePanelTarget(concealed,'results'),false,`${ancestor} heading is ignored`);
 assert.equal(concealed.focusCalls.length,0,`${ancestor} heading never receives focus`);
}
assert.equal(revealPracticePanelTarget(null,'results'),false,'Missing heading is ignored');
slots=[];popup.closed=true;popup.scrollTop=122;
render({sessionId:13,index:0,answered:true,phase:'results'},mobile);
assert.equal(mobileResults.focusCalls.length,0,'Closed compact sheet retains launcher focus');
assert.equal(popup.scrollTop,122,'Closed compact sheet retains its scroll offset');
popup.closed=false;observer.callback();
assert.equal(mobileResults.focusCalls.length,0,'Compact sheet waits for BaseUI focus transition');
frames.at(-1)?.();
assert.equal(mobileResults.focusCalls.at(-1)?.preventScroll,true,'Opening compact results focuses heading');
assert.equal(popup.scrollTop,0,'Opening compact results resets sheet scroll');
const mobileResultsFocus=mobileResults.focusCalls.length;
popup.scrollTop=65;
render({sessionId:13,index:0,answered:true,phase:'results'},mobile);
assert.equal(mobileResults.focusCalls.length,mobileResultsFocus,'Open compact rerender does not steal focus');
assert.equal(popup.scrollTop,65,'Open compact rerender retains scroll');
slots=[];popup.scrollTop=75;
render({sessionId:13,index:0,answered:true,phase:'results'},mobile);
assert.equal(mobileResults.focusCalls.length,mobileResultsFocus+1,'Compact remount reveals results in its new panel');
assert.equal(popup.scrollTop,0,'Compact remount resets its own scroll');
console.log(JSON.stringify({passed:true,outcomes:3,desktop:true,mobile:true,results:true,earlyExit:true,remount:true}));
