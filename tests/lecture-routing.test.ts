/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

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
    (name: string) => name in mocks ? mocks[name] : nodeRequire(name),
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}

const user = { userId: "user-1", email: "educator@example.test", displayName: "Educator" };
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
const LectureEditor = ({ initial, courseOutline }: any) => React.createElement(
  "div",
  { "data-route-component": "lecture-editor", "data-id": initial.id },
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

function builderRoute(snapshot: { workbooks: typeof lecture[] }, studioView = { id: lecture.id }) {
  return compileRoute("../app/studio/workbooks/[workbookId]/builder/page.tsx", {
    "@/components/EducationRuntime": { EducationRuntime },
    "../../../../chatgpt-auth": { requireChatGPTUser: async () => user },
    "@/lib/education-platform": { getStudioSnapshot: async () => snapshot },
    "next/navigation": { notFound: () => { throw new Error("not found"); } },
    "@/components/LectureEditor": { LectureEditor },
    "next/link": Link,
    "@/lib/lecture-repository": { getLectureStudio: async () => studioView },
    "@/components/SiteFrame": { WorkspaceContextBar },
    "../../../../learn/runtime.css": {},
  }).default as (props: { params: Promise<{ workbookId: string }> }) => Promise<React.ReactNode>;
}

test("focused builder dispatches lectures to LectureEditor and leaves case authoring on EducationRuntime", async () => {
  const snapshot = { workbooks: [lecture, teaching] };
  const lecturePage = builderRoute(snapshot);
  const lectureHtml = renderToStaticMarkup(await lecturePage({ params: Promise.resolve({ workbookId: encodeURIComponent(lecture.id) }) }));
  assert.match(lectureHtml, /data-route-component="lecture-editor"/);
  assert.match(lectureHtml, /data-id="workbook:lecture-1"/);
  assert.match(lectureHtml, /Anatomy lecture\|Imaging cases/);
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
  }).default as (props: { params: Promise<{ courseSlug: string; workbookId: string }> }) => Promise<React.ReactNode>;
}

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
    "@/lib/education-platform": { getStudioSnapshot: async () => ({ workbooks: [lecture] }) },
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
