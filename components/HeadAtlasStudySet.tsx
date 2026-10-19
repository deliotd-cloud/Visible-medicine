'use client';
import {useState} from 'react';
import type {ReactNode} from 'react';
import type {HeadEntry} from '../lib/head-atlas-import';
import type {PracticeMode} from '../lib/head-atlas-practice';
import {headLabel} from '../lib/head-atlas-display';
import {HEAD_STUDY_SET_LIMIT} from '../lib/head-study-set';
import type {HeadStudyComparison} from '../lib/head-study-comparison';

export function HeadAtlasStudySet({entries,comparisons,filteredAdd,savedPlan,onSelect,onRemove,onClear,onPractice,onMove}:{
  savedPlan?:ReactNode;
  filteredAdd?:{count:number;total:number;onAdd:()=>void};
  comparisons?:HeadStudyComparison[];
  entries:HeadEntry[];onSelect:(entry:HeadEntry)=>void;onRemove:(entry:HeadEntry)=>void;
  onClear:()=>void;onPractice:(mode:PracticeMode,order?:'shuffle'|'study-set')=>void;
  onMove?:(entry:HeadEntry,direction:-1|1)=>void;
}){
  const [mode,setMode]=useState<PracticeMode>('locate');
  return <details className="head-study-set" onKeyDown={event=>{
    if(event.key!=='Escape'||!event.currentTarget.open)return;
    event.preventDefault();event.stopPropagation();event.currentTarget.open=false;
    event.currentTarget.querySelector('summary')?.focus();
  }}>
    <summary>My study set · {entries.length}</summary>
    <p>Choose a structure, then use Add to study set in its panel. Up to {HEAD_STUDY_SET_LIMIT} distinct saved masks from this scan.</p>
    {filteredAdd&&<><button type="button" disabled={!filteredAdd.count} onClick={filteredAdd.onAdd}>Add filtered masks to study set ({filteredAdd.count})</button><p role="status">{filteredAdd.total===0?'No new eligible masks in these results.':filteredAdd.count<filteredAdd.total?`${filteredAdd.count} of ${filteredAdd.total} new masks fit. Earlier entries stay; additions follow the index order. Narrow the filters or remove items to choose a different subset.`:`${filteredAdd.count} new masks from the current filters. Existing entries stay; practice starts only when you choose it.`}</p></>}
    {entries.length>0?<>
      <ol>{entries.map(entry=>{const comparison=comparisons?.find(item=>item.entry===entry);return <li key={entry.id}>
        <button type="button" onClick={()=>onSelect(entry)} aria-label={`Study ${headLabel(entry)}`}>{headLabel(entry)}</button>
        <button type="button" aria-label={`Remove ${headLabel(entry)} from study set`} onClick={event=>{
          event.currentTarget.closest('details')?.querySelector('summary')?.focus();onRemove(entry);
        }}>Remove</button>
        {comparisons&&<nav className="head-study-comparisons" aria-label={`Compare ${headLabel(entry)} in another view`}>
          {comparison?.links.length
            ?comparison.links.map(link=><a key={link.modality} href={link.href} target="_blank" rel="noopener noreferrer" title={comparison.scopeNote} aria-label={`Compare ${headLabel(entry)} in ${link.modality==='3D'?'3D Atlas':link.modality} (new tab)`}>{link.modality==='3D'?'3D Atlas':link.modality} ↗</a>)
            :<span>No exact comparison mapped</span>}
        </nav>}
      </li>;})}</ol>
      {comparisons&&<p>Comparisons open separately to keep this study set here. Only mapped anatomy is offered: different, unregistered subjects, not matched coordinates. In a new CT/MRI tab, a configured local preview opens automatically; otherwise choose the approved folder. This does not transfer the set, scores, scans or annotations, or unlock separate access.</p>}
      <label>Study set question style<select value={mode} onChange={event=>{
        const value=event.target.value;if(value==='locate'||value==='label'||value==='recall')setMode(value);
      }}><option value="locate">Find it on the scan</option><option value="label">Label the highlighted structure</option><option value="recall">Type the structure name</option></select></label>
      {onMove&&<details onKeyDown={event=>{
        if(event.key!=='Escape'||!event.currentTarget.open)return;
        event.preventDefault();event.stopPropagation();event.currentTarget.open=false;
        event.currentTarget.querySelector('summary')?.focus();
      }}>
        <summary>Arrange study order</summary>
        <p>Move a structure earlier or later. This changes only this session’s list; saved plans and existing results stay unchanged.</p>
        <ol aria-label="Arrange study set">{entries.map((entry,index)=><li key={entry.id}>
          <span tabIndex={-1} data-study-order-label>{index+1}. {headLabel(entry)}</span>
          <span>{([-1,1] as const).map(direction=><button key={direction} type="button"
            aria-label={`Move ${headLabel(entry)} ${direction===-1?'earlier':'later'}`}
            disabled={direction===-1?index===0:index===entries.length-1}
            onClick={event=>{
              event.currentTarget.closest('li')?.querySelector<HTMLElement>('[data-study-order-label]')?.focus();
              onMove(entry,direction);
            }}>{direction===-1?'↑':'↓'}</button>)}</span>
        </li>)}</ol>
      </details>}
      {onMove&&<label>Question order<select name="study-set-question-order" defaultValue="shuffle"><option value="shuffle">Shuffled</option><option value="study-set">Study-set order</option></select></label>}
      <button type="button" onClick={event=>{
        if(!onMove){onPractice(mode);return;}
        const control=event.currentTarget.closest('details')?.querySelector('[name="study-set-question-order"]') as HTMLSelectElement|null|undefined;
        const order=control?.value;
        if(order==='shuffle'||order==='study-set')onPractice(mode,order);
      }}>Practise study set ({entries.length})</button>
      <button type="button" onClick={event=>{event.currentTarget.closest('details')?.querySelector('summary')?.focus();onClear();}}>Clear study set</button>
    </>:<p>No structures added yet.</p>}
    <p>The current set is kept only while this scan is open. Closing, changing scan or refreshing clears it. Starting practice creates a new attempt; it does not edit annotations.</p>
    {savedPlan}
  </details>;
}
