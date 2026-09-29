'use client';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import './tour-step-picker.css';

type Props={steps:readonly {id:string;title:string}[];index:number;ready:boolean;onPause:()=>void;onStep:(index:number)=>void};

/** Navigation only: it never marks an unvisited stop as learned or approved. */
export function TourStepPicker({steps,index,ready,onPause,onStep}:Props){
  const selected=steps[index];
  if(!selected)return null;
  return <Select key={ready?'ready':'unavailable'} value={selected.id} disabled={!ready}
    onOpenChange={open=>{if(open&&ready)onPause();}}
    onValueChange={value=>{
      if(!ready||typeof value!=='string')return;
      const next=steps.findIndex(step=>step.id===value);
      if(next<0||next===index)return;
      onPause();onStep(next);
    }}>
    <SelectTrigger className="tour-step-trigger" aria-label="Go to tour step">
      <SelectValue>Step {index+1} of {steps.length}</SelectValue>
    </SelectTrigger>
    <SelectContent className="tour-step-options" align="end" alignItemWithTrigger={false}>
      {steps.map((step,i)=><SelectItem key={step.id} value={step.id}>{i+1}. {step.title}</SelectItem>)}
    </SelectContent>
  </Select>;
}
