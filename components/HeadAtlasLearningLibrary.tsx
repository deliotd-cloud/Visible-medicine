'use client';
import {useRef,useState} from 'react';
import {HeadLearningBookmark} from './HeadLearningBookmark';
import {headImageConceptById as headConceptById} from '../lib/head-image-only-links.ts';
import {headCerebellarLearningSequences,HEAD_CEREBELLAR_LEARNING_REVISION} from '../lib/head-cerebellar-learning.ts';
import {headLearningLinks,headLearningSequences,HEAD_LEARNING_REVISION} from '../lib/head-atlas-learning';
import {headLinksCurrent,HEAD_LINK_REVISION_NOTICE} from '../lib/head-link-availability.ts';
import {headMriLearningSequences,HEAD_MRI_LEARNING_REVISION} from '../lib/head-mri-learning';
import {headInsulaLearningSequences,HEAD_INSULA_LEARNING_REVISION} from '../lib/head-insula-learning';
import {headOrbitalLearningSequences,HEAD_ORBITAL_LEARNING_REVISION} from '../lib/head-orbital-learning';
import {headCtBoneLearningSequences,HEAD_CT_BONE_LEARNING_REVISION} from '../lib/head-ct-bone-learning';
import {headCtFacialLearningSequences,HEAD_CT_FACIAL_LEARNING_REVISION} from '../lib/head-ct-facial-learning.ts';

type TourModality='all'|'3D'|'CT'|'MRI';
type TourLinks=NonNullable<ReturnType<typeof headLearningLinks>>;
function hasSelectedView(links:TourLinks,modality:TourModality){
  return modality==='all'?!!(links.atlasHref||links.ctHref||links.mriHref):
    modality==='3D'?!!links.atlasHref:modality==='CT'?!!links.ctHref:!!links.mriHref;
}

function TourList({sequences,terms=[],modality='all'}:{sequences:Array<{id:string;label:string;concepts:string[]}>;terms?:string[];modality?:TourModality}){
  return <ol>{sequences.flatMap(sequence=>{
    const first=sequence.concepts[0];
    const links=first?headLearningLinks({sequenceId:sequence.id,conceptId:first}):null;
    if(!links)return [];
    const candidates=terms.length?sequence.concepts.flatMap((id,index)=>{
      const concept=headConceptById(id);
      if(!concept)return [];
      const matchedTerms=terms.filter(term=>concept.label.toLocaleLowerCase().includes(term));
      return [{id,index,label:concept.label,links:headLearningLinks({sequenceId:sequence.id,conceptId:id}),matchedTerms}];
    }):[];
    const matches=candidates.filter(item=>item.matchedTerms.length===terms.length);
    const context=terms.length>0&&matches.length===0;
    const visible=context?candidates.filter(item=>item.matchedTerms.length>0):matches;
    return [<li key={sequence.id}>
      <span><strong>{sequence.label}</strong>{' · '}{sequence.concepts.length} steps</span>
      <nav aria-label={`Start ${sequence.label}`}>
        {(modality==='all'||modality==='3D')&&links.atlasHref&&<a href={links.atlasHref} aria-label={`Start ${sequence.label} in the 3D Atlas`}>3D</a>}
        {(modality==='all'||modality==='CT')&&links.ctHref&&<a href={links.ctHref} aria-label={`Start ${sequence.label} in CT`}>CT</a>}
        {(modality==='all'||modality==='MRI')&&links.mriHref&&<a href={links.mriHref} aria-label={`Start ${sequence.label} in MRI`}>MRI</a>}
      </nav>
      {context&&<p className="head-linked-search-context-note">{visible.length?'Search terms span the tour title or different steps; no single step label matches every term. Each step below contributes a term.':'Tour title matches this search; no single step label matches every term.'}</p>}
      {visible.map(match=><div className={context?'head-linked-matching-step head-linked-contributing-step':'head-linked-matching-step'} key={match.id}>
        <span>{context?'Search context · step':'Matching step'} {match.index+1}: {match.label}{context&&` · contributes: ${match.matchedTerms.join(', ')}`}</span>
        {match.links&&hasSelectedView(match.links,modality)?<nav aria-label={`${context?'Open contributing':'Open matching'} step ${match.index+1}: ${match.label}`}>
          {(modality==='all'||modality==='3D')&&match.links.atlasHref&&<a href={match.links.atlasHref} aria-label={`Open ${context?'contributing':'matching'} step ${match.index+1}: ${match.label} in the 3D Atlas`}>3D</a>}
          {(modality==='all'||modality==='CT')&&match.links.ctHref&&<a href={match.links.ctHref} aria-label={`Open ${context?'contributing':'matching'} step ${match.index+1}: ${match.label} in CT`}>CT</a>}
          {(modality==='all'||modality==='MRI')&&match.links.mriHref&&<a href={match.links.mriHref} aria-label={`Open ${context?'contributing':'matching'} step ${match.index+1}: ${match.label} in MRI`}>MRI</a>}
        </nav>:<span>Exact comparison unavailable in the selected view</span>}
      </div>)}
      <details className="head-linked-step-preview" onKeyDown={event=>{
        if(event.key!=='Escape'||!event.currentTarget.open)return;
        event.preventDefault();event.stopPropagation();event.currentTarget.open=false;
        event.currentTarget.querySelector('summary')?.focus();
      }}>
        <summary>View steps · {sequence.label}</summary>
        <p>Open any step in a mapped view. Earlier steps remain available; jumping records no progress or completion.</p>
        <ol>{sequence.concepts.map((id,index)=>{
          const concept=headConceptById(id),stepLinks=headLearningLinks({sequenceId:sequence.id,conceptId:id});
          const label=concept?.label??`Step ${index+1}`;
          return <li key={id}>
            <span>{label}</span>
            {concept&&stepLinks&&hasSelectedView(stepLinks,modality)?<nav aria-label={`${sequence.label} step ${index+1}: ${label}`}>
              {(modality==='all'||modality==='3D')&&stepLinks.atlasHref&&<a href={stepLinks.atlasHref} aria-label={`Open ${label} at step ${index+1} in the 3D Atlas`}>3D</a>}
              {(modality==='all'||modality==='CT')&&stepLinks.ctHref&&<a href={stepLinks.ctHref} aria-label={`Open ${label} at step ${index+1} in CT`}>CT</a>}
              {(modality==='all'||modality==='MRI')&&stepLinks.mriHref&&<a href={stepLinks.mriHref} aria-label={`Open ${label} at step ${index+1} in MRI`}>MRI</a>}
            </nav>:<span>Exact comparison unavailable in the selected view</span>}
          </li>;
        })}</ol>
      </details>
    </li>];
  })}</ol>;
}

export function HeadAtlasLearningLibrary({initialView='all',initialQuery='',compact=false,fixedView=false,fixedQuery=false}:{initialView?:TourModality;initialQuery?:string;compact?:boolean;fixedView?:boolean;fixedQuery?:boolean}={}){
  const [query,setQuery]=useState(initialQuery),[modality,setModality]=useState<TourModality>(initialView),[page,setPage]=useState(0);
  const searchRef=useRef<HTMLInputElement>(null);
  const statusRef=useRef<{element:HTMLParagraphElement|null;pending:{page:number;origin:HTMLButtonElement}|null}>({element:null,pending:null});
  if(!headLinksCurrent()){statusRef.current.pending=null;return <section aria-label="CT and MRI linked tours"><p role="status">{HEAD_LINK_REVISION_NOTICE}</p></section>;}
  const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered=!!query||modality!=='all';
  const canClear=(!fixedQuery&&!!query)||(!fixedView&&modality!=='all');
  const [base,mri,insula,orbital,bone,cerebellar,facial]=[headLearningSequences,headMriLearningSequences,headInsulaLearningSequences,headOrbitalLearningSequences,headCtBoneLearningSequences,headCerebellarLearningSequences,headCtFacialLearningSequences].map(sequences=>sequences.filter(sequence=>{
    const links=headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]});
    if(!links||(modality==='3D'&&!links.atlasHref)||(modality==='CT'&&!links.ctHref)||(modality==='MRI'&&!links.mriHref))return false;
    const text=[sequence.label,...sequence.concepts.map(id=>headConceptById(id)?.label??'')].join(' ').toLocaleLowerCase();
    return terms.every(term=>text.includes(term));
  }));
  const count=base.length+mri.length+insula.length+orbital.length+bone.length+cerebellar.length+facial.length;
  const groups=[base,mri,insula,orbital,bone,cerebellar,facial];
  const ordered=groups.flat();
  const pageCount=Math.max(1,Math.ceil(count/6));
  const currentPage=Math.min(page,pageCount-1);
  const start=currentPage*6;
  let offset=0;
  const [shownBase,shownMri,shownInsula,shownOrbital,shownBone,shownCerebellar,shownFacial]=groups.map(group=>{
    const shown=compact?group.slice(Math.max(0,start-offset),Math.max(0,start+6-offset)):group;
    offset+=group.length;
    return shown;
  });
  const changePage=(next:number,origin:HTMLButtonElement)=>{
    if(next<0||next>=pageCount)return;
    statusRef.current.pending={page:next,origin};
    setPage(next);
  };
  const commitStatus=(element:HTMLParagraphElement|null)=>{
    statusRef.current.element=element;
    const pending=statusRef.current.pending;
    if(!element||!pending||pending.page!==currentPage)return;
    statusRef.current.pending=null;
    const active=document.activeElement;
    if(active===pending.origin||(active===document.body&&pending.origin.disabled))element.focus({preventScroll:true});
  };
  return <section aria-label="CT and MRI linked tours">
    <h2>CT/MRI-linked tours · Draft</h2>
    <HeadLearningBookmark/>
    <p>Start at step 1 in the existing 3D Atlas, CT or MRI, or expand View steps to open a particular structure. Only mapped modalities are offered. Configured local previews load CT/MRI automatically; otherwise choose the approved atlas folder. Comparisons are between separate, unregistered subjects. These draft links do not track progress or imply completion or clinical approval.</p>
    <div className="head-linked-library-filters">
      {!fixedQuery&&<label>Search linked tours<input ref={searchRef} type="search" value={query} onChange={event=>{statusRef.current.pending=null;setQuery(event.target.value);setPage(0);}} placeholder="Tour or structure, e.g. pons" autoComplete="off"/></label>}
      {!fixedView&&<label>Available view<select value={modality} onChange={event=>{const value=event.target.value;if(value==='all'||value==='3D'||value==='CT'||value==='MRI'){statusRef.current.pending=null;setModality(value);setPage(0);}}}><option value="all">All linked tours</option><option value="3D">3D Atlas</option><option value="CT">Available on CT</option><option value="MRI">Available on MRI</option></select></label>}
      {canClear&&<button type="button" onClick={()=>{statusRef.current.pending=null;if(!fixedQuery)setQuery('');if(!fixedView)setModality('all');setPage(0);searchRef.current?.focus();}}>Clear tour filters</button>}
    </div>
    <p ref={compact?commitStatus:undefined} tabIndex={compact?-1:undefined} role="status" className="head-linked-library-results">{count?(compact?`Showing linked tours ${start+1}–${Math.min(start+6,count)} of ${count}`:`${count} linked ${count===1?'tour':'tours'} available`):'No linked tours match. Clear filters to see all available sequences.'}</p>
    {compact&&count>0&&<nav className="head-linked-library-pager" aria-label="Linked head tour pages">
      <button type="button" disabled={currentPage===0} onClick={event=>changePage(currentPage-1,event.currentTarget)} aria-label={`Previous linked tours${currentPage>0?`, starting with ${ordered[start-6].label}`:''}`}>← Previous</button>
      <span>Page {currentPage+1} of {pageCount}</span>
      <button type="button" disabled={currentPage===pageCount-1} onClick={event=>changePage(currentPage+1,event.currentTarget)} aria-label={`Next linked tours${currentPage<pageCount-1?`, starting with ${ordered[start+6].label}`:''}`}>Next →</button>
    </nav>}
    {((!compact&&!filtered)||shownBase.length>0)&&<><TourList sequences={shownBase} terms={terms} modality={modality}/>
    <details><summary>Sequence review revision</summary><p>Draft sequence packet <code style={{overflowWrap:'anywhere'}}>{HEAD_LEARNING_REVISION}</code>. This identifies the ordered steps, exact source bindings and teaching revision; it is not an approval.</p></details></>}
    {((!compact&&!filtered)||shownMri.length>0)&&<section aria-label="MRI-only linked tours"><h3>MRI-only comparisons · Draft</h3><p>No exact CT target is mapped for these sequences. The callosal mask is partial; step order does not imply a continuous pathway.</p><TourList sequences={shownMri} terms={terms} modality={modality}/><details><summary>MRI-only sequence review revision</summary><p>Separate draft sequence packet <code style={{overflowWrap:'anywhere'}}>{HEAD_MRI_LEARNING_REVISION}</code>. No decision from the five CT/MRI sequences or teaching form applies.</p></details></section>}
    {((!compact&&!filtered)||shownInsula.length>0)&&<section aria-label="Insula linked tours"><h3>Insular coverage · Draft</h3><p>Compare both sides without treating regional CT and partial MRI masks as complete boundaries.</p><TourList sequences={shownInsula} terms={terms} modality={modality}/><details><summary>Insula sequence review revision</summary><p>Independent draft sequence packet <code style={{overflowWrap:'anywhere'}}>{HEAD_INSULA_LEARNING_REVISION}</code>. Earlier teaching or sequence decisions do not approve these steps.</p></details></section>}
    {((!compact&&!filtered)||shownOrbital.length>0)&&<section aria-label="Globe linked tours"><h3>Globe coverage · Draft</h3><p>Compare left and right globes across CT, partial MRI masks and the existing 3D eyeballs. Eye layers and the optic nerve are not matched by these links.</p><TourList sequences={shownOrbital} terms={terms} modality={modality}/><details><summary>Globe sequence review revision</summary><p>Independent draft sequence packet <code style={{overflowWrap:'anywhere'}}>{HEAD_ORBITAL_LEARNING_REVISION}</code>. Earlier comparison, teaching or tour decisions do not approve these steps.</p></details></section>}
    {((!compact&&!filtered)||shownBone.length>0)&&<section aria-label="CT-only bone linked tours"><h3>CT-only bone coverage · Draft</h3><p>These six saved CT masks cover partial regions, not complete bones. Compare the existing generic 3D bones separately. No exact MRI targets or fracture assessment are provided.</p><TourList sequences={shownBone} terms={terms} modality={modality}/><details><summary>CT-only sequence review revision</summary><p>Independent draft sequence packet <code style={{overflowWrap:'anywhere'}}>{HEAD_CT_BONE_LEARNING_REVISION}</code>. Existing bone-comparison decisions do not approve these tours.</p></details></section>}
    {((!compact&&!filtered)||shownCerebellar.length>0)&&<section aria-label="Cerebellar CT and MRI tours"><h3>Cerebellar orientation · Draft</h3><p>Native CT/MRI examples only: no exact 3D counterpart is mapped. The MRI vermis has partial coverage.</p><TourList sequences={shownCerebellar} terms={terms} modality={modality}/><details><summary>Cerebellar sequence review revision</summary><p>Independent draft sequence packet <code style={{overflowWrap:'anywhere'}}>{HEAD_CEREBELLAR_LEARNING_REVISION}</code>. Comparison and teaching decisions do not approve this sequence.</p></details></section>}
    {((!compact&&!filtered)||shownFacial.length>0)&&<><TourList sequences={shownFacial} terms={terms} modality={modality}/><details><summary>Facial sequence scope and review revision</summary><p>Zygomatic masks cover limited regions; the regional mandible mask does not establish whole-bone coverage. Compare generic 3D bones separately. No MRI target, fracture assessment or patient-space registration is provided.</p><p>Independent draft sequence packet <code style={{overflowWrap:'anywhere'}}>{HEAD_CT_FACIAL_LEARNING_REVISION}</code>. Existing comparison decisions do not approve these steps.</p></details></>}
  </section>;
}
