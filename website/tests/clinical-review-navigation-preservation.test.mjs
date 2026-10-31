import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const sha=value=>createHash('sha256').update(value).digest('hex');
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
  if(name==='HeadTeachingReviewNotes.tsx'){
    // Recovery is a subsequent complete source epoch. Pin its whole body and
    // the original fixture while still checking the navigation seam below.
    assert.equal(sha(raw),'1e5aa993d10f322028de568d8094fe020707a2d22fa654efc0185ca5458ee1eb');
    assert.equal(sha(candidate),'230e3a8848284c7a573f624f26d24daa38230b3af313849ae9e52c2f54fc55f9');
  }
  const importLine=name==='PlexusReviewWorksheet.tsx'?plexusImport:addedImport;
  let restored=replaceExactlyOnce(candidate,importLine,'');
  for(const [newText,oldText] of effects[name])restored=replaceExactlyOnce(restored,newText,oldText);
  if(name==='HeadTeachingReviewNotes.tsx')return;
  assert.equal(restored,raw,`${name}: original full body changed beyond import and native-warning extension`);
}
test('eight original bodies and the exact recovered head body retain enumerated guard seams',()=>{
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
  const recovered='HeadTeachingReviewNotes.tsx';
  const recoveredRaw=readFileSync(join(root,'tests','fixtures',`${recovered}.raw`),'utf8');
  const recoveredCandidate=readFileSync(join(root,'components',recovered),'utf8');
  assert.throws(()=>verify(recovered,recoveredRaw,recoveredCandidate+'\n// foreign mutation'));
  assert.throws(()=>verify(recovered,recoveredRaw,recoveredCandidate.replace(effects[recovered][0][0],'')));
});
