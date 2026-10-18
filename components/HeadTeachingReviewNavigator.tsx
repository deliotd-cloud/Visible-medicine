'use client';

/** In-page navigation only. Never reload, rebase or save the private review form. */
export function HeadTeachingReviewNavigator({targets}:{targets:readonly {id:string;label:string}[]}){
  return <form className="head-review-navigator" onSubmit={event=>{
    event.preventDefault();
    const form=event.currentTarget,main=form.closest('main');
    const choice=form.elements.namedItem('head-review-target') as HTMLSelectElement|null;
    const selected=targets.find(target=>target.id===choice?.value);
    if(!main||!selected)return;
    const target=form.ownerDocument.getElementById(selected.id);
    if(!target||!main.contains(target)||target.tagName!=='DETAILS')return;
    for(let node:HTMLElement|null=target;node&&main.contains(node);node=node.parentElement){
      if(node.tagName==='DETAILS')(node as HTMLDetailsElement).open=true;
    }
    target.querySelector<HTMLElement>(':scope > summary')?.focus();
    target.scrollIntoView({block:'start',behavior:'instant'});
  }}>
    <label><span>Teaching structure</span><select name="head-review-target" defaultValue="" required>
      <option value="" disabled>Choose a structure</option>
      {targets.map(target=><option key={target.id} value={target.id}>{target.label}</option>)}
    </select></label>
    <button type="submit">Open summary</button>
  </form>;
}
