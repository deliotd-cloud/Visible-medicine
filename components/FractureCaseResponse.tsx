'use client';

import { decodeFractureResponse, scoreFracture, type FractureKey } from '../lib/fracture-scoring.mjs';

/** Same controlled response in Didanix and the private offline review sheet. */
export function FractureCaseResponse({id, index, response, answerKey, editable, onChange}: {
  id:string; index:number; response:string; answerKey:FractureKey; editable:boolean;
  onChange:(id:string,value:string)=>void;
}) {
  const value=decodeFractureResponse(response), score=scoreFracture(answerKey,value);
  const change=(patch:Partial<typeof value>)=>onChange(id,JSON.stringify({...value,...patch}));
  return <section className="case-question">
    <h2>Question {index+1} <small>2 marks</small></h2>
    <fieldset disabled={!editable || value.submitted} style={{border:0,padding:0,margin:0}}>
      <legend>Is there a fracture?</legend>
      <div style={{display:'flex',gap:12,margin:'12px 0'}}>{(['yes','no'] as const).map(choice =>
        <button type="button" key={choice} aria-pressed={value.choice===choice} className={value.choice===choice?'primary-button':'secondary-button'}
          onClick={()=>change({choice,bone:choice==='no'?'':value.bone})}>{choice==='yes'?'Yes':'No'}</button>)}</div>
      {value.choice==='yes' && <><label htmlFor={`fracture-bone-${id}`}>What bone is fractured?</label>
        <input id={`fracture-bone-${id}`} value={value.bone} maxLength={300} autoComplete="off" style={{width:'100%',boxSizing:'border-box',font:'inherit',padding:12,margin:'8px 0'}} onChange={e=>change({bone:e.target.value})}/></>}
    </fieldset>
    {!value.submitted ? <button type="button" className="primary-button" disabled={!editable || !value.choice} onClick={()=>change({submitted:true})}>Submit answer</button> :
      <p role="status">{score.status==='pending-key'?'Answer submitted. Marking awaits a reviewed answer key.':`Scoring preview: ${score.marks}/2`}</p>}
    {value.submitted && <button type="button" className="secondary-button" disabled={!editable} onClick={()=>onChange(id,JSON.stringify({choice:null,bone:'',submitted:false}))}>Reset review attempt</button>}
    <p><small>Private scoring preview. Full papers: 50 cases · 100 marks.</small></p>
  </section>;
}
