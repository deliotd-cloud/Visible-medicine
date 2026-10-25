'use client';

import {useEffect,useId,useMemo,useRef,useState,type ChangeEvent,type MouseEvent,type KeyboardEvent,type PointerEvent as ReactPointerEvent} from 'react';
import {ImagingAtlasShell} from './ImagingAtlasShell';
import {selectedImagingRegion} from '../lib/atlas-navigation';
import {loadUltrasoundStudy,type LoadedUltrasoundStudy} from '../lib/ultrasound-local-files';
import {pickUltrasoundAnnotation,projectUltrasoundPoint,ultrasoundAtlasLink,ultrasoundLabelAnchor,ultrasoundQuizAnswer,ultrasoundViewWindow,type UltrasoundAnnotation,type UltrasoundFrame,type UltrasoundPoint,type UltrasoundRegion} from '../lib/ultrasound-study';
import {layoutHeadLabels,type HeadLabelAnchor} from '../lib/head-atlas-overlays';
import './ultrasound-local-atlas.css';

type Mode='explore'|'practice';
type Sample={kind:'point';x:number;y:number}|{kind:'ambiguous'|'unavailable'};
const zoomLevels=[1,1.5,2,3,4] as const;

/** A focused polygon must have an unambiguous pixel sample before it can answer. */
function keyboardSample(frame:UltrasoundFrame,annotation:UltrasoundAnnotation):Sample{
 const xs=annotation.polygon.map(point=>point[0]),ys=annotation.polygon.map(point=>point[1]);
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 let overlap=false;
 for(let row=0;row<15;row++)for(let col=0;col<15;col++){
  const x=left+(col+.5)*(right-left)/15,y=top+(row+.5)*(bottom-top)/15;
  const pick=pickUltrasoundAnnotation(frame,x,y);
  if(pick.kind==='match'&&pick.annotation.id===annotation.id)return {kind:'point',x,y};
  if(pick.kind==='ambiguous'&&pick.ids.includes(annotation.id))overlap=true;
 }
 return {kind:overlap?'ambiguous':'unavailable'};
}

export function UltrasoundLocalAtlas({region}:{region?:string|string[]}){
 const selectedRegion=selectedImagingRegion('ultrasound',region);
 const [loaded,setLoaded]=useState<LoadedUltrasoundStudy|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
 const [mode,setMode]=useState<Mode>('explore'),[frameIndex,setFrameIndex]=useState(0);
 const [selectedId,setSelectedId]=useState<string|null>(null),[search,setSearch]=useState('');
 const [showLabels,setShowLabels]=useState(true),[zoomIndex,setZoomIndex]=useState(0);
 const [questionIndex,setQuestionIndex]=useState(0),[feedback,setFeedback]=useState('');
 const [pan,setPan]=useState<UltrasoundPoint>([.5,.5]),imageHint=useId();
 const [viewport,setViewport]=useState({width:0,height:0});
 const drag=useRef<{id:number;x:number;y:number;center:UltrasoundPoint;scaleX:number;scaleY:number;epoch:number;zoom:number;moved:boolean}|null>(null);
 const suppressPointerClick=useRef(false);
 const fileInput=useRef<HTMLInputElement>(null),svg=useRef<SVGSVGElement>(null),imageCanvas=useRef<HTMLDivElement>(null);
 const mounted=useRef(false),generation=useRef(0),viewEpoch=useRef(0);
 const pending=useRef<AbortController|null>(null),active=useRef<LoadedUltrasoundStudy|null>(null);
 const retired=useRef<LoadedUltrasoundStudy[]>([]),regionRef=useRef(selectedRegion.id);

 useEffect(()=>{
  mounted.current=true;
  fileInput.current?.setAttribute('webkitdirectory','');
  fileInput.current?.setAttribute('directory','');
  return ()=>{
   mounted.current=false;generation.current++;viewEpoch.current++;pending.current?.abort();drag.current=null;
   active.current?.dispose();active.current=null;
   for(const old of retired.current)old.dispose();retired.current=[];
  };
 },[]);
 useEffect(()=>{
  if(regionRef.current===selectedRegion.id)return;
  regionRef.current=selectedRegion.id;generation.current++;viewEpoch.current++;
  pending.current?.abort();pending.current=null;active.current?.dispose();active.current=null;
  for(const old of retired.current)old.dispose();retired.current=[];
  setLoaded(null);setLoading(false);setError('');setStatus('Choose a local teaching folder for this region.');
  setMode('explore');setFrameIndex(0);setSelectedId(null);setSearch('');
  setQuestionIndex(0);setFeedback('');setZoomIndex(0);
  setPan([.5,.5]);drag.current=null;suppressPointerClick.current=false;
 },[selectedRegion.id]);
 useEffect(()=>{
  if(!loaded)return;
  for(const old of retired.current)old.dispose();
  retired.current=[];
 },[loaded]);

 function resetTransient(){
  viewEpoch.current++;setSelectedId(null);setQuestionIndex(0);setFeedback('');setZoomIndex(0);setPan([.5,.5]);drag.current=null;suppressPointerClick.current=false;
 }
 async function openFolder(files:File[]){
  if(!files.length)return;
  pending.current?.abort();
  const controller=new AbortController(),request=++generation.current;
  pending.current=controller;resetTransient();setMode('explore');setLoading(true);setError('');
  setStatus('Checking the local manifest and still images. Nothing is uploaded.');
  try{
   const next=await loadUltrasoundStudy(files,{signal:controller.signal,expectedRegion:selectedRegion.id as UltrasoundRegion});
   if(!mounted.current||controller.signal.aborted||request!==generation.current||regionRef.current!==selectedRegion.id){
    next.dispose();return;
   }
   const previous=active.current;active.current=next;
   if(previous)retired.current.push(previous);
   pending.current=null;setLoaded(next);setFrameIndex(0);setSearch('');
   setStatus(`${next.study.frames.length} verified local image${next.study.frames.length===1?'':'s'} opened for draft teaching.`);
  }catch(cause){
   if(!mounted.current||request!==generation.current||controller.signal.aborted)return;
   pending.current=null;
   setError(cause instanceof Error?cause.message:'This local teaching folder could not be opened.');
   setStatus(active.current?'The previous valid study remains available.':'No study was opened.');
  }finally{
   if(mounted.current&&request===generation.current)setLoading(false);
  }
 }
 function closeFolder(){
  generation.current++;resetTransient();pending.current?.abort();pending.current=null;
  active.current?.dispose();active.current=null;
  for(const old of retired.current)old.dispose();retired.current=[];
  setLoaded(null);setLoading(false);setError('');setStatus('Local teaching folder closed.');
  setMode('explore');setFrameIndex(0);setSearch('');
 }
 function chooseFrame(index:number){
  if(!active.current||!validInteraction()||!Number.isInteger(index)||index===frameIndex||index<0||index>=active.current.study.frames.length)return;
  resetTransient();setFrameIndex(index);setSearch('');
 }
 function chooseMode(next:Mode){
  if(next===mode||!validInteraction())return;
  resetTransient();setMode(next);
 }
 function changeFiles(event:ChangeEvent<HTMLInputElement>){
  const files=Array.from(event.currentTarget.files??[]);
  event.currentTarget.value='';
  void openFolder(files);
 }

 const current=loaded?.study.region===selectedRegion.id?loaded:null;
 const study=current?.study??null;
 const frame=study?.frames[frameIndex]??null;
 const selected=mode==='explore'?frame?.annotations.find(item=>item.id===selectedId)??null:null;
 const target=mode==='practice'&&frame?.annotations.length?frame.annotations[questionIndex%frame.annotations.length]:null;
 const imageUrl=frame?current?.images[frame.image.file]:null;
 const capturedEpoch=viewEpoch.current;
 const capturedSource=current;
 const capturedFrame=frame?.id;
 const validInteraction=()=>mounted.current&&!loading&&!!frame&&!!current&&active.current===capturedSource&&
   frame.id===capturedFrame&&capturedEpoch===viewEpoch.current&&regionRef.current===selectedRegion.id;

 // Scroll images inside the stage without moving the surrounding webpage.
 // Retire the old frame callback synchronously before React commits the next.
 useEffect(()=>{
  const canvas=imageCanvas.current;if(!canvas||!frame||!current||loading)return;
  const wheel=(event:WheelEvent)=>{
   if(event.ctrlKey||event.metaKey)return;
   event.preventDefault();event.stopPropagation();
   if(!validInteraction()||event.deltaY===0)return;
   chooseFrame(Math.max(0,Math.min(study!.frames.length-1,frameIndex+(event.deltaY>0?1:-1))));
  };
  canvas.addEventListener('wheel',wheel,{passive:false});
  return()=>canvas.removeEventListener('wheel',wheel);
 },[current,frame,frameIndex,loading,capturedEpoch,selectedRegion.id]);

 function pickAt(x:number,y:number){
  if(!validInteraction()||!frame)return;
  if(mode==='practice'){
   if(!target)return;
   const answer=ultrasoundQuizAnswer(frame,target.id,x,y);
   setFeedback(answer==='correct'?'Correct — this area matches the requested annotation ID.':
    answer==='incorrect'?'That is another annotated area. Try again.':
    answer==='ambiguous'?'Overlapping annotations are ambiguous here. Choose a different point.':
    answer==='outside'?'No single annotation is mapped at that point. Try again.':
    'This question is unavailable for the current image.');
   return;
  }
  const pick=pickUltrasoundAnnotation(frame,x,y);
  if(pick.kind==='match'){setSelectedId(pick.annotation.id);setFeedback('');}
  else {setSelectedId(null);setFeedback(pick.kind==='ambiguous'?'Overlapping annotations are ambiguous here. Choose a different point.':'No annotation at that point.');}
 }
 function pointerPick(event:MouseEvent<SVGSVGElement>){
  if(suppressPointerClick.current){suppressPointerClick.current=false;return;}
  const element=svg.current,matrix=element?.getScreenCTM();
  if(!element||!matrix||!frame||!validInteraction())return;
  const point=element.createSVGPoint();
  point.x=event.clientX;point.y=event.clientY;
  const native=point.matrixTransform(matrix.inverse());
  pickAt(native.x/frame.image.width,native.y/frame.image.height);
 }
 function keyboardPick(event:KeyboardEvent<SVGPolygonElement>,annotation:UltrasoundAnnotation){
  if(event.key!=='Enter'&&event.key!==' ')return;
  event.preventDefault();event.stopPropagation();
  if(!frame||!validInteraction())return;
  const sample=keyboardSample(frame,annotation);
  if(sample.kind==='point')pickAt(sample.x,sample.y);
  else setFeedback(sample.kind==='ambiguous'?'Overlapping annotations are ambiguous here. Use another area or point.':'This area has no unambiguous selectable point.');
 }
 const zoom=zoomLevels[zoomIndex];
 const width=frame?.image.width??1,height=frame?.image.height??1;
 const imageWindow=ultrasoundViewWindow(zoom,pan);
 const viewBox=`${imageWindow.x*width} ${imageWindow.y*height} ${imageWindow.width*width} ${imageWindow.height*height}`;
 const anchors=useMemo(()=>new Map(frame?.annotations.map(annotation=>[annotation.id,ultrasoundLabelAnchor(annotation)])??[]),[frame]);
 useEffect(()=>{
  const element=svg.current;
  if(!element||!current||!frame){setViewport({width:0,height:0});return;}
  let disposed=false;
  const measure=()=>{
   if(disposed||svg.current!==element||active.current!==current)return;
   const rect=element.getBoundingClientRect();
   setViewport(previous=>previous.width===rect.width&&previous.height===rect.height?previous:{width:rect.width,height:rect.height});
  };
  measure();
  const observer=new ResizeObserver(measure);observer.observe(element);
  return()=>{disposed=true;observer.disconnect();};
 },[current,frame]);
 const callouts=useMemo(()=>{
  const visible:HeadLabelAnchor[]=[];
  if(mode==='explore'&&showLabels&&frame)for(const annotation of frame.annotations){
   const anchor=anchors.get(annotation.id);
   const point=anchor?projectUltrasoundPoint(anchor,frame.image,viewport,zoom,pan):null;
   if(point)visible.push({id:annotation.id,text:annotation.label,...point,selected:annotation.id===selectedId});
  }
  return layoutHeadLabels(visible,viewport.width,viewport.height);
 },[mode,showLabels,frame,anchors,viewport,zoom,pan,selectedId]);
 const centerOn=(point:UltrasoundPoint)=>{const next=ultrasoundViewWindow(zoom,point);setPan([next.x+next.width/2,next.y+next.height/2]);};
 function pointerDown(event:ReactPointerEvent<SVGSVGElement>){
  if(event.button!==0||!validInteraction())return;suppressPointerClick.current=false;
  const rect=event.currentTarget.getBoundingClientRect(),scale=Math.min(rect.width/(imageWindow.width*width),rect.height/(imageWindow.height*height));if(!(scale>0))return;
  drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,center:[imageWindow.x+imageWindow.width/2,imageWindow.y+imageWindow.height/2],scaleX:scale*width,scaleY:scale*height,epoch:capturedEpoch,zoom,moved:false};
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function pointerMove(event:ReactPointerEvent<SVGSVGElement>){
  const start=drag.current;if(!start||start.id!==event.pointerId||start.epoch!==capturedEpoch||start.zoom!==zoom||!validInteraction())return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.hypot(dx,dy)>4){start.moved=true;suppressPointerClick.current=true;}
  if(start.moved&&zoom>1){event.preventDefault();centerOn([start.center[0]-dx/start.scaleX,start.center[1]-dy/start.scaleY]);}
 }
 function pointerEnd(event:ReactPointerEvent<SVGSVGElement>){
  const start=drag.current;if(!start||start.id!==event.pointerId)return;drag.current=null;
  if(start.moved)suppressPointerClick.current=true;
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 }
 function keyboardPan(event:KeyboardEvent<SVGSVGElement>){
  const delta:Record<string,UltrasoundPoint>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},direction=delta[event.key];
  if(!direction||event.altKey||event.ctrlKey||event.metaKey||!validInteraction()||zoom===1)return;
  event.preventDefault();event.stopPropagation();centerOn([imageWindow.x+imageWindow.width/2+direction[0]*imageWindow.width*.15,imageWindow.y+imageWindow.height/2+direction[1]*imageWindow.height*.15]);
 }
 const filtered=frame?.annotations.filter(item=>item.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))??[];
 const link=study&&selected?ultrasoundAtlasLink(study,selected):null;

 return <ImagingAtlasShell
  title={`Ultrasound · ${selectedRegion.label}`} modality="ultrasound" regionId={selectedRegion.id}
  subtitle="Local still-image anatomy teaching preview"
  notice={<p>Choose a local ultrasound teaching folder. Draft pixel annotations are unreviewed; no diagnostic use, upload, saved answers or image-to-model registration.</p>}
  actions={<>
   <label className="us-local-folder-label">Open local teaching folder
    <input ref={fileInput} type="file" multiple accept=".json,.png,.jpg,.jpeg" onChange={changeFiles} aria-label="Choose a local ultrasound teaching folder"/>
   </label>
   {study&&<button type="button" onClick={closeFolder}>Close folder</button>}
  </>}
  sidebar={<div className="us-local-index">
   <h2>Structure search</h2>
   {study&&frame?<><p className="us-local-study-title">{study.title}</p>
    {mode==='explore'?<><label>Find an annotation<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search this image" disabled={loading}/></label>
     <ul>{filtered.map(item=><li key={item.id}><button type="button" disabled={loading} aria-current={selectedId===item.id?'true':undefined} onClick={()=>{if(validInteraction()){setSelectedId(item.id);setFeedback('');}}}>{item.label}</button></li>)}</ul>
     {!filtered.length&&<p>No matching annotations on this image.</p>}</>
    :<p>Labels and the structure index are hidden in Practice. Select an outlined area on the image.</p>}
   </>:<p>Open a local teaching folder to search its annotations. No example images are bundled here.</p>}
  </div>}
  toolbar={<div className="us-local-toolbar">
   <div className="us-local-toolbar-group" role="group" aria-label="Teaching mode">
    <button type="button" aria-pressed={mode==='explore'} onClick={()=>chooseMode('explore')} disabled={!study||loading}>Explore</button>
    <button type="button" aria-pressed={mode==='practice'} onClick={()=>chooseMode('practice')} disabled={!study||loading}>Practice</button>
   </div>
   <label>Image <select value={frameIndex} disabled={!study||loading} onChange={event=>chooseFrame(Number(event.target.value))}>
    {study?.frames.map((item,index)=><option key={item.id} value={index}>{item.title}</option>)??<option value={0}>No local image</option>}
   </select></label>
   <div className="us-local-toolbar-group" role="group" aria-label="Image navigation">
    <button type="button" disabled={!study||loading||frameIndex===0} onClick={()=>chooseFrame(frameIndex-1)}>Previous</button>
    <button type="button" disabled={!study||loading||frameIndex===study.frames.length-1} onClick={()=>chooseFrame(frameIndex+1)}>Next</button>
   </div>
   <button type="button" aria-pressed={showLabels&&mode==='explore'} disabled={!frame||mode==='practice'||loading} onClick={()=>setShowLabels(value=>!value)}>{showLabels&&mode==='explore'?'Hide labels':'Show labels'}</button>
   <div className="us-local-toolbar-group" role="group" aria-label="Image zoom">
    <button type="button" aria-label="Zoom out" disabled={!frame||zoomIndex===0} onClick={()=>setZoomIndex(value=>Math.max(0,value-1))}>−</button>
    <button type="button" aria-label="Zoom in" disabled={!frame||zoomIndex===zoomLevels.length-1} onClick={()=>setZoomIndex(value=>Math.min(zoomLevels.length-1,value+1))}>+</button>
    <button type="button" disabled={!frame||zoomIndex===0} onClick={()=>{setZoomIndex(0);setPan([.5,.5]);}}>Fit</button>
    <span>{Math.round(zoom*100)}%</span>
   </div>
  </div>}
  infoLabel="Ultrasound teaching notes"
  info={<div className="us-local-info">
   <p className="us-local-kicker">Local draft · read-only</p>
   <h2>{frame?.title??selectedRegion.label}</h2>
   {frame?<><p><strong>Orientation:</strong> {frame.orientationNote}</p><p>Image {frameIndex+1} of {study!.frames.length}. Annotations are author-declared and unreviewed.</p>
    {mode==='explore'?(selected?<section aria-label="Selected annotation"><h3>{selected.label}</h3>{selected.notes.length?<ul>{selected.notes.map((note,index)=><li key={index}>{note}</li>)}</ul>:<p>No teaching notes were supplied for this annotation.</p>}
      {link?<><a href={link.atlasHref} target="_blank" rel="noopener noreferrer">Open exact source-bound 3D reference in a new tab</a><p>{link.scopeNote} Separate subjects; no spatial registration or shared access entitlement.</p></>:<p>No current exact 3D source link is available for this annotation.</p>}</section>:<p>Select an annotation to inspect its declared notes.</p>)
    :<p>Practice hides structure labels and notes. No answer or progress is saved.</p>}
   </>:<p>Only images selected from a validated local folder appear here.</p>}
   {study&&<details><summary>Declared provenance and limits</summary><dl>
    <dt>Author</dt><dd>{study.source.author}</dd><dt>License declaration</dt><dd>{study.source.license} · declared by the folder author, not independently cleared</dd>
    <dt>Attribution</dt><dd>{study.source.attribution}</dd><dt>Manifest SHA-256</dt><dd><code>{current?.revision}</code></dd>
   </dl>{study.source.url&&<p><a href={study.source.url} target="_blank" rel="noopener noreferrer">Declared source website (new tab)</a></p>}
    <p>This local preview does not confirm clinical approval, permissions, diagnosis or image-to-model registration.</p>
   </details>}
  </div>}
 >
  <div className="us-local-stage">
   {error&&<p className="us-local-error" role="alert">{error}</p>}
   {status&&<p className="us-local-status" role="status">{status}</p>}
   {loading&&<p className="us-local-loading">Verifying local files…</p>}
   {frame&&imageUrl?<><div className="us-local-canvas" ref={imageCanvas}>
    <svg ref={svg} className={`us-local-svg${zoom>1?' is-zoomed':''}`} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" onClick={pointerPick} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={()=>{drag.current=null;}} onKeyDown={keyboardPan} tabIndex={0} aria-describedby={imageHint} role="group" aria-label={mode==='practice'?'Ultrasound practice image with numbered selectable areas':'Ultrasound image with selectable annotations'}>
     <image href={imageUrl} x={0} y={0} width={width} height={height} preserveAspectRatio="none" aria-hidden="true"/>
     {frame.annotations.map((item,index)=>{
      const points=item.polygon.map(point=>`${point[0]*width},${point[1]*height}`).join(' ');
      const anchor=anchors.get(item.id);
      return <g key={item.id}>
       <polygon points={points} className={`us-local-polygon${selectedId===item.id&&mode==='explore'?' is-selected':''}`} tabIndex={0} role="button" aria-label={mode==='practice'?`Area ${index+1}`:`Select ${item.label}`} onKeyDown={event=>keyboardPick(event,item)} onFocus={event=>{
        if(!anchor||zoom===1||!validInteraction()||!event.currentTarget.matches(':focus-visible'))return;
        if(anchor[0]<imageWindow.x||anchor[0]>imageWindow.x+imageWindow.width||anchor[1]<imageWindow.y||anchor[1]>imageWindow.y+imageWindow.height)centerOn(anchor);
       }}/>
      </g>;
     })}
    </svg>
    {mode==='explore'&&showLabels&&viewport.width>0&&viewport.height>0&&<svg className="us-local-callouts" viewBox={`0 0 ${viewport.width} ${viewport.height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
     {callouts.labels.map((label,index)=>{
      const left=label.x<viewport.width/2,edge=left?label.boxX+label.boxWidth:label.boxX;
      const clip=`${imageHint}-callout-${index}`,limit=Math.max(4,Math.floor((label.boxWidth-16)/7));
      return <g key={label.id} className={label.selected?'is-selected':undefined}>
       <path d={`M ${label.x} ${label.y} L ${edge} ${label.boxY+label.boxHeight/2}`}/>
       <circle cx={label.x} cy={label.y} r={2.5}/>
       <rect x={label.boxX} y={label.boxY} width={label.boxWidth} height={label.boxHeight} rx={4}/>
       <defs><clipPath id={clip}><rect x={label.boxX+8} y={label.boxY} width={Math.max(0,label.boxWidth-16)} height={label.boxHeight}/></clipPath></defs>
       <text x={label.boxX+8} y={label.boxY+label.boxHeight/2} dominantBaseline="central" clipPath={`url(#${clip})`}>{label.text.length>limit?label.text.slice(0,limit-1)+'…':label.text}</text>
      </g>;
     })}
     {callouts.omitted>0&&<text className="us-local-callout-omitted" x={viewport.width/2} y={viewport.height-9} textAnchor="middle">{callouts.omitted} more visible labels · use structure search</text>}
    </svg>}
   </div>
    <p id={imageHint} className="us-local-image-hint">Zoom, then drag or use arrow keys to pan. Wheel moves between images.</p>
    {mode==='practice'&&target&&<div className="us-local-question">
     <p>Find: <strong>{target.label}</strong></p>
     <button type="button" disabled={loading} onClick={()=>{if(!validInteraction()||mode!=='practice')return;viewEpoch.current++;drag.current=null;suppressPointerClick.current=false;setQuestionIndex(value=>value+1);setFeedback('');setSelectedId(null);setZoomIndex(0);setPan([.5,.5]);}}>Next question</button>
    </div>}
    {mode==='practice'&&!target&&<p className="us-local-empty">This image has no annotations to practise.</p>}
    {feedback&&<p className="us-local-feedback" role="status" aria-live="polite">{feedback}</p>}
   </>:<div className="us-local-empty"><h2>Open a local teaching folder</h2><p>Select a folder containing ultrasound-atlas.json and its still PNG or JPEG images. The folder stays on this device.</p></div>}
  </div>
 </ImagingAtlasShell>;
}
