import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {FractureCaseResponse} from '../../components/FractureCaseResponse';

type Case = {id:string; sourceLabel:string; region?:string; reviewLimitations?:string; groupingEvidence?:string; images:{url:string;view:string;laterality:string}[]};
type Note = {disposition:'pending'|'include'|'exclude';fracture:'pending'|'yes'|'no';boneAnswers:string;visualClear:boolean;privacyChecked:boolean;reuseChecked:boolean;groupingChecked:boolean;notes:string};
const empty = ():Note=>({disposition:'pending',fracture:'pending',boneAnswers:'',visualClear:false,privacyChecked:false,reuseChecked:false,groupingChecked:false,notes:''});
const data=JSON.parse(document.getElementById('batch-data')!.textContent!) as {revision:string;cases:Case[];reviewGroup?:number|null};

function App(){
  const [index,setIndex]=useState(0),[notes,setNotes]=useState<Record<string,Note>>({}),[responses,setResponses]=useState<Record<string,string>>({});
  const [dirty,setDirty]=useState(false),[message,setMessage]=useState(''),[trial,setTrial]=useState(false);
  const c=data.cases[index],note=notes[c.id]||empty();
  const update=(patch:Partial<Note>)=>{setNotes(n=>({...n,[c.id]:{...note,...patch}}));setDirty(true);setTrial(false);};
  useEffect(()=>{const prevent=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',prevent);return()=>window.removeEventListener('beforeunload',prevent);},[dirty]);
  function save(){
    const content={schema:'vm-fracture-review-notes-v2',batchRevision:data.revision,releaseApproval:false,cases:data.cases.map(c=>({caseId:c.id,...(notes[c.id]||empty())}))};
    const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`fracture-review-${data.reviewGroup||'batch'}-${data.revision.slice(0,8)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setDirty(false);setMessage('Notes exported. Keep the downloaded file in this private batch folder.');
  }
  async function restore(file?:File){
    if(!file)return;
    try{
      if(file.size>1024*1024)throw Error();
      const parsed=JSON.parse(await file.text());
      if(parsed.schema!=='vm-fracture-review-notes-v2'||parsed.batchRevision!==data.revision||parsed.releaseApproval!==false||!Array.isArray(parsed.cases)||parsed.cases.length!==data.cases.length)throw Error();
      const incoming:Record<string,Note>={};
      for(const row of parsed.cases){
        if(!data.cases.some(c=>c.id===row.caseId)||incoming[row.caseId]||Object.keys(row).sort().join(',')!=='boneAnswers,caseId,disposition,fracture,groupingChecked,notes,privacyChecked,reuseChecked,visualClear'||!['pending','include','exclude'].includes(row.disposition)||!['pending','yes','no'].includes(row.fracture)||typeof row.boneAnswers!=='string'||row.boneAnswers.length>8000||typeof row.notes!=='string'||row.notes.length>8000||['visualClear','privacyChecked','reuseChecked','groupingChecked'].some(k=>typeof row[k]!=='boolean'))throw Error();
        const {caseId,...n}=row;incoming[caseId]=n;
      }
      setNotes(incoming);setDirty(true);setTrial(false);setMessage('Notes restored for this exact batch. Export again after editing.');
    }catch{setMessage('Cannot restore: use intact notes exported for this exact batch.');}
  }
  const boneAnswers=note.boneAnswers.split('\n').map(s=>s.trim()).filter(Boolean);
  const canTry=note.fracture!=='pending'&&(note.fracture==='no'||boneAnswers.length>0);
  return <main><header><h1>Fracture case review{data.reviewGroup?` · Group ${data.reviewGroup}`:''}</h1><p>{data.cases.length} candidate cases · Local only · 50 cases / 100 marks per future paper</p>
    <p>Check all views. Exclude casts, surgery and uncertain fracture status. Source labels and these notes are not release approval.</p>
    <button onClick={save}>Export review notes</button> <label>Restore notes <input type="file" accept=".json" onChange={e=>void restore(e.target.files?.[0])}/></label>
    <p role="status">{message || (dirty?'Unsaved notes — export before closing.':'Notes stay in this tab until exported.')}</p></header>
    <nav aria-label="Review cases">{data.cases.map((item,i)=><button key={item.id} aria-current={i===index?'true':undefined} onClick={()=>{setIndex(i);setTrial(false);}}>{i+1} · {(notes[item.id]||empty()).disposition}</button>)}</nav>
    <div className="review-grid"><section aria-label="Case images"><h2>Case {index+1} · {c.region}</h2><p>{c.reviewLimitations}</p>{c.images.map((im,i)=><figure key={i}><a href={im.url} target="_blank" rel="noreferrer"><img src={im.url} alt={`Case ${index+1}, view ${i+1}`} /></a><figcaption>{im.laterality} · {im.view} · Open image at full resolution</figcaption></figure>)}</section>
    <aside><FractureCaseResponse id={c.id} index={index} response={responses[c.id]||''} answerKey={{status:trial?'reviewed':'pending',fracturePresent:note.fracture==='pending'?null:note.fracture==='yes',acceptedBoneAnswers:boneAnswers}} editable onChange={(id,value)=>setResponses(r=>({...r,[id]:value}))}/>
      <section className="review-key"><h2>Radiologist worksheet</h2><p>Source label: <strong>{c.sourceLabel}</strong> (unverified)</p><p>{c.groupingEvidence}</p>
        <label>Case decision<select value={note.disposition} onChange={e=>update({disposition:e.target.value as Note['disposition']})}><option value="pending">Pending</option><option value="include">Candidate for inclusion</option><option value="exclude">Exclude</option></select></label>
        <label>Fracture on your review<select value={note.fracture} onChange={e=>update({fracture:e.target.value as Note['fracture']})}><option value="pending">Unresolved</option><option value="yes">Yes</option><option value="no">No</option></select></label>
        {note.fracture==='yes'&&<label>Accepted complete bone answers — one alternative per line<textarea value={note.boneAnswers} maxLength={8000} onChange={e=>update({boneAnswers:e.target.value})}/><small>For multiple bones, write every required bone in each accepted answer. No answers are inferred.</small></label>}
        <label><input type="checkbox" checked={note.visualClear} onChange={e=>update({visualClear:e.target.checked})}/>All views checked: no cast, surgical hardware or other obvious surgery</label>
        <label><input type="checkbox" checked={note.groupingChecked} onChange={e=>update({groupingChecked:e.target.checked})}/>Patient/study linkage, companion views and duplicate-case checks resolved</label>
        <label><input type="checkbox" checked={note.privacyChecked} onChange={e=>update({privacyChecked:e.target.checked})}/>Image and metadata privacy check completed</label>
        <label><input type="checkbox" checked={note.reuseChecked} onChange={e=>update({reuseChecked:e.target.checked})}/>Case reuse and attribution checked</label>
        <label>Corrections / exclusion reason<textarea value={note.notes} maxLength={8000} onChange={e=>update({notes:e.target.value})}/></label>
        <button disabled={!canTry} aria-pressed={trial} onClick={()=>setTrial(v=>!v)}>Try this draft key</button><p>Scoring preview only. This does not approve or upload this case.</p>
      </section></aside></div>
    <footer><button disabled={index===0} onClick={()=>{setIndex(i=>i-1);setTrial(false);}}>Previous case</button><button disabled={index===data.cases.length-1} onClick={()=>{setIndex(i=>i+1);setTrial(false);}}>Next case</button></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
