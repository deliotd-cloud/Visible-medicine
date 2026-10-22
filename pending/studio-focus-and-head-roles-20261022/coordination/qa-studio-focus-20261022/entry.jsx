// Synthetic local specimen only. This is not an authenticated website route.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {StudioCourseEditor} from 'vm-studio-editor';
import './scope.css';
window.fetch=async()=>{throw Error('No network or storage in the synthetic Studio specimen');};
function App(){
 const [actor,setActor]=useState('edu:synthetic-author');
 return <><aside className="qa-banner">SYNTHETIC KEYBOARD TEST · No real courses, sign-in, storage or mutations. Normal website unchanged.
  <div><button type="button" onClick={()=>window.dispatchEvent(new Event('qa-recovery'))}>Test passive recovery notice</button>
   <button type="button" onClick={()=>setActor(actor==='edu:synthetic-author'?'edu:other-synthetic-author':'edu:synthetic-author')}>Test account boundary</button></div></aside>
  <main><h1>Course editor · isolated focus check</h1><StudioCourseEditor course={{id:'synthetic-course',title:'Synthetic saved course'}} workbooks={[]} releases={[]} recoveryScope={{actorId:actor,organizationId:'org:synthetic'}}/></main></>;
}
createRoot(document.getElementById('app')).render(<App/>);
