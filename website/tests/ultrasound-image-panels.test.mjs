import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../package.json',import.meta.url)),ts=require('typescript'),{build}=require('esbuild');
const compiled=await build({stdin:{contents:"export * from './lib/ultrasound-study';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const bounds={x:.25,y:.25,width:.5,height:.5};
function fixture(){return {schema:'vm-ultrasound-teaching/1',id:'synthetic-panels',title:'Synthetic non-medical grid',region:'head-neck',source:{author:'Synthetic QA',license:'CC0-1.0',attribution:'No medical image.',url:null},frames:[{id:'panel-one',title:'Grid panel',orientationNote:'Source pixel coordinates only.',image:{file:'grid.png',sha256:'a'.repeat(64),width:1000,height:600},viewport:{...bounds},annotations:[{id:'center',label:'Synthetic square',polygon:[[.4,.4],[.6,.4],[.6,.6],[.4,.6]],notes:[]}]}]};}
test('optional panel bounds preserve original image and annotation coordinates while cloning and freezing',()=>{
 const raw=fixture(),study=api.parseUltrasoundStudy(raw);raw.frames[0].viewport.x=0;raw.frames[0].annotations[0].polygon[0][0]=0;
 assert.deepEqual(study.frames[0].viewport,bounds);assert(Object.isFrozen(study.frames[0].viewport));assert.deepEqual(study.frames[0].annotations[0].polygon[0],[.4,.4]);assert.equal(study.frames[0].image.width,1000);assert.equal(study.frames[0].image.sha256,'a'.repeat(64));
 const old=fixture();delete old.frames[0].viewport;assert.equal(Object.hasOwn(api.parseUltrasoundStudy(old).frames[0],'viewport'),false);
});
test('invalid, subpixel, foreign and credential-like panel fields cannot enter a study',()=>{
 for(const viewport of [null,[],{...bounds,width:0},{...bounds,height:-1},{...bounds,x:NaN},{...bounds,x:-.1},{...bounds,x:.9},{...bounds,width:.0001},{...bounds,height:.0001},{...bounds,approved:true},{...bounds,patientId:'forbidden'}]){const raw=fixture();raw.frames[0].viewport=viewport;assert.throws(()=>api.parseUltrasoundStudy(raw));}
 const raw=fixture();Object.defineProperty(raw.frames[0].viewport,'x',{get(){throw Error('Do not invoke');}});assert.throws(()=>api.parseUltrasoundStudy(raw),/unknown or missing/);
});
test('all declared answer polygons must remain within the visible source panel',()=>{
 for(const axis of [0,1]){const raw=fixture();raw.frames[0].annotations[0].polygon[0][axis]=.1;assert.throws(()=>api.parseUltrasoundStudy(raw),/inside its declared image panel/);}
 const raw=fixture();raw.frames[0].annotations[0].polygon=[[.25,.25],[.75,.25],[.75,.75],[.25,.75]];assert(api.parseUltrasoundStudy(raw));
});
test('Fit reveals precisely the panel for every pan position, and whole-image packages retain their old window',()=>{
 for(const center of [[.5,.5],[0,1],[-20,50]])assert.deepEqual(api.ultrasoundViewWindow(1,center,bounds),bounds);
 assert.deepEqual(api.ultrasoundViewWindow(2,[.5,.5]),{x:.25,y:.25,width:.5,height:.5});
 assert.deepEqual(api.ultrasoundViewWindow(2,[.5,.5],bounds),{x:.375,y:.375,width:.25,height:.25});
});
test('zoom and drag extremes cannot escape a non-square source panel',()=>{
 const panel={x:.1,y:.2,width:.7,height:.3};
 for(const zoom of [1,1.5,2,3,4])for(const x of [-100,0,.5,1,100])for(const y of [-100,0,.5,1,100]){const w=api.ultrasoundViewWindow(zoom,[x,y],panel);assert(w.x>=panel.x&&w.y>=panel.y);assert(w.x+w.width<=panel.x+panel.width+1e-14);assert(w.y+w.height<=panel.y+panel.height+1e-14);assert.equal(w.width,panel.width/zoom);assert.equal(w.height,panel.height/zoom);}
});
test('projected label coordinates share the exact SVG meet transform and hide other panels',()=>{
 assert.deepEqual(api.projectUltrasoundPoint([.5,.5],{width:1000,height:600},{width:600,height:400},1,[.5,.5],bounds),{x:300,y:200});
 assert.deepEqual(api.projectUltrasoundPoint([.25,.25],{width:1000,height:600},{width:600,height:400},1,[.5,.5],bounds),{x:0,y:20});
 assert.equal(api.projectUltrasoundPoint([.2,.5],{width:1000,height:600},{width:600,height:400},1,[.5,.5],bounds),null);
 assert.equal(api.projectUltrasoundPoint([.3,.3],{width:1000,height:600},{width:600,height:400},4,[.5,.5],bounds),null);
});
const component=readFileSync(new URL('../components/UltrasoundLocalAtlas.tsx',import.meta.url),'utf8'),tree=ts.createSourceFile('UltrasoundLocalAtlas.tsx',component,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function find(predicate){let found;function visit(n){if(predicate(n))found=n;ts.forEachChild(n,visit);}visit(tree);assert(found);return found;}
const erased=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
test('actual pointer handler ignores letterbox pixels outside its displayed window, preserving normal picks',()=>{
 const fn=find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='pointerPick'),calls=[],suppressed={current:false},element={getScreenCTM:()=>({inverse:()=>({})}),createSVGPoint:()=>({x:0,y:0,matrixTransform(){return {x:this.x,y:this.y};}})};
 const invoke=new Function('svg','frame','validInteraction','suppressPointerClick','imageWindow','pickAt',erased(fn.getText(tree))+';return pointerPick;')({current:element},{image:{width:1000,height:600}},()=>true,suppressed,bounds,(...args)=>calls.push(args));
 invoke({clientX:100,clientY:300});invoke({clientX:900,clientY:300});invoke({clientX:500,clientY:100});assert.equal(calls.length,0);
 invoke({clientX:500,clientY:300});assert.deepEqual(calls,[[.5,.5]]);suppressed.current=true;invoke({clientX:500,clientY:300});assert.equal(calls.length,1);assert.equal(suppressed.current,false);
});
test('actual camera-centering handler converts source coordinates into panel-relative pan without drift',()=>{
 const node=find(n=>ts.isVariableDeclaration(n)&&n.name.getText(tree)==='centerOn'),pans=[];
 const center=new Function('frame','zoom','ultrasoundViewWindow','setPan','return '+erased('const fn='+node.initializer.getText(tree)).replace(/^const fn\s*=\s*/,'').replace(/;\s*$/,''))({viewport:bounds},2,api.ultrasoundViewWindow,p=>pans.push(p));
 center([.5,.5]);assert.deepEqual(pans.pop(),[.5,.5]);center([-10,10]);assert.deepEqual(pans.pop(),[.25,.75]);
});
