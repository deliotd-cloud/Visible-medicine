import React from 'react';
import {createRoot} from 'react-dom/client';
import {HeadAtlasSurfaceLoader as Before} from './baseline/components/HeadAtlasSurfaceLoader';
import {HeadAtlasSurfaceLoader as After} from './components/HeadAtlasSurfaceLoader';
const requests:Array<{resolve:(value:any)=>void;reject:(reason:Error)=>void}>=[];
(window as any).__loadSurface=()=>new Promise((resolve,reject)=>requests.push({resolve,reject}));
(window as any).__focusTest={requests,fail(index:number){requests[index].reject(Error('Synthetic unavailable chunk'));},succeed(index:number){requests[index].resolve({HeadAtlasSurface:()=> <button type="button">Synthetic 3D object · no patient data</button>});}};
const Viewer=location.pathname==='/baseline'?Before:After;
createRoot(document.getElementById('root')!).render(<main><h1>Private synthetic 3D import recovery check</h1><button id="scan-controls" type="button">Slice controls</button><section style={{height:420,marginTop:24,border:'1px solid #aaa',padding:16}}><Viewer selected={{entry:{id:'synthetic'}} as any} regionalCourse={false} onPick={()=>{}}/></section><button id="index-controls" type="button">Anatomy index</button></main>);
