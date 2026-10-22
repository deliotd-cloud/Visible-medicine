"use client";

import {useEffect,useLayoutEffect,useMemo,useRef,useState,type ChangeEvent} from 'react';
import Link from 'next/link';
import {useHeadFolderSession} from './HeadFolderSessionContext';
import {HeadFolderSharing} from './HeadFolderSharing';
import {HeadAtlasSurfaceLoader} from './HeadAtlasSurfaceLoader';
import type {HeadInlinePlaybackStatus} from './HeadAtlasInlineComparison';
import {HeadAtlasInlineComparisonLoader} from './HeadAtlasInlineComparisonLoader';
import {HeadComparisonTour} from './HeadComparisonTour';
import {HeadTourPlayback} from './HeadTourPlayback';
import {openLocalHeadPackage,loadHeadStudy,loadHeadEntry,canReuseHeadMask,HEAD_MANIFEST_SHA256,type LocalHeadPackage,type LoadedStudy,type LoadedEntry,type HeadEntry,type Modality} from '../lib/head-atlas-import';
import {loadHeadOverlayMasks} from '../lib/head-overlay-loading';
import {headStudyLoadingMessage} from '../lib/head-load-progress';
import {type Vec3,type Plane} from '../lib/head-atlas-geometry.mjs';
import {bindSliceWheel} from '../lib/slice-wheel.mjs';
import {ImagingAtlasShell} from './ImagingAtlasShell';
import {HeadAtlasPractice,useHeadAtlasPractice} from './HeadAtlasPractice';
import {canvasVoxel,practiceEntries,shuffled,type PracticeMode} from '../lib/head-atlas-practice';
import {annotationInk,headLabel,headSideLabel,headRepresentationLabel} from '../lib/head-atlas-display';
import {groupHeadOverlays,headOverlayBytes,HEAD_OVERLAY_BYTE_LIMIT,layoutHeadLabels,visibleHeadOverlays,type HeadLabelAnchor} from '../lib/head-atlas-overlays';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links';
import {headImageConcept as headAtlasConcept,resolveHeadImageConcept as resolveHeadConcept} from '../lib/head-image-only-links';
import {HeadAtlasGuidedLearning} from './HeadAtlasGuidedLearning';
import {HeadAtlasRelatedLearning} from './HeadAtlasRelatedLearning';
import {HeadAtlasStudySet} from './HeadAtlasStudySet';
import {appendHeadReviewStudySet} from '../lib/head-review-study-set';
import {HeadAtlasSavedStudyPlan} from './HeadAtlasSavedStudyPlan';
import {createHeadStudyPlan,resolveHeadStudyPlan,type HeadStudyPlan} from '../lib/head-study-plan';
import {headStudySetEntries,toggleHeadStudySet,appendHeadStudySet,moveHeadStudySet,HEAD_STUDY_SET_LIMIT,type HeadStudySet} from '../lib/head-study-set';
import {headStudyComparisons} from '../lib/head-study-comparison';
import {headTourStudyAdditions} from '../lib/head-tour-study-set';
import {headRelatedLearning} from '../lib/head-related-learning';
import {HeadAtlasTeaching} from './HeadAtlasTeaching';
import {LearningResourceStatus,LearningStatusKey} from './LearningResourceStatus.ts';
import {headLearningSteps,type HeadLearningPosition} from '../lib/head-atlas-learning';
import {parseHeadImageNavigation,headImageHref,type HeadImageNavigation} from '../lib/head-atlas-navigation';
import {indexHeadAnatomy,filterHeadAnatomyIndex} from '../lib/head-atlas-index';
import {headPairedEntry} from '../lib/head-atlas-pairs';
import {focusHeadLearningContent} from '../lib/head-atlas-focus';
import {headIndexKey,headIndexTabStop} from '../lib/head-index-keyboard';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard';
import {headMaskHits} from '../lib/head-mask-picking';
import {headSliceKey,headSliceNumber} from '../lib/head-atlas-slice-controls';
import {headSliceViewport,zoomHeadSliceViewport,fitHeadMaskViewport,nearestHeadMaskSlice} from '../lib/head-slice-viewport';
import {bindHeadWindowDrag} from '../lib/head-window-drag';
import {headViewHistory,type HeadHistoryScope,type HeadHistoryView} from '../lib/head-view-history.ts';
import HeadSlicePlayback from './HeadSlicePlayback';
import './head-atlas.css';
import './head-structure-learning.css';

const planes:Plane[]=['axial','coronal','sagittal'];
const familyNames:Record<string,string>={ctx:'Cerebral cortex',cer:'Cerebellum',bst:'Brainstem',vnt:'Ventricles & CSF',dgm:'Deep grey matter',wmt:'White matter',cis:'Cisterns',men:'Meninges',orb:'Orbits',sns:'Sinuses',ear:'Ear',skl:'Skull',sel:'Sellar region',fac:'Face',sft:'Soft tissues',nck:'Neck',vas:'Vessels'};
const clamp=(v:number,max:number)=>Math.max(0,Math.min(max,Math.round(v)));
const initialWindow=(modality:Modality,range:readonly number[]):[number,number]=>modality==='CT'?[40,80]:[(range[0]+range[1])/2,Math.max(1,range[1]-range[0])];
function focusIJK(study:LoadedStudy,ras:Vec3):Vec3{return study.geometry.rasToIjk(ras).map((v,i)=>clamp(v,study.geometry.shapeKJI[2-i]-1)) as Vec3;}

export function NativeSlice({plane,study,selected,layers,groupLabels,opacity,layerOpacity,cursor,windowing,onWindowing,overlay,regionalCourse,showCrosshair,onKeyboardMove,onCursor,onExpand,expanded,showName=true,quizPick,onAnswer,onSelectMask,viewResetVersion=0,allowPlayback=false}:{allowPlayback?:boolean;viewResetVersion?:number;plane:Plane;study:LoadedStudy;selected:LoadedEntry|null;layers:LoadedEntry[];groupLabels:boolean;opacity:number;layerOpacity:Record<string,number>;cursor:Vec3;windowing:[number,number];onWindowing?:(value:[number,number])=>void;overlay:boolean;regionalCourse:boolean;showCrosshair:boolean;onKeyboardMove?:()=>void;onCursor:(point:Vec3)=>void;onExpand?:()=>void;expanded:boolean;showName?:boolean;quizPick?:Vec3|null;onAnswer?:(point:Vec3)=>void;onSelectMask?:(entry:HeadEntry)=>void}){
  const canvasRef=useRef<HTMLCanvasElement>(null),annotationRef=useRef<HTMLCanvasElement>(null),areaRef=useRef<HTMLDivElement>(null);
  const sectionRef=useRef<HTMLElement>(null);
  const liveCursor=useRef(cursor);liveCursor.current=cursor;
  const liveWindow=useRef(windowing);liveWindow.current=windowing;
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas||!onWindowing)return;
    return bindHeadWindowDrag(canvas,{getWindow:()=>liveWindow.current,onChange:onWindowing});
  },[study,plane,onWindowing,viewResetVersion]);
  const [fit,setFit]=useState({width:320,height:300});
  const [keyboardMoved,setKeyboardMoved]=useState(false);
  const [viewState,setViewState]=useState({zoom:1,pan:{x:0,y:0}}),[panMode,setPanMode]=useState(false);
  const [maskNotice,setMaskNotice]=useState<{text:string;slice:number;study:LoadedStudy;selected:LoadedEntry|null;plane:Plane}|null>(null);
  const [sliceDraft,setSliceDraft]=useState<{text:string;invalid:boolean;study:LoadedStudy;plane:Plane;slice:number}|null>(null);
  const drag=useRef<{pointerId:number;x:number;y:number;panX:number;panY:number}|null>(null);
  const rasterRef=useRef<{inputs:unknown[];anchors:HeadLabelAnchor[];colours:Map<string,number[]>;anchorX:number;anchorY:number}|null>(null);
  const view=study.geometry.views[plane],slice=cursor[view.fixedAxisIJK];
  const choiceRef=useRef<HTMLDivElement>(null);
  const [maskChoice,setMaskChoice]=useState<{study:LoadedStudy;selected:LoadedEntry|null;plane:Plane;point:Vec3;layers:LoadedEntry[];opacity:number;layerOpacity:Record<string,number>;reset:number;hits:LoadedEntry[]}|null>(null);
  const canPick=!!onSelectMask&&showName&&!onAnswer&&overlay&&!panMode;
  const choiceCurrent=!!maskChoice&&canPick&&maskChoice.study===study&&maskChoice.selected===selected&&maskChoice.plane===plane&&maskChoice.layers===layers&&maskChoice.opacity===opacity&&maskChoice.layerOpacity===layerOpacity&&maskChoice.reset===viewResetVersion&&maskChoice.point.every((value,index)=>value===cursor[index]);
  useEffect(()=>{if(maskChoice&&!choiceCurrent)setMaskChoice(null);},[maskChoice,choiceCurrent]);
  useEffect(()=>{if(maskChoice&&choiceCurrent)choiceRef.current?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});},[maskChoice,choiceCurrent]);
  const dismissChoice=()=>{setMaskChoice(null);canvasRef.current?.focus({preventScroll:true});};
  const pickMask=(point:Vec3)=>{
    setMaskChoice(null);if(!canPick)return;
    const hits=headMaskHits(study,layers,point,opacity,layerOpacity);
    if(hits.length===1)onSelectMask?.(hits[0].entry);
    else if(hits.length>1)setMaskChoice({study,selected,plane,point:[...point],layers,opacity,layerOpacity,reset:viewResetVersion,hits});
  };
  const currentSliceDraft=sliceDraft?.study===study&&sliceDraft.plane===plane&&sliceDraft.slice===slice?sliceDraft:null;
  useEffect(()=>{setSliceDraft(null);},[study,plane,slice,viewResetVersion]);
  const setMaskFocusNotice=(text:string,targetSlice=slice)=>setMaskNotice(text?{text,slice:targetSlice,study,selected,plane}:null);
  const maskFocusNotice=maskNotice?.study===study&&maskNotice.selected===selected&&maskNotice.plane===plane&&maskNotice.slice===slice?maskNotice.text:'';
  const physicalWidth=view.width*view.pixelSpacing[0],physicalHeight=view.height*view.pixelSpacing[1];
  const viewport=headSliceViewport(fit,{width:physicalWidth,height:physicalHeight},viewState.zoom,viewState.pan);
  const {width:cssWidth,height:cssHeight,left:offsetX,top:offsetY}=viewport;
  const resetView=()=>{drag.current=null;setViewState({zoom:1,pan:{x:0,y:0}});setPanMode(false);setMaskFocusNotice('');};
  const changeZoom=(value:number)=>{setViewState(zoomHeadSliceViewport(viewport,value));setMaskFocusNotice('');};
  useEffect(()=>{resetView();},[study,plane,selected?.entry.id,viewResetVersion]);
  useEffect(()=>{setMaskNotice(previous=>previous&&showName&&!onAnswer&&previous.study===study&&previous.selected===selected&&previous.plane===plane&&previous.slice===slice?previous:null);},[study,plane,slice,selected,showName,onAnswer]);
  useEffect(()=>{const area=areaRef.current;if(!area)return;const observer=new ResizeObserver(()=>setFit({width:area.clientWidth,height:area.clientHeight}));observer.observe(area);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    const area=areaRef.current;if(!area)return;
    return bindSliceWheel(area,{getSlice:()=>liveCursor.current[view.fixedAxisIJK],sliceCount:view.sliceCount,pagePixels:()=>area.clientHeight,onSlice:slice=>{const next=[...liveCursor.current] as Vec3;next[view.fixedAxisIJK]=slice;liveCursor.current=next;onCursor(next);}});
  },[study,view,onCursor]);
  useEffect(()=>{
    const canvas=canvasRef.current,nativeCtx=canvas?.getContext('2d'),annotations=annotationRef.current,ctx=annotations?.getContext('2d');if(!canvas||!nativeCtx||!annotations||!ctx)return;
    annotations.width=Math.max(1,Math.round(fit.width));annotations.height=Math.max(1,Math.round(fit.height));
    const mask=overlay?selected?.mask:undefined,color=selected?.entry.color??[1,0.7,0.2];
    // Zoom/pan moves the display only; reuse the native raster while dragging.
    const inputs=[study,view,slice,windowing,overlay,selected,layers,groupLabels,opacity,layerOpacity];
    let raster=rasterRef.current;
    if(!raster||inputs.some((value,index)=>value!==raster!.inputs[index])){
    canvas.width=view.width;canvas.height=view.height;
    const image=nativeCtx.createImageData(view.width,view.height),pixels=image.data;
    const first=view.pixelToIJK(0,0,slice),dx=view.width>1?view.pixelToIJK(1,0,slice).map((v,i)=>v-first[i]):[0,0,0],dy=view.height>1?view.pixelToIJK(0,1,slice).map((v,i)=>v-first[i]):[0,0,0];
    const [,J,I]=study.geometry.shapeKJI,[level,width]=windowing,low=level-width/2;
    let anchorX=-1,anchorY=-1;
    const anchors:HeadLabelAnchor[]=[],colours=new Map<string,number[]>();
    for(let y=0;y<view.height;y++)for(let x=0;x<view.width;x++){
      const i=first[0]+dx[0]*x+dy[0]*y,j=first[1]+dx[1]*x+dy[1]*y,k=first[2]+dx[2]*x+dy[2]*y;
      const n=(y*view.width+x)*4,value=study.data[(k*J+j)*I+i];const grey=Number.isFinite(value)?Math.max(0,Math.min(255,(value-low)*255/Math.max(width,0.0001))):0;
      pixels[n]=grey;pixels[n+1]=grey;pixels[n+2]=grey;pixels[n+3]=255;
    }
    // Composite only intersecting crop rectangles. Mask buffers and native scalar values are never modified.
    if(overlay)for(const layer of layers){
      const crop=layer.entry.mask,data=layer.mask,strength=opacity*(layerOpacity[layer.entry.id]??1);if(!crop?.offset_kji||!data||strength===0)continue;
      const start=[crop.offset_kji[2],crop.offset_kji[1],crop.offset_kji[0]],end=start.map((v,i)=>v+crop.shape_kji[2-i]-1);
      if(slice<start[view.fixedAxisIJK]||slice>end[view.fixedAxisIJK])continue;
      const corners=[view.pixelFromIJK(start),view.pixelFromIJK(end)],x0=Math.max(0,Math.min(...corners.map(p=>p.x))),x1=Math.min(view.width-1,Math.max(...corners.map(p=>p.x))),y0=Math.max(0,Math.min(...corners.map(p=>p.y))),y1=Math.min(view.height-1,Math.max(...corners.map(p=>p.y)));
      const atMask=(i:number,j:number,k:number)=>{const ci=i-start[0],cj=j-start[1],ck=k-start[2],[K,MJ,MI]=crop.shape_kji;return ci>=0&&ci<MI&&cj>=0&&cj<MJ&&ck>=0&&ck<K&&data[(ck*MJ+cj)*MI+ci]===1;};
      let ax=-1,ay=-1,distance=Infinity;
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const i=first[0]+dx[0]*x+dy[0]*y,j=first[1]+dx[1]*x+dy[1]*y,k=first[2]+dx[2]*x+dy[2]*y;if(!atMask(i,j,k))continue;
        const edge=!atMask(i+dx[0],j+dx[1],k+dx[2])||!atMask(i-dx[0],j-dx[1],k-dx[2])||!atMask(i+dy[0],j+dy[1],k+dy[2])||!atMask(i-dy[0],j-dy[1],k-dy[2]);
        const alpha=(edge?layer.entry.opacity.outline:layer.entry.opacity.fill)*strength,n=(y*view.width+x)*4;
        for(let c=0;c<3;c++)pixels[n+c]=pixels[n+c]*(1-alpha)+layer.entry.color[c]*255*alpha;
        const d=(x-view.width/2)**2+(y-view.height/2)**2;if(d<distance){distance=d;ax=x;ay=y;}
      }
      if(ax>=0){colours.set(layer.entry.id,layer.entry.color);if(groupLabels||layer.entry.id===selected?.entry.id)anchors.push({id:layer.entry.id,x:ax,y:ay,text:headLabel(layer.entry),selected:layer.entry.id===selected?.entry.id});if(layer.entry.id===selected?.entry.id){anchorX=ax;anchorY=ay;}}
    }
    nativeCtx.putImageData(image,0,0);
    raster={inputs,anchors,colours,anchorX,anchorY};rasterRef.current=raster;
    }
    let {anchorX,anchorY}=raster;
    const anchors=[...raster.anchors],colours=new Map(raster.colours);
    // Text and leaders use square screen pixels, not anisotropic voxel pixels.
    // Only the native image canvas is aspect-scaled; stored image/mask values stay exact.
    const screen=(p:{x:number;y:number})=>({x:offsetX+(p.x+.5)*cssWidth/view.width,y:offsetY+(p.y+.5)*cssHeight/view.height});
    const cross=screen(view.pixelFromIJK(cursor));
    if(showCrosshair&&(!onAnswer||keyboardMoved||quizPick)){ctx.strokeStyle='#87dad6';ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(cross.x,offsetY);ctx.lineTo(cross.x,offsetY+cssHeight);ctx.moveTo(offsetX,cross.y);ctx.lineTo(offsetX+cssWidth,cross.y);ctx.stroke();ctx.setLineDash([]);}
    const pointSets=selected?[...(!mask?[selected.entry.sampled_path_ras_mm??selected.entry.points_ras_mm??[]]:[]),...(regionalCourse?(selected.entry.supplementary_geometries??[]).map(part=>part.sampled_path_ras_mm):[])]:[];
    if(overlay&&selected)for(const points of pointSets){
      const projected=points.map(point=>study.geometry.rasToIjk(point));
      ctx.strokeStyle=`rgb(${color.map(v=>Math.round(v*255)).join(',')})`;ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=2;
      // Only native-plane points/segments within half a voxel are drawn; no guessed cross-plane projection.
      for(let index=0;index<projected.length;index++){
        const point=projected[index],inside=(p:number[])=>p.every((v,i)=>v>=-0.5&&v<study.geometry.shapeKJI[2-i]-0.5);
        if(!inside(point)||Math.abs(point[view.fixedAxisIJK]-slice)>0.5)continue;
        const native=point.map(Math.round) as Vec3,voxel=view.pixelFromIJK(native),p=screen(voxel);
        if(index&&inside(projected[index-1])&&Math.abs(projected[index-1][view.fixedAxisIJK]-slice)<=0.5){const prev=screen(view.pixelFromIJK(projected[index-1].map(Math.round)));ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();}
        else {ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();}
        if(anchorX<0){anchorX=voxel.x;anchorY=voxel.y;}
      }
    }
    if(anchorX>=0&&selected&&showName&&!anchors.some(a=>a.id===selected.entry.id)){anchors.push({id:selected.entry.id,x:anchorX,y:anchorY,text:headLabel(selected.entry),selected:true});colours.set(selected.entry.id,color);}
    const layout=layoutHeadLabels(showName?anchors.map(a=>({...a,...screen(a)})).filter(a=>a.x>=0&&a.x<fit.width&&a.y>=0&&a.y<fit.height):[],fit.width,fit.height);
    for(const placement of layout.labels){
      ctx.font='600 14px system-ui';const displayName=placement.text;let label=displayName;const maximum=placement.boxWidth-16;
      while(label.length>3&&ctx.measureText(label+'…').width>maximum)label=label.slice(0,-1);
      if(label!==displayName)label+='…';
      const anchor=placement,pad=8,{boxWidth,boxHeight,boxX,boxY}=placement,left=anchor.x<fit.width/2;
      const color=colours.get(placement.id)??[1,.7,.2];
      const ink=annotationInk(color);
      ctx.save();ctx.setLineDash([4,5]);ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);ctx.lineTo(left?boxX+boxWidth:boxX,boxY+boxHeight/2);
      ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=3.5;ctx.stroke();ctx.strokeStyle=ink;ctx.globalAlpha=.8;ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
      ctx.beginPath();ctx.arc(anchor.x,anchor.y,4,0,Math.PI*2);ctx.fillStyle=ink;ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='rgba(0,0,0,.92)';ctx.fillRect(boxX,boxY,boxWidth,boxHeight);ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.strokeRect(boxX,boxY,boxWidth,boxHeight);
      ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.strokeText(label,boxX+pad,boxY+20);ctx.fillStyle=ink;ctx.fillText(label,boxX+pad,boxY+20);
    }
    if(layout.omitted){ctx.fillStyle='#cbd8d4';ctx.font='12px system-ui';ctx.fillText(`+${layout.omitted} labels · select a smaller group`,12,fit.height-12);}
    if(quizPick&&quizPick[view.fixedAxisIJK]===slice){const p=screen(view.pixelFromIJK(quizPick));ctx.strokeStyle='#ffe09a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.stroke();}
  },[study,selected,layers,groupLabels,opacity,layerOpacity,cursor,windowing,overlay,regionalCourse,showCrosshair,view,slice,cssWidth,cssHeight,offsetX,offsetY,fit,showName,quizPick,keyboardMoved,onAnswer]);
  const changeSlice=(value:number)=>{const next=[...cursor] as Vec3;next[view.fixedAxisIJK]=clamp(value,view.sliceCount-1);onCursor(next);};
  const submitSlice=(text:string)=>{
    const target=headSliceNumber(text,view.sliceCount);
    if(target===null){setSliceDraft({text,invalid:true,study,plane,slice});return;}
    setSliceDraft(null);if(target!==slice)changeSlice(target);
  };
  return <section ref={sectionRef} className="head-view">
    <header><h2>{plane[0].toUpperCase()+plane.slice(1)}{view.oblique?' · native oblique':''}</h2><div className="head-view-actions">
      <details className="head-display-settings head-image-tools" onKeyDown={event=>{if(event.key==='Escape'&&event.currentTarget.open){event.preventDefault();event.stopPropagation();event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}}>
        <summary>Image tools</summary><div role="group" aria-label={`${plane} image tools`}>
          {allowPlayback&&expanded&&showName&&!onAnswer&&<HeadSlicePlayback key={`${plane}:${selected?.entry.id??''}`} plane={plane} slice={slice} sliceCount={view.sliceCount} onSlice={changeSlice} interactionRoot={sectionRef} resetIdentity={study} resetVersion={viewResetVersion}/>}
          <div className="head-image-zoom"><button type="button" aria-label={`${plane} zoom out`} disabled={viewport.zoom<=1} onClick={()=>changeZoom(viewport.zoom-.25)}>−</button><output aria-label={`${plane} zoom`}>{Math.round(viewport.zoom*100)}%</output><button type="button" aria-label={`${plane} zoom in`} disabled={viewport.zoom>=4} onClick={()=>changeZoom(viewport.zoom+.25)}>+</button></div>
          <button type="button" onClick={resetView}>Fit image</button><button type="button" aria-pressed={panMode} onClick={()=>{drag.current=null;setPanMode(value=>!value);}}>Pan image</button>
          {showName&&!onAnswer&&selected?.mask&&selected.entry.mask&&<><button type="button" onClick={()=>{
            const framed=fitHeadMaskViewport(fit,view,slice,selected.entry.mask!,selected.mask!);
            if(!framed){setMaskFocusNotice('No saved mask voxels on this slice. Use Show nearest mask slice, or scroll to its visible mask.');return;}
            drag.current=null;setViewState(framed);setPanMode(false);setMaskFocusNotice('Selected mask framed on this slice. Fit image restores the full view.');
          }}>Fit selected mask</button><button type="button" onClick={()=>{
            const nearest=nearestHeadMaskSlice(view,slice,selected.entry.mask!,selected.mask!);
            const framed=nearest===null?null:fitHeadMaskViewport(fit,view,nearest,selected.entry.mask!,selected.mask!);
            if(nearest===null||!framed){setMaskFocusNotice('No valid saved mask slice is available in this view.');return;}
            drag.current=null;setViewState(framed);setPanMode(false);
            setMaskFocusNotice(nearest===slice?'Selected mask framed on the current slice.':`Showing nearest saved mask slice: ${nearest+1} of ${view.sliceCount}.`,nearest);
            if(nearest!==slice)changeSlice(nearest);
          }}>Show nearest mask slice</button></>}
          {showName&&!onAnswer&&maskFocusNotice&&<p role="status">{maskFocusNotice}</p>}
          <p>Drag or use arrow keys in Pan mode. Switch Pan off to select or answer. Scrolling changes slices.{canPick?' Click a shown mask to inspect it; overlapping masks offer a choice. The anatomy index also supports keyboard selection.':''}</p>
          {onWindowing&&<p>Right-drag on the image: left/right adjusts window width; up/down adjusts level. CT uses native window values; MRI uses display intensity, not HU. Numeric controls and Reset window remain in Display settings.</p>}
        </div>
      </details>{onExpand&&<button type="button" onClick={onExpand} aria-pressed={expanded} aria-label={`${expanded?'Restore':'Enlarge'} ${plane} image`}>{expanded?'Restore':'Enlarge'}</button>}
    </div></header>
    <div ref={areaRef} className="head-slice-area" title="Scroll over the image to change slices without moving the page">
      <canvas ref={canvasRef} role="img" tabIndex={0} aria-describedby={`head-${plane}-keyboard${onAnswer&&!panMode?' head-quiz-instructions':''}`} aria-label={`${plane} native image, slice ${slice+1} of ${view.sliceCount}${selected?(showName?`, selected ${headLabel(selected.entry)}`:', highlighted quiz structure'):''}, zoom ${Math.round(viewport.zoom*100)}%${panMode?', Pan mode; arrow keys pan; turn Pan off to select or answer':onAnswer?', arrow keys move the crosshair; Enter places an answer':''}`} style={{position:'absolute',left:offsetX,top:offsetY,width:cssWidth,height:cssHeight,cursor:panMode?'grab':'crosshair',touchAction:panMode?'none':undefined}} onClick={event=>{if(event.button!==0||panMode)return;const point=canvasVoxel(view,event.currentTarget.getBoundingClientRect(),event.clientX,event.clientY,slice);if(point){onCursor(point);if(onAnswer)onAnswer(point);else pickMask(point);}}}
      onPointerDown={event=>{if(!panMode||event.button!==0)return;event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);drag.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY,panX:viewport.panX,panY:viewport.panY};}}
      onPointerMove={event=>{const start=drag.current;if(!start||start.pointerId!==event.pointerId)return;event.preventDefault();const next=headSliceViewport(fit,{width:physicalWidth,height:physicalHeight},viewport.zoom,{x:start.panX+event.clientX-start.x,y:start.panY+event.clientY-start.y});setViewState({zoom:next.zoom,pan:{x:next.panX,y:next.panY}});}}
      onPointerUp={event=>{if(drag.current?.pointerId===event.pointerId){drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}}
      onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}
      onKeyDown={event=>{
        if(event.altKey||event.ctrlKey||event.metaKey||event.nativeEvent?.isComposing)return;
        if(event.key==='+'||event.key==='='||event.key==='-'){event.preventDefault();changeZoom(viewport.zoom+(event.key==='-'?-.25:.25));return;}
        if(event.key==='0'){event.preventDefault();resetView();return;}
        const nextSlice=headSliceKey(event.key,slice,view.sliceCount);
        if(nextSlice!==null){event.preventDefault();changeSlice(nextSlice);return;}
        const p=view.pixelFromIJK(cursor),delta:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
        if(panMode&&delta[event.key]){event.preventDefault();const [x,y]=delta[event.key],step=event.shiftKey?40:20;const next=headSliceViewport(fit,{width:physicalWidth,height:physicalHeight},viewport.zoom,{x:viewport.panX+x*step,y:viewport.panY+y*step});setViewState({zoom:next.zoom,pan:{x:next.panX,y:next.panY}});return;}
        if(delta[event.key]){event.preventDefault();setKeyboardMoved(true);if(onAnswer||canPick)onKeyboardMove?.();const [x,y]=delta[event.key];onCursor(view.pixelToIJK(clamp(p.x+x,view.width-1),clamp(p.y+y,view.height-1),slice));}
        else if((onAnswer||canPick)&&(event.key==='Enter'||event.key===' ')){
          event.preventDefault();if(panMode||event.repeat||!(keyboardMoved||quizPick))return;
          if(onAnswer)onAnswer(cursor);else pickMask(cursor);
        }
      }}/>
      <canvas ref={annotationRef} aria-hidden="true" className="head-annotation-layer"/>
      <span className="head-orientation head-top">{view.directionLabels.top}</span><span className="head-orientation head-left">{view.directionLabels.left}</span><span className="head-orientation head-right">{view.directionLabels.right}</span><span className="head-orientation head-bottom">{view.directionLabels.bottom}</span>
    </div>
      {choiceCurrent&&maskChoice&&<div ref={choiceRef} className="head-mask-choice" role="group" aria-label="Masks at this point" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismissChoice();}}}>
        <p>Masks at this point</p><span>Choose the structure to inspect.</span>
        {maskChoice.hits.map(hit=><button key={hit.entry.id} type="button" onClick={()=>{
          if(choiceCurrent&&headMaskHits(study,layers,cursor,opacity,layerOpacity).some(current=>current.entry===hit.entry))onSelectMask?.(hit.entry);
          dismissChoice();
        }}>{headLabel(hit.entry)}</button>)}
        <button type="button" onClick={dismissChoice}>Dismiss</button>
      </div>}
    <div className="head-slice-footer"><div className="head-slice-control"><label className="head-slice-jump"><input aria-label={`${plane} slice number`} aria-describedby={`head-${plane}-slice-help${currentSliceDraft?.invalid?` head-${plane}-slice-error`:''}`} aria-invalid={currentSliceDraft?.invalid||undefined} type="text" inputMode="numeric" value={currentSliceDraft?.text??String(slice+1)} onChange={event=>setSliceDraft({text:event.target.value,invalid:false,study,plane,slice})} onBlur={event=>submitSlice(event.currentTarget.value)} onKeyDown={event=>{
      if(event.altKey||event.ctrlKey||event.metaKey||event.nativeEvent?.isComposing)return;
      if(event.key==='Enter'){event.preventDefault();submitSlice(event.currentTarget.value);}
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setSliceDraft(null);}
    }}/><span aria-hidden="true">/ {view.sliceCount}</span></label><input aria-label={`${plane} slice`} type="range" min={0} max={view.sliceCount-1} value={slice} onChange={event=>changeSlice(Number(event.target.value))}/></div>
      <details className="head-display-settings head-keyboard-settings" onKeyDown={headDisclosureKeyDown}><summary>Keyboard controls</summary><div><p id={`head-${plane}-keyboard`}>Focus the image. + / −: zoom. 0: fit image. Page Up / Page Down: previous / next native slice. Home / End: first / last slice. Arrow keys: move within the slice, or pan when Pan is on (Shift for a larger step).{onAnswer?' With Pan off, Enter or Space places an answer after moving the crosshair.':canPick?' Arrow keys show the crosshair. Enter or Space selects a visible saved mask at that point; overlapping masks offer a choice.':''}</p><p>Slice order follows this study, not an inferred anatomical direction. Shortcuts apply only to the focused image.</p></div></details>
    </div>
    <p id={`head-${plane}-slice-help`} className="head-slice-help">Enter a whole slice number from 1 to {view.sliceCount}. Press Enter or leave the field to go there. Escape cancels. This is native slice order, not an anatomical level.</p>
    {currentSliceDraft?.invalid&&<p id={`head-${plane}-slice-error`} className="head-slice-error" role="alert">Enter a whole slice number from 1 to {view.sliceCount}.</p>}
  </section>;
}

export type HeadLocalSourceState='unknown'|'available'|'unavailable'|'failed'|'paused';

/** Presentation state only: cancellation does not establish source availability. */
export function headSourceAfterCancel(state:HeadLocalSourceState,hostname:string):HeadLocalSourceState{
  return state==='unknown'?['localhost','127.0.0.1','[::1]'].includes(hostname)?'paused':'unavailable':state;
}

/** Pure empty-view rendering; source admission and reads remain in the viewer. */
export function renderHeadAtlasOpening({modality,count,packageOpening,hasPackage,sourceState,studyLoadFailed,error,busy,onChooseFolder}:{modality:Modality;count:number;packageOpening:boolean;hasPackage:boolean;sourceState:HeadLocalSourceState;studyLoadFailed:boolean;error:string;busy:boolean;onChooseFolder:()=>void}){
  const failed=!packageOpening&&(studyLoadFailed||!!error);
  const opening=!failed&&(packageOpening||hasPackage);
  const checking=!opening&&!failed&&sourceState==='unknown';
  const action=failed?'Unable to open':opening?'Opening':checking?'Preparing':'Open';
  return <section className="head-atlas-open" aria-busy={opening||checking}>
    <span className="head-panel-kicker">{modality} · Head &amp; neck</span>
    <h2>{action} the approved {modality} head atlas</h2>
    {opening?<p>Loading and verifying the selected source. Search, structures and learning tools become available when the native scan is ready.</p>
      :checking?<p>Checking for an approved local source. If one is configured, it will open automatically. You can also choose an approved folder.</p>
      :failed?<p>{hasPackage&&studyLoadFailed?'Use Retry opening scan above to try the native image again.':sourceState==='failed'?'Use Retry local atlas above to recheck the configured source.':'Choose the approved folder below to try again.'} Your source files have not been changed.</p>
      :sourceState==='paused'?<p>Automatic local loading is paused. Use Resume local atlas above to check again, or choose the approved folder below.</p>
      :sourceState==='available'?<p>Use Reopen local atlas above to recheck the configured SSD source. Closing the atlas stops automatic loading until you reopen it.</p>
      :sourceState==='failed'?<p>Use Retry local atlas above to recheck the configured source, or choose the approved folder below.</p>
      :<p>No automatic local source is connected. Choose the approved folder below to open this viewer. Hosted scan delivery is not yet enabled.</p>}
    <button type="button" onClick={onChooseFolder} disabled={busy}>Choose atlas folder</button>
    <details onKeyDown={headDisclosureKeyDown}><summary>Manual folder help</summary><p>Choose the complete <strong>browser-data-verified</strong> folder, not individual files or CT/MRI source subfolders. Native images, approved masks and smooth surfaces open together. Optional Folder sharing reuses a manually selected folder for CT/MRI switches in this tab; it is not required for configured automatic loading.</p></details>
    <p>{count} listed annotations · per-structure scope varies · no diagnostic use · no automatic 3D-reference registration</p>
  </section>;
}

export function HeadAtlasViewer({modality}:{modality:Modality}){
  const folderSession=useHeadFolderSession();
  const [retainFolder,setRetainFolder]=useState(()=>!!folderSession?.read(HEAD_MANIFEST_SHA256));
  const inputRef=useRef<HTMLInputElement>(null);
  const openButtonRef=useRef<HTMLButtonElement>(null);
  const indexSearchRef=useRef<HTMLInputElement>(null);
  const comparisonButtonRef=useRef<HTMLButtonElement>(null);
  const [packageOpening,setPackageOpening]=useState(false);
  const [studyLoadAttempt,setStudyLoadAttempt]=useState(0),[studyLoadFailed,setStudyLoadFailed]=useState(false);
  const failedStudyRef=useRef<{pkg:LocalHeadPackage;modality:Modality}|null>(null);
  const [entryLoadAttempt,setEntryLoadAttempt]=useState(0),[failedEntryId,setFailedEntryId]=useState<string|null>(null);
  const selectionFocusRef=useRef(false),structureHeadingRef=useRef<HTMLHeadingElement>(null);
  const [pkg,setPackage]=useState<LocalHeadPackage|null>(()=>folderSession?.read(HEAD_MANIFEST_SHA256)??null),[study,setStudy]=useState<LoadedStudy|null>(null),[selected,setSelected]=useState<LoadedEntry|null>(null);
  const [indexFocus,setIndexFocus]=useState<{study:LoadedStudy;id:string}|null>(null);
  const [inlineComparison,setInlineComparison]=useState<{pkg:LocalHeadPackage;study:LoadedStudy;modality:Modality}|null>(null);
  const [tourPlaying,setTourPlaying]=useState(false);
  const [modelTourStatus,setModelTourStatus]=useState<{scope:typeof inlineComparison;value:HeadInlinePlaybackStatus}|null>(null);
  const modelTourStatusRef=useRef<typeof modelTourStatus>(null);
  const [query,setQuery]=useState(''),[family,setFamily]=useState('All systems'),[activeId,setActiveId]=useState('');
  const [linkedOnly,setLinkedOnly]=useState(false);
  const [indexSide,setIndexSide]=useState<string|undefined>(),[indexRepresentation,setIndexRepresentation]=useState<string|undefined>();
  function resetIndexDetails(){setIndexSide(undefined);setIndexRepresentation(undefined);}
  const [filteredQuestionMode,setFilteredQuestionMode]=useState<PracticeMode>('locate');
  const [filteredSetSize,setFilteredSetSize]=useState<'1'|'5'|'10'|'all'>('5');
  const [studySet,setStudySet]=useState<HeadStudySet>(null);
  const studySetRef=useRef(studySet);studySetRef.current=studySet;
  useEffect(()=>{setStudySet(null);},[study,pkg,modality]);
  const studySetEntries=headStudySetEntries(studySet,study,HEAD_MANIFEST_SHA256);
  const [viewResetVersion,setViewResetVersion]=useState(0);
  const [cursor,setCursor]=useState<Vec3>([0,0,0]),[windowing,setWindowing]=useState<[number,number]>([40,80]);
  const [overlay,setOverlay]=useState(true),[regionalCourse,setRegionalCourse]=useState(true),[expanded,setExpanded]=useState<Plane|'3d'|null>('axial'),[status,setStatus]=useState(''),[error,setError]=useState('');
  const [rightPanel,setRightPanel]=useState<'info'|'practice'|'guided'>('info');
  const [learningPosition,setLearningPosition]=useState<HeadLearningPosition>({sequenceId:'brainstem',conceptId:null});
  const tourStudyContext={learningPosition,rightPanel};
  const tourStudyContextRef=useRef(tourStudyContext);tourStudyContextRef.current=tourStudyContext;
  const tourStudyAdditions=headTourStudyAdditions(studySet,study,HEAD_MANIFEST_SHA256,modality,learningPosition.sequenceId);
  const [practiceOrigin,setPracticeOrigin]=useState<HeadLearningPosition|null>(null);
  const [navigationNotice,setNavigationNotice]=useState('');
  const [urlNavigation,setUrlNavigation]=useState<HeadImageNavigation>({conceptId:null,position:null,invalid:false});
  const [navigationEpoch,setNavigationEpoch]=useState(0);
  const [showCrosshair,setShowCrosshair]=useState(false);
  const [overlayGroup,setOverlayGroup]=useState('selected'),[groupLayers,setGroupLayers]=useState<LoadedEntry[]>([]),[hiddenLayers,setHiddenLayers]=useState<Set<string>>(new Set());
  const [groupLabels,setGroupLabels]=useState(false),[overlayOpacity,setOverlayOpacity]=useState(1),[overlayStatus,setOverlayStatus]=useState('');
  const [layerOpacity,setLayerOpacity]=useState<Record<string,number>>({});
  const studyRequestRef=useRef<AbortController|null>(null),entryRequestRef=useRef<AbortController|null>(null),groupRequestRef=useRef<AbortController|null>(null);
  const configuredRequestRef=useRef<AbortController|null>(null);
  const [localSourceState,setLocalSourceState]=useState<HeadLocalSourceState>('unknown');
  const viewMemoryReadyRef=useRef(false);
  const pendingHistoryRestoreRef=useRef<{pkg:LocalHeadPackage;study:LoadedStudy;href:string;view:HeadHistoryView}|null>(null);
  function cancelPackageReads(){
    // Close/replacement runs before passive effect cleanup. Abort synchronously
    // so a native read settling in that interval cannot restore retired data.
    for(const request of [studyRequestRef,entryRequestRef,groupRequestRef,configuredRequestRef]){
      request.current?.abort();request.current=null;
    }
  }
  const groups=useMemo(()=>groupHeadOverlays(study?.definition.entries??[]),[study]);
  const practice=useHeadAtlasPractice(pkg,study),quizActive=practice.active,hideAnswer=quizActive&&!practice.outcome;
  if(quizActive)viewMemoryReadyRef.current=false;
  const historyLiveRef=useRef({pkg,study,modality,cursor,windowing,expanded,rightPanel,quizActive});
  historyLiveRef.current={pkg,study,modality,cursor,windowing,expanded,rightPanel,quizActive};
  const historyHref=()=>window.location.pathname+window.location.search+window.location.hash;
  function currentHistoryScope(value=historyLiveRef.current):HeadHistoryScope|null{
    return value.pkg&&value.study&&window.location.pathname===`/atlas/${value.modality.toLowerCase()}-head`
      ?{pkg:value.pkg,study:value.study,modality:value.modality,revision:HEAD_MANIFEST_SHA256}:null;
  }
  function rememberHistoryView(point?:Vec3){
    const live=historyLiveRef.current,scope=currentHistoryScope(live);
    if(!scope||!viewMemoryReadyRef.current||live.quizActive||live.rightPanel!=='info'||live.expanded==='3d'||
      typeof window.history.replaceState!=='function')return;
    const navigation=parseHeadImageNavigation(new URLSearchParams(window.location.search),HEAD_MANIFEST_SHA256,live.modality);
    if(navigation.invalid||navigation.position)return;
    const href=historyHref(),entry=headViewHistory.ensure(window.history.state,href);
    if(!entry)return;
    if(entry.changed)window.history.replaceState(entry.state,'');
    headViewHistory.save(entry.state,href,scope,{cursor:point??live.cursor,layout:live.expanded??'multiplanar',windowing:live.windowing});
  }
  useEffect(()=>()=>{
    const last=historyLiveRef.current.pkg;
    const nextIsImaging=window.location.pathname==='/atlas/ct-head'||window.location.pathname==='/atlas/mri-head';
    if(last&&folderSession?.read(HEAD_MANIFEST_SHA256)!==last&&!(last.source==='configured-local'&&nextIsImaging))headViewHistory.clearPackage(last);
  },[folderSession]);
  const displayLayerOpacity=useMemo(()=>quizActive?{}:layerOpacity,[quizActive,layerOpacity]);
  const sliceSelection=quizActive?(practice.mode==='label'||practice.mode==='recall'||practice.outcome?practice.target:null):selected;
  const visibleLayers=useMemo(()=>quizActive?(sliceSelection?[sliceSelection]:[]):visibleHeadOverlays(groupLayers,hiddenLayers,selected),[quizActive,sliceSelection,groupLayers,hiddenLayers,selected]);
  const activeEntry=study?.definition.entries.find(entry=>entry.id===activeId);
  // A retry belongs to the currently rendered failure, not a retained button
  // callback from a prior selection, panel, package, or practice state.
  const structureRetryContext={pkg,study,activeId,failedEntryId,selected,quizActive};
  const structureRetryContextRef=useRef(structureRetryContext);
  structureRetryContextRef.current=structureRetryContext;
  const structureRetryConsumedRef=useRef(false);
  // Manual File handles deliberately clear when leaving imaging routes.
  // Keep that privacy boundary and leave their scan alive in its original tab.
  const preserveScanTab=!!pkg&&pkg.source!=='configured-local';
  const concept=!quizActive&&selected&&selected.entry===activeEntry&&HEAD_LINK_REVISION===HEAD_MANIFEST_SHA256?headAtlasConcept(selected.entry,modality):null;
  const paired=!quizActive&&selected?.entry.id===activeId?headPairedEntry(selected.entry,study?.definition.entries??[],modality,HEAD_MANIFEST_SHA256):null;
  const importGeneration=useRef(0);
  const comparisonScope=useMemo(()=>({pkg,study,modality,quizActive,activeId,selected,inlineComparison,rightPanel,learningPosition,generation:importGeneration.current}),[pkg,study,modality,quizActive,activeId,selected,inlineComparison,rightPanel,learningPosition]);
  const comparisonScopeRef=useRef<typeof comparisonScope|null>(null);
  // Only the committed scan/panel may own comparison callbacks. An abandoned
  // render must not retire visible controls or publish a speculative handoff.
  useLayoutEffect(()=>{
    comparisonScopeRef.current=comparisonScope;
    return()=>{if(comparisonScopeRef.current===comparisonScope)comparisonScopeRef.current=null;};
  },[comparisonScope]);
  const comparisonOpen=!!inlineComparison&&inlineComparison.pkg===pkg&&inlineComparison.study===study&&inlineComparison.modality===modality&&!quizActive;
  const playbackSteps=headLearningSteps(study?.definition.entries??[],learningPosition.sequenceId,modality,HEAD_MANIFEST_SHA256);
  const playbackIndex=playbackSteps.findIndex(step=>step.conceptId===learningPosition.conceptId),playbackStep=playbackSteps[playbackIndex];
  const playbackScanReady=!!pkg&&!!study&&!packageOpening&&!quizActive&&!!playbackStep?.entry&&activeEntry===playbackStep.entry&&selected?.entry===playbackStep.entry;
  const playbackModelStatus=comparisonOpen&&modelTourStatus?.scope===inlineComparison&&modelTourStatus.value.conceptId===playbackStep?.conceptId?modelTourStatus.value.status:'waiting';
  const playbackBlocked=!pkg||!study||packageOpening||quizActive||rightPanel!=='guided'||HEAD_LINK_REVISION!==HEAD_MANIFEST_SHA256||!playbackStep?.entry||failedEntryId===playbackStep.entry.id||comparisonOpen&&(!headAtlasConcept(playbackStep.entry,modality)?.atlasHref||playbackModelStatus==='blocked');
  const playbackReady=playbackScanReady&&(!comparisonOpen||playbackModelStatus==='matched');
  const playbackScope={comparisonScope,playbackReady,playbackBlocked};
  const playbackScopeRef=useRef<typeof playbackScope|null>(null);
  useLayoutEffect(()=>{
    playbackScopeRef.current=playbackScope;
    return()=>{if(playbackScopeRef.current===playbackScope)playbackScopeRef.current=null;};
  },[playbackScope]);
  function reportPlaybackModel(value:HeadInlinePlaybackStatus){
    if(comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||!comparisonOpen||practiceRef.current.active||value.conceptId!==activeConcept?.conceptId)return;
    modelTourStatusRef.current={scope:inlineComparison,value};
    setModelTourStatus(previous=>previous?.scope===inlineComparison&&previous.value.conceptId===value.conceptId&&previous.value.status===value.status?previous:{scope:inlineComparison,value});
  }
  function advanceGuidedPlayback(conceptId:string){
    if(playbackScopeRef.current!==playbackScope||comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||practiceRef.current.active||!playbackReady||playbackBlocked||rightPanel!=='guided')return;
    if(comparisonOpen&&(modelTourStatusRef.current?.scope!==inlineComparison||modelTourStatusRef.current.value.conceptId!==learningPosition.conceptId||modelTourStatusRef.current.value.status!=='matched'))return;
    const next=playbackSteps[playbackIndex+1];
    if(!next||next.conceptId!==conceptId)return;
    changeLearningPosition({sequenceId:learningPosition.sequenceId,conceptId});if(next.entry)showLearningEntry(next.entry);
  }
  useEffect(()=>{setInlineComparison(null);},[pkg,study,modality,quizActive]);
  function focusComparisonReturn(){
    // An unmapped/pending annotation disables the launcher after this close.
    // Return to an enabled control instead of focusing that retiring target.
    if(concept?.atlasHref)comparisonButtonRef.current?.focus({preventScroll:true});
    else indexSearchRef.current?.focus({preventScroll:true});
  }
  function closeComparison(){
    if(comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||!comparisonOpen||practiceRef.current.active)return;
    // Retire this comparison before React commits the close. Retained iframe
    // and tour callbacks must not reopen/navigate the just-finished context.
    comparisonScopeRef.current=null;
    setInlineComparison(null);
    focusComparisonReturn();
  }
  function toggleInlineComparison(){
    if(comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||practiceRef.current.active)return;
    if(comparisonOpen){closeComparison();return;}
    if(!pkg||!study||!concept?.atlasHref)return;
    setInlineComparison({pkg,study,modality});if(!expanded||expanded==='3d')setExpanded('axial');
    comparisonButtonRef.current?.focus({preventScroll:true});
  }
  function findLinkedStructures(){
    if(comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||practiceRef.current.active||!study||!linkedCount)return;
    resetIndexDetails();setQuery('');setFamily('All systems');setLinkedOnly(true);
    indexSearchRef.current?.focus({preventScroll:true});
  }
  function openGuidedComparison(entry:HeadEntry){
    if(comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||quizActive||practiceRef.current.active||rightPanel!=='guided'||!pkg||!study||selected?.entry!==entry||activeEntry!==entry||!concept?.atlasHref)return;
    const step=headLearningSteps(study.definition.entries,learningPosition.sequenceId,modality,HEAD_MANIFEST_SHA256).find(item=>item.conceptId===learningPosition.conceptId);
    if(step?.entry!==entry)return;
    setInlineComparison({pkg,study,modality});if(!expanded||expanded==='3d')setExpanded('axial');
    comparisonButtonRef.current?.focus({preventScroll:true});
  }
  function navigateComparisonTour(position:HeadLearningPosition){
    if(comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||!comparisonOpen||quizActive||practiceRef.current.active||rightPanel!=='guided'||!study||position.sequenceId!==learningPosition.sequenceId)return;
    const step=headLearningSteps(study.definition.entries,position.sequenceId,modality,HEAD_MANIFEST_SHA256).find(item=>item.conceptId===position.conceptId);
    if(!step)return;
    changeLearningPosition(position);if(step.entry)showLearningEntry(step.entry);
  }
  function finishComparisonTour(){
    if(comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||!comparisonOpen||quizActive||practiceRef.current.active||rightPanel!=='guided'||!study)return;
    comparisonScopeRef.current=null;
    // Finish leaves the selected scan available, but records no completion score.
    setInlineComparison(null);setRightPanel('info');setLearningPosition(previous=>({...previous,conceptId:null}));writeNavigation(concept?.conceptId??null,null);
    focusComparisonReturn();
  }
  function selectComparisonConcept(conceptId:string){
    // An iframe callback from a retired scan/selection cannot navigate a new one.
    if(comparisonScopeRef.current!==comparisonScope||importGeneration.current!==comparisonScope.generation||!comparisonOpen||quizActive||practiceRef.current.active||!study)return;
    const resolved=resolveHeadConcept(study.definition.entries,conceptId,modality);
    const entry=study.definition.entries.find(candidate=>candidate===resolved);
    if(!entry||!headAtlasConcept(entry,modality)?.atlasHref)return;
    showLearningEntry(entry);chooseStructure(entry);
  }
  const practiceRef=useRef(practice);practiceRef.current=practice;
  // Guided practice belongs to one committed panel render. A retained child
  // callback cannot start a set from an old step/study or replace a newer set.
  // Reserve before calling the practice hook, which can synchronously reenter.
  const guidedPracticeContext={generation:importGeneration.current,consumed:false};
  const guidedPracticeContextRef=useRef<typeof guidedPracticeContext|null>(null);
  useLayoutEffect(()=>{
    guidedPracticeContextRef.current=guidedPracticeContext;
    return()=>{if(guidedPracticeContextRef.current===guidedPracticeContext)guidedPracticeContextRef.current=null;};
  },[guidedPracticeContext]);
  // Bind completed-review actions to this exact study and result set. Retired
  // buttons must not navigate a replacement folder or a later practice session.
  const reviewContext=useMemo(()=>({pkg,study,modality,results:practice.results,originalResults:practice.originalResults,finished:practice.finished,active:practice.active,generation:importGeneration.current}),[pkg,study,modality,practice.results,practice.originalResults,practice.finished,practice.active]);
  const reviewContextRef=useRef(reviewContext);reviewContextRef.current=reviewContext;
  // Stable for the wheel listener; read the current question without stale closures.
  // A canvas click then places its fresh answer in the same event after navigation.
  const navigateCursor=useMemo(()=>(point:Vec3)=>{practiceRef.current.clearPendingPick(point);if(!practiceRef.current.active){viewMemoryReadyRef.current=true;pendingHistoryRestoreRef.current=null;rememberHistoryView(point);}setCursor(point);},[]);
  useEffect(()=>{setPracticeOrigin(null);},[study]);
  useEffect(()=>{if(!practice.active&&!practice.finished)setPracticeOrigin(null);},[practice.active,practice.finished]);
  useEffect(()=>{
    function restore(fromHistory=false){
      const navigation=parseHeadImageNavigation(new URLSearchParams(window.location.search),HEAD_MANIFEST_SHA256,modality);
      if(fromHistory){
        const live=historyLiveRef.current,scope=currentHistoryScope(live),href=historyHref();
        const view=scope&&!navigation.invalid&&!navigation.position?headViewHistory.read(window.history.state,href,scope):null;
        pendingHistoryRestoreRef.current=view&&live.pkg&&live.study?{pkg:live.pkg,study:live.study,href,view}:null;
        viewMemoryReadyRef.current=!!view;
        setActiveId('');setSelected(null);
        if(view){setCursor(view.cursor);setExpanded(view.layout==='multiplanar'?null:view.layout);setWindowing(view.windowing);}
      }
      practiceRef.current.end();setPracticeOrigin(null);setUrlNavigation(navigation);
      setLinkedOnly(false);
      setLearningPosition(navigation.position??{sequenceId:'brainstem',conceptId:null});setRightPanel(navigation.position?'guided':'info');
      setNavigationNotice(navigation.invalid?'This anatomy link is invalid or belongs to another source revision. No structure has been substituted.':'');
      setNavigationEpoch(value=>value+1);
    }
    restore();const onPopState=()=>restore(true);window.addEventListener('popstate',onPopState);
    return()=>window.removeEventListener('popstate',onPopState);
  },[modality]);
  useEffect(()=>{setOverlayGroup('selected');setGroupLayers([]);setHiddenLayers(new Set());setOverlayStatus('');setGroupLabels(false);setLayerOpacity({});},[study]);
  useEffect(()=>{
    if(!pkg||!study||quizActive||overlayGroup==='selected'){setGroupLayers([]);setOverlayStatus('');return;}
    const group=overlayGroup==='all'?{label:'All available',entries:groups.flatMap(item=>item.entries)}:groups.find(item=>item.id===overlayGroup);if(!group)return;
    if(headOverlayBytes([...group.entries,...(activeEntry?[activeEntry]:[])])>HEAD_OVERLAY_BYTE_LIMIT){setGroupLayers([]);setOverlayStatus('This group and the selected structure exceed the 256 MiB mask limit. Select a smaller group instead.');return;}
    // A selection change does not reload an already verified complete group.
    // In particular, selecting a group member borrows its mask in the entry
    // effect below without re-reading every other member of that group.
    if(groupLayers.length===group.entries.length&&groupLayers.every((layer,index)=>layer.entry===group.entries[index]&&canReuseHeadMask(pkg,study,layer.entry,layer))){setOverlayStatus(`${groupLayers.length} distinct saved masks · partial boundaries retained`);return;}
    setGroupLayers([]);
    // Wait for the selected mask, then share its verified buffer instead of
    // reading the same large mask in two parallel jobs.
    if(activeEntry?.mask&&selected?.entry!==activeEntry){setOverlayStatus('Open or retry the selected structure before adding grouped masks.');return;}
    const controller=new AbortController();groupRequestRef.current=controller;setOverlayStatus(`Opening ${group.label} masks…`);
    loadHeadOverlayMasks(pkg,study,group.entries,selected?.entry===activeEntry?selected:null,controller.signal).then(values=>{if(!controller.signal.aborted&&groupRequestRef.current===controller){setGroupLayers(values);setOverlayStatus(`${values.length} distinct saved masks · partial boundaries retained`);}}).catch(reason=>{if(!controller.signal.aborted&&groupRequestRef.current===controller)setOverlayStatus(reason instanceof Error?reason.message:'The group could not be opened.');});
    return()=>{controller.abort();if(groupRequestRef.current===controller)groupRequestRef.current=null;};
  },[pkg,study,overlayGroup,quizActive,groups,activeEntry,selected]);
  useEffect(()=>{
    if(!study)return;
    const navigation=parseHeadImageNavigation(new URLSearchParams(window.location.search),HEAD_MANIFEST_SHA256,modality);
    resetIndexDetails();
    if(navigation.invalid||!navigation.conceptId){setActiveId('');setSelected(null);setQuery('');setFamily('All systems');return;}
    const match=resolveHeadConcept(study.definition.entries,navigation.conceptId,modality);
    const entry=study.definition.entries.find(candidate=>candidate===match);
    if(entry){setActiveId(entry.id);setQuery('');setFamily(entry.family);const pending=pendingHistoryRestoreRef.current;setExpanded(pending?.pkg===pkg&&pending.study===study&&pending.href===historyHref()?(pending.view.layout==='multiplanar'?null:pending.view.layout):'axial');setOverlay(true);setOverlayGroup('selected');}
    else{setActiveId('');setSelected(null);setNavigationNotice('This exact linked structure is unavailable in the loaded study. No structure has been substituted.');}
  },[study,modality,navigationEpoch]);
  useEffect(()=>{
    if(!quizActive||!practice.target?.focus||!study)return;
    const point=focusIJK(study,practice.target.focus),plane=expanded&&expanded!=='3d'?expanded:'axial';
    // Pick a valid target slice, but never give away a locate answer with its crosshair.
    const centre=[study.geometry.shapeKJI[2],study.geometry.shapeKJI[1],study.geometry.shapeKJI[0]].map(n=>Math.floor(n/2)) as Vec3;
    if(practice.outcome)setCursor(point);else {centre[study.geometry.views[plane].fixedAxisIJK]=point[study.geometry.views[plane].fixedAxisIJK];setCursor(centre);}
    if(expanded==='3d'||expanded===null)setExpanded('axial');
  },[quizActive,practice.target,practice.outcome,study]);
  useEffect(()=>{
    failedStudyRef.current=null;setStudyLoadFailed(false);
    viewMemoryReadyRef.current=false;
    resetIndexDetails();setStudy(null);setSelected(null);setActiveId('');setQuery('');setFamily('All systems');setLinkedOnly(false);setExpanded('axial');
    if(!pkg)return;const controller=new AbortController();studyRequestRef.current=controller;setStatus(`Opening ${modality} native image…`);setError('');
    loadHeadStudy(pkg,modality,controller.signal,progress=>{
      if(!controller.signal.aborted&&studyRequestRef.current===controller)setStatus(headStudyLoadingMessage(modality,progress));
    }).then(value=>{
      if(controller.signal.aborted)return;
      // Generic folder memory never sets a linked focus. Only an exact prior
      // ordinary history entry may restore its own native view on Back/Forward.
      const navigation=parseHeadImageNavigation(new URLSearchParams(window.location.search),HEAD_MANIFEST_SHA256,modality);
      const scope:HeadHistoryScope={pkg,study:value,modality,revision:HEAD_MANIFEST_SHA256};
      const href=historyHref();
      const restored=!navigation.invalid&&!navigation.position?headViewHistory.read(window.history.state,href,scope):null;
      pendingHistoryRestoreRef.current=restored?{pkg,study:value,href,view:restored}:null;
      const savedView=!restored&&!navigation.invalid&&!navigation.conceptId&&!navigation.position
        ?folderSession?.readView(pkg,modality,value.definition,HEAD_MANIFEST_SHA256):null;
      viewMemoryReadyRef.current=!!restored||!navigation.invalid&&!navigation.conceptId&&!navigation.position;
      setStudy(value);setCursor(restored?.cursor??savedView?.cursor??[value.geometry.shapeKJI[2],value.geometry.shapeKJI[1],value.geometry.shapeKJI[0]].map(n=>Math.floor(n/2)) as Vec3);
      const layout=restored?.layout??savedView?.layout;setExpanded(layout==='multiplanar'?null:layout??'axial');
      setWindowing(restored?.windowing??folderSession?.readWindow(pkg,modality,value.definition,HEAD_MANIFEST_SHA256)??initialWindow(modality,value.range));setStatus('');
    }).catch(reason=>{if(!controller.signal.aborted){failedStudyRef.current={pkg,modality};setStudyLoadFailed(true);setStatus('');setError(reason instanceof Error?reason.message:'The study could not be opened.');}});
    return()=>{controller.abort();if(studyRequestRef.current===controller)studyRequestRef.current=null;failedStudyRef.current=null;};
  },[pkg,modality,studyLoadAttempt,folderSession]);
  useEffect(()=>{
    if(retainFolder&&pkg&&study)folderSession?.keepWindow(pkg,modality,study.definition,HEAD_MANIFEST_SHA256,windowing);
  },[folderSession,retainFolder,pkg,study,modality,windowing]);
  useEffect(()=>{
    // Do not retain question positions/answers, tour progress, or an empty 3D
    // surface layout. The two scans retain independent native IJK coordinates.
    if(viewMemoryReadyRef.current&&retainFolder&&pkg&&study&&!quizActive&&rightPanel==='info'&&expanded!=='3d'){
      folderSession?.keepView(pkg,modality,study.definition,HEAD_MANIFEST_SHA256,{cursor,layout:expanded??'multiplanar'});
    }
  },[folderSession,retainFolder,pkg,study,modality,cursor,expanded,quizActive,rightPanel]);
  useEffect(()=>{rememberHistoryView();},[pkg,study,modality,cursor,expanded,windowing,quizActive,rightPanel]);
  function retryStudy(){
    const failed=failedStudyRef.current;
    if(!failed||failed.pkg!==pkg||failed.modality!==modality||study||packageOpening||quizActive)return;
    // Consume the failed attempt synchronously, including duplicate/stale clicks.
    failedStudyRef.current=null;setStudyLoadFailed(false);setError('');
    setStatus(`Opening ${modality} native image…`);
    // Configured lazy assets retain their package-lifetime cancellation signal.
    // Reusing an aborted package can never succeed, even with a fresh study
    // signal. Reverify the pinned manifest and acquire a new package instead.
    if(pkg?.source==='configured-local')void openConfiguredAtlas();
    else setStudyLoadAttempt(value=>value+1);
    // The retry button disappears; keep focus on a stable package action while
    // the existing live region announces progress and any further error.
    openButtonRef.current?.focus();
  }
  useEffect(()=>{
    setSelected(null);setFailedEntryId(null);if(!pkg||!study||quizActive){setStatus('');return;}if(!activeId){setStatus('');return;}
    const entry=study.definition.entries.find(item=>item.id===activeId);if(!entry)return;
    const controller=new AbortController();entryRequestRef.current=controller;setStatus(`Opening ${headLabel(entry)}…`);setError('');
    const reuseMask=groupLayers.find(layer=>canReuseHeadMask(pkg,study,entry,layer));
    loadHeadEntry(pkg,study,entry,controller.signal,reuseMask?{reuseMask}:undefined).then(value=>{if(controller.signal.aborted||entryRequestRef.current!==controller)return;setSelected(value);const pending=pendingHistoryRestoreRef.current;if(pending?.pkg===pkg&&pending.study===study&&pending.href===historyHref()&&!practiceRef.current.active){viewMemoryReadyRef.current=true;setCursor(pending.view.cursor);}else if(value.focus){viewMemoryReadyRef.current=true;setCursor(focusIJK(study,value.focus));}setStatus('');}).catch(reason=>{if(!controller.signal.aborted&&entryRequestRef.current===controller){structureRetryConsumedRef.current=false;setStatus('');setFailedEntryId(entry.id);setError(reason instanceof Error?reason.message:'The structure could not be opened.');}});
    return()=>{controller.abort();if(entryRequestRef.current===controller)entryRequestRef.current=null;};
  },[pkg,study,activeId,quizActive,entryLoadAttempt]);
  function retryStructure(){
    if(structureRetryContextRef.current!==structureRetryContext||structureRetryConsumedRef.current||!pkg||!study||quizActive||selected||!activeId||failedEntryId!==activeId)return;
    structureRetryConsumedRef.current=true;
    setError('');setFailedEntryId(null);setEntryLoadAttempt(value=>value+1);
    // Both side panels can be hidden in Focus images. The package action stays
    // visible in Structure, Guided learning, and image focus while retry loads.
    openButtonRef.current?.focus({preventScroll:true});
  }
  async function openConfiguredAtlas(automatic=false){
    const generation=++importGeneration.current;
    cancelPackageReads();
    if(!automatic)headViewHistory.clear();else if(pkg)headViewHistory.clearPackage(pkg);
    pendingHistoryRestoreRef.current=null;
    // Retire the old package before async verification. A failed reopen must
    // not leave a cancelled package masquerading as an opening/usable study.
    failedStudyRef.current=null;setStudyLoadFailed(false);
    setPackage(null);setStudy(null);setSelected(null);setActiveId('');setGroupLayers([]);
    const controller=new AbortController();configuredRequestRef.current=controller;
    setPackageOpening(true);setError('');setStatus('Opening the local approved atlas…');
    try{
      const {openConfiguredHeadPackage}=await import('../lib/head-local-source');
      if(controller.signal.aborted||generation!==importGeneration.current)return;
      const value=await openConfiguredHeadPackage(controller.signal);
      if(controller.signal.aborted||generation!==importGeneration.current)return;
      setLocalSourceState(value?'available':'unavailable');setPackage(value);setStatus('');
    }catch(reason){
      if(!controller.signal.aborted&&generation===importGeneration.current){setLocalSourceState('failed');setStatus('');setError(reason instanceof Error?reason.message:'The local atlas could not be opened.');}
    }finally{if(generation===importGeneration.current)setPackageOpening(false);}
  }
  useEffect(()=>{
    if(!pkg){
      if(['localhost','127.0.0.1','[::1]'].includes(window.location.hostname))void openConfiguredAtlas(true);
      else setLocalSourceState('unavailable');
    }
    return ()=>{importGeneration.current++;configuredRequestRef.current?.abort();};
    // One automatic attempt per mount; closing must not silently reopen scans.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  async function chooseFiles(event:ChangeEvent<HTMLInputElement>){
    const files=event.target.files?Array.from(event.target.files):[];if(!files.length)return;const generation=++importGeneration.current;
    cancelPackageReads();
    headViewHistory.clear();pendingHistoryRestoreRef.current=null;
    setLocalSourceState(previous=>headSourceAfterCancel(previous,window.location.hostname));
    folderSession?.clear();
    failedStudyRef.current=null;setStudyLoadFailed(false);
    setPackageOpening(true);setPackage(null);setStudy(null);setSelected(null);setError('');setStatus('Checking the approved package…');
    try{const value=await openLocalHeadPackage(files);if(generation===importGeneration.current){setPackage(value);if(retainFolder)folderSession?.keep(value,HEAD_MANIFEST_SHA256);}}catch(reason){if(generation===importGeneration.current){setStatus('');setError(reason instanceof Error?reason.message:'The selected folder could not be opened.');}}
    finally{if(generation===importGeneration.current)setPackageOpening(false);}
    event.target.value='';
  }
  function closeAtlas(){
    // Invalidate file verification before releasing component-held native data.
    // Closing never deletes source files or claims immediate browser heap erasure.
    importGeneration.current++;
    cancelPackageReads();
    headViewHistory.clear();pendingHistoryRestoreRef.current=null;
    setLocalSourceState(previous=>headSourceAfterCancel(previous,window.location.hostname));
    folderSession?.clear();setRetainFolder(false);
    failedStudyRef.current=null;setStudyLoadFailed(false);
    practice.end();setPackageOpening(false);setPackage(null);setStudy(null);setSelected(null);setActiveId('');
    resetIndexDetails();setQuery('');setFamily('All systems');setLinkedOnly(false);setExpanded('axial');setCursor([0,0,0]);
    setGroupLayers([]);setHiddenLayers(new Set());setLayerOpacity({});setOverlayGroup('selected');setGroupLabels(false);setOverlayOpacity(1);setOverlay(true);setRegionalCourse(true);setShowCrosshair(false);
    setPracticeOrigin(null);setLearningPosition(urlNavigation.position??{sequenceId:'brainstem',conceptId:null});setRightPanel(urlNavigation.position?'guided':'info');
    setStatus('');setError('');setOverlayStatus('');setNavigationNotice(urlNavigation.invalid?'This anatomy link is invalid or belongs to another source revision. No structure has been substituted.':'');
    openButtonRef.current?.focus();
  }
  function showLearningEntry(entry:HeadEntry){
    if(!study?.definition.entries.includes(entry))return;
    resetIndexDetails();
    setActiveId(entry.id);setQuery('');setFamily(entry.family);setExpanded('axial');setOverlay(true);setOverlayGroup('selected');
    setViewResetVersion(value=>value+1);
    // Re-showing the current entry does not rerun its async load effect.
    if(selected?.entry===entry&&selected.focus)setCursor(focusIJK(study,selected.focus));
  }
  function writeNavigation(conceptId:string|null,position:HeadLearningPosition|null){
    const href=headImageHref(modality,conceptId,position,HEAD_MANIFEST_SHA256);if(!href)return;
    rememberHistoryView();pendingHistoryRestoreRef.current=null;
    viewMemoryReadyRef.current=!conceptId&&!position;
    if(window.location.pathname+window.location.search+window.location.hash!==href)window.history.pushState(headViewHistory.freshExternalState(window.history.state),'',href);
    setUrlNavigation(parseHeadImageNavigation(new URL(href,window.location.origin).searchParams,HEAD_MANIFEST_SHA256,modality));setNavigationNotice('');
  }
  function browseCurrentAtlas(){
    // Recovery is an explicit fresh browse, never an automatic revision upgrade.
    if(practiceRef.current.active||!parseHeadImageNavigation(new URLSearchParams(window.location.search),HEAD_MANIFEST_SHA256,modality).invalid)return;
    setPracticeOrigin(null);setLinkedOnly(false);setRightPanel('info');
    setLearningPosition({sequenceId:'brainstem',conceptId:null});
    writeNavigation(null,null);setNavigationEpoch(value=>value+1);
    // The recovery button disappears; keep keyboard users at a useful control.
    selectionFocusRef.current=false;
    if(study)indexSearchRef.current?.focus({preventScroll:true});
    else openButtonRef.current?.focus({preventScroll:true});
  }
  function changeLearningPosition(position:HeadLearningPosition){
    setLearningPosition(position);writeNavigation(position.conceptId,position);
    const match=study&&position.conceptId?resolveHeadConcept(study.definition.entries,position.conceptId,modality):null;
    if(!match){resetIndexDetails();setActiveId('');setSelected(null);setGroupLayers([]);setOverlayGroup('selected');setQuery('');setFamily('All systems');}
  }
  function canStartGuidedPractice(){
    return guidedPracticeContextRef.current===guidedPracticeContext&&!guidedPracticeContext.consumed&&
      importGeneration.current===guidedPracticeContext.generation&&!practiceRef.current.active&&
      !packageOpening&&rightPanel==='guided'&&!!pkg&&!!study&&HEAD_LINK_REVISION===HEAD_MANIFEST_SHA256;
  }
  function startGuidedPractice(entry:HeadEntry){
    if(!canStartGuidedPractice()||!study)return;
    const step=headLearningSteps(study.definition.entries,learningPosition.sequenceId,modality,HEAD_MANIFEST_SHA256)
      .find(item=>item.conceptId===learningPosition.conceptId);
    if(step?.entry!==entry||!practiceEntries(study.definition.entries).includes(entry))return;
    guidedPracticeContext.consumed=true;
    if(!practice.startTarget(entry))return;
    writeNavigation(null,null);setPracticeOrigin({...learningPosition});setRightPanel('practice');
  }
  function startGuidedPracticeSequence(entries:HeadEntry[],mode:PracticeMode){
    if(!canStartGuidedPractice()||!study||!Array.isArray(entries)||
      (mode!=='locate'&&mode!=='label'&&mode!=='recall'))return;
    const eligible=new Set(practiceEntries(study.definition.entries));
    const expected=[...new Set(headLearningSteps(study.definition.entries,learningPosition.sequenceId,modality,HEAD_MANIFEST_SHA256)
      .flatMap(item=>item.entry&&eligible.has(item.entry)?[item.entry]:[]))];
    if(!expected.length||entries.length!==expected.length||entries.some((entry,index)=>entry!==expected[index]))return;
    guidedPracticeContext.consumed=true;
    if(!practice.startTargets(entries,mode))return;
    writeNavigation(null,null);setPracticeOrigin({...learningPosition});setRightPanel('practice');
  }
  function chooseStructure(entry:HeadEntry){
    selectionFocusRef.current=false;
    setActiveId(entry.id);setRightPanel('info');setPracticeOrigin(null);
    const link=HEAD_LINK_REVISION===HEAD_MANIFEST_SHA256?headAtlasConcept(entry,modality):null;writeNavigation(link?.conceptId??null,null);
  }
  function canReviewPracticeEntry(entry:HeadEntry){
    const current=practiceRef.current;
    return reviewContextRef.current===reviewContext&&importGeneration.current===reviewContext.generation&&
      !current.active&&current.finished&&!!study&&study.definition.entries.includes(entry)&&
      [...current.results,...(current.originalResults??[])].some(item=>item.entry===entry);
  }
  function reviewPracticeEntry(entry:HeadEntry){
    if(!canReviewPracticeEntry(entry)||!study)return;
    // Keep the completed set available while inspecting one of its source entries.
    // chooseStructure clears ordinary guided context; restore only this set's origin.
    chooseStructure(entry);setPracticeOrigin(practiceOrigin);
    showLearningEntry(entry);setLinkedOnly(false);selectionFocusRef.current=true;
    if(selected?.entry===entry&&selected.focus)setCursor(focusIJK(study,selected.focus));
  }
  function reviewPracticeGuide(position:HeadLearningPosition,entry:HeadEntry){
    if(!canReviewPracticeEntry(entry)||!study)return;
    const guide=headRelatedLearning(study.definition.entries,entry,modality,HEAD_MANIFEST_SHA256)
      .find(tour=>tour.position.sequenceId===position.sequenceId&&tour.position.conceptId===position.conceptId);
    if(!guide)return;
    // Read-only learning leaves first scores, original results and tour origin intact.
    setRightPanel('guided');changeLearningPosition(guide.position);showLearningEntry(entry);setLinkedOnly(false);
  }
  useEffect(()=>{
    if(selectionFocusRef.current&&rightPanel==='info'&&selected?.entry.id===activeId&&study?.definition.entries.includes(selected.entry)){selectionFocusRef.current=false;focusHeadLearningContent(structureHeadingRef.current);}
  },[rightPanel,selected,activeId,study]);
  useEffect(()=>{selectionFocusRef.current=false;},[study]);
  const activeConcept=activeEntry&&HEAD_LINK_REVISION===HEAD_MANIFEST_SHA256?headAtlasConcept(activeEntry,modality):null;
  const selectedPracticeEntry=!quizActive&&selected&&selected.entry===activeEntry&&practiceEntries(study?.definition.entries??[]).includes(selected.entry)?selected.entry:null;
  function practiseSelectedStructure(){
    if(!selectedPracticeEntry||!practice.startTarget(selectedPracticeEntry))return;
    setPracticeOrigin(null);writeNavigation(null,null);setRightPanel('practice');
  }
  function canUseStudySet(){
    return !!study&&!practiceRef.current.active&&!packageOpening&&reviewContextRef.current===reviewContext&&
      importGeneration.current===reviewContext.generation&&studySetRef.current===studySet;
  }
  function toggleStudyEntry(entry:HeadEntry){
    if(!canUseStudySet())return;
    setStudySet(previous=>toggleHeadStudySet(previous,study,HEAD_MANIFEST_SHA256,entry));
  }
  function moveStudyEntry(entry:HeadEntry,direction:-1|1){
    if(!canUseStudySet())return;
    setStudySet(previous=>previous===studySet?moveHeadStudySet(previous,study,HEAD_MANIFEST_SHA256,entry,direction):previous);
  }
  function restoreStudyPlan(plan:HeadStudyPlan){
    if(!canUseStudySet())return;
    const targets=resolveHeadStudyPlan(plan,study,HEAD_MANIFEST_SHA256,modality);
    if(!targets.length)return;
    setStudySet(previous=>appendHeadStudySet(previous,study,HEAD_MANIFEST_SHA256,targets));
  }
  function addTourStudyEntries(){
    if(!canUseStudySet()||rightPanel!=='guided'||tourStudyContextRef.current!==tourStudyContext)return;
    const additions=headTourStudyAdditions(studySet,study,HEAD_MANIFEST_SHA256,modality,learningPosition.sequenceId);
    if(!additions.targets.length)return;
    setStudySet(previous=>appendHeadStudySet(previous,study,HEAD_MANIFEST_SHA256,additions.targets));
  }
  const eligibleMissedEntries=new Set(practiceEntries(study?.definition.entries??[]));
  const missedResults=practice.results;
  const missedStudyEntries=!practice.active&&practice.finished?[...new Set(missedResults
    .filter(item=>['incorrect','revealed','unanswered'].includes(item.outcome)&&eligibleMissedEntries.has(item.entry)).map(item=>item.entry))]:[];
  const newMissedStudyEntries=missedStudyEntries.filter(entry=>!studySetEntries.includes(entry));
  const missedStudyAddCount=Math.min(newMissedStudyEntries.length,HEAD_STUDY_SET_LIMIT-studySetEntries.length);
  function addMissedStudyEntries(){
    if(!canUseStudySet()||!practiceRef.current.finished||!missedStudyAddCount||practiceRef.current.results!==missedResults)return;
    setStudySet(previous=>appendHeadStudySet(previous,study,HEAD_MANIFEST_SHA256,missedStudyEntries));
  }
  function addReviewedStudyEntries(targets:HeadEntry[],source:'current'|'original'){
    if(!canUseStudySet()||!practiceRef.current.finished||(source!=='current'&&source!=='original'))return false;
    const results=source==='original'?reviewContext.originalResults:reviewContext.results;
    if((source==='original'?practiceRef.current.originalResults:practiceRef.current.results)!==results)return false;
    const addition=appendHeadReviewStudySet(studySet,study,HEAD_MANIFEST_SHA256,results,targets);
    if(!addition)return false;
    // Reserve the exact resulting set immediately; a second old callback cannot
    // race this update or overwrite an intervening shortlist change.
    studySetRef.current=addition.state;
    setStudySet(addition.state);
    return addition.added;
  }
  function practiseStudySet(mode:PracticeMode,order:'shuffle'|'study-set'='shuffle'){
    if(!canUseStudySet())return;
    if(mode!=='locate'&&mode!=='label'&&mode!=='recall')return;
    if(order!=='shuffle'&&order!=='study-set')return;
    const targets=headStudySetEntries(studySet,study,HEAD_MANIFEST_SHA256);
    if(!targets.length||!practice.startTargets(order==='study-set'?targets:shuffled(targets),mode))return;
    setPracticeOrigin(null);writeNavigation(null,null);setRightPanel('practice');
  }
  function learnSelectedStructure(position:HeadLearningPosition){
    if(practiceRef.current.active||!study||!selected||selected.entry!==activeEntry)return;
    const valid=headRelatedLearning(study.definition.entries,selected.entry,modality,HEAD_MANIFEST_SHA256)
      .some(tour=>tour.position.sequenceId===position.sequenceId&&tour.position.conceptId===position.conceptId);
    if(!valid)return;
    setRightPanel('guided');changeLearningPosition(position);showLearningEntry(selected.entry);
  }
  function changeImageLayout(value:Plane|'multiplanar'|'3d'){
    if(!study||quizActive&&(value==='3d'||value==='multiplanar'))return;
    setExpanded(value==='multiplanar'?null:value);
    if(quizActive&&practice.target?.focus&&value!=='3d'&&value!=='multiplanar'){
      const point=focusIJK(study,practice.target.focus),next=[...cursor] as Vec3;
      next[study.geometry.views[value].fixedAxisIJK]=point[study.geometry.views[value].fixedAxisIJK];
      // Use the same guard as native slice navigation. A hidden old pick must
      // not survive a jump to another voxel; graded feedback stays unchanged.
      navigateCursor(next);
    }
  }
  function showPanel(panel:'info'|'guided'|'practice'){
    setRightPanel(panel);
    if(panel==='practice'&&practice.finished)writeNavigation(null,null);
    if(panel==='info')writeNavigation(activeConcept?.conceptId??null,null);
    if(panel==='guided'){
      // Re-entering a missing step must clear ordinary anatomy and grouped masks,
      // just like navigating to that gap within the guided panel.
      changeLearningPosition(learningPosition);
      const match=study&&learningPosition.conceptId?resolveHeadConcept(study.definition.entries,learningPosition.conceptId,modality):null;
      const entry=study?.definition.entries.find(candidate=>candidate===match);
      if(entry)showLearningEntry(entry);
    }
  }
  const comparisonPosition=quizActive?null:rightPanel==='guided'?learningPosition:rightPanel==='practice'&&practiceOrigin?practiceOrigin:!study?urlNavigation.position:null;
  const comparisonConcept=quizActive?null:comparisonPosition?comparisonPosition.conceptId:activeConcept?.conceptId??(!activeEntry?urlNavigation.conceptId:null);
  const otherModality=modality==='CT'?'MRI':'CT';
  const comparisonHref=headImageHref(otherModality,comparisonConcept,comparisonPosition,HEAD_MANIFEST_SHA256);
  const selectedComparisonHref=concept?headImageHref(otherModality,concept.conceptId,null,HEAD_MANIFEST_SHA256):null;
  const unlinkedComparison=!comparisonHref&&!!(comparisonConcept||comparisonPosition);
  const comparisonLabel=unlinkedComparison
    ?`Browse ${otherModality} head · leave ${comparisonPosition?'tour':'anatomy focus'}`
    :comparisonHref&&comparisonConcept
      ?`${study&&!activeEntry&&!comparisonPosition?'Try requested anatomy':'Continue '+(comparisonPosition?'this step':'this anatomy')} on ${otherModality}`
      :`Switch to ${otherModality} head`;
  function returnToLearning(){
    // Browsing another sequence after a set must not rewrite that set's origin.
    const origin=practiceOrigin,current=practiceRef.current;
    if(!origin||!study||current.active||!current.finished||
      reviewContextRef.current!==reviewContext||importGeneration.current!==reviewContext.generation)return;
    // Reading the originating tour is not a request to discard this session.
    // Results, original scores and follow-up review stay available in Results.
    setRightPanel('guided');
    changeLearningPosition(origin);
    const match=origin.conceptId?resolveHeadConcept(study.definition.entries,origin.conceptId,modality):null;
    const entry=study?.definition.entries.find(candidate=>candidate===match);
    if(entry)showLearningEntry(entry);
  }
  const families=useMemo(()=>['All systems',...new Set(study?.definition.entries.map(entry=>entry.family)||[])].sort(),[study]);
  const anatomyIndex=useMemo(()=>indexHeadAnatomy(study?.definition.entries??[],modality,HEAD_MANIFEST_SHA256),[study,modality]);
  const indexSides=useMemo(()=>[...new Set(anatomyIndex.map(({entry})=>entry.laterality??''))].sort(),[anatomyIndex]);
  const indexRepresentations=useMemo(()=>[...new Set(anatomyIndex.map(({entry})=>entry.representation??''))].sort(),[anatomyIndex]);
  const entries=useMemo(()=>filterHeadAnatomyIndex(anatomyIndex,{query,family,linkedOnly,side:indexSide,representation:indexRepresentation}),[anatomyIndex,query,family,linkedOnly,indexSide,indexRepresentation]);
  const linkedCount=anatomyIndex.filter(row=>row.concept!==null).length;
  const filtersActive=query!==''||family!=='All systems'||linkedOnly||indexSide!==undefined||indexRepresentation!==undefined;
  const filteredPracticeEntries=useMemo(()=>{
    // Intersect with the whole-study eligibility pool: a filter must not promote
    // a duplicate mask or alias whose canonical representative is hidden.
    const eligible=new Set(practiceEntries(study?.definition.entries??[]));
    return entries.map(row=>row.entry).filter(entry=>eligible.has(entry));
  },[entries,study]);
  const filteredStudyEntriesRef=useRef(filteredPracticeEntries);
  filteredStudyEntriesRef.current=filteredPracticeEntries;
  const newFilteredStudyEntries=filteredPracticeEntries.filter(entry=>!studySetEntries.includes(entry));
  const filteredStudyAddCount=Math.min(newFilteredStudyEntries.length,HEAD_STUDY_SET_LIMIT-studySetEntries.length);
  function addFilteredStudyEntries(){
    if(!canUseStudySet()||!filtersActive||!filteredStudyAddCount||filteredStudyEntriesRef.current!==filteredPracticeEntries)return;
    setStudySet(previous=>appendHeadStudySet(previous,study,HEAD_MANIFEST_SHA256,filteredPracticeEntries));
  }
  const filteredQuestionCount=filteredSetSize==='all'?filteredPracticeEntries.length:Math.min(Number(filteredSetSize),filteredPracticeEntries.length);
  function practiseFilteredStructures(){
    if(!study||practiceRef.current.active||!filtersActive||!filteredQuestionCount)return;
    // Sample only after explicit start; keep the index and whole-study identity pool intact.
    const targets=filteredQuestionCount<filteredPracticeEntries.length?shuffled(filteredPracticeEntries).slice(0,filteredQuestionCount):filteredPracticeEntries;
    if(!practice.startTargets(targets,filteredQuestionMode))return;
    setPracticeOrigin(null);writeNavigation(null,null);setRightPanel('practice');
  }
  // Layout identity must not carry the native scalar buffer into the UI shell.
  // Keep the token stable for browsing, but replace it for every loaded study.
  const imageFocusIdentity=useMemo(()=>study?{}:null,[study]);
  const count=modality==='CT'?355:117;
  const indexTabStop=headIndexTabStop(entries.map(row=>row.entry.id),indexFocus&&indexFocus.study===study?indexFocus.id:undefined,activeId);
  const sidebar=quizActive?<div className="head-atlas-sidebar head-index-paused"><h2>Practice in progress</h2><p>The anatomy index is hidden during questions so it cannot reveal the answer.</p><p>You can change slices, planes and display windows. The right panel contains your question and feedback.</p><button type="button" onClick={practice.finish}>End practice set</button></div>:<div className="head-atlas-sidebar" onKeyDown={headIndexKey}>
    <div className="head-index-heading"><h2>Structure index</h2><span>{study?.definition.entries.length??count}</span></div>
    {study&&<HeadAtlasStudySet entries={studySetEntries} filteredAdd={filtersActive?{count:filteredStudyAddCount,total:newFilteredStudyEntries.length,onAdd:addFilteredStudyEntries}:undefined} comparisons={headStudyComparisons(studySet,study,HEAD_MANIFEST_SHA256,modality)} onSelect={entry=>{
      if(!canUseStudySet()||!studySetEntries.includes(entry))return;
      chooseStructure(entry);showLearningEntry(entry);selectionFocusRef.current=true;
    }} onRemove={entry=>{if(studySetEntries.includes(entry))toggleStudyEntry(entry);}} onMove={moveStudyEntry} onClear={()=>{if(canUseStudySet())setStudySet(null);}} onPractice={practiseStudySet}
      savedPlan={<HeadAtlasSavedStudyPlan plan={createHeadStudyPlan(studySet,study,HEAD_MANIFEST_SHA256,modality)} entries={studySetEntries} study={study} modality={modality} canUse={canUseStudySet} onRestore={restoreStudyPlan}/>}/>}
    <label>Find a structure<input ref={indexSearchRef} data-head-index-search aria-controls="head-index-list" aria-describedby="head-index-keyboard-help" type="search" value={query} disabled={!study} onChange={event=>setQuery(event.target.value)} placeholder="Name, side or anatomical ID"/></label>
    <p id="head-index-keyboard-help" className="sr-only">The results use one Tab stop; Tab then continues to the image tools. From search, Down or Up enters the results. In results, arrow keys browse, Home and End reach the first and last result, Enter or Space selects, and Escape returns to search. Browsing alone does not select a structure.</p>
    <label>System<select disabled={!study} value={family} onChange={event=>setFamily(event.target.value)}>{families.map(name=><option key={name} value={name}>{familyNames[name]??name}</option>)}</select></label>
    <label className="head-linked-filter" title="Exact source-matched concepts in the existing 3D Atlas, not spatial registration"><input type="checkbox" checked={linkedOnly} disabled={!study||!linkedCount} onChange={event=>setLinkedOnly(event.target.checked)} aria-describedby={linkedOnly?'head-linked-scope':undefined}/><span>3D Atlas-linked only</span><small>{study?linkedCount:'—'}</small></label>
    {linkedOnly&&<p id="head-linked-scope">Concept comparison, not spatial registration. Other annotations remain available.</p>}
    <details className="head-overlay-settings" onKeyDown={headDisclosureKeyDown}><summary>More filters{indexSide!==undefined||indexRepresentation!==undefined?' · active':''}</summary>
      <label>Anatomical side<select disabled={!study} value={indexSide===undefined?'all':`side:${indexSide}`} onChange={event=>{const value=event.target.value;if(value==='all')setIndexSide(undefined);else if(value.startsWith('side:')&&indexSides.includes(value.slice(5)))setIndexSide(value.slice(5));}}><option value="all">All sides</option>{indexSides.map(value=><option key={value} value={`side:${value}`}>{headSideLabel(value)}</option>)}</select></label>
      <label>Annotation type<select disabled={!study} value={indexRepresentation===undefined?'all':`type:${indexRepresentation}`} onChange={event=>{const value=event.target.value;if(value==='all')setIndexRepresentation(undefined);else if(value.startsWith('type:')&&indexRepresentations.includes(value.slice(5)))setIndexRepresentation(value.slice(5));}}><option value="all">All annotation types</option>{indexRepresentations.map(value=><option key={value} value={`type:${value}`}>{headRepresentationLabel(value)}</option>)}</select></label>
      <p>Uses the annotation's declared side and type. A mask may cover only part of a structure; point and course locators are not scored in practice.</p>
    </details>
    {study&&<details className="head-overlay-settings" onKeyDown={headDisclosureKeyDown}><summary>Overlay groups</summary><label>Show masks<select value={overlayGroup} onChange={event=>{setOverlayGroup(event.target.value);setHiddenLayers(new Set());setOverlay(true);}}><option value="selected">Selected structure only</option>{groups.map(group=><option key={group.id} value={group.id}>{group.label} ({group.entries.length})</option>)}<option value="all">All available masks</option></select></label><label>Overlay strength<input aria-label="Overlay strength" type="range" min="0" max="1" step="0.05" value={overlayOpacity} onChange={event=>setOverlayOpacity(Number(event.target.value))}/></label><label className="head-overlay-check"><input type="checkbox" checked={groupLabels} onChange={event=>setGroupLabels(event.target.checked)}/> Label visible group (up to 12)</label><p role="status">{overlayStatus||'Only saved mask intersections are shown.'}</p>{groupLayers.length>0&&<details onKeyDown={headDisclosureKeyDown}><summary>Individual visibility &amp; opacity ({groupLayers.length})</summary><div className="head-overlay-list">{groupLayers.map(layer=><div key={layer.entry.id}><label className="head-overlay-check"><input type="checkbox" checked={!hiddenLayers.has(layer.entry.id)||layer.entry.id===activeId} disabled={layer.entry.id===activeId} onChange={()=>setHiddenLayers(previous=>{const next=new Set(previous);if(next.has(layer.entry.id))next.delete(layer.entry.id);else next.add(layer.entry.id);return next;})}/>{headLabel(layer.entry)}</label><input aria-label={`Opacity: ${headLabel(layer.entry)}`} type="range" min="0" max="1" step="0.05" value={layerOpacity[layer.entry.id]??1} onChange={event=>setLayerOpacity(previous=>({...previous,[layer.entry.id]:Number(event.target.value)}))}/></div>)}</div><p>The selected structure stays enabled. Clear selection to hide it; opacity can still be reduced.</p></details>}</details>}
    <div className="head-index-results"><p role="status" aria-live="polite" aria-atomic="true">{study?`${entries.length} / ${study.definition.entries.length} annotations`:'Open the approved package to search anatomy.'}</p>{study&&filtersActive&&<button type="button" onClick={()=>{resetIndexDetails();setQuery('');setFamily('All systems');setLinkedOnly(false);}}>Reset filters</button>}</div>
    {study&&filtersActive&&<details className="head-overlay-settings head-filtered-practice" onKeyDown={headDisclosureKeyDown}><summary>Practise these results ({filteredPracticeEntries.length} masks)</summary><div className="head-filtered-practice-options">
      <label>Filtered question style<select value={filteredQuestionMode} disabled={!filteredPracticeEntries.length} onChange={event=>{const mode=event.target.value;if(mode==='locate'||mode==='label'||mode==='recall')setFilteredQuestionMode(mode);}}><option value="locate">Find it on the scan</option><option value="label">Label the highlighted structure</option><option value="recall">Type the structure name</option></select></label>
      <label>Filtered set size<select value={filteredSetSize} disabled={!filteredPracticeEntries.length} onChange={event=>{const size=event.target.value;if(size==='1'||size==='5'||size==='10'||size==='all')setFilteredSetSize(size);}}><option value="1">1 question</option><option value="5">Up to 5 questions</option><option value="10">Up to 10 questions</option><option value="all">All results</option></select></label>
      <button type="button" disabled={!filteredQuestionCount} onClick={practiseFilteredStructures} title="Starts a new set from these results, randomly sampled when a smaller size is chosen. Only distinct saved masks are eligible; points and shared-geometry aliases are excluded.">{`${filteredQuestionMode==='locate'?'Find':filteredQuestionMode==='recall'?'Name':'Label'} filtered masks (${filteredQuestionCount}${filteredQuestionCount<filteredPracticeEntries.length?` of ${filteredPracticeEntries.length}`:''})`}</button>
    </div></details>}
    <div id="head-index-list" className="head-structure-list" role="group" aria-label="Structure results" data-head-index-list>{entries.map(({entry,concept})=><button data-head-index-entry aria-describedby="head-index-keyboard-help" key={entry.id} type="button" tabIndex={entry.id===indexTabStop?0:-1} onFocus={()=>{if(study)setIndexFocus({study,id:entry.id});}} aria-pressed={activeId===entry.id} onClick={()=>chooseStructure(entry)}><i style={{background:`rgb(${entry.color.map(v=>Math.round(v*255)).join(',')})`}}/><span>{headLabel(entry)}<small>{familyNames[entry.family]??entry.family}{entry.laterality?` · ${headSideLabel(entry.laterality)}`:''}{concept&&<em className="head-link-badge" title="Exact concept link to the existing 3D Atlas; not spatial registration"> · 3D Atlas link</em>}</small></span></button>)}{study&&!entries.length&&<p>No structures match these filters.</p>}</div>
  </div>;
  const structureInfo=<div className="head-selected-summary">
    <p className="head-panel-kicker">Selected structure</p>
    <span className="head-structure-id">{selected?.entry.id??'No structure selected'}</span>
    <h2 ref={structureHeadingRef} tabIndex={-1}>{selected?headLabel(selected.entry):'Choose a structure'}</h2>
    {selected&&<section className="head-structure-learning" aria-label="Learn this structure">
    <div className="structure-learning-heading"><h3>Learn this structure</h3></div>
    {/* Enter the independently built 3D runtime through a document navigation;
        reusing a client-router document can leave its new iframe on about:blank. */}
    {concept&&<div className="head-concept-links head-primary-comparison">{concept.atlasHref&&<><button type="button" aria-pressed={comparisonOpen} onClick={toggleInlineComparison}>{comparisonOpen?'Close side-by-side comparison':'Show beside 3D Atlas'}</button><p>Keep this scan open and compare {concept.label} with the existing anatomical model on this page.</p></>}<nav aria-label={`Compare ${concept.label}`}>{concept.atlasHref&&<a href={concept.atlasHref} target={preserveScanTab?'_blank':undefined} rel={preserveScanTab?'noopener noreferrer':undefined} aria-label={`Open ${concept.label} in the 3D Atlas${preserveScanTab?' (new tab)':''}`}>Full 3D Atlas{preserveScanTab?' ↗':''}</a>}{selectedComparisonHref&&<Link href={selectedComparisonHref} prefetch={false} aria-label={`Find ${concept.label} on ${modality==='CT'?'MRI':'CT'}`}>{modality==='CT'?'MRI':'CT'}</Link>}</nav>{!selectedComparisonHref&&<p className="head-learning-unavailable"><LearningResourceStatus status="unavailable"/> No exact {modality==='CT'?'MRI':'CT'} comparison is mapped.</p>}{concept.atlasHref&&preserveScanTab&&<p>Full 3D Atlas opens separately; side-by-side comparison stays here.</p>}{!concept.atlasHref&&<p className="head-learning-unavailable"><LearningResourceStatus status="unavailable"/> No exact 3D part is mapped for this annotation.</p>}<details onKeyDown={headDisclosureKeyDown}><summary>Comparison limits</summary><p>{concept.scopeNote}</p><p>Same anatomical concept, not spatially registered subjects.</p></details></div>}
    {selectedPracticeEntry&&<div className="head-study-set-action"><button type="button" aria-pressed={studySetEntries.includes(selectedPracticeEntry)} disabled={packageOpening||(!studySetEntries.includes(selectedPracticeEntry)&&studySetEntries.length>=HEAD_STUDY_SET_LIMIT)} onClick={()=>toggleStudyEntry(selectedPracticeEntry)}>{studySetEntries.includes(selectedPracticeEntry)?'Remove from study set':'Add to study set'}</button><p role="status">{studySetEntries.length} / {HEAD_STUDY_SET_LIMIT} in this scan’s study set{studySetEntries.length>=HEAD_STUDY_SET_LIMIT?' · remove an item before adding another.':'.'}</p></div>}
    {selected?.entry===activeEntry&&<div className="head-concept-links"><button type="button" disabled={!selectedPracticeEntry} onClick={practiseSelectedStructure}>Practise this structure</button><p>{selectedPracticeEntry?'Find it on this scan using its saved mask. Starts a new one-question set.':'A distinct saved mask is needed for practice. Points, curves and shared-geometry aliases are not scored.'}</p></div>}
    {study&&selected?.entry===activeEntry&&<HeadAtlasRelatedLearning entries={study.definition.entries} entry={selected.entry} modality={modality} revision={HEAD_MANIFEST_SHA256} onStart={learnSelectedStructure}/>}
    {concept&&<HeadAtlasTeaching key={concept.conceptId} conceptId={concept.conceptId} modality={modality} revision={HEAD_MANIFEST_SHA256}/>}
    {!concept&&<p className="head-learning-unavailable"><LearningResourceStatus status="unavailable"/> No exact linked 3D/CT/MRI learning resource is mapped for this annotation. Other scan tools remain available.</p>}
    <LearningStatusKey/>
    </section>}
    {!selected&&<p>{study?'Search the anatomy index, then select a structure to see its approved representation and source limits.':'The anatomy index and image controls become available when the approved scan has loaded.'}</p>}
    {selected&&<><dl><div><dt>System</dt><dd>{familyNames[selected.entry.family]??selected.entry.family}</dd></div><div><dt>Representation</dt><dd>{headRepresentationLabel(selected.entry.representation)}</dd></div><div><dt>Side</dt><dd>{headSideLabel(selected.entry.laterality)}</dd></div></dl><h3>Anatomical scope</h3><p>{String(selected.entry.source?.declared_scope??'Declared anatomical scope not supplied.')}</p>{selected.entry.source?.geometry_alias_of!=null&&<p>Shared geometry: {String(selected.entry.source.geometry_alias_of)}</p>}{Array.isArray(selected.entry.source?.flags)&&selected.entry.source.flags.length>0&&<details onKeyDown={headDisclosureKeyDown}><summary>Representation limits ({selected.entry.source.flags.length})</summary><p>{selected.entry.source.flags.map(String).join(' · ')}</p></details>}{selected.entry.supplementary_geometries?.map(part=><p key={part.part_id}>Regional centreline: {part.declared_scope}</p>)}<button type="button" onClick={()=>setExpanded('3d')}>Open selected structure in 3D scan view</button></>}
    {paired&&<div className="head-concept-links"><h3>Other side</h3><button type="button" onClick={()=>{chooseStructure(paired.entry);showLearningEntry(paired.entry);selectionFocusRef.current=true;}}>Show {paired.concept.label}</button><p>Same study · saved annotation, not mirrored anatomy.</p></div>}
    <div className="head-source-note"><h3>Study information</h3><p>Approved cosmetics v1.0.2 (display only) · {count} listed annotations.</p><details onKeyDown={headDisclosureKeyDown}><summary>Annotation count and review scope</summary><p>This is the package’s fixed modality inventory. Entries may be masks or point/curve locators; review each selected representation and declared anatomical scope above. The total does not establish complete boundaries, teaching approval or clinical sign-off.</p></details>{study?.geometry.oblique&&<p>Native oblique planes—not resampled anatomical-orthogonal views. Compound edge labels show the actual axis directions.</p>}<p>{modality==='CT'?'Unmodified CT native intensity':'MRI intensity is not HU'} · Slice labels appear only where the selected representation intersects the native plane.</p><p>CT and MRI are different subjects. The generic 3D reference is not registered to this study.</p><Link href="/atlas/head-neck-3d" prefetch={false} target={preserveScanTab?'_blank':undefined} rel={preserveScanTab?'noopener noreferrer':undefined}>Explore head &amp; neck in the 3D Atlas{preserveScanTab?' (new tab)':''}</Link></div>
  </div>;
const info=<><div className="head-right-tabs" role="group" aria-label="Right panel"><button type="button" aria-pressed={rightPanel==='info'&&!quizActive} disabled={quizActive} onClick={()=>showPanel('info')}>Structure</button><button type="button" aria-pressed={rightPanel==='guided'&&!quizActive} disabled={quizActive} onClick={()=>showPanel('guided')}>Guided learning</button><button type="button" aria-pressed={rightPanel==='practice'||quizActive} onClick={()=>showPanel('practice')}>{practice.finished&&!practice.active?'Results':'Practice'}</button></div>{rightPanel==='practice'||quizActive?<HeadAtlasPractice practice={practice} study={study} familyNames={familyNames} reviewContext={{modality,revision:HEAD_MANIFEST_SHA256,onSelect:reviewPracticeEntry,onReviewGuide:reviewPracticeGuide,
  missedStudySet:missedStudyEntries.length?{count:missedStudyAddCount,total:newMissedStudyEntries.length,onAdd:addMissedStudyEntries}:undefined,
  reviewStudySet:{entries:studySetEntries,onAdd:addReviewedStudyEntries}}}
  onStart={()=>{setPracticeOrigin(null);writeNavigation(null,null);}} onReturnToLearning={practiceOrigin?returnToLearning:undefined}/>:rightPanel==='guided'?<HeadAtlasGuidedLearning autoPlaying={tourPlaying} study={study} modality={modality} position={learningPosition} onPositionChange={changeLearningPosition} studySetAdd={{count:tourStudyAdditions.targets.length,total:tourStudyAdditions.entries.length,onAdd:addTourStudyEntries}} onSelect={showLearningEntry} onCompare={openGuidedComparison} comparisonReady={!!concept?.atlasHref&&selected?.entry===activeEntry&&concept.conceptId===learningPosition.conceptId} onPracticeSequence={startGuidedPracticeSequence} onPractice={startGuidedPractice}/>:structureInfo}</>;
  const toolbar=study?<>
    {rightPanel==='guided'&&!quizActive&&playbackStep&&<HeadTourPlayback key={`${modality}:${learningPosition.sequenceId}`} onPlayingChange={setTourPlaying} context={{identity:study,revision:HEAD_MANIFEST_SHA256,sequenceId:learningPosition.sequenceId,stepId:playbackStep.conceptId,index:playbackIndex,total:playbackSteps.length,nextId:playbackSteps[playbackIndex+1]?.conceptId??null,ready:playbackReady,blocked:playbackBlocked,onAdvance:advanceGuidedPlayback}} blockedReason={!playbackStep.entry?'Paused · this canonical step is unavailable.':failedEntryId===playbackStep.entry.id?'Paused · retry loading this structure.':comparisonOpen&&playbackBlocked?'Paused · matching 3D selection is unavailable.':undefined}/>}
    {comparisonOpen&&rightPanel==='guided'&&<HeadComparisonTour study={study} modality={modality} position={learningPosition} onNavigate={navigateComparisonTour} onFinish={finishComparisonTour}/>}
    {!quizActive&&<div className="head-inline-launch"><button ref={comparisonButtonRef} type="button" aria-pressed={comparisonOpen} disabled={!comparisonOpen&&!concept?.atlasHref} onClick={toggleInlineComparison}>{comparisonOpen?'Close 3D comparison':'Compare beside 3D Atlas'}</button>{!comparisonOpen&&!concept?.atlasHref&&<><span>Select a structure marked “3D Atlas link”.</span>{linkedCount>0&&<button type="button" onClick={findLinkedStructures}>Find linked structures ({linkedCount})</button>}</>}</div>}
    <div className="head-view-options" role="group" aria-label="Image layout">{([...planes,'multiplanar','3d'] as const).map(value=><button type="button" key={value} disabled={quizActive&&(value==='3d'||value==='multiplanar')} aria-pressed={value==='multiplanar'?expanded===null:expanded===value} onClick={()=>changeImageLayout(value)}>{value==='3d'?'3D scan view':value==='multiplanar'?'Multiplanar':value[0].toUpperCase()+value.slice(1)}</button>)}</div>
    <div className="head-window-controls">{!quizActive&&<label><input type="checkbox" checked={overlay} onChange={event=>setOverlay(event.target.checked)}/> Labels &amp; overlay</label>}{modality==='CT'&&<><button type="button" onClick={()=>setWindowing([40,80])}>Brain window</button><button type="button" onClick={()=>setWindowing([500,2500])}>Bone window</button></>}<details className="head-display-settings" onKeyDown={headDisclosureKeyDown}><summary>Display settings</summary><div><label><input type="checkbox" checked={showCrosshair} onChange={event=>setShowCrosshair(event.target.checked)}/> Crosshair localizer</label>{!quizActive&&!!selected?.entry.supplementary_geometries?.length&&<label><input type="checkbox" checked={regionalCourse} onChange={event=>setRegionalCourse(event.target.checked)}/> Regional centreline</label>}<label>Level<input aria-label={modality==='CT'?'CT native window level':'MRI display level (not HU)'} type="number" step={1} value={Math.round(windowing[0])} onChange={event=>{const v=event.target.valueAsNumber;if(Number.isFinite(v))setWindowing([v,windowing[1]]);}}/></label><label>Width<input aria-label={modality==='CT'?'CT native window width':'MRI display width (not HU)'} type="number" min={1} step={1} value={Math.round(windowing[1])} onChange={event=>{const v=event.target.valueAsNumber;if(Number.isFinite(v))setWindowing([windowing[0],Math.max(1,v)]);}}/></label><button type="button" disabled={!study} onClick={()=>{if(study)setWindowing(initialWindow(modality,study.range));}}>Reset window</button><p>Restores this study’s opening contrast without changing your slice or selection.</p></div></details>{!quizActive&&<button type="button" disabled={!activeId} onClick={()=>{setActiveId('');setSelected(null);setLearningPosition(previous=>({...previous,conceptId:null}));writeNavigation(null,null);}}>Clear selection</button>}</div>
  </>:undefined;
return <ImagingAtlasShell canFocusImages={!!study&&!quizActive&&rightPanel==='info'&&!comparisonOpen} imageFocusContext={imageFocusIdentity} comparison={comparisonOpen?(activeConcept?.atlasHref?<HeadAtlasInlineComparisonLoader scope={inlineComparison!} conceptId={activeConcept.conceptId} selectionReady={!!concept} revision={HEAD_MANIFEST_SHA256} modality={modality} onSelectConcept={selectComparisonConcept} onClose={closeComparison} onPlaybackStatus={reportPlaybackModel}/>:<section className="head-inline-comparison"><h2>3D Atlas comparison</h2><p>Select a loaded structure marked “3D Atlas link”. No model is substituted for an unmapped annotation.</p><button type="button" onClick={closeComparison}>Close comparison</button></section>):undefined}
  title={modality==='CT'?'CT head anatomy':'MRI head anatomy'} modality={modality==='CT'?'ct':'mri'} regionId="head-neck" headNavigation={{conceptId:comparisonConcept,position:comparisonPosition,revision:HEAD_MANIFEST_SHA256}} subtitle="Native images · source-bound anatomical annotations" notice={pkg?.source==='configured-local'?'Private local test · Read-only SSD source; no upload. CT and MRI are different subjects.':'Private local test · CT and MRI are different subjects. Files stay in this browser session; nothing is uploaded.'} actions={<><Link prefetch={false} href={comparisonHref??(otherModality==='CT'?'/atlas/ct-head':'/atlas/mri-head')} onClick={()=>rememberHistoryView()} title={unlinkedComparison?'No verified comparison for this context. Opens the general atlas without carrying the current focus.':undefined}>{comparisonLabel}</Link><button ref={openButtonRef} onClick={()=>inputRef.current?.click()} type="button">{pkg?'Change package':'Open approved atlas'}</button>{!pkg&&!packageOpening&&(localSourceState==='available'||localSourceState==='failed'||localSourceState==='paused')&&<button type="button" onClick={()=>void openConfiguredAtlas()}>{localSourceState==='failed'?'Retry local atlas':localSourceState==='paused'?'Resume local atlas':'Reopen local atlas'}</button>}{(pkg||packageOpening)&&<button type="button" onClick={closeAtlas} title="End this local session, including practice results. Original files are unchanged.">Close atlas</button>}{pkg&&pkg.source!=='configured-local'&&folderSession&&<HeadFolderSharing enabled={retainFolder} onChange={enabled=>{setRetainFolder(enabled);if(enabled)folderSession.keep(pkg,HEAD_MANIFEST_SHA256);else{headViewHistory.clearPackage(pkg);folderSession.clear();}}}/>}</>} sidebar={sidebar} info={info} infoLabel="Anatomy learning panel" toolbar={toolbar}>
    <input ref={inputRef} type="file" multiple {...{'webkitdirectory':''}} onChange={chooseFiles} className="head-folder-input" aria-label="Choose the prepared approved head atlas folder"/>
    {navigationNotice&&!quizActive&&<div className="head-atlas-error" role="status">{navigationNotice}{urlNavigation.invalid&&<><p>The embedded {modality} viewer is still available. Browse the current atlas to choose a structure or restart a tour, then use “Compare beside 3D Atlas”. This does not restore the outdated target.</p><button type="button" onClick={browseCurrentAtlas}>Browse current {modality} atlas</button></>}</div>}
    {(error||pkg&&!study&&!packageOpening&&!quizActive&&studyLoadFailed)&&<div className="head-atlas-error" role="alert">{error||'The native scan could not be opened.'}{pkg&&!study&&!packageOpening&&!quizActive&&studyLoadFailed&&<button type="button" onClick={retryStudy}>Retry opening scan</button>}{pkg&&study&&!quizActive&&!selected&&activeId&&failedEntryId===activeId&&<button type="button" onClick={retryStructure}>Retry opening structure</button>}</div>}
    <div className={`head-atlas-status${status&&!quizActive?' has-status':''}`} role="status" aria-live="polite">{quizActive?'':status}</div>
    {!study?renderHeadAtlasOpening({modality,count,packageOpening,hasPackage:!!pkg,sourceState:localSourceState,studyLoadFailed,error,busy:!!status,onChooseFolder:()=>inputRef.current?.click()}):<div className={`head-view-grid${expanded?' is-expanded':''}`} aria-label="Native image and selected surface">
          {planes.filter(plane=>!expanded||expanded===plane).map(plane=><div key={plane}><NativeSlice key={`${plane}:${practice.mode}:${quizActive?practice.target?.entry.id??'loading':'explore'}:${practice.outcome??'pending'}`} plane={plane} study={study} viewResetVersion={viewResetVersion} selected={sliceSelection} layers={visibleLayers} groupLabels={!quizActive&&groupLabels} opacity={quizActive?1:overlayOpacity} layerOpacity={displayLayerOpacity} cursor={cursor} windowing={windowing} onWindowing={setWindowing} overlay={quizActive?true:overlay} regionalCourse={quizActive?false:regionalCourse} showCrosshair={showCrosshair} onKeyboardMove={()=>setShowCrosshair(true)} showName={!hideAnswer} quizPick={quizActive?practice.pick:null} onAnswer={quizActive&&practice.mode==='locate'&&!practice.outcome&&practice.target?practice.acceptPick:undefined} onSelectMask={quizActive?undefined:chooseStructure} onCursor={navigateCursor} expanded={expanded===plane} allowPlayback={!quizActive&&expanded===plane} onExpand={quizActive?undefined:()=>setExpanded(expanded===plane?null:plane)}/></div>)}
          {!quizActive&&<section className="head-view head-surface-view" hidden={!!expanded&&expanded!=='3d'}><header><h2>Selected anatomy · 3D scan view</h2><button type="button" aria-pressed={expanded==='3d'} aria-label={`${expanded==='3d'?'Restore':'Enlarge'} selected anatomy 3D scan view`} onClick={()=>setExpanded(expanded==='3d'?null:'3d')}>{expanded==='3d'?'Restore':'Enlarge'}</button></header><div className="head-surface-area">{(!expanded||expanded==='3d')&&selected&&(selected.positions||selected.entry.points_ras_mm?.length||selected.entry.sampled_path_ras_mm?.length)?<HeadAtlasSurfaceLoader selected={selected} regionalCourse={regionalCourse} onPick={point=>setCursor(focusIJK(study,point))}/>:<p>Select a structure to rotate its approved surface or locator.</p>}</div><p className="head-surface-caption">{selected?headLabel(selected.entry):'Native study geometry'} · geometry from this scan, not the reference 3D Atlas</p></section>}
        </div>
    }
  </ImagingAtlasShell>;
}
