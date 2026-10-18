import {useCallback,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {parseBodyReviewResponse} from '../../atlas-review/lib/body-review-response';
import type {BodyReviewMaterial} from '../../atlas-review/lib/body-review-material';
import type {BodyReviewContext} from '../../atlas-review/lib/body-review-decisions';
import {FrozenDecisionEditor} from './decisions';
import './worksheet.css';

type Selection={material:BodyReviewMaterial;context:BodyReviewContext;modelQuery:string};
type Packet={schema:'visible-medicine.frozen-body-inspection/1'|'visible-medicine.frozen-body-inspection/2';decisionMode:'inspection-only'|'personal-review';selections:Selection[]};
const safeReference=(url:string)=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
function References({urls}:{urls:string[]}){return <ul className="references">{urls.map((url,i)=><li key={`${i}:${url}`}>{safeReference(url)?<a href={url} target="_blank" rel="noopener noreferrer">Reference {i+1} ↗</a>:<span>{url}</span>}</li>)}</ul>;}
async function loadPacket():Promise<Packet>{
  const response=await fetch(new URL('./worksheet.json',location.href),{cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw Error('The saved worksheet is unavailable. No current version was substituted.');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>2*1024*1024)throw Error('Saved worksheet exceeds the inspection limit.');
  const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(!data||!(data.schema==='visible-medicine.frozen-body-inspection/1'&&data.decisionMode==='inspection-only'||data.schema==='visible-medicine.frozen-body-inspection/2'&&data.decisionMode==='personal-review')||!Array.isArray(data.selections)||data.selections.length<1||data.selections.length>32)throw Error('Invalid saved inspection.');
  const selections:Selection[]=[];
  for(const item of data.selections){
    const material=await parseBodyReviewResponse(item?.material,item?.context?.structureId);
    const q=new URLSearchParams(item?.modelQuery);
    if(!material||item.context.materialHash!==material.materialHash||q.get('structure')!==material.structureId
      ||q.get('kind')!=='body'||q.get('study')!=='1'||q.get('source')!==material.source.bundle.sha256
      ||typeof item.modelQuery!=='string'||item.modelQuery.length>2048)throw Error('Saved worksheet identity could not be verified.');
    selections.push({material,context:item.context,modelQuery:item.modelQuery});
  }
  return {schema:data.schema,decisionMode:data.decisionMode,selections};
}
function Inspection(){
  const [packet,setPacket]=useState<Packet|null>(null),[error,setError]=useState(''),[selected,setSelected]=useState(0);
  const [dirty,setDirty]=useState(false),onDirty=useCallback((value:boolean)=>setDirty(value),[]);
  const candidateId=/^\/api\/atlas-review\/candidates\/([a-f0-9]{64})\/assets\/index\.html$/.exec(location.pathname)?.[1];
  useEffect(()=>{let active=true;loadPacket().then(value=>{if(active)setPacket(value);}).catch(()=>{if(active)setError('This saved inspection could not be verified. No current worksheet or model was substituted.');});return()=>{active=false;};},[]);
  if(error)return <main><h1>Saved inspection unavailable</h1><p role="alert">{error}</p></main>;
  if(!packet)return <main><p role="status">Verifying the saved worksheet…</p></main>;
  const entry=packet.selections[selected],material=entry.material,s=material.source.structure;
  return <main>
    <header><p className="eyebrow">Visible Medicine · Frozen inspection</p><h1>{s.name}</h1>
      <p>This worksheet, renderer, catalog and model bytes belong to one saved candidate. Later development cannot silently replace them.</p>
      <p className="notice">{packet.decisionMode==='inspection-only'?<><strong>Read-only inspection.</strong> This candidate cannot record decisions or inherit approval.</>:<><strong>Review this saved version.</strong> Records belong to this candidate and your authorized account/institution only. Later candidates start without inherited approval.</>} Imaging registration and publication remain separate and unapproved.</p>
      <label>Saved structures <select value={selected} onChange={e=>{const next=Number(e.target.value);if(next===selected||dirty&&!window.confirm('Leave this structure and discard its unsaved review? Export your draft first if you need to keep it.'))return;setSelected(next);}}>{packet.selections.map((item,i)=><option key={item.material.structureId} value={i}>{item.material.source.structure.name}</option>)}</select></label>
    </header>
    <div className="inspection-grid"><aside><h2>Inspect the saved anatomy</h2><p>Model selection changes inspection only. The worksheet remains on {s.name}.</p>
      <iframe key={entry.modelQuery} title={`${s.name} · frozen anatomy inspection`} src={`./viewer/index.html?${entry.modelQuery}`} allowFullScreen/>
      <a href={`./viewer/index.html?${entry.modelQuery}`} target="_blank" rel="noopener noreferrer">Open saved model larger ↗</a>
    </aside><article aria-label={`${s.name} saved worksheet`}>
      <h2>Teaching & scope</h2><p>{s.fmaId} · {s.laterality} · {s.sources.length} source parts</p>
      {s.coverageNote&&<p className="notice">{s.coverageNote}</p>}
      {material.topics.map(topic=><details key={topic.tab}><summary>{topic.tab==='ultrasound'?'Ultrasound':topic.tab} · {topic.readiness}</summary>
        <h3>{topic.title}</h3><p>{topic.body}</p>{topic.bullets&&<ul>{topic.bullets.map((line,i)=><li key={i}>{line}</li>)}</ul>}
        {topic.correctAnswer&&<p><strong>Draft answer:</strong> {topic.correctAnswer}</p>}{topic.explanation&&<p>{topic.explanation}</p>}
        {topic.additionalChecks?.map(check=><section key={check.key}><h4>{check.key}</h4><p>{check.body}</p><ul>{check.bullets.map(line=><li key={line}>{line}</li>)}</ul><p>{check.correctAnswer}</p><p>{check.explanation}</p><p>{check.note}</p><References urls={check.citations}/></section>)}
        {topic.note&&<p>{topic.note}</p>}<References urls={topic.citations??[]}/>
      </details>)}
      {material.guidedTours.map(item=><details key={item.tour.id}><summary>Guided learning · {item.tour.title} · draft</summary><p>{item.limitations}</p><ol>{item.tour.steps.map(step=><li key={step.id}><h3>{step.title}</h3><p>{step.caption}</p><p>{step.view} · {step.durationMs/1000}s</p><References urls={step.references}/></li>)}</ol></details>)}
      <details><summary>Interactive reasoning · draft</summary>{material.reasoning?<><h3>{material.reasoning.prompt}</h3><ul>{material.reasoning.choices.map(choice=><li key={choice.id}>{choice.name} · {choice.laterality}{choice.id===material.reasoning?.answerId?' · draft correct answer':''}</li>)}</ul><p>{material.reasoning.explanation}</p><p>{material.reasoning.scope}</p><References urls={material.reasoning.references.map(r=>r.url)}/></>:<p>No eligible question for this exact selection.</p>}</details>
      <details><summary>Source, limits & exact worksheet</summary><p>{material.source.credit}</p><p>{material.source.licence} · {material.source.sourceVersion}</p><p>Material <code>{material.materialHash}</code></p><ul>{material.limits.map(limit=><li key={limit}>{limit}</li>)}</ul><p>Complete frozen worksheet and original current-build context below. These hashes are evidence, not an approval of this candidate renderer.</p><pre>{JSON.stringify(entry,null,2)}</pre></details>
      {packet.decisionMode==='personal-review'&&(candidateId?<FrozenDecisionEditor key={`${candidateId}:${material.structureId}`} candidateId={candidateId} id={material.structureId} materialHash={material.materialHash} onDirty={onDirty}/>:<p role="alert">Decision recording is available only through the protected saved-candidate address. No decision has been saved.</p>)}
    </article></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Inspection/>);
