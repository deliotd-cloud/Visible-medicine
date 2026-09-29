// Evaluate in a same-origin website Atlas iframe using browser tooling.
// These DOM probes verify recipe/count/history wiring, not clinical or GPU truth.
export const historyProbe=async () => {
 const pause=()=>new Promise(r=>setTimeout(r,150));let d;
 for(let i=0;i<80;i++){d=document.querySelector('iframe')?.contentDocument;if(d?.querySelector('canvas')&&d.querySelector('input[value="dissect"]'))break;await pause();}
 d.querySelector('input[value="dissect"]').closest('label').click(); await pause();
 const buttons=()=>[...d.querySelectorAll('button')];
 const read=()=>({recipe:d.querySelector('.dissection-current-view')?.textContent,stage:d.querySelector('[aria-label="Choose dissection stage"]')?.textContent,undoDisabled:d.querySelector('[aria-label="Undo last dissection change"]')?.disabled,redoDisabled:d.querySelector('[aria-label="Redo last undone dissection change"]')?.disabled});
 const initial=read(); const next=d.querySelector('[aria-label="Next dissection stage"]');
 if(!next||next.disabled)return {initial,layers:false,text:d.body.innerText.slice(-3000)};
 const layers=buttons().filter(e=>e.getAttribute('aria-label')?.startsWith('Stage ')).map(e=>({name:e.getAttribute('aria-label'),text:e.textContent}));
 next.click();await pause();const advanced=read();
 d.querySelector('[aria-label="Undo last dissection change"]').click();await pause();const undone=read();
 d.querySelector('[aria-label="Redo last undone dissection change"]').click();await pause();const redone=read();
 buttons().find(e=>e.textContent.trim()==='Reassemble').click();await pause();const reset=read();
 return {layers,initial,advanced,undone,redone,reset,undoRestored:initial.recipe===undone.recipe,redoRestored:advanced.recipe===redone.recipe,reassembled:initial.recipe===reset.recipe,advancedChanged:initial.recipe!==advanced.recipe,frameOverflow:d.documentElement.scrollWidth>document.querySelector('iframe').contentWindow.innerWidth,alerts:[...d.querySelectorAll('[role=alert]')].filter(e=>e.getClientRects().length).map(e=>e.textContent)};
};
export const layerProbe=async () => {
 const pause=()=>new Promise(r=>setTimeout(r,150));let d;
 for(let i=0;i<80;i++){d=document.querySelector('iframe')?.contentDocument;if(d?.querySelector('canvas')&&d.querySelector('input[value="dissect"]'))break;await pause();}
 d.querySelector('input[value="dissect"]').closest('label').click();await pause();
 const stages=[...d.querySelectorAll('[aria-label^="Stage "]')].map(e=>({label:e.getAttribute('aria-label'),expected:Number(e.querySelector('small').textContent.match(/\d+/)[0])}));
 const read=()=>{const s=[...d.querySelectorAll('summary')].find(e=>e.textContent.startsWith('What is in this view?'));return {enabled:Number(s?.textContent.match(/(\d+) enabled/)[1]),recipe:d.querySelector('.dissection-current-view')?.textContent,removed:d.querySelector('.dissection-removed summary')?.textContent,loading:d.body.innerText.match(/Loading[^\n]*/g)};};
 const observations=[];
 for(const stage of stages){d.querySelector('[aria-label="'+stage.label+'"]').click();await pause();observations.push({...stage,...read()});}
 const last=read();d.querySelector('[aria-label="Undo last dissection change"]').click();await pause();const undo=read();
 d.querySelector('[aria-label="Redo last undone dissection change"]').click();await pause();const redo=read();
 [...d.querySelectorAll('button')].find(e=>e.textContent.trim()==='Reassemble').click();await pause();const reset=read();
 return {observations,last,undo,redo,reset,allCountsMatch:observations.every(s=>s.expected===s.enabled),redoRestored:last.enabled===redo.enabled&&last.recipe===redo.recipe,reassembled:reset.enabled===stages[0].expected};
};
// Open whole-body Dissect > Study windows & focuses before evaluating.
export const wholeBodyStudyProbe=async () => {
const d=document.querySelector('iframe').contentDocument,pause=()=>new Promise(r=>setTimeout(r,160));
const cards=[...d.querySelectorAll('.study-library-summary')].map(e=>({title:e.querySelector('strong').textContent,expected:Number(e.querySelector('small').textContent.match(/(\d+) retained/)[1])}));
const observations=[];
for(const card of cards){
 const trigger=[...d.querySelectorAll('button')].find(e=>e.textContent.includes('Study windows & focuses'));
 if(trigger.getAttribute('aria-pressed')!=='true'){trigger.click();await pause();}
 const summary=[...d.querySelectorAll('.study-library-summary')].find(e=>e.querySelector('strong').textContent===card.title);
 if(summary.getAttribute('aria-expanded')!=='true'){summary.click();await pause();}
 const open=summary.closest('li').querySelector('.study-library-actions button');if(!open||open.disabled)throw Error('Cannot open '+card.title);
 open.click();await pause();
 const text=[...d.querySelectorAll('summary')].find(e=>e.textContent.startsWith('What is in this view?')).textContent;
 observations.push({...card,enabled:Number(text.match(/(\d+) enabled/)[1]),recipe:d.querySelector('.dissection-current-view').textContent});
}
return {viewport:[innerWidth,innerHeight],observations,allCountsMatch:observations.every(c=>c.expected===c.enabled)};
};
