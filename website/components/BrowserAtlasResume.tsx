'use client';
import {useEffect,useRef,useState} from 'react';
import type {BrowserAtlasResumeState} from '../lib/browser-atlas-resume';
import './browser-atlas-resume.css';

// Mirrored storage names let the empty state avoid importing the head catalogue.
// The resolver exports the canonical constants and tests assert they stay aligned.
const bookmarkKey='vm.head-learning-bookmark.v1';
const planKey='vm.head-study-plan.v1';
const bookmarkChanged='vm-head-learning-bookmark-changed';
type View={phase:'checking'|'blocked'|'ready';data?:BrowserAtlasResumeState};

/** A browser-local read-only summary; the account remains the page's access boundary. */
export function BrowserAtlasResume(){
  const [view,setView]=useState<View>({phase:'checking'});
  const generation=useRef(0);
  const retry=useRef<()=>void>(()=>{});
  useEffect(()=>{
    let live=true;
    async function refresh(){
      const current=++generation.current;
      let bookmarkRaw:string|null,planRaw:string|null;
      try{
        bookmarkRaw=window.localStorage.getItem(bookmarkKey);
        planRaw=window.localStorage.getItem(planKey);
      }catch{if(live&&current===generation.current)setView({phase:'blocked'});return;}
      if(bookmarkRaw===null&&planRaw===null){
        if(live&&current===generation.current)setView({phase:'ready',data:{tour:{kind:'empty'},plan:{kind:'empty'}}});
        return;
      }
      try{
        const resolver=await import('../lib/browser-atlas-resume');
        if(!live||current!==generation.current)return;
        // A late import must not publish a value superseded by another tab.
        const latestBookmark=window.localStorage.getItem(bookmarkKey);
        const latestPlan=window.localStorage.getItem(planKey);
        if(latestBookmark!==bookmarkRaw||latestPlan!==planRaw){void refresh();return;}
        setView({phase:'ready',data:resolver.resolveBrowserAtlasResume(bookmarkRaw,planRaw)});
      }catch{if(live&&current===generation.current)setView({phase:'blocked'});}
    }
    const storage=(event:StorageEvent)=>{if(event.key===null||event.key===bookmarkKey||event.key===planKey)void refresh();};
    const visible=()=>{if(document.visibilityState==='visible')void refresh();};
    retry.current=()=>{setView({phase:'checking'});void refresh();};
    void refresh();
    window.addEventListener('storage',storage);
    window.addEventListener(bookmarkChanged,refresh);
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',visible);
    return()=>{live=false;generation.current++;retry.current=()=>{};window.removeEventListener('storage',storage);
      window.removeEventListener(bookmarkChanged,refresh);window.removeEventListener('focus',refresh);
      document.removeEventListener('visibilitychange',visible);};
  },[]);
  const tour=view.data?.tour,plan=view.data?.plan;
  return <section id="browser-atlas-resume" className="browser-atlas-resume" aria-labelledby="browser-atlas-resume-title">
    <div className="browser-atlas-resume-heading"><div><h2 id="browser-atlas-resume-title">Atlas saved in this browser</h2></div></div>
    <p className="browser-atlas-resume-note">Saved on this browser, separate from account progress. Others using this device can see these choices. Existing Atlas access checks still apply.</p>
    {view.phase==='checking'?<p>Checking this browser’s saved Atlas choices…</p>:
     view.phase==='blocked'?<p role="status">Saved Atlas choices could not load. Browser storage may be unavailable. <button type="button" onClick={()=>retry.current()}>Try again</button> or <a href="/atlas/guided-learning?region=head-neck">open guided learning</a>.</p>:
     <div className="browser-atlas-resume-grid">
       <div><h3>Saved tour step</h3>{tour?.kind==='ready'?<>
         <p><strong>{tour.sequenceLabel}</strong><br/>Step {tour.step} / {tour.total} · {tour.label}</p>
         <nav aria-label="Open saved Atlas tour step">
           {tour.links?.atlasHref&&<a href={tour.links.atlasHref}>3D Atlas</a>}
           {tour.links?.ctHref&&<a href={tour.links.ctHref}>CT head</a>}
           {tour.links?.mriHref&&<a href={tour.links.mriHref}>MRI head</a>}
         </nav></>:tour?.kind==='unavailable'?<p>This saved tour step is outdated or invalid and cannot be resumed.</p>:
         <p>No tour step saved. <a href="/atlas/guided-learning?region=head-neck">Open guided learning</a> and save a step in a linked head tour.</p>}</div>
       <div><h3>Saved study plan</h3>{plan?.kind==='ready'?<>
         <p>{plan.count} mapped anatomy {plan.count===1?'concept':'concepts'} saved.</p>
         <nav aria-label="Open Atlas to restore a saved study plan"><a href="/atlas/ct-head">CT head</a><a href="/atlas/mri-head">MRI head</a></nav>
         <p>In a viewer, open <strong>My study set</strong>, then <strong>Save or restore a plan</strong> to add available matches. Opening a link does not restore the plan.</p>
       </>:plan?.kind==='unavailable'?<p>This saved plan is outdated or invalid and cannot be restored.</p>:
         <p>No plan saved. Build a study set in the CT or MRI atlas, then use Save or restore a plan.</p>}</div>
     </div>}
    <p className="browser-atlas-resume-boundary">CT and MRI use separate subjects. Links do not transfer scans or scores or establish matched coordinates.</p>
  </section>;
}
