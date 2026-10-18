import {createElement} from 'react';

export type LearningResourceState = 'draft' | 'reviewed' | 'unavailable' | 'locked';
const states = {
  draft: {label:'Draft',detail:'Awaiting review of this exact content revision.'},
  reviewed: {label:'Reviewed',detail:'Review applies only to the exact content revision named by its record.'},
  unavailable: {label:'Unavailable',detail:'No supported resource or exact mapping is available here.'},
  locked: {label:'Locked',detail:'Your current access does not include this resource. Atlas access does not unlock paid lectures or cases.'},
} satisfies Record<LearningResourceState,{label:string;detail:string}>;

/** Presentation only. Callers obtain review/access state from its authority;
 * this badge never checks, grants or records approval or entitlement. */
export function LearningResourceStatus({status}:{status:LearningResourceState}) {
  const known=Object.hasOwn(states,status),state=known?states[status]:states.unavailable;
  return createElement('span',{className:'learning-resource-status','data-state':known?status:'unavailable',title:state.detail},state.label);
}

export function LearningStatusKey() {
  return createElement('details',{className:'learning-status-key'},
    createElement('summary',null,'What do the labels mean?'),
    createElement('ul',null,Object.entries(states).map(([status,state])=>createElement('li',{key:status},
      createElement(LearningResourceStatus,{status:status as LearningResourceState}),' ',state.detail))),
    createElement('p',null,'Availability, clinical review and subscription access are separate. A working link is not approval. Missing or unchecked access is not labelled Locked.'));
}
