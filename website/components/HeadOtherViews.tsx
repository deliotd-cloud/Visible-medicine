'use client';

import {useLayoutEffect,useRef} from 'react';
import Link from 'next/link';
import {HeadSeparateComparisonLink} from './HeadSeparateComparisonLink';
import {LearningResourceStatus} from './LearningResourceStatus.ts';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard';
import type {Modality} from '../lib/head-atlas-import';

/** Separate navigation for the selected, revision-matched image concept. */
export function HeadOtherViews({identity,label,atlasHref,scopeNote,comparisonHref,modality,preserveScanTab}:{
  identity:string;label:string;atlasHref:string|null|undefined;scopeNote:string;
  comparisonHref:string|null|undefined;modality:Modality;preserveScanTab:boolean;
}){
  const detailsRef=useRef<HTMLDetailsElement>(null);
  const previousIdentity=useRef(identity);
  useLayoutEffect(()=>{
    if(previousIdentity.current===identity)return;
    previousIdentity.current=identity;
    const details=detailsRef.current;
    if(!details)return;
    const summary=details.querySelector<HTMLElement>(':scope > summary');
    if(details.open&&details.contains(document.activeElement)&&document.activeElement!==summary){
      summary?.focus({preventScroll:true});
    }
    details.open=false;
  },[identity]);
  const otherModality=modality==='CT'?'MRI':'CT';
  return <details ref={detailsRef} className="head-other-views head-concept-links head-primary-comparison" onKeyDown={headDisclosureKeyDown}>
    <summary>Other views</summary>
    <div className="head-other-views-content">
      <nav aria-label={`Compare ${label}`}>
        {atlasHref&&<a href={atlasHref} target={preserveScanTab?'_blank':undefined} rel={preserveScanTab?'noopener noreferrer':undefined} aria-label={`Open ${label} in the 3D Atlas${preserveScanTab?' (new tab)':''}`}>Full 3D Atlas{preserveScanTab?' ↗':''}</a>}
        {comparisonHref&&<Link href={comparisonHref} prefetch={false} aria-label={`Find ${label} on ${otherModality}`}>{otherModality}</Link>}
        {comparisonHref&&<HeadSeparateComparisonLink href={comparisonHref} modality={otherModality}/>}
      </nav>
      {!comparisonHref&&<p className="head-learning-unavailable"><LearningResourceStatus status="unavailable"/> No exact {otherModality} comparison is mapped.</p>}
      {atlasHref&&preserveScanTab&&<p>Full 3D Atlas opens separately; side-by-side comparison stays here.</p>}
      {!atlasHref&&<p className="head-learning-unavailable"><LearningResourceStatus status="unavailable"/> No exact 3D part is mapped for this annotation.</p>}
      <details onKeyDown={headDisclosureKeyDown}><summary>Comparison limits</summary><p>{scopeNote}</p><p>Same anatomical concept, not spatially registered subjects.</p></details>
    </div>
  </details>;
}
