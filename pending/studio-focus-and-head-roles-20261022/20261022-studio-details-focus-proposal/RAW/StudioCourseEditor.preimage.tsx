"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type KeyboardEvent } from "react";
import type { StudioCourse, StudioRelease, StudioWorkbook } from "@/lib/education-platform";
import { CreateWorkbookForm, DuplicateCourseButton, EditCourseDetailsForm, ReleaseDraftForm, type StudioDraftRecoveryState } from "./StudioForms";
import type { StudioDraftScope } from "../lib/studio-draft-scope.ts";

type CoursePane = "content" | "preview" | "review";
const coursePanes = [['content', 'Content'], ['preview', 'Preview'], ['review', 'Review & publish']] as const;

function paneFromValue(value: string | null): CoursePane {
  return value === "preview" || value === "review" ? value : "content";
}

export function StudioCourseEditor({ course, workbooks, releases, recoveryScope }: { course: StudioCourse; workbooks: StudioWorkbook[]; releases: StudioRelease[]; recoveryScope: StudioDraftScope }) {
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";
  const [section, setSection] = useState<CoursePane>(() => paneFromValue(searchParams?.get("pane") ?? null));
  const [focusedTab, setFocusedTab] = useState<{courseId: string; pane: CoursePane}>(() => ({courseId: course.id, pane: paneFromValue(searchParams?.get("pane") ?? null)}));
  const [editingDetails, setEditingDetails] = useState({courseId: course.id, open: false});
  const [detailsRecovery,setDetailsRecovery]=useState<{courseId:string;state:StudioDraftRecoveryState}>({courseId:course.id,state:'none'});
  useEffect(() => {
    setDetailsRecovery(current=>current.courseId===course.id?current:{courseId:course.id,state:'none'});
    setEditingDetails(current=>current.courseId===course.id?current:{courseId:course.id,open:false});
    const restore = () => {
      const pane = paneFromValue(new URLSearchParams(window.location.search).get("pane"));
      const activePanel = typeof document !== 'undefined'
        ? document.activeElement?.closest?.('.course-editor [role="tabpanel"]') : null;
      setSection(pane);
      setFocusedTab(current => current.courseId === course.id && typeof document !== 'undefined' && document.activeElement?.closest('.course-editor-tablist') ? current : {courseId: course.id, pane});
      if (activePanel && coursePanes.some(([value]) => activePanel.id === `course-${value}`) && activePanel.id !== `course-${pane}`)
        document.getElementById(`course-${pane}-tab`)?.focus();
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [course.id, searchKey]);
  function choosePane(next: CoursePane) {
    const url = new URL(window.location.href);
    if (!url.pathname.endsWith(`/studio/courses/${encodeURIComponent(course.id)}`)) return;
    if (paneFromValue(url.searchParams.get("pane")) !== next) {
      url.searchParams.set("pane", next);
      // An indexed copy is treated as an internal traversal; an external entry receives a fresh index.
      window.history.pushState({ ...window.history.state, __vinext_externalHistoryState: true }, "", `${url.pathname}${url.search}${url.hash}`);
    }
    setSection(next);
    setFocusedTab({courseId: course.id, pane: next});
  }
  function moveTab(event: KeyboardEvent<HTMLButtonElement>, pane: CoursePane) {
    if (!window.location.pathname.endsWith(`/studio/courses/${encodeURIComponent(course.id)}`)) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const index = coursePanes.findIndex(([value]) => value === pane);
    const nextIndex = event.key === 'ArrowRight' ? (index + 1) % coursePanes.length
      : event.key === 'ArrowLeft' ? (index + coursePanes.length - 1) % coursePanes.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? coursePanes.length - 1 : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const next = coursePanes[nextIndex][0];
    setFocusedTab({courseId: course.id, pane: next});
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-course-pane="${next}"]`)?.focus();
  }
  const draftRelease = releases.find((release) => ["draft", "changes-requested"].includes(release.status));
  const recoveryState=detailsRecovery.courseId===course.id?detailsRecovery.state:'none';
  const detailsOpen=editingDetails.courseId===course.id&&editingDetails.open;
  const detailsVisible=detailsOpen&&section==='content';
  const toggleDetails=()=>{
    const url=new URL(window.location.href);
    if(!url.pathname.endsWith(`/studio/courses/${encodeURIComponent(course.id)}`))return;
    if(section!=='content'||paneFromValue(url.searchParams.get('pane'))!=='content'){
      choosePane('content');
      setEditingDetails(current=>current.courseId===course.id?{courseId:course.id,open:true}:current);
      return;
    }
    setEditingDetails(current=>current.courseId===course.id?{courseId:course.id,open:!current.open}:current);
  };
  const recoveryChanged=(state:StudioDraftRecoveryState)=>{
    if(!['none','recovered','attention'].includes(state))return;
    setDetailsRecovery(current=>current.courseId===course.id?{courseId:course.id,state}:current);
  };
  return <section className="course-editor">
    <div className="course-editor-tabs">
      <div className="course-editor-tablist" role="tablist" aria-label="Course editor">
        {coursePanes.map(([value, label]) => <button type="button" role="tab" id={`course-${value}-tab`} data-course-pane={value} aria-selected={section === value} aria-controls={`course-${value}`} tabIndex={(focusedTab.courseId === course.id ? focusedTab.pane : section) === value ? 0 : -1} onFocus={() => setFocusedTab({courseId: course.id, pane: value})} onKeyDown={event => moveTab(event, value)} onClick={() => choosePane(value)} key={value}>{label}</button>)}
      </div>
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
          <button className="outline-button" type="button" aria-controls="course-details-editor" aria-expanded={detailsVisible} onClick={toggleDetails}>{detailsVisible ? "Hide course details" : "Edit course details"}</button>
          <DuplicateCourseButton courseId={course.id} recoveryScope={recoveryScope} />
          <p>Duplicates contain structure only, never learner attempts or publication history.</p>
        </div>
      </details>
    </div>
    {recoveryState!=='none'&&<p id="course-details-draft-status" className="studio-form-message" role="status">{recoveryState==='recovered'?'Recovered unsent course edits on this device.':'A device-local course draft needs attention.'} <button className="outline-button" type="button" aria-controls="course-details-editor" aria-expanded={detailsVisible} onClick={toggleDetails}>{detailsVisible?'Hide course details':recoveryState==='recovered'?'Review recovered edits':'Check device draft'}</button></p>}
    <div id="course-content" role="tabpanel" aria-labelledby="course-content-tab" tabIndex={0} hidden={section !== "content"}>
      <section id="course-details-editor" className="course-editor-panel course-create-panel" aria-label="Edit course details" hidden={!detailsOpen}><EditCourseDetailsForm key={JSON.stringify([course.id,recoveryScope?.actorId??null,recoveryScope?.organizationId??null])} course={course} recoveryScope={recoveryScope} onDraftRecoveryChange={recoveryChanged} /></section>
      <div className="course-editor-content">
        <section aria-label="Course outline"><header className="course-section-heading"><div><h2>Course content</h2><p>Open an item to edit its content. Add another when you need it.</p></div><span>{workbooks.length} items</span></header>
          {workbooks.length === 0 && <p className="course-empty">Your course is private. Start by adding your first teaching or assessment item.</p>}
          <ol className="course-outline">{workbooks.map((workbook, index) => <li key={workbook.id}><span className="course-item-number">{index + 1}</span><Link href={`/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`}><strong>{workbook.title}</strong><small>{workbook.mode === "lecture" ? "Lecture / presentation" : `${workbook.mode === "assessment" ? "Assessment" : "Imaging teaching"} · ${workbook.caseCount} cases`} · {workbook.status}</small></Link><Link className="course-item-details" href={`/studio/workbooks/${encodeURIComponent(workbook.id)}`} aria-label={`Details for ${workbook.title}`}>Details</Link></li>)}</ol>
        </section>
        <section className="course-add-content" aria-label="Add course content"><h2>Add content</h2><CreateWorkbookForm course={course} recoveryScope={recoveryScope} /></section>
      </div>
    </div>
    <section id="course-preview" role="tabpanel" aria-labelledby="course-preview-tab" tabIndex={0} className="course-editor-panel" hidden={section !== "preview"}><h2>Preview the learner experience</h2><p>Preview slides while editing each teaching item. A course release preview shows the saved course information and its selected content—not unsaved edits.</p>
      {releases.length ? <ul className="course-preview-list">{releases.map((release) => <li key={release.id}><Link href={`/studio/releases/${encodeURIComponent(release.id)}/preview`}>{release.title} — preview {release.status} version {release.version}</Link></li>)}</ul> : <p>No course release has been prepared yet. When your content is ready, open Review &amp; publish to prepare a private release draft.</p>}
    </section>
    <section id="course-review" role="tabpanel" aria-labelledby="course-review-tab" tabIndex={0} className="course-editor-panel" hidden={section !== "review"}><h2>Review &amp; publish</h2><ol className="course-release-steps"><li>Save your content and complete its independent review.</li><li>Prepare the course release below.</li><li>Submit the release for independent review, then publish when approved.</li></ol><p>Saving this form does not publish anything or grant learner access. Atlas, case and lecture access remain independent.</p>
      {workbooks.length ? <details className="course-release-settings"><summary>{draftRelease ? "Edit release draft" : "Prepare release draft"}</summary><ReleaseDraftForm key={course.id} course={course} workbooks={workbooks} release={draftRelease} recoveryScope={recoveryScope} /></details> : <p>Add course content first.</p>}
      <Link className="outline-button" href={`/studio/publishing?course=${encodeURIComponent(course.id)}`}>Open review queue →</Link>
    </section>
  </section>;
}

