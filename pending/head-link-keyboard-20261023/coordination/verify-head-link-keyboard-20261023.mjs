// Bound proposal verification only: importing this module has no side effects.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
export const stage='F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard',site=stage+'/website';
const text=p=>fs.readFileSync(p,'utf8'),lf=s=>s.replaceAll('\r\n','\n'),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
export const suites=['head-link-menu-keyboard.test.mjs','head-comparison-compact-ui.test.mjs','head-learning-picker.test.ts',
 'head-learning-picker-dismiss.test.mjs','head-comparison-revision.test.ts','head-model-access-navigation.test.ts',
 'related-lecture-entrypoints.test.ts','head-ct-facial-navigation-status.test.mjs','head-model-blank-recovery.test.mjs',
 'head-link-availability.test.ts','head-atlas-comparison.test.ts','head-learning-navigation.test.ts','head-live-selection.test.ts',
 'head-linked-navigation-regressions-20261009.test.ts','head-viewer-disclosure-keyboard.test.mjs'];
export function verifyProposal(){
 const prep=json(stage+'/PREPARATION.json');assert.equal(hash(prep.parentReceipt),prep.parentReceiptSha256);
 const parent=json(prep.parentReceipt),changed=[];
 for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256);if(hash(site+'/'+r.path)!==r.sha256)changed.push(r.path);}
 assert.deepEqual(new Set(changed),new Set(prep.preimages.map(r=>r.path)));
 for(const r of prep.preimages)assert.equal(hash(r.preserved),r.sha256);
 const ts=createRequire(site+'/package.json')('typescript');
 const assertionCalls=(p)=>{const tree=ts.createSourceFile(p,lf(text(p)),ts.ScriptTarget.Latest,true,p.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS),calls=[];
  function visit(n){if(ts.isCallExpression(n)&&/^assert(?:\.|$)/.test(n.expression.getText(tree)))calls.push(n.getText(tree).replaceAll("':scope > summary'","'summary'").replace(/\s+/g,' '));ts.forEachChild(n,visit);}visit(tree);return calls;};
 for(const r of prep.preimages.filter(r=>r.path.startsWith('tests/')))assert.deepEqual(assertionCalls(site+'/'+r.path),assertionCalls(r.preserved),r.path+' retains every assertion in order');
 const beforeNavigation=lf(text(prep.preimages[0].preserved)),beforePicker=lf(text(prep.preimages[1].preserved));
 const oldHandler=beforeNavigation.slice(beforeNavigation.indexOf('function closeComparisonPanel('),beforeNavigation.indexOf('function closeComparisonPanelOnFocusExit('));
 let inverse=lf(text(site+'/'+prep.preimages[0].path)).replace("import type {FocusEvent,ReactNode} from 'react';","import type {FocusEvent,KeyboardEvent,ReactNode} from 'react';")
  .replace("import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';\n",'')
  .replaceAll(' onKeyDown={headDisclosureKeyDown} onBlur=',' onKeyDown={closeComparisonPanel} onBlur=')
  .replaceAll(' onKeyDown={headDisclosureKeyDown}','')
  .replace('function closeComparisonPanelOnFocusExit(',oldHandler+'function closeComparisonPanelOnFocusExit(');
 assert.equal(inverse,beforeNavigation,'Only the declared handler/import/details seams change');
 const oldPickerHandler=beforePicker.slice(beforePicker.indexOf('}} onKeyDown={event=>{'),beforePicker.indexOf('    <summary>Linked tours</summary>'));
 const pickerInverse=lf(text(site+'/'+prep.preimages[1].path)).replace("import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';\n",'')
  .replace('}} onKeyDown={headDisclosureKeyDown}>\n',oldPickerHandler);
 assert.equal(pickerInverse,beforePicker,'No click, submit, navigation, pin or tour change');
 const types=json(stage+'/checks/TYPES.corrected.json');assert.equal(types.diagnosticCount,0);assert.equal(types.roots.length,2);assert.equal(types.ambient.length,6);
 for(const r of types.sourceFiles)assert.equal(hash(r.path),r.sha256);
 const browser=json(stage+'/browser/BUILD.json');for(const r of browser.inputs)assert.equal(hash(stage+'/browser/'+r.path),r.sha256);for(const r of browser.outputs)assert.equal(hash(stage+'/browser/'+r.path),r.sha256);
 const ui=json(stage+'/browser/ui-1.json'),probe=ui.observations[0];assert.equal(probe.kind,'composing');
 for(const r of [probe.before,probe.composing,probe.legacy]){assert.equal(r.outer.find(r=>r.summary==='More learning').open,true);assert.equal(r.nested.find(r=>r.summary==='Linked tours').open,true);assert.equal(r.scrollY,0);assert.equal(r.scrollWidth<=r.viewportWidth,true);}
 assert.deepEqual(probe.composing,probe.before);assert.deepEqual(probe.legacy,probe.before);assert.deepEqual(ui.navigation,[]);
 const b=json(stage+'/browser/OBSERVATIONS.json');assert.equal(b.ownedTabClosed,true);assert.equal(b.serverStopped,true);
 const {pid}=json(stage+'/browser/STARTED.json');assert.throws(()=>process.kill(pid,0),e=>e.code==='ESRCH');
 const sourceRows=[...parent.sourceRows.map(r=>({path:r.path,bytes:fs.statSync(site+'/'+r.path).size,sha256:hash(site+'/'+r.path)})),
  {path:'tests/head-link-menu-keyboard.test.mjs',bytes:fs.statSync(site+'/tests/head-link-menu-keyboard.test.mjs').size,sha256:hash(site+'/tests/head-link-menu-keyboard.test.mjs')}];
 return{prep,parent,changed,sourceRows,types,browser};
}
if(process.argv[2]==='tests'){
 const before=suites.map(p=>({path:'tests/'+p,sha256:hash(site+'/tests/'+p)})),args=['--max-old-space-size=192','--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...suites.map(p=>'tests/'+p)];
 const out=fs.openSync(stage+'/checks/focused-final.log','wx'),err=fs.openSync(stage+'/checks/focused-final.stderr.log','wx');
 const result=spawnSync(process.execPath,args,{cwd:site,env:{...process.env,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',out,err],windowsHide:true});fs.closeSync(out);fs.closeSync(err);
 for(const r of before)assert.equal(hash(site+'/'+r.path),r.sha256);
 const counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped'].map(k=>[k,Number(text(stage+'/checks/focused-final.log').match(new RegExp('^# '+k+' (\\d+)$','m'))?.[1]??-1)]));
 write(stage+'/checks/NATIVE.json',{at:new Date().toISOString(),args,code:result.status,counts,before,stdoutSha256:hash(stage+'/checks/focused-final.log'),stderrSha256:hash(stage+'/checks/focused-final.stderr.log'),previewChanged:false});
 console.log(JSON.stringify({code:result.status,counts}));process.exitCode=result.status===0?0:1;
}else if(process.argv[2]==='seal'){
 const r=verifyProposal(),n=json(stage+'/checks/NATIVE.json');assert.equal(n.code,0);assert.equal(n.counts.pass,75);assert.equal(n.counts.fail+n.counts.skipped+n.counts.cancelled,0);
 for(const row of n.before)assert.equal(hash(site+'/'+row.path),row.sha256);assert.equal(hash(stage+'/checks/focused-final.log'),n.stdoutSha256);
 write(stage+'/PROPOSAL.json',{at:new Date().toISOString(),website:site,parentReceipt:r.prep.parentReceipt,parentReceiptSha256:r.prep.parentReceiptSha256,
  atlas:r.parent.atlas,atlasHead:r.parent.atlasHead,atlasTree:r.parent.atlasTree,changedPaths:r.changed,addedPaths:['tests/head-link-menu-keyboard.test.mjs'],
  sourceRows:r.sourceRows,sourcePaths:r.sourceRows.length,nativeCases:75,focusedTypeRoots:2,focusedTypeFiles:r.types.sourceFiles.length,focusedTypeDiagnostics:0,
  originalTestAssertionsPreserved:true,productionChangeWholeTextInverses:true,actualBrowserComponents:true,syntheticCompositionEvents:true,nativeEscapeObserved:true,
  authenticatedAcceptance:false,actualDeviceImeAcceptance:false,protectedIntegrationRebindPending:true,productionBuildPending:true,
  normalPreviewUnchanged:true,installed:false,publicDeployment:false,clinicalApproval:false,spatialRegistration:false});
 console.log(JSON.stringify({proposal:stage+'/PROPOSAL.json',sha256:hash(stage+'/PROPOSAL.json'),changed:r.changed.length,sourcePaths:r.sourceRows.length}));
}
