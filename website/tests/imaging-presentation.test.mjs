import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import {headSideLabel,headRepresentationLabel} from '../lib/head-atlas-display.ts';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {restorePracticeExitViewer} from './head-practice-exit-inverse.mjs';
import {restorePracticeConfirmConsumer} from './head-practice-confirm-harness-inverse.mjs';
import {replayPartition6History} from './partition6-history-context.mjs';
import {readPresentationFontBeforeProvenance,assertPresentationFontProvenance} from './partition10-font-history.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const text=p=>read(p).toString();
const sha=b=>createHash('sha256').update(b).digest('hex');
const prefix='tests/fixtures/imaging-presentation-before/';
const frozen=[['app/layout.tsx','e99b6206d0554964d022640760a5abefa573b76d910a71c3586a21536315a1be'],['app/globals.css','67dbecc0822dd7c5b08633192ec9dbae32e16d097e8cf87bb7aaaceb4bc45c32'],['components/HeadAtlasViewer.tsx','a9b7c4b3d8f4febab394e983ace55df020cbcc84dc33daa8b2af6e7abd90fd1b'],['tests/local-font-distribution.test.mjs','a753076617d8f98e5dfa23b6fd7713af874b70c42b1b6e6102ef3e4e86e28396'],['tests/font-alias-scope.test.mjs','260cab95ad4cbf654cbaff873670a325e8646735311fa7b646f9cc1f09583acd'],['tests/head-model-access-integration.test.mjs','3e4148fd91b12dd7952c2551a981b5071300ec31438eef1df67c56960140f459'],['tests/fixtures/current-atlas-delivery.json','b93a2991bb3afd282ba60316e2a84e0a3b4a6dd3ffcf305d3f488254f1ab2029']];
const once=(s,from,to)=>{assert.equal(s.split(from).length,2,from);return s.replace(from,to);};

test('wording and historical-test repairs preserve the complete preceding consumers',()=>{
 const rows=[['head-open-state.test.ts','17bfb804d6eda7bf55cd9a57795c4d8ca58c237126caf5f6784f7fc4b9b910af'],['head-disclosure-harness-preservation.test.mjs','b3e4fcef813339ee685f821c5d40de52965f81d7a7a2f75f0d678b8b82f84b29'],['head-history-role-preservation.test.mjs','969472e3491b6aff691228a5f7a6af09f9ea10bfbe44f474dc51d3469c5c799e']];
 const disclosure=" if(file==='head-open-state.test.ts'){const now='`${count} listed annotations`',before='`${count} accepted annotations`';assert.equal(current.split(now).length,2);current=current.replace(now,before);}\n";
 for(const[p,h]of rows){
  const old=read(prefix+'tests/'+p+'.raw');assert.equal(sha(old),h);let now=restorePracticeConfirmConsumer(p,read('tests/'+p)).toString();
  if(p===rows[0][0])now=once(now,'`${count} listed annotations`','`${count} accepted annotations`');
  if(p===rows[1][0])now=once(now,disclosure,'');
  if(p===rows[2][0]){
   now=once(now,"import {restoreMigrationLaterRole} from './head-manual-migration-later-inverse.mjs';\n",'');
   now=once(now," if(name===rows[3][0])text=restoreMigrationLaterRole(name+'.test.mjs',Buffer.from(text),read('./fixtures/live-learning-consumer-loader/head-manual-recovery-migration.test.mjs.raw')).toString();\n",'');
   now=once(now," if(name===rows[0][0]){text=once(text,\""+disclosure.replace(/\n$/,'\\n')+"\",'');return once(text,appendix.disclosure,'');}"," if(name===rows[0][0])return once(text,appendix.disclosure,'');");
   now=once(now,"  if(name===rows[3][0])assert.throws(()=>reverse(name,historical+'\\n// forged mutation'),name);\n  else assert.notDeepEqual",'  assert.notDeepEqual');
  }
  assert.deepEqual(Buffer.from(now),old,p+' full original assertions survive');
 }
});

test('complete source preimages authenticate unchanged auth, anatomy and old assertion bodies',()=>{
 for(const[p,h]of frozen)assert.equal(sha(read(prefix+p+'.raw')),h,p);
 const old=text(prefix+'app/layout.tsx.raw'),current=text('app/layout.tsx');
 let expected=once(old,'import localFont from "next/font/local";\n','');
 expected=once(expected,'const geistMono = localFont({ src: "../public/fonts/geist-mono-latin.woff2", variable: "--font-atlas-mono", weight: "100 900", style: "normal", display: "swap" });\r\n','');
 expected=once(expected,'<body className={geistMono.variable}>\n','<body className="vm-font-mono">\r\n');
 assert.equal(current,expected,'No auth, splash, navigation or metadata edits');
 let oldViewer=text(prefix+'components/HeadAtlasViewer.tsx.raw');
 oldViewer=once(oldViewer,'{count} accepted annotations · no diagnostic use','{count} listed annotations · per-structure scope varies · no diagnostic use');
 oldViewer=once(oldViewer,'Approved cosmetics v1.0.2 · {count} accepted annotations.</p>','Approved cosmetics v1.0.2 (display only) · {count} listed annotations.</p><details onKeyDown={headDisclosureKeyDown}><summary>Annotation count and review scope</summary><p>This is the package’s fixed modality inventory. Entries may be masks or point/curve locators; review each selected representation and declared anatomical scope above. The total does not establish complete boundaries, teaching approval or clinical sign-off.</p></details>');
 const historical=replayPartition6History('imaging-presentation.test.mjs');
 assert.equal(createHash('sha256').update(historical.testBytes).digest('hex'),'9f118da67ed3d535d5d3611b034eeac97306b4dccd5208f09b22c48b02931383');
 assert.equal(restorePracticeExitViewer(readFileSync('F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/website/components/HeadAtlasViewer.tsx','utf8')),oldViewer,'The two inventory/cosmetic copy seams hold at their authenticated source epoch');
 const oldCss=text(prefix+'app/globals.css.raw'),css=text('app/globals.css');assert(css.startsWith(oldCss),'Original complete CSS is an exact prefix');
 for(const file of ['local-font-distribution.test.mjs','font-alias-scope.test.mjs']){
  const original=text(prefix+'tests/'+file+'.raw'),next=text('tests/'+file);
  const bodies=s=>{const ast=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),out=[];const visit=n=>{if(ts.isCallExpression(n)&&n.expression.getText(ast)==='test')out.push(n.arguments[1].getText(ast));ts.forEachChild(n,visit);};visit(ast);return out;};
  const before=bodies(original),after=bodies(next);assert.equal(after.length,before.length);
  for(let i=0;i<before.length;i++)assert.equal(after[i].replaceAll("read('tests/fixtures/imaging-presentation-before/app/layout.tsx.raw')","read('app/layout.tsx')"),before[i],'Every old assertion survives; loader-only checks are explicitly historical');
 }
});

test('current CSS serves the existing font through the public URL and only supplies the mono variable',()=>{
 const require=createRequire(import.meta.url),postcss=require('postcss'),css=postcss.parse(text('app/globals.css'));
 const faces=[];css.walkAtRules('font-face',r=>{if(r.nodes.some(n=>n.prop==='font-family'&&n.value==='"Geist Mono"'))faces.push(Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value])));});
 assert.deepEqual(faces,[{'font-family':'"Geist Mono"',src:'url("/fonts/geist-mono-latin.woff2") format("woff2")','font-weight':'100 900','font-style':'normal','font-display':'swap'}]);
 const providers=[];css.walkRules('body.vm-font-mono',r=>providers.push(r));assert.equal(providers.length,1);assert.equal(providers[0].nodes.length,1);assert.equal(providers[0].nodes[0].prop,'--font-atlas-mono');assert.match(providers[0].nodes[0].value,/^"Geist Mono",.*monospace$/);
 const layout=text('app/layout.tsx');assert.match(layout,/<body className="vm-font-mono">/);assert.doesNotMatch(layout,/next\/font|localFont\(/);
 assert.doesNotMatch(text('app/globals.css').slice(text(prefix+'app/globals.css.raw').length),/https?:|@import/);
 assert.equal(sha(readPresentationFontBeforeProvenance()),'5f3d6ad60f29d6cb708414ec6887163d63bf197377ef5417d2483ff31ace6c3b');
 assertPresentationFontProvenance({read});
});

const viewer=text('components/HeadAtlasViewer.tsx');
const ast=ts.createSourceFile('viewer.tsx',viewer,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function nodeWhere(check){const out=[];const visit=n=>{if(check(n))out.push(n);ts.forEachChild(n,visit);};visit(ast);assert.equal(out.length,1);return out[0];}
function render(node,context){const code=ts.transpileModule(`export const render=()=>(${node.getText(ast)});`,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};new Function('require','module','exports',...Object.keys(context),code)(createRequire(import.meta.url),module,module.exports,...Object.values(context));return renderToStaticMarkup(module.exports.render());}
const notice=nodeWhere(n=>ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='p'&&n.getText(ast).startsWith('<p>{count} listed annotations'));
const studyNode=nodeWhere(n=>ts.isJsxElement(n)&&n.openingElement.getText(ast).includes('className="head-source-note"'));
const selectedNode=nodeWhere(n=>ts.isJsxFragment(n)&&n.getText(ast).startsWith('<><dl>'));

for(const[modality,count]of [['CT',355],['MRI',117]])test(`${modality} actual notice and Study disclosure separate inventory, cosmetics and clinical scope`,()=>{
 assert.match(viewer,/const count=modality==='CT'\?355:117/);
 const html=render(notice,{count});assert(html.includes(`${count} listed annotations`));assert.match(html,/per-structure scope varies/);assert.match(html,/no diagnostic use/);assert.match(html,/no automatic 3D-reference registration/);assert.doesNotMatch(html,/accepted annotations/);
 const study=render(studyNode,{count,modality,study:{geometry:{oblique:true}},preserveScanTab:false,headDisclosureKeyDown:()=>{},AtlasIssueDetails:()=>null,readIssueContext:()=>null,Link:({children,href})=>createRequire(import.meta.url)('react').createElement('a',{href},children)});
 assert.match(study,/Approved cosmetics v1.0.2 \(display only\)/);assert.match(study,/Annotation count and review scope/);assert.match(study,/does not establish complete boundaries, teaching approval or clinical sign-off/);assert.match(study,/CT and MRI are different subjects/);assert.match(study,/not registered to this study/);assert.match(study,/Native oblique planes/);assert.match(study,modality==='CT'?/Unmodified CT native intensity/:/MRI intensity is not HU/);
});

test('actual selected metadata renders exact synthetic scope/flags without inferred acceptance',()=>{
 for(const representation of ['partial-mask','point','curve']){
  const entry={family:'test',representation,laterality:'left',source:{declared_scope:'Synthetic limited extent <not a clinical assertion>.',geometry_alias_of:'synthetic-peer',flags:['Synthetic restriction A','Synthetic restriction B']},supplementary_geometries:[{part_id:'synthetic-path',declared_scope:'Synthetic path only.'}]},before=structuredClone(entry);
  const html=render(selectedNode,{selected:{entry},familyNames:{test:'Synthetic'},headRepresentationLabel,headSideLabel,headDisclosureKeyDown:()=>{},setExpanded:()=>{}});
  assert(html.includes('Synthetic limited extent &lt;not a clinical assertion&gt;.'));assert.match(html,/Synthetic restriction A · Synthetic restriction B/);assert.match(html,/Synthetic path only/);assert(html.includes(headRepresentationLabel(representation)));assert.deepEqual(entry,before);
 }
});

test('current Review binds the wording while the prior pin is explicitly refused',()=>{
 const pin=validateCurrentAtlasDelivery(),old=JSON.parse(read(prefix+'tests/fixtures/current-atlas-delivery.json.raw'));assert.equal(pin.source,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');assert.notEqual(pin.source,old.source);assert.notEqual(pin.sourceTree,old.sourceTree);assert.notEqual(pin.reviewIntegration,old.reviewIntegration);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const inputs=JSON.parse(read('atlas-review/integration-inputs.json'));assert.equal(inputs.inputs.find(r=>r.path==='components/HeadAtlasViewer.tsx').sha256,sha(read('components/HeadAtlasViewer.tsx')));
 const oldIntegration=text(prefix+'tests/head-model-access-integration.test.mjs.raw');assert.equal(text('tests/head-model-access-integration.test.mjs').replace('1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc',old.reviewIntegration),oldIntegration);
});
