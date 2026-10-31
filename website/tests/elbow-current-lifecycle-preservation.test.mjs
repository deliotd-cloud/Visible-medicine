// Portable preservation and tamper contract; does not substitute for native feature execution.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const sourceRoot=process.env.VM_WEBSITE_ROOT;
const sourceBase=sourceRoot?pathToFileURL(join(sourceRoot,'tests')+'/'):new URL('./',import.meta.url);
const {restorePriorRegionalTourRole}=await import(new URL('./regional-tour-role-inverse.mjs',sourceBase));
const read=path=>readFileSync(new URL(path,sourceBase));

function restorePreRenalAndMotionElbow(bytes){
 const sha=value=>createHash('sha256').update(value).digest('hex');
 assert.equal(sha(bytes),'c89067baa2b62a5c10a7ebfd874cd0f7b5130ff1af0da247a41f89e72b415aea',
  'Exact later elbow source');
 let text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);
 const one=(later,prior)=>{assert.equal(text.split(later).length,2,'One exact later elbow seam');text=text.replace(later,prior);};
 one("import {assertCurrentRenalSourceBinding,assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';\n",'');
 one("  const currentRegional=assertCurrentRenalSourceBinding();\n",'');
 one("    const historical=committed(revision,path);\n    const source=path==='lib/regional-tours.ts'?committed(currentRevision,path):historical;\n    if(path==='lib/regional-tours.ts'){\n      assert.equal(sha(historical),currentRegional.oldSha256,'original elbow-era regional source remains exact');\n      assert.equal(sha(source),currentRegional.sha256,'current native regional source is exact');\n    }else assert.deepEqual(source,historical,`${path}: elbow-era source survives unchanged`);\n    const copy=readFileSync('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);",
  "    const source=committed(revision,path),copy=readFileSync('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);");
 one("  assertRenalTourEpoch(tours('playback'),api.regionalTours);\n  assert.equal(api.regionalTours.length,55,'current Review carries all native successor tours');",
  "  assert.deepEqual(api.regionalTours,tours('playback'),\n    'all 51 current Review tours and their exact source stops match genuine playback epoch');");
 one("  const rateSource=committed(revision,playerPath);\n  const hintEpoch='30135cdd';\n  const hintSource=committed(hintEpoch,playerPath),currentSource=committed(currentRevision,playerPath);",
  "  const rateSource=committed(revision,playerPath),source190=committed(currentRevision,playerPath);");
 one("  assert.equal(git(['merge-base',hintEpoch,currentRevision]).toString().trim(),\n    git(['rev-parse',hintEpoch]).toString().trim(),'hint epoch is genuine native ancestry');\n",'');
 one('withoutStartHint(hintSource)','withoutStartHint(source190)');
 one("hintSource.toString().replace('Choose Play full tour'","source190.toString().replace('Choose Play full tour'");
 one('currentSource.toString().replaceAll','source190.toString().replaceAll');
 one('sha(currentSource));assert.equal(playerRecord.importedSha256','sha(source190));assert.equal(playerRecord.importedSha256');
 one("  assert.match(currentPlayer.toString(),/transitionMs=\\{active&&!reduced&&!entryPendingMotion\\?\\(continuous\\?guidedSweepDuration\\(playbackRate\\):1800\\):0\\}/,\n    'current rate-aware and legacy camera branches retain reduced-motion and entry-motion gates');",
  "  assert.match(currentPlayer.toString(),/transitionMs=\\{active&&!reduced\\?\\(continuous\\?guidedSweepDuration\\(playbackRate\\):1800\\):0\\}/,\n    'current rate-aware and legacy camera branches both keep reduced motion at zero');");
 assert.equal(sha(Buffer.from(text)),'4cfe1d8c84bd0be8f628ac4c1e5bf8d080f563e608a6918c77ed550be50b0402',
  'Complete pre-renal elbow source');
 return Buffer.from(text);
}

function invertTourType(currentBytes,deltaBytes,priorBytes){
 const decode=(bytes,label)=>{
  const text=bytes.toString('utf8');
  assert.deepEqual(Buffer.from(text),bytes,`${label}: lossless UTF-8`);
  assert(!text.includes('\r'),`${label}: exact LF representation`);
  return text;
 };
 const current=decode(currentBytes,'current elbow test').split('\n');
 const delta=decode(deltaBytes,'reviewed elbow delta').split('\n');
 assert.equal(delta.at(-1),'','Delta ends with LF');
 let cursor=0,index=0,hunks=0;
 const restored=[];
 while(index<delta.length-1){
  const head=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(delta[index++]);
  assert(head,'Declared elbow hunk');
  const oldStart=Number(head[1]),oldCount=Number(head[2]??1);
  const newStart=Number(head[3]),newCount=Number(head[4]??1);
  const oldIndex=oldCount===0?oldStart:oldStart-1;
  const newIndex=newCount===0?newStart:newStart-1;
  assert(newIndex>=cursor&&newIndex<=current.length,'Ordered current hunk');
  restored.push(...current.slice(cursor,newIndex));cursor=newIndex;
  assert.equal(restored.length,oldIndex,'Exact prior hunk position');
  let oldSeen=0,newSeen=0;
  while(index<delta.length-1&&!delta[index].startsWith('@@ ')){
   const line=delta[index++],mode=line[0],value=line.slice(1);
   assert(mode==='+'||mode==='-'||mode===' ','Only declared delta lines');
   if(mode!=='-'){
    assert.equal(current[cursor++],value,'Exact current hunk line');newSeen++;
   }
   if(mode!=='+'){restored.push(value);oldSeen++;}
  }
  assert.equal(oldSeen,oldCount,'Complete prior hunk');
  assert.equal(newSeen,newCount,'Complete current hunk');
  hunks++;
 }
 assert.equal(hunks,3,'All three tour/type hunks declared');
 restored.push(...current.slice(cursor));
 const prior=Buffer.from(restored.join('\n'));
 assert.deepEqual(prior,priorBytes,'Complete earlier current test restored');
 return prior;
}

test('elbow original201 lines survive eight explicit tour/player lifecycle seams; tampering is refused',()=>{
 const original=read('./fixtures/clinical-review-elbow-arterial-tour-before-lifecycle.ts.raw');
 const later=read('./clinical-review-elbow-arterial-tour.test.ts');
 assert.throws(()=>restorePreRenalAndMotionElbow(Buffer.from(later.toString().replace(
  'assertRenalTourEpoch(tours(\'playback\'),api.regionalTours);',
  'assertRenalTourEpoch(tours(\'elbow\'),api.regionalTours);'))),
  'Changed later renal tour proof must be refused');
 const candidate=restorePriorRegionalTourRole('clinical-review-elbow-arterial-tour.test.ts',
  restorePreRenalAndMotionElbow(later));
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const originalSha='5d14824a266020120ba92957008670d04b167beae5aa591ba3b0555aa853450e';
 const beforeCurrentSha='15bb108f73a9eb2719edca3708e7b4ea9844c8f555db4495c8045c83ede40f99';
 const priorCurrentSha='ecdaa555bffb332aab67d481c6873e0dc7ea28bc25cb3459ae1b4b8dd6e9df72';
 const candidateSha='1b2f22d6bee38da836cc3e491b1b16fec3c0bc4fca0b577cf9e127cf0d081490';
 const priorCurrent=read('./fixtures/elbow-current-before-tour-type.ts.raw');
 const delta=read('./fixtures/elbow-current-tour-type.delta.raw');
 assert.equal(sha(priorCurrent),priorCurrentSha,'Earlier exact current test');
 assert.equal(sha(delta),'78dcfb8155c9c6928f5787ea6249aa8a7fda71baa08ecfaba1dfa1f1cb55b261','Reviewed tour/type delta');
 assert.equal(sha(original),originalSha,'Byte-exact canonical original');
 const addedImport="import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n";
 const oldRoot="const atlas='F:/VisibleMedicine/atlas';",newRoot='const atlas=currentAtlasDeliveryRoot();';
 const oldHref="assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(entry.id));";
 const newHref="assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(entry.id)+'&t=teaching');";
 const beforeCurrent=invertTourType(candidate,delta,priorCurrent).toString('utf8');
 for(const [text,label] of [[addedImport,'root import'],[newRoot,'checked root'],[newHref,'Teaching URL']])
  assert.equal(beforeCurrent.split(text).length,2,'Unique new seam: '+label);
 const inverted=beforeCurrent.replace(addedImport,'').replace(newRoot,oldRoot).replace(newHref,oldHref);
 assert.equal(sha(Buffer.from(inverted)),beforeCurrentSha,'Exact whole-file inverse restores previous current test');
 const oldLines=original.toString().replaceAll('\r\n','\n').split('\n');
 const replaced=[
  oldRoot,
  "  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);",
  "  const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);",
  '  assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);',
  '  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,revision,name);',
  "  const legacyTours=api.regionalTours.filter((item:{id:string})=>item.id!=='portal-hepatic-venous-relationships');",
  '  assert.equal(api.regionalTours.length,48);',
  '  assert.equal(api.regionalTours.reduce((count:number,item:{steps:unknown[]})=>count+item.steps.length,0),290);',
  "  const player=readFileSync('atlas-review/app/regional-guided-learning.tsx','utf8');",
  '    assert(previous&&now&&packet,entry.id);'+oldHref,
 ];
 for(const line of replaced)assert.equal(oldLines.filter(row=>row===line).length,1,
  'Unique original lifecycle seam: '+line);
 const retained=oldLines.filter(line=>!replaced.includes(line));
 assert.equal(retained.length,199);
 assert.equal(retained.length+2,201,'The two new seams invert to the prior 201-line retention contract');
 function verify(bytes){
  assert.equal(sha(bytes),candidateSha,'Exact reviewed candidate');
  const text=bytes.toString();
  const priorText=invertTourType(bytes,delta,priorCurrent).toString('utf8');
  const lines=priorText.split('\n');
  assert.equal(priorText.split('rate-aware player survives from genuine speed introduction').length,2,
   'Earlier exact rate-aware player proof remains in prior current source');
  assert.equal(text.split('complete rate-aware player survives by the one exact hint inverse').length,2,
   'Current exact hint inverse proof is present');
  for(const line of replaced)assert.equal(lines.includes(line),false,'Stale seam replaced: '+line);
  let cursor=0;for(const line of lines)if(cursor<retained.length&&line===retained[cursor])cursor++;
  assert.equal(cursor,retained.length,'Every other original line remains in order');
  for(const proof of [
   'admitPreservedClinicalReview({revision,sourceHashes:',
   "const atlas=currentAtlasDeliveryRoot();",
   '&t=teaching',
   "proveAddition('baseline','elbow','right-elbow-arterial-pairs',47)",
   "proveAddition('elbow','portal','portal-hepatic-venous-relationships',48)",
   "proveAddition('portal','cervical','cervical-whole-discs-orientation',49)",
   "proveAddition('cervical','medial','right-medial-thigh-orientation',50)",
   "proveAddition('venous','calf','right-posterior-calf-achilles-orientation',51)",
   'all six earlier venous stop identities retain order',
   'every earlier tour and its complete step/camera data unchanged',
   'all 51 current Review tours and their exact source stops',
   'complete rate-aware player survives by the one exact hint inverse',
   'current rate-aware and legacy camera branches both keep reduced motion at zero',
   'current authored continuous policy is exact; runtime speed is not a changed teaching approval',
   'assert.equal((await save(forged)).status,422);',
   'assert.equal(stale.status,409);assert.equal(db.reads.length,0',
  ])assert.ok(text.includes(proof),'Required preserved/lifecycle proof: '+proof);
 }
 verify(candidate);
 for(const [from,to] of [
  ['assert.equal(legacyTours.length,47);','assert.equal(legacyTours.length,46);'],
  ['assert.equal((await save(forged)).status,422);','assert.equal((await save(forged)).status,200);'],
  ["proveAddition('venous','calf','right-posterior-calf-achilles-orientation',51)",
   "proveAddition('venous','calf','right-posterior-calf-achilles-orientation',50)"],
  ['assert.equal(playback.guidedSweepDuration(rate),sweep);','assert.equal(playback.guidedSweepDuration(rate),1800);'],
  ]){
  assert.equal(candidate.toString().split(from).length,2,'Unique tamper point: '+from);
  assert.throws(()=>verify(Buffer.from(candidate.toString().replace(from,to))));
 }
 assert.throws(()=>verify(Buffer.from('if(false){\n'+candidate+'\n}')));
 const changed=Buffer.from(candidate);
 const tamperAt=changed.indexOf(Buffer.from('complete rate-aware player'));
 assert(tamperAt>=0,'Tour inverse tamper point exists');
 changed[tamperAt]^=1;
 assert.throws(()=>invertTourType(changed,delta,priorCurrent),'Altered current source cannot invert to earlier whole file');
 console.log(JSON.stringify({schema:'vm-elbow-tour-current-preservation/1',
  originalSha256:originalSha,beforeCurrentSha256:beforeCurrentSha,
  priorCurrentSha256:priorCurrentSha,candidateSha256:candidateSha,
  originalLines:oldLines.length,retainedLines:retained.length,replacedLines:replaced.length,
  historicalPortalTours:48,currentTours:51,nativeTestExecuted:false}));
});
