async () => {
  const pause=()=>new Promise(r=>setTimeout(r,40));
  const wait=async test=>{for(let i=0;i<100;i++){if(test())return;await pause();}throw Error('UI did not settle');};
  const heading=()=>document.querySelector('.head-selected-summary h2')?.textContent;
  const choose=label=>{const b=[...document.querySelectorAll('[data-head-index-entry]')].find(x=>x.textContent.startsWith(label));if(!b)throw Error('Missing '+label);b.click();};
  const click=label=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===label);if(!b)throw Error('Missing '+label);b.click();};
  const snapshot=()=>({heading:heading(),id:document.querySelector('.head-structure-id')?.textContent,
    href:location.pathname+location.search,history:history.state,
    layout:[...document.querySelectorAll('[aria-label="Image layout"] button')].find(x=>x.getAttribute('aria-pressed')==='true')?.textContent,
    slices:[...document.querySelectorAll('input[type=range][aria-label$=" slice"]')].map(x=>({label:x.getAttribute('aria-label'),value:x.value})),
    level:document.querySelector('input[aria-label$="level" i]')?.value,width:document.querySelector('input[aria-label$="width" i]')?.value,
    errors:window.qaErrors||[]});
  await wait(()=>document.querySelectorAll('[data-head-index-entry]').length>=2);
  choose('Unmapped synthetic structure');await wait(()=>heading()==='Unmapped synthetic structure');
  click('Coronal');await pause();
  const canvas=document.querySelector('canvas[role=img]');if(!canvas)throw Error('No real scan canvas');
  canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true}));
  if(location.pathname.includes('ct-head'))click('Bone window');
  await pause();const initial=snapshot();
  choose('Pons');await wait(()=>heading()==='Pons'&&location.search.includes('concept=brainstem-pons'));
  const mapped=snapshot();history.back();await wait(()=>!location.search.includes('concept='));await new Promise(r=>setTimeout(r,250));
  const back=snapshot();history.forward();await wait(()=>location.search.includes('concept=brainstem-pons')&&heading()==='Pons');
  const forward=snapshot();click('Clear selection');await wait(()=>heading()==='Choose a structure'&&!location.search.includes('concept='));
  const cleared=snapshot();history.back();await wait(()=>heading()==='Pons');history.forward();await wait(()=>!location.search.includes('concept='));await new Promise(r=>setTimeout(r,250));
  return {synthetic:true,actualReactViewer:true,initial,mapped,back,forward,cleared,clearForward:snapshot()};
}
