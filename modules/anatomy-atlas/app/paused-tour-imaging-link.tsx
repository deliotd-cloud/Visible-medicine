'use client';
import {useEffect, useState} from 'react';
import type {PausedTourImaging} from '../lib/paused-tour-imaging';
import './paused-tour-imaging-link.css';

type Snapshot = ReturnType<PausedTourImaging['snapshot']>;

/** A view of the parent-owned, same-page session. This component installs no bridge. */
export function PausedTourImagingLink({link}:{link?:PausedTourImaging}) {
  const [current,setCurrent]=useState<{link:PausedTourImaging;snapshot:Snapshot}|null>(
    ()=>link?{link,snapshot:link.snapshot()}:null,
  );
  useEffect(()=>{
    if(!link)return;
    let live=true;
    const update=()=>{if(live)setCurrent({link,snapshot:link.snapshot()});};
    const unsubscribe=link.subscribe(update);
    // An eligibility change can precede the passive subscription commit.
    // oxlint-disable-next-line react(react-compiler) -- synchronize the external snapshot after subscribing
    update();
    return ()=>{live=false;unsubscribe();};
  },[link]);
  if(!link)return null;
  const state=current?.link===link?current.snapshot:link.snapshot();
  const available=Boolean(state.adapter&&state.eligible);
  const canSend=available&&state.enabled;
  return <section className="paused-tour-imaging-link" aria-label="Tour stop imaging link">
    <p className="paused-tour-imaging-link__heading">Imaging viewer link</p>
    <p className="paused-tour-imaging-link__status">
      {state.adapter?`Connected viewer: ${state.adapter.label}`:'No imaging viewer connected.'}
      {' '}Connection does not mean a study is loaded; the viewer must enable its own link.
    </p>
    <label className="paused-tour-imaging-link__choice">
      <input type="checkbox" checked={canSend} disabled={!available}
        onChange={event=>{
          const latest=link.snapshot();
          if(latest.adapter&&latest.eligible)link.setEnabled(event.currentTarget.checked);
        }} />
      <span>Allow this paused tour stop to link to imaging</span>
    </label>
    <button type="button" className="paused-tour-imaging-link__send" disabled={!canSend}
      onClick={()=>{
        const latest=link.snapshot();
        if(latest.adapter&&latest.eligible&&latest.enabled)link.send();
      }}>Show this stop in imaging</button>
    <output className="paused-tour-imaging-link__notice" aria-live="polite">{state.notice}</output>
    <p className="paused-tour-imaging-link__boundary">This sends source identity and a reference-model centre, not patient coordinates. No spatial alignment or scan transfer. Imaging cases retain separate access. Incoming imaging selections cannot move the tour.</p>
  </section>;
}
