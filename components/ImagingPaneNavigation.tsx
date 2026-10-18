'use client';

import {focusImagingPane, type ImagingPane} from '../lib/imaging-pane-focus';

/** Keyboard-only disclosure avoids adding another permanent viewer toolbar. */
export function ImagingPaneNavigation({infoLabel,onPaneRequest}: {infoLabel: string;onPaneRequest?: (origin: HTMLElement,pane: ImagingPane,focus:()=>void) => void}) {
  const destinations: Array<{pane: ImagingPane; label: string}> = [
    {pane: 'image', label: 'Skip to image viewer'},
    {pane: 'learning', label: `Skip to ${infoLabel.toLowerCase()}`},
    {pane: 'index', label: 'Skip to anatomy index'},
  ];
  return <nav className="imaging-pane-navigation" aria-label="Imaging workspace shortcuts">
    {destinations.map(({pane, label}) => <button key={pane} type="button" onClick={event => {
      const origin=event.currentTarget;
      const focus=()=>{focusImagingPane(origin,pane);};
      if(onPaneRequest)onPaneRequest(origin,pane,focus);else focus();
    }}>{label}</button>)}
  </nav>;
}
