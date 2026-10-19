/** Native renderer lifecycle only; never changes a study, mask or selection. */
export function bindHeadSurfaceContext(
  canvas:HTMLCanvasElement,
  context:Pick<WebGLRenderingContext,'isContextLost'>,
  onState:(lost:boolean)=>void,
):()=>void {
  let active=true;
  const lost=(event:Event)=>{
    if(!active||event.target!==canvas)return;
    event.preventDefault();
    onState(true);
  };
  const restored=(event:Event)=>{
    if(!active||event.target!==canvas||context.isContextLost())return;
    onState(false);
  };
  canvas.addEventListener('webglcontextlost',lost);
  canvas.addEventListener('webglcontextrestored',restored);
  // Loss may precede the React effect; do not wait for another browser event.
  onState(context.isContextLost());
  return ()=>{
    active=false;
    canvas.removeEventListener('webglcontextlost',lost);
    canvas.removeEventListener('webglcontextrestored',restored);
  };
}
