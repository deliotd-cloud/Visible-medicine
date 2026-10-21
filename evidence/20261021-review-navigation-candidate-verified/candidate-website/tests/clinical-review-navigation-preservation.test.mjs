import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const names=[
  'HeadCtBoneDecisionForm.tsx','HeadCtBoneTeachingDecisionForm.tsx','HeadCtFacialDecisionForm.tsx','HeadPairedDecisionForm.tsx',
  'HeadMriReviewNotes.tsx','HeadTeachingReviewNotes.tsx','PlexusReviewWorksheet.tsx','RegionalGuideReviewNotes.tsx','RegionalReferenceReviewNotes.tsx',
];
const addedImport="import {registerClinicalReviewNavigationGuard} from '../lib/clinical-review-navigation-guard';\n";
const plexusImport="import { registerClinicalReviewNavigationGuard } from '../lib/clinical-review-navigation-guard';\n";
const oneLineOld="  useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);";
const oneLineNew="  useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);const unregister=registerClinicalReviewNavigationGuard(document,()=>true);return()=>{window.removeEventListener('beforeunload',warn);unregister();};},[dirty]);";
const regionalOld="useEffect(()=>{if(!(dirty||uncertain||busy))return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,uncertain,busy]);";
const regionalNew="useEffect(()=>{if(!(dirty||uncertain||busy))return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);const unregister=registerClinicalReviewNavigationGuard(document,()=>true);return()=>{window.removeEventListener('beforeunload',warn);unregister();};},[dirty,uncertain,busy]);";
const effects={
  'HeadCtBoneDecisionForm.tsx':[[oneLineNew,oneLineOld]],
  'HeadCtBoneTeachingDecisionForm.tsx':[[oneLineNew,oneLineOld]],
  'HeadCtFacialDecisionForm.tsx':[[oneLineNew,oneLineOld]],
  'HeadPairedDecisionForm.tsx':[[oneLineNew,oneLineOld]],
  'HeadMriReviewNotes.tsx':[["    window.addEventListener('beforeunload',warn);\n    const unregister=registerClinicalReviewNavigationGuard(document,()=>true);\n    return()=>{window.removeEventListener('beforeunload',warn);unregister();};","    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);"]],
  'HeadTeachingReviewNotes.tsx':[["    const unregister=registerClinicalReviewNavigationGuard(document,()=>true);\n    return()=>{window.removeEventListener('beforeunload',warn);unregister();};","    return()=>window.removeEventListener('beforeunload',warn);"]],
  'PlexusReviewWorksheet.tsx':[["    const unregister = registerClinicalReviewNavigationGuard(document, () => true);\n    return () => { window.removeEventListener('beforeunload', guard); unregister(); };","    return () => window.removeEventListener('beforeunload', guard);"]],
  'RegionalGuideReviewNotes.tsx':[[regionalNew,regionalOld]],
  'RegionalReferenceReviewNotes.tsx':[[regionalNew,regionalOld]],
};
function replaceExactlyOnce(body,needle,replacement){
  const index=body.indexOf(needle);
  assert(index>=0,`missing declared seam: ${needle.slice(0,60)}`);
  assert.equal(body.indexOf(needle,index+needle.length),-1,`duplicate declared seam: ${needle.slice(0,60)}`);
  return body.slice(0,index)+replacement+body.slice(index+needle.length);
}
function verify(name,raw,candidate){
  const importLine=name==='PlexusReviewWorksheet.tsx'?plexusImport:addedImport;
  let restored=replaceExactlyOnce(candidate,importLine,'');
  for(const [newText,oldText] of effects[name])restored=replaceExactlyOnce(restored,newText,oldText);
  assert.equal(restored,raw,`${name}: original full body changed beyond import and native-warning extension`);
}
test('all nine original full component bodies survive only the enumerated guard seams',()=>{
  assert.equal(names.length,9);
  for(const name of names){
    const raw=readFileSync(join(root,'tests','fixtures',`${name}.raw`),'utf8');
    const candidate=readFileSync(join(root,'components',name),'utf8');
    verify(name,raw,candidate);
  }
});
test('whole-file guard rejects an unknown append and removal of original review code',()=>{
  const name='HeadMriReviewNotes.tsx';
  const raw=readFileSync(join(root,'tests','fixtures',`${name}.raw`),'utf8');
  const candidate=readFileSync(join(root,'components',name),'utf8');
  assert.throws(()=>verify(name,raw,candidate+'\n// unlisted assertion change'));
  assert.throws(()=>verify(name,raw,candidate.replace("const endpoint='/api/atlas-review/head-mri-learning';",'')));
});
