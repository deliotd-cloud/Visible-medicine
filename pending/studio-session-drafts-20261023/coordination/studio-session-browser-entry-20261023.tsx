import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CreateCourseForm} from '__STUDIO_FORMS__';
const scope={actorId:'edu:synthetic-session-author',organizationId:'org-synthetic-session'};
Object.defineProperty(window,'localStorage',{configurable:true,get(){throw Error('Synthetic blocked device storage');}});
window.confirm=()=>!!document.querySelector<HTMLInputElement>('#fixture-confirm')?.checked;
globalThis.fetch=async(_input,options)=>{
  if(options?.method!=='GET')return Response.json({error:'This fixture never saves courses.'},{status:403});
  const expected=JSON.parse(new Headers(options.headers).get('X-Studio-Mutation-Context')??'null');
  return Response.json(expected?.actorId===scope.actorId&&expected?.organizationId===scope.organizationId?{ok:true,action:'verify-studio-mutation-context'}:{error:'Synthetic scope mismatch',code:'STUDIO_CONTEXT_CHANGED'});
};
function Fixture(){
  const [path,setPath]=useState(location.pathname);
  useEffect(()=>{const restore=()=>setPath(location.pathname);window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);},[]);
  return <>
    <header className="fixture-header"><h1>Synthetic Studio recovery fixture</h1>
      <p>Blocked device storage · no sign-in, real Studio service, patient data, saved course or permission grant.</p>
      <label><input id="fixture-confirm" type="checkbox"/> Answer the synthetic recovery confirmation “Continue”</label>
      <p>This confirmation is controlled by the fixture, not a real browser dialog. Use browser Back and Forward to unmount and remount the actual form.</p>
    </header>
    <main>{path==='/studio/courses/new'?<><h2>Draft course editor</h2><CreateCourseForm recoveryScope={scope}/></>:<><h2>Fixture workspace</h2><button onClick={()=>{history.pushState({},'','/studio/courses/new');setPath(location.pathname);}}>Open draft editor</button></>}</main>
  </>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
