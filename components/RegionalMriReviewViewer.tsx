'use client';

import {useEffect,useLayoutEffect,useMemo,useRef,useState,type ChangeEvent,type KeyboardEvent,type MouseEvent} from 'react';
import {bindSliceWheel} from '../lib/slice-wheel.mjs';
import {openLocalRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,
  type RegionalMriPackage,type RegionalLoadedSeries,type RegionalLoadedAnnotation,type RegionalAnnotation} from '../lib/regional-mri-package';
import {regionalMriFrame,regionalMriFocusSlice,type RegionalMriFrame} from '../lib/regional-mri-render';
import {regionalMri3dComparison,type Regional3dCatalogue} from '../lib/regional-mri-3d-comparison';
import {regionalMriInlineInspection,regionalMriInlineReferenceFamilyKey,regionalMriInlineCompatible,regionalMriInlineContextCurrent} from '../lib/regional-mri-inline-inspection';
import {regionalMriSpecimenHandoff} from '../lib/regional-mri-specimen-handoff';
import {regionalMriBodyHandoff} from '../lib/regional-mri-body-handoff';
import {isCurrentRegionalMriBodySelection} from '../lib/regional-mri-body-focus';
import type {RegionalMriReferenceSelection} from '../lib/regional-mri-reference-selection';
import {regionalMriGuides,regionalMriGuideAnnotation,type RegionalStudyGuide} from '../lib/regional-mri-guided-study';
import {createRegionalMriStructureCheck,createRegionalMriLocationCheck,type RegionalMriStructureCheck as StructureCheck,type RegionalMriLocationCheck as LocationCheck} from '../lib/regional-mri-structure-check';
import {regionalMriNextPracticeCandidates} from '../lib/regional-mri-practice-next';
import {createRegionalMriGuidePracticeOrigin,resolveRegionalMriGuidePracticeOrigin,type RegionalMriGuidePracticeOrigin} from '../lib/regional-mri-guide-practice-origin';
import {RegionalMriStructureCheck,type RegionalMriPracticeMode,type RegionalMriLocationPick} from './RegionalMriStructureCheck';
import {RegionalMriPracticeFollowup} from './RegionalMriPracticeFollowup';
import {RegionalMriInlineInspection} from './RegionalMriInlineInspection';
import {RegionalMriCorrectionPanel} from './RegionalMriCorrectionPanel';
import {RegionalMriLearning} from './RegionalMriLearning';
import {RegionalMriGuidePlayback} from './RegionalMriGuidePlayback';
import type {Plane} from '../lib/head-atlas-geometry.mjs';
import './regional-mri-review.css';

export type RegionalMriReviewSource={revision:string;label:string;region:string};
type ReferenceSelection={study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation;catalogue:Regional3dCatalogue|null;targetId:string};
type PracticeSelection={check:StructureCheck|null;location:LocationCheck|null;mode:RegionalMriPracticeMode;answerVisible:boolean;pkg:RegionalMriPackage;study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation;origin:RegionalMriGuidePracticeOrigin|null};
type GuidePosition={guide:RegionalStudyGuide;index:number};
type GuideFocusRequest={action:number;pkg:RegionalMriPackage;study:RegionalLoadedSeries;position:GuidePosition;overlay:RegionalLoadedAnnotation|null;settled:boolean;focus?:boolean};
type GuideReturn={practice:PracticeSelection;position:GuidePosition;request:GuideFocusRequest;action:number;overlay:RegionalLoadedAnnotation|null;view:{plane:Plane;slice:number;opacity:number;showOverlay:boolean}};
const HASH=/^[a-f0-9]{64}$/;
const PLANES:Plane[]=['axial','coronal','sagittal'];
const validText=(value:unknown)=>typeof value==='string'&&!!value.trim()&&value.length<=160&&!/[\u0000-\u001f\u007f]/.test(value);
const message=(error:unknown)=>error instanceof Error?error.message:'The local regional package could not be read.';
const clamp=(value:number,count:number)=>Math.max(0,Math.min(count-1,Math.round(value)));

/** The parent supplies the independently verified pin; this component never accepts a pin from local files. */
export function RegionalMriReviewViewer({source,comparisons=null,correctionProjectionRevision=null}:{source:RegionalMriReviewSource|null;comparisons?:Regional3dCatalogue|null;correctionProjectionRevision?:string|null}){
  const validSource=source&&typeof source.revision==='string'&&HASH.test(source.revision)&&validText(source.label)&&validText(source.region)?source:null;
  const correctionRevision=typeof correctionProjectionRevision==='string'&&HASH.test(correctionProjectionRevision)?correctionProjectionRevision:null;
  const incoming={source:validSource,comparisons,correctionRevision,key:JSON.stringify([validSource?.revision,validSource?.region,validSource?.label,correctionRevision])};
  const [held,setHeld]=useState(incoming),[dirty,setDirty]=useState(false);
  const dirtyRef=useRef(false),renders=useRef(0),committed=useRef(0),token=++renders.current;
  const pending=held.key!==incoming.key,retained=pending&&dirty,effective=retained?held:incoming;
  useLayoutEffect(()=>{committed.current=token;if(pending&&!dirtyRef.current)setHeld(incoming);});
  const dirtyChanged=(value:boolean)=>{dirtyRef.current=value;setDirty(value);};
  const discardRetained=()=>{if(committed.current!==token)return;dirtyChanged(false);setHeld(incoming);};
  if(!effective.source){
    return <section className="regional-mri-review regional-mri-review--locked" aria-label="Regional MRI private review">
      <h2>Regional MRI private review</h2><p>No independently bound regional source revision is available. Local loading is disabled.</p>
    </section>;
  }
  return <RegionalMriReviewSession key={effective.key} source={effective.source} comparisons={effective.comparisons} correctionRevision={effective.correctionRevision}
    sourceRetired={retained} onCorrectionDirty={dirtyChanged} onDiscardRetained={discardRetained}/>;
}

function RegionalMriReviewSession({source,comparisons,correctionRevision,sourceRetired,onCorrectionDirty,onDiscardRetained}:{source:RegionalMriReviewSource;comparisons:Regional3dCatalogue|null;correctionRevision:string|null;sourceRetired:boolean;onCorrectionDirty:(value:boolean)=>void;onDiscardRetained:()=>void}){
  const [pkg,setPkg]=useState<RegionalMriPackage|null>(null);
  const [study,setStudy]=useState<RegionalLoadedSeries|null>(null);
  const [overlay,setOverlay]=useState<RegionalLoadedAnnotation|null>(null);
  const [seriesId,setSeriesId]=useState('');
  const [annotationId,setAnnotationId]=useState('');
  const [plane,setPlane]=useState<Plane>('axial');
  const [slice,setSlice]=useState(0);
  const [center,setCenter]=useState(0);
  const [width,setWidth]=useState(1);
  const [opacity,setOpacity]=useState(.55);
  const [showOverlay,setShowOverlay]=useState(true);
  const [inspectProvisional,setInspectProvisional]=useState(false);
  const [query,setQuery]=useState('');
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [fit,setFit]=useState({width:640,height:480});
  const [reference,setReference]=useState<ReferenceSelection|null>(null);
  const referenceIntent=useRef<ReferenceSelection|null>(null);
  const updateReference=(next:ReferenceSelection|null)=>{referenceIntent.current=next;setReference(next);};
  const [guidePosition,setGuidePosition]=useState<GuidePosition|null>(null);
  const [practice,setPractice]=useState<PracticeSelection|null>(null);
  const [guideReturn,setGuideReturn]=useState<GuideReturn|null>(null);
  const [locationPick,setLocationPick]=useState<RegionalMriLocationPick|null>(null);
  const [pointer,setPointer]=useState<{frame:RegionalMriFrame;x:number;y:number}|null>(null);
  const pickSequence=useRef(0);
  const [painted,setPainted]=useState<{study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation|null;plane:Plane;slice:number;center:number;width:number;opacity:number;showOverlay:boolean}|null>(null);
  const guides=useMemo(()=>pkg&&study?regionalMriGuides(pkg,study):[],[pkg,study]);
  const availableCheck=useMemo(()=>pkg&&study&&overlay?createRegionalMriStructureCheck(pkg,study,overlay):null,[pkg,study,overlay]);
  const availableLocation=useMemo(()=>pkg&&study&&overlay?createRegionalMriLocationCheck(pkg,study,overlay):null,[pkg,study,overlay]);
  const activePractice=practice&&practice.pkg===pkg&&practice.study===study&&
    (practice.overlay===overlay||guideReturn?.practice===practice&&guideReturn.overlay===overlay)?practice:null;
  const nextPracticeCandidates=useMemo(()=>activePractice?regionalMriNextPracticeCandidates(activePractice.pkg,activePractice.study,activePractice.overlay,activePractice.mode):[],[activePractice]);
  const locateActive=activePractice?.mode==='locate'&&!activePractice.answerVisible;
  const effectiveOpacity=locateActive?0:opacity;
  const comparisonDetails=useRef<HTMLDetailsElement>(null);
  const referenceLauncher=useRef<HTMLButtonElement|null>(null);
  const returnFocus=useRef<{action:number;study:RegionalLoadedSeries|null;launcher:HTMLButtonElement|null}|null>(null);
  const search=useRef<HTMLInputElement>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const guideHeading=useRef<HTMLHeadingElement>(null);
  const guideFocus=useRef<GuideFocusRequest|null>(null);
  const guidePlaybackPause=useRef<(()=>void)|null>(null);
  const picker=useRef<HTMLInputElement>(null);
  const canvas=useRef<HTMLCanvasElement>(null);
  const viewport=useRef<HTMLDivElement>(null);
  const epoch=useRef(0);
  const actionEpoch=useRef(0);
  const renderCounter=useRef(0);
  const committed=useRef<{token:number;action:number;study:RegionalLoadedSeries|null;pkg:RegionalMriPackage|null;overlay:RegionalLoadedAnnotation|null;
    catalogue:Regional3dCatalogue|null;plane:Plane;slice:number;count:number;retired:boolean}|null>(null);
  const controller=useRef<AbortController|null>(null);
  const alive=useRef(true);
  const correctionDirty=useRef(false);
  const count=study?.geometry.views[plane].sliceCount??0;
  const renderToken=++renderCounter.current;
  const actionable=()=>!sourceRetired&&alive.current&&committed.current?.token===renderToken&&committed.current.action===actionEpoch.current;

  useLayoutEffect(()=>{committed.current={token:renderToken,action:actionEpoch.current,study,pkg,overlay,catalogue:comparisons,plane,slice,count,retired:sourceRetired};});
  useLayoutEffect(()=>{
    const requested=returnFocus.current;
    if(!requested||reference)return;
    returnFocus.current=null;
    if(!actionable()||requested.action!==actionEpoch.current||requested.study!==study)return;
    const details=comparisonDetails.current;
    if(requested.launcher?.isConnected){
      if(details?.isConnected&&details.contains(requested.launcher))details.open=true;
      requested.launcher.focus({preventScroll:true});return;
    }
    const summary=details?.querySelector<HTMLElement>('summary');
    if(details?.isConnected&&summary?.isConnected){details.open=true;summary.focus({preventScroll:true});return;}
    if(search.current?.isConnected){search.current.focus({preventScroll:true});return;}
    if(heading.current?.isConnected)heading.current.focus({preventScroll:true});
  });

  const retire=(retireActions=true)=>{guideFocus.current=null;epoch.current++;if(retireActions){actionEpoch.current++;setPractice(null);setGuideReturn(null);setLocationPick(null);setPointer(null);}controller.current?.abort();controller.current=null;};
  const start=()=>{retire();controller.current=new AbortController();return{token:epoch.current,signal:controller.current.signal};};
  const current=(token:number)=>alive.current&&token===epoch.current;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;committed.current=null;retire(false);};},[]);
  useEffect(()=>{
    if(typeof document==='undefined')return;
    // A later deliberate focus move owns the keyboard. Disabled controls may
    // blur to body during loading; that alone is not a new focus destination.
    const cancel=(event:FocusEvent)=>{if(event.target!==document.body)guideFocus.current=null;};
    document.addEventListener('focusin',cancel);
    return()=>document.removeEventListener('focusin',cancel);
  },[]);
  const permitSourceChange=()=>{
    if(!actionable())return false;
    if(correctionDirty.current&&!window.confirm('This annotation has unsaved or unconfirmed correction edits. Stay here to save or compare history. Discard those edits and change the source selection?'))return false;
    correctionDirty.current=false;onCorrectionDirty(false);return true;
  };

  const clear=()=>{
    if(!permitSourceChange())return false;
    retire();setPkg(null);setStudy(null);setOverlay(null);setSeriesId('');setAnnotationId('');updateReference(null);setGuidePosition(null);
    setPlane('axial');setSlice(0);setCenter(0);setWidth(1);setOpacity(.55);setShowOverlay(true);
    setInspectProvisional(false);setQuery('');setBusy('');setError('');setNotice('');
    if(picker.current)picker.current.value='';
    return true;
  };
  const chooseFolder=async(event:ChangeEvent<HTMLInputElement>)=>{
    if(!actionable())return;
    const files=Array.from(event.currentTarget.files??[]);if(!clear())return;
    if(!files.length)return;
    const {token,signal}=start();setBusy('Verifying local package and exact source revision…');
    try{
      const opened=await openLocalRegionalMriPackage(files,source.revision,signal);
      if(!current(token))return;
      if(opened.manifest.region!==source.region)throw new Error('Package region differs from the bound source.');
      setPkg(opened);setNotice('Package verified locally. Choose a source sequence to inspect.');
    }catch(cause){if(current(token)&&!signal.aborted)setError(message(cause));}
    finally{if(current(token))setBusy('');}
  };
  const chooseSeries=async(next:string)=>{
    if(!permitSourceChange())return;
    const selected=pkg?.manifest.series.find(item=>item.id===next);
    retire();setSeriesId(next);setStudy(null);setOverlay(null);setAnnotationId('');setSlice(0);setBusy('');setError('');setNotice('');updateReference(null);setGuidePosition(null);
    setInspectProvisional(false);
    if(!pkg||!selected)return;
    const {token,signal}=start();setBusy(`Verifying ${selected.label}…`);
    try{
      const loaded=await loadRegionalMriSeries(pkg,next,signal);
      if(!current(token))return;
      setStudy(loaded);setCenter((loaded.range[0]+loaded.range[1])/2);setWidth(Math.max(1,loaded.range[1]-loaded.range[0]));
      setSlice(Math.floor(loaded.geometry.views[plane].sliceCount/2));setNotice('Sequence verified. Select an annotation explicitly to display its scoped geometry.');
    }catch(cause){if(current(token)&&!signal.aborted)setError(message(cause));}
    finally{if(current(token))setBusy('');}
  };
  const chooseAnnotation=async(annotation:RegionalAnnotation,guided?:{guide:RegionalStudyGuide;index:number;automatic?:boolean},modelSelection?:RegionalMriReferenceSelection)=>{
    const modelHandoff=modelSelection?resolveModelSelection(modelSelection):null;
    if(modelSelection&&modelHandoff?.annotation!==annotation)return;
    if(guided&&(!pkg||!study||!guides.includes(guided.guide)||regionalMriGuideAnnotation(pkg,study,guided.guide,guided.index,annotation.id)!==annotation))return;
    if(!permitSourceChange())return;
    const previous=referenceIntent.current;
    const previousInspection=previous&&pkg&&study&&previous.study===study&&previous.catalogue===comparisons?
      regionalMriInlineInspection(source,comparisons,pkg,study,previous.overlay,previous.targetId):null;
    if((!guided&&!modelHandoff)||!previousInspection||!regionalMriInlineReferenceFamilyKey(previousInspection))updateReference(null);
    retire();setOverlay(null);setAnnotationId(annotation.id);setBusy('');setError('');setNotice('');setGuidePosition(guided??null);
    if(!pkg||!study||!study.series.annotations.includes(annotation))return;
    if(annotation.geometry.kind==='none'||annotation.review.status==='deferred')return;
    if(annotation.review.status==='provisional'&&!inspectProvisional)return;
    const {token,signal}=start();setBusy(`Verifying ${annotation.label}…`);
    const requested:GuideFocusRequest|null=guided?{action:actionEpoch.current,pkg,study,position:guided,overlay:null,settled:false,focus:!guided.automatic}:null;
    guideFocus.current=requested;
    try{
      const loaded=await loadRegionalMriAnnotation(pkg,study,annotation,signal,
        annotation.review.status==='provisional'?{inspectProvisional:true}:undefined);
      if(!current(token))return;
      const visible=committed.current;
      if((guided||modelHandoff)&&(!visible||visible.retired||visible.study!==study))return;
      if(modelHandoff&&(!previous||!previousInspection||visible!.pkg!==pkg||visible!.catalogue!==comparisons||
        !regionalMriInlineContextCurrent(previousInspection,source,comparisons,pkg,study,previous.overlay)))return;
      const focusTarget=guided||modelHandoff?regionalMriFocusSlice(study,loaded,visible!.plane):null;
      if(modelHandoff&&focusTarget===null)throw new Error('This saved annotation has no verified focus in the current native MRI view. No substitute is shown.');
      setOverlay(loaded);
      if(guided||modelHandoff){
        if(focusTarget!==null)setSlice(focusTarget);setShowOverlay(true);
        // Respect a close while MRI verification was pending. Never reopen from
        // an async closure or pick the first of several compatible references.
        const wanted=referenceIntent.current;
        if(wanted){
          const held=wanted.study===study&&wanted.catalogue===comparisons?
            regionalMriInlineInspection(source,comparisons,pkg,study,wanted.overlay,wanted.targetId):null;
          const next=regionalMri3dComparison(source,comparisons,pkg,study,loaded)?.targets
            .filter(candidate=>candidate.kind===held?.target.kind).map(candidate=>({candidate,proof:regionalMriInlineInspection(source,comparisons,pkg,study,loaded,candidate.id)}))
            .filter(item=>held&&item.proof&&(modelHandoff?item.candidate.id===modelHandoff.targetId:
              regionalMriInlineCompatible(held,item.proof)))??[];
          updateReference(next.length===1?{study,overlay:loaded,catalogue:comparisons,targetId:next[0].candidate.id}:null);
        }
      }
      setNotice(modelHandoff?'Showing the saved annotation for this named model selection in the current MRI sequence. Independent, unmirrored anatomy; not patient-space registration.':
        loaded.purpose==='provisional-inspection'?'Provisional geometry loaded for private inspection only.':'Accepted-scoped geometry loaded for private display.');
      if(requested&&guideFocus.current===requested){requested.overlay=loaded;requested.settled=true;}
    }catch(cause){if(guideFocus.current===requested)guideFocus.current=null;if(current(token)&&!signal.aborted){if(guided||modelHandoff)updateReference(null);setError(message(cause));}}
    finally{if(current(token))setBusy('');}
  };
  const moveGuide=(guide:RegionalStudyGuide,index:number)=>{
    if(!actionable()||!pkg||!study||!guides.includes(guide)||!Number.isSafeInteger(index)||!guide.steps[index])return;
    const candidates=guide.steps[index].candidates;
    const sole=candidates.length===1?regionalMriGuideAnnotation(pkg,study,guide,index,candidates[0].id):null;
    if(sole){void chooseAnnotation(sole,{guide,index});return;}
    if(!permitSourceChange())return;
    retire();setOverlay(null);setAnnotationId('');updateReference(null);setBusy('');setError('');setGuidePosition({guide,index});
    guideFocus.current={action:actionEpoch.current,pkg,study,position:{guide,index},overlay:null,settled:true};
    setNotice(candidates.length>1?'Choose an explicit source variant for this step.':'This step has no accepted-scoped geometry in this sequence. No substitute is loaded.');
  };
  const toggleInspection=(checked:boolean)=>{
    if(!permitSourceChange())return;
    retire();setInspectProvisional(checked);setOverlay(null);setAnnotationId('');setBusy('');setError('');updateReference(null);setGuidePosition(null);
    setNotice(checked?'Inspection-only mode: provisional geometry may be viewed, not approved or used for teaching.':'Provisional geometry withheld.');
  };
  const switchPlane=(next:Plane)=>{
    if(!actionable()||next===plane)return;
    guideFocus.current=null;
    // A guided step stays at its own verified focus within this source sequence.
    // Ordinary browsing/practice must not acquire an automatic answer location.
    const guidedFocus=!busy&&!activePractice&&pkg&&study&&overlay?.purpose==='scoped-display'&&activeGuide&&
      regionalMriGuideAnnotation(pkg,study,activeGuide.guide,activeGuide.index,overlay.annotation.id)===overlay.annotation
      ?regionalMriFocusSlice(study,overlay,next):null;
    setPlane(next);
    if(study)setSlice(guidedFocus??Math.floor(study.geometry.views[next].sliceCount/2));
  };
  const moveSlice=(next:number)=>{if(actionable()&&count){guideFocus.current=null;setSlice(clamp(next,count));}};
  const onSliceKey=(event:KeyboardEvent<HTMLDivElement>)=>{
    if(!actionable()||!count)return;
    const next=event.key==='ArrowRight'||event.key==='ArrowUp'?slice+1:
      event.key==='ArrowLeft'||event.key==='ArrowDown'?slice-1:
      event.key==='Home'?0:event.key==='End'?count-1:null;
    if(next!==null){event.preventDefault();event.stopPropagation();moveSlice(next);}
  };
  useEffect(()=>{
    const area=viewport.current;if(!area||!count)return;
    return bindSliceWheel(area,{getSlice:()=>committed.current?.slice??0,sliceCount:count,
      pagePixels:()=>area.clientHeight||320,onSlice:next=>{
        const active=committed.current;
        if(alive.current&&active&&!active.retired&&active.action===actionEpoch.current&&active.study===study&&active.plane===plane&&active.count===count){
          guideFocus.current=null;setSlice(clamp(next,active.count));}
      }});
  },[study,plane,count]);
  useEffect(()=>{
    const area=viewport.current;if(!area||!study)return;
    const measure=()=>setFit({width:Math.max(1,area.clientWidth),height:Math.max(1,area.clientHeight)});
    measure();
    if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(measure);observer.observe(area);return()=>observer.disconnect();
  },[study]);

  const result=useMemo(()=>{
    if(!study)return null;
    try{return{frame:regionalMriFrame(study,showOverlay?overlay:null,plane,clamp(slice,count),{center,width,opacity:effectiveOpacity}),error:''};}
    catch(cause){return{frame:null,error:message(cause)};}
  },[study,overlay,showOverlay,plane,slice,count,center,width,effectiveOpacity]);
  const frame=result?.frame;
  const cursor=frame&&pointer?.frame===frame?pointer:{x:Math.floor((frame?.width??1)/2),y:Math.floor((frame?.height??1)/2)};
  useLayoutEffect(()=>{
    const frame=result?.frame,element=canvas.current;if(!frame||!element||!study){setPainted(null);return;}
    const context=element.getContext('2d');if(!context){setPainted(null);return;}
    element.width=frame.width;element.height=frame.height;
    const image=context.createImageData(frame.width,frame.height);image.data.set(frame.pixels);context.putImageData(image,0,0);
    context.strokeStyle='#ffca61';context.fillStyle='#ffca61';context.lineWidth=2;
    for(const [start,end] of frame.segments){context.beginPath();context.moveTo(start.x,start.y);context.lineTo(end.x,end.y);context.stroke();}
    for(const point of frame.markers){context.beginPath();context.arc(point.x,point.y,Math.max(2,Math.min(frame.width,frame.height)/130),0,Math.PI*2);context.fill();}
    if(locateActive){context.strokeStyle='#f8cd68';context.lineWidth=1;context.beginPath();context.moveTo(cursor.x+.5-5,cursor.y+.5);context.lineTo(cursor.x+.5+5,cursor.y+.5);context.moveTo(cursor.x+.5,cursor.y+.5-5);context.lineTo(cursor.x+.5,cursor.y+.5+5);context.stroke();}
    setPainted({study,overlay,plane,slice,center,width,opacity:effectiveOpacity,showOverlay});
  },[result,locateActive,cursor.x,cursor.y]);
  const imageReady=!!frame&&painted?.study===study&&painted.overlay===overlay&&painted.plane===plane&&painted.slice===slice&&painted.center===center&&painted.width===width&&painted.opacity===effectiveOpacity&&painted.showOverlay===showOverlay;
  const annotationVisible=!!frame&&(frame.maskPixels>0||frame.markers.length>0||frame.segments.length>0);
  const availableWidth=Math.max(1,fit.width-56),availableHeight=Math.max(1,fit.height-44);
  const cssHeight=frame?Math.max(1,Math.min(availableHeight,availableWidth/frame.displayAspect)):0;
  const cssWidth=frame?cssHeight*frame.displayAspect:0;
  const matches=study?.series.annotations.filter(annotation=>`${annotation.label} ${annotation.anatomyId}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))??[];
  const selected=study?.series.annotations.find(annotation=>annotation.id===annotationId);
  const comparison=pkg&&study&&overlay?regionalMri3dComparison(source,comparisons,pkg,study,overlay):null;
  const activeGuide=guidePosition&&guides.includes(guidePosition.guide)?guidePosition:null;
  const guideStep=activeGuide?.guide.steps[activeGuide.index];
  const guideGeometry=!!guideStep&&!!overlay&&guideStep.candidates.includes(overlay.annotation)&&overlay.purpose==='scoped-display';
  const practiceOrigin=activePractice&&pkg&&study?resolveRegionalMriGuidePracticeOrigin(activePractice.origin,source,pkg,study,guides):null;
  useLayoutEffect(()=>{
    if(!guideReturn?.overlay||!actionable()||guideReturn.action!==actionEpoch.current||
      guideReturn.practice!==activePractice||guideReturn.overlay!==overlay||!imageReady||!pkg||!study)return;
    const origin=resolveRegionalMriGuidePracticeOrigin(guideReturn.practice.origin,source,pkg,study,guides);
    if(!origin||origin.guide!==guideReturn.position.guide||origin.index!==guideReturn.position.index||origin.annotation!==guideReturn.overlay.annotation)return;
    // Keep the previous question paused until the exact returned image has
    // actually been painted. Guide captions cannot appear in an undrawn return.
    setGuideReturn(null);setPractice(null);setGuidePosition(guideReturn.position);setBusy('');
    if(guideFocus.current===guideReturn.request){guideReturn.request.overlay=guideReturn.overlay;guideReturn.request.settled=true;}
    setNotice('Returned to the explicitly chosen guided step in this source sequence. No score, completion or approval is recorded.');
  });
  useLayoutEffect(()=>{
    const requested=guideFocus.current;if(!requested)return;
    if(!actionable()||requested.action!==actionEpoch.current||requested.pkg!==pkg||requested.study!==study){guideFocus.current=null;return;}
    if(!requested.settled||busy)return;
    if(activeGuide?.guide!==requested.position.guide||activeGuide.index!==requested.position.index){guideFocus.current=null;return;}
    if(error||result?.error||requested.overlay!==overlay||requested.overlay&&(!guideGeometry||
      regionalMriGuideAnnotation(requested.pkg,requested.study,requested.position.guide,requested.position.index,requested.overlay.annotation.id)!==requested.overlay.annotation)){
      guideFocus.current=null;return;
    }
    if(requested.overlay&&!imageReady)return;
    // Consume before focus (including focusin and Strict Mode effect replay).
    guideFocus.current=null;
    if(requested.focus!==false&&guideHeading.current?.isConnected)guideHeading.current.focus({preventScroll:true});
  });
  const inlineInspection=useMemo(()=>reference&&pkg&&study&&reference.study===study&&reference.catalogue===comparisons?
    regionalMriInlineInspection(source,comparisons,pkg,study,reference.overlay,reference.targetId):null,[reference,pkg,study,source,comparisons]);
  const referenceSuspended=sourceRetired||!!busy||reference?.overlay!==overlay;
  const resolveModelSelection=(selection:RegionalMriReferenceSelection)=>
    !referenceSuspended&&!activePractice&&imageReady&&pkg&&study&&overlay&&inlineInspection?
      isCurrentRegionalMriBodySelection(selection)?regionalMriBodyHandoff(source,comparisons,pkg,study,overlay,inlineInspection,selection):
      regionalMriSpecimenHandoff(source,comparisons,pkg,study,overlay,inlineInspection,selection):null;
  const showModelSelection=(selection:RegionalMriReferenceSelection)=>{
    if(!actionable())return;const requested=resolveModelSelection(selection);
    if(requested)void chooseAnnotation(requested.annotation,undefined,selection);
  };
  const closeReference=(closing:ReferenceSelection)=>{
    if(!actionable()||referenceIntent.current!==closing)return;
    guideFocus.current=null;
    returnFocus.current={action:actionEpoch.current,study,launcher:referenceLauncher.current};
    updateReference(null);
  };
  const canFocus=!!study&&!!overlay&&regionalMriFocusSlice(study,overlay,plane)!==null;
  const focus=()=>{if(actionable()&&study&&overlay){const target=regionalMriFocusSlice(study,overlay,plane);if(target!==null)moveSlice(target);}};
  const beginCheck=()=>{
    if((!availableCheck&&!availableLocation)||!pkg||!study||!overlay||busy||!permitSourceChange())return;
    const origin=createRegionalMriGuidePracticeOrigin(source,pkg,study,overlay,activeGuide);
    retire();updateReference(null);setGuidePosition(null);setShowOverlay(true);setOpacity(.55);
    const target=regionalMriFocusSlice(study,overlay,plane);if(target!==null)setSlice(target);
    setPractice({check:availableCheck,location:availableLocation,mode:availableCheck?'name':'locate',answerVisible:false,pkg,study,overlay,origin});setNotice('Private formative structure check. Identify or locate the explicitly selected saved annotation; no score or approval is recorded.');
  };
  const changePracticeMode=(mode:RegionalMriPracticeMode)=>{
    if(!actionable()||busy||!activePractice||mode===activePractice.mode||mode==='name'&&!activePractice.check||mode==='locate'&&!activePractice.location)return;
    updateReference(null);
    setPractice({...activePractice,mode,answerVisible:false});setLocationPick(null);setPointer(null);
  };
  const nextPractice=async()=>{
    if(!actionable()||busy||!activePractice||!pkg||!study||!overlay||!permitSourceChange())return;
    // Revalidate the current source at activation. Candidate metadata alone
    // never establishes display-valid geometry, focus or a usable question.
    const next=regionalMriNextPracticeCandidates(pkg,study,overlay,activePractice.mode)[0];
    if(!next)return;
    const heldPractice=activePractice,{token,signal}=start();
    setPractice(heldPractice);updateReference(null);setGuidePosition(null);
    setBusy('Verifying next practice target…');setError('');setNotice('');
    try{
      const loaded=await loadRegionalMriAnnotation(pkg,study,next,signal);
      if(!current(token))return;
      const visible=committed.current;
      if(!visible||visible.retired||visible.pkg!==pkg||visible.study!==study||visible.overlay!==overlay)return;
      const check=createRegionalMriStructureCheck(pkg,study,loaded),location=createRegionalMriLocationCheck(pkg,study,loaded);
      const target=regionalMriFocusSlice(study,loaded,visible.plane);
      if(loaded.annotation!==next||loaded.purpose!=='scoped-display'||target===null||
        (heldPractice.mode==='name'?!check:!location))throw new Error('Next practice geometry unavailable');
      setOverlay(loaded);setAnnotationId(next.id);setSlice(target);setShowOverlay(true);setOpacity(.55);setPainted(null);
      setPractice({check,location,mode:heldPractice.mode,answerVisible:false,pkg,study,overlay:loaded,origin:heldPractice.origin});
      setNotice('Another saved annotation in this sequence is ready for private formative practice. No score, progress, completion or approval is recorded.');
    }catch{
      if(current(token)&&!signal.aborted)setError('The next practice target could not be verified. The previous question is retained; return to inspection to choose an annotation explicitly. No substitute was loaded.');
    }finally{if(current(token))setBusy('');}
  };
  const returnToGuide=async()=>{
    if(!actionable()||busy||!activePractice||!pkg||!study||!overlay)return;
    const origin=resolveRegionalMriGuidePracticeOrigin(activePractice.origin,source,pkg,study,guides);
    if(!origin||!permitSourceChange())return;
    const held=activePractice,view={plane,slice,opacity,showOverlay},{token,signal}=start();
    const position={guide:origin.guide,index:origin.index};
    const requested:GuideFocusRequest={action:actionEpoch.current,pkg,study,position,overlay:null,settled:false};
    guideFocus.current=requested;setPractice(held);updateReference(null);setGuidePosition(null);
    setGuideReturn({practice:held,position,request:requested,action:actionEpoch.current,overlay:null,view});
    setBusy('Returning to guided step…');setError('');setNotice('');let drawing=false;
    try{
      const loaded=await loadRegionalMriAnnotation(pkg,study,origin.annotation,signal);
      if(!current(token))return;
      const visible=committed.current,next=resolveRegionalMriGuidePracticeOrigin(held.origin,source,pkg,study,guides);
      if(!visible||visible.retired||visible.pkg!==pkg||visible.study!==study||visible.overlay!==overlay)return;
      const target=regionalMriFocusSlice(study,loaded,visible.plane);
      if(!next||next.guide!==origin.guide||next.index!==origin.index||next.annotation!==origin.annotation||
        loaded.annotation!==origin.annotation||loaded.purpose!=='scoped-display'||target===null)throw new Error('Guided return geometry unavailable');
      drawing=true;setOverlay(loaded);setAnnotationId(origin.annotation.id);setSlice(target);setShowOverlay(true);setOpacity(.55);setPainted(null);
      setGuideReturn({practice:held,position,request:requested,action:actionEpoch.current,overlay:loaded,view});
    }catch{
      if(guideFocus.current===requested)guideFocus.current=null;
      if(current(token)&&!signal.aborted){setGuideReturn(null);setError('The guided step could not be verified. The current question is retained; no substitute was loaded.');}
    }finally{if(current(token)&&!drawing)setBusy('');}
  };
  const cancelGuideReturn=()=>{
    if(!actionable()||!guideReturn||guideReturn.practice!==activePractice||guideReturn.action!==actionEpoch.current)return;
    const held=guideReturn.practice,view=guideReturn.view;retire();setPractice(held);setOverlay(held.overlay);setAnnotationId(held.overlay.annotation.id);
    setPlane(view.plane);setSlice(view.slice);setOpacity(view.opacity);setShowOverlay(view.showOverlay);setPainted(null);
    setBusy('');setError('');setNotice('Return to guided learning cancelled. The previous practice question is retained.');
  };
  const pickPixel=(x:number,y:number)=>{
    if(!actionable()||!locateActive||!activePractice?.location||!frame||!imageReady||!annotationVisible||busy||!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||x<0||y<0||x>=frame.width||y>=frame.height)return;
    setPointer({frame,x,y});setLocationPick({check:activePractice.location,frame,plane,slice,x,y,nonce:++pickSequence.current});
  };
  const onImageClick=(event:MouseEvent<HTMLCanvasElement>)=>{
    if(!actionable()||!locateActive||!frame)return;
    const rect=event.currentTarget.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
    if(!Number.isFinite(rect.width)||!Number.isFinite(rect.height)||rect.width<=0||rect.height<=0||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=1||y>=1)return;
    pickPixel(Math.floor(x*frame.width),Math.floor(y*frame.height));
  };
  const onImageKey=(event:KeyboardEvent<HTMLCanvasElement>)=>{
    if(!actionable()||!locateActive||!frame)return;
    const amount=event.shiftKey?10:1,delta=event.key==='ArrowLeft'?[-amount,0]:event.key==='ArrowRight'?[amount,0]:event.key==='ArrowUp'?[0,-amount]:event.key==='ArrowDown'?[0,amount]:null;
    if(delta){event.preventDefault();event.stopPropagation();setPointer({frame,x:clamp(cursor.x+delta[0],frame.width),y:clamp(cursor.y+delta[1],frame.height)});}
    else if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();pickPixel(cursor.x,cursor.y);}
  };
  const changeCenter=(value:number)=>{if(actionable()&&Number.isFinite(value)){guideFocus.current=null;setCenter(value);}};
  const changeWidth=(value:number)=>{if(actionable()&&Number.isFinite(value)&&value>0){guideFocus.current=null;setWidth(value);}};
  const changeOpacity=(value:number)=>{if(actionable()&&Number.isFinite(value)&&value>=0&&value<=1){guideFocus.current=null;setOpacity(value);}};
  const changeVisibility=(value:boolean)=>{if(actionable()){guideFocus.current=null;setShowOverlay(value);}};
  const changeQuery=(value:string)=>{if(actionable()){guideFocus.current=null;setQuery(value);}};
  const interruptGuidePlayback=(event:{target:EventTarget|null})=>{
    if(event.target instanceof HTMLElement&&event.target.closest?.('[data-regional-guide-playback]'))return;
    guidePlaybackPause.current?.();
  };
  const advanceGuidePlayback=(next:number)=>{
    // Automatic playback never opens a confirmation prompt, selects a variant,
    // skips a missing step, changes sequences or announces an unpainted image.
    if(!actionable()||busy||error||result?.error||correctionDirty.current||activePractice||!pkg||!study||
      !activeGuide||!guideGeometry||!imageReady||!annotationVisible||!showOverlay||next!==activeGuide.index+1||
      regionalMriGuideAnnotation(pkg,study,activeGuide.guide,activeGuide.index,overlay!.annotation.id)!==overlay!.annotation)return false;
    const step=activeGuide.guide.steps[next],candidate=step?.candidates.length===1?
      regionalMriGuideAnnotation(pkg,study,activeGuide.guide,next,step.candidates[0].id):null;
    if(!candidate)return false;
    void chooseAnnotation(candidate,{guide:activeGuide.guide,index:next,automatic:true});return true;
  };

  return <section className="regional-mri-review" aria-label="Regional MRI private review"
    onPointerDownCapture={interruptGuidePlayback} onKeyDownCapture={interruptGuidePlayback}
    onWheelCapture={interruptGuidePlayback} onFocusCapture={interruptGuidePlayback}
    onClickCapture={interruptGuidePlayback} onChangeCapture={interruptGuidePlayback}>
    {sourceRetired&&<div role="alert"><p>The bound source changed. The previous source and unsaved correction are retained read-only for recovery, not current review. Copy your notes before discarding them. Saving and source controls are paused.</p>
      <button type="button" onClick={onDiscardRetained}>Discard retained edits and open current source</button></div>}
    <header className="regional-mri-review__header"><div><p className="regional-mri-review__eyebrow">Private Education inspection · not clinical</p>
      <h2 ref={heading} tabIndex={-1}>{source.label}</h2><p>Bound region: {source.region} · Exact source revision: <code>{source.revision}</code></p></div>
      <button type="button" onClick={clear} disabled={!pkg&&!busy&&!error}>Close and reset</button>
    </header>
    <p className="regional-mri-review__caution">Local files only. This is a source-scoped draft display, not approval, diagnosis, learner release, or cross-sequence registration.</p>
    <div className="regional-mri-review__controls">
      <label>Choose complete local folder <input ref={picker} type="file" multiple {...({webkitdirectory:''} as Record<string,string>)} onChange={chooseFolder} aria-label="Choose complete local regional MRI folder"/></label>
      {pkg&&<label>Source sequence <select aria-label="Source sequence" value={seriesId} onChange={event=>void chooseSeries(event.currentTarget.value)}>
        <option value="">Choose a sequence</option>{pkg.manifest.series.map(item=><option key={item.id} value={item.id}>{item.label} · {item.image.shape_kji.join(' × ')}</option>)}
      </select></label>}
    </div>
    {busy&&<p role="status">{busy}</p>}{error&&<p role="alert">{error}</p>}{notice&&!busy&&<p role="status">{notice}</p>}
    {study&&<div className={`regional-mri-review__layout${inlineInspection?' regional-mri-review__layout--comparing':''}`}>
      <div className="regional-mri-review__image-panel">
        <div className="regional-mri-review__planes" role="group" aria-label="Native slice plane">{PLANES.map(item=><button key={item} type="button" aria-pressed={plane===item} onClick={()=>switchPlane(item)}>{item}</button>)}</div>
        <div ref={viewport} className="regional-mri-review__viewport" tabIndex={0} onKeyDown={onSliceKey} aria-label={`${plane} source sequence slice viewport`}>
          {frame?<><span className="regional-mri-review__direction top">{frame.labels.top}</span><span className="regional-mri-review__direction left">{frame.labels.left}</span>
            <canvas ref={canvas} width={frame.width} height={frame.height} style={{width:`${cssWidth}px`,height:`${cssHeight}px`,aspectRatio:String(frame.displayAspect)}}
              role={locateActive?'button':'img'} tabIndex={locateActive?0:undefined} onClick={onImageClick} onKeyDown={onImageKey}
              aria-label={`${plane} slice ${slice+1} of ${count}; ${activePractice?(!imageReady?'annotation image pending':!annotationVisible?'no saved annotation visible on this slice':locateActive?`location check; answer overlay hidden; keyboard pointer column ${cursor.x+1}, row ${cursor.y+1}; use arrow keys then Enter`:'highlighted saved annotation'):selected?.label??'no annotation'}${locateActive?'':`; ${frame.maskPixels} mask display pixels`}`}/>
            <span className="regional-mri-review__direction right">{frame.labels.right}</span><span className="regional-mri-review__direction bottom">{frame.labels.bottom}</span></>:<p>{result?.error}</p>}
        </div>
        <div className="regional-mri-review__slice"><button type="button" aria-label="Previous slice" onClick={()=>moveSlice(slice-1)} disabled={slice<=0}>−</button>
          <label>Native {plane} slice {slice+1} / {count}<input type="range" min="0" max={Math.max(0,count-1)} value={slice} onChange={event=>moveSlice(Number(event.currentTarget.value))} aria-label="Native slice"/></label>
          <button type="button" aria-label="Next slice" onClick={()=>moveSlice(slice+1)} disabled={slice>=count-1}>+</button></div>
        <div className="regional-mri-review__window">
          <label>Window level <input type="number" value={center} step="any" onChange={event=>changeCenter(Number(event.currentTarget.value))}/></label>
          <label>Window width <input type="number" min="0.001" value={width} step="any" onChange={event=>changeWidth(Number(event.currentTarget.value))}/></label>
          <label>Overlay opacity <input type="range" min="0" max="1" step="0.05" value={effectiveOpacity} disabled={!!activePractice} onChange={event=>changeOpacity(Number(event.currentTarget.value))}/></label>
          <label><input type="checkbox" checked={activePractice?.mode==='locate'?activePractice.answerVisible:showOverlay} disabled={!!activePractice} onChange={event=>changeVisibility(event.currentTarget.checked)}/>{activePractice?.mode==='locate'?' Answer overlay · shown after correct answer or reveal':' Show selected geometry'}</label>
        </div>
        <p className="regional-mri-review__limits">{frame?.oblique?'Oblique source grid: native plane is sampled in source voxel axes.':'Native source voxel-axis view.'} {frame?.sampled?'Display raster downsampled for inspection.':'Display raster at native slice dimensions.'} Geometry is nearest-sampled only within this sequence; no cross-sequence overlay or patient-space registration.</p>
      </div>
      {inlineInspection&&reference&&<RegionalMriInlineInspection key={regionalMriInlineReferenceFamilyKey(inlineInspection)??inlineInspection.key}
        inspection={inlineInspection} suspended={referenceSuspended} onClose={()=>closeReference(reference)}
        getMriSelectionLabel={selection=>resolveModelSelection(selection)?.label??null} onSelectMri={showModelSelection}/>}
      <aside className="regional-mri-review__inventory">{activePractice&&pkg&&overlay?<><RegionalMriStructureCheck key={JSON.stringify([activePractice.check?.key,activePractice.location?.key,activePractice.mode])}
        check={activePractice.check} location={activePractice.location} mode={activePractice.mode} pick={locationPick} frame={frame??null} plane={plane} slice={slice}
        pkg={pkg} study={study} overlay={activePractice.overlay} retired={sourceRetired||!!busy} imageReady={imageReady} annotationVisible={annotationVisible}
        onModeChange={changePracticeMode} onShowAnswer={()=>{if(actionable()&&!busy&&activePractice.mode==='locate')setPractice({...activePractice,answerVisible:true});}}
        onNext={()=>void nextPractice()} nextAvailable={nextPracticeCandidates.length>0}
        onReturnToGuide={practiceOrigin&&!guideReturn?()=>void returnToGuide():undefined}
        onClose={()=>{if(actionable()&&!busy){setPractice(null);setLocationPick(null);setPointer(null);}}} onFocus={focus}
        followup={<RegionalMriPracticeFollowup source={source} catalogue={comparisons} pkg={pkg} study={study} overlay={overlay}
          retired={sourceRetired||!!busy||!imageReady||!annotationVisible} onInspect={(targetId,launcher)=>{
            if(!actionable()||!activePractice||activePractice.pkg!==pkg||activePractice.study!==study||activePractice.overlay!==overlay||busy||!imageReady||!annotationVisible
              ||!regionalMriInlineInspection(source,comparisons,pkg,study,overlay,targetId))return;
            referenceLauncher.current=launcher;updateReference({study,overlay,catalogue:comparisons,targetId});
          }}/>} />{guideReturn&&<button type="button" disabled={sourceRetired} onClick={cancelGuideReturn}>Cancel return to guide</button>}</>:<><h3>Source-scoped structures</h3>
        <p>{study.series.label} · {study.series.id} · {study.series.image.shape_kji.join(' × ')} · {study.series.image.dtype}</p>
        {guides.length>0&&<details className="regional-mri-review__guided" key={study.series.id}>
          <summary>Guided learning · this sequence</summary>
          <p>Private draft inspection paths. Teaching, MRI extent and 3D correspondence still need separate review. No diagnosis, completion score or learner approval.</p>
          <div className="regional-mri-review__guide-actions" role="group" aria-label="Choose a knee inspection path">{guides.map(guide=><button type="button" key={guide.id}
            aria-pressed={activeGuide?.guide===guide} disabled={!!busy||sourceRetired} onClick={()=>moveGuide(guide,0)}>{guide.title}</button>)}</div>
          {activeGuide&&guideStep&&<section aria-label="Current guided inspection step">
            <h4 ref={guideHeading} tabIndex={-1}>Step {activeGuide.index+1} / {activeGuide.guide.steps.length} · {guideStep.title}</h4>
            <p>{guideStep.caption}</p>
            <RegionalMriGuidePlayback key={JSON.stringify([activeGuide.guide.revision,activeGuide.guide.sourceRevision,activeGuide.guide.sequenceId,activeGuide.guide.imageSha256])}
              context={activeGuide.guide} step={activeGuide.index} total={activeGuide.guide.steps.length} caption={guideStep.caption}
              ready={!busy&&guideGeometry&&imageReady&&annotationVisible&&showOverlay}
              blocked={sourceRetired||correctionDirty.current||!!error||!!result?.error||!busy&&(!guideGeometry||!annotationVisible||!showOverlay)}
              pauseRef={guidePlaybackPause} onAdvance={advanceGuidePlayback}/>
            <p className="form-help">Optional timed inspection of this sequence only. Manual controls pause playback; missing or ambiguous steps need an explicit choice. No score, completion or patient-space registration is recorded.</p>
            <p role="status">{guideGeometry?'Saved geometry verified in this sequence; inspect its recorded coverage below.':
              !guideStep.candidates.length?'Missing in this sequence. No nearby structure or other sequence is substituted.':
              guideStep.candidates.length>1?'Multiple source variants. Choose explicitly; no variant is selected automatically.':'Geometry not verified for this step. Provisional or deferred geometry is withheld from guided teaching.'}</p>
            {guideStep.candidates.map(annotation=><div key={annotation.id}>
              <button type="button" disabled={!!busy||sourceRetired||!pkg||!regionalMriGuideAnnotation(pkg,study,activeGuide.guide,activeGuide.index,annotation.id)}
                aria-pressed={guideGeometry&&overlay?.annotation===annotation} onClick={()=>void chooseAnnotation(annotation,activeGuide)}>
                Inspect {annotation.label} in this sequence</button>
              <small>{annotation.laterality} · {annotation.coverage} coverage · {annotation.review.status} · {annotation.geometry.kind==='mask'?annotation.geometry.gridKind:annotation.geometry.kind} · {annotation.id}</small>
            </div>)}
            <div className="regional-mri-review__guide-actions" role="group" aria-label="Guided inspection navigation">
              <button type="button" disabled={!!busy||sourceRetired||activeGuide.index===0} onClick={()=>moveGuide(activeGuide.guide,activeGuide.index-1)}>Previous step</button>
              <button type="button" disabled={!!busy||sourceRetired||activeGuide.index===activeGuide.guide.steps.length-1} onClick={()=>moveGuide(activeGuide.guide,activeGuide.index+1)}>Next step</button>
              <button type="button" disabled={sourceRetired} onClick={()=>{
                if(!actionable())return;
                if(busy){retire();setBusy('');setOverlay(null);setAnnotationId('');updateReference(null);setNotice('Pending guided geometry load cancelled.');}
                setGuidePosition(null);
              }}>Leave guide</button>
            </div>
            {guideGeometry&&<button type="button" disabled={sourceRetired} onClick={()=>{
              if(!actionable()||!comparisonDetails.current)return;comparisonDetails.current.open=true;
              guideFocus.current=null;
              comparisonDetails.current.querySelector<HTMLElement>('summary')?.focus();
            }}>Show this step’s 3D reference options</button>}
            <details><summary>Draft teaching source &amp; exact context</summary>
              <p><a href={guideStep.source.href} target="_blank" rel="noopener noreferrer">{guideStep.source.title} ↗</a> · Primary cadaver research, not evidence of this MRI’s coverage or a clinical diagnostic rule.</p>
              <p>Teaching draft: <code>{activeGuide.guide.revision}</code><br/>MRI source: <code>{activeGuide.guide.sourceRevision}</code><br/>
                Sequence: <code>{activeGuide.guide.sequenceId}</code><br/>Image: <code>{activeGuide.guide.imageSha256}</code><br/>Concept: <code>{guideStep.anatomyId}</code></p>
              <p>Step focus uses saved geometry in the current native plane. Existing 3D references open on demand. Compatible specimen or same-side body steps can retain the model and request a named selection; only a fresh model report confirms that selection, not an MRI match or camera completion. No mirrored anatomy or patient-space registration is claimed. Leaving a guide does not approve or complete it.</p>
            </details>
          </section>}
        </details>}
        <label>Search structures <input ref={search} type="search" value={query} onChange={event=>changeQuery(event.currentTarget.value)} /></label>
        <label className="regional-mri-review__inspection"><input type="checkbox" checked={inspectProvisional} onChange={event=>toggleInspection(event.currentTarget.checked)}/> Inspect provisional geometry (private inspection only)</label>
        {inspectProvisional&&<p className="regional-mri-review__badge">INSPECTION ONLY · provisional is not accepted or learner-ready</p>}
        <ul>{matches.map(annotation=>{
          const unavailable=annotation.review.status==='deferred'||annotation.geometry.kind==='none'||annotation.review.status==='provisional'&&!inspectProvisional;
          return <li key={annotation.id}><button type="button" disabled={unavailable||!!busy} aria-pressed={annotationId===annotation.id&&!!overlay} onClick={()=>void chooseAnnotation(annotation)}>
            <span>{annotation.label}</span><small>{annotation.laterality} · {annotation.coverage} coverage · {annotation.review.status} · {annotation.geometry.kind==='mask'?annotation.geometry.gridKind:annotation.geometry.kind}</small>
          </button>{unavailable&&<small>{annotation.review.status==='provisional'?'Withheld until inspection mode':'No display geometry available'}</small>}</li>;
        })}</ul>{!matches.length&&<p>No structures match this search in the selected sequence.</p>}
        {selected&&<div className="regional-mri-review__scope"><h4>Selected source scope</h4><p>{selected.review.scope}</p><p>Review status: {selected.review.status} · Review revision: <code>{selected.review.revision}</code></p>
          <p>Coverage: {selected.coverage} · Geometry: {selected.geometry.kind==='mask'?selected.geometry.gridKind:selected.geometry.kind}
            {selected.geometry.kind==='mask'&&<> · Mapping revision: <code>{selected.geometry.mappingRevision}</code></>}</p>
          {overlay?.purpose==='provisional-inspection'&&<p className="regional-mri-review__badge">INSPECTION ONLY · not approved for learner display</p>}
          <button type="button" disabled={!canFocus} onClick={focus}>Jump to saved geometry focus in this sequence</button>
          {(availableCheck||availableLocation)&&<button type="button" disabled={!!busy||sourceRetired} onClick={beginCheck}>Try structure check</button>}
          {correctionRevision&&overlay&&overlay.annotation===selected&&<RegionalMriCorrectionPanel
            key={JSON.stringify([source.revision,correctionRevision,study.series.id,selected.id])}
            sourceRevision={source.revision} projectionRevision={correctionRevision} sequenceId={study.series.id} annotationId={selected.id}
            sourceRetired={sourceRetired} onDirtyChange={dirty=>{if(actionable()){correctionDirty.current=dirty;onCorrectionDirty(dirty);}}}/>} 
          {overlay&&<details key={selected.id} ref={comparisonDetails}>
            <summary>Compare in 3D · reference only</summary>
            <p>Draft semantic comparison with the existing 3D Atlas. A different anatomical reference, not spatially registered to this MRI. No scan, mask, coordinate or MRI identifier is sent in these links.</p>
            {comparison?<>
              {comparison.provisional&&<p className="regional-mri-review__badge">Provisional MRI source · private reference inspection only</p>}
              <ul>{comparison.targets.map(target=><li key={target.id}>
                <a href={target.href} target="_blank" rel="noopener noreferrer" onClick={event=>{if(!actionable())event.preventDefault();}}>{target.label} ↗</a>
                <button type="button" aria-controls="regional-mri-inline-reference" aria-expanded={inlineInspection?.target.id===target.id} aria-pressed={inlineInspection?.target.id===target.id} onClick={event=>{
                  if(actionable()&&study&&overlay){guideFocus.current=null;referenceLauncher.current=event.currentTarget;updateReference({study,overlay,catalogue:comparisons,targetId:target.id});}
                }}>Inspect {target.label} beside MRI</button>
                <small>{target.kind==='specimen'?'Right-sided detailed specimen (source-reported)':'Same-side body reference'}
                  {target.oppositeSide?' · opposite side to this MRI; not mirrored':' · '+target.side+' side'}</small>
                <p>{target.relation==='group-reference'?'Grouped surface only: the requested component is not separately segmented or selectable.':
                  target.relation==='parent-reference'?'Whole parent structure only: the requested subregion is not separately segmented or selectable.':'Same named structure only; correspondence and anatomical accuracy still require review.'}</p>
              </li>)}</ul>
              <p>Atlas source: <code>{comparison.atlasRevision}</code><br/>Draft mapping: <code>{comparison.mappingRevision}</code></p>
            </>:<p>No current source-bound 3D reference is available for this annotation. No nearby structure is substituted.</p>}
          </details>}
          {pkg&&comparison&&comparisons?.learning&&overlay&&overlay.annotation===selected&&overlay.purpose==='scoped-display'&&!sourceRetired&&!busy&&<RegionalMriLearning
            key={JSON.stringify([pkg.revision,study.series.id,selected.id,selected.review.revision,comparisons?.atlasRevision,comparisons?.mappingRevision])}
            source={source} catalogue={comparisons} pkg={pkg} study={study} overlay={overlay}/>}
        </div>}
      </>}</aside>
    </div>}
  </section>;
}
