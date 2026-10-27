"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { StudioCourse, StudioRelease, StudioWorkbook } from "@/lib/education-platform";
import { CreateWorkbookForm, DuplicateCourseButton, EditCourseDetailsForm, ReleaseDraftForm, type StudioDraftRecoveryState } from "./StudioForms";
import type { StudioDraftScope } from "../lib/studio-draft-scope.ts";

type CoursePane = "content" | "preview" | "review";
type OutlineKind = "all" | "lecture" | "teaching" | "assessment";
const coursePanes = [['content', 'Content'], ['preview', 'Preview'], ['review', 'Review & publish']] as const;

function paneFromValue(value: string | null): CoursePane {
  return value === "preview" || value === "review" ? value : "content";
}

// Project a saved release order onto the current, course-scoped Studio snapshot.
// Unknown slots stay visible without revealing an out-of-course identifier.
export function projectSavedCourseOutline(courseId: string, workbooks: readonly StudioWorkbook[], savedIds: readonly unknown[] | null) {
  const inCourse = new Map<string, StudioWorkbook>();
  for (const workbook of workbooks) if (workbook.courseId === courseId && !inCourse.has(workbook.id)) inCourse.set(workbook.id, workbook);
  const available = [...inCourse.values()];
  if (savedIds === null) return { hasSavedOrder: false, selected: [] as Array<StudioWorkbook | null>, unselected: available };
  const selected: Array<StudioWorkbook | null> = [];
  const seen = new Set<string>();
  for (const id of Array.isArray(savedIds) ? savedIds : []) {
    if (typeof id !== 'string' || !id || seen.has(id)) { selected.push(null); continue; }
    seen.add(id);
    selected.push(inCourse.get(id) ?? null);
  }
  return { hasSavedOrder: true, selected, unselected: available.filter(workbook => !seen.has(workbook.id)) };
}

export function StudioCourseEditor({ course, workbooks, releases, recoveryScope }: { course: StudioCourse; workbooks: StudioWorkbook[]; releases: StudioRelease[]; recoveryScope: StudioDraftScope }) {
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";
  const [section, setSection] = useState<CoursePane>(() => paneFromValue(searchParams?.get("pane") ?? null));
  const [focusedTab, setFocusedTab] = useState<{courseId: string; pane: CoursePane}>(() => ({courseId: course.id, pane: paneFromValue(searchParams?.get("pane") ?? null)}));
  const [editingDetails, setEditingDetails] = useState({courseId: course.id, open: false});
  const [detailsFocusIntent, setDetailsFocusIntent] = useState<{courseId:string;actorId:string|null;organizationId:string|null}|null>(null);
  const handledDetailsFocusIntent=useRef<typeof detailsFocusIntent>(null);
  const [detailsRecovery,setDetailsRecovery]=useState<{courseId:string;state:StudioDraftRecoveryState}>({courseId:course.id,state:'none'});
  const releaseIdentity=JSON.stringify([course.id,releases.find(release=>release.courseId===course.id&&["draft","changes-requested"].includes(release.status))?.id??null,recoveryScope?.actorId??null,recoveryScope?.organizationId??null,workbooks.length>0]);
  // A speculative render may compute another identity before it commits. Only
  // the committed visit may report recovery or act on a visible cue.
  const releaseVisit=useMemo(()=>({identity:releaseIdentity}),[releaseIdentity]);
  const committedReleaseVisit=useRef<typeof releaseVisit|null>(null);
  useLayoutEffect(()=>{
    committedReleaseVisit.current=releaseVisit;
    return()=>{if(committedReleaseVisit.current===releaseVisit)committedReleaseVisit.current=null;};
  },[releaseVisit]);
  const [releaseRecovery,setReleaseRecovery]=useState<{visit:typeof releaseVisit;state:StudioDraftRecoveryState}>({visit:releaseVisit,state:'none'});
  const [releaseFocusIntent,setReleaseFocusIntent]=useState<typeof releaseVisit|null>(null);
  const [outlineFind, setOutlineFind] = useState<{courseId: string; query: string; kind: OutlineKind}>({courseId: course.id, query: "", kind: "all"});
  const outlineSearch = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setOutlineFind({courseId: course.id, query: "", kind: "all"});
  }, [course.id]);
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
  const courseReleases = releases.filter((release) => release.courseId === course.id);
  const draftRelease = courseReleases.find((release) => ["draft", "changes-requested"].includes(release.status));
  // Keep the first saved release when versions tie, matching the snapshot order.
  const previewRelease = draftRelease ?? courseReleases.reduce<StudioRelease | null>((highest, release) =>
    highest === null || release.version > highest.version ? release : highest, null);
  const otherReleases = courseReleases.filter((release) => release !== previewRelease);
  const releaseRecoveryState=releaseRecovery.visit===releaseVisit&&committedReleaseVisit.current===releaseVisit?releaseRecovery.state:'none';
  const outline = projectSavedCourseOutline(course.id, workbooks, draftRelease?.workbookIds ?? null);
  // State from another mounted course is never effective for this course.
  const effectiveFind = outlineFind.courseId === course.id ? outlineFind : {courseId: course.id, query: "", kind: "all" as OutlineKind};
  const query = effectiveFind.query.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const filtering = Boolean(query) || effectiveFind.kind !== "all";
  const matches = (workbook: StudioWorkbook) => (!query || workbook.title.replace(/\s+/g, " ").toLocaleLowerCase().includes(query))
    && (effectiveFind.kind === "all" || workbook.mode === effectiveFind.kind);
  const selectedRows = outline.selected.flatMap((workbook, index) => workbook === null || matches(workbook) ? [{workbook, position: index + 1}] : []);
  const unselectedRows = outline.unselected.filter(matches);
  const availableCount = outline.selected.filter(Boolean).length + outline.unselected.length;
  const matchingCount = selectedRows.filter(row => row.workbook !== null).length + unselectedRows.length;
  const unavailableCount = selectedRows.filter(row => row.workbook === null).length;
  const renderWorkbookItem = (workbook: StudioWorkbook, number?: number) => <li key={workbook.id}>{number !== undefined && <span className="course-item-number">{number}</span>}<Link href={`/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`}><strong>{workbook.title}</strong><small>{workbook.mode === "lecture" ? "Lecture / presentation" : `${workbook.mode === "assessment" ? "Assessment" : "Imaging teaching"} · ${workbook.caseCount} cases`} · {workbook.status}{["archived", "withdrawn"].includes(workbook.status) ? " · unavailable to learners" : ""}</small></Link><Link className="course-item-details" href={`/studio/workbooks/${encodeURIComponent(workbook.id)}`} aria-label={`Details for ${workbook.title}`}>Details</Link></li>;
  const recoveryState=detailsRecovery.courseId===course.id?detailsRecovery.state:'none';
  const detailsOpen=editingDetails.courseId===course.id&&editingDetails.open;
  const detailsVisible=detailsOpen&&section==='content';
  useEffect(() => {
    const currentCourseRoute=window.location.pathname.endsWith(`/studio/courses/${encodeURIComponent(course.id)}`);
    if(detailsFocusIntent&&handledDetailsFocusIntent.current!==detailsFocusIntent){
      handledDetailsFocusIntent.current=detailsFocusIntent;
      if(typeof document!=='undefined'&&currentCourseRoute&&detailsFocusIntent.courseId===course.id&&detailsFocusIntent.actorId===(recoveryScope?.actorId??null)&&detailsFocusIntent.organizationId===(recoveryScope?.organizationId??null)&&detailsVisible&&paneFromValue(new URLSearchParams(window.location.search).get('pane'))==='content'){
        const title=document.querySelector<HTMLInputElement>('#course-details-editor:not([hidden]) input[name="title"]');
        if(title)title.focus();
        else document.getElementById('course-content-tab')?.focus();
      }
      setDetailsFocusIntent(null);
    }
    if(typeof document!=='undefined'&&!detailsVisible&&currentCourseRoute&&document.activeElement?.closest?.('#course-details-editor')){
      document.getElementById(`course-${section}-tab`)?.focus();
    }
  },[course.id,detailsFocusIntent,detailsVisible,recoveryScope?.actorId,recoveryScope?.organizationId,searchKey,section]);
  useEffect(() => {
    if(!releaseFocusIntent)return;
    if(releaseFocusIntent!==releaseVisit||committedReleaseVisit.current!==releaseVisit){setReleaseFocusIntent(current=>current===releaseFocusIntent?null:current);return;}
    if(!window.location.pathname.endsWith(`/studio/courses/${encodeURIComponent(course.id)}`)||paneFromValue(new URLSearchParams(window.location.search).get('pane'))!=='review'){setReleaseFocusIntent(current=>current===releaseFocusIntent?null:current);return;}
    if(section!=='review')return;
    const settings=document.getElementById('course-release-settings') as HTMLDetailsElement|null;
    if(settings){settings.open=true;settings.querySelector('summary')?.focus();}
    setReleaseFocusIntent(current=>current===releaseFocusIntent?null:current);
  },[course.id,releaseFocusIntent,releaseVisit,searchKey,section]);
  const toggleDetails=()=>{
    const url=new URL(window.location.href);
    if(!url.pathname.endsWith(`/studio/courses/${encodeURIComponent(course.id)}`))return;
    if(section!=='content'||paneFromValue(url.searchParams.get('pane'))!=='content'){
      choosePane('content');
      setEditingDetails(current=>current.courseId===course.id?{courseId:course.id,open:true}:current);
      setDetailsFocusIntent({courseId:course.id,actorId:recoveryScope?.actorId??null,organizationId:recoveryScope?.organizationId??null});
      return;
    }
    if(detailsOpen)setDetailsFocusIntent(null);
    else setDetailsFocusIntent({courseId:course.id,actorId:recoveryScope?.actorId??null,organizationId:recoveryScope?.organizationId??null});
    setEditingDetails(current=>current.courseId===course.id?{courseId:course.id,open:!current.open}:current);
  };
  const recoveryChanged=(state:StudioDraftRecoveryState)=>{
    if(!['none','recovered','attention'].includes(state))return;
    setDetailsRecovery(current=>current.courseId===course.id?{courseId:course.id,state}:current);
  };
  const releaseRecoveryChanged=(state:StudioDraftRecoveryState)=>{
    if(!['none','recovered','attention'].includes(state)||committedReleaseVisit.current!==releaseVisit||!window.location.pathname.endsWith(`/studio/courses/${encodeURIComponent(course.id)}`))return;
    setReleaseRecovery({visit:releaseVisit,state});
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
          <button className="outline-button" type="button" aria-controls="course-details-editor" aria-expanded={detailsVisible} onClick={event=>{if(!window.location.pathname.endsWith(`/studio/courses/${encodeURIComponent(course.id)}`))return;const options=event.currentTarget.closest<HTMLDetailsElement>('details.course-options');if(options){options.open=false;if(detailsVisible)options.querySelector('summary')?.focus();}toggleDetails();}}>{detailsVisible ? "Hide course details" : "Edit course details"}</button>
          <DuplicateCourseButton courseId={course.id} recoveryScope={recoveryScope} />
          <p>Duplicates contain structure only, never learner attempts or publication history.</p>
        </div>
      </details>
    </div>
    {recoveryState!=='none'&&<p id="course-details-draft-status" className="studio-form-message" role="status">{recoveryState==='recovered'?'Recovered unsent course edits on this device.':'A device-local course draft needs attention.'} <button className="outline-button" type="button" aria-controls="course-details-editor" aria-expanded={detailsVisible} onClick={toggleDetails}>{detailsVisible?'Hide course details':recoveryState==='recovered'?'Review recovered edits':'Check device draft'}</button></p>}
    {releaseRecoveryState!=='none'&&<p id="course-release-draft-status" className="studio-form-message" role="status">{releaseRecoveryState==='recovered'?'Recovered unsent release edits on this device.':'A device-local release draft needs attention. Review its form message before continuing.'} <button className="outline-button" type="button" aria-controls="course-release-settings" onClick={()=>{if(committedReleaseVisit.current!==releaseVisit||!window.location.pathname.endsWith(`/studio/courses/${encodeURIComponent(course.id)}`))return;choosePane('review');setReleaseFocusIntent(releaseVisit);}}>{releaseRecoveryState==='recovered'?'Review recovered release edits':'Check release draft'}</button></p>}
    <div id="course-content" role="tabpanel" aria-labelledby="course-content-tab" tabIndex={0} hidden={section !== "content"}>
      <section id="course-details-editor" className="course-editor-panel course-create-panel" aria-label="Edit course details" hidden={!detailsOpen}><EditCourseDetailsForm key={JSON.stringify([course.id,recoveryScope?.actorId??null,recoveryScope?.organizationId??null])} course={course} recoveryScope={recoveryScope} onDraftRecoveryChange={recoveryChanged} /></section>
      <div className="course-editor-content">
        <section aria-label="Course outline"><header className="course-section-heading"><div><h2>Course content</h2><p>Open an item to edit its content. Add another when you need it.</p></div><span>{availableCount} items</span></header>
          <div className="course-outline-find" role="group" aria-label="Find course content">
            <div><label htmlFor="course-outline-title-search">Find by title</label><input ref={outlineSearch} id="course-outline-title-search" type="search" value={effectiveFind.query} maxLength={80} autoComplete="off" onChange={event => setOutlineFind({courseId: course.id, query: event.currentTarget.value.slice(0, 80), kind: effectiveFind.kind})} /></div>
            <div><label htmlFor="course-outline-kind">Content kind</label><select id="course-outline-kind" value={effectiveFind.kind} onChange={event => setOutlineFind({courseId: course.id, query: effectiveFind.query, kind: event.currentTarget.value as OutlineKind})}><option value="all">All content</option><option value="lecture">Lectures</option><option value="teaching">Imaging teaching</option><option value="assessment">Assessments</option></select></div>
            <button className="outline-button" type="button" disabled={!effectiveFind.query && effectiveFind.kind === "all"} onClick={() => {setOutlineFind({courseId: course.id, query: "", kind: "all"}); outlineSearch.current?.focus();}}>Clear filters</button>
          </div>
          <p className="course-outline-find-status" role="status">{filtering ? `${matchingCount} of ${availableCount} available items match` : `${availableCount} available items`}{unavailableCount ? ` · ${unavailableCount} unavailable saved ${unavailableCount === 1 ? "position" : "positions"} shown` : ""}</p>
          {filtering && matchingCount === 0 && availableCount > 0 && <p className="course-empty">No available items match these filters. Clear filters to see all content.</p>}
          {!outline.hasSavedOrder && <p>No learner order is saved in an editable release draft. Set and save the learner order in Review &amp; publish.</p>}
          {outline.hasSavedOrder && <><h3>Last saved release draft order</h3><p>Unsent changes appear here after you save the draft and refresh.</p>{selectedRows.length ? <ol className="course-outline" aria-label="Last saved release draft order">{selectedRows.map(({workbook, position}) => workbook ? renderWorkbookItem(workbook, position) : <li key={`unavailable-${position}`}><span className="course-item-number">{position}</span><div><strong>Selected item unavailable</strong><small>This saved position has no current item in this course. Review the release draft.</small></div></li>)}</ol> : outline.selected.length === 0 ? <p>No content selected in this saved release draft.</p> : null}</>}
          {unselectedRows.length > 0 && <>{outline.hasSavedOrder && <h3>Not in this release draft</h3>}<ul className="course-outline" aria-label={outline.hasSavedOrder ? "Not in this release draft" : "Course content list"}>{unselectedRows.map(workbook => renderWorkbookItem(workbook))}</ul></>}
          {outline.selected.length === 0 && outline.unselected.length === 0 && <p className="course-empty">Your course is private. Start by adding your first teaching or assessment item.</p>}
        </section>
        <section className="course-add-content" aria-label="Add course content"><h2>Add content</h2><CreateWorkbookForm course={course} recoveryScope={recoveryScope} /></section>
      </div>
    </div>
    <section id="course-preview" role="tabpanel" aria-labelledby="course-preview-tab" tabIndex={0} className="course-editor-panel" hidden={section !== "preview"}><h2>Preview the learner experience</h2><p>Preview slides while editing each teaching item. A course release preview shows the saved course information and its selected content—not unsaved edits.</p>
      {previewRelease ? <>
        <p>{draftRelease ? "Editable release draft preview:" : "No editable release draft. Showing the highest saved version for this course:"}</p>
        <ul className="course-preview-list"><li><Link href={`/studio/releases/${encodeURIComponent(previewRelease.id)}/preview`}>{previewRelease.title} — preview {previewRelease.status} version {previewRelease.version}</Link></li></ul>
        {otherReleases.length > 0 && <details><summary>Other release versions ({otherReleases.length})</summary><ul className="course-preview-list">{otherReleases.map((release) => <li key={release.id}><Link href={`/studio/releases/${encodeURIComponent(release.id)}/preview`}>{release.title} — preview {release.status} version {release.version}</Link></li>)}</ul></details>}
      </> : <p>No course release has been prepared yet. When your content is ready, open Review &amp; publish to prepare a private release draft.</p>}
    </section>
    <section id="course-review" role="tabpanel" aria-labelledby="course-review-tab" tabIndex={0} className="course-editor-panel" hidden={section !== "review"}><h2>Review &amp; publish</h2><ol className="course-release-steps"><li>Save your content and complete its independent review.</li><li>Prepare the course release below.</li><li>Submit the release for independent review, then publish when approved.</li></ol><p>Saving this form does not publish anything or grant learner access. Atlas, case and lecture access remain independent.</p>
      {workbooks.length ? <details id="course-release-settings" className="course-release-settings"><summary>{draftRelease ? "Edit release draft" : "Prepare release draft"}</summary><ReleaseDraftForm course={course} workbooks={workbooks} release={draftRelease} recoveryScope={recoveryScope} onDraftRecoveryChange={releaseRecoveryChanged} /></details> : <p>Add course content first.</p>}
      <Link className="outline-button" href={`/studio/publishing?course=${encodeURIComponent(course.id)}`}>Open review queue →</Link>
    </section>
  </section>;
}

