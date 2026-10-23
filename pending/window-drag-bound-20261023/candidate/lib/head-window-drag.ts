export type HeadWindow = readonly [level:number,width:number];

/** Display contrast only; never rescale native voxels or change mask geometry. */
export function headWindowFromDrag(start:HeadWindow,dx:number,dy:number,size:{width:number;height:number}):[number,number]|null {
  if(![...start,dx,dy,size.width,size.height].every(Number.isFinite)||start[1]<=0||size.width<=0||size.height<=0)return null;
  const level=start[0]+dy*2*start[1]/size.height,width=Math.max(1,start[1]+dx*2*start[1]/size.width);
  return Number.isFinite(level)&&Number.isFinite(width)?[level,width]:null;
}

/** Right-button gesture, isolated from left-click selection and answer placement. */
export function bindHeadWindowDrag(element:HTMLElement,options:{getWindow:()=>HeadWindow;onChange:(value:[number,number])=>void},frames={
  request:(callback:FrameRequestCallback)=>requestAnimationFrame(callback),cancel:(id:number)=>cancelAnimationFrame(id),
}){
  let gesture:{id:number;x:number;y:number;window:HeadWindow;width:number;height:number}|null=null;
  let pending:[number,number]|null=null,frame:number|null=null,disposed=false,generation=0;
  const doc=element.ownerDocument,win=doc?.defaultView;
  const flush=(expected:number):void=>{
    if(disposed||expected!==generation)return;
    if(doc?.hidden){cancel();return;}
    frame=null;const value=pending;pending=null;if(value)options.onChange(value);
  };
  const cancel=():void=>{
    generation++;
    const id=gesture?.id;gesture=null;
    if(frame!==null)frames.cancel(frame);frame=null;pending=null;
    if(id!==undefined&&element.hasPointerCapture(id))element.releasePointerCapture(id);
  };
  const down=(event:PointerEvent)=>{
    if(event.button!==2||event.altKey||event.ctrlKey||event.metaKey||gesture||disposed||doc?.hidden)return;
    const bounds=(element.parentElement??element).getBoundingClientRect(),start=options.getWindow();
    if(!headWindowFromDrag(start,0,0,bounds))return;
    generation++;
    event.preventDefault();element.focus({preventScroll:true});
    element.setPointerCapture(event.pointerId);
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,window:[...start],width:bounds.width,height:bounds.height};
  };
  const move=(event:PointerEvent)=>{
    if(!gesture||event.pointerId!==gesture.id)return;
    if(!(event.buttons&2)||doc?.hidden){cancel();return;}
    event.preventDefault();
    const value=headWindowFromDrag(gesture.window,event.clientX-gesture.x,event.clientY-gesture.y,gesture);
    if(!value)return;pending=value;
    if(frame===null){const expected=generation;frame=frames.request(()=>flush(expected));}
  };
  const up=(event:PointerEvent)=>{
    if(!gesture||event.pointerId!==gesture.id)return;
    if(doc?.hidden){cancel();return;}
    event.preventDefault();const id=gesture.id,expected=generation;gesture=null;
    if(frame!==null)frames.cancel(frame);frame=null;flush(expected);
    if(generation===expected&&element.hasPointerCapture(id))element.releasePointerCapture(id);
  };
  const abandon=(event:PointerEvent)=>{if(gesture?.id===event.pointerId)cancel();};
  const menu=(event:MouseEvent)=>{if(!event.altKey&&!event.ctrlKey&&!event.metaKey)event.preventDefault();};
  const visibility=()=>{if(doc?.hidden)cancel();};
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);
  element.addEventListener('pointerup',up);element.addEventListener('pointercancel',abandon);
  element.addEventListener('lostpointercapture',abandon);element.addEventListener('contextmenu',menu);
  win?.addEventListener('blur',cancel);win?.addEventListener('pagehide',cancel);
  doc?.addEventListener('visibilitychange',visibility);
  return ()=>{
    disposed=true;const id=gesture?.id;cancel();
    element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);
    element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',abandon);
    element.removeEventListener('lostpointercapture',abandon);element.removeEventListener('contextmenu',menu);
    win?.removeEventListener('blur',cancel);win?.removeEventListener('pagehide',cancel);
    doc?.removeEventListener('visibilitychange',visibility);
    if(id!==undefined&&element.hasPointerCapture(id))element.releasePointerCapture(id);
  };
}
