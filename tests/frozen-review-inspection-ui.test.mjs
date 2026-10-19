import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
const require=createRequire(import.meta.url),React=require('react');
const built=await build({entryPoints:['scripts/clinical-review-candidate/worksheet.tsx'],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',loader:{'.css':'empty'},plugins:[{name:'synthetic-display-validator',setup(b){
 b.onResolve({filter:/body-review-response$/},()=>({path:'validator',namespace:'synthetic'}));
 b.onLoad({filter:/.*/,namespace:'synthetic'},()=>({contents:'export async function parseBodyReviewResponse(value,id){return value?.structureId===id?value:null;}'}));
}}]});
const text=n=>n==null?'':typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(text).join(''):text(n.props?.children);
const walk=(n,p,out=[])=>{if(React.isValidElement(n)){if(p(n))out.push(n);React.Children.forEach(n.props.children,c=>walk(c,p,out));}return out;};
function entry(id,name){const hash='a'.repeat(64);return {material:{structureId:id,materialHash:'b'.repeat(64),source:{structure:{id,name,fmaId:'FMA1',laterality:'right',sources:[],coverageNote:null},bundle:{sha256:hash},credit:'Source credit',licence:'CC-BY-SA 2.1 JP',sourceVersion:'test'},topics:[],guidedTours:[],reasoning:null,limits:['No imaging registration']},context:{structureId:id,materialHash:'b'.repeat(64)},modelQuery:new URLSearchParams({kind:'body',region:'foot',study:'1',structure:id,side:'both',source:hash}).toString()};}
async function harness(packet){let slots=[],cursor=0,effect=false,component,calls=[];
 const shim={...React,useCallback(fn){return fn;},useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return [slots[i],next=>{slots[i]=next;}];},useEffect(fn){if(!effect){effect=true;fn();}}};
 const scope={exports:{}};runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,URL,URLSearchParams,TextDecoder,location:{href:'https://review.test/api/atlas-review/candidates/'+'f'.repeat(64)+'/assets/index.html'},document:{getElementById(){return {}; }},
  fetch:async(url,options)=>{calls.push({url:String(url),options});return {ok:true,arrayBuffer:async()=>new TextEncoder().encode(JSON.stringify(packet)).buffer};},
  require:name=>name==='react'?shim:name==='react-dom/client'?{createRoot(){return {render(element){component=element.type;}};}}:require(name)});
 const render=()=>{cursor=0;return component();};render();await new Promise(r=>setImmediate(r));return {render,calls};
}
test('saved worksheet keeps selection and model on the same candidate without save controls',async()=>{
 const items=[entry('vm:test:right','Right test artery'),entry('vm:test:left','Left test artery')];
 const h=await harness({schema:'visible-medicine.frozen-body-inspection/1',decisionMode:'inspection-only',selections:items});
 let tree=h.render();assert.match(text(tree),/Read-only inspection/);assert.match(text(tree),/cannot record decisions or inherit approval/);
 assert.equal(h.calls.length,1);assert.match(h.calls[0].url,/\/candidates\/f{64}\/assets\/worksheet.json$/);assert.equal(h.calls[0].options.cache,'no-store');
 assert.equal(walk(tree,n=>n.type==='iframe')[0].props.src,'./viewer/index.html?'+items[0].modelQuery);
 walk(tree,n=>n.type==='select')[0].props.onChange({target:{value:'1'}});tree=h.render();
 assert.equal(walk(tree,n=>n.type==='h1')[0].props.children,'Left test artery');assert.equal(walk(tree,n=>n.type==='iframe')[0].props.src,'./viewer/index.html?'+items[1].modelQuery);
 assert.equal(walk(tree,n=>n.type==='button'||n.type==='form').length,0);assert.equal(h.calls.length,1,'No decision request or current worksheet request');
});
test('inconsistent worksheet/model identity fails closed instead of using current material',async()=>{
 const item=entry('vm:test:right','Test');item.modelQuery=new URLSearchParams({kind:'body',study:'1',structure:'vm:other',source:'a'.repeat(64)}).toString();
 const h=await harness({schema:'visible-medicine.frozen-body-inspection/1',decisionMode:'inspection-only',selections:[item]});
 const tree=h.render();assert.match(text(tree),/No current worksheet or model was substituted/);assert.equal(walk(tree,n=>n.type==='iframe').length,0);
});
test('candidate discovery retains normal Review auth and every file has both private gates',()=>{
 const layout=readFileSync('app/workspace/review-candidates/layout.tsx','utf8');assert.match(layout,/export \{default,dynamic\} from '\.\.\/atlas-review\/layout'/);
 const route=readFileSync('app/api/atlas-review/candidates/[candidateId]/assets/[...asset]/route.ts','utf8');assert.match(route,/runClinicalReview\(request/);assert.match(route,/authorizeAtlasDelivery\(env.DB/);assert.match(route,/audience:'administrator-review'/);assert.doesNotMatch(route,/local-demo|skipAuth|bypass/i);
 const inbox=readFileSync('components/ClinicalReviewInbox.tsx','utf8');assert.match(inbox,/href="\/workspace\/review-candidates" target="_blank" rel="noopener noreferrer"/);
});
