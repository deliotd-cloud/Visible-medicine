// Real learner/Review parity against exact baseline source; no private decisions.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {createGitObjectReader} from './git-object-reader.mjs';
import {build} from './workspace-test-build.mjs';
import {beforeThoracicDiscMri,hashThoracicMri as hash} from './thoracic-disc-mri-history.mjs';
import transition from '../content/thoracic-disc-mri-revision.transition.json' with {type:'json'};
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),baseline='591550a37e707d9920aa3265dc604bf79b9d68a5';
// This historical test retains the actual eleven-change epoch and every original
// assertion. The cervical test separately checks live source against this tip.
const thoracicTip='6601e0dbb3a0e5a1f3c88781f4e1a73568e760c0';
const tracked=new Map(execFileSync('git',['ls-tree','-r',baseline],{cwd:root,encoding:'utf8',maxBuffer:16e6}).trim().split('\n').map(line=>{const m=/^\d+ blob ([a-f0-9]{40})\t(.+)$/.exec(line);return m?[m[2],m[1]]:[];}));
const tipTracked=new Map(execFileSync('git',['ls-tree','-r',thoracicTip],{cwd:root,encoding:'utf8',maxBuffer:16e6}).trim().split('\n').map(line=>{const m=/^\d+ blob ([a-f0-9]{40})\t(.+)$/.exec(line);return m?[m[2],m[1]]:[];}));
const reader=createGitObjectReader({cwd:root});
const git=async (path,tip=false)=>{const files=tip?tipTracked:tracked;assert(files.has(path),'Missing exact epoch blob '+path);return (await reader.readBlob(files.get(path))).toString('utf8');};
const entry=`export {bodyLesson,bodyContent} from './app/body-content.ts';
export {bodyDisplayCatalog} from './lib/body-display-catalog.ts';
export {contentTabs} from './lib/content-types.ts';
export {spineImagingLesson} from './lib/spine-imaging.ts';
export {spineImagingTopics,spineImagingReferences} from './content/spine-imaging-concepts.ts';
export {bodyReviewSnapshot,bodyReviewMaterial} from './lib/body-review-material.ts';
export {bodyReviewContext} from './lib/body-review-context.ts';
export {bodyReviewDisplayMatches} from './lib/body-review-display-integrity.ts';
export {parseBodyReviewResponse} from './lib/body-review-response.ts';`;
async function load(prior,tip=false){
 const b=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:prior?[{name:'exact-baseline-current-renderer-only',setup(api){
  api.onResolve({filter:/^node:/},args=>({path:args.path,external:true}));
  api.onLoad({filter:/.*/},async args=>{const path=relative(root,args.path).replaceAll('\\','/');if(path.startsWith('node_modules/'))return;assert(!path.startsWith('../'));
   // Isolate teaching against exact Git source with one explicit shared current
   // renderer substitution. Geometry re-review is tested separately, not hidden.
   const contents=path==='content/body-renderer-revision.json'?await readFile(resolve(root,path),'utf8'):await git(path,tip);
   return {contents,loader:({'.ts':'ts','.tsx':'tsx','.json':'json','.mjs':'js'})[extname(path)]||'js',resolveDir:dirname(args.path)};});
 }}]:[]});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
}
let old,current,catalog;
try{old=await load(true);current=await load(true,true);const raw=JSON.parse(await readFile(resolve(root,'public/models/bodyparts3d/full-body/catalog.json'),'utf8'));
 assert.deepEqual(raw,JSON.parse(await git('public/models/bodyparts3d/full-body/catalog.json')));catalog=current.bodyDisplayCatalog(raw);assert.deepEqual(catalog,old.bodyDisplayCatalog(raw));
 for(const path of ['content/spine-imaging-pins.json','content/spine-imaging.before.json','content/lumbar-disc-mri-revision.transition.json'])assert.deepEqual(JSON.parse(await readFile(resolve(root,path),'utf8')),JSON.parse(await git(path)),'Immutable original '+path);
}finally{await reader.close();}
const ids=new Set(transition.entries.map(e=>e.identity.id));let changed=0,preserved=0,packets=0,sourceRefusals=0,staleRefusals=0;
for(const s of catalog.structures)for(const tab of current.contentTabs){const a=old.bodyLesson(s,tab),b=current.bodyLesson(s,tab);
 if(ids.has(s.id)&&tab==='mri'){assert.notDeepEqual(b,a);assert.deepEqual(b,current.spineImagingLesson(s,tab));changed++;}else{assert.deepEqual(b,a,s.id+' '+tab);preserved++;}}
assert.equal(changed,11);assert.equal(preserved,9925);
for(const s of catalog.structures){
 const a=await old.bodyReviewMaterial(s.id),b=await current.bodyReviewMaterial(s.id);
 if(!ids.has(s.id)){assert.deepEqual(b,a,'Unrelated material, shared current renderer '+s.id);packets++;continue;}
 const e=transition.entries.find(e=>e.identity.id===s.id),lesson=current.bodyLesson(s,'mri');assert.deepEqual(s,e.identity);assert.equal(hash(lesson),e.newSha256);assert.equal(hash(old.bodyLesson(s,'mri')),e.oldSha256);assert.equal(lesson.readiness,'draft');
 assert.deepEqual(current.bodyReviewSnapshot(s.id).topics.find(t=>t.tab==='mri'),{tab:'mri',...lesson});assert.equal(b.approval,false);assert.equal(b.status,'worksheet-not-submitted');
 assert.equal(await current.bodyReviewDisplayMatches(b,s.id),true);assert.deepEqual(await current.parseBodyReviewResponse(b,s.id),b);assert.deepEqual(await current.parseBodyReviewResponse(JSON.parse(JSON.stringify(b)),s.id),b);
 assert.equal(await current.parseBodyReviewResponse(a,s.id),null,'Old teaching is not new approval evidence');staleRefusals++;
 const bad=structuredClone(b);bad.topics.find(t=>t.tab==='mri').body+=' foreign';assert.equal(await current.parseBodyReviewResponse(bad,s.id),null);staleRefusals++;
 const ac=await old.bodyReviewContext(s.id),bc=await current.bodyReviewContext(s.id);assert.equal(ac.sourceHash,bc.sourceHash);assert.notEqual(ac.revisions.teaching,bc.revisions.teaching);assert.equal(ac.revisions.geometry,bc.revisions.geometry,'Explicit shared current renderer');
 for(const mutate of [x=>x.id+='x',x=>x.name+='x',x=>x.fmaId='FMA0',x=>x.sourceName+='x',x=>x.sources[0].sha256='foreign',x=>x.sources[0].file='foreign',x=>x.bounds.min[0]+=.01,x=>x.anchor[0]+=.01,x=>x.region='head-neck',x=>x.laterality='left']){const foreign=structuredClone(s);mutate(foreign);assert.equal(current.spineImagingLesson(foreign,'mri'),undefined);sourceRefusals++;}
}
assert.equal(packets,1093);assert.equal(sourceRefusals,110);assert.equal(staleRefusals,22);
const restored=beforeThoracicDiscMri(current,catalog);assert.equal(beforeThoracicDiscMri(old,catalog),old);
assert.deepEqual(restored.spineImagingTopics,old.spineImagingTopics);assert.deepEqual(restored.spineImagingReferences,old.spineImagingReferences);
for(const s of catalog.structures)for(const tab of current.contentTabs){assert.deepEqual(restored.bodyLesson(s,tab),old.bodyLesson(s,tab));assert.deepEqual(restored.bodyContent(s,tab),old.bodyContent(s,tab));}
let refused=0;const reject=(api,source=catalog)=>{assert.throws(()=>beforeThoracicDiscMri(api,source));refused++;};
for(const field of ['body','bullets','references']){const topics=structuredClone(current.spineImagingTopics);if(field==='body')topics.thoracicDisc.mri.body+=' foreign';else if(field==='bullets')topics.thoracicDisc.mri.bullets[0]+=' foreign';else topics.thoracicDisc.mri.references[0]='disc';reject({...current,spineImagingTopics:topics});}
const other=structuredClone(current.spineImagingTopics);other.lumbarDisc.mri.body+=' foreign';reject({...current,spineImagingTopics:other});
reject({...current,spineImagingReferences:{...current.spineImagingReferences,thoracicMriCoverage:'https://foreign.example/'}});reject({...current,spineImagingReferences:{...current.spineImagingReferences,mri:'https://foreign.example/'}});
reject({...old,spineImagingReferences:{...old.spineImagingReferences,thoracicMriCoverage:undefined}});
reject({...current,spineImagingLesson:()=>transition.entries[0].oldLesson});reject({...current,bodyLesson:()=>transition.entries[0].oldLesson});reject({...current,bodyContent:()=>({body:'foreign'})});reject({...current,spineImagingReferences:undefined});
reject({...current,bodyLesson:(s,t)=>s.id===transition.entries[0].identity.id&&t==='mri'?transition.entries[0].oldLesson:current.bodyLesson(s,t)});
const foreignCatalog=structuredClone(catalog);foreignCatalog.structures.find(s=>ids.has(s.id)).name+=' foreign';reject(current,foreignCatalog);
const omitted={bodyLesson:old.bodyLesson,bodyContent:old.bodyContent};assert.equal(beforeThoracicDiscMri(omitted,catalog),omitted);reject({bodyLesson:current.bodyLesson,bodyContent:current.bodyContent},catalog);
const pending={bodyLesson:s=>transition.entries.find(e=>e.identity.id===s.id)?.pendingLesson};assert.equal(beforeThoracicDiscMri(pending,catalog),pending);
reject({bodyLesson:s=>s.id===transition.entries[0].identity.id?transition.entries[0].oldLesson:transition.entries.find(e=>e.identity.id===s.id)?.pendingLesson},catalog);
const early={};assert.equal(beforeThoracicDiscMri(early),early);reject({bodyLesson:()=>undefined,bodyContent:()=>({body:'foreign'})},undefined);
const detached=restored.bodyLesson(transition.entries[0].identity,'mri');detached.body='foreign';assert.deepEqual(restored.bodyLesson(transition.entries[0].identity,'mri'),transition.entries[0].oldLesson);
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:root,loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require});
const callback=bodyNoteRenderCallback(await readFile(resolve(root,'app/body-explorer.tsx'),'utf8'));
const js=ts.transpile(`(${callback})('mri')`,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});let renders=0;
for(const e of transition.entries){const selected=e.identity,lesson=current.bodyLesson(selected,'mri');
 const html=render(runInNewContext(js,{React,SourceDisplayNotes:scope.exports.SourceDisplayNotes,selected,bodyContent:current.bodyContent,catalog,side:'both',exam:false,ScanLine:()=>null,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:props=>{assert.equal(props.parentId,selected.id);assert.equal(props.topic,'mri');return null;},openNested(){throw Error('No automatic specimen opening');}}));
 assert(html.includes(render(React.createElement('p',null,lesson.body))));for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
 for(const [index,url] of lesson.citations.entries())assert(html.includes(render(React.createElement('a',{href:url,target:'_blank',rel:'noreferrer'},`Reference ${index+1} ↗`))));
 assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));renders++;
}
console.log(JSON.stringify({changedDrafts:changed,otherTopicsExact:preserved,unrelatedReviewMaterialsExactWithSharedCurrentRenderer:packets,sourceRefusals,staleOrForgedPacketRefusals:staleRefusals,predecessorRefusals:refused,actualNoteRenders:renders,exactPredecessor:true,clinicalApproval:false}));
