import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {reconstructCourseDetailsBeforeFocus} from './studio-course-details-focus-inverse.mjs';
import {restoreReleaseCueDetailsForm,releaseCueDetailsFormSeams} from './studio-release-cue-details-form-inverse.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex');
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8').replaceAll('\r\n','\n');
const one=(text,from,to)=>{assert.equal(text.split(from).length,2,'Unique source role: '+from.slice(0,70));return text.replace(from,to);};
const parent=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));

test('receipt-bound current course form restores exactly the preceding focus-free source',()=>{
 assert(parent,'Name exact parent Website checkout for staged validation');
 const actual=readFileSync(join(parent,'tests/studio-course-details-form.test.mjs'),'utf8').replaceAll('\r\n','\n');
 const witness=read('./fixtures/studio-course-details-form.current-queue.mjs.raw');
 assert.equal(sha(actual),'de65f553f67b6434cb91584782020dde6eb8d9c848a39cffa24f4d00cb7f7e45');
 assert.equal(restoreReleaseCueDetailsForm(actual,witness),witness);
 const prior=reconstructCourseDetailsBeforeFocus(restoreReleaseCueDetailsForm(actual));
 assert.equal(sha(prior),'27d86526e6d43f034b23beca5d9806f50d1043c73a0310de5eeb8a5ed7e384e7');
 for(const forged of [
  actual.replace('    useRef(initial) { const slot = editorCursor++; return editorSlots[slot] ??= {current: initial}; },\n',''),
  actual.replace('    useRef(initial) { const slot = editorCursor++; return editorSlots[slot] ??= {current: initial}; },\n',m=>m+m),
  actual.replace('toggle.props.onClick({currentTarget:{closest:()=>({open:true,querySelector:()=>({focus(){}})})}});','toggle.props.onClick();'),
  actual.replace("walk(opened, node => node.props['aria-controls'] === 'course-details-editor').props.onClick({currentTarget:{closest:()=>({open:true,querySelector:()=>({focus(){}})})}});","walk(opened, node => node.props['aria-controls'] === 'course-details-editor').props.onClick();"),
  actual+'\n// foreign harness change\n',
 ])assert.throws(()=>reconstructCourseDetailsBeforeFocus(restoreReleaseCueDetailsForm(forged),prior));
 for(const [later] of releaseCueDetailsFormSeams){
  assert.throws(()=>restoreReleaseCueDetailsForm(actual.replace(later,'')),/One exact release-cue hook seam/);
  assert.throws(()=>restoreReleaseCueDetailsForm(actual.replace(later,later+later)),/One exact release-cue hook seam/);
 }
});

test('new proof is an exact extension of the complete original proof source',()=>{
 const original=read('./fixtures/studio-history-controller-migration.before-current.mjs.raw');
 assert.equal(sha(original),'71ccdedf73e0508619f27ecfddee7b8dac7cf5af487998d2df8b602c62ae088e');
 let candidate=read('./studio-history-controller-migration.test.mjs');
 const a=candidate.indexOf(' const forgedFocus='),b=candidate.indexOf('\n});',a);
 assert(a>=0&&b>a);
 assert.equal(sha(candidate.slice(a,b)),'4e385f1adfcfd02ceac81a1e6b432b58f6b7ab2796fb5719e825821325df9e64');
 candidate=candidate.slice(0,a)+candidate.slice(b+1);
 candidate=one(candidate,"import {restoreReleaseCueDetailsForm} from './studio-release-cue-details-form-inverse.mjs';\n",'');
 candidate=one(candidate,'inverse(reconstructCourseDetailsBeforeFocus(restoreReleaseCueDetailsForm(current)))','inverse(reconstructCourseDetailsBeforeFocus(current))');
 candidate=one(candidate,'inverse(reconstructCourseDetailsBeforeFocus(restoreReleaseCueDetailsForm(forged)))','inverse(reconstructCourseDetailsBeforeFocus(forged))');
 candidate=one(candidate,"import {reconstructCourseDetailsBeforeFocus} from './studio-course-details-focus-inverse.mjs';\n",'');
 candidate=one(candidate,"process.env.VM_WEBSITE_ROOT&&!p.startsWith('tests/fixtures/')?","process.env.VM_WEBSITE_ROOT?");
 candidate=one(candidate,'inverse(reconstructCourseDetailsBeforeFocus(current))','inverse(current)');
 candidate=one(candidate,'inverse(reconstructCourseDetailsBeforeFocus(forged))','inverse(forged)');
 assert.equal(candidate,original);
});
