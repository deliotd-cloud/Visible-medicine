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
  let pending:[number,number]|null=null,frame:number|null=null,disposed=false;
  const flush=()=>{frame=null;const value=pending;pending=null;if(value&&!disposed)options.onChange(value);};
  const cancel=()=>{
    const id=gesture?.id;gesture=null;
    if(frame!==null)frames.cancel(frame);frame=null;pending=null;
    if(id!==undefined&&element.hasPointerCapture(id))element.releasePointerCapture(id);
  };
  const down=(event:PointerEvent)=>{
    if(event.button!==2||event.altKey||event.ctrlKey||event.metaKey||gesture||disposed)return;
    const bounds=(element.parentElement??element).getBoundingClientRect(),start=options.getWindow();
    if(!headWindowFromDrag(start,0,0,bounds))return;
    event.preventDefault();element.focus({preventScroll:true});
    element.setPointerCapture(event.pointerId);
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,window:[...start],width:bounds.width,height:bounds.height};
  };
  const move=(event:PointerEvent)=>{
    if(!gesture||event.pointerId!==gesture.id)return;
    if(!(event.buttons&2)){cancel();return;}
    event.preventDefault();
    const value=headWindowFromDrag(gesture.window,event.clientX-gesture.x,event.clientY-gesture.y,gesture);
    if(!value)return;pending=value;
    if(frame===null)frame=frames.request(flush);
  };
  const up=(event:PointerEvent)=>{
    if(!gesture||event.pointerId!==gesture.id)return;
    event.preventDefault();const id=gesture.id;gesture=null;
    if(frame!==null)frames.cancel(frame);frame=null;flush();
    if(element.hasPointerCapture(id))element.releasePointerCapture(id);
  };
  const abandon=(event:PointerEvent)=>{if(gesture?.id===event.pointerId)cancel();};
  const menu=(event:MouseEvent)=>{if(!event.altKey&&!event.ctrlKey&&!event.metaKey)event.preventDefault();};
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);
  element.addEventListener('pointerup',up);element.addEventListener('pointercancel',abandon);
  element.addEventListener('lostpointercapture',abandon);element.addEventListener('contextmenu',menu);
  return ()=>{
    disposed=true;const id=gesture?.id;cancel();
    element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);
    element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',abandon);
    element.removeEventListener('lostpointercapture',abandon);element.removeEventListener('contextmenu',menu);
    if(id!==undefined&&element.hasPointerCapture(id))element.releasePointerCapture(id);
  };
}
