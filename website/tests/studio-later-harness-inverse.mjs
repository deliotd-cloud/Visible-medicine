import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=value=>createHash('sha256').update(value).digest('hex');
const one=(text,from,to)=>{
  assert.equal(text.split(from).length,2,`One later Studio source role: ${from.slice(0,70)}`);
  return text.replace(from,to);
};

/** Exact later directory/auth/outline/course-fixture layer, before prior cue and focus inverses. */
export function restoreLaterCourseForm(value){
  let current=value.replaceAll('\r\n','\n');
  assert.equal(sha(current),'437961d8affe2969dd778e9d46ff8bbaa0954c1dd8694cc40093f5b77ea7807b',
    'Complete current course harness source changed');
  for(const [from,to] of [
    ["name === '../lib/studio-mutation-context.ts' ? stableMutationContext : name === '../lib/studio-outline-navigation.ts' ? compile('lib/studio-outline-navigation.ts', {}) : mocks[name] ?? require(name)",
     "name === '../lib/studio-mutation-context.ts' ? stableMutationContext : mocks[name] ?? require(name)"],
    ["  const received=[], directoryCalls=[], authPaths=[];\n  const directory = compile('lib/studio-course-directory.ts', {});\n",'  const received=[];\n'],
    ["    '@/lib/studio-course-directory':{getStudioCourseDirectory:(courses, query, page)=>{\n      directoryCalls.push({courses, query, page});\n      return directory.getStudioCourseDirectory(courses, query, page);\n    }},\n",''],
    ["'../../chatgpt-auth':{requireChatGPTUser:async path=>{authPaths.push(path);return identity;}}",
     "'../../chatgpt-auth':{requireChatGPTUser:async()=>identity}"],
    ["'../../../chatgpt-auth':{requireChatGPTUser:async path=>{authPaths.push(path);return identity;}}",
     "'../../../chatgpt-auth':{requireChatGPTUser:async()=>identity}"],
    ["list.default({searchParams:Promise.resolve({new:'1',q:'Original',page:'1'})})",
     "list.default({searchParams:Promise.resolve({new:'1'})})"],
    ["  assert.deepEqual(authPaths,['/studio/courses',`/studio/courses/${encodeURIComponent(course.id)}`]);\n",''],
    ["  assert.deepEqual(directoryCalls,[{courses:snapshot.courses,query:'Original',page:'1'}]);\n",''],
    ["  assert.equal(directory.getStudioCourseDirectory(snapshot.courses,'Original','1').matchingCount,1);\n",''],
    ["  for(const auth of received)assert.deepEqual(auth,{userId:'edu:synthetic-user',externalSubject:'sites:synthetic-user',email:identity.email,displayName:identity.displayName});",
     "  for(const auth of received)assert.equal(auth.userId,'edu:synthetic-user');"],
    ["const course = {id: 'course/1', code: 'SYN-001', title: 'Original title', description: 'Original course description for learners.', workbookCount: 0};",
     "const course = {id: 'course/1', title: 'Original title', description: 'Original course description for learners.'};"],
  ])current=one(current,from,to);
  assert.equal(sha(current),'de65f553f67b6434cb91584782020dde6eb8d9c848a39cffa24f4d00cb7f7e45',
    'Exact predecessor course harness was not restored');
  return current;
}

/** Restore the complete preceding migration proof, retaining its earlier independent inverses. */
export function restorePriorMigrationProof(value){
  let current=value.replaceAll('\r\n','\n');
  assert.equal(sha(current),'62fbe86753f9dc826e24d9daf1c6576fe18c88f8ebb4e43022e77efd653e803b',
    'Complete current Studio migration proof changed');
  current=one(current,
    "import {join} from 'node:path';import {pathToFileURL} from 'node:url';\nconst sourceRoot=process.env.VM_WEBSITE_ROOT;\nconst helper=name=>sourceRoot?pathToFileURL(join(sourceRoot,'tests',name)).href:new URL('./'+name,import.meta.url).href;\nconst {reconstructCourseDetailsBeforeFocus}=await import(helper('studio-course-details-focus-inverse.mjs'));\nconst {restoreReleaseCueDetailsForm}=await import(helper('studio-release-cue-details-form-inverse.mjs'));\nconst read=p=>readFileSync(sourceRoot?join(sourceRoot,p):new URL('../'+p,import.meta.url));",
    "import {join} from 'node:path';\nimport {reconstructCourseDetailsBeforeFocus} from './studio-course-details-focus-inverse.mjs';\nimport {restoreReleaseCueDetailsForm} from './studio-release-cue-details-form-inverse.mjs';\nconst read=p=>readFileSync(process.env.VM_WEBSITE_ROOT&&!p.startsWith('tests/fixtures/')?join(process.env.VM_WEBSITE_ROOT,p):new URL('../'+p,import.meta.url));");
  const start=" const laterCourse=\"const course = {id: 'course/1', code: 'SYN-001'";
  const end=" current=exact(current,laterCourse,originalCourse);\n";
  const a=current.indexOf(start),b=current.indexOf(end,a);
  assert(a>=0&&b>a,'Complete later course inverse block');
  current=current.slice(0,a)+" const inverse=candidate=>{let current=candidate.replaceAll('\\r\\n','\\n');\n"+current.slice(b+end.length);
  current=one(current,
    " const restored=inverse(reconstructCourseDetailsBeforeFocus(restoreReleaseCueDetailsForm(current)));\n const expected=text.replaceAll('\\r\\n','\\n');\n assert.equal(restored,expected,'complete frozen course details source');",
    " assert.equal(inverse(reconstructCourseDetailsBeforeFocus(restoreReleaseCueDetailsForm(current))),text.replaceAll('\\r\\n','\\n'));");
  const negativesStart=' const changedDirectory=current.replace("directoryCalls.push({courses, query, page});",';
  const negativesEnd=' const forged=current.replace("__vinext_externalHistoryState:true},url:",';
  const n=current.indexOf(negativesStart),z=current.indexOf(negativesEnd,n);
  assert(n>=0&&z>n,'Complete later directory/auth/course negative block');
  current=current.slice(0,n)+current.slice(z);
  assert.equal(sha(current),'f787ad5c7b111c8c9d6c2474ab3857cfaf9407dea98adc48967190f63a8dbc38',
    'Complete preceding Studio migration proof was not restored');
  return current;
}
