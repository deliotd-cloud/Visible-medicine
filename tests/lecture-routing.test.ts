/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as lectureNavigation from '../lib/lecture-slide-navigation.ts';
import * as tour from '../lib/lecture-tour-context.ts';

const nodeRequire = createRequire(import.meta.url);

function compileRoute(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", code)(
    (name: string) => name in mocks ? mocks[name] : name==='@/lib/lecture-tour-context'?tour:nodeRequire(name),
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}

const user = { userId: "user-1", email: "educator@example.test", displayName: "Educator" };
const organization = { id: "organization-1" };
const studioScope = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
const lecture = {
  id: "workbook:lecture-1",
  title: "Anatomy lecture",
  mode: "lecture",
  courseId: "course-1",
  courseTitle: "Core anatomy",
};
const teaching = {
  id: "workbook:case-1",
  title: "Imaging cases",
  mode: "teaching",
  courseId: "course-1",
  courseTitle: "Core anatomy",
};

const Link = ({ href, children, ...props }: any) => React.createElement("a", { href, ...props }, children);
const WorkspaceContextBar = () => React.createElement("div", { "data-route-component": "workspace-context" });
const LectureEditor = ({ initial, courseOutline, authorityKey, expectedStudioContext }: any) => React.createElement(
  "div",
  { "data-route-component": "lecture-editor", "data-id": initial.id, "data-authority": authorityKey, "data-context": JSON.stringify(expectedStudioContext) },
  courseOutline.map((item: { title: string }) => item.title).join("|"),
);
const EducationRuntime = ({ workbookId, accessMode }: any) => React.createElement(
  "div",
  { "data-route-component": "education-runtime", "data-id": workbookId, "data-access": accessMode ?? "learner" },
);
const LectureLesson = ({ workbookId, courseSlug }: any) => React.createElement(
  "div",
  { "data-route-component": "lecture-lesson", "data-id": workbookId, "data-course": courseSlug ?? "" },
);

function builderRoute(snapshot: { organization: typeof organization; workbooks: typeof lecture[] }, studioView = { id: lecture.id }) {
  return compileRoute("../app/studio/workbooks/[workbookId]/builder/page.tsx", {
    "@/components/EducationRuntime": { EducationRuntime },
    "../../../../chatgpt-auth": { requireChatGPTUser: async () => user },
    "@/lib/education-platform": { getStudioSnapshot: async (scope: unknown) => {
      assert.deepEqual(scope, studioScope);
      return snapshot;
    } },
    "next/navigation": { notFound: () => { throw new Error("not found"); } },
    "@/components/LectureEditor": { LectureEditor },
    "next/link": Link,
    "@/lib/lecture-repository": { getLectureStudio: async (scope: unknown, workbookId: string) => {
      assert.deepEqual(scope, studioScope);
      assert.equal(workbookId, studioView.id);
      return studioView;
    } },
    "@/components/SiteFrame": { WorkspaceContextBar },
    "../../../../learn/runtime.css": {},
  }).default as (props: { params: Promise<{ workbookId: string }> }) => Promise<React.ReactNode>;
}

test("focused builder dispatches lectures to LectureEditor and leaves case authoring on EducationRuntime", async () => {
  const snapshot = { organization, workbooks: [lecture, teaching] };
  const lecturePage = builderRoute(snapshot);
  const lectureHtml = renderToStaticMarkup(await lecturePage({ params: Promise.resolve({ workbookId: encodeURIComponent(lecture.id) }) }));
  assert.match(lectureHtml, /data-route-component="lecture-editor"/);
  assert.match(lectureHtml, /data-id="workbook:lecture-1"/);
  assert.match(lectureHtml, /Anatomy lecture\|Imaging cases/);
  assert.match(lectureHtml, /data-authority="\[&quot;user-1&quot;,&quot;organization-1&quot;\]"/);
  assert.match(lectureHtml, /data-context="\{&quot;actorId&quot;:&quot;edu:user-1&quot;,&quot;organizationId&quot;:&quot;organization-1&quot;\}"/);
  assert.doesNotMatch(lectureHtml, /data-route-component="education-runtime"/);

  const teachingPage = builderRoute(snapshot);
  const teachingHtml = renderToStaticMarkup(await teachingPage({ params: Promise.resolve({ workbookId: encodeURIComponent(teaching.id) }) }));
  assert.match(teachingHtml, /data-route-component="education-runtime"/);
  assert.match(teachingHtml, /data-id="workbook:case-1"/);
  assert.match(teachingHtml, /data-access="authoring"/);
  assert.doesNotMatch(teachingHtml, /data-route-component="lecture-editor"/);
});

function learnerRoute(isLecture: boolean, calls: string[]) {
  return compileRoute("../app/learn/[courseSlug]/[workbookId]/page.tsx", {
    "@/components/EducationRuntime": { EducationRuntime },
    "../../../chatgpt-auth": { requireChatGPTUser: async (returnTo: string) => { calls.push(`auth:${returnTo}`); return user; } },
    "../../runtime.css": {},
    "@/db/bootstrap": { ensureEducationUser: async (auth: { userId: string }) => { calls.push(`ensure:${auth.userId}`); } },
    "@/lib/lecture-repository": { isLectureWorkbook: async (id: string) => { calls.push(`lookup:${id}`); return isLecture; } },
    "@/components/LectureLesson": { LectureLesson },
    "@/lib/lecture-slide-navigation": lectureNavigation,
  }).default as (props: { params: Promise<{ courseSlug: string; workbookId: string }>;searchParams?:Promise<lectureNavigation.LectureSearchParams> }) => Promise<React.ReactNode>;
}

test('course lecture keeps the exact slide and publication through sign-in without changing case dispatch',async()=>{
  const calls:string[]=[],revision='a'.repeat(64),Page=learnerRoute(true,calls);
  const tree=await Page({params:Promise.resolve({courseSlug:'core-anatomy',workbookId:encodeURIComponent(lecture.id)}),searchParams:Promise.resolve({lectureSlide:'slide-2',lectureRevision:revision})});
  assert.equal(calls[0],`auth:/learn/core-anatomy/${encodeURIComponent(lecture.id)}?lectureSlide=slide-2&lectureRevision=${revision}`);
  const find=(node:any):any=>Array.isArray(node)?node.map(find).find(Boolean):React.isValidElement(node)?node.type===LectureLesson?node:find((node.props as any).children):null;
  assert.deepEqual(find(tree).props.slideRequest,{kind:'requested',slideId:'slide-2',revision});
  const invalidCalls:string[]=[];
  const invalid=await learnerRoute(true,invalidCalls)({params:Promise.resolve({courseSlug:'core-anatomy',workbookId:lecture.id}),searchParams:Promise.resolve({lectureSlide:['slide-1','slide-2'],lectureRevision:revision})});
  assert.match(invalidCalls[0],/\?lectureSlide=invalid&lectureRevision=invalid$/);
  assert.deepEqual(find(invalid).props.slideRequest,{kind:'invalid'});
});

test('direct lecture route preserves the selected stable ID and refuses to render before sign-in',async()=>{
  const revision='b'.repeat(64),paths:string[]=[],signal=new Error('sign in');
  const mocks={
    '../../../chatgpt-auth':{requireChatGPTUser:async(path:string)=>{paths.push(path);return user;}},
    '@/components/LectureLesson':{LectureLesson},'@/lib/lecture-slide-navigation':lectureNavigation,
  };
  const props={params:Promise.resolve({workbookId:lecture.id}),searchParams:Promise.resolve({lectureSlide:'slide-2',lectureRevision:revision})};
  const Page=compileRoute('../app/learn/lectures/[workbookId]/page.tsx',mocks).default;
  const tree=await Page(props);
  assert.equal(paths[0],`/learn/lectures/${encodeURIComponent(lecture.id)}?lectureSlide=slide-2&lectureRevision=${revision}`);
  assert.equal(tree.type,LectureLesson);
  assert.deepEqual(tree.props.slideRequest,{kind:'requested',slideId:'slide-2',revision});
  const denied=compileRoute('../app/learn/lectures/[workbookId]/page.tsx',{...mocks,'../../../chatgpt-auth':{requireChatGPTUser:async()=>{throw signal;}}}).default;
  await assert.rejects(()=>denied(props),(error:unknown)=>error===signal);
  const malformed=await Page({...props,searchParams:Promise.resolve({lectureRevision:revision})});
  assert.deepEqual(malformed.props.slideRequest,{kind:'invalid'});
  assert.match(paths.at(-1)!,/\?lectureSlide=invalid&lectureRevision=invalid$/);
});

test('only the authorized verified publication supplies the player revision; old links never replace it',async()=>{
  const calls:string[]=[],revision='c'.repeat(64),request={kind:'requested',slideId:'second',revision:'d'.repeat(64)};
  const LecturePlayer=()=>null;
  class LectureError extends Error{}
  const publication={manifest:{workbook:{id:lecture.id,title:lecture.title,version:3},slides:[{id:'first'},{id:'second'}]},integrityHash:revision};
  const mocks={
    'next/link':Link,'@/components/SiteFrame':{WorkspaceContextBar},'@/components/LecturePlayer':{LecturePlayer},
    '@/lib/lecture-repository':{LectureError,getPublishedLecture:async(auth:unknown,id:string,course:string)=>{calls.push(`${id}:${course}`);assert.deepEqual(auth,{userId:'learner'});return publication;}},
  };
  const Lesson=compileRoute('../components/LectureLesson.tsx',mocks).LectureLesson;
  const tree=await Lesson({auth:{userId:'learner'},workbookId:lecture.id,courseSlug:'core-anatomy',slideRequest:request});
  function find(node:any):any{return Array.isArray(node)?node.map(find).find(Boolean)??null:React.isValidElement(node)?node.type===LecturePlayer?node:find((node.props as any).children):null;}
  const player=find(tree);assert(player);
  assert.deepEqual(player.props.navigation,{workbookId:lecture.id,courseSlug:'core-anatomy',revision,request,tourContext:{kind:'none'}});
  assert.deepEqual(player.props.slides,publication.manifest.slides);
  assert.match(player.key,new RegExp(revision));
  assert.deepEqual(calls,[`${lecture.id}:core-anatomy`]);
  const Denied=compileRoute('../components/LectureLesson.tsx',{...mocks,'@/lib/lecture-repository':{LectureError,getPublishedLecture:async()=>{throw new LectureError('Lecture access required');}}}).LectureLesson;
  const denied=await Denied({auth:{userId:'learner'},workbookId:lecture.id,slideRequest:request});
  assert.equal(find(denied),null);
  const html=renderToStaticMarkup(denied);assert.match(html,/Lecture unavailable/);assert.doesNotMatch(html,new RegExp(revision));
});

test("lecture builder keys editor by workbook identity, not revision", async () => {
  const other = { ...lecture, id: "workbook:lecture-2", title: "Second lecture" };
  const snapshot = { organization, workbooks: [lecture, other] };
  function editorKey(node: React.ReactNode): string | null | undefined {
    if (Array.isArray(node)) {
      for (const child of node) { const key = editorKey(child); if (key !== undefined) return key; }
      return undefined;
    }
    if (!React.isValidElement(node)) return undefined;
    if (node.type === LectureEditor) return node.key;
    return editorKey((node.props as any).children);
  }
  for (const item of [lecture, other]) {
    const Page = builderRoute(snapshot, { id: item.id });
    const page = await Page({ params: Promise.resolve({ workbookId: encodeURIComponent(item.id) }) });
    assert.equal(editorKey(page), JSON.stringify([item.id, JSON.stringify([user.userId, organization.id])]));
    const revisedView = { id: item.id, revisionId: 'different-content-revision' };
    const RevisedPage = builderRoute(snapshot, revisedView);
    assert.equal(editorKey(await RevisedPage({ params: Promise.resolve({ workbookId: encodeURIComponent(item.id) }) })), editorKey(page));
    const ChangedOrganizationPage = builderRoute({ ...snapshot, organization: { id: 'different-organization' } }, { id: item.id });
    assert.notEqual(editorKey(await ChangedOrganizationPage({ params: Promise.resolve({ workbookId: encodeURIComponent(item.id) }) })), editorKey(page));
  }
});

test("course learner route dispatches lecture playback without changing case runtime", async () => {
  const lectureCalls: string[] = [];
  const lecturePage = learnerRoute(true, lectureCalls);
  const lectureHtml = renderToStaticMarkup(await lecturePage({ params: Promise.resolve({ courseSlug: "core-anatomy", workbookId: encodeURIComponent(lecture.id) }) }));
  assert.match(lectureHtml, /data-route-component="lecture-lesson"/);
  assert.match(lectureHtml, /data-course="core-anatomy"/);
  assert.doesNotMatch(lectureHtml, /data-route-component="education-runtime"/);
  assert.deepEqual(lectureCalls, [
    `auth:/learn/core-anatomy/${encodeURIComponent(lecture.id)}`,
    "ensure:edu:user-1",
    `lookup:${lecture.id}`,
  ]);

  const caseCalls: string[] = [];
  const casePage = learnerRoute(false, caseCalls);
  const caseHtml = renderToStaticMarkup(await casePage({ params: Promise.resolve({ courseSlug: "core-anatomy", workbookId: encodeURIComponent(teaching.id) }) }));
  assert.match(caseHtml, /data-route-component="education-runtime"/);
  assert.match(caseHtml, /data-id="workbook:case-1"/);
  assert.doesNotMatch(caseHtml, /data-route-component="lecture-lesson"/);
  assert.equal(caseCalls.at(-1), `lookup:${teaching.id}`);
});

test("lecture details redirect directly to the focused builder before case-only UI renders", async () => {
  const redirected: string[] = [];
  let duplicateRenders = 0;
  const redirectSignal = new Error("NEXT_REDIRECT");
  const route = compileRoute("../app/studio/workbooks/[workbookId]/page.tsx", {
    "next/navigation": {
      notFound: () => { throw new Error("not found"); },
      redirect: (path: string) => { redirected.push(path); throw redirectSignal; },
    },
    "next/link": Link,
    "../../../chatgpt-auth": { requireChatGPTUser: async () => user },
    "@/components/StudioShell": { StudioShell: ({ children }: any) => React.createElement("main", null, children) },
    "@/components/StudioForms": { DuplicateWorkbookButton: () => { duplicateRenders++; return React.createElement("button", null, "Duplicate"); } },
    "@/components/WorkbookRetirement": { WorkbookRetirement: () => React.createElement("div", { "data-route-component": "workbook-retirement" }) },
    "@/components/WorkbookCorrection": { WorkbookCorrection: () => React.createElement("div", { "data-route-component": "workbook-correction" }) },
    "@/components/WorkbookCorrectionLineage": { WorkbookCorrectionLineage: () => React.createElement("div", { "data-route-component": "workbook-correction-lineage" }) },
    "@/lib/education-platform": { getStudioSnapshot: async (scope: unknown) => {
      assert.deepEqual(scope, studioScope);
      return { organization, workbooks: [lecture] };
    } },
  }).default as (props: { params: Promise<{ workbookId: string }> }) => Promise<React.ReactNode>;

  await assert.rejects(
    () => route({ params: Promise.resolve({ workbookId: encodeURIComponent(lecture.id) }) }),
    (error: unknown) => error === redirectSignal,
  );
  assert.deepEqual(redirected, [`/studio/workbooks/${encodeURIComponent(lecture.id)}/builder`]);
  assert.equal(duplicateRenders, 0);
});

test("legacy focused-builder POST rejects lecture mutations before reading or writing them", async () => {
  class EducationApiError extends Error {
    status: number;
    constructor(message: string, status: number) { super(message); this.status = status; }
  }
  class DomainError extends Error {
    status: number;
    constructor(message: string, status: number) { super(message); this.status = status; }
  }
  const calls: string[] = [];
  const route = compileRoute("../app/api/studio/workbooks/[workbook_id]/builder/route.ts", {
    "@/lib/education-api": {
      EducationApiError,
      authenticateEducationApi: async () => { calls.push("authenticate"); return { userId: "edu:user-1" }; },
      readEducationJson: async () => { calls.push("read-body"); return {}; },
    },
    "@/lib/repository": {
      DomainError,
      getAuthoringAppSnapshot: async () => { calls.push("authorize"); return {}; },
      publishWorkbook: async () => { calls.push("publish"); },
      requestWorkbookReview: async () => { calls.push("request-review"); },
      reviewWorkbook: async () => { calls.push("review"); },
      updateWorkbookDraft: async () => { calls.push("update"); },
    },
    "@/lib/lecture-repository": { isLectureWorkbook: async () => { calls.push("lecture-check"); return true; } },
  });
  const response = await route.POST(
    new Request("https://visiblemedicine.test/api/studio/workbooks/id/builder", { method: "POST", body: "{}" }),
    { params: Promise.resolve({ workbook_id: lecture.id }) },
  );
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "Use the lecture editor for this content type." });
  assert.deepEqual(calls, ["authenticate", "authorize", "lecture-check"]);
});
