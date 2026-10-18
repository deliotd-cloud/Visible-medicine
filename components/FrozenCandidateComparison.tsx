'use client';

import {useEffect,useState} from 'react';
import type {ClinicalReviewCandidate,PersonalReviewCandidate} from '../lib/clinical-review-candidate';
import type {BodyReviewMaterial} from '../atlas-review/lib/body-review-material';
import {validateFrozenComparisonPair} from '../lib/frozen-candidate-comparison';
import {decodeFrozenWorksheet} from '../lib/frozen-candidate-worksheet';
import './frozen-candidate-comparison.css';

type Pair={current:PersonalReviewCandidate;previous:ClinicalReviewCandidate};
type Saved={earlier:BodyReviewMaterial;current:BodyReviewMaterial;earlierQuery:string;currentQuery:string;inputCurrent:ClinicalReviewCandidate;inputPrevious:ClinicalReviewCandidate};
const limit=2*1024*1024;
const unavailable='Saved comparison unavailable. Both saved worksheets must be accessible and verify together.';
const safeReference=(value:string)=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}};
const canonical=(value:unknown):string=>{
  if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number')return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical((value as Record<string,unknown>)[key])}`).join(',')}}`;
  throw Error('Invalid saved comparison value');
};
const change=(earlier:unknown,current:unknown)=>earlier===undefined||current===undefined?'Changed':canonical(earlier)===canonical(current)?'Unchanged':'Changed';
const hex=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes))),b=>b.toString(16).padStart(2,'0')).join('');
const fileFor=(candidate:ClinicalReviewCandidate,path:string)=>candidate.files.find(file=>file.path===path);
const asset=(candidate:ClinicalReviewCandidate,path:string)=>`/api/atlas-review/candidates/${candidate.id}/assets/${path}`;

async function exactWorksheet(candidate:ClinicalReviewCandidate,signal:AbortSignal){
  const file=fileFor(candidate,'worksheet.json');
  if(!file||file.bytes>limit)throw Error('Saved worksheet unavailable');
  const response=await fetch(asset(candidate,'worksheet.json'),{credentials:'same-origin',cache:'no-store',signal});
  if(!response.ok||!response.body)throw Error('Saved worksheet unavailable');
  const length=response.headers.get('content-length');
  if(length!==null&&(!/^\d+$/.test(length)||Number(length)>limit||Number(length)!==file.bytes))throw Error('Saved worksheet unavailable');
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
  try{for(;;){const next=await reader.read();if(next.done)break;if(signal.aborted)throw Error('Cancelled');
    size+=next.value.byteLength;if(size>limit||size>file.bytes)throw Error('Saved worksheet unavailable');chunks.push(next.value);}}
  finally{reader.releaseLock();}
  if(size!==file.bytes)throw Error('Saved worksheet unavailable');
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  if(await hex(bytes)!==file.sha256)throw Error('Saved worksheet unavailable');
  return decodeFrozenWorksheet(candidate,bytes);
}

function References({urls}:{urls:string[]}){return urls.length?<ul className="frozen-comparison-references">{urls.map((url,i)=><li key={`${i}:${url}`}>{safeReference(url)?<a href={url} target="_blank" rel="noopener noreferrer">Reference {i+1} ↗</a>:<span>Reference unavailable</span>}</li>)}</ul>:null;}
function Lines({label,values}:{label:string;values:readonly string[]}){return values.length?<div><strong>{label}</strong><ul>{values.map((value,i)=><li key={i}>{value}</li>)}</ul></div>:null;}
function Field({label,value}:{label:string;value:unknown}){return value===null||value===undefined||value===''?null:<p><strong>{label}:</strong> {String(value)}</p>;}
function Content({material,other,topicTabs}:{material:BodyReviewMaterial;other:BodyReviewMaterial;topicTabs:readonly string[]}){
  const structure=material.source.structure;
  return <div className="frozen-comparison-content">
    <section><h4>Source and limits</h4><Field label="Structure" value={structure.name}/><Field label="FMA" value={structure.fmaId}/><Field label="Region" value={structure.region}/><Field label="Laterality" value={structure.laterality}/><Field label="Coverage" value={structure.coverageNote}/>
      <Field label="Credit" value={material.source.credit}/><Field label="Licence" value={material.source.licence}/><Field label="Source version" value={material.source.sourceVersion}/>
      <details><summary>Source parts and limits</summary><ul>{structure.sources.map((part,i)=><li key={i}><pre>{JSON.stringify(part,null,2)}</pre></li>)}</ul><Lines label="Limits" values={material.limits}/></details>
    </section>
    <section><h4>Teaching topics</h4>{topicTabs.length?topicTabs.map(tab=>{const topic=material.topics.find(item=>item.tab===tab);return topic?<details key={tab}><summary>{topic.tab} · {topic.readiness} · {topic.title} · {change(other.topics.find(item=>item.tab===tab),topic)}</summary>
      <Field label="Title" value={topic.title}/><Field label="Body" value={topic.body}/><Lines label="Bullets" values={topic.bullets??[]}/><Field label="Answer" value={topic.correctAnswer}/><Field label="Explanation" value={topic.explanation}/><Field label="Note" value={topic.note}/><References urls={topic.citations??[]}/>
      {topic.additionalChecks?.map((check,j)=><section key={`${check.key}:${j}`}><h5>Additional check · {check.key}</h5><Field label="Body" value={check.body}/><Lines label="Bullets" values={check.bullets}/><Field label="Answer" value={check.correctAnswer}/><Field label="Explanation" value={check.explanation}/><Field label="Note" value={check.note}/><References urls={check.citations}/></section>)}
    </details>:<p key={tab}>{tab} · Not present in this saved worksheet.</p>}):<p>No changed teaching topics. Turn off the filter to inspect all saved topics.</p>}</section>
    <section><h4>Guided tours · {change(other.guidedTours,material.guidedTours)}</h4>{material.guidedTours.length?material.guidedTours.map((item,i)=><details key={`${item.tour.id}:${i}`}><summary>{item.tour.title} · {change(other.guidedTours.find(entry=>entry.tour.id===item.tour.id),item)}</summary><Field label="Description" value={item.tour.description}/><Field label="Limitations" value={item.limitations}/><Field label="Tour ID" value={item.tour.id}/><ol>{item.tour.steps.map(step=><li key={step.id}><h5>{step.title}</h5><Field label="Caption" value={step.caption}/><Field label="View" value={step.view}/><Field label="Duration (ms)" value={step.durationMs}/><References urls={step.references}/></li>)}</ol><details><summary>Tour context and frames</summary><pre>{JSON.stringify(item.tour,null,2)}</pre><pre>{JSON.stringify({structures:item.structures,bundles:item.bundles,frame:item.frame,stepFrames:item.stepFrames,coordinateSystem:item.coordinateSystem,continuousPlayback:item.continuousPlayback},null,2)}</pre></details></details>):<p>No guided tour in this saved worksheet.</p>}</section>
    <section><h4>Interactive reasoning · {change(other.reasoning,material.reasoning)}</h4>{material.reasoning?<details><summary>{material.reasoning.prompt}</summary><Field label="Prompt" value={material.reasoning.prompt}/><ul>{material.reasoning.choices.map(choice=><li key={choice.id}>{choice.id}: {choice.name} · {choice.laterality}{choice.id===material.reasoning?.answerId?' · saved draft answer':''}</li>)}</ul><Field label="Answer ID" value={material.reasoning.answerId}/><Field label="Explanation" value={material.reasoning.explanation}/><Field label="Scope" value={material.reasoning.scope}/><ul>{material.reasoning.references.map((ref,i)=><li key={`${i}:${ref.url}`}>{ref.title}: {safeReference(ref.url)?<a href={ref.url} target="_blank" rel="noopener noreferrer">Reference ↗</a>:'Reference unavailable'}</li>)}</ul></details>:<p>No eligible question in this saved worksheet.</p>}</section>
    <section><h4>Review checklist in worksheet</h4>{(['geometry','teaching','imaging'] as const).map(track=><Lines key={track} label={track} values={material.checklist[track]}/>)}</section>
  </div>;
}

function IdentityTable({pair,selected,saved}:{pair:Pair;selected:string;saved:Saved}){
  const old=pair.previous.selections.find(s=>s.structureId===selected)!,now=pair.current.selections.find(s=>s.structureId===selected)!;
  const priorReview=pair.previous.decisionMode==='personal-review'?pair.previous.selections.find(s=>s.structureId===selected)?.review:null;
  const worksheetOld=fileFor(pair.previous,'worksheet.json'),worksheetNow=fileFor(pair.current,'worksheet.json');
  const models=(candidate:ClinicalReviewCandidate)=>candidate.files.filter(file=>file.path.startsWith('models/')).map(file=>`${file.path} · ${file.sha256} · ${file.bytes} bytes`).join('\n');
  const rows:[string,string,string,boolean?][]=[
    ['Candidate',pair.previous.id,pair.current.id],['Atlas source revision',pair.previous.atlasRevision,pair.current.atlasRevision],['Review revision',pair.previous.reviewRevision,pair.current.reviewRevision],
    ['Structure',old.structureName,now.structureName],['Region',old.region,now.region],['Source fingerprint',old.sourceHash,now.sourceHash],['Material fingerprint',old.materialHash,now.materialHash],['Teaching fingerprint',old.teachingHash,now.teachingHash],
    ['Worksheet SHA / bytes',`${worksheetOld?.sha256} · ${worksheetOld?.bytes}`,`${worksheetNow?.sha256} · ${worksheetNow?.bytes}`],['Renderer',pair.previous.rendererRevision,pair.current.rendererRevision],
    ['Selected model bundle / SHA / bytes',`${saved.earlier.source.bundle.id} · ${saved.earlier.source.bundle.sha256} · ${saved.earlier.source.bundle.bytes}`,`${saved.current.source.bundle.id} · ${saved.current.source.bundle.sha256} · ${saved.current.source.bundle.bytes}`],
    ['Model inventory',models(pair.previous),models(pair.current)],['Checklist version',priorReview?.checklistVersion??'Unavailable in earlier v1 descriptor',now.review.checklistVersion,!priorReview],
    ['Checklist details',priorReview?JSON.stringify(priorReview,null,2):'Unavailable in earlier v1 descriptor',JSON.stringify(now.review,null,2),!priorReview]
  ];
  return <div className="frozen-comparison-table-wrap"><table><caption>Saved identity for the selected structure</caption><thead><tr><th scope="col">Field</th><th scope="col">Earlier</th><th scope="col">Current</th><th scope="col">Status</th></tr></thead><tbody>{rows.map(([label,before,after,missing])=><tr key={label}><th scope="row">{label}</th><td><code>{before}</code></td><td><code>{after}</code></td><td>{missing?'Unavailable':before===after?'Unchanged':'Changed'}</td></tr>)}</tbody></table></div>;
}

function ChangeOverview({pair,selected,saved}:{pair:Pair;selected:string;saved:Saved}){
  const earlier=pair.previous.selections.find(item=>item.structureId===selected)!,current=pair.current.selections.find(item=>item.structureId===selected)!;
  const oldTopics=new Map(saved.earlier.topics.map(topic=>[topic.tab,topic]));
  const newTopics=new Map(saved.current.topics.map(topic=>[topic.tab,topic]));
  const tabs=[...new Set([...saved.earlier.topics.map(topic=>topic.tab),...saved.current.topics.map(topic=>topic.tab)])];
  const changedTabs=tabs.filter(tab=>change(oldTopics.get(tab),newTopics.get(tab))==='Changed');
  const items=[
    `Source fingerprint: ${earlier.sourceHash===current.sourceHash?'unchanged':'changed'}`,
    `Teaching topics: ${changedTabs.length} of ${tabs.length} changed${changedTabs.length?` (${changedTabs.join(', ')})`:''}`,
    `Guided tours: ${change(saved.earlier.guidedTours,saved.current.guidedTours).toLowerCase()}`,
    `Interactive reasoning: ${change(saved.earlier.reasoning,saved.current.reasoning).toLowerCase()}`,
    `Worksheet checklist: ${change(saved.earlier.checklist,saved.current.checklist).toLowerCase()}`
  ];
  return <section className="frozen-comparison-overview" aria-label="Changes in this structure"><h3>Changes in this structure</h3><p>Differences in the two verified saved worksheets and descriptors. This is not a clinical assessment or approval.</p><ul>{items.map(item=><li key={item}>{item}</li>)}</ul></section>;
}

export function FrozenCandidateComparison({current,previous}:{current:ClinicalReviewCandidate;previous:ClinicalReviewCandidate}){
  const [open,setOpen]=useState(false),[selected,setSelected]=useState(current.selections[0]?.structureId??''),[pair,setPair]=useState<Pair|null>(null),[saved,setSaved]=useState<Saved|null>(null),[status,setStatus]=useState<'closed'|'loading'|'ready'|'unavailable'>('closed'),[changedOnly,setChangedOnly]=useState(true);
  useEffect(()=>{setOpen(false);setSelected(current.selections[0]?.structureId??'');setPair(null);setSaved(null);setStatus('closed');setChangedOnly(true);},[current,previous]);
  useEffect(()=>{
    if(!open){setPair(null);setSaved(null);setStatus('closed');return;}
    let active=true;const controller=new AbortController();setPair(null);setSaved(null);setStatus('loading');
    (async()=>{
      const checked=await validateFrozenComparisonPair(current,previous);
      if(controller.signal.aborted)return;
      const id=selected||checked.current.selections[0]?.structureId;
      if(!id||!checked.current.selections.some(s=>s.structureId===id)||!checked.previous.selections.some(s=>s.structureId===id))throw Error('Unavailable');
      const [oldPacket,newPacket]=await Promise.all([exactWorksheet(checked.previous,controller.signal),exactWorksheet(checked.current,controller.signal)]);
      if(controller.signal.aborted)return;
      const old=oldPacket.selections.find(s=>s.material.structureId===id),now=newPacket.selections.find(s=>s.material.structureId===id);
      if(!old||!now)throw Error('Unavailable');
      if(active){setSelected(id);setPair(checked);setSaved({earlier:old.material,current:now.material,earlierQuery:old.modelQuery,currentQuery:now.modelQuery,inputCurrent:current,inputPrevious:previous});setStatus('ready');}
    })().catch(()=>{controller.abort();if(active){setSaved(null);setPair(null);setStatus('unavailable');}});
    return()=>{active=false;controller.abort();};
  },[current,previous,open,selected]);
  const toggle=()=>{setSaved(null);setPair(null);setStatus('closed');setChangedOnly(true);setOpen(value=>!value);};
  const allTabs=saved?[...new Set([...saved.earlier.topics.map(topic=>topic.tab),...saved.current.topics.map(topic=>topic.tab)])]:[];
  const changedTabs=saved?allTabs.filter(tab=>change(saved.earlier.topics.find(topic=>topic.tab===tab),saved.current.topics.find(topic=>topic.tab===tab))==='Changed'):[];
  const topicTabs=changedOnly?changedTabs:allTabs;
  return <section className="frozen-comparison" aria-label="Saved version comparison"><button type="button" aria-expanded={open} onClick={toggle}>{open?'Close comparison':'Compare changes'}</button>
    {open&&<div><p>This is a read-only comparison of saved material. Its structure selection is independent of the editable review below. No decision or attestation is copied. Open the earlier candidate separately for its prior records.</p>
      {status==='loading'&&<p role="status">Verifying both saved worksheets…</p>}
      {status==='unavailable'&&<p role="alert">{unavailable}</p>}
      {status==='ready'&&pair&&saved&&saved.inputCurrent===current&&saved.inputPrevious===previous&&<><label>Structure <select value={selected} onChange={event=>{setSaved(null);setPair(null);setStatus('loading');setChangedOnly(true);setSelected(event.target.value);}}>{pair.current.selections.map(item=><option key={item.structureId} value={item.structureId}>{item.structureName}</option>)}</select></label>
        <ChangeOverview pair={pair} selected={selected} saved={saved}/>
        <label className="frozen-comparison-filter"><input type="checkbox" checked={changedOnly} onChange={event=>setChangedOnly(event.target.checked)}/> Show changed teaching topics only</label>
        <details className="frozen-comparison-identity"><summary>Exact version details</summary><IdentityTable pair={pair} selected={selected} saved={saved}/></details>
        <div className="frozen-comparison-columns"><article aria-label="Earlier saved material"><h3>Earlier saved version</h3><p><a href={asset(pair.previous,'index.html')} target="_blank" rel="noopener noreferrer">Open earlier saved worksheet and choose this structure there ↗</a> · <a href={`${asset(pair.previous,'viewer/index.html')}?${saved.earlierQuery}`} target="_blank" rel="noopener noreferrer">Open earlier saved model ↗</a></p><Content material={saved.earlier} other={saved.current} topicTabs={topicTabs}/></article>
          <article aria-label="Current saved material"><h3>Current saved version</h3><p><a href={asset(pair.current,'index.html')} target="_blank" rel="noopener noreferrer">Open current saved worksheet and choose this structure there ↗</a> · <a href={`${asset(pair.current,'viewer/index.html')}?${saved.currentQuery}`} target="_blank" rel="noopener noreferrer">Open current saved model ↗</a></p><Content material={saved.current} other={saved.earlier} topicTabs={topicTabs}/></article></div>
      </>}
    </div>}
  </section>;
}
