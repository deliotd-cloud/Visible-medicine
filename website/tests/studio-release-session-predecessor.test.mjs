import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const site=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(site+'/package.json'),ts=require('typescript');
function compile(source){const code=ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('module','exports',code)(module,module.exports);return module.exports;}
const session=compile(site+'/lib/studio-session-drafts.ts');
const predecessor=compile(site+'/lib/studio-release-predecessor.ts');
const scope=['v1','edu:synthetic-author','org:synthetic'];
const oldKey=JSON.stringify([...scope,'release:course-one']);
const newKey=JSON.stringify([...scope,'release:release-one']);
const binding={courseId:'course-one',releaseId:'release-one',version:2,availableWorkbookIds:['workbook-one']};
const raw=JSON.stringify({expectedCourseId:'course-one',expectedReleaseId:'release-one',expectedVersion:'1',title:'Tab-only second edit',slug:'synthetic',summary:'Synthetic summary',level:'Intermediate',duration:'Self-paced',outcomes:'First\nSecond',workbookIds:['workbook-one'],publisherName:'Synthetic',publisherKind:'institution',visibility:'private',accessModel:'invitation',enrolmentOpen:'false'});

test('matching predecessor copy is scoped to the exact document and old course key',()=>{
  const owner={},otherDocument={};
  const entry=session.retainStudioSessionDraft(owner,oldKey,null,raw,{known:true,raw:null});
  assert(entry);assert.equal(session.readStudioSessionDraft(owner,oldKey),entry);
  assert.equal(session.readStudioSessionDraft(owner,newKey),null);
  assert.equal(session.readStudioSessionDraft(otherDocument,oldKey),null);
  assert.equal(predecessor.matchesReleasePredecessor(entry.raw,binding),true);
  assert.equal(session.dropStudioSessionDraft(owner,oldKey,entry),true);
});

test('CAS retains a newer tab-only copy after the older one was explicitly read',()=>{
  const owner={};
  const earlier=session.retainStudioSessionDraft(owner,oldKey,null,raw,{known:true,raw:null});
  const later=session.retainStudioSessionDraft(owner,oldKey,earlier,raw.replace('second edit','newer edit'),{known:true,raw:null});
  assert(later);assert.equal(session.dropStudioSessionDraft(owner,oldKey,earlier),false);
  assert.equal(session.readStudioSessionDraft(owner,oldKey),later);
  assert.equal(session.dropStudioSessionDraft(owner,oldKey,later),true);
});

test('foreign or incomplete tab-only material is not an eligible predecessor',()=>{
  assert.equal(predecessor.matchesReleasePredecessor(raw,{...binding,releaseId:'another-release'}),false);
  assert.equal(predecessor.matchesReleasePredecessor(raw,{...binding,version:0}),false);
  assert.equal(predecessor.matchesReleasePredecessor(JSON.stringify({expectedCourseId:'course-one',expectedReleaseId:'release-one',expectedVersion:'1'}),binding),false);
});

test('actual ActionForm source exposes opt-in only and guards cleanup at confirmed submitted revision',()=>{
  const source=readFileSync(new URL('../components/StudioForms.tsx',import.meta.url),'utf8');
  assert.match(source,/Recover earlier tab-only release edits/);
  assert.match(source,/window\.confirm\('Replace this unedited release form/);
  assert.match(source,/await verifyStudioMutationContext\(recoveryScope\)/);
  assert.match(source,/readStudioSessionDraft\(document,offer\.config\.scopedKey\)===offer\.entry/);
  assert.match(source,/snapshot\.values\.get\(primary\)!==null\|\|localStorage\.getItem\(primary\)!==null/);
  assert.match(source,/suppressPredecessorRevisionWrite\.current=true/);
  assert.match(source,/submittedSessionPredecessor&&isCurrent\(\)&&revision\.current===submittedRevision/);
  assert.match(source,/dropStudioSessionDraft\(document,submittedSessionPredecessor\.scopedKey,submittedSessionPredecessor\.entry\)/);
});
