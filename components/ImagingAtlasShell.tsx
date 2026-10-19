'use client';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {AtlasWorkspaceNavigation} from './AtlasWorkspaceNavigation';
import {ImagingPaneNavigation} from './ImagingPaneNavigation';
import {type AtlasModalityId} from '../lib/atlas-navigation';
import {type HeadImageNavigationContext} from '../lib/head-atlas-navigation';
import {type ImagingPane} from '../lib/imaging-pane-focus';
import './imaging-atlas-shell.css';

export type ImagingAtlasShellProps = {
  title: string;
  modality: Exclude<AtlasModalityId,'3d'>;
  regionId: string;
  subtitle?: string;
  notice: ReactNode;
  actions?: ReactNode;
  sidebar: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  info: ReactNode;
  infoLabel?: string;
  headNavigation?: HeadImageNavigationContext;
  comparison?: ReactNode;
  canFocusImages?: boolean;
  imageFocusContext?: object|null;
};

export function ImagingAtlasShell({title,modality,regionId,subtitle,notice,actions,sidebar,toolbar,children,info,infoLabel='Structure information',headNavigation,comparison,canFocusImages=false,imageFocusContext=null}:ImagingAtlasShellProps){
  const workspace=useRef<HTMLElement>(null),[fullscreen,setFullscreen]=useState(false),[fullscreenError,setFullscreenError]=useState('');
  const [focusedContext,setFocusedContext]=useState<object|null>(null);
  const pendingPane=useRef<{origin:HTMLElement;focus:()=>void;context:object;token:number}|null>(null);
  const paneToken=useRef(0);
  const committedRender=useRef<object|null>(null);
  const renderIdentity={};
  const focusAvailable=canFocusImages&&imageFocusContext!==null&&!comparison;
  const imagesFocused=focusAvailable&&focusedContext===imageFocusContext;
  useLayoutEffect(()=>{committedRender.current=renderIdentity;});
  useLayoutEffect(()=>()=>{
    committedRender.current=null;
    pendingPane.current=null;
    paneToken.current++;
  },[]);
  useLayoutEffect(()=>{
    if(focusedContext!==null&&(!focusAvailable||focusedContext!==imageFocusContext))setFocusedContext(null);
    if(pendingPane.current&&(!focusAvailable||pendingPane.current.context!==imageFocusContext))pendingPane.current=null;
  },[focusAvailable,focusedContext,imageFocusContext]);
  useLayoutEffect(()=>{
    const request=pendingPane.current;
    if(!request||imagesFocused||!focusAvailable||request.context!==imageFocusContext)return;
    pendingPane.current=null;
    if(request.token===paneToken.current&&request.origin.isConnected)request.focus();
  },[imagesFocused,focusAvailable,imageFocusContext,focusedContext]);
  function navigatePane(origin:HTMLElement,pane:ImagingPane,focus:()=>void){
    if(committedRender.current!==renderIdentity)return;
    paneToken.current++;
    pendingPane.current=null;
    if(pane!=='image'&&imagesFocused&&imageFocusContext){
      pendingPane.current={origin,focus,context:imageFocusContext,token:paneToken.current};
      setFocusedContext(null);
      return;
    }
    focus();
  }
  function toggleImageFocus(){
    if(committedRender.current!==renderIdentity||!focusAvailable)return;
    paneToken.current++;
    pendingPane.current=null;
    setFocusedContext(imagesFocused?null:imageFocusContext);
  }
  useEffect(()=>{const update=()=>setFullscreen(document.fullscreenElement===workspace.current);document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
  async function expandWorkspace(){try{setFullscreenError('');if(document.fullscreenElement===workspace.current)await document.exitFullscreen();else if(workspace.current?.requestFullscreen)await workspace.current.requestFullscreen();else setFullscreenError('Full-screen mode is unavailable in this browser.');}catch{setFullscreenError('Full-screen mode could not open. The comparison remains available here.');}}
  return <main ref={workspace} className="imaging-workspace-page">
    <ImagingPaneNavigation infoLabel={infoLabel} onPaneRequest={navigatePane}/>
    <header className="imaging-workspace-titlebar">
      <div className="imaging-workspace-heading">
        <nav aria-label="Breadcrumb"><Link href="/atlas">Atlas</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
        <h1>{title}</h1>
        {subtitle&&<p>{subtitle}</p>}
      </div>
      {(actions||focusAvailable)&&<div className="imaging-workspace-actions">{actions}{focusAvailable&&<button type="button" className="imaging-image-focus-toggle" aria-pressed={imagesFocused} onClick={toggleImageFocus}>{imagesFocused?'Restore panels':'Focus images'}</button>}</div>}
    </header>
    <AtlasWorkspaceNavigation modality={modality} regionId={regionId} headNavigation={headNavigation}/>
    <div className="imaging-workspace-notice"><span className="imaging-workspace-use">Education only · no diagnostic use · review pending</span><div>{notice}</div><details className="imaging-workspace-disclosure"><summary>Navigation &amp; limitations</summary><p>Browsing another modality or 3D region does not carry image focus or spatial registration. Only a verified, revision-bound CT/MRI head link can retain learning context. Atlas, cases and lectures have separate access.</p></details></div>
    <div className={`imaging-workspace-grid${comparison?' has-reference-comparison':''}${imagesFocused?' is-image-focused':''}`}>
      <aside className="imaging-workspace-sidebar" aria-label="Anatomy index" data-imaging-pane="index" tabIndex={-1} hidden={imagesFocused}>{sidebar}</aside>
      <section className="imaging-workspace-viewer" aria-label="Image viewer" data-imaging-pane="image" tabIndex={-1}>
        {(comparison||fullscreen)&&<div className="imaging-comparison-expand"><button type="button" onClick={()=>void expandWorkspace()}>{fullscreen?'Exit full screen':'Expand workspace'}</button>{fullscreen&&<span>Esc to exit</span>}{fullscreenError&&<span role="status">{fullscreenError}</span>}</div>}
        {toolbar&&<div className="imaging-workspace-toolbar">{toolbar}</div>}
        <div className="imaging-workspace-stage">{children}</div>
      </section>
      <aside className="imaging-workspace-info" aria-label={infoLabel} data-imaging-pane="learning" tabIndex={-1} hidden={imagesFocused}>{comparison?<>{comparison}<details className="imaging-comparison-learning"><summary>Structure &amp; learning</summary>{info}</details></>:info}</aside>
    </div>
  </main>;
}
