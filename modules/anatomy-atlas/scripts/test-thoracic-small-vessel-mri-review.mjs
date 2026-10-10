import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
const root=fileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
process.chdir(root);
const require=createRequire(root+'/package.json'),React=require('react'),ts=require('typescript');
const render=require('react-dom/server').renderToStaticMarkup;
const {build}=await import(pathToFileURL(root+'/scripts/workspace-component-test-build.mjs'));
const {exactSourceHistoryApi}=await import(pathToFileURL(root+'/scripts/exact-source-history-api.mjs'));
const pins=JSON.parse(readFileSync(root+'/content/thoracic-small-vessel-mri-pins.json'));
const before=await exactSourceHistoryApi(pins.parentCommit,'review-security');
const result=await build({stdin:{contents:`export * from './app/body-content';export * from './lib/body-review-material';export * from './lib/body-review-response';export * from './lib/body-review-context';export * from './lib/body-review-api';export * from './lib/body-review-decisions';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {SourceDisplayNotes} from './app/source-display-notes';`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
const module={exports:{}};runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,TextDecoder,structuredClone,URL,URLSearchParams,Request,Response,Headers});
const api=module.exports,catalog=api.bodyDisplayCatalog(JSON.parse(readFileSync(root+'/public/models/bodyparts3d/full-body/catalog.json')));
const source=readFileSync(root+'/app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let callback;
function visit(node){if(ts.isArrowFunction(node)&&ts.isBlock(node.body)&&node.body.getText(ast).includes('const content = bodyContent(selected, value);')){assert.equal(callback,undefined);callback=node.getText(ast);}ts.forEachChild(node,visit);}visit(ast);assert(callback);
const callbackJs=ts.transpile('const renderNote='+callback,{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React});
const same=(a,b)=>assert.deepEqual(structuredClone(a),structuredClone(b));
let rendered=0,packets=0,refused=0,stalePosts=0;
for(const {identity:s} of pins.entries){
 const lesson=api.bodyLesson(s,'mri');
 const tree=runInNewContext(callbackJs+';renderNote(topic)',{React,topic:'mri',bodyContent:api.bodyContent,selected:s,SourceDisplayNotes:api.SourceDisplayNotes,WorkspaceModeButton:({children})=>React.createElement('button',null,children),ComponentImagingNotes:()=>null,ScanLine:()=>null,catalog,side:'both',exam:false,openNested(){throw Error('Unexpected specimen navigation');}});
 const html=render(tree);assert(html.includes(render(React.createElement('p',null,lesson.body))));
 for(const bullet of lesson.bullets)assert(html.includes(render(React.createElement('li',null,bullet))));
 for(const url of lesson.citations)assert(html.includes(url.replaceAll('&','&amp;')));
 assert(html.includes('No imaging study loaded'));rendered++;
 const packet=await api.bodyReviewMaterial(s.id),old=await before.bodyReviewMaterial(s.id);
 same(packet.source,old.source);same(packet.reasoning,old.reasoning);same(packet.guidedTours,old.guidedTours);
 assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
 assert.notEqual(packet.fingerprints.teaching,old.fingerprints.teaching);
 same(packet.topics.find(t=>t.tab==='mri'),{tab:'mri',...lesson});
 same(await api.parseBodyReviewResponse(packet,s.id),packet);packets++;
 for(const change of [p=>p.topics.find(t=>t.tab==='mri').body='Foreign wording',p=>p.source.structure.sources[0].sha256='0'.repeat(64)]){
  const invalid=structuredClone(packet);change(invalid);assert.equal(await api.parseBodyReviewResponse(invalid,s.id),null);refused++;
 }
 assert.equal(await api.parseBodyReviewResponse(old,s.id),null);refused++;
 const c=await api.bodyReviewContext(s.id),prior=await before.bodyReviewContext(s.id);
 assert.equal(c.revisions.imaging,null);
 const storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
 for(const delta of [{materialHash:old.materialHash},{revisionHash:prior.revisions.teaching}]){
  const response=await api.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_THORACIC_MRI_REVIEW'},body:JSON.stringify({catalogScope:c.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:c.materialHash,revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,draft:api.blankBodyReview(c,'teaching'),...delta})}),storage);
  assert.equal(response.status,409);stalePosts++;
 }
}
const evidence={rendered,packets,refused,stalePosts,clinicalApproval:false,browserAcceptance:false};
console.log(JSON.stringify(evidence));
