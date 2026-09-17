export async function measureAtlasDraws(optionsJson) {
  const options=JSON.parse(optionsJson),canvas=document.querySelector('canvas');
  if(!canvas)throw Error('No rendered anatomy canvas');
  const gl=canvas.getContext('webgl2');if(!gl)throw Error('WebGL2 unavailable');
  const extension=gl.getExtension('WEBGL_multi_draw');
  const debug=gl.getExtension('WEBGL_debug_renderer_info');
  const originals=[],frames=[],latencies=[];
  let stamp=0,raf=0,active=true,pendingInput=null;
  function tick(t){stamp=t;if(active)raf=requestAnimationFrame(tick);}
  raf=requestAnimationFrame(tick);
  function record(method,count){
    const now=performance.now();let frame=frames.at(-1);
    if(!frame||frame.stamp!==stamp){frame={stamp,first:now,last:now,calls:0,subdraws:0,multidraw:0};frames.push(frame);}
    frame.last=now;frame.calls++;frame.subdraws+=count;
    if(method.startsWith('multi'))frame.multidraw++;
    if(pendingInput!==null){latencies.push(now-pendingInput);pendingInput=null;}
  }
  function wrap(object,name,count){
    const fn=object?.[name];if(typeof fn!=='function')return;
    originals.push([object,name,fn]);
    object[name]=function(...args){record(name,count?Number(args.at(-1)):1);return fn.apply(this,args);};
  }
  for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced'])wrap(gl,name,false);
  for(const name of ['multiDrawArraysWEBGL','multiDrawElementsWEBGL','multiDrawArraysInstancedWEBGL','multiDrawElementsInstancedWEBGL'])wrap(extension,name,true);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const quantile=(values,q)=>values.length?[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*q))]:null;
  try{
    await wait(700);frames.length=0;
    const start=performance.now();
    for(let i=0;i<24;i++){
      const name=i%2?'Zoom out':'Zoom in';
      const button=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name&&!b.disabled);
      if(!button)throw Error('Missing zoom action');
      pendingInput=performance.now();button.click();await wait(90);
    }
    await wait(700);const measured=frames.splice(0),elapsed=performance.now()-start;
    await wait(700);const idleFrames=frames.length;
    return {
      name:options.name,url:location.pathname,viewport:[innerWidth,innerHeight],canvas:[canvas.width,canvas.height],
      userAgent:navigator.userAgent,gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'unavailable',multiDrawAvailable:!!extension,
      activeSystems:[...document.querySelectorAll('[role="switch"][aria-checked="true"]')].map(x=>x.getAttribute('aria-label')),
      actions:24,observedActions:latencies.length,renderedFrames:measured.length,elapsedMs:elapsed,
      nativeSubmissionCallsMedian:quantile(measured.map(f=>f.calls),.5),logicalSubdrawsMedian:quantile(measured.map(f=>f.subdraws),.5),
      multiDrawCallsMedian:quantile(measured.map(f=>f.multidraw),.5),
      submissionSpanMedianMs:quantile(measured.map(f=>f.last-f.first),.5),submissionSpanP95Ms:quantile(measured.map(f=>f.last-f.first),.95),
      clickToFirstSubmissionMedianMs:quantile(latencies,.5),clickToFirstSubmissionP95Ms:quantile(latencies,.95),
      idleWindowMs:700,idleRenderedFrames:idleFrames,heapUsedBytes:performance.memory?.usedJSHeapSize??null,
      notes:'Instrumented local development renderer. Native submissions, not GPU-completion time or FPS. Timed synthetic button activations, not INP. Heap excludes driver/GPU memory. No network load comparison.'
    };
  }finally{active=false;cancelAnimationFrame(raf);for(const [object,name,fn]of originals)object[name]=fn;}
}
