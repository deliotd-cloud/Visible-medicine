async () => {
 const wait=async p=>{const t=performance.now();while(!p()){if(performance.now()-t>6000)throw Error('Recovery timeout');await new Promise(r=>setTimeout(r,10));}return performance.now()-t;};
 let heldExtension=null;const lose=()=>{heldExtension=window.surfaceFixture.lossExtension();if(!heldExtension)throw Error('Loss extension unavailable');heldExtension.loseContext();};
 const frame=()=>document.querySelector('.head-surface-renderer'),ready=()=>frame()?.getAttribute('aria-busy')==='false'&&!document.querySelector('[role=alert]'),button=()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Retry 3D scan view'),fixture=()=>window.surfaceFixture,canvas=()=>fixture().canvas(),outside=document.getElementById('independent-control'),checks=[];
 const check=(name,passing,details)=>{checks.push({name,passing,details});if(!passing)throw Error(name);};
 await wait(ready);const gl=canvas().getContext('webgl2'),debug=gl.getExtension('WEBGL_debug_renderer_info'),environment={gpu:debug&&gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,viewport:{width:innerWidth,height:innerHeight,devicePixelRatio:devicePixelRatio}};
 outside.value='independent state 42';outside.focus();let old=canvas();lose();const lossMs=await wait(()=>button());
 check('Real WebGL loss shows notice without changing independent control or selected identity',document.activeElement===outside&&outside.value==='independent state 42'&&fixture().selectedId()==='A'&&fixture().pickCount()===0,{lossMs});
 check('Camera controls disable while the GPU context is lost',Array.from(document.querySelectorAll('.head-surface-navigation button')).every(b=>b.disabled));
 button().focus();button().click();outside.focus();const retryMs=await wait(()=>canvas()!==old&&ready());await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 check('Retry preserves a later focus choice while creating a usable replacement canvas',document.activeElement===outside&&outside.value==='independent state 42'&&fixture().selectedId()==='A'&&fixture().pickCount()===0,{retryMs});
 old.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));old.dispatchEvent(new Event('webglcontextrestored'));await new Promise(r=>setTimeout(r,50));
 check('Retired canvas events cannot interrupt the replacement',ready());
 old=canvas();lose();await wait(()=>button());button().focus();const ext=heldExtension;await new Promise(r=>setTimeout(r,80));ext.restoreContext();const autoMs=await wait(ready);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 check('Automatic restoration retains the same canvas and restores displaced notice focus',canvas()===old&&document.activeElement===frame(),{autoMs});
 lose();await wait(()=>button());button().focus();const current=canvas(),late=()=>outside.focus();current.addEventListener('webglcontextrestored',late,{once:true});await new Promise(r=>setTimeout(r,80));heldExtension.restoreContext();await wait(ready);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 check('A later focus choice during automatic restoration is retained',document.activeElement===outside);
 lose();await wait(()=>button());document.getElementById('replace-selection').click();await wait(()=>fixture().selectedId()==='B');old=canvas();button().focus();button().click();await wait(()=>canvas()!==old&&ready());await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 check('Retry retains the latest selected identity and returns displaced notice focus',fixture().selectedId()==='B'&&fixture().pickCount()===0&&document.activeElement===frame());
 lose();await wait(()=>button());old=canvas();document.getElementById('unmount-surface').click();await wait(()=>!frame());old.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));old.dispatchEvent(new Event('webglcontextrestored'));await new Promise(r=>setTimeout(r,30));
 check('Unmount retires notifications without recreating a surface',!frame()&&document.getElementById('mounted-state').textContent==='false');
 document.getElementById('remount-surface').click();await wait(ready);
 check('A new surface remains usable with the retained selection and independent control',fixture().selectedId()==='B'&&fixture().pickCount()===0&&outside.value==='independent state 42');
 window.surfaceRecoveryResult={checks,environment,realReact:true,realWebGL:true,fixture:'synthetic tetrahedron',realScansTested:false,screenReaderSpeechTested:false};
 return window.surfaceRecoveryResult;
}
