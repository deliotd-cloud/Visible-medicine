import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

type Node={type:any;props:Record<string,any>};
const nodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(nodes):value?.props?[value,...nodes(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value?.props?words(value.props.children):value==null?'':String(value);
const pending=()=>{let resolve!:(v:any)=>void;const promise=new Promise<any>(r=>{resolve=r;});return {promise,resolve};};
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
const source=readFileSync(new URL('../components/RegionalMriLearning.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;

function harness(count=2){
 let cursor=0,slots:any[]=[],pendingEffects=new Map<number,{kind:'layout'|'passive';fn:()=>any;deps?:any[]}>(),effects=new Map<number,{kind:'layout'|'passive';deps?:any[];cleanup?:()=>void}>();
 let tree:Node,props:any={source:{revision:'a'.repeat(64),region:'knee'},catalogue:{},pkg:{},study:{},overlay:{purpose:'scoped-display',annotation:{review:{status:'accepted-scoped'}}}};
 const targets=Array.from({length:count},(_,i)=>({id:`target-${i}`,label:`Target ${i}`,kind:i?'specimen':'body',side:i?'right':'left',relation:i?'parent-reference':'same-structure',oppositeSide:!!i}));
 const calls:Array<{targetId:string;deferred:ReturnType<typeof pending>}>=[],owned=new WeakSet<object>();
 const same=(a:any[]|undefined,b:any[]|undefined)=>!!a&&!!b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
 const hooks={useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(value:any)=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef(value:any){const i=cursor++;if(!(i in slots))slots[i]={current:value};return slots[i];},useEffect(fn:()=>any,deps?:any[]){pendingEffects.set(cursor++,{kind:'passive',fn,deps});},useLayoutEffect(fn:()=>any,deps?:any[]){pendingEffects.set(cursor++,{kind:'layout',fn,deps});}};
 const runtime={jsx:(type:any,props:any)=>({type,props}),jsxs:(type:any,props:any)=>({type,props})};
 const comparison=()=>({provisional:false,targets});
 const learning={regionalLearningTopics:['anatomy','function','mri','ct','xray','ultrasound','pathology','clinical'],regionalLearningLabels:{anatomy:'Anatomy',function:'Function',mri:'MRI',ct:'CT',xray:'X-ray',ultrasound:'Ultrasound',pathology:'Pathology',clinical:'Clinical'},isRegionalMriLearning:(p:any)=>!!p&&owned.has(p),resolveRegionalMriLearning:(_s:any,_c:any,_p:any,_st:any,_o:any,targetId:string)=>{const d=pending();calls.push({targetId,deferred:d});return d.promise;}};
 const reviewLink={regionalLearningReviewHref:(p:any)=>p&&owned.has(p)?'/workspace/atlas-review/reference-learning?'+new URLSearchParams({target:p.targetId,relation:'same-structure',atlasRevision:'a'.repeat(40),mappingRevision:'b'.repeat(64),teachingRevision:p.entry.revision}):null};
 const mod={exports:{} as any};new Function('require','module','exports',code)((id:string)=>({'react':hooks,'react/jsx-runtime':runtime,'../lib/regional-mri-3d-comparison':{regionalMri3dComparison:comparison},'../lib/regional-mri-learning':learning,'../lib/regional-mri-learning-review-link':reviewLink}[id]??assert.fail(id)),mod,mod.exports);
 function commit(){for(const kind of ['layout','passive'])for(const [i,e] of pendingEffects){if(e.kind!==kind)continue;const old=effects.get(i);if(!same(old?.deps,e.deps)){old?.cleanup?.();effects.set(i,{kind,deps:e.deps,cleanup:e.fn()});}}}
 function render(next?:any,doCommit=true){if(next)props={...props,...next};cursor=0;pendingEffects=new Map();const value=mod.exports.RegionalMriLearning(props);if(doCommit){tree=value;commit();}return value as Node;}
 function find(type:string,match:(n:Node)=>boolean=()=>true){const n=nodes(tree).find(n=>n.type===type&&match(n));assert(n,`missing ${type}`);return n;}
 function open(){find('details',n=>words(n).includes('Reference teaching · Draft')).props.onToggle({currentTarget:{open:true}});render();}
 function close(){find('details',n=>words(n).includes('Reference teaching · Draft')).props.onToggle({currentTarget:{open:false}});render();}
 function choose(id:string){find('select',n=>words(n).includes('Choose a reference target')).props.onChange({currentTarget:{value:id}});render();}
 function topic(id:string){find('select',n=>n.props.value==='anatomy'||n.props.value==='ct'||n.props.value==='mri').props.onChange({currentTarget:{value:id}});render();}
 function proof(targetId:string,marker='Visible draft lesson'){
  const p={key:targetId+marker,targetId,entry:{revision:'f'.repeat(64),topics:learning.regionalLearningTopics.map((id:string)=>({id,title:`${id} teaching`,body:marker+' '+id,bullets:['Synthetic reference point'],note:'Source note',readiness:id==='ct'?'pending':'draft',references:[{title:'Source',url:'https://example.org/source'}]})),limitations:['Partial coverage caution'],reflection:{question:'What is the limit?',answer:'Independent reference only.',references:[]}}};owned.add(p);return p;
 }
 function resolve(index:number,p:any){calls[index].deferred.resolve(p);}
 function strictReplay(){for(const effect of effects.values())effect.cleanup?.();effects.clear();commit();}
 function unmount(){for(const effect of effects.values())effect.cleanup?.();effects.clear();}
 return {render,find,open,close,choose,topic,proof,resolve,strictReplay,unmount,calls,nodes:()=>nodes(tree),text:()=>words(tree),targets};
}

test('multiple exact targets require explicit choice; only owned exact draft appears',async()=>{const h=harness();h.render();h.open();assert.equal(h.calls.length,0);assert.match(h.text(),/Choose a reference target/);h.choose('target-1');assert.equal(h.calls.length,1);assert.equal(h.calls[0].targetId,'target-1');h.resolve(0,{entry:{topics:[]}});await flush();h.render();assert.doesNotMatch(h.text(),/Visible draft lesson/);assert.match(h.text(),/unavailable/);h.close();h.open();h.choose('target-1');h.resolve(1,h.proof('target-1'));await flush();h.render();assert.match(h.text(),/Visible draft lesson anatomy/);assert.match(h.text(),/opposite source side; not mirrored/);assert.match(h.text(),/Whole parent only/);assert.match(h.text(),/separate, unregistered subjects/);assert.match(h.text(),/radiologist review/);assert.match(h.text(),/Saving an MRI correction does not approve/);assert.equal(h.find('details',n=>n.props.className==='regional-mri-review__learning-sources').props.open,undefined);h.unmount();});

test('last target and topic win; pending topic withholds content and no substitute',async()=>{const h=harness();h.render();h.open();h.choose('target-0');const old=h.calls[0];h.choose('target-1');assert.doesNotMatch(h.text(),/Visible draft lesson/);h.resolve(1,h.proof('target-1','New lesson'));await flush();h.render();old.deferred.resolve(h.proof('target-0','Old lesson'));await flush();h.render();assert.match(h.text(),/New lesson anatomy/);assert.doesNotMatch(h.text(),/Old lesson/);h.topic('ct');assert.doesNotMatch(h.text(),/New lesson anatomy/);h.resolve(2,h.proof('target-1','CT lesson'));await flush();h.render();assert.doesNotMatch(h.text(),/CT lesson ct/);assert.match(h.text(),/pending or unavailable/);h.unmount();});

test('close, source change, speculative handlers, StrictMode replay and unmount retire requests',async()=>{const h=harness(1);h.render();h.open();assert.equal(h.calls.length,1);h.strictReplay();assert.equal(h.calls.length,2);h.resolve(0,h.proof('target-0','First replay'));await flush();h.render();assert.doesNotMatch(h.text(),/First replay/);h.resolve(1,h.proof('target-0','Second replay'));await flush();h.render();assert.match(h.text(),/Second replay/);const stale=h.find('select',n=>n.props.value==='anatomy').props.onChange;h.close();assert.doesNotMatch(h.text(),/Second replay/);stale({currentTarget:{value:'mri'}});h.render();assert.equal(h.calls.length,2);h.open();assert.equal(h.calls.length,3);const abandoned=h.render({source:{revision:'b'.repeat(64),region:'knee'}},false);assert(abandoned);h.render({source:{revision:'c'.repeat(64),region:'knee'}});assert.doesNotMatch(h.text(),/Second replay/);h.resolve(2,h.proof('target-0','Old source'));await flush();h.render();assert.doesNotMatch(h.text(),/Old source/);h.unmount();h.resolve(3,h.proof('target-0','After unmount'));await flush();});

test('exact teaching review link is available only with the current owned draft and retires with it',async()=>{
 const h=harness();h.render();h.open();h.choose('target-0');
 const links=()=>h.nodes().filter(n=>n.type==='a'&&n.props.href?.startsWith('/workspace/atlas-review/reference-learning?'));
 assert.equal(links().length,0);h.resolve(0,h.proof('target-0'));await flush();h.render();assert.equal(links().length,1);
 const anchor=links()[0];assert.equal(anchor.props.target,'_blank');assert.equal(anchor.props.rel,'noopener noreferrer');assert.match(anchor.props['aria-label'],/opens in a new tab/);
 assert.equal(new URL(anchor.props.href,'https://review.invalid').searchParams.get('target'),'target-0');
 h.choose('target-1');assert.equal(links().length,0);h.resolve(1,h.proof('target-1'));await flush();h.render();assert.equal(links().length,1);
 assert.equal(new URL(links()[0].props.href,'https://review.invalid').searchParams.get('target'),'target-1');
 h.topic('ct');assert.equal(links().length,0);h.resolve(2,h.proof('target-1'));await flush();h.render();assert.equal(links().length,1);assert.match(h.text(),/pending or unavailable/);
 h.render({source:{revision:'d'.repeat(64),region:'knee'}});assert.equal(links().length,0);h.close();assert.equal(links().length,0);h.unmount();
});
