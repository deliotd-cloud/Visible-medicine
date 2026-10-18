"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { StudioCourse, StudioRelease, StudioWorkbook } from "@/lib/education-platform";
import { CreateWorkbookForm, DuplicateCourseButton, EditCourseDetailsForm, ReleaseDraftForm, type StudioDraftRecoveryState } from "./StudioForms";
import type { StudioDraftScope } from "../lib/studio-draft-scope.ts";

type CoursePane = "content" | "preview" | "review";

function paneFromValue(value: string | null): CoursePane {
  return value === "preview" || value === "review" ? value : "content";
}

export function StudioCourseEditor({ course, workbooks, releases, recoveryScope }: { course: StudioCourse; workbooks: StudioWorkbook[]; releases: StudioRelease[]; recoveryScope: StudioDraftScope }) {
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";
  const [section, setSection] = useState<CoursePane>(() => paneFromValue(searchParams?.get("pane") ?? null));
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsRecovery,setDetailsRecovery]=useState<{courseId:string;state:StudioDraftRecoveryState}>({courseId:course.id,state:'none'});
  useEffect(() => {
    setDetailsRecovery(current=>current.courseId===course.id?current:{courseId:course.id,state:'none'});
    const restore = () => setSection(paneFromValue(new URLSearchParams(window.location.search).get("pane")));
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [course.id, searchKey]);
  function choosePane(next: CoursePane) {
    const url = new URL(window.location.href);
    if (paneFromValue(url.searchParams.get("pane")) !== next) {
      url.searchParams.set("pane", next);
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
    setSection(next);
  }
  const draftRelease = releases.find((release) => ["draft", "changes-requested"].includes(release.status));
  const recoveryState=detailsRecovery.courseId===course.id?detailsRecovery.state:'none';
  const recoveryChanged=(state:StudioDraftRecoveryState)=>{
    if(!['none','recovered','attention'].includes(state))return;
    setDetailsRecovery(current=>current.courseId===course.id?{courseId:course.id,state}:current);
  };
  return <section className="course-editor">
    <div className="course-editor-tabs" role="group" aria-label="Course editor">
      {([['content', 'Content'], ['preview', 'Preview'], ['review', 'Review & publish']] as const).map(([value, label]) => <button type="button" aria-pressed={section === value} aria-controls={`course-${value}`} onClick={() => choosePane(value)} key={value}>{label}</button>)}
      <details className="course-options" onKeyDown={event => {
        if (event.key !== "Escape" || !event.currentTarget.open) return;
        event.preventDefault(); event.stopPropagation();
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}>
        <summary aria-controls="course-options-panel">Course options</summary>
        <div id="course-options-panel" className="course-options-panel" role="group" aria-label="Course options">
          <button className="outline-button" type="button" aria-controls="course-details-editor" aria-expanded={editingDetails} onClick={() => setEditingDetails(value => !value)}>{editingDetails ? "Hide course details" : "Edit course details"}</button>
          <DuplicateCourseButton courseId={course.id} recoveryScope={recoveryScope} />
          <p>Duplicates contain structure only, never learner attempts or publication history.</p>
        </div>
      </details>
    </div>
    {recoveryState!=='none'&&<p id="course-details-draft-status" className="studio-form-message" role="status">{recoveryState==='recovered'?'Recovered unsent course edits on this device.':'A device-local course draft needs attention.'} <button className="outline-button" type="button" aria-controls="course-details-editor" aria-expanded={editingDetails} onClick={()=>setEditingDetails(value=>!value)}>{editingDetails?'Hide course details':recoveryState==='recovered'?'Review recovered edits':'Check device draft'}</button></p>}
    <section id="course-details-editor" className="course-editor-panel course-create-panel" aria-label="Edit course details" hidden={!editingDetails}><EditCourseDetailsForm key={course.id} course={course} recoveryScope={recoveryScope} onDraftRecoveryChange={recoveryChanged} /></section>
    <div id="course-content" hidden={section !== "content"}>
      <div className="course-editor-content">
        <section aria-label="Course outline"><header className="course-section-heading"><div><h2>Course content</h2><p>Open an item to edit its content. Add another when you need it.</p></div><span>{workbooks.length} items</span></header>
          {workbooks.length === 0 && <p className="course-empty">Your course is private. Start by adding your first teaching or assessment item.</p>}
          <ol className="course-outline">{workbooks.map((workbook, index) => <li key={workbook.id}><span className="course-item-number">{index + 1}</span><Link href={`/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`}><strong>{workbook.title}</strong><small>{workbook.mode === "lecture" ? "Lecture / presentation" : `${workbook.mode === "assessment" ? "Assessment" : "Imaging teaching"} · ${workbook.caseCount} cases`} · {workbook.status}</small></Link><Link className="course-item-details" href={`/studio/workbooks/${encodeURIComponent(workbook.id)}`}>Details</Link></li>)}</ol>
        </section>
        <section className="course-add-content" aria-label="Add course content"><h2>Add content</h2><CreateWorkbookForm course={course} recoveryScope={recoveryScope} /></section>
      </div>
    </div>
    <section id="course-preview" className="course-editor-panel" hidden={section !== "preview"}><h2>Preview the learner experience</h2><p>Preview slides while editing each teaching item. A course release preview shows the saved course information and its selected content—not unsaved edits.</p>
      {releases.length ? <ul className="course-preview-list">{releases.map((release) => <li key={release.id}><Link href={`/studio/releases/${encodeURIComponent(release.id)}/preview`}>{release.title} — preview {release.status} version {release.version}</Link></li>)}</ul> : <p>No course release has been prepared yet. When your content is ready, open Review &amp; publish to prepare a private release draft.</p>}
    </section>
    <section id="course-review" className="course-editor-panel" hidden={section !== "review"}><h2>Review &amp; publish</h2><ol className="course-release-steps"><li>Save your content and complete its independent review.</li><li>Prepare the course release below.</li><li>Submit the release for independent review, then publish when approved.</li></ol><p>Saving this form does not publish anything or grant learner access. Atlas, case and lecture access remain independent.</p>
      {workbooks.length ? <details className="course-release-settings"><summary>{draftRelease ? "Edit release draft" : "Prepare release draft"}</summary><ReleaseDraftForm key={course.id} course={course} workbooks={workbooks} release={draftRelease} recoveryScope={recoveryScope} /></details> : <p>Add course content first.</p>}
      <Link className="outline-button" href={`/studio/publishing?course=${encodeURIComponent(course.id)}`}>Open review queue →</Link>
    </section>
  </section>;
}
