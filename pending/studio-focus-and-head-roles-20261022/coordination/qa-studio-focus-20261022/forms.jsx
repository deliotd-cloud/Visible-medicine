// Form doubles: preserve real browser inputs/mounting, never call a website API.
import React,{useEffect} from 'react';
export function EditCourseDetailsForm({course,onDraftRecoveryChange}){
 useEffect(()=>{const notify=()=>onDraftRecoveryChange('recovered');window.addEventListener('qa-recovery',notify);return()=>window.removeEventListener('qa-recovery',notify);},[onDraftRecoveryChange]);
 return <form className="studio-form" onSubmit={e=>e.preventDefault()}><h2>Edit course details</h2><label>Course title <input name="title" defaultValue={course.title}/></label><label>Description <textarea name="description" defaultValue="Synthetic course description"/></label><p>No saving, API or browser storage in this test.</p></form>;
}
export function CreateWorkbookForm(){return <p>Form placeholder — no workbook creation.</p>;}
export function DuplicateCourseButton(){return <button type="button">Duplicate course (inert test double)</button>;}
export function ReleaseDraftForm(){return <p>Release placeholder — no publishing.</p>;}
