'use client';
import type {ReactNode} from 'react';

/** Reveal only the selected target's disclosure and ancestors, retaining live form nodes. */
function openReviewTarget(origin:HTMLElement,id:string,section=false){
  const main=origin.closest('main'),target=origin.ownerDocument.getElementById(id);
  if(!main||!target||!main.contains(target))return false;
  let inspection=target;
  if(section&&target.tagName==='SECTION'){
    const disclosures=Array.from(target.children).filter(node=>node.tagName==='DETAILS');
    if(disclosures.length===1)inspection=disclosures[0] as HTMLElement;
  }
  for(let node:HTMLElement|null=inspection;node&&main.contains(node);node=node.parentElement){
    if(node.tagName==='DETAILS')(node as HTMLDetailsElement).open=true;
  }
  const focusTarget=inspection.tagName==='DETAILS'
    ?inspection.querySelector<HTMLElement>(':scope > summary')??inspection
    :inspection.querySelector<HTMLElement>(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')??inspection;
  if(focusTarget.tagName!=='SUMMARY'&&!focusTarget.hasAttribute('tabindex'))focusTarget.setAttribute('tabindex','-1');
  focusTarget.focus({preventScroll:true});
  inspection.scrollIntoView({block:'start',behavior:'instant'});
  return true;
}

/** Fragment links retain native fallback; normal activation opens the matching section in place. */
export function HeadTeachingReviewSections({children}:{children:ReactNode}){
  return <nav aria-label="Head review sections" onClick={event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const clicked=event.target as Element;
    const anchor=typeof clicked.closest==='function'?clicked.closest('a[href^="#"]'):null;
    if(!anchor||!event.currentTarget.contains(anchor)||anchor.hasAttribute('download')||
      (anchor.getAttribute('target')&&anchor.getAttribute('target')!=='_self'))return;
    const href=anchor.getAttribute('href');if(!href||href==='#')return;
    let id:string;try{id=decodeURIComponent(href.slice(1));}catch{return;}
    if(openReviewTarget(event.currentTarget,id,true))event.preventDefault();
  }}>{children}</nav>;
}

/** In-page navigation only. Never reload, rebase or save the private review form. */
export function HeadTeachingReviewNavigator({targets}:{targets:readonly {id:string;label:string}[]}){
  return <form className="head-review-navigator" onSubmit={event=>{
    event.preventDefault();
    const form=event.currentTarget,main=form.closest('main');
    const choice=form.elements.namedItem('head-review-target') as HTMLSelectElement|null;
    const selected=targets.find(target=>target.id===choice?.value);
    if(!main||!selected)return;
    openReviewTarget(form,selected.id);
  }}>
    <label><span>Review item</span><select name="head-review-target" defaultValue="" required>
      <option value="" disabled>Choose a review item</option>
      {targets.map(target=><option key={target.id} value={target.id}>{target.label}</option>)}
    </select></label>
    <button type="submit">Open item</button>
  </form>;
}
